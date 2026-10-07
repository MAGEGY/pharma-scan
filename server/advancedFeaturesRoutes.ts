import express from 'express';
import { z } from 'zod';
import { advancedFeaturesService } from './advancedFeaturesService';
import { 
  createUserAllergySchema,
  createUserPrescriptionSchema,
  updateUserSettingsSchema,
  dosageCalculationSchema,
  drugInteractionCheckSchema,
  type CreateUserAllergy,
  type CreateUserPrescription,
  type UpdateUserSettings,
  type DosageCalculation,
  type DrugInteractionCheck
} from '../shared/schema';
import { authenticate } from './authMiddleware';

const router = express.Router();

// ALLERGY MANAGEMENT ROUTES

// Create user allergy
router.post('/allergies', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = createUserAllergySchema.parse(req.body);
    const allergy = await advancedFeaturesService.createUserAllergy(userId, validatedData);
    
    res.status(201).json({ success: true, data: allergy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating allergy:', error);
    res.status(500).json({ error: 'Failed to create allergy' });
  }
});

// Get user allergies
router.get('/allergies', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const allergies = await advancedFeaturesService.getUserAllergies(userId);
    res.json({ success: true, data: allergies });
  } catch (error) {
    console.error('Error fetching allergies:', error);
    res.status(500).json({ error: 'Failed to fetch allergies' });
  }
});

// Update user allergy
router.put('/allergies/:id', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const allergyId = req.params.id;
    const validatedData = createUserAllergySchema.partial().parse(req.body);
    
    const allergy = await advancedFeaturesService.updateUserAllergy(allergyId, validatedData);
    res.json({ success: true, data: allergy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating allergy:', error);
    res.status(500).json({ error: 'Failed to update allergy' });
  }
});

// Delete user allergy (soft delete)
router.delete('/allergies/:id', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const allergyId = req.params.id;
    await advancedFeaturesService.deleteUserAllergy(allergyId);
    res.json({ success: true, message: 'Allergy deleted successfully' });
  } catch (error) {
    console.error('Error deleting allergy:', error);
    res.status(500).json({ error: 'Failed to delete allergy' });
  }
});

// Check allergy alerts for a specific drug
router.get('/allergies/check/:drugName', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const drugName = req.params.drugName;
    const alerts = await advancedFeaturesService.checkAllergyAlerts(userId, drugName);
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error checking allergy alerts:', error);
    res.status(500).json({ error: 'Failed to check allergy alerts' });
  }
});

// PRESCRIPTION MANAGEMENT ROUTES

// Create user prescription
router.post('/prescriptions', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = createUserPrescriptionSchema.parse(req.body);
    const prescription = await advancedFeaturesService.createUserPrescription(userId, validatedData);
    
    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Get user prescriptions
router.get('/prescriptions', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const prescriptions = await advancedFeaturesService.getUserPrescriptions(userId);
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Update user prescription
router.put('/prescriptions/:id', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const prescriptionId = req.params.id;
    const validatedData = createUserPrescriptionSchema.partial().parse(req.body);
    const prescription = await advancedFeaturesService.updateUserPrescription(prescriptionId, validatedData);
    res.json({ success: true, data: prescription });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating prescription:', error);
    res.status(500).json({ error: 'Failed to update prescription' });
  }
});

// Delete user prescription (soft delete)
router.delete('/prescriptions/:id', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const prescriptionId = req.params.id;
    await advancedFeaturesService.deleteUserPrescription(prescriptionId);
    res.json({ success: true, message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({ error: 'Failed to delete prescription' });
  }
});

// DRUG INTERACTION CHECKER ROUTES

// Check drug interactions between multiple drugs
router.post('/interactions/check', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = drugInteractionCheckSchema.parse(req.body);
    const interactions = await advancedFeaturesService.checkDrugInteractions(validatedData);
    
    res.json({ success: true, data: interactions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error checking drug interactions:', error);
    res.status(500).json({ error: 'Failed to check drug interactions' });
  }
});

// Check interactions for user's current prescriptions
router.get('/interactions/user-prescriptions', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const interactions = await advancedFeaturesService.checkUserPrescriptionInteractions(userId);
    res.json({ success: true, data: interactions });
  } catch (error) {
    console.error('Error checking user prescription interactions:', error);
    res.status(500).json({ error: 'Failed to check user prescription interactions' });
  }
});

// DOSAGE CALCULATOR ROUTES

// Calculate dosage based on age and weight
router.post('/dosage/calculate', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = dosageCalculationSchema.parse(req.body);
    const dosage = await advancedFeaturesService.calculateDosage(validatedData);
    
    if (!dosage) {
      return res.status(404).json({ error: 'Dosage guidelines not found for this drug and age group' });
    }
    
    res.json({ success: true, data: dosage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error calculating dosage:', error);
    res.status(500).json({ error: 'Failed to calculate dosage' });
  }
});

// USER SETTINGS ROUTES

// Get user settings
router.get('/settings', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const settings = await advancedFeaturesService.getUserSettings(userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

// Update user settings
router.put('/settings', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = updateUserSettingsSchema.parse(req.body);
    const settings = await advancedFeaturesService.updateUserSettings(userId, validatedData);
    
    res.json({ success: true, data: settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// COMPREHENSIVE CHECK ROUTE

// Perform comprehensive check (interactions, allergies, dosage)
router.post('/comprehensive-check', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { drugIds } = req.body;
    
    if (!Array.isArray(drugIds) || drugIds.length < 1) {
      return res.status(400).json({ error: 'Drug IDs array is required' });
    }

    const results = await advancedFeaturesService.performComprehensiveCheck(userId, drugIds);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error performing comprehensive check:', error);
    res.status(500).json({ error: 'Failed to perform comprehensive check' });
  }
});

export default router;
