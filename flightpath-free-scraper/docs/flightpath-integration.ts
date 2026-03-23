/**
 * FlightPath Integration Client
 * 
 * Add this to your main FlightPath app to connect to the free scraper
 */

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:3002';

export interface ScraperSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  cabin?: 'economy' | 'premium' | 'business' | 'first';
}

export interface ScraperFlight {
  id: string;
  price: number;
  currency: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  durationMinutes: number;
  stops: number;
  cabin: string;
  source: string;
  bookingLink?: string;
}

export interface ScraperResponse {
  flights: ScraperFlight[];
  sources: string[];
  errors?: string[];
  cached: boolean;
  searchTime: number;
  totalResults: number;
  timestamp: string;
}

/**
 * Search flights using the free scraper service
 */
export async function searchWithFreeScraper(
  params: ScraperSearchParams
): Promise<ScraperResponse> {
  try {
    const response = await fetch(`${SCRAPER_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Scraper error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[FreeScraper] Search failed:', error);
    throw error;
  }
}

/**
 * Check if free scraper is available and get API status
 */
export async function checkScraperHealth(): Promise<{
  status: string;
  sources: { name: string; available: boolean; type: string }[];
}> {
  try {
    const response = await fetch(`${SCRAPER_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[FreeScraper] Health check failed:', error);
    return {
      status: 'unavailable',
      sources: [],
    };
  }
}

/**
 * Get cached results for a route
 */
export async function getCachedResults(
  origin: string,
  destination: string,
  departureDate: string
): Promise<ScraperFlight[] | null> {
  try {
    const routeKey = `${origin}-${destination}-${departureDate}`;
    const response = await fetch(`${SCRAPER_URL}/api/cached/${routeKey}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Cache fetch failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.flights;
  } catch (error) {
    console.error('[FreeScraper] Cache fetch failed:', error);
    return null;
  }
}

/**
 * Hybrid search: Try free scraper first, fallback to Amadeus
 * 
 * Add this to your existing search flow in FlightPath
 */
export async function hybridFlightSearch(
  params: ScraperSearchParams,
  amadeusFallback: (params: ScraperSearchParams) => Promise<any[]>
): Promise<{ flights: any[]; source: string }> {
  // 1. Check if free scraper is healthy
  const health = await checkScraperHealth();
  const hasAvailableAPI = health.sources.some(s => s.available);

  if (hasAvailableAPI) {
    try {
      // 2. Try free scraper
      console.log('[HybridSearch] Using free scraper...');
      const result = await searchWithFreeScraper(params);
      
      if (result.flights.length > 0) {
        return {
          flights: result.flights,
          source: result.sources.join(','),
        };
      }
    } catch (error) {
      console.error('[HybridSearch] Free scraper failed:', error);
    }
  }

  // 3. Fallback to Amadeus
  console.log('[HybridSearch] Falling back to Amadeus...');
  const flights = await amadeusFallback(params);
  return {
    flights,
    source: 'amadeus',
  };
}

// Example usage in your FlightPath app:
/*
import { hybridFlightSearch } from './lib/scraper-client';

// In your API route:
export async function GET(request: Request) {
  const params = {
    origin: 'LHR',
    destination: 'JFK',
    departureDate: '2025-06-15',
  };
  
  const { flights, source } = await hybridFlightSearch(
    params,
    (p) => searchWithAmadeus(p) // Your existing Amadeus function
  );
  
  return Response.json({ flights, source });
}
*/
