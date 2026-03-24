/**
 * FREE Scraper Cache Layer
 * Integrated into main FlightPath app
 * Uses local Map cache (Redis optional via env)
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheLayer {
  private localCache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Generate cache key from search params
   */
  generateKey(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
  }): string {
    const parts = [
      'flight',
      params.origin.toLowerCase(),
      params.destination.toLowerCase(),
      params.departureDate,
    ];
    if (params.returnDate) parts.push(params.returnDate);
    return parts.join(':');
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.localCache.get(key);
      if (entry) {
        // Check if expired
        if (Date.now() > entry.timestamp + entry.ttl) {
          this.localCache.delete(key);
          return null;
        }
        return entry.data;
      }
      return null;
    } catch (error) {
      console.error('[FreeCache] Get error:', error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, ttlHours: number = 6): Promise<void> {
    try {
      const ttlMs = ttlHours * 60 * 60 * 1000;
      this.localCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      });
    } catch (error) {
      console.error('[FreeCache] Set error:', error);
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }
}

export const freeCache = new CacheLayer();
