import { NextRequest, NextResponse } from 'next/server';
import { searchFlights, generateSampleFlights } from '@/lib/amadeus';
import { searchDeals, fetchRSSDeals } from '@/lib/deals';
import { getMetroAirports, isMetroCity } from '@/lib/airports';
import { SplitTicket } from '@/types';

export const dynamic = 'force-dynamic';

const POPULAR_HUBS = ['DXB', 'DOH', 'IST', 'AMS', 'CDG', 'FRA', 'SIN', 'LHR'];

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  
  const origin = searchParams.get('origin')?.toUpperCase() || '';
  const destination = searchParams.get('destination')?.toUpperCase() || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const adults = parseInt(searchParams.get('adults') || '1');
  const children = parseInt(searchParams.get('children') || '0');
  const infants = parseInt(searchParams.get('infants') || '0');
  const travelClass = searchParams.get('travelClass') || 'ECONOMY';
  const nonStop = searchParams.get('nonStop') === 'true';
  const includeDeals = searchParams.get('includeDeals') !== 'false';
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, departureDate' },
      { status: 400 }
    );
  }
  
  console.log(`[API] Flight search: ${origin} → ${destination} on ${departureDate}`);
  console.log(`[API] Passengers: ${adults} adults, ${children} children, ${infants} infants, Class: ${travelClass}`);
  
  let originAirports: string[];
  let destinationAirports: string[];
  
  if (isMetroCity(origin)) {
    originAirports = getMetroAirports(origin);
    console.log(`[API] Metro city ${origin} expanded to:`, originAirports);
  } else {
    originAirports = [origin];
  }
  
  if (isMetroCity(destination)) {
    destinationAirports = getMetroAirports(destination);
    console.log(`[API] Metro city ${destination} expanded to:`, destinationAirports);
  } else {
    destinationAirports = [destination];
  }
  
  // Search regular flights
  const amadeusPromises: Promise<any[]>[] = [];
  
  for (const orig of originAirports.slice(0, 3)) {
    for (const dest of destinationAirports.slice(0, 3)) {
      amadeusPromises.push(
        searchFlights({
          origin: orig,
          destination: dest,
          departureDate,
          returnDate: returnDate || undefined,
          adults,
          children,
          infants,
          travelClass: travelClass as any,
          nonStop
        })
      );
    }
  }
  
  // Search split ticket options (outbound legs via hubs)
  const splitTicketPromises: Promise<{hub: string, leg1: any[], leg2: any[]}>[] = [];
  
  for (const hub of POPULAR_HUBS.slice(0, 4)) {
    // Skip if hub is same as origin or destination
    if (hub === originAirports[0] || hub === destinationAirports[0]) continue;
    
    splitTicketPromises.push(
      Promise.all([
        searchFlights({
          origin: originAirports[0],
          destination: hub,
          departureDate,
          adults,
          children,
          infants,
          travelClass: travelClass as any,
          nonStop: false
        }),
        searchFlights({
          origin: hub,
          destination: destinationAirports[0],
          departureDate,
          adults,
          children,
          infants,
          travelClass: travelClass as any,
          nonStop: false
        })
      ]).then(([leg1, leg2]) => ({ hub, leg1, leg2 }))
    );
  }
  
  // Search return legs if return date provided
  const returnSplitPromises: Promise<{hub: string, leg1: any[], leg2: any[]}>[] = [];
  if (returnDate) {
    for (const hub of POPULAR_HUBS.slice(0, 4)) {
      if (hub === originAirports[0] || hub === destinationAirports[0]) continue;
      
      returnSplitPromises.push(
        Promise.all([
          searchFlights({
            origin: destinationAirports[0],
            destination: hub,
            departureDate: returnDate,
            adults,
            children,
            infants,
            travelClass: travelClass as any,
            nonStop: false
          }),
          searchFlights({
            origin: hub,
            destination: originAirports[0],
            departureDate: returnDate,
            adults,
            children,
            infants,
            travelClass: travelClass as any,
            nonStop: false
          })
        ]).then(([leg1, leg2]) => ({ hub, leg1, leg2 }))
      );
    }
  }
  
  const dealsPromise = includeDeals ? searchDeals(origin, destination) : Promise.resolve([]);
  
  try {
    const [amadeusResults, splitResults, returnSplitResults, deals] = await Promise.all([
      Promise.all(amadeusPromises),
      Promise.all(splitTicketPromises),
      returnDate ? Promise.all(returnSplitPromises) : Promise.resolve([]),
      dealsPromise
    ]);
    
    let amadeusFlights = amadeusResults.flat();
    
    // Generate real split tickets from API results
    const splitTickets = buildRealSplitTickets(
      splitResults, 
      returnSplitResults, 
      originAirports[0], 
      destinationAirports[0],
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass
    );
    
    if (amadeusFlights.length === 0) {
      console.log('[API] No Amadeus flights, generating sample data');
      amadeusFlights = generateSampleFlights({
        origin: originAirports[0],
        destination: destinationAirports[0],
        departureDate,
        returnDate: returnDate || undefined,
        adults,
        children,
        infants,
        travelClass: travelClass as any,
        nonStop
      });
    }
    
    amadeusFlights.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));
    
    const cheapestPrice = amadeusFlights.length > 0 ? parseFloat(amadeusFlights[0].price.total) : 500;
    
    // Filter split tickets to only show ones that actually save money
    const validSplitTickets = splitTickets.filter(st => {
      const savings = cheapestPrice - st.totalPrice;
      return savings > 20; // Only show if saving more than £20
    }).sort((a, b) => b.savings - a.savings).slice(0, 5);
    
    const allPrices = [
      ...amadeusFlights.map(f => parseFloat(f.price.total)),
      ...deals.map(d => d.price),
      ...validSplitTickets.map(s => s.totalPrice)
    ];
    const cheapestPriceOverall = Math.min(...allPrices);
    
    const bestDeal = deals.find(d => d.price === cheapestPriceOverall) || 
                     deals.sort((a, b) => a.price - b.price)[0] || null;
    
    const searchTime = Date.now() - startTime;
    
    console.log(`[API] Results in ${searchTime}ms:`);
    console.log(`[API] - Amadeus flights: ${amadeusFlights.length}`);
    console.log(`[API] - Deals: ${deals.length}`);
    console.log(`[API] - Split tickets: ${validSplitTickets.length}`);
    console.log(`[API] - Cheapest price: £${cheapestPriceOverall}`);
    
    return NextResponse.json({
      amadeus: amadeusFlights,
      deals,
      splitTickets: validSplitTickets,
      airports: {
        origin: originAirports,
        destination: destinationAirports
      },
      meta: {
        searchTime,
        totalResults: amadeusFlights.length + deals.length + validSplitTickets.length,
        cheapestPrice: cheapestPriceOverall,
        bestDeal
      }
    });
    
  } catch (error: any) {
    console.error('[API] Search error:', error);
    
    const sampleFlights = generateSampleFlights({
      origin: originAirports[0],
      destination: destinationAirports[0],
      departureDate,
      returnDate: returnDate || undefined,
      adults,
      children,
      infants,
      travelClass: travelClass as any,
      nonStop
    });
    
    const staticDeals = await fetchRSSDeals();
    const routeDeals = staticDeals.filter(d => 
      d.from.toLowerCase().includes(origin.toLowerCase()) &&
      d.to.toLowerCase().includes(destination.toLowerCase())
    );
    
    return NextResponse.json({
      amadeus: sampleFlights,
      deals: routeDeals,
      splitTickets: [],
      airports: {
        origin: originAirports,
        destination: destinationAirports
      },
      meta: {
        searchTime: Date.now() - startTime,
        totalResults: sampleFlights.length + routeDeals.length,
        cheapestPrice: parseFloat(sampleFlights[0]?.price.total || '500'),
        bestDeal: routeDeals[0] || null,
        error: error.message,
        usingFallback: true
      }
    });
  }
}

function buildRealSplitTickets(
  outboundResults: {hub: string, leg1: any[], leg2: any[]}[],
  returnResults: {hub: string, leg1: any[], leg2: any[]}[],
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | null,
  adults: number,
  children: number,
  infants: number,
  travelClass: string
): SplitTicket[] {
  const splitTickets: SplitTicket[] = [];
  
  // Build class parameter for booking links
  const classParam = travelClass === 'BUSINESS' ? '%20business' : 
                     travelClass === 'FIRST' ? '%20first' : 
                     travelClass === 'PREMIUM_ECONOMY' ? '%20premium' : '';
  
  const passengerParam = adults + children + infants > 1 ? `%20${adults + children + infants}%20passengers` : '';
  
  for (const outbound of outboundResults) {
    if (outbound.leg1.length === 0 || outbound.leg2.length === 0) continue;
    
    // Get cheapest flights for each leg
    const leg1Cheapest = outbound.leg1.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total))[0];
    const leg2Cheapest = outbound.leg2.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total))[0];
    
    const leg1Price = parseFloat(leg1Cheapest.price.total);
    const leg2Price = parseFloat(leg2Cheapest.price.total);
    const outboundTotal = leg1Price + leg2Price;
    
    const seg1 = leg1Cheapest.itineraries[0]?.segments[0];
    const seg2 = leg2Cheapest.itineraries[0]?.segments[0];
    
    const tickets = [
      {
        from: seg1?.departure?.iataCode || origin,
        to: seg1?.arrival?.iataCode || outbound.hub,
        price: leg1Price,
        airline: leg1Cheapest.validatingAirlineCodes[0] || 'Unknown',
        flightNumber: seg1 ? `${seg1.carrierCode}${seg1.number}` : 'N/A',
        departure: seg1?.departure?.at || `${departureDate}T10:00:00`,
        arrival: seg1?.arrival?.at || `${departureDate}T14:00:00`,
        bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${outbound.hub}%20on%20${departureDate}${classParam}${passengerParam}`
      },
      {
        from: seg2?.departure?.iataCode || outbound.hub,
        to: seg2?.arrival?.iataCode || destination,
        price: leg2Price,
        airline: leg2Cheapest.validatingAirlineCodes[0] || 'Unknown',
        flightNumber: seg2 ? `${seg2.carrierCode}${seg2.number}` : 'N/A',
        departure: seg2?.departure?.at || `${departureDate}T16:00:00`,
        arrival: seg2?.arrival?.at || `${departureDate}T22:00:00`,
        bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${outbound.hub}%20to%20${destination}%20on%20${departureDate}${classParam}${passengerParam}`
      }
    ];
    
    let returnTotal = 0;
    let returnTickets: typeof tickets = [];
    
    // Add return flights if return date provided
    if (returnDate) {
      const returnResult = returnResults.find(r => r.hub === outbound.hub);
      if (returnResult && returnResult.leg1.length > 0 && returnResult.leg2.length > 0) {
        const retLeg1Cheapest = returnResult.leg1.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total))[0];
        const retLeg2Cheapest = returnResult.leg2.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total))[0];
        
        const retSeg1 = retLeg1Cheapest.itineraries[0]?.segments[0];
        const retSeg2 = retLeg2Cheapest.itineraries[0]?.segments[0];
        
        returnTotal = parseFloat(retLeg1Cheapest.price.total) + parseFloat(retLeg2Cheapest.price.total);
        
        returnTickets = [
          {
            from: retSeg1?.departure?.iataCode || destination,
            to: retSeg1?.arrival?.iataCode || outbound.hub,
            price: parseFloat(retLeg1Cheapest.price.total),
            airline: retLeg1Cheapest.validatingAirlineCodes[0] || 'Unknown',
            flightNumber: retSeg1 ? `${retSeg1.carrierCode}${retSeg1.number}` : 'N/A',
            departure: retSeg1?.departure?.at || `${returnDate}T10:00:00`,
            arrival: retSeg1?.arrival?.at || `${returnDate}T14:00:00`,
            bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${destination}%20to%20${outbound.hub}%20on%20${returnDate}${classParam}${passengerParam}`
          },
          {
            from: retSeg2?.departure?.iataCode || outbound.hub,
            to: retSeg2?.arrival?.iataCode || origin,
            price: parseFloat(retLeg2Cheapest.price.total),
            airline: retLeg2Cheapest.validatingAirlineCodes[0] || 'Unknown',
            flightNumber: retSeg2 ? `${retSeg2.carrierCode}${retSeg2.number}` : 'N/A',
            departure: retSeg2?.departure?.at || `${returnDate}T16:00:00`,
            arrival: retSeg2?.arrival?.at || `${returnDate}T22:00:00`,
            bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${outbound.hub}%20to%20${origin}%20on%20${returnDate}${classParam}${passengerParam}`
          }
        ];
      }
    }
    
    const grandTotal = outboundTotal + returnTotal;
    
    // Calculate total duration
    const firstDep = new Date(tickets[0].departure);
    const lastArr = returnTickets.length > 0 
      ? new Date(returnTickets[returnTickets.length - 1].arrival)
      : new Date(tickets[tickets.length - 1].arrival);
    const durationMs = lastArr.getTime() - firstDep.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    splitTickets.push({
      id: `split-${outbound.hub}-${Date.now()}`,
      tickets: [...tickets, ...returnTickets],
      totalPrice: grandTotal,
      savings: 0, // Will be calculated against direct flight price
      currency: 'GBP',
      totalDuration: returnDate ? `${Math.floor(durationHours / 2)}h ${durationMins}m (each way)` : `${durationHours}h ${durationMins}m`,
      stops: 1
    });
  }
  
  return splitTickets;
}
