/**
 * Aviation Stack API Integration
 * Free tier: 100 calls/month
 * Best for: Flight status, tracking, airline/airport info
 * Docs: https://aviationstack.com/documentation
 */

export interface AviationStackParams {
  flight_iata?: string;
  flight_icao?: string;
  dep_iata?: string;
  arr_iata?: string;
  airline_iata?: string;
  flight_date?: string;
}

export interface FlightStatus {
  flight: {
    iata: string;
    icao: string;
    number: string;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  departure: {
    airport: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
  };
  arrival: {
    airport: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
  };
  status: string; // scheduled, active, landed, cancelled, incident, diverted
}

const API_KEY = process.env.AVIATION_STACK_KEY || '';
const BASE_URL = 'http://api.aviationstack.com/v1';

export class AviationStackAPI {
  private callCount: number = 0;
  private readonly monthlyLimit: number = 100;

  constructor(private apiKey: string = API_KEY) {}

  /**
   * Get real-time flight data
   */
  async getFlights(params: AviationStackParams): Promise<FlightStatus[]> {
    if (!this.apiKey) {
      throw new Error('Aviation Stack API key not configured. Get free key at https://aviationstack.com/');
    }

    if (this.callCount >= this.monthlyLimit) {
      throw new Error('Monthly API limit reached (100 calls/month)');
    }

    try {
      const queryParams = new URLSearchParams({
        access_key: this.apiKey,
        limit: '10',
      });

      if (params.flight_iata) queryParams.append('flight_iata', params.flight_iata);
      if (params.dep_iata) queryParams.append('dep_iata', params.dep_iata);
      if (params.arr_iata) queryParams.append('arr_iata', params.arr_iata);
      if (params.airline_iata) queryParams.append('airline_iata', params.airline_iata);
      if (params.flight_date) queryParams.append('flight_date', params.flight_date);

      this.callCount++;
      console.log(`[AviationStack] API call ${this.callCount}/${this.monthlyLimit}`);

      const response = await fetch(`${BASE_URL}/flights?${queryParams}`);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Aviation Stack error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[AviationStack] Request failed:', error);
      throw error;
    }
  }

  /**
   * Get airport information
   */
  async getAirports(search: string): Promise<any[]> {
    if (!this.apiKey || this.callCount >= this.monthlyLimit) {
      return [];
    }

    try {
      this.callCount++;
      
      const response = await fetch(
        `${BASE_URL}/airports?access_key=${this.apiKey}&search=${encodeURIComponent(search)}&limit=10`
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[AviationStack] Airport search failed:', error);
      return [];
    }
  }

  /**
   * Get airline information
   */
  async getAirlines(iataCode?: string): Promise<any[]> {
    if (!this.apiKey || this.callCount >= this.monthlyLimit) {
      return [];
    }

    try {
      this.callCount++;
      
      let url = `${BASE_URL}/airlines?access_key=${this.apiKey}&limit=100`;
      if (iataCode) url += `&iata_code=${iataCode}`;
      
      const response = await fetch(url);

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[AviationStack] Airline search failed:', error);
      return [];
    }
  }

  /**
   * Get remaining calls for this month
   */
  getRemainingCalls(): number {
    return this.monthlyLimit - this.callCount;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Convert flight status to flight object format
   */
  static toFlightFormat(status: FlightStatus): any {
    return {
      id: `as-${status.flight.iata}`,
      airline: status.airline.name,
      airlineCode: status.airline.iata,
      flightNumber: status.flight.iata,
      origin: status.departure.iata,
      destination: status.arrival.iata,
      departure: status.departure.scheduled,
      arrival: status.arrival.scheduled,
      status: status.status,
      source: 'aviation-stack',
    };
  }
}

export const aviationStack = new AviationStackAPI();
