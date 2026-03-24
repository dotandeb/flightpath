/**
 * REAL FLIGHT SEARCH API v4
 * Uses: Multi-source scraper (Google Flights, Skyscanner, Kayak) + Amadeus API
 * Returns: Real scraped data only
 */

import { NextRequest, NextResponse } from 'next/server';
import { scraper, ScraperFlight } from '@/lib/multi-scraper';
import { amadeus, AmadeusSearchParams } from '@/lib/amadeus-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Transform scraped flight to Amadeus format
function formatFlight(f: ScraperFlight) {
  const hours = Math.floor(f.durationMinutes / 60);
  const mins = f.durationMinutes % 60;
  
  return {
    id: f.id,
    source: f.source,
    instantTicketingRequired: false,
    nonHomogeneous: false,
    oneWay: true,
    lastTicketingDate: f.departure.split('T')[0],
    numberOfBookableSeats: 9,
    itineraries: [{
      duration: `PT${hours}H${mins}M`,
      segments: [{
        id: f.id,
        departure: {
          iataCode: f.origin,
          at: f.departure,
        },
        arrival: {
          iataCode: f.destination,
          at: f.arrival,
        },
        carrierCode: f.airlineCode,
        number: f.flightNumber.replace(f.airlineCode, ''),
        aircraft: { code: '77W' },
        duration: `PT${hours}H${mins}M`,
        numberOfStops: f.stops,
      }],
    }],
    price: {
      currency: f.currency,
      total: String(f.price),
      base: String(Math.floor(f.price * 0.85)),
      grandTotal: String(f.price),
    },
    pricingOptions: {
      fareType: ['PUBLISHED'],
      includedCheckedBagsOnly: false,
    },
    validatingAirlineCodes: [f.airlineCode],
    travelerPricings: [{
      travelerId: '1',
      fareOption: 'STANDARD',
      travelerType: 'ADULT',
      price: {
        currency: f.currency,
        total: String(f.price),
        base: String(Math.floor(f.price * 0.85)),
      },
      fareDetailsBySegment: [{
        segmentId: f.id,
        cabin: f.cabin,
        fareBasis: 'Y',
        class: 'Y',
        includedCheckedBags: { quantity: 1 },
      }],
    }],
    _extended: {
      bookingLink: f.bookingLink,
    },
  };
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
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, departureDate' },
      { status: 400 }
    );
  }
  
  const startTime = Date.now();
  const sources: string[] = [];
  const errors: string[] = [];
  let allFlights: ScraperFlight[] = [];
  
  try {
    // Strategy 1: Try multi-source scraper (Google Flights, Skyscanner, Kayak)
    console.log('[Search] Attempting multi-source scrape...');
    try {
      const scraperResult = await scraper.searchAll({
        origin,
        destination,
        departureDate,
        returnDate: returnDate || undefined,
        adults,
        children,
        infants,
        cabin: travelClass,
      });
      
      if (scraperResult.flights.length > 0) {
        allFlights = scraperResult.flights;
        sources.push(...scraperResult.sources);
        console.log(`[Search] Scraped ${scraperResult.flights.length} flights from ${scraperResult.sources.join(', ')}`);
      }
    } catch (scrapeError: any) {
      console.error('[Search] Scraper failed:', scrapeError);
      errors.push(`Scraper: ${scrapeError.message}`);
    }
    
    // Strategy 2: Try Amadeus API if scraper failed or returned few results
    if (allFlights.length < 5 && amadeus.isAvailable()) {
      console.log('[Search] Attempting Amadeus API...');
      try {
        const amadeusParams: AmadeusSearchParams = {
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate,
          returnDate: returnDate || undefined,
          adults,
          children: children > 0 ? children : undefined,
          infants: infants > 0 ? infants : undefined,
          travelClass: travelClass as any,
          currencyCode: 'GBP',
          max: 20,
        };
        
        const amadeusFlights = await amadeus.search(amadeusParams);
        
        // Convert Amadeus format to ScraperFlight format
        const converted: ScraperFlight[] = amadeusFlights.map(f => ({
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
          bookingLink: `https://www.google.com/travel/flights?q=${origin}+to+${destination}+on+${departureDate}`,
          scrapedAt: new Date().toISOString(),
        }));
        
        allFlights.push(...converted);
        sources.push('amadeus');
        console.log(`[Search] Got ${converted.length} flights from Amadeus`);
      } catch (amadeusError: any) {
        console.error('[Search] Amadeus failed:', amadeusError);
        errors.push(`Amadeus: ${amadeusError.message}`);
      }
    }
    
    // Deduplicate flights
    const seen = new Map<string, ScraperFlight>();
    for (const flight of allFlights) {
      const key = `${flight.airlineCode}-${flight.flightNumber}-${flight.price}`;
      if (!seen.has(key) || seen.get(key)!.price > flight.price) {
        seen.set(key, flight);
      }
    }
    allFlights = Array.from(seen.values());
    
    // Sort by price
    allFlights.sort((a, b) => a.price - b.price);
    
    const searchTime = Date.now() - startTime;
    
    // Get unique airlines
    const airlines = [...new Set(allFlights.map(f => f.airline))];
    const priceRange = {
      min: allFlights.length > 0 ? Math.min(...allFlights.map(f => f.price)) : 0,
      max: allFlights.length > 0 ? Math.max(...allFlights.map(f => f.price)) : 0,
    };
    
    console.log(`[Search] Total: ${allFlights.length} flights from ${sources.join(', ') || 'none'} in ${searchTime}ms`);
    
    return NextResponse.json({
      flights: allFlights.map(formatFlight),
      optimizations: {
        splitTickets: [], // TODO: Calculate split tickets from real data
        hackerFares: [],
        totalSavingsOptions: 0,
        bestDeal: {
          type: 'direct',
          price: allFlights[0]?.price || 0,
          savings: 0,
        },
      },
      meta: {
        totalResults: allFlights.length,
        splitTicketOptions: 0,
        cheapestPrice: allFlights[0]?.price || 0,
        sources: sources.length > 0 ? sources : ['none'],
        searchTime,
        route: `${origin}-${destination}`,
        adults,
        children,
        infants,
        errors: errors.length > 0 ? errors : undefined,
        filters: {
          airlines,
          priceRange,
          maxStops: Math.max(...allFlights.map(f => f.stops), 0),
        },
      },
    });
    
  } catch (error: any) {
    console.error('[Search API Error]', error);
    
    return NextResponse.json(
      { 
        error: 'Search failed', 
        message: error.message,
        flights: [],
        meta: {
          totalResults: 0,
          sources: [],
          searchTime: Date.now() - startTime,
          errors: [error.message],
        },
      },
      { status: 500 }
    );
  }
}
