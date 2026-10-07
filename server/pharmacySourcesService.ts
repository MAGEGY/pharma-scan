import { loggingService } from './loggingService';
import { db } from './db';
import { eq, and, desc, ilike, or, inArray } from 'drizzle-orm';
import { 
  egyptianDrugs,
  pharmacySources,
  priceHistory,
  marketIntelligence,
  marketIntelligenceSources,
  pharmacyApiKeys,
} from "../shared/schema";

export interface PharmacySource {
  id: number;
  name: string;
  website: string;
  apiKey?: string;
  isActive: boolean;
  lastSync: string;
  region: string;
  reliability: number;
  coverage: string[];
  supportedFeatures: string[];
  apiEndpoints: {
    search: string;
    details: string;
    pricing: string;
    availability: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
    workingHours?: string;
  };
  integrationConfig: {
    rateLimit: number;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
}

export interface PharmacySearchResult {
  pharmacy: string;
  drugName: string;
  price: number;
  availability: 'available' | 'limited' | 'out_of_stock' | 'unknown';
  lastUpdated: string;
  source: string;
  url: string;
  region: string;
  reliability: number;
  confidence: number;
  metadata?: any;
}

export interface PriceComparisonData {
  drugId: number;
  drugName: string;
  drugNameArabic: string;
  activeIngredient: string;
  prices: Array<{
    pharmacy: string;
    price: number;
    availability: string;
    lastUpdated: string;
    region: string;
    reliability: number;
    url: string;
  }>;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
    spread: number;
  };
  bestPrice: {
    pharmacy: string;
    price: number;
    url: string;
  };
  priceHistory: Array<{
    date: string;
    price: number;
    pharmacy: string;
  }>;
  marketInsights: {
    demandLevel: string;
    availabilityStatus: string;
    priceTrend: string;
    competitorAnalysis: any;
  };
}

export class PharmacySourcesService {
  private sources: Map<number, PharmacySource> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly SOURCE_TIMEOUT_MS = 5000;
  private readonly MAX_QUERY_LENGTH = 100;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeSources();
    this.startPeriodicSync();
  }

  private async initializeSources(): Promise<void> {
    try {
      // Load pharmacy sources from database
      const dbSources = await db.select().from(pharmacySources);
      
      for (const source of dbSources) {
        this.sources.set(source.id, {
          ...source,
          coverage: source.coverage || [],
          supportedFeatures: source.supportedFeatures || [],
          apiEndpoints: source.apiEndpoints || {
            search: '/api/search',
            details: '/api/details',
            pricing: '/api/pricing',
            availability: '/api/availability',
          },
          contactInfo: source.contactInfo || {},
          integrationConfig: source.integrationConfig || {
            rateLimit: 100,
            timeout: 10000,
            retryAttempts: 3,
            retryDelay: 1000,
          },
        });
      }

      loggingService.info('Pharmacy sources initialized', {
        totalSources: this.sources.size,
        activeSources: Array.from(this.sources.values()).filter(s => s.isActive).length,
      });
    } catch (error) {
      loggingService.error('Failed to initialize pharmacy sources', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // PHARMACY SOURCE MANAGEMENT
  async addPharmacySource(sourceData: Omit<PharmacySource, 'id'>): Promise<boolean> {
    try {
      const source = {
        id: crypto.randomUUID(),
        ...sourceData,
        lastSync: new Date().toISOString(),
        reliability: sourceData.reliability || 5,
        coverage: sourceData.coverage || [],
        supportedFeatures: sourceData.supportedFeatures || [],
        isActive: true,
      };

      await db.insert(pharmacySources).values({
        id: source.id,
        name: source.name,
        website: source.website,
        apiKey: source.apiKey,
        isActive: source.isActive,
        lastSync: source.lastSync,
        region: source.region,
        comprehensive: source.reliability,
        coverage: source.coverage,
        supportedFeatures: source.supportedFeatures,
        apiEndpoints: source.apiEndpoints,
        contactInfo: source.contactInfo,
        integrationConfig: source.integrationConfig,
      });

      this.sources.set(parseInt(source.id), source);

      loggingService.info('Pharmacy source added', {
        sourceId: source.id,
        name: source.name,
        region: source.region,
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to add pharmacy source', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async updatePharmacySource(sourceId: number, updates: Partial<PharmacySource>): Promise<boolean> {
    try {
      await db.update(pharmacySources)
        .set({ ...updates, lastSync: new Date().toISOString() })
        .where(eq(pharmacySources.id, sourceId));

      const existingSource = this.sources.get(sourceId);
      if (existingSource) {
        const updatedSource = { ...existingSource, ...updates };
        this.sources.set(sourceId, updatedSource);
      }

      loggingService.info('Pharmacy source updated', {
        sourceId,
        name: existingSource?.name || 'Unknown',
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to update pharmacy source', {
        sourceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async deletePharmacySource(sourceId: number): Promise<boolean> {
    try {
      await db.delete(pharmacySources)
        .where(eq(pharmacySources.id, sourceId));

      this.sources.delete(sourceId);

      loggingService.info('Pharmacy source deleted', {
        sourceId,
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to delete pharmacy source', {
        sourceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async getPharmacySources(filter?: {
    region?: string;
    isActive?: boolean;
    reliability?: number;
  }): Promise<PharmacySource[]> {
    try {
      let sources = Array.from(this.sources.values());

      if (filter) {
        if (filter.region) {
          sources = sources.filter(s => s.region === filter.region);
        }
        if (filter.isActive !== undefined) {
          sources = sources.filter(s => s.isActive === filter.isActive);
        }
        if (filter.reliability) {
          sources = sources.filter(s => s.reliability >= filter.reliability);
        }
      }

      return sources.sort((a, b) => b.reliability - a.reliability);
    } catch (error) {
      loggingService.error('Failed to get pharmacy sources', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  // PRICE COMPARISON
  async comparePrices(drugId: number, region?: string): Promise<PriceComparisonData> {
    try {
      if (region && region.length > 64) {
        throw new Error('Region parameter too long');
      }

      const cacheKey = `price_comparison:${drugId}:${region || 'all'}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Get drug information
      const drug = await db.select()
        .from(egyptianDrugs)
        .where(eq(egyptianDrugs.id, drugId))
        .limit(1);

      if (!drug.length) {
        throw new Error('Drug not found');
      }

      const drugInfo = drug[0];
      const prices: PharmacySearchResult[] = [];

      // Search across all active pharmacy sources
      const activeSources = Array.from(this.sources.values()).filter(s => s.isActive);

      for (const source of activeSources) {
        if (region && source.region !== region && !source.coverage.includes(region)) {
          continue;
        }

        try {
          const sourcePrices = await this.withTimeout(
            this.searchPharmacy(source, drugInfo.name, region),
            this.SOURCE_TIMEOUT_MS,
            { sourceId: source.id, drugName: drugInfo.name }
          );
          prices.push(...sourcePrices);
        } catch (error) {
          loggingService.warn('Failed to search pharmacy', {
            sourceId: source.id,
            sourceName: source.name,
            drugName: drugInfo.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Calculate price statistics
      const validPrices = prices.filter(p => p.price > 0);
      const averagePrice = validPrices.length > 0 
        ? validPrices.reduce((sum, p) => sum + p.price, 0) / validPrices.length 
        : 0;

      const priceRange = {
        min: validPrices.length > 0 ? Math.min(...validPrices.map(p => p.price)) : 0,
        max: validPrices.length > 0 ? Math.max(...validPrices.map(p => p.price)) : 0,
        spread: 0,
      };

      priceRange.spread = priceRange.max - priceRange.min;

      const bestPrice = validPrices.length > 0
        ? validPrices.reduce((best, current) => current.price < best.price ? current : best)
        : null;

      // Get price history
      const priceHistory = await this.getPriceHistory(drugId);

      // Get market insights
      const marketInsights = await this.getMarketInsights(drugId, region);

      const comparisonData: PriceComparisonData = {
        drugId,
        drugName: drugInfo.name,
        drugNameArabic: drugInfo.nameArabic || '',
        activeIngredient: drugInfo.activeIngredient || '',
        prices,
        averagePrice,
        priceRange,
        bestPrice: bestPrice ? {
          pharmacy: bestPrice.pharmacy,
          price: bestPrice.price,
          url: bestPrice.url,
        } : null,
        priceHistory,
        marketInsights,
      };

      // Cache the result
      this.setCache(cacheKey, comparisonData);

      return comparisonData;
    } catch (error) {
      loggingService.error('Failed to compare prices', {
        drugId,
        region,
        error: error && error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async searchPharmacy(
    source: PharmacySource,
    drugName: string,
    region?: string
  ): Promise<PharmacySearchResult[]> {
    try {
      // This would integrate with the pharmacy's API
      // For now, return mock data
      
      // In production, you would make actual API calls to each pharmacy
      const mockResults: PharmacySearchResult[] = [
        {
          pharmacy: source.name,
          drugName,
          price: Math.random() * 500 + 50,
          availability: this.getRandomAvailability(),
          lastUpdated: new Date().toISOString(),
          source: source.name,
          url: `${source.website}/search?q=${encodeURIComponent(drugName)}`,
          region: source.region,
          reliability: source.reliability,
          confidence: 0.8 + Math.random() * 0.2,
        }
      ];

      return mockResults;
    } catch (error) {
      loggingService.error('Failed to search pharmacy', {
        sourceId: source.id,
        sourceName: source.name,
        drugName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  private getRandomAvailability(): 'available' | 'limited' | 'out_of_stock' | 'unknown' {
    const availabilities: Array<'available' | 'limited' | 'out_of_stock' | 'unknown'> = [
      'available', 'limited', 'out_of_stock', 'unknown'
    ];
    return availabilities[Math.floor(Math.random() * availabilities.length)];
  }

  // MARKET INTELLIGENCE
  async getMarketInsights(drugId: number, region?: string): Promise<any> {
    try {
      const insights = await db.select()
        .from(marketIntelligence)
        .where(and(
          eq(marketIntelligence.drugId, drugId),
          region ? eq(marketIntelligence.region, region) : undefined
        ))
        .orderBy(desc(marketIntelligence.lastChecked))
        .limit(1);

      return insights.length > 0 ? insights[0] : null;
    } catch (error) {
      loggingService.error('Failed to get market insights', {
        drugId,
        region,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async getPriceHistory(drugId: number, days?: number): Promise<any[]> {
    try {
      const cutoffDate = new Date(Date.now() - (days || 30) * 24 * 60 * 60 * 1000);
      
      const history = await db.select()
        .from(priceHistory)
        .where(and(
          eq(priceHistory.drugId, drugId),
          // @ts-ignore
          priceHistory.createdAt >= cutoffDate
        ))
        .orderBy(desc(priceHistory.createdAt));

      return history.map(h => ({
        date: h.createdAt.toISOString().split('T')[0],
        price: h.newPrice,
        pharmacy: h.pharmacy || 'Unknown',
      }));
    } catch (error) {
      loggingService.error('Failed to get price history', {
        drugId,
        days,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  // ENHANCED SEARCH
  async searchAcrossPharmacies(
    query: string,
    region?: string,
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      availability?: string;
      reliability?: number;
    }
  ): Promise<PharmacySearchResult[]> {
    try {
      const trimmedQuery = (query || '').trim();
      if (!trimmedQuery || trimmedQuery.length < 2) {
        throw new Error('Query too short');
      }
      if (trimmedQuery.length > this.MAX_QUERY_LENGTH) {
        throw new Error('Query too long');
      }
      if (region && region.length > 64) {
        throw new Error('Region parameter too long');
      }
      if (filters?.minPrice && filters.minPrice < 0) {
        filters.minPrice = 0;
      }
      if (filters?.maxPrice && filters.maxPrice < 0) {
        filters.maxPrice = 0;
      }
      if (filters?.minPrice && filters?.maxPrice && filters.minPrice > filters.maxPrice) {
        throw new Error('minPrice cannot exceed maxPrice');
      }

      const cacheKey = `search:${query}:${region || 'all'}:${JSON.stringify(filters || {})}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const allResults: PharmacySearchResult[] = [];
      const activeSources = Array.from(this.sources.values()).filter(s => s.isActive);

      for (const source of activeSources) {
        if (region && source.region !== region && !source.coverage.includes(region)) {
          continue;
        }

        if (filters?.reliability && source.reliability < filters.reliability) {
          continue;
        }

        try {
          const sourceResults = await this.withTimeout(
            this.searchPharmacy(source, query, region),
            this.SOURCE_TIMEOUT_MS,
            { sourceId: source.id, query }
          );
          
          // Apply filters
          let filteredResults = sourceResults;
          
          if (filters?.minPrice) {
            filteredResults = filteredResults.filter(r => r.price >= filters.minPrice);
          }
          
          if (filters?.maxPrice) {
            filteredResults = filteredResults.filter(r => r.price <= filters.maxPrice);
          }
          
          if (filters?.availability) {
            filteredResults = filteredResults.filter(r => r.availability === filters.availability);
          }

          allResults.push(...filteredResults);
        } catch (error) {
          loggingService.warn('Failed to search pharmacy in enhanced search', {
            sourceId: source.id,
            sourceName: source.name,
            query,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Sort by price (lowest first) and reliability
      allResults.sort((a, b) => {
        // First sort by price
        if (a.price !== b.price) {
          return a.price - b.price;
        }
        // Then by reliability
        return b.reliability - a.reliability;
      });

      // Cache the results
      this.setCache(cacheKey, allResults);

      return allResults;
    } catch (error) {
      loggingService.error('Failed to search across pharmacies', {
        query,
        region,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  // PHARMACY ANALYTICS
  async getPharmacyAnalytics(): Promise<{
    totalSources: number;
    activeSources: number;
    regionCoverage: Record<string, number>;
    reliabilityStats: {
      average: number;
      distribution: Record<string, number>;
    };
    searchPerformance: {
      averageResponseTime: number;
      successRate: number;
      errorRate: number;
    };
    marketCoverage: Record<string, any>;
  }> {
    try {
      const sources = Array.from(this.sources.values());
      const activeSources = sources.filter(s => s.isActive);
      
      const regionCoverage = sources.reduce((acc, source) => {
        acc[source.region] = (acc[source.region] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const reliabilityStats = {
        average: sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length,
        distribution: sources.reduce((acc, s) => {
          const rating = s.reliability.toString();
          acc[rating] = (acc[rating] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      // Get search performance from usage analytics
      const searchPerformance = await this.getSearchPerformanceStats();

      // Get market coverage data
      const marketCoverage = await this.getMarketCoverageStats();

      return {
        totalSources: sources.length,
        activeSources: activeSources.length,
        regionCoverage,
        reliabilityStats,
        searchPerformance,
        marketCoverage,
      };
    } catch (error) {
      loggingService.error('Failed to get pharmacy analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        totalSources: 0,
        activeSources: 0,
        regionCoverage: {},
        reliabilityStats: { average: 0, distribution: {} },
        searchPerformance: { averageResponseTime: 0, successRate: 0, errorRate: 0 },
        marketCoverage: {},
      };
    }
  }

  private async getSearchPerformanceStats(): Promise<any> {
    try {
      // This would analyze search performance from usage analytics
      // For now, return mock data
      return {
        averageResponseTime: 1500,
        successRate: 0.95,
        errorRate: 0.05,
      };
    } catch (error) {
      return {
        averageResponseTime: 1500,
        successRate: 0.95,
        errorRate: 0.05,
      };
    }
  }

  private async getMarketCoverageStats(): Promise<Record<string, any>> {
    try {
      // This would analyze market coverage from market intelligence
      // For now, return mock data
      return {
        'Cairo': {
          coverage: 0.85,
          pharmacies: 45,
          averagePrice: 150,
          demandLevel: 'high',
        },
        'Alexandria': {
          coverage: 0.75,
          pharmacies: 32,
          averagePrice: 140,
          demandLevel: 'medium',
        },
        'Giza': {
          coverage: 0.80,
          pharmacies: 38,
          averagePrice: 160,
          demandLevel: 'high',
        },
      };
    } catch (error) {
      return {};
    }
  }

  // CACHE MANAGEMENT
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, context: Record<string, any>): Promise<T> {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs))
    ]).catch(error => {
      loggingService.warn('Pharmacy source call timed out', { ...context, error: error instanceof Error ? error.message : error });
      throw error;
    });
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Cache expires in 10 minutes
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // PERIODIC TASKS
  private startPeriodicSync(): void {
    // Sync pharmacy data every hour
    setInterval(() => {
      this.syncPharmacyData();
    }, 60 * 60 * 1000);

    // Update reliability scores daily
    setInterval(() => {
      this.updateReliabilityScores();
    }, 24 * 60 * 60 * 1000);

    // Clean up old cache entries every 6 hours
    setInterval(() => {
      this.clearCache();
    }, 6 * 60 * 60 * 1000);
  }

  private async syncPharmacyData(): Promise<void> {
    try {
      const activeSources = Array.from(this.sources.values()).filter(s => s.isActive);
      
      for (const source of activeSources) {
        try {
          // This would sync data from the pharmacy's API
          // For now, just update the last sync time
          await this.updatePharmacySource(source.id, {
            lastSync: new Date().toISOString(),
          });
        } catch (error) {
          loggingService.warn('Failed to sync pharmacy data', {
            sourceId: source.id,
            sourceName: source.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      loggingService.info('Pharmacy data sync completed', {
        syncedSources: activeSources.length,
      });
    } catch (error) {
      loggingService.error('Failed to sync pharmacy data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async updateReliabilityScores(): Promise<void> {
    try {
      // Update reliability scores based on performance metrics
      const activeSources = Array.from(this.sources.values()).filter(s => s.isActive);
      
      for (const source of activeSources) {
        const performance = await this.getSourcePerformanceMetrics(source.id);
        const newReliability = this.calculateReliabilityScore(performance);
        
        if (Math.abs(newReliability - source.reliability) > 0.5) {
          await this.updatePharmacySource(source.id, {
            reliability: newReliability,
          });
        }
      }
    } catch (error) {
      loggingService.error('Failed to update reliability scores', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async getSourcePerformanceMetrics(sourceId: number): Promise<any> {
    // This would analyze performance metrics for a specific pharmacy source
    // For now, return mock data
    return {
      responseTime: Math.random() * 2000 + 500,
      successRate: 0.9 + Math.random() * 0.1,
      errorRate: 0.1 - Math.random() * 0.1,
    };
  }

  private calculateReliabilityScore(performance: any): number {
    // Calculate reliability based on performance metrics
    const responseTime = performance.responseTime;
    const successRate = performance.successRate;
    const errorRate = performance.errorRate;
    
    // Base score of 5, adjust based on performance
    let score = 5;
    
    // Adjust for response time (lower is better)
    if (responseTime < 500) score += 1;
    else if (responseTime > 2000) score -= 1;
    
    // Adjust for success rate
    if (successRate > 0.95) score += 1;
    else if (successRate < 0.8) score -= 1;
    
    // Adjust for error rate
    if (errorRate < 0.05) score += 1;
    else if (errorRate > 0.15) score -= 1;
    
    return Math.max(1, Math.min(10, score));
  }

  // PUBLIC API
  async getPopularPharmacies(limit?: number): Promise<PharmacySource[]> {
    const sources = Array.from(this.sources.values())
      .filter(s => s.isActive)
      .sort((a, b) => b.reliability - a.reliability)
      .slice(0, limit || 10);

    return sources;
  }

  async getPharmacyByRegion(region: string): Promise<PharmacySource[]> {
    return Array.from(this.sources.values())
      .filter(s => s.isActive && (s.region === region || s.coverage.includes(region)));
  }

  async testPharmacySearch(sourceId: number, query: string): Promise<PharmacySearchResult[]> {
    const source = this.sources.get(sourceId);
    if (!source) {
      throw new Error('Pharmacy source not found');
    }

    return await this.searchPharmacy(source, query);
  }
}

export const pharmacySourcesService = new PharmacySourcesService();
