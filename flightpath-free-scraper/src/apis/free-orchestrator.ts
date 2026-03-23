/**
 * FREE Orchestrator - No Paid APIs Required
 * 
 * Reads from GitHub Actions scraped data
 * Falls back to Amadeus free tier if available
 * Uses local cache for everything else
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { cache } from '../cache/index.js';

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  cabin?: 'economy' | 'premium' | 'business' | 'first';
}

export interface UnifiedFlight {
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

export interface SearchResult {
  flights: UnifiedFlight[];
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
async function readScrapedData(params: SearchParams): Promise<UnifiedFlight[] | null> {
  try {
    const filename = `${params.origin}-${params.destination}-${params.departureDate}.json`;
    const paths = [
      `./data/${filename}`,
      `../data/${filename}`,
      `/tmp/flight-data/${filename}`,
    ];

    for (const path of paths) {
      if (existsSync(path)) {
        console.log(`[FreeOrchestrator] Reading scraped data: ${path}`);
        const content = await readFile(path, 'utf-8');
        const data = JSON.parse(content);
        
        // Check if data is fresh (less than 24 hours old)
        const scrapedAt = new Date(data.scrapedAt);
        const age = Date.now() - scrapedAt.getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (age < maxAge) {
          return data.flights || [];
        } else {
          console.log(`[FreeOrchestrator] Data is stale (${Math.round(age / 3600000)}h old)`);
          return data.flights || null;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('[FreeOrchestrator] Error reading scraped data:', error);
    return null;
  }
}

/**
 * Search flights using FREE methods only
 */
export async function searchFree(params: SearchParams): Promise<SearchResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const sources: string[] = [];

  // 1. Check cache first
  const cacheKey = cache.generateKey(params);
  const cached = await cache.get<UnifiedFlight[]>(cacheKey);
  
  if (cached) {
    return {
      flights: cached,
      sources: ['cache'],
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
      await cache.set(cacheKey, scraped, 6);
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

  // 3. Try Amadeus free tier (if configured)
  const amadeusKey = process.env.AMADEUS_KEY;
  const amadeusSecret = process.env.AMADEUS_SECRET;
  
  if (amadeusKey && amadeusSecret) {
    try {
      const { amadeus } = await import('./amadeus.js');
      const results = await amadeus.search({
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.adults || 1,
        currencyCode: 'GBP',
        max: 20,
      });

      if (results.length > 0) {
        const flights: UnifiedFlight[] = results.map(f => ({
          id: f.id,
          price: f.price,
          currency: f.currency,
          airline: f.airline,
          airlineCode: f.airlineCode,
          flightNumber: f.flightNumber,
          origin: f.origin,
          destination: f.destination,
          departure: f.departure,
          arrival: f.arrival,
          duration: f.duration,
          durationMinutes: f.durationMinutes,
          stops: f.stops,
          cabin: f.cabin,
          source: 'amadeus',
          scrapedAt: new Date().toISOString(),
        }));

        await cache.set(cacheKey, flights, 6);
        sources.push('amadeus');

        return {
          flights,
          sources,
          errors,
          cached: false,
          searchTime: Date.now() - startTime,
          totalResults: flights.length,
        };
      }
    } catch (error) {
      errors.push(`Amadeus: ${error}`);
    }
  }

  // 4. Return empty with instructions
  return {
    flights: [],
    sources: [],
    errors: [
      ...errors,
      'No data available for this route. Options:',
      '1. Wait for GitHub Actions to scrape this route (runs every 6h)',
      '2. Add AMADEUS_KEY and AMADEUS_SECRET for instant results',
      '3. Request this route to be added to the scrape schedule',
    ],
    cached: false,
    searchTime: Date.now() - startTime,
    totalResults: 0,
  };
}

/**
 * Get available data sources
 */
export function getFreeSourcesStatus(): { 
  name: string; 
  available: boolean; 
  type: string;
  description: string;
}[] {
  const amadeusAvailable = !!(process.env.AMADEUS_KEY && process.env.AMADEUS_SECRET);
  
  return [
    { 
      name: 'GitHub Actions Scraped Data', 
      available: true, 
      type: 'scraper',
      description: 'Pre-scraped flight data (free, updated every 6h)'
    },
    { 
      name: 'Local Cache', 
      available: true, 
      type: 'cache',
      description: 'Cached results from previous searches'
    },
    { 
      name: 'Amadeus (Free Tier)', 
      available: amadeusAvailable, 
      type: 'api',
      description: amadeusAvailable 
        ? 'Free test environment - active' 
        : 'Free test environment - add keys to activate'
    },
  ];
}
