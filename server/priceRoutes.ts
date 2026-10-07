import type { Request, Response } from "express";
import { priceService } from "./priceService";
import { updatePriceSchema, bulkPriceUpdateSchema } from "../shared/schema";

// Update single drug price
export async function updateDrugPrice(req: Request, res: Response) {
  try {
    const validationResult = updatePriceSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validationResult.error.errors,
      });
    }

    const result = await priceService.updatePrice(validationResult.data);
    
    res.json({
      success: true,
      message: "Price updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating drug price:", error);
    res.status(500).json({
      error: "Failed to update price",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Bulk price update
export async function bulkUpdatePrices(req: Request, res: Response) {
  try {
    const validationResult = bulkPriceUpdateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validationResult.error.errors,
      });
    }

    const results = await priceService.bulkUpdatePrices(validationResult.data);
    
    res.json({
      success: true,
      message: `Updated ${results.length} prices`,
      data: results,
    });
  } catch (error) {
    console.error("Error in bulk price update:", error);
    res.status(500).json({
      error: "Failed to update prices",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Get price history for a drug
export async function getPriceHistory(req: Request, res: Response) {
  try {
    const drugId = parseInt(req.params.drugId);
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(drugId)) {
      return res.status(400).json({ error: "Invalid drug ID" });
    }

    const history = await priceService.getPriceHistory(drugId, limit, offset);
    
    res.json({
      drugId,
      history,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    res.status(500).json({
      error: "Failed to fetch price history",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Get price statistics for a drug
export async function getPriceStatistics(req: Request, res: Response) {
  try {
    const drugId = parseInt(req.params.drugId);

    if (isNaN(drugId)) {
      return res.status(400).json({ error: "Invalid drug ID" });
    }

    const statistics = await priceService.getPriceStatistics(drugId);
    
    res.json({
      drugId,
      statistics,
    });
  } catch (error) {
    console.error("Error fetching price statistics:", error);
    res.status(500).json({
      error: "Failed to fetch price statistics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Get price trends for a drug
export async function getPriceTrends(req: Request, res: Response) {
  try {
    const drugId = parseInt(req.params.drugId);
    const days = Math.min(parseInt(req.query.days as string) || 30, 365);

    if (isNaN(drugId)) {
      return res.status(400).json({ error: "Invalid drug ID" });
    }

    const trends = await priceService.getPriceTrends(drugId, days);
    
    res.json({
      drugId,
      days,
      trends,
    });
  } catch (error) {
    console.error("Error fetching price trends:", error);
    res.status(500).json({
      error: "Failed to fetch price trends",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Get recent price changes
export async function getRecentPriceChanges(req: Request, res: Response) {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 7, 90);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const changes = await priceService.getRecentPriceChanges(days, limit);
    
    res.json({
      days,
      limit,
      changes,
    });
  } catch (error) {
    console.error("Error fetching recent price changes:", error);
    res.status(500).json({
      error: "Failed to fetch recent price changes",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Verify price
export async function verifyDrugPrice(req: Request, res: Response) {
  try {
    const drugId = parseInt(req.params.drugId);
    const { verified } = req.body;

    if (isNaN(drugId)) {
      return res.status(400).json({ error: "Invalid drug ID" });
    }

    const drug = await priceService.verifyPrice(drugId, verified !== false);
    
    res.json({
      success: true,
      message: `Price ${verified !== false ? 'verified' : 'unverified'} successfully`,
      drug,
    });
  } catch (error) {
    console.error("Error verifying price:", error);
    res.status(500).json({
      error: "Failed to verify price",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Get unverified prices
export async function getUnverifiedPrices(req: Request, res: Response) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const unverified = await priceService.getUnverifiedPrices(limit);
    
    res.json({
      limit,
      unverified,
    });
  } catch (error) {
    console.error("Error fetching unverified prices:", error);
    res.status(500).json({
      error: "Failed to fetch unverified prices",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Get price changes within date range
export async function getPriceChangesByDateRange(req: Request, res: Response) {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const drugId = req.query.drugId ? parseInt(req.query.drugId as string) : undefined;

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const changes = await priceService.getPriceChanges(startDate, endDate, drugId);
    
    res.json({
      startDate,
      endDate,
      drugId,
      changes,
    });
  } catch (error) {
    console.error("Error fetching price changes by date range:", error);
    res.status(500).json({
      error: "Failed to fetch price changes",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
