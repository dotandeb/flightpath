/**
 * Amadeus API Client
 * Uses test environment (free tier) or production if keys available
 */

export interface AmadeusSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  maxPrice?: number;
  currencyCode?: string;
  max?: number;
}

export interface AmadeusFlight {
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
  seatsAvailable?: number;
  bookingClass?: string;
}

const AMADEUS_KEY = process.env.AMADEUS_KEY || process.env.AMADEUS_API_KEY || '';
const AMADEUS_SECRET = process.env.AMADEUS_SECRET || process.env.AMADEUS_API_SECRET || '';

// Use test API by default, production if specified
const BASE_URL = process.env.AMADEUS_PRODUCTION === 'true' 
  ? 'https://api.amadeus.com'
  : 'https://test.api.amadeus.com';

export class AmadeusAPI {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private apiKey: string = AMADEUS_KEY,
    private apiSecret: string = AMADEUS_SECRET
  ) {}

  /**
   * Get OAuth access token
   */
  private async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.apiSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      console.log('[Amadeus] Authenticated successfully');
      return this.accessToken;
    } catch (error) {
      console.error('[Amadeus] Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Search for flight offers
   */
  async search(params: AmadeusSearchParams): Promise<AmadeusFlight[]> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Amadeus credentials not configured');
    }

    const token = await this.authenticate();

    const queryParams = new URLSearchParams({
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      adults: String(params.adults || 1),
      currencyCode: params.currencyCode || 'GBP',
      max: String(params.max || 20),
    });

    if (params.returnDate) queryParams.append('returnDate', params.returnDate);
    if (params.travelClass) queryParams.append('travelClass', params.travelClass);
    if (params.maxPrice) queryParams.append('maxPrice', String(params.maxPrice));
    if (params.children) queryParams.append('children', String(params.children));
    if (params.infants) queryParams.append('infants', String(params.infants));

    console.log(`[Amadeus] Searching: ${params.originLocationCode} → ${params.destinationLocationCode}`);

    const response = await fetch(
      `${BASE_URL}/v2/shopping/flight-offers?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Amadeus API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.transformResults(data.data || []);
  }

  /**
   * Get airport/city search
   */
  async searchLocations(keyword: string): Promise<any[]> {
    if (!this.apiKey || !this.apiSecret) {
      return [];
    }

    try {
      const token = await this.authenticate();
      
      const response = await fetch(
        `${BASE_URL}/v1/reference-data/locations?keyword=${encodeURIComponent(keyword)}&subType=AIRPORT,CITY&page[limit]=10`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[Amadeus] Location search failed:', error);
      return [];
    }
  }

  private transformResults(data: any[]): AmadeusFlight[] {
    return data.map((offer: any, index: number) => {
      const itinerary = offer.itineraries?.[0];
      const segment = itinerary?.segments?.[0];
      
      if (!segment) return null;

      const airlineCode = segment.carrierCode || 'XX';
      const flightNumber = `${airlineCode}${segment.number || '000'}`;
      
      // Parse duration
      const durationStr = itinerary.duration || 'PT0H0M';
      const hours = parseInt(durationStr.match(/(\d+)H/)?.[1] || '0');
      const minutes = parseInt(durationStr.match(/(\d+)M/)?.[1] || '0');
      const totalMinutes = hours * 60 + minutes;

      return {
        id: offer.id || `ams-${index}`,
        price: parseFloat(offer.price?.total || '0'),
        currency: offer.price?.currency || 'GBP',
        airline: this.getAirlineName(airlineCode),
        airlineCode,
        flightNumber,
        origin: segment.departure?.iataCode || '',
        destination: segment.arrival?.iataCode || '',
        departure: segment.departure?.at || '',
        arrival: segment.arrival?.at || '',
        duration: `${hours}h ${minutes}m`,
        durationMinutes: totalMinutes,
        stops: (itinerary.segments?.length || 1) - 1,
        cabin: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
        seatsAvailable: segment.numberOfStops || undefined,
        bookingClass: segment.class || 'Y',
      };
    }).filter(Boolean) as AmadeusFlight[];
  }

  private getAirlineName(code: string): string {
    const airlines: Record<string, string> = {
      'BA': 'British Airways',
      'VS': 'Virgin Atlantic',
      'AA': 'American Airlines',
      'DL': 'Delta Air Lines',
      'UA': 'United Airlines',
      'AF': 'Air France',
      'KL': 'KLM',
      'LH': 'Lufthansa',
      'EK': 'Emirates',
      'SQ': 'Singapore Airlines',
      'CX': 'Cathay Pacific',
      'QF': 'Qantas',
      'QR': 'Qatar Airways',
      'IB': 'Iberia',
      'JL': 'Japan Airlines',
      'NH': 'ANA',
      'VS': 'Virgin Atlantic',
      'AC': 'Air Canada',
      'AY': 'Finnair',
      'SK': 'SAS',
      'TP': 'TAP Portugal',
      'LX': 'Swiss',
      'OS': 'Austrian Airlines',
      'AZ': 'ITA Airways',
    };
    return airlines[code] || code;
  }

  isAvailable(): boolean {
    return !!(this.apiKey && this.apiSecret);
  }
}

export const amadeus = new AmadeusAPI();
