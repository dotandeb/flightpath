/**
 * Unified Scraper API - Aggregates results from all sources
 * Kayak, Expedia, Momondo, Google Flights, Skyscanner
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeKayak, closeBrowser as closeKayak } from '@/lib/scraper-kayak';
import { scrapeExpedia, closeBrowser as closeExpedia } from '@/lib/scraper-expedia';
import { scrapeMomondo, closeBrowser as closeMomondo } from '@/lib/scraper-momondo';
import { scrapeGoogleFlights, scrapeSkyscanner } from '@/lib/scraper-v2';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for hobby plan

interface FlightResult {
  id: string;
  airline: string;
  flightNumber: string;
  departure: { airport: string; time: string; };
  arrival: { airport: string; time: string; };
  duration: string;
  price: number;
  currency: string;
  stops: number;
  source: string;
  bookingLink: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const origin = searchParams.get('origin')?.toUpperCase() || '';
  const destination = searchParams.get('destination')?.toUpperCase() || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || undefined;
  const travelClass = searchParams.get('travelClass') || 'ECONOMY';
  const sources = searchParams.get('sources')?.split(',') || ['all'];
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }
  
  console.log(`[Unified Scraper] ${origin} → ${destination} | Sources: ${sources.join(',')}`);
  
  const startTime = Date.now();
  const allFlights: FlightResult[] = [];
  const errors: string[] = [];
  
  try {
    // Run scrapers in parallel with timeout
    const scraperPromises: Promise<void>[] = [];
    
    // Google Flights (most reliable)
    if (sources.includes('all') || sources.includes('google')) {
      scraperPromises.push(
        scrapeGoogleFlights(origin, destination, departureDate, { returnDate, travelClass, maxResults: 5 })
          .then(flights => {
            allFlights.push(...flights.map((f, i) => ({ ...f, source: 'Google Flights', id: `gf-${i}` })));
          })
          .catch(e => { errors.push(`Google Flights: ${e.message}`); })
      );
    }
    
    // Skyscanner
    if (sources.includes('all') || sources.includes('skyscanner')) {
      scraperPromises.push(
        scrapeSkyscanner(origin, destination, departureDate, { returnDate, travelClass, maxResults: 5 })
          .then(flights => {
            allFlights.push(...flights.map((f, i) => ({ ...f, source: 'Skyscanner', id: `ss-${i}` })));
          })
          .catch(e => { errors.push(`Skyscanner: ${e.message}`); })
      );
    }
    
    // Kayak
    if (sources.includes('all') || sources.includes('kayak')) {
      scraperPromises.push(
        scrapeKayak(origin, destination, departureDate, { returnDate, travelClass, maxResults: 5 })
          .then(flights => {
            allFlights.push(...flights.map((f, i) => ({ ...f, source: 'Kayak', id: `ky-${i}` })));
          })
          .catch(e => { errors.push(`Kayak: ${e.message}`); })
      );
    }
    
    // Expedia
    if (sources.includes('all') || sources.includes('expedia')) {
      scraperPromises.push(
        scrapeExpedia(origin, destination, departureDate, { returnDate, travelClass, maxResults: 5 })
          .then(flights => {
            allFlights.push(...flights.map((f, i) => ({ ...f, source: 'Expedia', id: `ex-${i}` })));
          })
          .catch(e => { errors.push(`Expedia: ${e.message}`); })
      );
    }
    
    // Momondo
    if (sources.includes('all') || sources.includes('momondo')) {
      scraperPromises.push(
        scrapeMomondo(origin, destination, departureDate, { returnDate, travelClass, maxResults: 5 })
          .then(flights => {
            allFlights.push(...flights.map((f, i) => ({ ...f, source: 'Momondo', id: `mm-${i}` })));
          })
          .catch(e => { errors.push(`Momondo: ${e.message}`); })
      );
    }
    
    // Wait for all scrapers with overall timeout
    await Promise.race([
      Promise.all(scraperPromises),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 55000))
    ]);
    
    // Deduplicate flights by airline + price
    const seen = new Set<string>();
    const uniqueFlights = allFlights.filter(f => {
      const key = `${f.airline}-${f.price}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Sort by price
    uniqueFlights.sort((a, b) => a.price - b.price);
    
    const searchTime = Date.now() - startTime;
    
    console.log(`[Unified Scraper] Completed in ${searchTime}ms, found ${uniqueFlights.length} unique flights`);
    
    return NextResponse.json({
      flights: uniqueFlights.slice(0, 15),
      meta: {
        searchTime,
        totalResults: allFlights.length,
        uniqueResults: uniqueFlights.length,
        sourcesSearched: sources,
        errors: errors.length > 0 ? errors : undefined
      }
    });
    
  } catch (error: any) {
    console.error('[Unified Scraper] Error:', error);
    return NextResponse.json(
      { 
        error: 'Scraping failed', 
        message: error.message,
        flights: allFlights
      },
      { status: 500 }
    );
  } finally {
    // Clean up browsers
    await Promise.all([
      closeKayak(),
      closeExpedia(),
      closeMomondo()
    ]);
  }
}
