import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import { mockDrugService } from "./mockDrugService";
import { EgyptianDrug } from "../shared/schema";
import {
  updateDrugPrice,
  bulkUpdatePrices,
  getPriceHistory,
  getPriceStatistics,
  getPriceTrends,
  getRecentPriceChanges,
  verifyDrugPrice,
  getUnverifiedPrices,
  getPriceChangesByDateRange,
} from "./priceRoutes";
import {
  searchTarshouby,
  getTarshoubyProductDetails,
  updatePriceFromTarshouby,
  bulkUpdatePricesFromTarshouby,
  getTarshoubyHealth,
  comparePrices,
} from "./tarshoubyRoutes";
import {
  authenticate,
  optionalAuthenticate,
  requirePremium,
  requireEmailVerification,
  rateLimit,
  securityHeaders,
  requestLogger,
  errorHandler,
} from "./authMiddleware";
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  getSessions,
  verifyEmail,
} from "./authRoutes";
import advancedFeaturesRoutes from "./advancedFeaturesRoutes";
import externalInteractionRoutes from "./externalInteractionRoutes";
import backupSyncRoutes from "./backupSyncRoutes";
// import userReviewsRoutes from "./userReviewsRoutes"; // Temporarily disabled due to syntax errors
import { cacheMiddleware, CacheManager } from "./cache";
import ImageOptimizer, { IMAGE_CONFIGS, ImageUtils } from "./imageOptimizer";

interface PharmacyResult {
  pharmacy: string;
  searchUrl: string;
  logoColor: string;
}

function generatePharmacyLinks(medicineName: string): PharmacyResult[] {
  const encodedName = encodeURIComponent(medicineName);
  
  return [
    {
      pharmacy: "Seif",
      searchUrl: `https://www.seif-online.com/en/products?search=${encodedName}`,
      logoColor: "#E31837",
    },
    {
      pharmacy: "Tarshouby",
      searchUrl: `https://alabdellatif-tarshouby.com/en/products?search=${encodedName}`,
      logoColor: "#1E3A8A",
    },
    {
      pharmacy: "Google",
      searchUrl: `https://www.google.com/search?q=${encodedName}+Egypt+pharmacy+price`,
      logoColor: "#4285F4",
    },
  ];
}

async function findNearestMatch(name: string): Promise<{ match: EgyptianDrug | null; similarity: number }> {
  const normalizedName = name.toLowerCase().trim();
  
  try {
    // First try exact match
    const exactMatch = await mockDrugService.searchDrugByName(name);
    if (exactMatch) {
      return { match: exactMatch, similarity: 1.0 };
    }
    
    // If no exact match, try partial matches
    const allDrugs = await mockDrugService.getAllDrugs(1000, 0); // Get first 1000 for matching
    let bestMatch: EgyptianDrug | null = null;
    let bestSimilarity = 0;

    for (const drug of allDrugs) {
      const drugName = drug.name.toLowerCase();
      const drugArabic = drug.nameArabic.toLowerCase();

      if (drugName.startsWith(normalizedName) || normalizedName.startsWith(drugName)) {
        const similarity = 0.9;
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = drug;
        }
      }

      // Check for partial substring matches
      if (drugName.includes(normalizedName) || normalizedName.includes(drugName)) {
        const similarity = 0.7;
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = drug;
        }
      }
    }

  return { match: bestMatch, similarity: bestSimilarity };
  } catch (error) {
    console.error('Error finding nearest match:', error);
    return { match: null, similarity: 0 };
  }
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

async function findAlternatives(activeIngredient: string | undefined, category: string | undefined, excludeName: string): Promise<EgyptianDrug[]> {
  return await mockDrugService.findAlternatives(excludeName, activeIngredient, category, 5);
}

const openai = process.env.AI_INTEGRATIONS_OPENAI_API_KEY && 
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY !== 'your-openai-api-key-placeholder'
  ? new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    })
  : null;

interface Medicine {
  name: string;
  nameArabic?: string;
  confidence: number;
  activeIngredient?: string;
}

interface Recommendation {
  dosing?: string;
  interactions?: string[];
  contraindications?: string[];
  recommendations?: string[];
}

export function registerRoutes(app: Express): Server {
  // Apply global middleware
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

  // Authentication Routes
  app.post("/api/auth/register", rateLimit(5, 15 * 60 * 1000), register); // 5 registrations per 15 minutes
  app.post("/api/auth/login", rateLimit(10, 15 * 60 * 1000), login); // 10 login attempts per 15 minutes
  app.post("/api/auth/refresh", refreshToken);
  app.post("/api/auth/logout", authenticate, logout);
  app.post("/api/auth/logout-all", authenticate, logoutAll);
  app.post("/api/auth/forgot-password", rateLimit(3, 15 * 60 * 1000), forgotPassword); // 3 password resets per 15 minutes
  app.post("/api/auth/reset-password", resetPassword);
  app.post("/api/auth/change-password", authenticate, changePassword);
  app.get("/api/auth/profile", authenticate, getProfile);
  app.get("/api/auth/sessions", authenticate, getSessions);
  app.get("/api/auth/verify-email", verifyEmail);

  // Protected Routes (require authentication)
  app.post("/api/analyze-prescription", authenticate, async (req: Request, res: Response) => {
    try {
      if (!openai) {
        return res.status(503).json({ 
          error: "AI service unavailable", 
          message: "OpenAI API key not configured" 
        });
      }

      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Image is required" });
      }

      // Optimize image for OCR processing
      const imageOptimizer = ImageOptimizer.getInstance();
      const imageBuffer = ImageUtils.base64ToBuffer(image);
      
      // Validate image first
      const isValidImage = await imageOptimizer.validateImage(imageBuffer);
      if (!isValidImage) {
        return res.status(400).json({ error: "Invalid image format" });
      }

      // Optimize for OCR analysis
      const optimizedResult = await imageOptimizer.optimizeImage(
        imageBuffer, 
        IMAGE_CONFIGS.ocr
      );
      
      console.log(`Image optimized: ${ImageUtils.formatFileSize(optimizedResult.metadata.originalSize)} → ${ImageUtils.formatFileSize(optimizedResult.metadata.optimizedSize)} (${(optimizedResult.metadata.compressionRatio * 100).toFixed(1)}% reduction)`);

      // Use optimized image for OCR
      const optimizedImage = ImageUtils.bufferToBase64(optimizedResult.buffer, 'image/jpeg');

      const ocrResponse = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `You are a medical prescription OCR specialist. Analyze handwritten prescriptions and extract medicine names.
            
Your task:
1. Identify all medicine/drug names in the prescription image
2. Match them to common Egyptian pharmaceutical brand names when possible
3. Include confidence scores based on legibility

Return a JSON object with this structure:
{
  "medicines": [
    {
      "name": "Medicine Name",
      "nameArabic": "Arabic name if visible",
      "confidence": 85
    }
  ]
}

Common Egyptian drug brands to look for: Augmentin, Panadol, Concor, Glucophage, Zyrtec, Cipro, Amaryl, Nexium, Lipitor, Ventolin, Aspirin Protect, Januvia

Always respond with valid JSON only.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: optimizedImage,
                },
              },
              {
                type: "text",
                text: "Please analyze this handwritten prescription and extract all medicine names. Return the results as JSON.",
              },
            ],
          },
        ],
        max_completion_tokens: 1024,
      });

      const ocrContent = ocrResponse.choices[0]?.message?.content || "{}";
      let parsedOcr: { medicines: Medicine[] };

      try {
        const jsonMatch = ocrContent.match(/\{[\s\S]*\}/);
        parsedOcr = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
      } catch {
        parsedOcr = { medicines: [] };
      }

      const medicines = parsedOcr.medicines || [];

      // Step 2: Get composition data for each medicine (like Dalil Aldawaa)
      const compositionResponse = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `You are a pharmaceutical database specialist with knowledge of Egyptian medicines (similar to dalilaldawaa.com).

For each medicine, provide its composition and active ingredients as they would appear in an Egyptian drug database.

Return JSON array with this structure:
[
  {
    "name": "Medicine Name",
    "activeIngredient": "Main active ingredient",
    "composition": "Full composition with strengths",
    "therapeuticClass": "Drug class (e.g., Antibiotic, Analgesic)",
    "manufacturer": "Manufacturer name if known"
  }
]

Be accurate with Egyptian brand names and their formulations. Respond with valid JSON only.`,
          },
          {
            role: "user",
            content: `Provide composition data for these Egyptian medicines: ${JSON.stringify(medicines.map(m => m.name))}`,
          },
        ],
        max_completion_tokens: 1024,
      });

      let compositionData: any[] = [];
      try {
        const compContent = compositionResponse.choices[0]?.message?.content || "[]";
        const jsonMatch = compContent.match(/\[[\s\S]*\]/);
        compositionData = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
      } catch {
        compositionData = [];
      }

      // Step 3: Get clinical recommendations using composition data (Meditron-style AI)
      // Get a sample of drug names for the AI context
      const sampleDrugs = await mockDrugService.getAllDrugs(1000, 0);
      const drugNames = sampleDrugs.map((d) => d.name).join(", ");
      
      const recommendationsResponse = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `You are Meditron, a medical AI assistant specializing in Egyptian pharmaceuticals. Provide clinical recommendations based on drug composition and interactions.

Available Egyptian drugs database: ${drugNames}

Drug composition data from Egyptian database:
${JSON.stringify(compositionData, null, 2)}

For each medicine, analyze the composition and provide:
1. Dosing guidance based on active ingredient strength
2. Drug interactions (especially with other medicines in the prescription based on their active ingredients)
3. Contraindications based on drug class and composition
4. General recommendations

Be concise but thorough. Use clinical language. Consider interactions between all medicines in the prescription.
Always recommend consulting a healthcare provider.

Return JSON array with this structure:
[
  {
    "dosing": "Dosing instructions based on composition",
    "interactions": ["interaction1 with specific drugs", "interaction2"],
    "contraindications": ["contraindication1"],
    "recommendations": ["recommendation1", "recommendation2"]
  }
]

Respond with valid JSON only.`,
          },
          {
            role: "user",
            content: `Provide clinical recommendations for these medicines found in a prescription: ${JSON.stringify(medicines)}`,
          },
        ],
        max_completion_tokens: 2048,
      });

      const recContent = recommendationsResponse.choices[0]?.message?.content || "[]";
      let recommendations: Recommendation[];

      try {
        const jsonMatch = recContent.match(/\[[\s\S]*\]/);
        recommendations = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
      } catch {
        recommendations = medicines.map(() => ({
          dosing: "Consult your healthcare provider for dosing information.",
          interactions: [],
          contraindications: [],
          recommendations: ["Always follow your doctor's instructions."],
        }));
      }

      const enrichedMedicines = await Promise.all(medicines.map(async (med, idx) => {
        const compMatch = compositionData.find(
          (c: any) => c.name?.toLowerCase() === med.name.toLowerCase()
        );
        
        const exactMatch = await mockDrugService.searchDrugByName(med.name);

        let verificationStatus: "verified" | "suggested" | "unverified" = "unverified";
        let suggestedMatch: EgyptianDrug | null = null;
        let alternatives: EgyptianDrug[] = [];

        if (exactMatch) {
          verificationStatus = "verified";
          alternatives = await findAlternatives(exactMatch.activeIngredient || undefined, exactMatch.category || undefined, exactMatch.name);
        } else {
          const { match, similarity } = await findNearestMatch(med.name);
          if (match && similarity >= 0.7) {
            verificationStatus = "suggested";
            suggestedMatch = match;
            alternatives = await findAlternatives(match.activeIngredient || undefined, match.category || undefined, match.name);
          }
        }

        const activeIngredient = compMatch?.activeIngredient || exactMatch?.activeIngredient || suggestedMatch?.activeIngredient;
        const category = compMatch?.therapeuticClass || exactMatch?.category || suggestedMatch?.category;
        
        if (alternatives.length === 0) {
          alternatives = await findAlternatives(activeIngredient, category, med.name);
        }

        return {
          ...med,
          nameArabic: med.nameArabic || exactMatch?.nameArabic || suggestedMatch?.nameArabic,
          activeIngredient,
          composition: compMatch?.composition,
          therapeuticClass: compMatch?.therapeuticClass || exactMatch?.category || suggestedMatch?.category,
          manufacturer: compMatch?.manufacturer,
          verificationStatus,
          suggestedMatch: suggestedMatch ? {
            name: suggestedMatch.name,
            nameArabic: suggestedMatch.nameArabic,
            activeIngredient: suggestedMatch.activeIngredient,
          } : null,
          alternatives: alternatives.map((alt) => ({
            name: alt.name,
            nameArabic: alt.nameArabic,
            activeIngredient: alt.activeIngredient,
            dosing: alt.dosing,
          })),
        };
      }));

      res.json({
        medicines: enrichedMedicines,
        recommendations,
        compositionSource: "Dalil Aldawaa Egyptian Drug Database",
      });
    } catch (error) {
      console.error("Error analyzing prescription:", error);
      res.status(500).json({
        error: "Failed to analyze prescription",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });


  app.post("/api/pharmacy-search", async (req: Request, res: Response) => {
    try {
      const { medicineName } = req.body;

      if (!medicineName) {
        return res.status(400).json({ error: "Medicine name is required" });
      }

      const pharmacyLinks = generatePharmacyLinks(medicineName);

      const drugInfo = await mockDrugService.searchDrugByName(medicineName);

      let imageUrl: string | null = null;
      let productDescription: string | null = null;

      try {
        const searchResponse = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            {
              role: "system",
              content: `You are a pharmaceutical product information assistant. For the given medicine name, provide accurate product information.
              
Return JSON with this structure:
{
  "productName": "Full product name with strength",
  "manufacturer": "Manufacturer name",
  "description": "Brief description of the medicine and its use",
  "typicalPrice": "Approximate price range in Egyptian Pounds",
  "packaging": "Common packaging info (e.g., box of 20 tablets)"
}

Respond with valid JSON only.`,
            },
            {
              role: "user",
              content: `Provide product information for the Egyptian medicine: ${medicineName}`,
            },
          ],
          max_completion_tokens: 512,
        });

        const content = searchResponse.choices[0]?.message?.content || "{}";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const productInfo = JSON.parse(jsonMatch[0]);
          productDescription = productInfo.description;
        }
      } catch (error) {
        console.error("Error fetching product info:", error);
      }

      res.json({
        medicineName,
        pharmacyLinks,
        productDescription,
        drugInfo: drugInfo || null,
      });
    } catch (error) {
      console.error("Error in pharmacy search:", error);
      res.status(500).json({
        error: "Failed to search pharmacies",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  function fuzzyMatch(text: string, query: string): { matches: boolean; score: number } {
    if (!text || !query) return { matches: false, score: 0 };
    
    const normalizedText = text.toLowerCase().replace(/[-_.,()]/g, ' ').replace(/\s+/g, ' ').trim();
    const normalizedQuery = query.toLowerCase().replace(/[-_.,()]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (normalizedText === normalizedQuery) return { matches: true, score: 100 };
    if (normalizedText.includes(normalizedQuery)) return { matches: true, score: 90 };
    if (normalizedQuery.includes(normalizedText)) return { matches: true, score: 85 };
    
    const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);
    const textWords = normalizedText.split(' ');
    
    let matchedWords = 0;
    let partialMatches = 0;
    
    for (const qWord of queryWords) {
      for (const tWord of textWords) {
        if (tWord === qWord) {
          matchedWords++;
          break;
        } else if (tWord.includes(qWord) || qWord.includes(tWord)) {
          partialMatches++;
          break;
        } else if (tWord.startsWith(qWord.slice(0, 3)) || qWord.startsWith(tWord.slice(0, 3))) {
          partialMatches += 0.5;
          break;
        }
      }
    }
    
    if (queryWords.length > 0) {
      const matchRatio = (matchedWords + partialMatches * 0.7) / queryWords.length;
      if (matchRatio >= 0.5) {
        return { matches: true, score: 50 + matchRatio * 40 };
      }
    }
    
    const maxLen = Math.max(normalizedText.length, normalizedQuery.length);
    const distance = levenshteinDistance(normalizedText.slice(0, 30), normalizedQuery.slice(0, 30));
    const similarity = 1 - distance / maxLen;
    
    if (similarity >= 0.6) {
      return { matches: true, score: similarity * 60 };
    }
    
    return { matches: false, score: 0 };
  }

  app.get("/api/drugs", cacheMiddleware.drugs, async (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string || "").trim();
      const category = (req.query.category as string || "All");
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = (page - 1) * limit;

      let drugs: EgyptianDrug[];

      if (search || (category && category !== "All")) {
        // Use the search service with filters
        drugs = await mockDrugService.searchDrugs({
          name: search || undefined,
          category: category !== "All" ? category : undefined,
          limit,
          offset
        });
      } else {
        // Get all drugs with pagination
        drugs = await mockDrugService.getAllDrugs(limit, offset);
      }

      const total = await mockDrugService.getTotalCount();

      const responseDrugs = drugs.map((drug) => ({
        id: String(drug.id),
        name: drug.name,
        nameArabic: drug.nameArabic || "",
        activeIngredient: drug.activeIngredient || "",
        category: drug.category || "Medicine",
        manufacturer: drug.manufacturer || "",
        form: drug.form || "",
        price: drug.price ? String(drug.price) : "",
        dosing: drug.dosing || "",
        description: drug.descriptionEnglish || drug.descriptionArabic || "",
      }));

      res.json({
        drugs: responseDrugs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching drugs:", error);
      res.status(500).json({ error: "Failed to fetch drugs" });
    }
  });

  app.get("/api/drugs/:id", cacheMiddleware.drugs, async (req: Request, res: Response) => {
    try {
      const drugId = req.params.id;
      const drug = await mockDrugService.getDrugById(parseInt(drugId));

      if (!drug) {
        return res.status(404).json({ error: "Drug not found" });
      }

      res.json({
        id: String(drug.id),
        name: drug.name,
        nameArabic: drug.nameArabic || "",
        activeIngredient: drug.activeIngredient || "",
        category: drug.category || "Medicine",
        manufacturer: drug.manufacturer || "",
        form: drug.form || "",
        price: drug.price ? String(drug.price) : "",
        dosing: drug.dosing || "",
        description: drug.descriptionEnglish || drug.descriptionArabic || "",
        interactions: drug.interactions || [],
        contraindications: drug.contraindications || [],
        sideEffects: drug.sideEffects || [],
      });
    } catch (error) {
      console.error("Error fetching drug:", error);
      res.status(500).json({ error: "Failed to fetch drug" });
    }
  });

  // Price Management Endpoints
  
  // Update single drug price
  app.post("/api/drugs/:drugId/price", updateDrugPrice);
  
  // Bulk price update
  app.post("/api/prices/bulk-update", bulkUpdatePrices);
  
  // Get price history for a drug
  app.get("/api/drugs/:drugId/price-history", cacheMiddleware.prices, getPriceHistory);
  
  // Get price statistics for a drug
  app.get("/api/drugs/:drugId/price-statistics", cacheMiddleware.prices, getPriceStatistics);
  
  // Get price trends for a drug
  app.get("/api/drugs/:drugId/price-trends", cacheMiddleware.prices, getPriceTrends);
  
  // Get recent price changes
  app.get("/api/prices/recent-changes", cacheMiddleware.prices, getRecentPriceChanges);
  
  // Update drug price with cache invalidation
  app.post("/api/drugs/:drugId/price", authenticate, async (req: Request, res: Response) => {
    try {
      const result = await updateDrugPrice(req, res);
      
      // Invalidate relevant caches
      CacheManager.invalidateDrug(req.params.drugId);
      CacheManager.invalidatePrices();
      
      return result;
    } catch (error) {
      console.error("Error updating price:", error);
      res.status(500).json({ error: "Failed to update price" });
    }
  });
  
  // Verify price
  app.put("/api/drugs/:drugId/verify-price", verifyDrugPrice);
  
  // Get unverified prices
  app.get("/api/prices/unverified", cacheMiddleware.prices, getUnverifiedPrices);
  
  // Get price changes within date range
  app.get("/api/prices/changes", getPriceChangesByDateRange);

  // Tarshouby Pharmacy Integration Endpoints
  app.get("/api/tarshouby/search", searchTarshouby);
  app.get("/api/tarshouby/product-details", getTarshoubyProductDetails);
  app.post("/api/tarshouby/update-price", authenticate, updatePriceFromTarshouby);
  app.post("/api/tarshouby/bulk-update", authenticate, bulkUpdatePricesFromTarshouby);
  app.get("/api/tarshouby/health", getTarshoubyHealth);
  app.get("/api/prices/compare", comparePrices);

  // Advanced Features Endpoints
  app.use("/api/advanced", advancedFeaturesRoutes);

  // Backup & Sync Endpoints
  app.use("/api/backup-sync", backupSyncRoutes);

  // External Interaction API Endpoints
  app.use("/api/external", externalInteractionRoutes);

  // User Reviews, Q&A, and Customer Support Endpoints
  // app.use("/api/community", userReviewsRoutes); // Temporarily disabled due to syntax errors

  // Apply error handling middleware
  app.use(errorHandler);

  const httpServer = createServer(app);

  return httpServer;
}
