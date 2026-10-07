import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from './db';
import { 
  prescriptionBackups,
  usageAnalytics,
  priceTrends,
  marketIntelligence,
  exportHistory,
  userPrescriptions,
  egyptianDrugs,
  priceHistory,
  type CreatePrescriptionBackup,
  type CreateUsageAnalytics,
  type CreatePriceTrend,
  type CreateMarketIntelligence,
  type CreateExportHistory,
  type PrescriptionBackup,
  type UsageAnalytics,
  type PriceTrend,
  type MarketIntelligence,
  type ExportHistory
} from '../shared/schema';
import { generateChecksum } from './encryption';
import crypto from 'crypto';

export class BackupSyncService {
  // PRESCRIPTION BACKUP & SYNC
  
  async createPrescriptionBackup(userId: string, backupData: CreatePrescriptionBackup): Promise<PrescriptionBackup> {
    // Get user's prescription data
    const prescriptions = await db.select()
      .from(userPrescriptions)
      .where(and(
        eq(userPrescriptions.userId, userId),
        eq(userPrescriptions.isActive, true)
      ));

    const backupPayload = {
      prescriptions,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        deviceId: backupData.deviceId,
      },
    };

    const checksum = generateChecksum(JSON.stringify(backupPayload));
    const backupSize = Buffer.byteLength(JSON.stringify(backupPayload));

    const [backup] = await db.insert(prescriptionBackups)
      .values({
        userId,
        backupData: backupPayload,
        backupType: backupData.backupType,
        deviceId: backupData.deviceId,
        cloudProvider: backupData.cloudProvider,
        isEncrypted: backupData.isEncrypted,
        backupSize,
        checksum,
        syncStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Trigger async sync process
    this.syncToCloud(backup.id).catch(console.error);

    return backup;
  }

  async syncToCloud(backupId: string): Promise<void> {
    try {
      // Update sync status
      await db.update(prescriptionBackups)
        .set({
          syncStatus: 'syncing',
          updatedAt: new Date(),
        })
        .where(eq(prescriptionBackups.id, backupId));

      const [backup] = await db.select()
        .from(prescriptionBackups)
        .where(eq(prescriptionBackups.id, backupId))
        .limit(1);

      if (!backup) {
        throw new Error('Backup not found');
      }

      // Simulate cloud sync (in production, integrate with actual cloud providers)
      const cloudPath = await this.uploadToCloudProvider(backup);

      // Update with cloud path and completed status
      await db.update(prescriptionBackups)
        .set({
          cloudPath,
          syncStatus: 'completed',
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(prescriptionBackups.id, backupId));

    } catch (error) {
      // Update with failed status
      await db.update(prescriptionBackups)
        .set({
          syncStatus: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(prescriptionBackups.id, backupId));
      
      console.error('Cloud sync failed:', error);
      throw error;
    }
  }

  private async uploadToCloudProvider(backup: PrescriptionBackup): Promise<string> {
    // Simulate cloud upload (in production, integrate with Google Drive, iCloud, Dropbox, AWS)
    const cloudPath = `medscan-backups/${backup.userId}/${backup.id}.json`;
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`Uploaded backup to ${backup.cloudProvider}: ${cloudPath}`);
    return cloudPath;
  }

  async getUserBackups(userId: string): Promise<PrescriptionBackup[]> {
    return await db.select()
      .from(prescriptionBackups)
      .where(eq(prescriptionBackups.userId, userId))
      .orderBy(desc(prescriptionBackups.createdAt));
  }

  async restoreFromBackup(userId: string, backupId: string): Promise<void> {
    const [backup] = await db.select()
      .from(prescriptionBackups)
      .where(and(
        eq(prescriptionBackups.id, backupId),
        eq(prescriptionBackups.userId, userId)
      ))
      .limit(1);

    if (!backup) {
      throw new Error('Backup not found');
    }

    // Verify backup integrity
    const currentChecksum = generateChecksum(JSON.stringify(backup.backupData));
    if (currentChecksum !== backup.checksum) {
      throw new Error('Backup integrity check failed');
    }

    // Restore prescriptions (in a real implementation, this would be more sophisticated)
    const prescriptions = backup.backupData.prescriptions || [];
    
    for (const prescription of prescriptions) {
      await db.insert(userPrescriptions)
        .values({
          ...prescription,
          userId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    console.log(`Restored ${prescriptions.length} prescriptions from backup`);
  }

  // USAGE ANALYTICS
  
  async trackUsageEvent(userId: string, eventData: CreateUsageAnalytics): Promise<UsageAnalytics> {
    const [analytics] = await db.insert(usageAnalytics)
      .values({
        userId,
        ...eventData,
        createdAt: new Date(),
      })
      .returning();

    return analytics;
  }

  async getUserUsageAnalytics(userId: string, filters?: {
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<UsageAnalytics[]> {
    let query = db.select()
      .from(usageAnalytics)
      .where(eq(usageAnalytics.userId, userId));

    if (filters?.eventType) {
      query = query.where(and(
        eq(usageAnalytics.userId, userId),
        eq(usageAnalytics.eventType, filters.eventType)
      ));
    }

    if (filters?.startDate) {
      query = query.where(and(
        eq(usageAnalytics.userId, userId),
        eq(usageAnalytics.createdAt, filters.startDate)
      ));
    }

    return await query.orderBy(desc(usageAnalytics.createdAt));
  }

  async getUsageStats(userId: string): Promise<{
    totalScans: number;
    totalSearches: number;
    totalExports: number;
    totalBackups: number;
    avgSessionDuration: number;
    mostUsedFeatures: Array<{ feature: string; count: number }>;
  }> {
    const analytics = await this.getUserUsageAnalytics(userId);

    const stats = {
      totalScans: analytics.filter(a => a.eventType === 'scan').length,
      totalSearches: analytics.filter(a => a.eventType === 'search').length,
      totalExports: analytics.filter(a => a.eventType === 'export').length,
      totalBackups: analytics.filter(a => a.eventType === 'backup').length,
      avgSessionDuration: analytics.reduce((acc, a) => acc + (a.duration || 0), 0) / analytics.length,
      mostUsedFeatures: this.getMostUsedFeatures(analytics),
    };

    return stats;
  }

  private getMostUsedFeatures(analytics: UsageAnalytics[]): Array<{ feature: string; count: number }> {
    const featureCounts = analytics.reduce((acc, a) => {
      const feature = a.eventName;
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // PRICE TREND ANALYSIS
  
  async analyzePriceTrends(drugId: number, region: string, analysisPeriod: string = '30d'): Promise<PriceTrend[]> {
    // Get historical price data
    const priceHistoryData = await db.select()
      .from(priceHistory)
      .where(and(
        eq(priceHistory.drugId, drugId),
        eq(priceHistory.region, region)
      ))
      .orderBy(desc(priceHistory.createdAt))
      .limit(100); // Get last 100 price points

    if (priceHistoryData.length < 2) {
      throw new Error('Insufficient data for trend analysis');
    }

    const trends: PriceTrend[] = [];
    
    // Calculate trends for different periods
    const periods = ['7d', '30d', '90d', '1y'];
    
    for (const period of periods) {
      const trend = await this.calculateTrend(drugId, region, priceHistoryData, period);
      trends.push(trend);
    }

    // Save trends to database
    for (const trend of trends) {
      await db.insert(priceTrends)
        .values({
          ...trend,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    return trends;
  }

  private async calculateTrend(
    drugId: number, 
    region: string, 
    priceData: any[], 
    period: string
  ): Promise<PriceTrend> {
    const days = this.getPeriodDays(period);
    const recentData = priceData.slice(0, days);
    
    if (recentData.length < 2) {
      throw new Error('Insufficient data for period');
    }

    const currentPrice = recentData[0].newPrice;
    const previousPrice = recentData[recentData.length - 1].newPrice;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = (priceChange / previousPrice) * 100;

    // Simple trend analysis (in production, use more sophisticated algorithms)
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    let trendStrength: 'weak' | 'moderate' | 'strong' = 'weak';
    
    if (Math.abs(priceChangePercent) > 10) {
      trendStrength = 'strong';
    } else if (Math.abs(priceChangePercent) > 5) {
      trendStrength = 'moderate';
    }

    if (priceChangePercent > 2) {
      trendDirection = 'up';
    } else if (priceChangePercent < -2) {
      trendDirection = 'down';
    }

    // Simple prediction (in production, use ML models)
    const predictedPrice = currentPrice * (1 + (priceChangePercent / 100) * 0.1);
    const confidence = Math.max(0.1, 1 - (days / 365)); // Higher confidence for shorter periods

    return {
      id: crypto.randomUUID(),
      drugId,
      region,
      currentPrice,
      previousPrice,
      priceChange,
      priceChangePercent,
      trendDirection,
      trendStrength,
      predictedPrice,
      confidence,
      dataPoints: recentData.length,
      analysisPeriod: period,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };
  }

  private getPeriodDays(period: string): number {
    const periodMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    return periodMap[period] || 30;
  }

  async getPriceTrends(drugId: number, region?: string): Promise<PriceTrend[]> {
    let query = db.select()
      .from(priceTrends)
      .where(eq(priceTrends.drugId, drugId));

    if (region) {
      query = query.where(and(
        eq(priceTrends.drugId, drugId),
        eq(priceTrends.region, region)
      ));
    }

    return await query.orderBy(desc(priceTrends.lastUpdated));
  }

  // MARKET INTELLIGENCE
  
  async generateMarketIntelligence(drugId: number, region: string): Promise<MarketIntelligence> {
    // Get current price and availability data
    const [drug] = await db.select()
      .from(egyptianDrugs)
      .where(eq(egyptianDrugs.id, drugId))
      .limit(1);

    if (!drug) {
      throw new Error('Drug not found');
    }

    const priceData = await db.select()
      .from(priceHistory)
      .where(and(
        eq(priceHistory.drugId, drugId),
        eq(priceHistory.region, region)
      ))
      .orderBy(desc(priceHistory.createdAt))
      .limit(10);

    // Analyze demand based on price history and search frequency
    const demandLevel = this.analyzeDemandLevel(priceData);
    const availabilityStatus = this.analyzeAvailability(drug, priceData);
    const seasonality = this.analyzeSeasonality(priceData);

    const intelligence: MarketIntelligence = {
      id: crypto.randomUUID(),
      drugId,
      region,
      availabilityStatus,
      stockLevel: this.estimateStockLevel(priceData),
      demandLevel,
      seasonality,
      competitorPricing: this.getCompetitorPricing(drugId, region),
      marketShare: this.estimateMarketShare(drugId, region),
      forecastDemand: this.forecastDemand(priceData),
      recommendedAction: this.generateRecommendedAction(availabilityStatus, demandLevel),
      insights: {
        priceVolatility: this.calculatePriceVolatility(priceData),
        marketPosition: this.analyzeMarketPosition(drug, priceData),
        recommendations: this.generateInsights(drug, demandLevel, availabilityStatus),
      },
      dataSource: 'pharmacy_api',
      reliability: 7,
      lastChecked: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    await db.insert(marketIntelligence)
      .values(intelligence)
      .onConflictDoNothing();

    return intelligence;
  }

  private analyzeDemandLevel(priceData: any[]): 'low' | 'medium' | 'high' | 'very_high' {
    if (priceData.length < 3) return 'medium';
    
    const recentPrices = priceData.slice(0, 5);
    const avgPrice = recentPrices.reduce((sum, p) => sum + parseFloat(p.newPrice), 0) / recentPrices.length;
    const priceVariation = Math.max(...recentPrices.map(p => parseFloat(p.newPrice))) / avgPrice;
    
    if (priceVariation > 1.2) return 'high';
    if (priceVariation > 1.1) return 'medium';
    return 'low';
  }

  private analyzeAvailability(drug: any, priceData: any[]): 'available' | 'limited' | 'out_of_stock' | 'discontinued' {
    const recentPrice = priceData[0];
    if (!recentPrice || recentPrice.createdAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      return 'limited';
    }
    return 'available';
  }

  private analyzeSeasonality(priceData: any[]): 'high_season' | 'low_season' | 'stable' | undefined {
    if (priceData.length < 12) return undefined;
    
    // Simple seasonality analysis based on price patterns
    const monthlyPrices = this.groupByMonth(priceData);
    const priceVariation = this.calculateMonthlyVariation(monthlyPrices);
    
    if (priceVariation > 0.15) return 'high_season';
    if (priceVariation < 0.05) return 'stable';
    return 'low_season';
  }

  private groupByMonth(priceData: any[]): Record<number, number[]> {
    return priceData.reduce((acc, p) => {
      const month = new Date(p.createdAt).getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(parseFloat(p.newPrice));
      return acc;
    }, {} as Record<number, number[]>);
  }

  private calculateMonthlyVariation(monthlyPrices: Record<number, number[]>): number {
    const monthlyAvgs = Object.values(monthlyPrices).map(prices => 
      prices.reduce((sum, price) => sum + price, 0) / prices.length
    );
    const avgPrice = monthlyAvgs.reduce((sum, price) => sum + price, 0) / monthlyAvgs.length;
    const maxDeviation = Math.max(...monthlyAvgs.map(price => Math.abs(price - avgPrice)));
    return maxDeviation / avgPrice;
  }

  private estimateStockLevel(priceData: any[]): number | undefined {
    if (priceData.length === 0) return undefined;
    // Simple stock estimation based on price stability
    const recentPrice = priceData[0].newPrice;
    return Math.floor(Math.random() * 1000); // Simulated stock level
  }

  private getCompetitorPricing(drugId: number, region: string): any {
    // Simulate competitor pricing data
    return {
      pharmacyA: Math.random() * 100 + 50,
      pharmacyB: Math.random() * 100 + 50,
      pharmacyC: Math.random() * 100 + 50,
    };
  }

  private estimateMarketShare(drugId: number, region: string): number | undefined {
    // Simulate market share estimation
    return Math.random() * 20; // 0-20% market share
  }

  private forecastDemand(priceData: any[]): number {
    // Simple demand forecast based on recent trends
    if (priceData.length < 3) return 100;
    
    const recentTrend = priceData[0].newPrice - priceData[2].newPrice;
    const baseDemand = 100;
    return Math.max(10, baseDemand + (recentTrend * 10));
  }

  private generateRecommendedAction(availability: string, demand: string): string {
    if (availability === 'out_of_stock') return 'Urgent restocking required';
    if (demand === 'high' && availability === 'limited') return 'Increase stock levels';
    if (demand === 'low') return 'Consider promotional pricing';
    return 'Monitor market trends';
  }

  private calculatePriceVolatility(priceData: any[]): number {
    if (priceData.length < 2) return 0;
    
    const prices = priceData.map(p => parseFloat(p.newPrice));
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
    return Math.sqrt(variance) / avgPrice;
  }

  private analyzeMarketPosition(drug: any, priceData: any[]): string {
    const currentPrice = parseFloat(priceData[0]?.newPrice || drug.price);
    const avgPrice = priceData.reduce((sum, p) => sum + parseFloat(p.newPrice), 0) / priceData.length;
    
    if (currentPrice < avgPrice * 0.9) return 'Competitive pricing';
    if (currentPrice > avgPrice * 1.1) return 'Premium pricing';
    return 'Market average pricing';
  }

  private generateInsights(drug: any, demand: string, availability: string): string[] {
    const insights = [];
    
    if (demand === 'high') {
      insights.push('High demand detected - consider inventory optimization');
    }
    
    if (availability === 'limited') {
      insights.push('Limited availability - potential stockout risk');
    }
    
    insights.push(`Active ingredient: ${drug.activeIngredient}`);
    
    return insights;
  }

  async getMarketIntelligence(drugId: number, region?: string): Promise<MarketIntelligence[]> {
    let query = db.select()
      .from(marketIntelligence)
      .where(eq(marketIntelligence.drugId, drugId));

    if (region) {
      query = query.where(and(
        eq(marketIntelligence.drugId, drugId),
        eq(marketIntelligence.region, region)
      ));
    }

    return await query.orderBy(desc(marketIntelligence.lastChecked));
  }

  // EXPORT FEATURES
  
  async createExport(userId: string, exportData: CreateExportHistory): Promise<ExportHistory> {
    const [exportRecord] = await db.insert(exportHistory)
      .values({
        userId,
        ...exportData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Process export asynchronously
    this.processExport(exportRecord.id).catch(console.error);

    return exportRecord;
  }

  private async processExport(exportId: string): Promise<void> {
    try {
      // Update status to processing
      await db.update(exportHistory)
        .set({
          status: 'processing',
          updatedAt: new Date(),
        })
        .where(eq(exportHistory.id, exportId));

      const [exportRecord] = await db.select()
        .from(exportHistory)
        .where(eq(exportHistory.id, exportId))
        .limit(1);

      if (!exportRecord) {
        throw new Error('Export record not found');
      }

      // Generate export based on type
      let downloadUrl: string | undefined;
      let fileSize: number | undefined;

      switch (exportRecord.exportType) {
        case 'pdf':
          const pdfResult = await this.generatePDFExport(exportRecord);
          downloadUrl = pdfResult.url;
          fileSize = pdfResult.size;
          break;
        case 'email':
          await this.sendEmailExport(exportRecord);
          break;
        case 'csv':
          const csvResult = await this.generateCSVExport(exportRecord);
          downloadUrl = csvResult.url;
          fileSize = csvResult.size;
          break;
      }

      // Update with completed status
      await db.update(exportHistory)
        .set({
          status: 'completed',
          downloadUrl,
          fileSize,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          updatedAt: new Date(),
        })
        .where(eq(exportHistory.id, exportId));

    } catch (error) {
      // Update with failed status
      await db.update(exportHistory)
        .set({
          status: 'failed',
          errorMessage: error.message,
          updatedAt: new Date(),
        })
        .where(eq(exportHistory.id, exportId));
      
      console.error('Export processing failed:', error);
      throw error;
    }
  }

  private async generatePDFExport(exportRecord: ExportHistory): Promise<{ url: string; size: number }> {
    // Simulate PDF generation (in production, use a PDF library like Puppeteer)
    const pdfContent = JSON.stringify(exportRecord.contentData, null, 2);
    const size = Buffer.byteLength(pdfContent);
    const url = `https://api.medscanegypt.com/exports/${exportRecord.id}.pdf`;
    
    console.log(`Generated PDF export: ${url}`);
    return { url, size };
  }

  private async sendEmailExport(exportRecord: ExportHistory): Promise<void> {
    // Simulate email sending (in production, use email service like SendGrid)
    console.log(`Sent email export to ${exportRecord.recipientEmail}`);
  }

  private async generateCSVExport(exportRecord: ExportHistory): Promise<{ url: string; size: number }> {
    // Simulate CSV generation
    const csvContent = this.convertToCSV(exportRecord.contentData);
    const size = Buffer.byteLength(csvContent);
    const url = `https://api.medscanegypt.com/exports/${exportRecord.id}.csv`;
    
    console.log(`Generated CSV export: ${url}`);
    return { url, size };
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion (in production, use a proper CSV library)
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0]);
      const csvRows = data.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      );
      return [headers.join(','), ...csvRows].join('\n');
    }
    return JSON.stringify(data);
  }

  async getUserExports(userId: string): Promise<ExportHistory[]> {
    return await db.select()
      .from(exportHistory)
      .where(eq(exportHistory.userId, userId))
      .orderBy(desc(exportHistory.createdAt));
  }

  async getExportDownloadUrl(exportId: string, userId: string): Promise<string | null> {
    const [exportRecord] = await db.select()
      .from(exportHistory)
      .where(and(
        eq(exportHistory.id, exportId),
        eq(exportHistory.userId, userId),
        eq(exportHistory.status, 'completed')
      ))
      .limit(1);

    if (!exportRecord || !exportRecord.downloadUrl) {
      return null;
    }

    // Check if export has expired
    if (exportRecord.expiresAt && new Date() > exportRecord.expiresAt) {
      return null;
    }

    return exportRecord.downloadUrl;
  }
}

export const backupSyncService = new BackupSyncService();
