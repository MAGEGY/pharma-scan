import { eq, and, or, inArray } from 'drizzle-orm';
import { db } from './db';
import { externalInteractionService } from './externalInteractionService';
import { 
  userAllergies, 
  userPrescriptions, 
  drugInteractions, 
  userSettings, 
  dosageGuidelines,
  egyptianDrugs,
  type CreateUserAllergy,
  type CreateUserPrescription,
  type UpdateUserSettings,
  type DosageCalculation,
  type DrugInteractionCheck,
  type DrugInteractionResult,
  type DosageCalculationResult,
  type AllergyAlert,
  type UserAllergy,
  type UserPrescription,
  type UserSettings
} from '../shared/schema';

export class AdvancedFeaturesService {
  // ALLERGY MANAGEMENT
  async createUserAllergy(userId: string, allergyData: CreateUserAllergy): Promise<UserAllergy> {
    const [allergy] = await db.insert(userAllergies)
      .values({
        ...allergyData,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return allergy;
  }

  async getUserAllergies(userId: string): Promise<UserAllergy[]> {
    return await db.select()
      .from(userAllergies)
      .where(and(
        eq(userAllergies.userId, userId),
        eq(userAllergies.isActive, true)
      ))
      .orderBy(userAllergies.createdAt);
  }

  async updateUserAllergy(allergyId: string, updates: Partial<CreateUserAllergy>): Promise<UserAllergy> {
    const [updatedAllergy] = await db.update(userAllergies)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userAllergies.id, allergyId))
      .returning();
    
    return updatedAllergy;
  }

  async deleteUserAllergy(allergyId: string): Promise<void> {
    await db.update(userAllergies)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(userAllergies.id, allergyId));
  }

  async checkAllergyAlerts(userId: string, drugName: string): Promise<AllergyAlert[]> {
    const userAllergyList = await this.getUserAllergies(userId);
    const alerts: AllergyAlert[] = [];

    for (const allergy of userAllergyList) {
      if (allergy.allergenType === 'drug') {
        // Check if drug name contains allergen or vice versa
        if (drugName.toLowerCase().includes(allergy.allergenName.toLowerCase()) ||
            allergy.allergenName.toLowerCase().includes(drugName.toLowerCase())) {
          alerts.push({
            allergenName: allergy.allergenName,
            allergenType: allergy.allergenType,
            severity: allergy.severity as 'mild' | 'moderate' | 'severe',
            reaction: allergy.reaction || 'Unknown reaction',
            recommendation: this.getAllergyRecommendation(allergy.severity),
          });
        }
      }
    }

    return alerts;
  }

  private getAllergyRecommendation(severity: string): string {
    switch (severity) {
      case 'severe':
        return 'DO NOT TAKE THIS MEDICATION. Consult your doctor immediately.';
      case 'moderate':
        return 'Use with caution and under medical supervision only.';
      case 'mild':
        return 'Monitor for allergic reactions. Consult pharmacist if concerned.';
      default:
        return 'Consult healthcare provider before use.';
    }
  }

  // PRESCRIPTION MANAGEMENT
  async createUserPrescription(userId: string, prescriptionData: CreateUserPrescription): Promise<UserPrescription> {
    const [prescription] = await db.insert(userPrescriptions)
      .values({
        ...prescriptionData,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        prescribedDate: prescriptionData.prescribedDate ? new Date(prescriptionData.prescribedDate) : undefined,
      })
      .returning();
    
    return prescription;
  }

  async getUserPrescriptions(userId: string): Promise<UserPrescription[]> {
    return await db.select()
      .from(userPrescriptions)
      .where(and(
        eq(userPrescriptions.userId, userId),
        eq(userPrescriptions.isActive, true)
      ))
      .orderBy(userPrescriptions.createdAt);
  }

  async updateUserPrescription(prescriptionId: string, updates: Partial<CreateUserPrescription>): Promise<UserPrescription> {
    const [updatedPrescription] = await db.update(userPrescriptions)
      .set({
        ...updates,
        updatedAt: new Date(),
        prescribedDate: updates.prescribedDate ? new Date(updates.prescribedDate) : undefined,
      })
      .where(eq(userPrescriptions.id, prescriptionId))
      .returning();
    
    return updatedPrescription;
  }

  async deleteUserPrescription(prescriptionId: string): Promise<void> {
    await db.update(userPrescriptions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(userPrescriptions.id, prescriptionId));
  }

  // DRUG INTERACTION CHECKER
  async checkDrugInteractions(drugIds: DrugInteractionCheck): Promise<DrugInteractionResult[]> {
    try {
      // Get comprehensive interactions from all sources (internal, Open FDA, Meditrone AI)
      const externalInteractions = await externalInteractionService.getComprehensiveInteractions(drugIds.drugIds);
      
      // Update internal database with new interaction data
      await externalInteractionService.updateInternalInteractions(externalInteractions);
      
      // Convert to result format
      const results: DrugInteractionResult[] = externalInteractions.map(interaction => ({
        drug1Id: interaction.drug1Id,
        drug1Name: interaction.drug1Name,
        drug2Id: interaction.drug2Id,
        drug2Name: interaction.drug2Name,
        severity: interaction.severity,
        interactionType: interaction.interactionType,
        description: interaction.description,
        recommendation: interaction.recommendation,
        evidenceLevel: interaction.evidenceLevel,
      }));

      return results;
    } catch (error) {
      console.error('Error checking drug interactions:', error);
      
      // Fallback to internal database only
      return await this.checkInternalInteractions(drugIds.drugIds);
    }
  }

  // Fallback method for internal interactions only
  private async checkInternalInteractions(drugIds: number[]): Promise<DrugInteractionResult[]> {
    const interactions: DrugInteractionResult[] = [];
    
    // Get all possible pairs of drugs
    for (let i = 0; i < drugIds.length; i++) {
      for (let j = i + 1; j < drugIds.length; j++) {
        const drug1Id = drugIds[i];
        const drug2Id = drugIds[j];
        
        // Check interaction in both directions
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
          // Get drug names
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
            });
          }
        }
      }
    }
    
    return interactions;
  }

  async checkUserPrescriptionInteractions(userId: string): Promise<DrugInteractionResult[]> {
    const prescriptions = await this.getUserPrescriptions(userId);
    const drugIds = prescriptions.map(p => p.drugId);
    
    if (drugIds.length < 2) {
      return [];
    }
    
    return await this.checkDrugInteractions({ drugIds });
  }

  // DOSAGE CALCULATOR
  async calculateDosage(calculation: DosageCalculation): Promise<DosageCalculationResult | null> {
    // Determine age group if not provided
    let ageGroup = calculation.ageGroup;
    if (!ageGroup) {
      ageGroup = this.determineAgeGroup(calculation.age);
    }

    // Get dosage guidelines
    const [guideline] = await db.select()
      .from(dosageGuidelines)
      .where(and(
        eq(dosageGuidelines.drugId, calculation.drugId),
        ageGroup ? eq(dosageGuidelines.ageGroup, ageGroup) : undefined,
        eq(dosageGuidelines.isActive, true)
      ))
      .orderBy(dosageGuidelines.weightRange)
      .limit(1);

    if (!guideline) {
      return null;
    }

    // Get drug information
    const [drug] = await db.select()
      .from(egyptianDrugs)
      .where(eq(egyptianDrugs.id, calculation.drugId))
      .limit(1);

    if (!drug) {
      return null;
    }

    // Calculate dosage based on weight
    const calculatedDose = this.calculateDoseFromGuideline(
      guideline.dosagePerKg,
      calculation.weight
    );

    // Parse max daily dose if available
    let maxDailyDose: number | undefined;
    if (guideline.maxDailyDose) {
      maxDailyDose = this.parseDosageValue(guideline.maxDailyDose);
    }

    return {
      drugName: drug.name,
      calculatedDose,
      unit: this.extractUnit(guideline.dosagePerKg) || 'mg',
      frequency: guideline.frequency || 'As prescribed',
      maxDailyDose,
      notes: guideline.notes || 'Consult healthcare provider for personalized dosing',
      ageGroup,
      weightRange: guideline.weightRange,
    };
  }

  private determineAgeGroup(age: number): 'neonate' | 'infant' | 'child' | 'adolescent' | 'adult' | 'elderly' {
    if (age < 1) return 'neonate';
    if (age < 3) return 'infant';
    if (age < 12) return 'child';
    if (age < 18) return 'adolescent';
    if (age < 65) return 'adult';
    return 'elderly';
  }

  private calculateDoseFromGuideline(dosagePerKg: string, weight: number): number {
    // Parse dosage range like "5-10mg/kg/day"
    const range = dosagePerKg.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
    if (range) {
      const min = parseFloat(range[1]);
      const max = parseFloat(range[2]);
      // Use the average of the range
      const avgPerKg = (min + max) / 2;
      return Math.round(avgPerKg * weight * 100) / 100; // Round to 2 decimal places
    }
    
    // Parse single value like "5mg/kg/day"
    const single = dosagePerKg.match(/(\d+(?:\.\d+)?)/);
    if (single) {
      const perKg = parseFloat(single[1]);
      return Math.round(perKg * weight * 100) / 100;
    }
    
    return 0;
  }

  private extractUnit(dosagePerKg: string): string {
    const unitMatch = dosagePerKg.match(/([a-zA-Z]+)/);
    return unitMatch ? unitMatch[1] : 'mg';
  }

  private parseDosageValue(dosage: string): number {
    const match = dosage.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  // USER SETTINGS
  async getUserSettings(userId: string): Promise<UserSettings> {
    let [settings] = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    // Create default settings if none exist
    if (!settings) {
      [settings] = await db.insert(userSettings)
        .values({
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
    }

    return settings;
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings> {
    const [updatedSettings] = await db.update(userSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
      .returning();
    
    return updatedSettings;
  }

  // COMPREHENSIVE CHECKS
  async performComprehensiveCheck(userId: string, drugIds: number[]): Promise<{
    interactions: DrugInteractionResult[];
    allergyAlerts: AllergyAlert[];
    dosageRecommendations: DosageCalculationResult[];
  }> {
    const [interactions, userPrescriptions, userSettings] = await Promise.all([
      this.checkDrugInteractions({ drugIds }),
      this.getUserPrescriptions(userId),
      this.getUserSettings(userId),
    ]);

    // Check allergy alerts for each drug
    const allergyAlerts: AllergyAlert[] = [];
    const dosageRecommendations: DosageCalculationResult[] = [];

    for (const drugId of drugIds) {
      // Get drug info for allergy check
      const [drug] = await db.select()
        .from(egyptianDrugs)
        .where(eq(egyptianDrugs.id, drugId))
        .limit(1);

      if (drug) {
        // Check allergies
        if (userSettings.enableAllergyAlerts) {
          const alerts = await this.checkAllergyAlerts(userId, drug.name);
          allergyAlerts.push(...alerts);
        }

        // Calculate dosage if enabled
        if (userSettings.enableDosageCalculator) {
          // Get user profile for age/weight (this would need to be stored in user profile)
          // For now, we'll use default adult values
          const dosage = await this.calculateDosage({
            drugId,
            age: 30, // Default adult age
            weight: 70, // Default adult weight in kg
          });
          if (dosage) {
            dosageRecommendations.push(dosage);
          }
        }
      }
    }

    return {
      interactions: userSettings.enableDrugInteractionChecker ? interactions : [],
      allergyAlerts,
      dosageRecommendations,
    };
  }
}

export const advancedFeaturesService = new AdvancedFeaturesService();
