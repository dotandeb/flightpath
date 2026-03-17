import { NextRequest, NextResponse } from 'next/server';
import { scrapeGoogleFlights, scrapeSplitTicketLegs, scrapeSkyscanner, closeBrowser } from '@/lib/scraper-v2';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for hobby plan

const HUBS = ['DXB', 'DOH', 'IST', 'AMS', 'CDG', 'FRA', 'SIN'];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const origin = searchParams.get('origin')?.toUpperCase() || '';
  const destination = searchParams.get('destination')?.toUpperCase() || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const travelClass = searchParams.get('travelClass') || 'ECONOMY';
  const includeSplit = searchParams.get('includeSplit') === 'true';
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }
  
  console.log(`[API v2] ${origin} → ${destination} | Class: ${travelClass} | Split: ${includeSplit}`);
  
  const startTime = Date.now();
  
  try {
    // Try Google Flights first
    console.log('[API v2] Scraping Google Flights...');
    let directFlights = await scrapeGoogleFlights(origin, destination, departureDate, {
      returnDate: returnDate || undefined,
      travelClass,
      maxResults: 10
    });
    
    // Fallback to Skyscanner if no results
    if (directFlights.length === 0) {
      console.log('[API v2] No Google results, trying Skyscanner...');
      directFlights = await scrapeSkyscanner(origin, destination, departureDate, {
        returnDate: returnDate || undefined,
        travelClass,
        maxResults: 10
      });
    }
    
    console.log(`[API v2] Found ${directFlights.length} direct flights`);
    
    // Find split tickets if requested
    let splitTickets: any[] = [];
    if (includeSplit && directFlights.length > 0) {
      console.log('[API v2] Finding split tickets...');
      
      const cheapestDirect = directFlights[0]?.price || Infinity;
      
      // Try top 3 hubs
      for (const hub of HUBS.slice(0, 3)) {
        if (hub === origin || hub === destination) continue;
        
        try {
          const splitData = await scrapeSplitTicketLegs(
            origin, hub, destination,
            departureDate, returnDate || null,
            travelClass
          );
          
          if (splitData.outbound.length >= 2) {
            const leg1 = splitData.outbound[0];
            const leg2 = splitData.outbound[1];
            const outboundTotal = leg1.price + leg2.price;
            
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
            
            // Add return legs
            let returnTotal = 0;
            if (returnDate && splitData.return.length >= 2) {
              const ret1 = splitData.return[0];
              const ret2 = splitData.return[1];
              returnTotal = ret1.price + ret2.price;
              
              tickets.push({
                from: ret1.from,
                to: ret1.to,
                price: ret1.price,
                airline: ret1.airline,
                flightNumber: ret1.flightNumber,
                departure: ret1.departure,
                arrival: ret1.arrival,
                bookingLink: ret1.bookingLink
              });
              tickets.push({
                from: ret2.from,
                to: ret2.to,
                price: ret2.price,
                airline: ret2.airline,
                flightNumber: ret2.flightNumber,
                departure: ret2.departure,
                arrival: ret2.arrival,
                bookingLink: ret2.bookingLink
              });
            }
            
            const totalPrice = outboundTotal + returnTotal;
            const savings = Math.max(0, Math.round(cheapestDirect - totalPrice));
            
            // Only add if there's meaningful savings
            if (savings > 20 || totalPrice < cheapestDirect * 0.95) {
              splitTickets.push({
                id: `split-${hub}-${Date.now()}`,
                hub,
                tickets,
                totalPrice,
                savings,
                currency: 'GBP'
              });
            }
          }
        } catch (e) {
          console.error(`[API v2] Error with hub ${hub}:`, e);
        }
      }
    }
    
    // Sort split tickets by savings
    splitTickets.sort((a, b) => b.savings - a.savings);
    
    const searchTime = Date.now() - startTime;
    console.log(`[API v2] Completed in ${searchTime}ms`);
    console.log(`[API v2] Direct: ${directFlights.length}, Split: ${splitTickets.length}`);
    
    return NextResponse.json({
      flights: directFlights,
      splitTickets,
      meta: {
        searchTime,
        source: 'SCRAPER_V2',
        totalResults: directFlights.length + splitTickets.length,
        cheapestPrice: directFlights[0]?.price || 0
      }
    });
    
  } catch (error: any) {
    console.error('[API v2] Error:', error);
    return NextResponse.json(
      { error: 'Scraping failed', message: error.message },
      { status: 500 }
    );
  }
}
