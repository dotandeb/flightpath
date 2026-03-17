import { NextRequest, NextResponse } from 'next/server';
import { searchFlights, generateSampleFlights } from '@/lib/amadeus';
import { scrapeGoogleFlights, scrapeSkyscanner } from '@/lib/scraper-v2';
import { scrapePrices as deepScrapePrices } from '@/lib/deep-scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for hobby plan

const POPULAR_HUBS = ['DXB', 'DOH', 'IST', 'AMS', 'CDG', 'FRA', 'SIN', 'LHR', 'HKG', 'BKK'];

interface FlightResult {
  id: string;
  source: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departure: { airport: string; time: string; date: string };
  arrival: { airport: string; time: string; date: string };
  duration: string;
  stops: number;
  price: number;
  currency: string;
  bookingLink: string;
  confidence: 'high' | 'medium' | 'low';
}

// Timeout wrapper for promises
const withTimeout = <T>(promise: Promise<T>, ms: number, name: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms)
    )
  ]);
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const origin = searchParams.get('origin')?.toUpperCase() || '';
  const destination = searchParams.get('destination')?.toUpperCase() || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const adults = parseInt(searchParams.get('adults') || '1');
  const travelClass = searchParams.get('travelClass') || 'ECONOMY';
  const includeSplit = searchParams.get('includeSplit') === 'true';
  const deepSearch = searchParams.get('deepSearch') === 'true';
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, departureDate' },
      { status: 400 }
    );
  }
  
  console.log(`[Combined API] ${origin} → ${destination} | Deep: ${deepSearch}`);
  
  const startTime = Date.now();
  const allFlights: FlightResult[] = [];
  const errors: string[] = [];
  
  // Run all sources in parallel with timeouts
  const sources = [
    // 1. Amadeus API (fast, 10s timeout)
    withTimeout(
      searchFlights({
        origin, destination, departureDate,
        returnDate: returnDate || undefined,
        adults, children: 0, infants: 0,
        travelClass: travelClass as any,
        nonStop: false
      }).then(results => {
        if (!results || results.length === 0) return [];
        return results.slice(0, 8).map((offer: any, idx: number) => {
          const seg = offer.itineraries[0]?.segments[0];
          return {
            id: `amadeus-${idx}`,
            source: 'AMADEUS',
            airline: offer.validatingAirlineCodes[0] || 'Unknown',
            flightNumber: seg ? `${seg.carrierCode}${seg.number}` : 'N/A',
            from: seg?.departure?.iataCode || origin,
            to: seg?.arrival?.iataCode || destination,
            departure: {
              airport: seg?.departure?.iataCode || origin,
              time: seg?.departure?.at || '',
              date: departureDate
            },
            arrival: {
              airport: seg?.arrival?.iataCode || destination,
              time: seg?.arrival?.at || '',
              date: departureDate
            },
            duration: offer.itineraries[0]?.duration || '',
            stops: (offer.itineraries[0]?.segments?.length || 1) - 1,
            price: parseFloat(offer.price.total),
            currency: offer.price.currency || 'GBP',
            bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}`,
            confidence: 'high' as const
          };
        });
      }),
      10000, 'Amadeus'
    ).catch((e: any) => {
      errors.push(`Amadeus: ${e.message}`);
      return [];
    }),
    
    // 2. Google Flights scraper (60s timeout)
    withTimeout(
      scrapeGoogleFlights(origin, destination, departureDate, {
        returnDate: returnDate || undefined,
        travelClass, maxResults: 8
      }).then(results => results.map((f, idx) => ({
        id: `google-${idx}`,
        source: 'GOOGLE_FLIGHTS',
        airline: f.airline,
        flightNumber: f.flightNumber,
        from: f.departure.airport,
        to: f.arrival.airport,
        departure: f.departure,
        arrival: f.arrival,
        duration: f.duration,
        stops: f.stops,
        price: f.price,
        currency: f.currency,
        bookingLink: f.bookingLink,
        confidence: 'high' as const
      }))),
      60000, 'Google Flights'
    ).catch((e: any) => {
      errors.push(`Google: ${e.message}`);
      return [];
    }),
    
    // 3. Skyscanner scraper (45s timeout)
    withTimeout(
      scrapeSkyscanner(origin, destination, departureDate, {
        returnDate: returnDate || undefined,
        travelClass, maxResults: 6
      }).then(results => results.map((f, idx) => ({
        id: `skyscanner-${idx}`,
        source: 'SKYSCANNER',
        airline: f.airline,
        flightNumber: f.flightNumber,
        from: f.departure.airport,
        to: f.arrival.airport,
        departure: f.departure,
        arrival: f.arrival,
        duration: f.duration,
        stops: f.stops,
        price: f.price,
        currency: f.currency,
        bookingLink: f.bookingLink,
        confidence: 'medium' as const
      }))),
      45000, 'Skyscanner'
    ).catch((e: any) => {
      errors.push(`Skyscanner: ${e.message}`);
      return [];
    })
  ];
  
  // Add deep scraper if requested
  if (deepSearch) {
    sources.push(
      withTimeout(
        deepScrapePrices(origin, destination, departureDate).then(prices => 
          prices.slice(0, 5).map((price, idx) => ({
            id: `deep-${idx}`,
            source: 'DEEP_SCRAPER',
            airline: 'Various Airlines',
            flightNumber: `DEEP${100 + idx}`,
            from: origin, to: destination,
            departure: { airport: origin, time: '', date: departureDate },
            arrival: { airport: destination, time: '', date: departureDate },
            duration: '', stops: 0,
            price, currency: 'GBP',
            bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}`,
            confidence: 'medium' as const
          }))
        ),
        45000, 'Deep Scraper'
      ).catch((e: any) => {
        errors.push(`Deep: ${e.message}`);
        return [];
      })
    );
  }
  
  // Wait for all sources (parallel execution)
  const results = await Promise.all(sources);
  results.forEach(flights => allFlights.push(...flights));
  
  // Fallback to sample data if no results
  if (allFlights.length === 0) {
    console.log('[Combined API] No results from any source, using sample data');
    const sampleResults = generateSampleFlights({
      origin, destination, departureDate,
      returnDate: returnDate || undefined,
      adults, children: 0, infants: 0,
      travelClass: travelClass as any,
      nonStop: false
    });
    
    sampleResults.slice(0, 5).forEach((offer: any, idx: number) => {
      const seg = offer.itineraries[0]?.segments[0];
      allFlights.push({
        id: `sample-${idx}`,
        source: 'SAMPLE',
        airline: offer.validatingAirlineCodes[0] || 'Unknown',
        flightNumber: seg ? `${seg.carrierCode}${seg.number}` : 'N/A',
        from: seg?.departure?.iataCode || origin,
        to: seg?.arrival?.iataCode || destination,
        departure: {
          airport: seg?.departure?.iataCode || origin,
          time: seg?.departure?.at || '',
          date: departureDate
        },
        arrival: {
          airport: seg?.arrival?.iataCode || destination,
          time: seg?.arrival?.at || '',
          date: departureDate
        },
        duration: offer.itineraries[0]?.duration || '',
        stops: (offer.itineraries[0]?.segments?.length || 1) - 1,
        price: parseFloat(offer.price.total),
        currency: offer.price.currency || 'GBP',
        bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}`,
        confidence: 'low' as const
      });
    });
  }
  
  // Deduplicate by price (keep cheapest from each unique price point)
  const priceMap = new Map<number, FlightResult>();
  for (const flight of allFlights) {
    const existing = priceMap.get(flight.price);
    if (!existing || flight.confidence === 'high') {
      priceMap.set(flight.price, flight);
    }
  }
  const deduplicated = Array.from(priceMap.values()).sort((a, b) => a.price - b.price);
  
  // Find split ticket opportunities (only if we have direct flights to compare)
  const splitTickets: any[] = [];
  if (includeSplit && deduplicated.length > 0) {
    const cheapestDirect = deduplicated[0].price;
    
    // Try 3 hubs max to keep it fast
    for (const hub of POPULAR_HUBS.slice(0, 3)) {
      if (hub === origin || hub === destination) continue;
      
      try {
        const [leg1Results, leg2Results] = await Promise.all([
          withTimeout(scrapeGoogleFlights(origin, hub, departureDate, { maxResults: 2 }), 30000, `Hub ${hub} leg1`),
          withTimeout(scrapeGoogleFlights(hub, destination, departureDate, { maxResults: 2 }), 30000, `Hub ${hub} leg2`)
        ]);
        
        if (leg1Results.length > 0 && leg2Results.length > 0) {
          const leg1 = leg1Results[0];
          const leg2 = leg2Results[0];
          const splitTotal = leg1.price + leg2.price;
          const savings = Math.round(cheapestDirect - splitTotal);
          
          if (savings > 30) {
            splitTickets.push({
              id: `split-${hub}-${Date.now()}`,
              hub,
              tickets: [
                { from: leg1.departure.airport, to: leg1.arrival.airport, price: leg1.price,
                  airline: leg1.airline, flightNumber: leg1.flightNumber,
                  departure: leg1.departure.time || `${departureDate}T10:00:00`,
                  arrival: leg1.arrival.time || `${departureDate}T14:00:00`,
                  bookingLink: leg1.bookingLink },
                { from: leg2.departure.airport, to: leg2.arrival.airport, price: leg2.price,
                  airline: leg2.airline, flightNumber: leg2.flightNumber,
                  departure: leg2.departure.time || `${departureDate}T16:00:00`,
                  arrival: leg2.arrival.time || `${departureDate}T22:00:00`,
                  bookingLink: leg2.bookingLink }
              ],
              totalPrice: splitTotal,
              directPrice: cheapestDirect,
              savings,
              currency: 'GBP'
            });
          }
        }
      } catch (e) {
        // Skip this hub
      }
    }
    
    splitTickets.sort((a, b) => b.savings - a.savings);
  }
  
  const searchTime = Date.now() - startTime;
  const sourceCounts = deduplicated.reduce((acc, f) => {
    acc[f.source] = (acc[f.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`[Combined API] Done in ${searchTime}ms | Flights: ${deduplicated.length} | Sources:`, sourceCounts);
  
  return NextResponse.json({
    flights: deduplicated,
    splitTickets,
    meta: {
      searchTime,
      totalResults: deduplicated.length,
      cheapestPrice: deduplicated[0]?.price || 0,
      sources: sourceCounts,
      errors: errors.length > 0 ? errors : undefined
    }
  });
}
