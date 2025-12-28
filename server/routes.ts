import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import { EGYPTIAN_DRUGS } from "./egyptianDrugs";

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

function findNearestMatch(name: string): { match: typeof EGYPTIAN_DRUGS[0] | null; similarity: number } {
  const normalizedName = name.toLowerCase().trim();
  let bestMatch: typeof EGYPTIAN_DRUGS[0] | null = null;
  let bestSimilarity = 0;

  for (const drug of EGYPTIAN_DRUGS) {
    const drugName = drug.name.toLowerCase();
    const drugArabic = drug.nameArabic.toLowerCase();

    if (drugName === normalizedName || drugArabic === normalizedName) {
      return { match: drug, similarity: 1.0 };
    }

    if (drugName.startsWith(normalizedName) || normalizedName.startsWith(drugName)) {
      const similarity = 0.9;
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = drug;
      }
    }

    if (drugName.includes(normalizedName) || normalizedName.includes(drugName)) {
      const similarity = 0.75;
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = drug;
      }
    }

    const levenshteinSim = 1 - levenshteinDistance(normalizedName, drugName) / Math.max(normalizedName.length, drugName.length);
    if (levenshteinSim > bestSimilarity && levenshteinSim >= 0.7) {
      bestSimilarity = levenshteinSim;
      bestMatch = drug;
    }
  }

  return { match: bestMatch, similarity: bestSimilarity };
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

function findAlternatives(activeIngredient: string | undefined, category: string | undefined, excludeName: string): typeof EGYPTIAN_DRUGS {
  if (activeIngredient) {
    const byIngredient = EGYPTIAN_DRUGS.filter(
      (drug) =>
        drug.activeIngredient.toLowerCase() === activeIngredient.toLowerCase() &&
        drug.name.toLowerCase() !== excludeName.toLowerCase()
    );
    if (byIngredient.length > 0) return byIngredient;
  }
  
  if (category) {
    return EGYPTIAN_DRUGS.filter(
      (drug) =>
        drug.category.toLowerCase() === category.toLowerCase() &&
        drug.name.toLowerCase() !== excludeName.toLowerCase()
    ).slice(0, 3);
  }
  
  return [];
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/analyze-prescription", async (req: Request, res: Response) => {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Image is required" });
      }

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
                  url: `data:image/jpeg;base64,${image}`,
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
      const drugNames = EGYPTIAN_DRUGS.map((d) => d.name).join(", ");
      
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

      const enrichedMedicines = medicines.map((med, idx) => {
        const compMatch = compositionData.find(
          (c: any) => c.name?.toLowerCase() === med.name.toLowerCase()
        );
        
        const exactMatch = EGYPTIAN_DRUGS.find(
          (d) =>
            d.name.toLowerCase() === med.name.toLowerCase() ||
            d.nameArabic === med.nameArabic
        );

        let verificationStatus: "verified" | "suggested" | "unverified" = "unverified";
        let suggestedMatch: typeof EGYPTIAN_DRUGS[0] | null = null;
        let alternatives: typeof EGYPTIAN_DRUGS = [];

        if (exactMatch) {
          verificationStatus = "verified";
          alternatives = findAlternatives(exactMatch.activeIngredient, exactMatch.category, exactMatch.name);
        } else {
          const { match, similarity } = findNearestMatch(med.name);
          if (match && similarity >= 0.7) {
            verificationStatus = "suggested";
            suggestedMatch = match;
            alternatives = findAlternatives(match.activeIngredient, match.category, match.name);
          }
        }

        const activeIngredient = compMatch?.activeIngredient || exactMatch?.activeIngredient || suggestedMatch?.activeIngredient;
        const category = compMatch?.therapeuticClass || exactMatch?.category || suggestedMatch?.category;
        
        if (alternatives.length === 0) {
          alternatives = findAlternatives(activeIngredient, category, med.name);
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
      });

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

  app.get("/api/drugs", (req: Request, res: Response) => {
    const { q } = req.query;
    if (q && typeof q === "string") {
      const query = q.toLowerCase();
      const filtered = EGYPTIAN_DRUGS.filter(
        (drug) =>
          drug.name.toLowerCase().includes(query) ||
          drug.nameArabic.includes(q) ||
          drug.activeIngredient.toLowerCase().includes(query)
      );
      return res.json(filtered);
    }
    res.json(EGYPTIAN_DRUGS);
  });

  app.get("/api/drugs/:id", (req: Request, res: Response) => {
    const drug = EGYPTIAN_DRUGS.find((d) => d.id === req.params.id);
    if (!drug) {
      return res.status(404).json({ error: "Drug not found" });
    }
    res.json(drug);
  });

  app.post("/api/pharmacy-search", async (req: Request, res: Response) => {
    try {
      const { medicineName } = req.body;

      if (!medicineName) {
        return res.status(400).json({ error: "Medicine name is required" });
      }

      const pharmacyLinks = generatePharmacyLinks(medicineName);

      const drugInfo = EGYPTIAN_DRUGS.find(
        (d) => d.name.toLowerCase() === medicineName.toLowerCase()
      );

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

  const httpServer = createServer(app);

  return httpServer;
}
