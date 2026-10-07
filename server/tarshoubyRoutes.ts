import type { Request, Response } from "express";
import { tarshoubyService } from "./tarshoubyService";
import { priceService } from "./priceService";

// Search Tarshouby for drug prices
export async function searchTarshouby(req: Request, res: Response) {
  try {
    const { drugName } = req.query;

    if (!drugName || typeof drugName !== 'string') {
      return res.status(400).json({ error: "Drug name is required" });
    }

    if (drugName.length < 2) {
      return res.status(400).json({ error: "Drug name must be at least 2 characters" });
    }

    console.log(`Tarshouby search request for: ${drugName}`);

    const result = await tarshoubyService.searchProducts(drugName);

    res.json({
      success: true,
      data: result,
      message: `Found ${result.products.length} products on Tarshouby`,
    });
  } catch (error) {
    console.error("Error searching Tarshouby:", error);
    res.status(500).json({
      error: "Failed to search Tarshouby",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Get Tarshouby product details
export async function getTarshoubyProductDetails(req: Request, res: Response) {
  try {
    const { productUrl } = req.query;

    if (!productUrl || typeof productUrl !== 'string') {
      return res.status(400).json({ error: "Product URL is required" });
    }

    const details = await tarshoubyService.getProductDetails(productUrl);

    if (!details) {
      return res.status(404).json({ error: "Product details not found" });
    }

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error("Error fetching Tarshouby product details:", error);
    res.status(500).json({
      error: "Failed to fetch product details",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Update price from Tarshouby data
export async function updatePriceFromTarshouby(req: Request, res: Response) {
  try {
    const { drugId, tarshoubyProduct } = req.body;

    if (!drugId || !tarshoubyProduct) {
      return res.status(400).json({ error: "Drug ID and Tarshouby product data are required" });
    }

    if (!tarshoubyProduct.price) {
      return res.status(400).json({ error: "Tarshouby product price is required" });
    }

    // Update price using the price service
    const result = await priceService.updatePrice({
      drugId,
      newPrice: tarshoubyProduct.price,
      pharmacy: "Al Abdellatif Tarshouby",
      region: "Egypt",
      source: "pharmacy_api",
      notes: `Price from Tarshouby website. Product: ${tarshoubyProduct.name}`,
    });

    res.json({
      success: true,
      message: "Price updated from Tarshouby data",
      data: {
        ...result,
        tarshoubyProduct,
      },
    });
  } catch (error) {
    console.error("Error updating price from Tarshouby:", error);
    res.status(500).json({
      error: "Failed to update price from Tarshouby",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Bulk update prices from Tarshouby
export async function bulkUpdatePricesFromTarshouby(req: Request, res: Response) {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "Updates array is required" });
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "At least one update is required" });
    }

    if (updates.length > 50) {
      return res.status(400).json({ error: "Maximum 50 updates allowed per request" });
    }

    const results = [];

    for (const update of updates) {
      try {
        const { drugId, tarshoubyProduct } = update;
        
        if (!drugId || !tarshoubyProduct?.price) {
          console.warn(`Skipping invalid update: drugId=${drugId}, hasPrice=${!!tarshoubyProduct?.price}`);
          continue;
        }

        const result = await priceService.updatePrice({
          drugId,
          newPrice: tarshoubyProduct.price,
          pharmacy: "Al Abdellatif Tarshouby",
          region: "Egypt",
          source: "pharmacy_api",
          notes: `Bulk update from Tarshouby. Product: ${tarshoubyProduct.name}`,
        });

        results.push({
          success: true,
          drugId,
          result,
        });
      } catch (error) {
        console.error(`Failed to update drug ${update.drugId}:`, error);
        results.push({
          success: false,
          drugId: update.drugId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: `Processed ${results.length} updates: ${successCount} successful, ${failureCount} failed`,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results,
      },
    });
  } catch (error) {
    console.error("Error in bulk Tarshouby price update:", error);
    res.status(500).json({
      error: "Failed to perform bulk price update",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Get Tarshouby website health
export async function getTarshoubyHealth(req: Request, res: Response) {
  try {
    const health = await tarshoubyService.getWebsiteHealth();

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error("Error checking Tarshouby health:", error);
    res.status(500).json({
      error: "Failed to check Tarshouby website health",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Compare prices across sources
export async function comparePrices(req: Request, res: Response) {
  try {
    const { drugName } = req.query;

    if (!drugName || typeof drugName !== 'string') {
      return res.status(400).json({ error: "Drug name is required" });
    }

    // Get Tarshouby prices
    const tarshoubyResult = await tarshoubyService.searchProducts(drugName);

    // Get current database prices
    const currentDrug = await priceService.getPriceStatistics(parseInt(drugName) || 0);

    res.json({
      success: true,
      data: {
        drugName,
        tarshouby: tarshoubyResult,
        currentDatabase: currentDrug,
        comparison: {
          tarshoubyCount: tarshoubyResult.products.length,
          hasDatabasePrice: !!currentDrug.currentPrice,
          priceDifference: currentDrug.currentPrice && tarshoubyResult.products[0]?.price
            ? tarshoubyResult.products[0].price - currentDrug.currentPrice
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Error comparing prices:", error);
    res.status(500).json({
      error: "Failed to compare prices",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
