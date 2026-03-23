/**
 * OpenSky Network API Integration
 * Free for non-commercial use
 * Best for: Real-time aircraft tracking, ADS-B data
 * Docs: https://opensky-network.org/apidoc/
 */

export interface OpenSkyAircraft {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  heading: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
}

const BASE_URL = 'https://opensky-network.org/api';

export class OpenSkyAPI {
  private username?: string;
  private password?: string;

  constructor(credentials?: { username: string; password: string }) {
    this.username = credentials?.username;
    this.password = credentials?.password;
  }

  /**
   * Get all flights currently in the air
   * No authentication required for anonymous access (10s delay)
   * Auth users get real-time data
   */
  async getAllStates(bounds?: {
    lamin: number;  // min latitude
    lamax: number;  // max latitude
    lomin: number;  // min longitude
    lomax: number;  // max longitude
  }): Promise<OpenSkyAircraft[]> {
    try {
      let url = `${BASE_URL}/states/all`;
      
      if (bounds) {
        const params = new URLSearchParams({
          lamin: String(bounds.lamin),
          lamax: String(bounds.lamax),
          lomin: String(bounds.lomin),
          lomax: String(bounds.lomax),
        });
        url += `?${params}`;
      }

      const headers: Record<string, string> = {};
      
      if (this.username && this.password) {
        headers['Authorization'] = 'Basic ' + btoa(`${this.username}:${this.password}`);
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`OpenSky error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the array format to objects
      return (data.states || []).map((state: any[]) => ({
        icao24: state[0],
        callsign: state[1]?.trim() || null,
        origin_country: state[2],
        time_position: state[3],
        last_contact: state[4],
        longitude: state[5],
        latitude: state[6],
        baro_altitude: state[7],
        on_ground: state[8],
        velocity: state[9],
        heading: state[10],
        vertical_rate: state[11],
        sensors: state[12],
        geo_altitude: state[13],
        squawk: state[14],
        spi: state[15],
        position_source: state[16],
      }));
    } catch (error) {
      console.error('[OpenSky] Failed to fetch states:', error);
      throw error;
    }
  }

  /**
   * Get flights by callsign (airline flight number)
   */
  async getFlightByCallsign(callsign: string): Promise<OpenSkyAircraft[]> {
    // OpenSky doesn't have direct callsign search, so we filter from all states
    const all = await this.getAllStates();
    return all.filter(f => 
      f.callsign?.toLowerCase().includes(callsign.toLowerCase())
    );
  }

  /**
   * Get flights departing from an airport
   */
  async getDepartures(airport: string, begin: number, end: number): Promise<any[]> {
    try {
      const url = `${BASE_URL}/flights/departure?airport=${airport}&begin=${begin}&end=${end}`;
      
      const headers: Record<string, string> = {};
      if (this.username && this.password) {
        headers['Authorization'] = 'Basic ' + btoa(`${this.username}:${this.password}`);
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`OpenSky error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[OpenSky] Failed to get departures:', error);
      return [];
    }
  }

  /**
   * Get flights arriving at an airport
   */
  async getArrivals(airport: string, begin: number, end: number): Promise<any[]> {
    try {
      const url = `${BASE_URL}/flights/arrival?airport=${airport}&begin=${begin}&end=${end}`;
      
      const headers: Record<string, string> = {};
      if (this.username && this.password) {
        headers['Authorization'] = 'Basic ' + btoa(`${this.username}:${this.password}`);
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`OpenSky error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[OpenSky] Failed to get arrivals:', error);
      return [];
    }
  }

  /**
   * Check if API is available (always true for anonymous access)
   */
  isAvailable(): boolean {
    return true;
  }
}

export const openSky = new OpenSkyAPI();
