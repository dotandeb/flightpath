/**
 * FLIGHTSTREAM - Server-Sent Events Streaming Search
 * Eliminates timeouts by streaming results in real-time
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSession, broadcast, getSession, StreamUpdate } from '@/lib/stream-sessions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Simple UUID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * POST /api/stream/search - Start a streaming search
 * Returns immediately with session ID
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { origin, destination, departureDate, returnDate, travelClass = 'ECONOMY' } = body;
    
    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const sessionId = generateId();
    
    // Create stream session
    createSession(sessionId);
    
    // Fire-and-forget: Start search in background
    startStreamingSearch(sessionId, {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate,
      travelClass
    });
    
    // Return immediately - no waiting
    return NextResponse.json({
      sessionId,
      status: 'streaming',
      streamUrl: `/api/stream/${sessionId}`,
      message: 'Search started - connect to stream for results',
      estimatedTime: '10-30 seconds for complete results'
    });
    
  } catch (error: any) {
    console.error('[StreamSearch] Error starting search:', error);
    return NextResponse.json(
      { error: 'Failed to start search', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Start background search with progressive result streaming
 */
async function startStreamingSearch(sessionId: string, params: any) {
  const session = getSession(sessionId);
  if (!session) return;
  
  const { origin, destination, departureDate, returnDate, travelClass } = params;
  
  try {
    // PHASE 1: Quick results (Amadeus + cache) - Return within 2 seconds
    broadcast(sessionId, {
      type: 'progress',
      progress: 5,
      message: 'Searching Amadeus API...',
      timestamp: Date.now()
    });
    
    const amadeusResults = await searchWithTimeout(
      () => searchAmadeus(origin, destination, departureDate, returnDate, travelClass),
      6000  // 6s timeout for Amadeus
    );
    
    if (amadeusResults && amadeusResults.length > 0) {
      session.results.flights.push(...amadeusResults);
      session.results.sources.push('AMADEUS');
      
      broadcast(sessionId, {
        type: 'flights',
        data: deduplicateAndSort(session.results.flights),
        progress: 30,
        source: 'AMADEUS',
        timestamp: Date.now()
      });
    }
    
    // PHASE 2: Scraper results in parallel
    broadcast(sessionId, {
      type: 'progress',
      progress: 35,
      message: 'Scraping Google Flights...',
      timestamp: Date.now()
    });
    
    // Run scrapers in parallel with individual timeouts
    const [googleResults, skyscannerResults] = await Promise.allSettled([
      searchWithTimeout(() => scrapeGoogleFlights(origin, destination, departureDate), 10000),
      searchWithTimeout(() => scrapeSkyscanner(origin, destination, departureDate), 10000)
    ]);
    
    if (googleResults.status === 'fulfilled' && googleResults.value) {
      session.results.flights.push(...googleResults.value);
      session.results.sources.push('GOOGLE_FLIGHTS');
    }
    
    if (skyscannerResults.status === 'fulfilled' && skyscannerResults.value) {
      session.results.flights.push(...skyscannerResults.value);
      session.results.sources.push('SKYSCANNER');
    }
    
    // Broadcast combined results
    broadcast(sessionId, {
      type: 'flights',
      data: deduplicateAndSort(session.results.flights),
      progress: 60,
      source: 'SCRAPERS',
      timestamp: Date.now()
    });
    
    // PHASE 3: Split tickets (parallel hub search)
    broadcast(sessionId, {
      type: 'progress',
      progress: 65,
      message: 'Finding split ticket opportunities...',
      timestamp: Date.now()
    });
    
    const splitTickets = await findSplitTicketsParallel(
      origin, 
      destination, 
      departureDate, 
      session.results.flights
    );
    
    if (splitTickets.length > 0) {
      session.results.splitTickets = splitTickets;
      
      broadcast(sessionId, {
        type: 'splitTickets',
        data: splitTickets,
        progress: 90,
        timestamp: Date.now()
      });
    }
    
    // Complete
    session.status = 'complete';
    broadcast(sessionId, {
      type: 'complete',
      progress: 100,
      message: 'Search complete',
      data: {
        flights: deduplicateAndSort(session.results.flights).slice(0, 20),
        splitTickets: session.results.splitTickets,
        sources: session.results.sources,
        totalFound: session.results.flights.length
      },
      timestamp: Date.now()
    });
    
  } catch (error: any) {
    console.error('[StreamSearch] Error:', error);
    
    // Even on error, return what we have
    session.status = 'error';
    broadcast(sessionId, {
      type: 'error',
      message: error.message,
      data: {
        flights: session.results.flights,
        splitTickets: session.results.splitTickets,
        sources: session.results.sources
      },
      timestamp: Date.now()
    });
  }
}

// Helper functions
async function searchWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T | null> {
  return Promise.race([
    fn(),
    new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    )
  ]).catch(() => null);
}

function deduplicateAndSort(flights: any[]): any[] {
  const seen = new Set<string>();
  const unique = flights.filter(f => {
    const key = `${f.airline}-${f.departure?.time}-${f.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return unique.sort((a, b) => (a.price || 0) - (b.price || 0));
}

// Import implementations
import { searchFlights } from '@/lib/amadeus';
import { scrapeGoogleFlightsReal, scrapeSkyscannerReal } from '@/lib/scraper-real';

async function searchAmadeus(origin: string, dest: string, dep: string, ret?: string, cls?: string): Promise<any[]> {
  const results = await searchFlights({
    origin, destination: dest, departureDate: dep,
    returnDate: ret, adults: 1, children: 0, infants: 0,
    travelClass: cls as any, nonStop: false
  });
  
  return results.map((offer: any, idx: number) => {
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
        date: seg?.departure?.at?.split('T')[0] || dep
      },
      arrival: {
        airport: seg?.arrival?.iataCode,
        time: seg?.arrival?.at?.split('T')[1]?.substring(0, 5) || '',
        date: seg?.arrival?.at?.split('T')[0] || dep
      },
      duration: offer.itineraries[0]?.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm'),
      stops: (offer.itineraries[0]?.segments?.length || 1) - 1,
      price: parseFloat(offer.price.total),
      currency: offer.price.currency || 'GBP',
      bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${dest}`
    };
  });
}

async function scrapeGoogleFlights(origin: string, dest: string, date: string): Promise<any[]> {
  return scrapeGoogleFlightsReal(origin, dest, date, { maxResults: 8 });
}

async function scrapeSkyscanner(origin: string, dest: string, date: string): Promise<any[]> {
  return scrapeSkyscannerReal(origin, dest, date, { maxResults: 5 });
}

async function findSplitTicketsParallel(origin: string, dest: string, date: string, flights: any[]): Promise<any[]> {
  const { findSplitTickets } = await import('@/lib/split-engine');
  const cheapestDirect = flights[0]?.price || 1000;
  return findSplitTickets(origin, dest, date, cheapestDirect, { maxHubs: 3 });
}
