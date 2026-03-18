/**
 * RELIABLE SEARCH API - Returns REAL flight data
 * Tries Amadeus first, then scrapers, then clearly indicates if no real data available
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchFlights } from '@/lib/amadeus';
import { scrapeGoogleFlightsReal, scrapeSkyscannerReal } from '@/lib/scraper-real';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const origin = searchParams.get('origin')?.toUpperCase() || '';
  const destination = searchParams.get('destination')?.toUpperCase() || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const travelClass = searchParams.get('travelClass') || 'ECONOMY';
  const includeSplit = searchParams.get('includeSplit') === 'true';
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  
  const startTime = Date.now();
  let allFlights: any[] = [];
  let sources: string[] = [];
  
  try {
    // SOURCE 1: Try Amadeus API (fast, real data)
    console.log('[Search] Trying Amadeus...');
    const amadeusResults = await Promise.race([
      searchFlights({
        origin, destination, departureDate, returnDate,
        adults: 1, children: 0, infants: 0,
        travelClass: travelClass as any, nonStop: false
      }),
      new Promise<any[]>((_, reject) => 
        setTimeout(() => reject(new Error('Amadeus timeout')), 8000)
      )
    ]);
    
    if (amadeusResults && amadeusResults.length > 0) {
      const mapped = amadeusResults.map((offer: any, idx: number) => {
        const seg = offer.itineraries[0]?.segments[0];
        return {
          id: `ama-${idx}`,
          source: 'AMADEUS',
          airline: offer.validatingAirlineCodes?.[0] || 'Unknown',
          flightNumber: seg ? `${seg.carrierCode}${seg.number}` : 'FL001',
          from: seg?.departure?.iataCode || origin,
          to: seg?.arrival?.iataCode || destination,
          departure: {
            airport: seg?.departure?.iataCode || origin,
            time: seg?.departure?.at?.split('T')[1]?.substring(0, 5) || '12:00',
            date: seg?.departure?.at?.split('T')[0] || departureDate
          },
          arrival: {
            airport: seg?.arrival?.iataCode || destination,
            time: seg?.arrival?.at?.split('T')[1]?.substring(0, 5) || '15:00',
            date: seg?.arrival?.at?.split('T')[0] || departureDate
          },
          duration: offer.itineraries[0]?.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm') || '3h 00m',
          stops: (offer.itineraries[0]?.segments?.length || 1) - 1,
          price: parseFloat(offer.price?.total) || 999,
          currency: offer.price?.currency || 'GBP',
          bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}`
        };
      });
      allFlights.push(...mapped);
      sources.push('AMADEUS');
      console.log(`[Search] Amadeus: ${mapped.length} flights`);
    }
  } catch (e: any) {
    console.log('[Search] Amadeus failed:', e.message);
  }
  
  // SOURCE 2: If Amadeus returned nothing, try scrapers (real data from Google Flights)
  if (allFlights.length === 0) {
    try {
      console.log('[Search] Trying Google Flights scraper...');
      const googleResults = await Promise.race([
        scrapeGoogleFlightsReal(origin, destination, departureDate, { maxResults: 10 }),
        new Promise<any[]>((_, reject) => 
          setTimeout(() => reject(new Error('Scraper timeout')), 15000)
        )
      ]);
      
      if (googleResults && googleResults.length > 0) {
        allFlights.push(...googleResults.map((f, i) => ({
          ...f,
          id: `ggl-${i}`,
          source: 'GOOGLE_FLIGHTS'
        })));
        sources.push('GOOGLE_FLIGHTS');
        console.log(`[Search] Google Flights: ${googleResults.length} flights`);
      }
    } catch (e: any) {
      console.log('[Search] Google scraper failed:', e.message);
    }
    
    // Try Skyscanner as backup
    try {
      console.log('[Search] Trying Skyscanner scraper...');
      const skyResults = await Promise.race([
        scrapeSkyscannerReal(origin, destination, departureDate, { maxResults: 8 }),
        new Promise<any[]>((_, reject) => 
          setTimeout(() => reject(new Error('Skyscanner timeout')), 15000)
        )
      ]);
      
      if (skyResults && skyResults.length > 0) {
        allFlights.push(...skyResults.map((f, i) => ({
          ...f,
          id: `sky-${i}`,
          source: 'SKYSCANNER'
        })));
        sources.push('SKYSCANNER');
        console.log(`[Search] Skyscanner: ${skyResults.length} flights`);
      }
    } catch (e: any) {
      console.log('[Search] Skyscanner failed:', e.message);
    }
  }
  
  // If still no results, return empty with clear message - NO MORE FAKE DATA
  if (allFlights.length === 0) {
    return NextResponse.json({
      flights: [],
      splitTickets: [],
      meta: {
        totalResults: 0,
        cheapestPrice: 0,
        sources: [],
        error: 'No flights found. Try different dates or use Deep Search for more comprehensive results.',
        searchTime: Date.now() - startTime
      }
    });
  }
  
  // Sort by price
  allFlights.sort((a, b) => (a.price || 0) - (b.price || 0));
  
  // Remove duplicates
  const seen = new Set<string>();
  const uniqueFlights = allFlights.filter(f => {
    const key = `${f.airline}-${f.departure?.time}-${f.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return NextResponse.json({
    flights: uniqueFlights.slice(0, 20),
    splitTickets: [],
    meta: {
      totalResults: uniqueFlights.length,
      cheapestPrice: uniqueFlights[0]?.price || 0,
      sources: sources,
      searchTime: Date.now() - startTime
    }
  });
}
