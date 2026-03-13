import { NextRequest, NextResponse } from 'next/server';
import { scrapeGoogleFlights, scrapeSplitTicketLegs, closeBrowser } from '@/lib/scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes max

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const origin = searchParams.get('origin')?.toUpperCase() || '';
  const destination = searchParams.get('destination')?.toUpperCase() || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const passengers = parseInt(searchParams.get('passengers') || '1');
  const travelClass = searchParams.get('travelClass') || 'ECONOMY';
  const includeSplit = searchParams.get('includeSplit') === 'true';
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, departureDate' },
      { status: 400 }
    );
  }
  
  console.log(`[Scraper API] ${origin} → ${destination} on ${departureDate}`);
  console.log(`[Scraper API] Passengers: ${passengers}, Class: ${travelClass}`);
  
  const startTime = Date.now();
  
  try {
    // Scrape direct flights
    console.log('[Scraper API] Scraping direct flights...');
    const directFlights = await scrapeGoogleFlights(origin, destination, departureDate, {
      returnDate: returnDate || undefined,
      passengers,
      travelClass,
      maxResults: 10
    });
    
    console.log(`[Scraper API] Found ${directFlights.length} direct flights`);
    
    // Scrape split ticket options if requested
    let splitTickets: any[] = [];
    if (includeSplit && directFlights.length > 0) {
      console.log('[Scraper API] Scraping split ticket options...');
      
      const hubs = ['DXB', 'DOH', 'IST', 'AMS', 'CDG', 'FRA'];
      const cheapestDirect = directFlights[0]?.price || Infinity;
      
      for (const hub of hubs.slice(0, 3)) {
        if (hub === origin || hub === destination) continue;
        
        try {
          const splitData = await scrapeSplitTicketLegs(
            origin, hub, destination,
            departureDate, returnDate || null,
            passengers, travelClass
          );
          
          // Build combinations
          const outboundLegs = splitData.outbound.filter(l => l.to === hub);
          const outboundLegs2 = splitData.outbound.filter(l => l.from === hub);
          
          if (outboundLegs.length > 0 && outboundLegs2.length > 0) {
            const leg1 = outboundLegs[0];
            const leg2 = outboundLegs2[0];
            const totalPrice = leg1.price + leg2.price;
            
            const tickets = [
              {
                from: leg1.from,
                to: leg1.to,
                price: leg1.price,
                airline: leg1.airline,
                flightNumber: leg1.flightNumber,
                departure: leg1.departure,
                arrival: leg1.arrival,
                bookingLink: leg1.bookingLink
              },
              {
                from: leg2.from,
                to: leg2.to,
                price: leg2.price,
                airline: leg2.airline,
                flightNumber: leg2.flightNumber,
                departure: leg2.departure,
                arrival: leg2.arrival,
                bookingLink: leg2.bookingLink
              }
            ];
            
            // Add return legs if available
            if (returnDate && splitData.return.length >= 2) {
              const retLegs1 = splitData.return.filter(l => l.from === destination);
              const retLegs2 = splitData.return.filter(l => l.to === origin);
              
              if (retLegs1.length > 0 && retLegs2.length > 0) {
                tickets.push({
                  from: retLegs1[0].from,
                  to: retLegs1[0].to,
                  price: retLegs1[0].price,
                  airline: retLegs1[0].airline,
                  flightNumber: retLegs1[0].flightNumber,
                  departure: retLegs1[0].departure,
                  arrival: retLegs1[0].arrival,
                  bookingLink: retLegs1[0].bookingLink
                });
                tickets.push({
                  from: retLegs2[0].from,
                  to: retLegs2[0].to,
                  price: retLegs2[0].price,
                  airline: retLegs2[0].airline,
                  flightNumber: retLegs2[0].flightNumber,
                  departure: retLegs2[0].departure,
                  arrival: retLegs2[0].arrival,
                  bookingLink: retLegs2[0].bookingLink
                });
              }
            }
            
            const savings = Math.max(0, Math.round(cheapestDirect - totalPrice));
            
            if (savings > 20 || totalPrice < cheapestDirect * 0.9) {
              splitTickets.push({
                id: `scraped-${hub}-${Date.now()}`,
                tickets,
                totalPrice,
                savings,
                currency: 'GBP',
                totalDuration: 'Varies',
                stops: 1
              });
            }
          }
        } catch (e) {
          console.error(`[Scraper API] Error scraping hub ${hub}:`, e);
        }
      }
    }
    
    const searchTime = Date.now() - startTime;
    
    console.log(`[Scraper API] Completed in ${searchTime}ms`);
    console.log(`[Scraper API] Direct flights: ${directFlights.length}, Split tickets: ${splitTickets.length}`);
    
    // Format flights to match existing structure
    const formattedFlights = directFlights.map((f, i) => ({
      id: `scraped-${i}`,
      source: 'SCRAPER',
      instantTicketingRequired: false,
      nonHomogeneous: false,
      oneWay: !returnDate,
      lastTicketingDate: departureDate,
      numberOfBookableSeats: 9,
      itineraries: [{
        duration: f.duration,
        segments: [{
          id: `seg-${i}`,
          departure: {
            iataCode: f.departure.airport,
            at: f.departure.time
          },
          arrival: {
            iataCode: f.arrival.airport,
            at: f.arrival.time
          },
          carrierCode: f.airline.substring(0, 2).toUpperCase(),
          number: f.flightNumber || `${100 + i}`,
          aircraft: { code: '77W' },
          duration: f.duration,
          numberOfStops: f.stops
        }]
      }],
      price: {
        currency: f.currency,
        total: f.price.toString(),
        base: (f.price * 0.85).toFixed(2),
        fees: [
          { amount: (f.price * 0.1).toFixed(2), type: 'TAXES' },
          { amount: (f.price * 0.05).toFixed(2), type: 'SUPPLIER' }
        ],
        grandTotal: f.price.toString()
      },
      pricingOptions: {
        fareType: ['PUBLISHED'],
        includedCheckedBagsOnly: false
      },
      validatingAirlineCodes: [f.airline.substring(0, 2).toUpperCase()],
      travelerPricings: [{
        travelerId: '1',
        fareOption: 'STANDARD',
        travelerType: 'ADULT',
        price: {
          currency: f.currency,
          total: f.price.toString(),
          base: (f.price * 0.85).toFixed(2)
        },
        fareDetailsBySegment: [{
          segmentId: `seg-${i}`,
          cabin: travelClass,
          fareBasis: 'Y',
          class: 'Y',
          includedCheckedBags: { quantity: 1 }
        }]
      }]
    }));
    
    return NextResponse.json({
      amadeus: formattedFlights,
      splitTickets,
      airports: {
        origin: [origin],
        destination: [destination]
      },
      meta: {
        searchTime,
        totalResults: formattedFlights.length + splitTickets.length,
        cheapestPrice: formattedFlights[0]?.price?.total ? parseFloat(formattedFlights[0].price.total) : 0,
        source: 'SCRAPER'
      }
    });
    
  } catch (error: any) {
    console.error('[Scraper API] Error:', error);
    
    return NextResponse.json(
      { error: 'Scraping failed', message: error.message },
      { status: 500 }
    );
  } finally {
    // Don't close browser to reuse for next request
    // await closeBrowser();
  }
}
