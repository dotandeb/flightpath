/**
 * MULTI-SOURCE FLIGHT DATA ENGINE
 * Aggregates: Kiwi.com (Tequila) + Amadeus + Skyscanner + Ryanair
 * Implements: Route expansion, virtual interlining, hacker fares
 */

import { freeCache } from '../free-scraper/cache';

// API Keys from environment
const KIWI_API_KEY = process.env.KIWI_API_KEY || '';
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY || '';
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET || '';
const SKYSCANNER_API_KEY = process.env.SKYSCANNER_API_KEY || '';

// Airport expansion map for nearby airports
export const NEARBY_AIRPORTS: Record<string, string[]> = {
  'LON': ['LHR', 'LGW', 'STN', 'LTN', 'LCY', 'SEN'],
  'PAR': ['CDG', 'ORY', 'BVA'],
  'NYC': ['JFK', 'LGA', 'EWR'],
  'CHI': ['ORD', 'MDW'],
  'TYO': ['NRT', 'HND'],
  'BKK': ['BKK', 'DMK'],
  'IST': ['IST', 'SAW'],
  'MIL': ['MXP', 'LIN', 'BGY'],
  'ROM': ['FCO', 'CIA'],
  'BER': ['BER', 'SXF'],
  'LAX': ['LAX', 'BUR', 'LGB', 'SNA'],
  'SFO': ['SFO', 'OAK', 'SJC'],
  'DXB': ['DXB', 'DWC', 'SHJ'],
  'SIN': ['SIN', 'XSP'],
};

// Major hub airports for connection optimization
export const HUBS = {
  europe: ['LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'FCO', 'IST', 'MUC', 'ZUR', 'VIE', 'CPH', 'OSL', 'ARN', 'DUB', 'BCN'],
  middleEast: ['DXB', 'DOH', 'AUH', 'IST'],
  asia: ['SIN', 'HKG', 'BKK', 'NRT', 'ICN', 'KUL', 'TPE'],
  us: ['JFK', 'LAX', 'SFO', 'ORD', 'ATL', 'DFW', 'DEN', 'SEA', 'MIA'],
};

export interface UnifiedFlight {
  id: string;
  source: 'kiwi' | 'amadeus' | 'skyscanner' | 'ryanair' | 'internal';
  price: number;
  currency: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: number; // minutes
  stops: number;
  segments: FlightSegment[];
  bookingLink?: string;
  baggage?: {
    cabin?: string;
    checked?: string;
  };
}

export interface FlightSegment {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: number;
}

export interface HackerFare {
  id: string;
  type: 'hacker';
  outbound: UnifiedFlight;
  return?: UnifiedFlight;
  totalPrice: number;
  savings: number;
  airlines: string[];
}

export interface SplitTicket {
  id: string;
  type: 'split';
  tickets: UnifiedFlight[];
  totalPrice: number;
  savings: number;
  layovers: string[];
}

// ============================================================================
// KIWI.COM (TEQUILA) API - FREE TIER
// ============================================================================

export class KiwiAPI {
  private baseUrl = 'https://api.tequila.kiwi.com/v2';
  
  isAvailable(): boolean {
    return !!KIWI_API_KEY;
  }

  async search(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults?: number;
  }): Promise<UnifiedFlight[]> {
    if (!this.isAvailable()) {
      console.log('[Kiwi] API key not configured');
      return [];
    }

    try {
      // Convert YYYY-MM-DD to DD/MM/YYYY for Kiwi
      const dateToKiwi = (date: string) => {
        const [y, m, d] = date.split('-');
        return `${d}/${m}/${y}`;
      };

      const query = new URLSearchParams({
        fly_from: params.origin,
        fly_to: params.destination,
        date_from: dateToKiwi(params.departureDate),
        date_to: dateToKiwi(params.departureDate),
        adults: String(params.adults || 1),
        curr: 'GBP',
        limit: '50',
        sort: 'price',
      });

      if (params.returnDate) {
        query.append('return_from', dateToKiwi(params.returnDate));
        query.append('return_to', dateToKiwi(params.returnDate));
      }

      console.log(`[Kiwi] Searching: ${params.origin} → ${params.destination}`);
      
      const response = await fetch(`${this.baseUrl}/search?${query}`, {
        headers: {
          'apikey': KIWI_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Kiwi] API error:', response.status, error);
        return [];
      }

      const data = await response.json();
      return this.transform(data.data || []);
    } catch (error) {
      console.error('[Kiwi] Search error:', error);
      return [];
    }
  }

  // Search nearby airports
  async searchNearby(params: {
    originCity: string;
    destinationCity: string;
    departureDate: string;
    returnDate?: string;
    adults?: number;
  }): Promise<UnifiedFlight[]> {
    const origins = NEARBY_AIRPORTS[params.originCity] || [params.originCity];
    const destinations = NEARBY_AIRPORTS[params.destinationCity] || [params.destinationCity];
    
    const results: UnifiedFlight[] = [];
    
    // Search all combinations
    for (const origin of origins) {
      for (const dest of destinations) {
        const flights = await this.search({
          origin,
          destination: dest,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          adults: params.adults,
        });
        results.push(...flights);
      }
    }
    
    return results.sort((a, b) => a.price - b.price);
  }

  private transform(data: any[]): UnifiedFlight[] {
    return data.map((item, idx) => {
      const segments = item.route?.map((r: any) => ({
        airline: r.airline,
        airlineCode: r.airline,
        flightNumber: `${r.airline}${r.flight_no}`,
        origin: r.flyFrom,
        destination: r.flyTo,
        departure: r.local_departure,
        arrival: r.local_arrival,
        duration: r.duration?.flight || 0,
      })) || [];

      return {
        id: `kiwi-${item.id || idx}`,
        source: 'kiwi',
        price: item.price,
        currency: item.conversion?.GBP ? 'GBP' : 'EUR',
        airline: item.airlines?.[0] || 'Unknown',
        airlineCode: item.airlines?.[0] || 'XX',
        flightNumber: segments[0]?.flightNumber || 'XX000',
        origin: item.flyFrom,
        destination: item.flyTo,
        departure: item.local_departure,
        arrival: item.local_arrival,
        duration: item.duration?.total || 0,
        stops: (item.route?.length || 1) - 1,
        segments,
        bookingLink: item.deep_link,
        baggage: {
          cabin: item.baglimit?.hand_weight ? `${item.baglimit.hand_weight}kg` : undefined,
          checked: item.bags_price?.[1] ? 'Paid' : 'Not included',
        },
      };
    });
  }
}

// ============================================================================
// AMADEUS API - PRODUCTION (requires paid or test keys)
// ============================================================================

export class AmadeusAPI {
  private baseUrl = 'https://api.amadeus.com/v2';
  private testUrl = 'https://test.api.amadeus.com/v2';
  private token: string | null = null;
  private tokenExpiry = 0;

  isAvailable(): boolean {
    return !!(AMADEUS_API_KEY && AMADEUS_API_SECRET);
  }

  private async getToken(): Promise<string | null> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: AMADEUS_API_KEY,
          client_secret: AMADEUS_API_SECRET,
        }),
      });

      if (!response.ok) {
        console.log('[Amadeus] Production auth failed, trying test environment');
        return this.getTestToken();
      }

      const data = await response.json();
      this.token = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      return this.token;
    } catch {
      return this.getTestToken();
    }
  }

  private async getTestToken(): Promise<string | null> {
    try {
      const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: AMADEUS_API_KEY,
          client_secret: AMADEUS_API_SECRET,
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      this.token = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      return this.token;
    } catch {
      return null;
    }
  }

  async search(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults?: number;
  }): Promise<UnifiedFlight[]> {
    const token = await this.getToken();
    if (!token) {
      console.log('[Amadeus] No token available');
      return [];
    }

    try {
      const query = new URLSearchParams({
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departureDate,
        adults: String(params.adults || 1),
        currencyCode: 'GBP',
        max: '50',
      });

      if (params.returnDate) query.append('returnDate', params.returnDate);

      console.log(`[Amadeus] Searching: ${params.origin} → ${params.destination}`);

      const response = await fetch(`${this.baseUrl}/shopping/flight-offers?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('[Amadeus] API error:', response.status);
        return [];
      }

      const data = await response.json();
      return this.transform(data.data || []);
    } catch (error) {
      console.error('[Amadeus] Search error:', error);
      return [];
    }
  }

  private transform(data: any[]): UnifiedFlight[] {
    return data.map((offer, idx) => {
      const itinerary = offer.itineraries?.[0];
      const segment = itinerary?.segments?.[0];
      
      if (!segment) return null;

      const segments = itinerary.segments.map((s: any) => ({
        airline: s.carrierCode,
        airlineCode: s.carrierCode,
        flightNumber: `${s.carrierCode}${s.number}`,
        origin: s.departure.iataCode,
        destination: s.arrival.iataCode,
        departure: s.departure.at,
        arrival: s.arrival.at,
        duration: this.parseDuration(s.duration),
      }));

      return {
        id: `amadeus-${offer.id || idx}`,
        source: 'amadeus',
        price: parseFloat(offer.price.total),
        currency: offer.price.currency,
        airline: offer.validatingAirlineCodes?.[0] || segment.carrierCode,
        airlineCode: offer.validatingAirlineCodes?.[0] || segment.carrierCode,
        flightNumber: `${segment.carrierCode}${segment.number}`,
        origin: segment.departure.iataCode,
        destination: segment.arrival.iataCode,
        departure: segment.departure.at,
        arrival: segment.arrival.at,
        duration: this.parseDuration(itinerary.duration),
        stops: segments.length - 1,
        segments,
      };
    }).filter(Boolean) as UnifiedFlight[];
  }

  private parseDuration(duration: string): number {
    if (!duration) return 0;
    const hours = parseInt(duration.match(/(\d+)H/)?.[1] || '0');
    const mins = parseInt(duration.match(/(\d+)M/)?.[1] || '0');
    return hours * 60 + mins;
  }
}

// ============================================================================
// UNIFIED SEARCH ORCHESTRATOR
// ============================================================================

export class FlightDataEngine {
  private kiwi = new KiwiAPI();
  private amadeus = new AmadeusAPI();

  async search(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults?: number;
    expandNearby?: boolean;
  }): Promise<{
    flights: UnifiedFlight[];
    hackerFares: HackerFare[];
    splitTickets: SplitTicket[];
    sources: string[];
  }> {
    const sources: string[] = [];
    let allFlights: UnifiedFlight[] = [];

    // Parallel search across all APIs
    const [kiwiResults, amadeusResults] = await Promise.all([
      this.kiwi.search(params).then(r => { if (r.length) sources.push('Kiwi'); return r; }),
      this.amadeus.search(params).then(r => { if (r.length) sources.push('Amadeus'); return r; }),
    ]);

    allFlights = [...kiwiResults, ...amadeusResults];

    // Nearby airport expansion
    if (params.expandNearby && allFlights.length < 10) {
      const nearbyFlights = await this.searchNearbyAirports(params);
      allFlights.push(...nearbyFlights);
      if (nearbyFlights.length) sources.push('NearbyAirports');
    }

    // Deduplicate
    allFlights = this.deduplicate(allFlights);

    // Sort by price
    allFlights.sort((a, b) => a.price - b.price);

    // Generate hacker fares
    const hackerFares = this.generateHackerFares(allFlights, params);

    // Generate split tickets
    const splitTickets = this.generateSplitTickets(allFlights, params);

    return {
      flights: allFlights,
      hackerFares,
      splitTickets,
      sources,
    };
  }

  private async searchNearbyAirports(params: any): Promise<UnifiedFlight[]> {
    // Find city codes
    const originCity = Object.keys(NEARBY_AIRPORTS).find(city => 
      NEARBY_AIRPORTS[city].includes(params.origin)
    );
    const destCity = Object.keys(NEARBY_AIRPORTS).find(city => 
      NEARBY_AIRPORTS[city].includes(params.destination)
    );

    if (!originCity && !destCity) return [];

    return this.kiwi.searchNearby({
      originCity: originCity || params.origin,
      destinationCity: destCity || params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults,
    });
  }

  private deduplicate(flights: UnifiedFlight[]): UnifiedFlight[] {
    const seen = new Set<string>();
    return flights.filter(f => {
      const key = `${f.airlineCode}-${f.flightNumber}-${f.departure}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private generateHackerFares(
    flights: UnifiedFlight[],
    params: any
  ): HackerFare[] {
    if (!params.returnDate || flights.length < 4) return [];

    const outbound = flights.filter(f => f.origin === params.origin);
    const inbound = flights.filter(f => f.origin === params.destination);
    
    const hackerFares: HackerFare[] = [];
    const cheapestRoundTrip = flights.find(f => 
      f.destination === params.destination && f.returnDate
    );

    for (const out of outbound.slice(0, 5)) {
      for (const ret of inbound.slice(0, 5)) {
        // Different airlines = potential hacker fare
        if (out.airlineCode !== ret.airlineCode) {
          const totalPrice = out.price + ret.price;
          const cheapestPrice = cheapestRoundTrip?.price || totalPrice;
          const savings = cheapestPrice - totalPrice;

          if (savings > 20) {
            hackerFares.push({
              id: `hacker-${out.id}-${ret.id}`,
              type: 'hacker',
              outbound: out,
              return: ret,
              totalPrice,
              savings,
              airlines: [out.airlineCode, ret.airlineCode],
            });
          }
        }
      }
    }

    return hackerFares.sort((a, b) => b.savings - a.savings).slice(0, 5);
  }

  private generateSplitTickets(
    flights: UnifiedFlight[],
    params: any
  ): SplitTicket[] {
    if (flights.length === 0) return [];

    const cheapestDirect = flights[0];
    const splitTickets: SplitTicket[] = [];

    // Get relevant hubs based on route
    const hubs = this.getRelevantHubs(params.origin, params.destination);

    for (const hub of hubs) {
      // Find flights to hub and from hub
      const toHub = flights.find(f => f.destination === hub);
      const fromHub = flights.find(f => f.origin === hub && f.destination === params.destination);

      if (toHub && fromHub) {
        const totalPrice = toHub.price + fromHub.price;
        const savings = cheapestDirect.price - totalPrice;

        if (savings > 30) {
          splitTickets.push({
            id: `split-${hub}-${Date.now()}`,
            type: 'split',
            tickets: [toHub, fromHub],
            totalPrice,
            savings,
            layovers: [hub],
          });
        }
      }
    }

    return splitTickets.sort((a, b) => b.savings - a.savings).slice(0, 3);
  }

  private getRelevantHubs(origin: string, destination: string): string[] {
    // Determine which hub region to use
    const allHubs = [...HUBS.europe, ...HUBS.middleEast, ...HUBS.asia, ...HUBS.us];
    return allHubs.filter(h => h !== origin && h !== destination);
  }
}

export const flightEngine = new FlightDataEngine();
