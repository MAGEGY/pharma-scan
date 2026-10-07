import express from 'express';
import { externalInteractionService } from './externalInteractionService';
import { authenticate } from './authMiddleware';

const router = express.Router();

// Get comprehensive drug interactions from external APIs
router.post('/external-interactions', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { drugIds } = req.body;
    
    if (!Array.isArray(drugIds) || drugIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 drug IDs are required' });
    }

    const interactions = await externalInteractionService.getComprehensiveInteractions(drugIds);
    
    res.json({ 
      success: true, 
      data: interactions,
      sources: ['internal', 'openfda', 'meditrone'],
      total: interactions.length,
    });
  } catch (error) {
    console.error('Error fetching external interactions:', error);
    res.status(500).json({ error: 'Failed to fetch external interactions' });
  }
});

// Update internal database with external interaction data
router.post('/sync-interactions', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { drugIds } = req.body;
    
    if (!Array.isArray(drugIds) || drugIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 drug IDs are required' });
    }

    // Get interactions from external sources
    const interactions = await externalInteractionService.getComprehensiveInteractions(drugIds);
    
    // Update internal database
    await externalInteractionService.updateInternalInteractions(interactions);
    
    res.json({ 
      success: true, 
      message: 'Internal database updated successfully',
      interactionsUpdated: interactions.length,
    });
  } catch (error) {
    console.error('Error syncing interactions:', error);
    res.status(500).json({ error: 'Failed to sync interactions' });
  }
});

// Get cache statistics
router.get('/cache-stats', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = externalInteractionService.getCacheStats();
    
    res.json({ 
      success: true, 
      data: stats,
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
});

// Clear cache
router.post('/clear-cache', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    externalInteractionService.clearCache();
    
    res.json({ 
      success: true, 
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Test Open FDA API connection
router.get('/test/openfda', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const testDrugNames = ['aspirin', 'ibuprofen'];
    const interactions = await externalInteractionService.fetchOpenFDAInteractions(testDrugNames);
    
    res.json({ 
      success: true, 
      data: {
        testDrugs: testDrugNames,
        interactionsFound: interactions.length,
        interactions: interactions.slice(0, 3), // Return first 3 for testing
      },
    });
  } catch (error) {
    console.error('Error testing Open FDA API:', error);
    res.status(500).json({ error: 'Failed to test Open FDA API' });
  }
});

// Test Meditrone AI API connection
router.get('/test/meditrone', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const testDrugNames = ['aspirin', 'ibuprofen'];
    const interactions = await externalInteractionService.fetchMeditroneAIInteractions(testDrugNames);
    
    res.json({ 
      success: true, 
      data: {
        testDrugs: testDrugNames,
        interactionsFound: interactions.length,
        interactions: interactions.slice(0, 3), // Return first 3 for testing
      },
    });
  } catch (error) {
    console.error('Error testing Meditrone AI API:', error);
    res.status(500).json({ error: 'Failed to test Meditrone AI API' });
  }
});

export default router;
