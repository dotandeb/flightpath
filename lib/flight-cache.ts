/**
 * Flight Cache API
 * Serves scraped flight data from the data/ directory
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'scraper', 'data');

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

export class FlightCache {
  private cache: Map<string, RouteCache> = new Map();
  private lastLoad: number = 0;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get flights for a specific route and date
   */
  getFlights(origin: string, destination: string, date: string): CachedFlight[] {
    this.ensureLoaded();
    
    const key = `${origin}-${destination}_${date}`;
    const data = this.cache.get(key);
    
    if (!data) {
      // Try reverse route
      const reverseKey = `${destination}-${origin}_${date}`;
      return this.cache.get(reverseKey)?.flights || [];
    }
    
    return data.flights;
  }

  /**
   * Get all available routes
   */
  getRoutes(): string[] {
    this.ensureLoaded();
    const routes = new Set<string>();
    
    for (const key of this.cache.keys()) {
      const route = key.split('_')[0];
      routes.add(route);
    }
    
    return Array.from(routes);
  }

  /**
   * Check if we have data for a route
   */
  hasRoute(origin: string, destination: string): boolean {
    this.ensureLoaded();
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${origin}-${destination}_`)) return true;
      if (key.startsWith(`${destination}-${origin}_`)) return true;
    }
    return false;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    this.ensureLoaded();
    
    let totalFlights = 0;
    const routes = new Set<string>();
    
    for (const [key, data] of this.cache.entries()) {
      totalFlights += data.flights.length;
      routes.add(key.split('_')[0]);
    }
    
    return {
      routes: routes.size,
      totalFlights,
      lastUpdated: this.getLastUpdated()
    };
  }

  private ensureLoaded() {
    if (Date.now() - this.lastLoad > this.TTL) {
      this.loadCache();
    }
  }

  private loadCache() {
    this.cache.clear();
    
    try {
      if (!fs.existsSync(DATA_DIR)) {
        console.log('[Cache] Data directory not found:', DATA_DIR);
        return;
      }

      const files = fs.readdirSync(DATA_DIR);
      
      for (const file of files) {
        if (!file.endsWith('.json') || file === 'index.json') continue;
        
        try {
          const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
          const data: RouteCache = JSON.parse(content);
          const key = `${data.route}_${data.date}`;
          this.cache.set(key, data);
        } catch (e) {
          console.error(`[Cache] Error loading ${file}:`, e);
        }
      }
      
      this.lastLoad = Date.now();
      console.log(`[Cache] Loaded ${this.cache.size} route files`);
    } catch (error) {
      console.error('[Cache] Load error:', error);
    }
  }

  private getLastUpdated(): string | null {
    try {
      const indexPath = path.join(DATA_DIR, 'index.json');
      if (fs.existsSync(indexPath)) {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        return index.lastUpdated;
      }
    } catch {}
    return null;
  }
}

export const flightCache = new FlightCache();
