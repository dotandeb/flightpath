/**
 * FlightPath Scraper Client
 * Integrates with external scraper service for real-time flight data
 */

export interface ScraperSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  cabin?: 'economy' | 'premium_economy' | 'business' | 'first';
}

export interface ScraperFlight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  durationMinutes: number;
  stops: number;
  price: number;
  currency: string;
  cabin: string;
  source: string;
  scrapedAt: string;
  bookingLink?: string;
}

export interface ScraperResponse {
  flights: ScraperFlight[];
  source: string;
  searchTime: number;
  cached: boolean;
  totalResults: number;
  errors?: string[];
}

const SCRAPER_API_URL = process.env.SCRAPER_API_URL || '';
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

/**
 * Check if scraper service is configured
 */
export function isScraperAvailable(): boolean {
  return !!SCRAPER_API_URL;
}

/**
 * Search flights via scraper service with timeout protection
 */
export async function searchScraper(
  params: ScraperSearchParams,
  timeoutMs = 30000
): Promise<ScraperFlight[]> {
  if (!isScraperAvailable()) {
    console.log('[Scraper] Not configured, skipping');
    return [];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log('[Scraper] Searching:', params);
    
    const response = await fetch(`${SCRAPER_API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SCRAPER_API_KEY && { 'X-API-Key': SCRAPER_API_KEY })
      },
      body: JSON.stringify(params),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      console.error('[Scraper] HTTP error:', response.status, error);
      return [];
    }

    const data: ScraperResponse = await response.json();
    console.log(`[Scraper] Found ${data.flights.length} flights (${data.cached ? 'cached' : 'fresh'})`);
    
    return data.flights;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[Scraper] Request timed out');
    } else {
      console.error('[Scraper] Search error:', error);
    }
    
    // Return empty array - don't break the site
    return [];
  }
}

/**
 * Check scraper health
 */
export async function checkScraperHealth(): Promise<{
  available: boolean;
  status?: string;
  scrapers?: string[];
}> {
  if (!isScraperAvailable()) {
    return { available: false };
  }

  try {
    const response = await fetch(`${SCRAPER_API_URL}/health`, {
      cache: 'no-cache'
    });

    if (!response.ok) {
      return { available: false };
    }

    const data = await response.json();
    return {
      available: true,
      status: data.status,
      scrapers: data.scrapers
    };
  } catch {
    return { available: false };
  }
}

/**
 * Convert scraper flights to FlightPath format
 */
export function convertScraperFlights(scraperFlights: ScraperFlight[]): any[] {
  return scraperFlights.map(f => ({
    id: f.id,
    source: f.source.toUpperCase(),
    instantTicketingRequired: false,
    nonHomogeneous: false,
    oneWay: true,
    lastTicketingDate: f.departureTime.split('T')[0],
    numberOfBookableSeats: 9,
    itineraries: [{
      duration: `PT${Math.floor(f.durationMinutes / 60)}H${f.durationMinutes % 60}M`,
      segments: [{
        id: f.id,
        departure: {
          iataCode: f.origin,
          at: f.departureTime
        },
        arrival: {
          iataCode: f.destination,
          at: f.arrivalTime
        },
        carrierCode: f.airlineCode,
        number: f.flightNumber.replace(f.airlineCode, ''),
        aircraft: { code: '77W' },
        duration: `PT${Math.floor(f.durationMinutes / 60)}H${f.durationMinutes % 60}M`,
        numberOfStops: f.stops
      }]
    }],
    price: {
      currency: f.currency,
      total: f.price.toString(),
      base: Math.floor(f.price * 0.85).toString(),
      grandTotal: f.price.toString()
    },
    pricingOptions: {
      fareType: ['PUBLISHED'],
      includedCheckedBagsOnly: false
    },
    validatingAirlineCodes: [f.airlineCode],
    travelerPricings: [{
      travelerId: '1',
      fareOption: 'STANDARD',
      travelerType: 'ADULT',
      price: {
        currency: f.currency,
        total: f.price.toString(),
        base: Math.floor(f.price * 0.85).toString()
      },
      fareDetailsBySegment: [{
        segmentId: f.id,
        cabin: f.cabin.toUpperCase(),
        fareBasis: 'Y',
        class: 'Y',
        includedCheckedBags: { quantity: 1 }
      }]
    }],
    // Extended fields for UI
    _extended: {
      scrapedAt: f.scrapedAt,
      bookingLink: f.bookingLink
    }
  }));
}