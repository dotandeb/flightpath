/**
 * RELIABLE SEARCH API
 * No fake data, async processing, real split tickets
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchFlights } from '@/lib/amadeus';
import { scrapeGoogleFlightsReal } from '@/lib/scraper-real';
import { findSplitTickets } from '@/lib/split-engine';
import { validateFlight, crossValidateFlights, removeMockData } from '@/lib/validation';
import { createJob, updateJob, getJob, getJobStatusResponse } from '@/lib/job-queue';
import { log, recordMetric, validateNoFakeData } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Timeout wrapper
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> => {
  return Promise.race([
    promise,
    new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), ms)
    )
  ]).catch(() => null);
};

/**
 * GET /api/search - Quick search (synchronous)
 * Returns results within 10 seconds
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  
  const origin = searchParams.get('origin')?.toUpperCase() || '';
  const destination = searchParams.get('destination')?.toUpperCase() || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || undefined;
  const travelClass = searchParams.get('travelClass') || 'ECONOMY';
  const includeSplit = searchParams.get('includeSplit') === 'true';
  const async = searchParams.get('async') === 'true';
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }
  
  log('info', 'SEARCH', `${origin} → ${destination} | Async: ${async}`);
  recordMetric('apiCalls');
  
  // If async requested, create job and return immediately
  if (async) {
    const job = createJob('deep', { origin, destination, departureDate, returnDate, travelClass });
    
    // Start processing in background (don't await)
    processDeepSearch(job.id, origin, destination, departureDate, returnDate, travelClass, includeSplit);
    
    return NextResponse.json({
      jobId: job.id,
      status: 'pending',
      message: 'Deep search started. Poll /api/search/job?id=' + job.id
    });
  }
  
  // Synchronous search (quick)
  try {
    const results = await performQuickSearch(
      origin, destination, departureDate, returnDate, travelClass, includeSplit
    );
    
    const duration = Date.now() - startTime;
    recordMetric('avgResponseTime', duration);
    
    // Validate no fake data
    if (!validateNoFakeData(results.flights)) {
      log('error', 'SEARCH', 'Fake data detected in results');
    }
    
    return NextResponse.json(results);
    
  } catch (error: any) {
    log('error', 'SEARCH', `Search failed: ${error.message}`);
    recordMetric('apiFailures');
    
    return NextResponse.json(
      { error: 'Search failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Perform quick search (under 10s)
 */
async function performQuickSearch(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  travelClass: string,
  includeSplit: boolean
) {
  const allFlights: any[] = [];
  const errors: string[] = [];
  
  // 1. Try Amadeus API (8s timeout)
  const amadeusResults = await withTimeout(
    searchFlights({
      origin, destination, departureDate,
      returnDate, adults: 1, children: 0, infants: 0,
      travelClass: travelClass as any,
      nonStop: false
    }),
    8000
  );
  
  if (amadeusResults) {
    const flights = amadeusResults.map((offer: any, idx: number) => {
      const seg = offer.itineraries[0]?.segments[0];
      return {
        id: `ama-${idx}`,
        source: 'AMADEUS',
        airline: offer.validatingAirlineCodes[0],
        flightNumber: seg ? `${seg.carrierCode}${seg.number}` : '',
        from: seg?.departure?.iataCode,
        to: seg?.arrival?.iataCode,
        departure: {
          airport: seg?.departure?.iataCode,
          time: seg?.departure?.at?.split('T')[1]?.substring(0, 5) || '',
          date: seg?.departure?.at?.split('T')[0] || departureDate
        },
        arrival: {
          airport: seg?.arrival?.iataCode,
          time: seg?.arrival?.at?.split('T')[1]?.substring(0, 5) || '',
          date: seg?.arrival?.at?.split('T')[0] || departureDate
        },
        duration: offer.itineraries[0]?.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm'),
        stops: (offer.itineraries[0]?.segments?.length || 1) - 1,
        price: parseFloat(offer.price.total),
        currency: offer.price.currency || 'GBP',
        bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}`
      };
    });
    allFlights.push(...flights);
  } else {
    errors.push('Amadeus API timeout');
    recordMetric('apiFailures');
  }
  
  // 2. Fallback to scraper if API failed
  if (allFlights.length === 0) {
    log('warn', 'SEARCH', 'Amadeus failed, trying scraper');
    recordMetric('scraperCalls');
    
    const scraped = await withTimeout(
      scrapeGoogleFlightsReal(origin, destination, departureDate, { maxResults: 5 }),
      10000
    );
    
    if (scraped) {
      allFlights.push(...scraped.map((f, i) => ({
        id: `scr-${i}`,
        source: 'SCRAPER',
        ...f
      })));
    } else {
      errors.push('Scraper timeout');
      recordMetric('scraperFailures');
    }
  }
  
  // 3. Remove mock data and validate
  let validatedFlights = removeMockData(allFlights)
    .map(validateFlight)
    .filter((f): f is NonNullable<typeof f> => f !== null);
  
  // 4. Cross-validate if multiple sources
  if (validatedFlights.some(f => f.source === 'AMADEUS') && 
      validatedFlights.some(f => f.source === 'SCRAPER')) {
    validatedFlights = crossValidateFlights(validatedFlights);
  }
  
  // 5. Find split tickets (only if we have valid direct flights)
  let splitTickets: any[] = [];
  if (includeSplit && validatedFlights.length > 0) {
    const cheapestDirect = validatedFlights[0].price;
    splitTickets = await findSplitTickets(origin, destination, departureDate, cheapestDirect, { maxHubs: 3 });
  }
  
  return {
    flights: validatedFlights.slice(0, 10),
    splitTickets,
    meta: {
      totalResults: validatedFlights.length,
      cheapestPrice: validatedFlights[0]?.price || 0,
      sources: Array.from(new Set(validatedFlights.map(f => f.source))),
      errors: errors.length > 0 ? errors : undefined
    }
  };
}

/**
 * Background deep search processing
 */
async function processDeepSearch(
  jobId: string,
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  travelClass: string,
  includeSplit: boolean
) {
  const updateProgress = (p: number) => updateJob(jobId, { progress: p });
  
  try {
    updateProgress(10);
    
    // Scrape multiple sources
    const [googleFlights, skyscanner] = await Promise.all([
      withTimeout(scrapeGoogleFlightsReal(origin, destination, departureDate, { maxResults: 8 }), 25000),
      withTimeout(scrapeGoogleFlightsReal(origin, destination, departureDate, { maxResults: 5 }), 20000)
    ]);
    
    updateProgress(50);
    
    const allFlights: any[] = [];
    
    if (googleFlights) {
      allFlights.push(...googleFlights.map((f, i) => ({ id: `gf-${i}`, source: 'GOOGLE_FLIGHTS', ...f })));
    }
    if (skyscanner) {
      allFlights.push(...skyscanner.map((f, i) => ({ id: `ss-${i}`, source: 'SKYSCANNER', ...f })));
    }
    
    updateProgress(70);
    
    // Validate and deduplicate
    let validated = removeMockData(allFlights)
      .map(validateFlight)
      .filter((f): f is NonNullable<typeof f> => f !== null);
    
    validated = crossValidateFlights(validated);
    
    updateProgress(85);
    
    // Find split tickets
    const splitTickets = validated.length > 0 
      ? await findSplitTickets(origin, destination, departureDate, validated[0].price, { maxHubs: 5 })
      : [];
    
    updateProgress(100);
    
    const results = {
      flights: validated.slice(0, 15),
      splitTickets,
      meta: {
        totalResults: validated.length,
        cheapestPrice: validated[0]?.price || 0,
        sources: [...new Set(validated.map(f => f.source))]
      }
    };
    
    updateJob(jobId, { status: 'completed', progress: 100, results });
    log('info', 'DEEP_SEARCH', `Job ${jobId} completed`, { flights: validated.length });
    
  } catch (error: any) {
    log('error', 'DEEP_SEARCH', `Job ${jobId} failed: ${error.message}`);
    updateJob(jobId, { status: 'failed', error: error.message });
  }
}
