import axios from 'axios';
import { eq, and, or, inArray } from 'drizzle-orm';
import { db } from './db';
import { drugInteractions, egyptianDrugs } from '../shared/schema';

export interface ExternalInteractionData {
  drug1Id: number;
  drug1Name: string;
  drug2Id: number;
  drug2Name: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  interactionType: string;
  description: string;
  recommendation?: string;
  evidenceLevel: 'theoretical' | 'limited' | 'moderate' | 'strong';
  source: 'meditrone' | 'openfda' | 'internal';
  lastChecked: Date;
}

export interface OpenFDAInteraction {
  severity: string;
  description: string;
  recommendation?: string;
  sources?: string[];
}

export interface MeditroneAIResponse {
  interactions: Array<{
    drug1: string;
    drug2: string;
    severity: string;
    interaction_type: string;
    description: string;
    recommendation?: string;
    confidence_score: number;
  }>;
  metadata: {
    total_interactions: number;
    processing_time: number;
    model_version: string;
  };
}

class ExternalInteractionService {
  private openFDABaseUrl = 'https://api.fda.gov/drug/label.json';
  private meditroneAIUrl = process.env.MEDITRONE_AI_API_URL || 'https://api.meditrone.ai/v1';
  private meditroneAPIKey = process.env.MEDITRONE_AI_API_KEY;
  
  // Cache for API responses to avoid rate limits
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  private getCacheKey(drug1Name: string, drug2Name: string, source: string): string {
    return `${source}:${drug1Name.toLowerCase()}:${drug2Name.toLowerCase()}`;
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Fetch drug interactions from Open FDA API
   */
  async fetchOpenFDAInteractions(drugNames: string[]): Promise<ExternalInteractionData[]> {
    const interactions: ExternalInteractionData[] = [];

    try {
      for (let i = 0; i < drugNames.length; i++) {
        for (let j = i + 1; j < drugNames.length; j++) {
          const drug1Name = drugNames[i];
          const drug2Name = drugNames[j];
          const cacheKey = this.getCacheKey(drug1Name, drug2Name, 'openfda');

          // Check cache first
          const cached = this.getCachedData(cacheKey);
          if (cached) {
            interactions.push(...cached);
            continue;
          }

          try {
            // Search for drug interactions in Open FDA
            const searchQuery = `drug_interactions:"${drug1Name}" AND drug_interactions:"${drug2Name}"`;
            const response = await axios.get(this.openFDABaseUrl, {
              params: {
                search: searchQuery,
                limit: 10,
              },
              timeout: 10000,
            });

            if (response.data.results && response.data.results.length > 0) {
              const fdaInteractions = this.parseOpenFDAData(response.data.results, drug1Name, drug2Name);
              
              // Cache the results
              this.setCachedData(cacheKey, fdaInteractions);
              interactions.push(...fdaInteractions);
            }
          } catch (error) {
            console.warn(`Open FDA API error for ${drug1Name} + ${drug2Name}:`, error);
            // Continue with other pairs even if one fails
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Open FDA interactions:', error);
    }

    return interactions;
  }

  /**
   * Parse Open FDA response data
   */
  private parseOpenFDAData(results: any[], drug1Name: string, drug2Name: string): ExternalInteractionData[] {
    const interactions: ExternalInteractionData[] = [];

    for (const result of results) {
      if (result.drug_interactions) {
        const interactionText = Array.isArray(result.drug_interactions) 
          ? result.drug_interactions.join(' ')
          : result.drug_interactions;

        // Extract severity and description from the interaction text
        const severity = this.extractSeverityFromText(interactionText);
        const description = this.extractDescriptionFromText(interactionText, drug1Name, drug2Name);
        const recommendation = this.extractRecommendationFromText(interactionText);

        if (description) {
          interactions.push({
            drug1Id: 0, // Will be resolved later
            drug1Name,
            drug2Id: 0, // Will be resolved later
            drug2Name,
            severity,
            interactionType: 'Pharmacodynamic',
            description,
            recommendation,
            evidenceLevel: 'strong',
            source: 'openfda',
            lastChecked: new Date(),
          });
        }
      }
    }

    return interactions;
  }

  /**
   * Fetch drug interactions from Meditrone AI API
   */
  async fetchMeditroneAIInteractions(drugNames: string[]): Promise<ExternalInteractionData[]> {
    if (!this.meditroneAPIKey) {
      console.warn('Meditrone AI API key not configured');
      return [];
    }

    const interactions: ExternalInteractionData[] = [];

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(drugNames.join('+'), '', 'meditrone');
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await axios.post<MeditroneAIResponse>(
        `${this.meditroneAIUrl}/drug-interactions`,
        {
          drugs: drugNames,
          include_recommendations: true,
          severity_levels: ['minor', 'moderate', 'major', 'contraindicated'],
        },
        {
          headers: {
            'Authorization': `Bearer ${this.meditroneAPIKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data.interactions) {
        for (const interaction of response.data.interactions) {
          const severity = this.mapMeditroneSeverity(interaction.severity);
          
          interactions.push({
            drug1Id: 0, // Will be resolved later
            drug1Name: interaction.drug1,
            drug2Id: 0, // Will be resolved later
            drug2Name: interaction.drug2,
            severity,
            interactionType: interaction.interaction_type || 'Unknown',
            description: interaction.description,
            recommendation: interaction.recommendation,
            evidenceLevel: this.mapConfidenceToEvidence(interaction.confidence_score),
            source: 'meditrone',
            lastChecked: new Date(),
          });
        }
      }

      // Cache the results
      this.setCachedData(cacheKey, interactions);

    } catch (error) {
      console.error('Error fetching Meditrone AI interactions:', error);
    }

    return interactions;
  }

  /**
   * Get comprehensive interactions from all sources
   */
  async getComprehensiveInteractions(drugIds: number[]): Promise<ExternalInteractionData[]> {
    // Get drug names from database
    const drugs = await db.select()
      .from(egyptianDrugs)
      .where(inArray(egyptianDrugs.id, drugIds));

    const drugNames = drugs.map(drug => drug.name);
    const allInteractions: ExternalInteractionData[] = [];

    // Fetch from external APIs in parallel
    const [openFDAInteractions, meditroneInteractions] = await Promise.allSettled([
      this.fetchOpenFDAInteractions(drugNames),
      this.fetchMeditroneAIInteractions(drugNames),
    ]);

    if (openFDAInteractions.status === 'fulfilled') {
      allInteractions.push(...openFDAInteractions.value);
    }

    if (meditroneInteractions.status === 'fulfilled') {
      allInteractions.push(...meditroneInteractions.value);
    }

    // Get internal interactions from database
    const internalInteractions = await this.getInternalInteractions(drugIds);
    allInteractions.push(...internalInteractions);

    // Resolve drug IDs and merge duplicates
    return this.resolveAndMergeInteractions(allInteractions, drugs);
  }

  /**
   * Get internal interactions from database
   */
  private async getInternalInteractions(drugIds: number[]): Promise<ExternalInteractionData[]> {
    const interactions: ExternalInteractionData[] = [];

    for (let i = 0; i < drugIds.length; i++) {
      for (let j = i + 1; j < drugIds.length; j++) {
        const drug1Id = drugIds[i];
        const drug2Id = drugIds[j];

        const [interaction] = await db.select()
          .from(drugInteractions)
          .where(and(
            or(
              and(
                eq(drugInteractions.drug1Id, drug1Id),
                eq(drugInteractions.drug2Id, drug2Id)
              ),
              and(
                eq(drugInteractions.drug1Id, drug2Id),
                eq(drugInteractions.drug2Id, drug1Id)
              )
            ),
            eq(drugInteractions.isActive, true)
          ));

        if (interaction) {
          const [drug1] = await db.select()
            .from(egyptianDrugs)
            .where(eq(egyptianDrugs.id, drug1Id))
            .limit(1);

          const [drug2] = await db.select()
            .from(egyptianDrugs)
            .where(eq(egyptianDrugs.id, drug2Id))
            .limit(1);

          if (drug1 && drug2) {
            interactions.push({
              drug1Id,
              drug1Name: drug1.name,
              drug2Id,
              drug2Name: drug2.name,
              severity: interaction.severity as any,
              interactionType: interaction.interactionType,
              description: interaction.description,
              recommendation: interaction.recommendation || undefined,
              evidenceLevel: interaction.evidenceLevel as any,
              source: 'internal',
              lastChecked: new Date(),
            });
          }
        }
      }
    }

    return interactions;
  }

  /**
   * Resolve drug IDs and merge duplicate interactions
   */
  private resolveAndMergeInteractions(
    interactions: ExternalInteractionData[], 
    drugs: any[]
  ): ExternalInteractionData[] {
    const drugMap = new Map(drugs.map(drug => [drug.name.toLowerCase(), drug.id]));
    const mergedInteractions = new Map<string, ExternalInteractionData>();

    for (const interaction of interactions) {
      // Resolve drug IDs
      const drug1Id = interaction.drug1Id || drugMap.get(interaction.drug1Name.toLowerCase()) || 0;
      const drug2Id = interaction.drug2Id || drugMap.get(interaction.drug2Name.toLowerCase()) || 0;

      // Create a unique key for the interaction pair
      const key = `${Math.min(drug1Id, drug2Id)}-${Math.max(drug1Id, drug2Id)}`;

      if (mergedInteractions.has(key)) {
        // Merge with existing interaction
        const existing = mergedInteractions.get(key)!;
        mergedInteractions.set(key, this.mergeInteractionData(existing, interaction));
      } else {
        // Add new interaction
        mergedInteractions.set(key, {
          ...interaction,
          drug1Id,
          drug2Id,
        });
      }
    }

    return Array.from(mergedInteractions.values());
  }

  /**
   * Merge interaction data from multiple sources
   */
  private mergeInteractionData(
    existing: ExternalInteractionData,
    newInteraction: ExternalInteractionData
  ): ExternalInteractionData {
    // Use the highest severity
    const severityLevels = { minor: 1, moderate: 2, major: 3, contraindicated: 4 };
    const highestSeverity = severityLevels[existing.severity] >= severityLevels[newInteraction.severity]
      ? existing.severity
      : newInteraction.severity;

    // Combine descriptions
    const combinedDescription = existing.description + '\n\n' + newInteraction.description;

    // Use the strongest evidence level
    const evidenceLevels = { theoretical: 1, limited: 2, moderate: 3, strong: 4 };
    const strongestEvidence = evidenceLevels[existing.evidenceLevel] >= evidenceLevels[newInteraction.evidenceLevel]
      ? existing.evidenceLevel
      : newInteraction.evidenceLevel;

    return {
      ...existing,
      severity: highestSeverity,
      description: combinedDescription,
      recommendation: existing.recommendation || newInteraction.recommendation,
      evidenceLevel: strongestEvidence,
      lastChecked: new Date(),
    };
  }

  /**
   * Helper methods for parsing text data
   */
  private extractSeverityFromText(text: string): 'minor' | 'moderate' | 'major' | 'contraindicated' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('contraindicated') || lowerText.includes('do not use')) {
      return 'contraindicated';
    } else if (lowerText.includes('major') || lowerText.includes('severe')) {
      return 'major';
    } else if (lowerText.includes('moderate')) {
      return 'moderate';
    } else {
      return 'minor';
    }
  }

  private extractDescriptionFromText(text: string, drug1Name: string, drug2Name: string): string {
    // Extract the relevant part of the interaction text
    const sentences = text.split('.');
    const relevantSentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes(drug1Name.toLowerCase()) ||
      sentence.toLowerCase().includes(drug2Name.toLowerCase()) ||
      sentence.toLowerCase().includes('interaction')
    );
    
    return relevantSentences.join('.').trim() || text.substring(0, 200) + '...';
  }

  private extractRecommendationFromText(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    const recommendationKeywords = ['recommend', 'should', 'monitor', 'avoid', 'consider'];
    
    for (const keyword of recommendationKeywords) {
      const index = lowerText.indexOf(keyword);
      if (index !== -1) {
        const sentence = text.substring(index, index + 150);
        return sentence.trim();
      }
    }
    
    return undefined;
  }

  private mapMeditroneSeverity(severity: string): 'minor' | 'moderate' | 'major' | 'contraindicated' {
    const lowerSeverity = severity.toLowerCase();
    if (lowerSeverity.includes('contraindicated')) return 'contraindicated';
    if (lowerSeverity.includes('major')) return 'major';
    if (lowerSeverity.includes('moderate')) return 'moderate';
    return 'minor';
  }

  private mapConfidenceToEvidence(confidence: number): 'theoretical' | 'limited' | 'moderate' | 'strong' {
    if (confidence >= 0.9) return 'strong';
    if (confidence >= 0.7) return 'moderate';
    if (confidence >= 0.5) return 'limited';
    return 'theoretical';
  }

  /**
   * Update internal database with external interaction data
   */
  async updateInternalInteractions(interactions: ExternalInteractionData[]): Promise<void> {
    for (const interaction of interactions) {
      if (interaction.drug1Id === 0 || interaction.drug2Id === 0) {
        continue; // Skip interactions with unresolved drug IDs
      }

      // Check if interaction already exists
      const [existing] = await db.select()
        .from(drugInteractions)
        .where(and(
          or(
            and(
              eq(drugInteractions.drug1Id, interaction.drug1Id),
              eq(drugInteractions.drug2Id, interaction.drug2Id)
            ),
            and(
              eq(drugInteractions.drug1Id, interaction.drug2Id),
              eq(drugInteractions.drug2Id, interaction.drug1Id)
            )
          )
        ))
        .limit(1);

      if (existing) {
        // Update existing interaction
        await db.update(drugInteractions)
          .set({
            severity: interaction.severity,
            interactionType: interaction.interactionType,
            description: interaction.description,
            recommendation: interaction.recommendation,
            evidenceLevel: interaction.evidenceLevel,
            updatedAt: new Date(),
          })
          .where(eq(drugInteractions.id, existing.id));
      } else {
        // Insert new interaction
        await db.insert(drugInteractions)
          .values({
            drug1Id: interaction.drug1Id,
            drug2Id: interaction.drug2Id,
            severity: interaction.severity,
            interactionType: interaction.interactionType,
            description: interaction.description,
            recommendation: interaction.recommendation,
            evidenceLevel: interaction.evidenceLevel,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const externalInteractionService = new ExternalInteractionService();
