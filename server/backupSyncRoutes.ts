import express from 'express';
import { z } from 'zod';
import { backupSyncService } from './backupSyncService';
import { authenticate } from './authMiddleware';
import { 
  createPrescriptionBackupSchema,
  createUsageAnalyticsSchema,
  createPriceTrendSchema,
  createMarketIntelligenceSchema,
  createExportHistorySchema,
  type CreatePrescriptionBackup,
  type CreateUsageAnalytics,
  type CreatePriceTrend,
  type CreateMarketIntelligence,
  type CreateExportHistory
} from '../shared/schema';

const router = express.Router();

// PRESCRIPTION BACKUP & SYNC ROUTES

// Create prescription backup
router.post('/backup', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = createPrescriptionBackupSchema.parse(req.body);
    const backup = await backupSyncService.createPrescriptionBackup(userId, validatedData);
    
    res.status(201).json({ success: true, data: backup });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Get user backups
router.get('/backups', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const backups = await backupSyncService.getUserBackups(userId);
    res.json({ success: true, data: backups });
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

// Restore from backup
router.post('/restore/:backupId', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { backupId } = req.params;
    await backupSyncService.restoreFromBackup(userId, backupId);
    
    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// USAGE ANALYTICS ROUTES

// Track usage event
router.post('/analytics/track', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = createUsageAnalyticsSchema.parse(req.body);
    const analytics = await backupSyncService.trackUsageEvent(userId, validatedData);
    
    res.status(201).json({ success: true, data: analytics });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error tracking usage:', error);
    res.status(500).json({ error: 'Failed to track usage' });
  }
});

// Get user analytics
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { eventType, startDate, endDate } = req.query;
    
    const filters = {
      eventType: eventType as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const analytics = await backupSyncService.getUserUsageAnalytics(userId, filters);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get usage stats
router.get('/analytics/stats', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = await backupSyncService.getUsageStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
});

// PRICE TREND ANALYSIS ROUTES

// Analyze price trends
router.post('/price-trends/analyze', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = createPriceTrendSchema.parse(req.body);
    const trends = await backupSyncService.analyzePriceTrends(
      validatedData.drugId,
      validatedData.region,
      validatedData.analysisPeriod
    );
    
    res.status(201).json({ success: true, data: trends });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error analyzing price trends:', error);
    res.status(500).json({ error: 'Failed to analyze price trends' });
  }
});

// Get price trends
router.get('/price-trends/:drugId', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { drugId } = req.params;
    const { region } = req.query;
    
    const trends = await backupSyncService.getPriceTrends(
      parseInt(drugId),
      region as string
    );
    
    res.json({ success: true, data: trends });
  } catch (error) {
    console.error('Error fetching price trends:', error);
    res.status(500).json({ error: 'Failed to fetch price trends' });
  }
});

// MARKET INTELLIGENCE ROUTES

// Generate market intelligence
router.post('/market-intelligence/generate', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = createMarketIntelligenceSchema.parse(req.body);
    const intelligence = await backupSyncService.generateMarketIntelligence(
      validatedData.drugId,
      validatedData.region
    );
    
    res.status(201).json({ success: true, data: intelligence });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error generating market intelligence:', error);
    res.status(500).json({ error: 'Failed to generate market intelligence' });
  }
});

// Get market intelligence
router.get('/market-intelligence/:drugId', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { drugId } = req.params;
    const { region } = req.query;
    
    const intelligence = await backupSyncService.getMarketIntelligence(
      parseInt(drugId),
      region as string
    );
    
    res.json({ success: true, data: intelligence });
  } catch (error) {
    console.error('Error fetching market intelligence:', error);
    res.status(500).json({ error: 'Failed to fetch market intelligence' });
  }
});

// EXPORT FEATURES ROUTES

// Create export
router.post('/export', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = createExportHistorySchema.parse(req.body);
    const exportRecord = await backupSyncService.createExport(userId, validatedData);
    
    res.status(201).json({ success: true, data: exportRecord });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating export:', error);
    res.status(500).json({ error: 'Failed to create export' });
  }
});

// Get user exports
router.get('/exports', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const exports = await backupSyncService.getUserExports(userId);
    res.json({ success: true, data: exports });
  } catch (error) {
    console.error('Error fetching exports:', error);
    res.status(500).json({ error: 'Failed to fetch exports' });
  }
});

// Download export
router.get('/export/:exportId/download', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { exportId } = req.params;
    const downloadUrl = await backupSyncService.getExportDownloadUrl(exportId, userId);
    
    if (!downloadUrl) {
      return res.status(404).json({ error: 'Export not found or expired' });
    }

    res.json({ success: true, data: { downloadUrl } });
  } catch (error) {
    console.error('Error getting export download:', error);
    res.status(500).json({ error: 'Failed to get export download' });
  }
});

export default router;
