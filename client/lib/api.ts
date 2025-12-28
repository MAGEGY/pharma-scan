import { getApiUrl } from "@/lib/query-client";
import { Medicine, Recommendation } from "@/hooks/useScanHistory";

interface AnalysisResult {
  medicines: Medicine[];
  recommendations: Recommendation[];
}

export async function analyzePrescription(base64Image: string): Promise<AnalysisResult> {
  const apiUrl = getApiUrl();
  const url = new URL("/api/analyze-prescription", apiUrl);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to analyze prescription");
  }

  return response.json();
}
