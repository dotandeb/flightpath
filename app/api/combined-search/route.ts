import { NextRequest, NextResponse } from 'next/server';
import { searchFlights, generateSampleFlights } from '@/lib/amadeus';
import { scrapeGoogleFlights, scrapeSkyscanner, closeBrowser } from '@/lib/scraper-v2';
import { getMetroAirports, isMetroCity } from '@/lib/airports';
import { scrapePrices as deepScrapePrices } from '@/lib/deep-scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for comprehensive search

const POPULAR_HUBS = ['DXB', 'DOH', 'IST', 'AMS', 'CDG', 'FRA', 'SIN', 'LHR', 'HKG', 'BKK'];

interface CombinedFlightResult {
  id: string;
  source: 'AMADEUS' | 'GOOGLE_FLIGHTS' | 'SKYSCANNER' | 'DEEP_SCRAPER' | 'SAMPLE';
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

interface SplitTicketResult {
  id: string;
  hub: string;
  tickets: Array<{
    from: string;
    to: string;
    price: number;
    airline: string;
    flightNumber: string;
    departure: string;
    arrival: string;
    bookingLink: string;
  }>;
  totalPrice: number;
  directPrice: number;
  savings: number;
  currency: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const origin = searchParams.get('origin')?.toUpperCase() || '';
  const destination = searchParams.get('destination')?.toUpperCase() || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const adults = parseInt(searchParams.get('adults') || '1');
  const children = parseInt(searchParams.get('children') || '0');
  const infants = parseInt(searchParams.get('infants') || '0');
  const travelClass = searchParams.get('travelClass') || 'ECONOMY';
  const includeSplit = searchParams.get('includeSplit') === 'true';
  const deepSearch = searchParams.get('deepSearch') === 'true';
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, departureDate' },
      { status: 400 }
    );
  }
  
  console.log(`[Combined API] ${origin} → ${destination} | Deep: ${deepSearch} | Split: ${includeSplit}`);
  
  const startTime = Date.now();
  const allFlights: CombinedFlightResult[] = [];
  const errors: string[] = [];
  
  // 1. Try Amadeus API first (fast, official)
  console.log('[Combined API] Step 1: Trying Amadeus API...');
  try {
    const amadeusResults = await searchFlights({
      origin,
      destination,
      departureDate,
      returnDate: returnDate || undefined,
      adults,
      children,
      infants,
      travelClass: travelClass as any,
      nonStop: false
    });
    
    if (amadeusResults && amadeusResults.length > 0) {
      const converted = amadeusResults.slice(0, 10).map((offer: any, idx: number) => {
        const seg = offer.itineraries[0]?.segments[0];
        return {
          id: `amadeus-${idx}`,
          source: 'AMADEUS' as const,
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
      allFlights.push(...converted);
      console.log(`[Combined API] Amadeus returned ${converted.length} flights`);
    } else {
      console.log('[Combined API] Amadeus returned no results');
    }
  } catch (e: any) {
    console.error('[Combined API] Amadeus error:', e.message);
    errors.push(`Amadeus: ${e.message}`);
  }
  
  // 2. Scrape Google Flights (real prices, slower)
  console.log('[Combined API] Step 2: Scraping Google Flights...');
  try {
    const googleResults = await scrapeGoogleFlights(origin, destination, departureDate, {
      returnDate: returnDate || undefined,
      travelClass,
      maxResults: 10
    });
    
    if (googleResults.length > 0) {
      const converted = googleResults.map((f, idx) => ({
        id: `google-${idx}`,
        source: 'GOOGLE_FLIGHTS' as const,
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
      }));
      allFlights.push(...converted);
      console.log(`[Combined API] Google Flights returned ${converted.length} flights`);
    }
  } catch (e: any) {
    console.error('[Combined API] Google Flights error:', e.message);
    errors.push(`Google Flights: ${e.message}`);
  }
  
  // 3. Scrape Skyscanner (backup source)
  console.log('[Combined API] Step 3: Scraping Skyscanner...');
  try {
    const skyscannerResults = await scrapeSkyscanner(origin, destination, departureDate, {
      returnDate: returnDate || undefined,
      travelClass,
      maxResults: 10
    });
    
    if (skyscannerResults.length > 0) {
      const converted = skyscannerResults.map((f, idx) => ({
        id: `skyscanner-${idx}`,
        source: 'SKYSCANNER' as const,
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
      }));
      allFlights.push(...converted);
      console.log(`[Combined API] Skyscanner returned ${converted.length} flights`);
    }
  } catch (e: any) {
    console.error('[Combined API] Skyscanner error:', e.message);
    errors.push(`Skyscanner: ${e.message}`);
  }
  
  // 4. Deep scraper for additional coverage (if requested or if few results)
  if (deepSearch || allFlights.length < 5) {
    console.log('[Combined API] Step 4: Running deep scraper...');
    try {
      const deepPrices = await deepScrapePrices(origin, destination, departureDate);
      
      if (deepPrices.length > 0) {
        const converted = deepPrices.slice(0, 5).map((price, idx) => ({
          id: `deep-${idx}`,
          source: 'DEEP_SCRAPER' as const,
          airline: 'Various Airlines',
          flightNumber: `DEEP${100 + idx}`,
          from: origin,
          to: destination,
          departure: { airport: origin, time: '', date: departureDate },
          arrival: { airport: destination, time: '', date: departureDate },
          duration: '',
          stops: 0,
          price: price,
          currency: 'GBP',
          bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}`,
          confidence: 'medium' as const
        }));
        allFlights.push(...converted);
        console.log(`[Combined API] Deep scraper returned ${converted.length} flights`);
      }
    } catch (e: any) {
      console.error('[Combined API] Deep scraper error:', e.message);
      errors.push(`Deep scraper: ${e.message}`);
    }
  }
  
  // 5. Generate sample data as last resort (if absolutely no results)
  if (allFlights.length === 0) {
    console.log('[Combined API] Step 5: Generating sample data as fallback...');
    try {
      const sampleResults = generateSampleFlights({
        origin,
        destination,
        departureDate,
        returnDate: returnDate || undefined,
        adults,
        children,
        infants,
        travelClass: travelClass as any,
        nonStop: false
      });
      
      const converted = sampleResults.slice(0, 5).map((offer: any, idx: number) => {
        const seg = offer.itineraries[0]?.segments[0];
        return {
          id: `sample-${idx}`,
          source: 'SAMPLE' as const,
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
        };
      });
      allFlights.push(...converted);
      console.log(`[Combined API] Generated ${converted.length} sample flights`);
    } catch (e: any) {
      console.error('[Combined API] Sample generation error:', e.message);
      errors.push(`Sample: ${e.message}`);
    }
  }
  
  // Deduplicate flights by price (keep cheapest from each source)
  const seenPrices = new Map<number, CombinedFlightResult>();
  for (const flight of allFlights) {
    const existing = seenPrices.get(flight.price);
    if (!existing || flight.confidence === 'high') {
      seenPrices.set(flight.price, flight);
    }
  }
  const deduplicatedFlights = Array.from(seenPrices.values())
    .sort((a, b) => a.price - b.price);
  
  // 6. Find split ticket opportunities
  let splitTickets: SplitTicketResult[] = [];
  if (includeSplit && deduplicatedFlights.length > 0) {
    console.log('[Combined API] Step 6: Finding split ticket opportunities...');
    const cheapestDirect = deduplicatedFlights[0].price;
    
    for (const hub of POPULAR_HUBS.slice(0, 5)) {
      if (hub === origin || hub === destination) continue;
      
      try {
        // Get prices for each leg
        const leg1Prices = await scrapeGoogleFlights(origin, hub, departureDate, { maxResults: 3 });
        await new Promise(r => setTimeout(r, 1000));
        const leg2Prices = await scrapeGoogleFlights(hub, destination, departureDate, { maxResults: 3 });
        
        if (leg1Prices.length > 0 && leg2Prices.length > 0) {
          const leg1 = leg1Prices[0];
          const leg2 = leg2Prices[0];
          const splitTotal = leg1.price + leg2.price;
          const savings = Math.round(cheapestDirect - splitTotal);
          
          if (savings > 20) {
            splitTickets.push({
              id: `split-${hub}-${Date.now()}`,
              hub,
              tickets: [
                {
                  from: leg1.departure.airport,
                  to: leg1.arrival.airport,
                  price: leg1.price,
                  airline: leg1.airline,
                  flightNumber: leg1.flightNumber,
                  departure: leg1.departure.time || `${departureDate}T10:00:00`,
                  arrival: leg1.arrival.time || `${departureDate}T14:00:00`,
                  bookingLink: leg1.bookingLink
                },
                {
                  from: leg2.departure.airport,
                  to: leg2.arrival.airport,
                  price: leg2.price,
                  airline: leg2.airline,
                  flightNumber: leg2.flightNumber,
                  departure: leg2.departure.time || `${departureDate}T16:00:00`,
                  arrival: leg2.arrival.time || `${departureDate}T22:00:00`,
                  bookingLink: leg2.bookingLink
                }
              ],
              totalPrice: splitTotal,
              directPrice: cheapestDirect,
              savings,
              currency: 'GBP'
            });
          }
        }
      } catch (e) {
        // Continue to next hub
      }
    }
    
    splitTickets.sort((a, b) => b.savings - a.savings);
    console.log(`[Combined API] Found ${splitTickets.length} split ticket opportunities`);
  }
  
  const searchTime = Date.now() - startTime;
  
  // Count by source
  const sourceCounts = deduplicatedFlights.reduce((acc, f) => {
    acc[f.source] = (acc[f.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`[Combined API] Completed in ${searchTime}ms`);
  console.log(`[Combined API] Results by source:`, sourceCounts);
  console.log(`[Combined API] Total unique flights: ${deduplicatedFlights.length}`);
  
  return NextResponse.json({
    flights: deduplicatedFlights,
    splitTickets,
    meta: {
      searchTime,
      totalResults: deduplicatedFlights.length,
      cheapestPrice: deduplicatedFlights[0]?.price || 0,
      sources: sourceCounts,
      errors: errors.length > 0 ? errors : undefined
    }
  });
}
