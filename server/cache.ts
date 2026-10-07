import type { Request, Response, NextFunction } from 'express';

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize?: number; // Maximum number of cached items
  keyGenerator?: (req: Request) => string;
}

// Cache entry with metadata
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

// Memory-based cache implementation
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttl: number): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccessed: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.hits++;
    entry.lastAccessed = Date.now();
    
    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Remove expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalHits = 0;
    let avgAge = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        expiredCount++;
      }
      totalHits += entry.hits;
      avgAge += now - entry.timestamp;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredCount,
      totalHits,
      avgAge: this.cache.size > 0 ? avgAge / this.cache.size : 0,
      hitRate: totalHits > 0 ? (totalHits / (totalHits + this.cache.size)) * 100 : 0,
    };
  }

  // Destroy cache and cleanup interval
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Global cache instance
const cache = new MemoryCache(1000);

// Cache middleware factory
export function createCacheMiddleware(config: CacheConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = config.keyGenerator 
      ? config.keyGenerator(req)
      : `${req.path}:${JSON.stringify(req.query)}`;

    // Try to get cached response
    const cached = cache.get(key);
    if (cached) {
      // Add cache headers
      const cacheEntry = cached as CacheEntry<any>;
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Hits', cacheEntry.hits.toString());
      res.set('X-Cache-Age', Math.floor((Date.now() - cacheEntry.timestamp) / 1000).toString());
      
      return res.json(cacheEntry.data);
    }

    // Intercept response to cache it
    const originalJson = res.json;
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, config.ttl);
        res.set('X-Cache', 'MISS');
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
}

// Predefined cache configurations
export const cacheConfigs = {
  // Drug data changes rarely - cache for 1 hour
  drugs: { ttl: 3600, maxSize: 500 },
  
  // Price data changes frequently - cache for 5 minutes
  prices: { ttl: 300, maxSize: 200 },
  
  // User data changes occasionally - cache for 15 minutes
  users: { ttl: 900, maxSize: 100 },
  
  // Search results - cache for 10 minutes
  search: { ttl: 600, maxSize: 300 },
  
  // Static data - cache for 24 hours
  static: { ttl: 86400, maxSize: 50 },
};

// Cache invalidation utilities
export class CacheManager {
  static invalidatePattern(pattern: string): number {
    let count = 0;
    const stats = cache.getStats();
    // Note: This is a simplified implementation
    // In production, you'd want to maintain a list of keys for efficient pattern matching
    for (let i = 0; i < stats.size; i++) {
      // This would need actual key iteration - simplified for now
      count++;
    }
    return count;
  }

  static invalidateUser(userId: string): number {
    return this.invalidatePattern(`/api/auth/${userId}`);
  }

  static invalidateDrug(drugId: string): number {
    return this.invalidatePattern(`/api/drugs/${drugId}`);
  }

  static invalidatePrices(): number {
    return this.invalidatePattern('/api/prices');
  }

  static clearAll(): void {
    cache.clear();
  }

  static getStats() {
    return cache.getStats();
  }
}

// Cache warming utilities
export class CacheWarmer {
  static async warmDrugPrices(): Promise<void> {
    try {
      // This would typically fetch popular drug prices and cache them
      console.log('Warming drug price cache...');
      // Implementation would depend on your drug service
    } catch (error) {
      console.error('Failed to warm drug price cache:', error);
    }
  }

  static async warmPopularDrugs(): Promise<void> {
    try {
      console.log('Warming popular drugs cache...');
      // Implementation would fetch and cache popular drugs
    } catch (error) {
      console.error('Failed to warm popular drugs cache:', error);
    }
  }
}

// Cache middleware for specific routes
export const cacheMiddleware = {
  drugs: createCacheMiddleware(cacheConfigs.drugs),
  prices: createCacheMiddleware(cacheConfigs.prices),
  users: createCacheMiddleware(cacheConfigs.users),
  search: createCacheMiddleware(cacheConfigs.search),
  static: createCacheMiddleware(cacheConfigs.static),
};

// Export cache instance for direct usage
export { cache };

// Cleanup on process exit
process.on('SIGINT', () => {
  cache.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cache.destroy();
  process.exit(0);
});
