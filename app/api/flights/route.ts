import { NextRequest, NextResponse } from 'next/server';
import { searchFlights, generateSampleFlights } from '@/lib/amadeus';
import { searchDeals, fetchRSSDeals } from '@/lib/deals';
import { generateSplitTickets } from '@/lib/split-tickets';
import { getMetroAirports, isMetroCity } from '@/lib/airports';

export const dynamic = 'force-dynamic';

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
  console.log(`[API] Passengers: ${adults} adults, ${children} children, ${infants} infants`);
  
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
  
  const dealsPromise = includeDeals ? searchDeals(origin, destination) : Promise.resolve([]);
  
  try {
    const [amadeusResults, deals] = await Promise.all([
      Promise.all(amadeusPromises),
      dealsPromise
    ]);
    
    let amadeusFlights = amadeusResults.flat();
    
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
    const splitTickets = generateSplitTickets(origin, destination, departureDate, cheapestPrice);
    
    const allPrices = [
      ...amadeusFlights.map(f => parseFloat(f.price.total)),
      ...deals.map(d => d.price),
      ...splitTickets.map(s => s.totalPrice)
    ];
    const cheapestPriceOverall = Math.min(...allPrices);
    
    const bestDeal = deals.find(d => d.price === cheapestPriceOverall) || 
                     deals.sort((a, b) => a.price - b.price)[0] || null;
    
    const searchTime = Date.now() - startTime;
    
    console.log(`[API] Results in ${searchTime}ms:`);
    console.log(`[API] - Amadeus flights: ${amadeusFlights.length}`);
    console.log(`[API] - Deals: ${deals.length}`);
    console.log(`[API] - Split tickets: ${splitTickets.length}`);
    console.log(`[API] - Cheapest price: £${cheapestPriceOverall}`);
    
    return NextResponse.json({
      amadeus: amadeusFlights,
      deals,
      splitTickets,
      airports: {
        origin: originAirports,
        destination: destinationAirports
      },
      meta: {
        searchTime,
        totalResults: amadeusFlights.length + deals.length + splitTickets.length,
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