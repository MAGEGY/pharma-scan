import { loggingService } from './loggingService';
import { db } from './db';
import { eq, and, or, ilike, inArray } from 'drizzle-orm';
import { egyptianDrugs } from '../shared/schema';

export interface DrugInteraction {
  id: string;
  drug1Id: number;
  drug1Name: string;
  drug2Id: number;
  drug2Name: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  mechanism: string;
  clinicalEffects: string[];
  recommendations: string[];
  evidence: {
    level: 'A' | 'B' | 'C' | 'D' | 'X';
    source: string;
    references: string[];
  };
  onset: 'immediate' | 'delayed' | 'cumulative';
  duration: 'temporary' | 'permanent';
  monitoring: string[];
  management: string[];
  alternatives: string[];
  lastUpdated: string;
}

export interface InteractionCheckResult {
  interactions: DrugInteraction[];
  summary: {
    totalInteractions: number;
    majorInteractions: number;
    moderateInteractions: number;
    minorInteractions: number;
    contraindicatedInteractions: number;
  };
  warnings: {
    critical: string[];
    caution: string[];
    informational: string[];
  };
  recommendations: {
    immediate: string[];
    monitoring: string[];
    lifestyle: string[];
  };
  checkedAt: string;
}

export interface DrugProfile {
  drugId: number;
  drugName: string;
  activeIngredients: string[];
  pharmacologicalClass: string[];
  contraindications: string[];
  precautions: string[];
  knownInteractions: {
    drugName: string;
    severity: string;
    description: string;
  }[];
  metabolism: {
    enzymes: string[];
    pathways: string[];
    inhibitors: string[];
    inducers: string[];
  };
  excretion: {
    renal: boolean;
    hepatic: boolean;
    other: string[];
  };
  specialPopulations: {
    elderly: string[];
    pediatric: string[];
    pregnancy: string[];
    lactation: string[];
    renalImpairment: string[];
    hepaticImpairment: string[];
  };
}

export class DrugInteractionService {
  private interactionDatabase: Map<string, DrugInteraction[]> = new Map();
  private drugProfiles: Map<number, DrugProfile> = new Map();
  private cache: Map<string, InteractionCheckResult> = new Map();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.initializeInteractionDatabase();
    this.initializeDrugProfiles();
  }

  private async initializeInteractionDatabase(): Promise<void> {
    try {
      // Initialize with common Egyptian drug interactions
      const interactions: DrugInteraction[] = [
        // Warfarin interactions
        {
          id: 'warfarin-aspirin',
          drug1Id: 1,
          drug1Name: 'Warfarin',
          drug2Id: 2,
          drug2Name: 'Aspirin',
          severity: 'major',
          description: 'Increased risk of bleeding due to additive effects on platelet function and coagulation',
          mechanism: 'Aspirin inhibits platelet aggregation and may cause gastrointestinal bleeding, while warfarin inhibits vitamin K-dependent clotting factors',
          clinicalEffects: ['Increased bleeding time', 'Gastrointestinal bleeding', 'Ecchymosis', 'Hematuria'],
          recommendations: [
            'Avoid combination if possible',
            'If co-administration is necessary, monitor INR frequently',
            'Consider using enteric-coated aspirin',
            'Educate patient about bleeding signs'
          ],
          evidence: {
            level: 'A',
            source: 'FDA Drug Interactions',
            references: ['Holbrook AM, et al. Arch Intern Med. 2005', 'Hylek EM. N Engl J Med. 2001']
          },
          onset: 'immediate',
          duration: 'temporary',
          monitoring: ['INR', 'Complete blood count', 'Fecal occult blood'],
          management: ['Dose adjustment of warfarin', 'Discontinue aspirin if bleeding occurs'],
          alternatives: ['Clopidogrel', 'Ticagrelor'],
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'warfarin-nsaid',
          drug1Id: 1,
          drug1Name: 'Warfarin',
          drug2Id: 3,
          drug2Name: 'Ibuprofen',
          severity: 'major',
          description: 'Increased risk of gastrointestinal bleeding and altered INR',
          mechanism: 'NSAIDs can cause gastric mucosal damage and may displace warfarin from protein binding sites',
          clinicalEffects: ['Gastrointestinal bleeding', 'Increased INR', 'Peptic ulcer disease'],
          recommendations: [
            'Avoid combination if possible',
            'Use acetaminophen for pain relief instead',
            'Monitor INR closely if co-administered',
            'Consider gastroprotective agents'
          ],
          evidence: {
            level: 'A',
            source: 'Clinical Pharmacology',
            references: ['Lanza FL. Am J Gastroenterol. 2009']
          },
          onset: 'immediate',
          duration: 'temporary',
          monitoring: ['INR', 'Hemoglobin', 'Gastrointestinal symptoms'],
          management: ['Discontinue NSAID', 'Dose adjust warfarin', 'Add PPI therapy'],
          alternatives: ['Acetaminophen', 'Celecoxib'],
          lastUpdated: new Date().toISOString(),
        },

        // Statin interactions
        {
          id: 'atorvastatin-clarithromycin',
          drug1Id: 4,
          drug1Name: 'Atorvastatin',
          drug2Id: 5,
          drug2Name: 'Clarithromycin',
          severity: 'major',
          description: 'Increased risk of myopathy and rhabdomyolysis',
          mechanism: 'Clarithromycin inhibits CYP3A4, increasing atorvastatin plasma concentrations',
          clinicalEffects: ['Myalgia', 'Myopathy', 'Rhabdomyolysis', 'Acute kidney injury'],
          recommendations: [
            'Avoid combination if possible',
            'Temporarily discontinue atorvastatin during antibiotic therapy',
            'Use alternative antibiotic (azithromycin)',
            'Monitor CK levels if co-administered'
          ],
          evidence: {
            level: 'A',
            source: 'FDA Drug Safety Communication',
            references: ['Neuvonen PJ, et al. Clin Pharmacol Ther. 2008']
          },
          onset: 'delayed',
          duration: 'temporary',
          monitoring: ['Creatine kinase', 'Renal function', 'Muscle symptoms'],
          management: ['Discontinue atorvastatin', 'Hydration', 'Monitor renal function'],
          alternatives: ['Pravastatin', 'Rosuvastatin'],
          lastUpdated: new Date().toISOString(),
        },

        // ACE Inhibitor interactions
        {
          id: 'lisinopril-potassium',
          drug1Id: 6,
          drug1Name: 'Lisinopril',
          drug2Id: 7,
          drug2Name: 'Potassium Chloride',
          severity: 'major',
          description: 'Increased risk of hyperkalemia',
          mechanism: 'ACE inhibitors reduce aldosterone secretion, leading to potassium retention',
          clinicalEffects: ['Hyperkalemia', 'Cardiac arrhythmias', 'Muscle weakness'],
          recommendations: [
            'Avoid potassium supplements with ACE inhibitors',
            'Monitor serum potassium regularly',
            'Educate patient about high-potassium foods',
            'Consider potassium-sparing diuretics with caution'
          ],
          evidence: {
            level: 'A',
            source: 'Hypertension guidelines',
            references: ['Mackenzie IS, et al. J Hypertens. 2015']
          },
          onset: 'delayed',
          duration: 'temporary',
          monitoring: ['Serum potassium', 'ECG', 'Renal function'],
          management: ['Discontinue potassium', 'Treat hyperkalemia', 'Dose adjust ACE inhibitor'],
          alternatives: ['Calcium channel blockers', 'Thiazide diuretics'],
          lastUpdated: new Date().toISOString(),
        },

        // Metformin interactions
        {
          id: 'metformin-contrast',
          drug1Id: 8,
          drug1Name: 'Metformin',
          drug2Id: 9,
          drug2Name: 'Iodinated Contrast Media',
          severity: 'major',
          description: 'Increased risk of contrast-induced nephropathy and lactic acidosis',
          mechanism: 'Contrast media can cause acute kidney injury, impairing metformin excretion',
          clinicalEffects: ['Acute kidney injury', 'Lactic acidosis', 'Metabolic acidosis'],
          recommendations: [
            'Temporarily discontinue metformin before contrast studies',
            'Resume metformin 48 hours after contrast if renal function is normal',
            'Monitor renal function before and after contrast',
            'Ensure adequate hydration'
          ],
          evidence: {
            level: 'A',
            source: 'Contrast media guidelines',
            references: ['American College of Radiology Manual 2020']
          },
          onset: 'delayed',
          duration: 'temporary',
          monitoring: ['Serum creatinine', 'Bicarbonate', 'Lactate', 'Blood pH'],
          management: ['Discontinue metformin', 'Supportive care', 'Treat lactic acidosis'],
          alternatives: ['Sulfonylureas', 'DPP-4 inhibitors'],
          lastUpdated: new Date().toISOString(),
        },

        // Digoxin interactions
        {
          id: 'digoxin-amiodarone',
          drug1Id: 10,
          drug1Name: 'Digoxin',
          drug2Id: 11,
          drug2Name: 'Amiodarone',
          severity: 'major',
          description: 'Increased digoxin levels leading to toxicity',
          mechanism: 'Amiodarone inhibits P-glycoprotein, reducing digoxin clearance',
          clinicalEffects: ['Digoxin toxicity', 'Arrhythmias', 'Nausea', 'Visual disturbances'],
          recommendations: [
            'Reduce digoxin dose by 50% when starting amiodarone',
            'Monitor digoxin levels closely',
            'Watch for signs of digoxin toxicity',
            'Consider alternative antiarrhythmic agents'
          ],
          evidence: {
            level: 'A',
            source: 'Cardiology guidelines',
            references: ['Khan IA. Clin Cardiol. 2003']
          },
          onset: 'delayed',
          duration: 'temporary',
          monitoring: ['Serum digoxin', 'ECG', 'Potassium', 'Renal function'],
          management: ['Reduce digoxin dose', 'Monitor levels', 'Treat toxicity'],
          alternatives: ['Diltiazem', 'Beta blockers'],
          lastUpdated: new Date().toISOString(),
        },

        // Moderate interactions
        {
          id: 'omeprazole-clopidogrel',
          drug1Id: 12,
          drug1Name: 'Omeprazole',
          drug2Id: 13,
          drug2Name: 'Clopidogrel',
          severity: 'moderate',
          description: 'Reduced effectiveness of clopidogrel',
          mechanism: 'Omeprazole inhibits CYP2C19, reducing clopidogrel activation',
          clinicalEffects: ['Reduced antiplatelet effect', 'Increased cardiovascular risk'],
          recommendations: [
            'Avoid omeprazole with clopidogrel if possible',
            'Use pantoprazole or H2 blockers instead',
            'Monitor cardiovascular status',
            'Consider timing separation of doses'
          ],
          evidence: {
            level: 'B',
            source: 'FDA Safety Communication',
            references: ['Gilard M, et al. JAMA. 2008']
          },
          onset: 'delayed',
          duration: 'temporary',
          monitoring: ['Platelet function tests', 'Cardiovascular events'],
          management: ['Switch to alternative PPI', 'Monitor platelet function'],
          alternatives: ['Pantoprazole', 'Famotidine'],
          lastUpdated: new Date().toISOString(),
        },

        // Minor interactions
        {
          id: 'paracetamol-warfarin',
          drug1Id: 14,
          drug1Name: 'Paracetamol',
          drug2Id: 1,
          drug2Name: 'Warfarin',
          severity: 'minor',
          description: 'Potential increase in INR with high-dose paracetamol',
          mechanism: 'High-dose paracetamol may affect warfarin metabolism',
          clinicalEffects: ['Slightly increased INR', 'Minimal bleeding risk'],
          recommendations: [
            'Limit paracetamol to <2g/day with warfarin',
            'Monitor INR if high-dose paracetamol is needed',
            'Educate patient about proper dosing'
          ],
          evidence: {
            level: 'C',
            source: 'Clinical pharmacology reviews',
            references: ['Hylek EM, et al. Pharmacotherapy. 2006']
          },
          onset: 'delayed',
          duration: 'temporary',
          monitoring: ['INR'],
          management: ['Adjust paracetamol dose', 'Monitor INR'],
          alternatives: ['NSAIDs (with caution)', 'Topical analgesics'],
          lastUpdated: new Date().toISOString(),
        },
      ];

      // Store interactions by drug ID for quick lookup
      for (const interaction of interactions) {
        const key1 = interaction.drug1Id.toString();
        const key2 = interaction.drug2Id.toString();
        
        if (!this.interactionDatabase.has(key1)) {
          this.interactionDatabase.set(key1, []);
        }
        if (!this.interactionDatabase.has(key2)) {
          this.interactionDatabase.set(key2, []);
        }
        
        this.interactionDatabase.get(key1)!.push(interaction);
        this.interactionDatabase.get(key2)!.push(interaction);
      }

      loggingService.info('Drug interaction database initialized', {
        totalInteractions: interactions.length,
        drugsCovered: this.interactionDatabase.size,
      });
    } catch (error) {
      loggingService.error('Failed to initialize interaction database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async initializeDrugProfiles(): Promise<void> {
    try {
      // Initialize drug profiles for common Egyptian medications
      const profiles: DrugProfile[] = [
        {
          drugId: 1,
          drugName: 'Warfarin',
          activeIngredients: ['Warfarin sodium'],
          pharmacologicalClass: ['Anticoagulant', 'Vitamin K antagonist'],
          contraindications: [
            'Active bleeding',
            'Pregnancy',
            'Severe liver disease',
            'Recent major surgery',
            'Uncontrolled hypertension'
          ],
          precautions: [
            'Bleeding risk',
            'Drug interactions',
            'Dietary vitamin K intake',
            'Renal impairment',
            'Elderly patients'
          ],
          knownInteractions: [
            { drugName: 'Aspirin', severity: 'major', description: 'Increased bleeding risk' },
            { drugName: 'NSAIDs', severity: 'major', description: 'GI bleeding risk' },
            { drugName: 'Antibiotics', severity: 'moderate', description: 'May affect INR' }
          ],
          metabolism: {
            enzymes: ['CYP2C9', 'CYP3A4', 'CYP1A2'],
            pathways: ['Hepatic metabolism'],
            inhibitors: ['Amiodarone', 'Fluconazole', 'Metronidazole'],
            inducers: ['Rifampin', 'Carbamazepine', 'Phenytoin']
          },
          excretion: {
            renal: false,
            hepatic: true,
            other: ['Biliary excretion']
          },
          specialPopulations: {
            elderly: ['Increased bleeding risk', 'Lower dosing required'],
            pediatric: ['Rarely used', 'Special monitoring needed'],
            pregnancy: ['Contraindicated', 'Teratogenic risk'],
            lactation: ['Use with caution', 'Small amounts in breast milk'],
            renalImpairment: ['Dose adjustment needed', 'Increased bleeding risk'],
            hepaticImpairment: ['Contraindicated in severe disease', 'Close monitoring']
          }
        },
        {
          drugId: 4,
          drugName: 'Atorvastatin',
          activeIngredients: ['Atorvastatin calcium'],
          pharmacologicalClass: ['HMG-CoA reductase inhibitor', 'Statin'],
          contraindications: [
            'Active liver disease',
            'Pregnancy',
            'Lactation',
            'Hypersensitivity to statins'
          ],
          precautions: [
            'Liver function monitoring',
            'Muscle symptoms',
            'Renal impairment',
            'Alcohol consumption',
            'Elderly patients'
          ],
          knownInteractions: [
            { drugName: 'Clarithromycin', severity: 'major', description: 'Myopathy risk' },
            { drugName: 'Grapefruit juice', severity: 'moderate', description: 'Increased levels' },
            { drugName: 'Fibrates', severity: 'moderate', description: 'Increased myopathy risk' }
          ],
          metabolism: {
            enzymes: ['CYP3A4'],
            pathways: ['Hepatic metabolism'],
            inhibitors: ['Clarithromycin', 'Itraconazole', 'Grapefruit juice'],
            inducers: ['Rifampin', 'St. John\'s wort', 'Carbamazepine']
          },
          excretion: {
            renal: false,
            hepatic: true,
            other: ['Biliary excretion']
          },
          specialPopulations: {
            elderly: ['Increased myopathy risk', 'Start with lower dose'],
            pediatric: ['Limited data', 'Use with caution'],
            pregnancy: ['Contraindicated', 'Teratogenic risk'],
            lactation: ['Contraindicated', 'Excreted in breast milk'],
            renalImpairment: ['No dose adjustment needed', 'Use with caution'],
            hepaticImpairment: ['Contraindicated in active disease', 'Monitor LFTs']
          }
        },
        {
          drugId: 8,
          drugName: 'Metformin',
          activeIngredients: ['Metformin hydrochloride'],
          pharmacologicalClass: ['Biguanide', 'Antihyperglycemic'],
          contraindications: [
            'Renal impairment (eGFR <30)',
            'Acute or chronic metabolic acidosis',
            'Severe liver disease',
            'Heart failure requiring pharmacologic treatment'
          ],
          precautions: [
            'Renal function monitoring',
            'Lactic acidosis risk',
            'Vitamin B12 deficiency',
            'Alcohol consumption',
            'Iodinated contrast media'
          ],
          knownInteractions: [
            { drugName: 'Iodinated contrast', severity: 'major', description: 'Lactic acidosis risk' },
            { drugName: 'Alcohol', severity: 'moderate', description: 'Increased lactic acidosis risk' },
            { drugName: 'Diuretics', severity: 'minor', description: 'May affect renal function' }
          ],
          metabolism: {
            enzymes: ['None significant'],
            pathways: ['Renal excretion unchanged'],
            inhibitors: ['Cimetidine'],
            inducers: ['None significant']
          },
          excretion: {
            renal: true,
            hepatic: false,
            other: ['Minimal metabolism']
          },
          specialPopulations: {
            elderly: ['Increased renal impairment risk', 'Dose adjustment needed'],
            pediatric: ['Approved for children >10 years', 'Monitor growth'],
            pregnancy: ['Generally avoided', 'Insulin preferred'],
            lactation: ['Compatible with breastfeeding', 'Minimal transfer'],
            renalImpairment: ['Contraindicated if eGFR <30', 'Dose adjust if eGFR 30-45'],
            hepaticImpairment: ['Use with caution', 'Monitor liver function']
          }
        }
      ];

      for (const profile of profiles) {
        this.drugProfiles.set(profile.drugId, profile);
      }

      loggingService.info('Drug profiles initialized', {
        totalProfiles: profiles.length,
      });
    } catch (error) {
      loggingService.error('Failed to initialize drug profiles', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Main interaction checking method
  async checkDrugInteractions(drugIds: number[]): Promise<InteractionCheckResult> {
    try {
      const cacheKey = drugIds.sort().join(',');
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const interactions: DrugInteraction[] = [];
      const checkedAt = new Date().toISOString();

      // Check all possible drug combinations
      for (let i = 0; i < drugIds.length; i++) {
        for (let j = i + 1; j < drugIds.length; j++) {
          const drug1Id = drugIds[i];
          const drug2Id = drugIds[j];
          
          const drugInteractions = await this.findInteractions(drug1Id, drug2Id);
          interactions.push(...drugInteractions);
        }
      }

      // Generate summary
      const summary = this.generateSummary(interactions);
      
      // Generate warnings
      const warnings = this.generateWarnings(interactions);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(interactions);

      const result: InteractionCheckResult = {
        interactions,
        summary,
        warnings,
        recommendations,
        checkedAt,
      };

      // Cache the result
      this.setCache(cacheKey, result);

      loggingService.info('Drug interaction check completed', {
        drugCount: drugIds.length,
        interactionsFound: interactions.length,
        majorInteractions: summary.majorInteractions,
        moderateInteractions: summary.moderateInteractions,
      });

      return result;
    } catch (error) {
      loggingService.error('Failed to check drug interactions', {
        drugIds,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        interactions: [],
        summary: {
          totalInteractions: 0,
          majorInteractions: 0,
          moderateInteractions: 0,
          minorInteractions: 0,
          contraindicatedInteractions: 0,
        },
        warnings: {
          critical: [],
          caution: [],
          informational: [],
        },
        recommendations: {
          immediate: [],
          monitoring: [],
          lifestyle: [],
        },
        checkedAt: new Date().toISOString(),
      };
    }
  }

  private async findInteractions(drug1Id: number, drug2Id: number): Promise<DrugInteraction[]> {
    const drug1Interactions = this.interactionDatabase.get(drug1Id.toString()) || [];
    const drug2Interactions = this.interactionDatabase.get(drug2Id.toString()) || [];

    // Find interactions where both drugs are involved
    const interactions = drug1Interactions.filter(interaction => 
      (interaction.drug1Id === drug1Id && interaction.drug2Id === drug2Id) ||
      (interaction.drug1Id === drug2Id && interaction.drug2Id === drug1Id)
    );

    return interactions;
  }

  private generateSummary(interactions: DrugInteraction[]) {
    const summary = {
      totalInteractions: interactions.length,
      majorInteractions: 0,
      moderateInteractions: 0,
      minorInteractions: 0,
      contraindicatedInteractions: 0,
    };

    interactions.forEach(interaction => {
      switch (interaction.severity) {
        case 'major':
          summary.majorInteractions++;
          break;
        case 'moderate':
          summary.moderateInteractions++;
          break;
        case 'minor':
          summary.minorInteractions++;
          break;
        case 'contraindicated':
          summary.contraindicatedInteractions++;
          break;
      }
    });

    return summary;
  }

  private generateWarnings(interactions: DrugInteraction[]) {
    const warnings = {
      critical: [] as string[],
      caution: [] as string[],
      informational: [] as string[],
    };

    interactions.forEach(interaction => {
      const warning = `${interaction.drug1Name} + ${interaction.drug2Name}: ${interaction.description}`;
      
      switch (interaction.severity) {
        case 'major':
        case 'contraindicated':
          warnings.critical.push(warning);
          break;
        case 'moderate':
          warnings.caution.push(warning);
          break;
        case 'minor':
          warnings.informational.push(warning);
          break;
      }
    });

    return warnings;
  }

  private generateRecommendations(interactions: DrugInteraction[]) {
    const recommendations = {
      immediate: [] as string[],
      monitoring: [] as string[],
      lifestyle: [] as string[],
    };

    const allRecommendations = interactions.flatMap(i => i.recommendations);
    const allMonitoring = interactions.flatMap(i => i.monitoring);

    // Categorize recommendations
    allRecommendations.forEach(rec => {
      if (rec.toLowerCase().includes('avoid') || rec.toLowerCase().includes('discontinue')) {
        recommendations.immediate.push(rec);
      } else if (rec.toLowerCase().includes('monitor') || rec.toLowerCase().includes('check')) {
        recommendations.monitoring.push(rec);
      } else {
        recommendations.lifestyle.push(rec);
      }
    });

    // Add unique monitoring parameters
    recommendations.monitoring = [...new Set([...recommendations.monitoring, ...allMonitoring])];

    return recommendations;
  }

  // Get drug profile
  async getDrugProfile(drugId: number): Promise<DrugProfile | null> {
    return this.drugProfiles.get(drugId) || null;
  }

  // Search for drugs by name
  async searchDrugs(query: string): Promise<{ id: number; name: string; activeIngredient?: string }[]> {
    try {
      const drugs = await db.select({
        id: egyptianDrugs.id,
        name: egyptianDrugs.name,
        activeIngredient: egyptianDrugs.activeIngredient,
      })
        .from(egyptianDrugs)
        .where(or(
          ilike(egyptianDrugs.name, `%${query}%`),
          ilike(egyptianDrugs.nameArabic, `%${query}%`),
          ilike(egyptianDrugs.activeIngredient, `%${query}%`)
        ))
        .limit(20);

      return drugs.map(drug => ({
        id: drug.id,
        name: drug.name,
        activeIngredient: drug.activeIngredient || undefined,
      }));
    } catch (error) {
      loggingService.error('Failed to search drugs', {
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  // Get interaction statistics
  async getInteractionStatistics(): Promise<{
    totalInteractions: number;
    interactionsBySeverity: Record<string, number>;
    mostCommonInteractions: Array<{
      drugPair: string;
      count: number;
    }>;
    drugsWithMostInteractions: Array<{
      drugName: string;
      interactionCount: number;
    }>;
  }> {
    try {
      const allInteractions: DrugInteraction[] = [];
      
      // Collect all interactions
      for (const interactions of this.interactionDatabase.values()) {
        allInteractions.push(...interactions);
      }

      // Count by severity
      const interactionsBySeverity = allInteractions.reduce((acc, interaction) => {
        acc[interaction.severity] = (acc[interaction.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Most common drug pairs
      const drugPairCounts = new Map<string, number>();
      allInteractions.forEach(interaction => {
        const pair = `${interaction.drug1Name} + ${interaction.drug2Name}`;
        drugPairCounts.set(pair, (drugPairCounts.get(pair) || 0) + 1);
      });

      const mostCommonInteractions = Array.from(drugPairCounts.entries())
        .map(([drugPair, count]) => ({ drugPair, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Drugs with most interactions
      const drugInteractionCounts = new Map<string, number>();
      allInteractions.forEach(interaction => {
        drugInteractionCounts.set(interaction.drug1Name, (drugInteractionCounts.get(interaction.drug1Name) || 0) + 1);
        drugInteractionCounts.set(interaction.drug2Name, (drugInteractionCounts.get(interaction.drug2Name) || 0) + 1);
      });

      const drugsWithMostInteractions = Array.from(drugInteractionCounts.entries())
        .map(([drugName, interactionCount]) => ({ drugName, interactionCount }))
        .sort((a, b) => b.interactionCount - a.interactionCount)
        .slice(0, 10);

      return {
        totalInteractions: allInteractions.length,
        interactionsBySeverity,
        mostCommonInteractions,
        drugsWithMostInteractions,
      };
    } catch (error) {
      loggingService.error('Failed to get interaction statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        totalInteractions: 0,
        interactionsBySeverity: {},
        mostCommonInteractions: [],
        drugsWithMostInteractions: [],
      };
    }
  }

  // Cache management
  private setCache(key: string, data: InteractionCheckResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private getFromCache(key: string): InteractionCheckResult | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

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

  // Public API methods
  async addCustomInteraction(interaction: Omit<DrugInteraction, 'id' | 'lastUpdated'>): Promise<boolean> {
    try {
      const newInteraction: DrugInteraction = {
        ...interaction,
        id: crypto.randomUUID(),
        lastUpdated: new Date().toISOString(),
      };

      // Add to interaction database
      const key1 = interaction.drug1Id.toString();
      const key2 = interaction.drug2Id.toString();
      
      if (!this.interactionDatabase.has(key1)) {
        this.interactionDatabase.set(key1, []);
      }
      if (!this.interactionDatabase.has(key2)) {
        this.interactionDatabase.set(key2, []);
      }
      
      this.interactionDatabase.get(key1)!.push(newInteraction);
      this.interactionDatabase.get(key2)!.push(newInteraction);

      // Clear cache
      this.clearCache();

      loggingService.info('Custom interaction added', {
        interactionId: newInteraction.id,
        drug1: interaction.drug1Name,
        drug2: interaction.drug2Name,
        severity: interaction.severity,
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to add custom interaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async updateInteraction(interactionId: string, updates: Partial<DrugInteraction>): Promise<boolean> {
    try {
      // Find and update interaction
      for (const interactions of this.interactionDatabase.values()) {
        const index = interactions.findIndex(i => i.id === interactionId);
        if (index !== -1) {
          interactions[index] = {
            ...interactions[index],
            ...updates,
            lastUpdated: new Date().toISOString(),
          };
          
          // Clear cache
          this.clearCache();
          
          loggingService.info('Interaction updated', {
            interactionId,
          });
          
          return true;
        }
      }

      return false;
    } catch (error) {
      loggingService.error('Failed to update interaction', {
        interactionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async deleteInteraction(interactionId: string): Promise<boolean> {
    try {
      // Find and remove interaction
      for (const interactions of this.interactionDatabase.values()) {
        const index = interactions.findIndex(i => i.id === interactionId);
        if (index !== -1) {
          interactions.splice(index, 1);
          
          // Clear cache
          this.clearCache();
          
          loggingService.info('Interaction deleted', {
            interactionId,
          });
          
          return true;
        }
      }

      return false;
    } catch (error) {
      loggingService.error('Failed to delete interaction', {
        interactionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

export const drugInteractionService = new DrugInteractionService();
