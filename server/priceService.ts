import { db, schema } from './db';
import { eq, and, desc, asc, gt, lt, inArray } from 'drizzle-orm';
import { UpdatePrice, BulkPriceUpdate, PriceHistory, EgyptianDrug } from '../shared/schema';

export class PriceService {
  // Update single drug price with history tracking
  async updatePrice(updateData: UpdatePrice): Promise<{ drug: EgyptianDrug; history: PriceHistory }> {
    const { drugId, newPrice, pharmacy, region, source, notes } = updateData;

    // Get current drug info
    const currentDrug = await db
      .select()
      .from(schema.egyptianDrugs)
      .where(eq(schema.egyptianDrugs.id, drugId))
      .limit(1);

    if (!currentDrug[0]) {
      throw new Error('Drug not found');
    }

    const oldPrice = currentDrug[0].price;

    // Update drug price
    await db
      .update(schema.egyptianDrugs)
      .set({
        price: String(newPrice),
        lastPriceUpdate: new Date(),
        priceVerified: source === 'pharmacy_api',
      })
      .where(eq(schema.egyptianDrugs.id, drugId));

    // Create price history record
    const historyRecord = await db
      .insert(schema.priceHistory)
      .values({
        drugId,
        oldPrice: oldPrice ? String(oldPrice) : null,
        newPrice: String(newPrice),
        pharmacy: pharmacy || null,
        region: region || null,
        source,
        notes: notes || null,
        verified: source === 'pharmacy_api',
      })
      .returning();

    // Get updated drug
    const updatedDrug = await db
      .select()
      .from(schema.egyptianDrugs)
      .where(eq(schema.egyptianDrugs.id, drugId))
      .limit(1);

    return {
      drug: updatedDrug[0],
      history: historyRecord[0],
    };
  }

  // Bulk price update
  async bulkUpdatePrices(updateData: BulkPriceUpdate): Promise<Array<{ drug: EgyptianDrug; history: PriceHistory }>> {
    const results = [];
    
    for (const update of updateData.updates) {
      try {
        const result = await this.updatePrice(update);
        results.push(result);
      } catch (error) {
        console.error(`Failed to update price for drug ${update.drugId}:`, error);
        // Continue with other updates
      }
    }

    return results;
  }

  // Get price history for a drug
  async getPriceHistory(
    drugId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<PriceHistory[]> {
    return await db
      .select()
      .from(schema.priceHistory)
      .where(eq(schema.priceHistory.drugId, drugId))
      .orderBy(desc(schema.priceHistory.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Get price changes within a date range
  async getPriceChanges(
    startDate: Date,
    endDate: Date,
    drugId?: number
  ): Promise<PriceHistory[]> {
    let query = db
      .select()
      .from(schema.priceHistory)
      .where(
        and(
          gt(schema.priceHistory.createdAt, startDate),
          lt(schema.priceHistory.createdAt, endDate)
        )
      );

    if (drugId) {
      return await db
        .select()
        .from(schema.priceHistory)
        .where(
          and(
            eq(schema.priceHistory.drugId, drugId),
            gt(schema.priceHistory.createdAt, startDate),
            lt(schema.priceHistory.createdAt, endDate)
          )
        )
        .orderBy(desc(schema.priceHistory.createdAt));
    }

    return await db
      .select()
      .from(schema.priceHistory)
      .where(
        and(
          gt(schema.priceHistory.createdAt, startDate),
          lt(schema.priceHistory.createdAt, endDate)
        )
      )
      .orderBy(desc(schema.priceHistory.createdAt));
  }

  // Get drugs with recent price changes
  async getRecentPriceChanges(days: number = 7, limit: number = 20): Promise<Array<{ drug: EgyptianDrug; latestHistory: PriceHistory }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentHistory = await db
      .select()
      .from(schema.priceHistory)
      .where(gt(schema.priceHistory.createdAt, startDate))
      .orderBy(desc(schema.priceHistory.createdAt))
      .limit(limit);

    const drugIds = Array.from(new Set(recentHistory.map(h => h.drugId)));
    const drugs = drugIds.length
      ? await db.select().from(schema.egyptianDrugs).where(inArray(schema.egyptianDrugs.id, drugIds))
      : [];
    const drugMap = new Map(drugs.map(d => [d.id, d]));

    return recentHistory
      .map(history => {
        const drug = drugMap.get(history.drugId);
        return drug ? { drug, latestHistory: history } : null;
      })
      .filter((entry): entry is { drug: EgyptianDrug; latestHistory: PriceHistory } => Boolean(entry));
  }

  // Get price statistics for a drug
  async getPriceStatistics(drugId: number): Promise<{
    currentPrice: number | null;
    averagePrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    priceChangeCount: number;
    lastUpdated: Date | null;
  }> {
    const drug = await db
      .select()
      .from(schema.egyptianDrugs)
      .where(eq(schema.egyptianDrugs.id, drugId))
      .limit(1);

    if (!drug[0]) {
      throw new Error('Drug not found');
    }

    const priceHistory = await db
      .select({
        newPrice: schema.priceHistory.newPrice,
      })
      .from(schema.priceHistory)
      .where(eq(schema.priceHistory.drugId, drugId));

    const prices = priceHistory.map(h => Number(h.newPrice)).filter(p => p > 0);

    return {
      currentPrice: drug[0].price ? Number(drug[0].price) : null,
      averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      maxPrice: prices.length > 0 ? Math.max(...prices) : null,
      priceChangeCount: prices.length,
      lastUpdated: drug[0].lastPriceUpdate || null,
    };
  }

  // Get price trends analysis
  async getPriceTrends(drugId: number, days: number = 30): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
    dataPoints: Array<{ date: Date; price: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await db
      .select()
      .from(schema.priceHistory)
      .where(
        and(
          eq(schema.priceHistory.drugId, drugId),
          gt(schema.priceHistory.createdAt, startDate)
        )
      )
      .orderBy(asc(schema.priceHistory.createdAt));

    if (history.length < 2) {
      return {
        trend: 'stable',
        percentageChange: 0,
        dataPoints: history.filter(h => h.createdAt).map(h => ({ date: h.createdAt!, price: Number(h.newPrice) })),
      };
    }

    const firstPrice = Number(history[0].newPrice);
    const lastPrice = Number(history[history.length - 1].newPrice);
    const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (percentageChange > 5) {
      trend = 'increasing';
    } else if (percentageChange < -5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      trend,
      percentageChange,
      dataPoints: history.filter(h => h.createdAt).map(h => ({ date: h.createdAt!, price: Number(h.newPrice) })),
    };
  }

  // Verify price (mark as verified)
  async verifyPrice(drugId: number, verified: boolean = true): Promise<EgyptianDrug> {
    await db
      .update(schema.egyptianDrugs)
      .set({ priceVerified: verified })
      .where(eq(schema.egyptianDrugs.id, drugId));

    const updatedDrug = await db
      .select()
      .from(schema.egyptianDrugs)
      .where(eq(schema.egyptianDrugs.id, drugId))
      .limit(1);

    if (!updatedDrug[0]) {
      throw new Error('Drug not found');
    }

    return updatedDrug[0];
  }

  // Get unverified prices
  async getUnverifiedPrices(limit: number = 50): Promise<Array<{ drug: EgyptianDrug; lastHistory: PriceHistory | null }>> {
    const drugs = await db
      .select()
      .from(schema.egyptianDrugs)
      .where(eq(schema.egyptianDrugs.priceVerified, false))
      .limit(limit);

    const drugIds = drugs.map(d => d.id);
    const histories = drugIds.length
      ? await db
          .select()
          .from(schema.priceHistory)
          .where(inArray(schema.priceHistory.drugId, drugIds))
          .orderBy(desc(schema.priceHistory.createdAt))
      : [];

    // Keep only latest history per drug
    const latestHistoryByDrug = new Map<number, PriceHistory>();
    for (const history of histories) {
      if (!latestHistoryByDrug.has(history.drugId)) {
        latestHistoryByDrug.set(history.drugId, history);
      }
    }

    return drugs.map(drug => ({
      drug,
      lastHistory: latestHistoryByDrug.get(drug.id) || null,
    }));
  }
}

export const priceService = new PriceService();
