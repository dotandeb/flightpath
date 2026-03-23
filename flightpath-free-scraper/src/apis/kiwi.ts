/**
 * Kiwi.com (Tequila) API Integration
 * Free tier: Unlimited calls with API key
 * Best for: Price search, multi-city, "anywhere" queries
 * Docs: https://tequila.kiwi.com/portal/docs/tequila_api
 */

export interface KiwiSearchParams {
  fly_from: string;           // Origin airport (IATA or "LON" for London area)
  fly_to: string;             // Destination (IATA or "anywhere")
  date_from: string;          // DD/MM/YYYY
  date_to: string;            // DD/MM/YYYY
  return_from?: string;       // DD/MM/YYYY
  return_to?: string;         // DD/MM/YYYY
  adults?: number;
  children?: number;
  infants?: number;
  selected_cabins?: 'M' | 'W' | 'C' | 'F'; // Economy, Premium, Business, First
  curr?: string;              // Currency (GBP, USD, EUR)
  limit?: number;
  sort?: 'price' | 'duration' | 'quality' | 'date';
}

export interface KiwiFlight {
  id: string;
  price: number;
  currency: string;
  airline: string;
  flight_number: string;
  departure: {
    airport: string;
    time: string;
    city: string;
  };
  arrival: {
    airport: string;
    time: string;
    city: string;
  };
  duration: {
    total: number; // minutes
    departure: number;
    return?: number;
  };
  stops: number;
  booking_link: string;
  segments: KiwiSegment[];
}

interface KiwiSegment {
  airline: string;
  flight_number: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
}

const KIWI_API_KEY = process.env.KIWI_API_KEY || '';
const BASE_URL = 'https://api.tequila.kiwi.com/v2';

export class KiwiAPI {
  private headers: Record<string, string>;

  constructor(apiKey: string = KIWI_API_KEY) {
    this.headers = {
      'apikey': apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Search for flights using Kiwi.com Tequila API
   */
  async search(params: KiwiSearchParams): Promise<KiwiFlight[]> {
    if (!this.headers.apikey) {
      throw new Error('Kiwi API key not configured. Get free key at https://tequila.kiwi.com/');
    }

    try {
      const queryParams = new URLSearchParams({
        fly_from: params.fly_from,
        fly_to: params.fly_to,
        date_from: params.date_from,
        date_to: params.date_to,
        curr: params.curr || 'GBP',
        limit: String(params.limit || 20),
        sort: params.sort || 'price',
        adults: String(params.adults || 1),
      });

      if (params.return_from) queryParams.append('return_from', params.return_from);
      if (params.return_to) queryParams.append('return_to', params.return_to);
      if (params.selected_cabins) queryParams.append('selected_cabins', params.selected_cabins);

      const url = `${BASE_URL}/search?${queryParams}`;
      console.log(`[Kiwi] Searching: ${params.fly_from} → ${params.fly_to}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Kiwi API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return this.transformResults(data.data || []);
    } catch (error) {
      console.error('[Kiwi] Search failed:', error);
      throw error;
    }
  }

  /**
   * Search for flights from a location to "anywhere" - great for inspiration
   */
  async searchAnywhere(from: string, dateFrom: string, dateTo: string, maxPrice?: number): Promise<KiwiFlight[]> {
    return this.search({
      fly_from: from,
      fly_to: 'anywhere',
      date_from: dateFrom,
      date_to: dateTo,
      limit: 50,
    });
  }

  /**
   * Get nearby airports for a city
   */
  async getLocations(term: string): Promise<any[]> {
    if (!this.headers.apikey) {
      return [];
    }

    try {
      const response = await fetch(
        `${BASE_URL}/locations/query?term=${encodeURIComponent(term)}&locale=en-US&location_types=airport&limit=10`,
        { headers: this.headers }
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.locations || [];
    } catch (error) {
      console.error('[Kiwi] Location search failed:', error);
      return [];
    }
  }

  private transformResults(data: any[]): KiwiFlight[] {
    return data.map((item: any) => ({
      id: item.id,
      price: item.price,
      currency: item.conversion?.GBP ? 'GBP' : 'EUR',
      airline: item.airlines?.[0] || 'Unknown',
      flight_number: item.route?.[0]?.flight_no || 'TBD',
      departure: {
        airport: item.flyFrom,
        time: item.local_departure,
        city: item.cityFrom,
      },
      arrival: {
        airport: item.flyTo,
        time: item.local_arrival,
        city: item.cityTo,
      },
      duration: {
        total: item.duration?.total || 0,
        departure: item.duration?.departure || 0,
        return: item.duration?.return || 0,
      },
      stops: item.route?.length ? item.route.length - 1 : 0,
      booking_link: item.deep_link || '',
      segments: (item.route || []).map((r: any) => ({
        airline: r.airline,
        flight_number: r.flight_no,
        from: r.flyFrom,
        to: r.flyTo,
        departure: r.local_departure,
        arrival: r.local_arrival,
      })),
    }));
  }

  /**
   * Check if API is configured and available
   */
  isAvailable(): boolean {
    return !!this.headers.apikey;
  }
}

// Default instance
export const kiwi = new KiwiAPI();
