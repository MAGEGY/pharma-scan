import { loggingService } from './loggingService';
import { db } from './db';
import { eq, and, desc, ilike, or } from 'drizzle-orm';
import { 
  egyptianDrugs,
  drugReviews,
  medicalQuestions,
  supportTickets,
  helpRequests,
  usageAnalytics,
  priceHistory
} from '../shared/schema';

export interface CacheItem<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
  lastAccessed: number;
  size: number;
  tags: string[];
  compressed: boolean;
}

export interface CacheConfig {
  maxSize: number;
  maxBytes: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableCompression: boolean;
  enableMetrics: boolean;
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  avgResponseTime: number;
  memoryUsage: number;
  cacheSize: number;
  totalRequests: number;
  slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: number;
  }>;
}

export class PerformanceService {
  private cache: Map<string, CacheItem> = new Map();
  private config: CacheConfig = {
    maxSize: 1000, // Max cache items
    maxBytes: 25 * 1024 * 1024, // 25 MB soft cap
    defaultTTL: 15 * 60 * 1000, // 15 minutes default TTL
    cleanupInterval: 5 * 60 * 1000, // 5 minutes cleanup
    enableCompression: false, // disabled until real compression is wired
    enableMetrics: true,
  };

  private metrics: PerformanceMetrics = {
    cacheHitRate: 0,
    avgResponseTime: 0,
    memoryUsage: 0,
    cacheSize: 0,
    totalRequests: 0,
    slowQueries: [],
  };

  private requestTimes: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor() {
    this.startCleanupInterval();
    this.startMetricsCollection();
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error(`Timeout: ${label} exceeded ${timeoutMs}ms`)), timeoutMs);
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutHandle!);
      return result as T;
    } catch (error) {
      loggingService.warn('Operation timed out', { label, timeoutMs, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  // CACHE MANAGEMENT
  async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      this.cacheMisses++;
      return null;
    }

    // Check expiration
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.cacheMisses++;
      return null;
    }

    // Update access metrics
    item.hits++;
    item.lastAccessed = Date.now();
    this.cacheHits++;

    const payload = item.compressed ? this.decompress(item.data) : item.data;
    return payload as T;
  }

  async set<T = any>(
    key: string, 
    data: T, 
    ttl: number = this.config.defaultTTL,
    tags: string[] = []
  ): Promise<void> {
    const rawSize = this.calculateSize(data);
    const shouldCompress = this.config.enableCompression && rawSize >= 1024;
    const payload = shouldCompress ? this.compress(data) : data;
    const size = this.calculateSize(payload);
    
    // Check if we need to evict items
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }
    this.evictUntilWithinByteBudget(size);

    // If still too big, skip caching
    if (size > this.config.maxBytes) {
      loggingService.warn('Cache entry skipped; exceeds byte budget', { key, size });
      return;
    }

    const item: CacheItem<T> = {
      key,
      data: payload,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      hits: 0,
      lastAccessed: Date.now(),
      size,
      tags,
      compressed: shouldCompress,
    };

    this.cache.set(key, item);
  }

  async invalidate(pattern?: string | string[]): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      for (const p of patterns) {
        if (key.includes(p) || key.match(new RegExp(p))) {
          keysToDelete.push(key);
          break;
        }
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (tags.some(tag => item.tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  // DATABASE QUERY CACHING
  async getCachedDrugs(search?: string, category?: string, limit?: number): Promise<any[]> {
    const safeLimit = Math.min(limit || 50, 200);
    const cacheKey = `drugs:${search || 'all'}:${category || 'all'}:${safeLimit}`;
    
    let cached = await this.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const startTime = Date.now();
    let query = db.select().from(egyptianDrugs);

    if (search) {
      query = query.where(
        or(
          ilike(egyptianDrugs.name, `%${search}%`),
          ilike(egyptianDrugs.nameArabic, `%${search}%`),
          ilike(egyptianDrugs.activeIngredient, `%${search}%`)
        )
      );
    }

    if (category && category !== 'All') {
      query = query.where(eq(egyptianDrugs.category, category));
    }

    query = query.limit(safeLimit);
    const drugs = await query;
    const duration = Date.now() - startTime;

    // Cache the result
    await this.set(cacheKey, drugs, 30 * 60 * 1000, ['drugs', 'search']);

    // Track performance
    this.trackQueryPerformance(`getCachedDrugs`, duration);

    return drugs;
  }

  async getCachedDrugReviews(drugId: number, limit?: number): Promise<any[]> {
    const cacheKey = `reviews:${drugId}:${limit || 10}`;
    
    let cached = await this.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    const reviews = await db.select()
      .from(drugReviews)
      .where(eq(drugReviews.drugId, drugId))
      .limit(limit || 10)
      .orderBy(desc(drugReviews.createdAt));

    const duration = Date.now() - startTime;

    await this.set(cacheKey, reviews, 20 * 60 * 1000, ['reviews', 'drug']);
    this.trackQueryPerformance(`getCachedDrugReviews`, duration);

    return reviews;
  }

  async getCachedMedicalQuestions(category?: string, limit?: number): Promise<any[]> {
    const cacheKey = `questions:${category || 'all'}:${limit || 20}`;
    
    let cached = await this.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    let query = db.select().from(medicalQuestions);

    if (category) {
      query = query.where(eq(medicalQuestions.category, category as any));
    }

    query = query.limit(limit || 20)
      .orderBy(desc(medicalQuestions.createdAt));

    const questions = await query;
    const duration = Date.now() - startTime;

    await this.set(cacheKey, questions, 15 * 60 * 1000, ['questions', 'category']);
    this.trackQueryPerformance(`getCachedMedicalQuestions`, duration);

    return questions;
  }

  async getCachedPriceHistory(drugId: number, days?: number): Promise<any[]> {
    const cacheKey = `price_history:${drugId}:${days || 30}`;
    
    let cached = await this.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    const cutoffDate = new Date(Date.now() - (days || 30) * 24 * 60 * 60 * 1000);

    const history = await db.select()
      .from(priceHistory)
      .where(and(
        eq(priceHistory.drugId, drugId),
        // @ts-ignore
        priceHistory.createdAt >= cutoffDate
      ))
      .orderBy(desc(priceHistory.createdAt));

    const duration = Date.now() - startTime;

    await this.set(cacheKey, history, 60 * 60 * 1000, ['price', 'history']);
    this.trackQueryPerformance(`getCachedPriceHistory`, duration);

    return history;
  }

  // API RESPONSE CACHING
  async cacheApiResponse(url: string, response: any, ttl?: number): Promise<void> {
    const cacheKey = `api:${url}`;
    await this.set(cacheKey, response, ttl || this.config.defaultTTL, ['api']);
  }

  async getCachedApiResponse(url: string): Promise<any | null> {
    const cacheKey = `api:${url}`;
    return await this.get(cacheKey);
  }

  // BULK OPERATIONS
  async bulkCacheDrugs(drugs: any[]): Promise<void> {
    const batchSize = 100;
    for (let i = 0; i < drugs.length; i += batchSize) {
      const batch = drugs.slice(i, i + batchSize);
      const cacheKey = `drugs:batch:${Math.floor(i / batchSize)}`;
      await this.set(cacheKey, batch, 60 * 60 * 1000, ['drugs', 'bulk']);
    }
  }

  async preloadEssentialData(): Promise<void> {
    try {
      const POPULAR_TIMEOUT = 5000;

      const popularDrugs = await this.withTimeout(
        this.getCachedDrugs(undefined, undefined, 100),
        POPULAR_TIMEOUT,
        'preload:popularDrugs'
      );
      
      const recentReviews = await this.withTimeout(
        db.select()
          .from(drugReviews)
          .limit(50)
          .orderBy(desc(drugReviews.createdAt)),
        POPULAR_TIMEOUT,
        'preload:recentReviews'
      );

      await this.set('reviews:recent', recentReviews, 30 * 60 * 1000, ['reviews', 'recent']);

      const popularQuestions = await this.withTimeout(
        this.getCachedMedicalQuestions(undefined, 20),
        POPULAR_TIMEOUT,
        'preload:popularQuestions'
      );

      loggingService.info('Essential data preloaded', {
        drugsCount: popularDrugs.length,
        reviewsCount: recentReviews.length,
        questionsCount: popularQuestions.length,
      });
    } catch (error) {
      loggingService.error('Failed to preload essential data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // CACHE EVICTION
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private evictUntilWithinByteBudget(incomingSize: number): void {
    while (this.getTotalBytes() + incomingSize > this.config.maxBytes && this.cache.size > 0) {
      this.evictLeastRecentlyUsed();
    }
  }

  private evictExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }
  }

  // COMPRESSION
  private compress(data: any): any {
    if (!this.config.enableCompression) {
      return data;
    }

    try {
      // Simple compression for JSON data
      const jsonString = JSON.stringify(data);
      if (jsonString.length < 1024) {
        return data; // Don't compress small data
      }

      // In a real implementation, you'd use a proper compression library
      // For now, just return the original data
      return data;
    } catch (error) {
      return data;
    }
  }

  private decompress(data: any): any {
    // In a real implementation, you'd decompress the data
    return data;
  }

  // METRICS
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      return 1024; // Default size
    }
  }

  private getTotalBytes(): number {
    let totalSize = 0;
    for (const item of this.cache.values()) {
      totalSize += item.size;
    }
    return totalSize;
  }

  private trackQueryPerformance(query: string, duration: number): void {
    if (duration > 1000) { // Track slow queries (> 1 second)
      this.metrics.slowQueries.push({
        query,
        duration,
        timestamp: Date.now(),
      });

      // Keep only last 50 slow queries
      if (this.metrics.slowQueries.length > 50) {
        this.metrics.slowQueries = this.metrics.slowQueries.slice(-50);
      }

      loggingService.warn('Slow query detected', {
        query,
        duration,
      });
    }

    this.requestTimes.push(duration);
    
    // Keep only last 100 request times for average calculation
    if (this.requestTimes.length > 100) {
      this.requestTimes = this.requestTimes.slice(-100);
    }
  }

  private updateMetrics(): void {
    this.metrics.totalRequests = this.cacheHits + this.cacheMisses;
    this.metrics.cacheHitRate = this.metrics.totalRequests > 0 
      ? (this.cacheHits / this.metrics.totalRequests) * 100 
      : 0;

    this.metrics.avgResponseTime = this.requestTimes.length > 0
      ? this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length
      : 0;

    this.metrics.cacheSize = this.cache.size;
    
    // Calculate memory usage (rough estimation)
    let totalSize = 0;
    for (const item of this.cache.values()) {
      totalSize += item.size;
    }
    this.metrics.memoryUsage = totalSize;
  }

  // CLEANUP AND MAINTENANCE
  private startCleanupInterval(): void {
    setInterval(() => {
      this.evictExpired();
      this.updateMetrics();
    }, this.config.cleanupInterval);
  }

  private startMetricsCollection(): void {
    if (!this.config.enableMetrics) {
      return;
    }

    setInterval(() => {
      this.updateMetrics();
      this.logMetrics();
    }, 60 * 1000); // Every minute
  }

  private logMetrics(): void {
    loggingService.info('Performance metrics', {
      cacheHitRate: `${this.metrics.cacheHitRate.toFixed(2)}%`,
      avgResponseTime: `${this.metrics.avgResponseTime.toFixed(2)}ms`,
      memoryUsage: `${(this.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      cacheSize: this.metrics.cacheSize,
      totalRequests: this.metrics.totalRequests,
      slowQueriesCount: this.metrics.slowQueries.length,
    });
  }

  // PUBLIC API
  startWarmupInBackground(): void {
    const WARMUP_TIMEOUT_MS = 5000;
    setTimeout(() => {
      this.withTimeout(this.warmupCache(), WARMUP_TIMEOUT_MS, 'backgroundWarmup')
        .catch(error => {
          loggingService.error('Background cache warmup failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
    }, 0);
  }

  getMetrics(): PerformanceMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  getCacheInfo(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: number;
    items: Array<{
      key: string;
      size: number;
      hits: number;
      ttl: number;
      tags: string[];
    }>;
  } {
    const items = Array.from(this.cache.values()).map(item => ({
      key: item.key,
      size: item.size,
      hits: item.hits,
      ttl: Math.max(0, item.expiresAt - Date.now()),
      tags: item.tags,
    }));

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.metrics.cacheHitRate,
      memoryUsage: this.metrics.memoryUsage,
      items,
    };
  }

  async warmupCache(): Promise<void> {
    loggingService.info('Starting cache warmup');
    
    try {
      await this.preloadEssentialData();
      
      // Cache common search results
      const commonSearches = ['panadol', 'augmentin', 'concor', 'glucophage'];
      for (const search of commonSearches) {
        await this.getCachedDrugs(search);
      }

      loggingService.info('Cache warmup completed');
    } catch (error) {
      loggingService.error('Cache warmup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.requestTimes = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.metrics.slowQueries = [];
    
    loggingService.info('Cache cleared');
  }

  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    loggingService.info('Cache config updated', config);
  }

  // DATABASE OPTIMIZATION
  async optimizeDatabase(): Promise<void> {
    try {
      loggingService.info('Starting database optimization');

      // Analyze slow queries and suggest indexes
      const slowQueries = this.metrics.slowQueries;
      const suggestions = this.generateIndexSuggestions(slowQueries);

      // Update cache settings based on performance
      if (this.metrics.cacheHitRate < 70) {
        this.updateConfig({ defaultTTL: this.config.defaultTTL * 2 });
        loggingService.info('Increased cache TTL due to low hit rate');
      }

      if (this.metrics.avgResponseTime > 500) {
        this.updateConfig({ maxSize: Math.min(this.config.maxSize * 1.5, 2000) });
        loggingService.info('Increased cache size due to high response time');
      }

      loggingService.info('Database optimization completed', {
        suggestions,
        config: this.config,
      });
    } catch (error) {
      loggingService.error('Database optimization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private generateIndexSuggestions(slowQueries: any[]): string[] {
    const suggestions: string[] = [];
    
    // Analyze slow queries to suggest indexes
    for (const query of slowQueries) {
      if (query.query.includes('drugReviews') && query.query.includes('drugId')) {
        suggestions.push('Consider adding index on drugReviews(drugId)');
      }
      if (query.query.includes('medicalQuestions') && query.query.includes('category')) {
        suggestions.push('Consider adding index on medicalQuestions(category)');
      }
      if (query.query.includes('priceHistory') && query.query.includes('createdAt')) {
        suggestions.push('Consider adding index on priceHistory(drugId, createdAt)');
      }
    }

    return Array.from(new Set(suggestions)); // Remove duplicates
  }
}

export const performanceService = new PerformanceService();
