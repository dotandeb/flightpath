/**
 * FREE Scraper Orchestrator - No Paid APIs Required
 * Integrated into main FlightPath app
 * 
 * Reads from GitHub Actions scraped data
 * Falls back to Amadeus free tier if available
 * Uses local cache
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { freeCache } from './cache';

export interface FreeSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  cabin?: 'economy' | 'premium' | 'business' | 'first';
}

export interface FreeFlight {
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
  scrapedAt: string;
  bookingLink?: string;
}

export interface FreeSearchResult {
  flights: FreeFlight[];
  sources: string[];
  errors: string[];
  cached: boolean;
  searchTime: number;
  totalResults: number;
  stale?: boolean;
}

/**
 * Read scraped data from GitHub Actions output
 */
async function readScrapedData(params: FreeSearchParams): Promise<FreeFlight[] | null> {
  try {
    const filename = `${params.origin}-${params.destination}-${params.departureDate}.json`;
    // Check in flightpath-free-scraper/data directory
    const paths = [
      `./flightpath-free-scraper/data/${filename}`,
      `../flightpath-free-scraper/data/${filename}`,
      `/tmp/flight-data/${filename}`,
    ];

    for (const path of paths) {
      if (existsSync(path)) {
        console.log(`[FreeScraper] Reading scraped data: ${path}`);
        const content = await readFile(path, 'utf-8');
        const data = JSON.parse(content);
        
        // Check if data is fresh (less than 24 hours old)
        const scrapedAt = new Date(data.scrapedAt);
        const age = Date.now() - scrapedAt.getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (age < maxAge) {
          return data.flights || [];
        } else {
          console.log(`[FreeScraper] Data is stale (${Math.round(age / 3600000)}h old)`);
          return data.flights || null;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('[FreeScraper] Error reading scraped data:', error);
    return null;
  }
}

/**
 * Search flights using FREE methods only
 */
export async function searchFree(params: FreeSearchParams): Promise<FreeSearchResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const sources: string[] = [];

  // 1. Check cache first
  const cacheKey = freeCache.generateKey(params);
  const cached = await freeCache.get<FreeFlight[]>(cacheKey);
  
  if (cached) {
    return {
      flights: cached,
      sources: ['free-cache'],
      errors: [],
      cached: true,
      searchTime: Date.now() - startTime,
      totalResults: cached.length,
    };
  }

  // 2. Try GitHub Actions scraped data
  const scraped = await readScrapedData(params);
  
  if (scraped) {
    const isStale = scraped.length > 0 && 
      (Date.now() - new Date(scraped[0]?.scrapedAt || 0).getTime()) > 24 * 60 * 60 * 1000;
    
    if (!isStale) {
      await freeCache.set(cacheKey, scraped, 6);
      sources.push('github-actions');
      
      return {
        flights: scraped,
        sources,
        errors,
        cached: false,
        searchTime: Date.now() - startTime,
        totalResults: scraped.length,
      };
    }
    
    // Stale data - return it but mark as stale
    sources.push('github-actions-stale');
    
    return {
      flights: scraped,
      sources,
      errors: ['Data is stale (older than 24h)'],
      cached: false,
      searchTime: Date.now() - startTime,
      totalResults: scraped.length,
      stale: true,
    };
  }

  // 3. Return empty - no free data available
  return {
    flights: [],
    sources: [],
    errors: [
      'No free scraped data available for this route.',
      'The GitHub Actions scraper runs every 6 hours for popular routes.',
    ],
    cached: false,
    searchTime: Date.now() - startTime,
    totalResults: 0,
  };
}

/**
 * Convert free scraper flights to FlightPath format
 */
export function convertFreeFlights(freeFlights: FreeFlight[]): any[] {
  return freeFlights.map(f => ({
    id: f.id,
    price: {
      total: String(f.price),
      currency: f.currency,
    },
    validatingAirlineCodes: [f.airlineCode],
    itineraries: [{
      segments: [{
        number: f.flightNumber.replace(f.airlineCode, ''),
        carrierCode: f.airlineCode,
        airlineName: f.airline,
        departure: {
          iataCode: f.origin,
          at: f.departure,
        },
        arrival: {
          iataCode: f.destination,
          at: f.arrival,
        },
      }],
      duration: f.duration,
    }],
    source: 'FREE_SCRAPER',
  }));
}

/**
 * Check if free scraper is available (always true, but may return empty)
 */
export function isFreeScraperAvailable(): boolean {
  return true;
}
