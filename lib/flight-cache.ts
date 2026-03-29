/**
 * Flight Cache API - Client for cached flight data
 * Fetches from /data/ endpoint (static JSON files)
 */

export interface CachedFlight {
  id: string;
  airline: string;
  price: number;
  currency: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  source: string;
}

export interface RouteCache {
  route: string;
  date: string;
  flights: CachedFlight[];
  scrapedAt: string;
}

class FlightCacheClient {
  private cache: Map<string, RouteCache> = new Map();
  private loading: Map<string, Promise<RouteCache | null>> = new Map();

  /**
   * Get flights for a specific route and date
   */
  async getFlights(origin: string, destination: string, date: string): Promise<CachedFlight[]> {
    const key = `${origin}-${destination}_${date}`;
    
    // Check memory cache
    if (this.cache.has(key)) {
      return this.cache.get(key)!.flights;
    }
    
    // Check if already loading
    if (this.loading.has(key)) {
      const result = await this.loading.get(key)!;
      return result?.flights || [];
    }
    
    // Load from static file
    const loadPromise = this.loadRoute(origin, destination, date);
    this.loading.set(key, loadPromise);
    
    const result = await loadPromise;
    this.loading.delete(key);
    
    return result?.flights || [];
  }

  /**
   * Check if we have data for a route
   */
  async hasRoute(origin: string, destination: string, date: string): Promise<boolean> {
    const flights = await this.getFlights(origin, destination, date);
    return flights.length > 0;
  }

  private async loadRoute(origin: string, destination: string, date: string): Promise<RouteCache | null> {
    try {
      // Try forward route
      const forwardKey = `${origin}-${destination}_${date}`;
      const forwardData = await this.fetchRouteFile(origin, destination, date);
      
      if (forwardData) {
        this.cache.set(forwardKey, forwardData);
        return forwardData;
      }
      
      // Try reverse route
      const reverseKey = `${destination}-${origin}_${date}`;
      const reverseData = await this.fetchRouteFile(destination, origin, date);
      
      if (reverseData) {
        this.cache.set(reverseKey, reverseData);
        return reverseData;
      }
      
      return null;
    } catch (error) {
      console.error('[Cache] Load error:', error);
      return null;
    }
  }

  private async fetchRouteFile(origin: string, destination: string, date: string): Promise<RouteCache | null> {
    try {
      const url = `/data/${origin}-${destination}_${date}.json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json() as RouteCache;
    } catch {
      return null;
    }
  }
}

export const flightCache = new FlightCacheClient();
