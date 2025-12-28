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
      pharmacy: "Seif Pharmacy",
      searchUrl: `https://www.seifpharmacy.com/catalogsearch/result/?q=${encodedName}`,
      logoColor: "#E31837",
    },
    {
      pharmacy: "El Ezaby Pharmacy",
      searchUrl: `https://www.elezaby.com/search?q=${encodedName}`,
      logoColor: "#00A651",
    },
    {
      pharmacy: "Tarshoby Pharmacy",
      searchUrl: `https://www.tarshoby.com/search?q=${encodedName}`,
      logoColor: "#1E3A8A",
    },
  ];
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

      const drugNames = EGYPTIAN_DRUGS.map((d) => d.name).join(", ");
      
      const recommendationsResponse = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `You are a medical AI assistant specializing in Egyptian pharmaceuticals (similar to Meditron). Provide clinical recommendations for medications.

Available Egyptian drugs database: ${drugNames}

For each medicine, provide:
1. Dosing guidance
2. Drug interactions (especially with other medicines in the prescription)
3. Contraindications
4. General recommendations

Be concise but thorough. Use clinical language. Always recommend consulting a healthcare provider.

Return JSON array with this structure:
[
  {
    "dosing": "Dosing instructions",
    "interactions": ["interaction1", "interaction2"],
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

      const enrichedMedicines = medicines.map((med) => {
        const match = EGYPTIAN_DRUGS.find(
          (d) =>
            d.name.toLowerCase() === med.name.toLowerCase() ||
            d.nameArabic === med.nameArabic
        );
        if (match) {
          return {
            ...med,
            nameArabic: med.nameArabic || match.nameArabic,
            activeIngredient: match.activeIngredient,
          };
        }
        return med;
      });

      res.json({
        medicines: enrichedMedicines,
        recommendations,
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
