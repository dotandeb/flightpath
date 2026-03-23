/**
 * Caching Layer for Free Scraper
 * Uses Upstash Redis (free tier) or local JSON fallback
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheLayer {
  private localCache: Map<string, CacheEntry<any>> = new Map();
  private redis: any = null;
  private useRedis: boolean = false;

  constructor() {
    // Try to initialize Upstash Redis if credentials available
    this.initRedis();
  }

  private async initRedis() {
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (redisUrl && redisToken) {
        // Dynamic import to avoid errors if not installed
        const { Redis } = await import('@upstash/redis');
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        this.useRedis = true;
        console.log('[Cache] Using Upstash Redis');
      }
    } catch (error) {
      console.log('[Cache] Redis not available, using local cache');
      this.useRedis = false;
    }
  }

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
      // Try Redis first
      if (this.useRedis && this.redis) {
        const data = await this.redis.get(key);
        if (data) {
          console.log(`[Cache] HIT (Redis): ${key}`);
          return JSON.parse(data);
        }
      }

      // Fall back to local cache
      const entry = this.localCache.get(key);
      if (entry) {
        // Check if expired
        if (Date.now() > entry.timestamp + entry.ttl) {
          this.localCache.delete(key);
          return null;
        }
        console.log(`[Cache] HIT (Local): ${key}`);
        return entry.data;
      }

      return null;
    } catch (error) {
      console.error('[Cache] Get error:', error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, ttlHours: number = 6): Promise<void> {
    try {
      const ttlMs = ttlHours * 60 * 60 * 1000;

      // Try Redis first
      if (this.useRedis && this.redis) {
        await this.redis.setex(
          key,
          ttlHours * 60 * 60, // seconds
          JSON.stringify(data)
        );
        console.log(`[Cache] SET (Redis): ${key} (TTL: ${ttlHours}h)`);
        return;
      }

      // Fall back to local cache
      this.localCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      });
      console.log(`[Cache] SET (Local): ${key} (TTL: ${ttlHours}h)`);
    } catch (error) {
      console.error('[Cache] Set error:', error);
    }
  }

  /**
   * Delete cached entry
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(key);
      }
      this.localCache.delete(key);
    } catch (error) {
      console.error('[Cache] Delete error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.flushall();
      }
      this.localCache.clear();
      console.log('[Cache] Flushed all');
    } catch (error) {
      console.error('[Cache] Flush error:', error);
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { type: string; size: number } {
    return {
      type: this.useRedis ? 'redis' : 'local',
      size: this.localCache.size,
    };
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }
}

export const cache = new CacheLayer();
