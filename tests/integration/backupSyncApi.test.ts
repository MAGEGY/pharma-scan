import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { db } from '../../server/db';
import { 
  prescriptionBackups,
  usageAnalytics,
  priceTrends,
  marketIntelligence,
  exportHistory,
  userPrescriptions
} from '../../shared/schema';

// Mock database
jest.mock('../../server/db');
jest.mock('../../server/backupSyncService');

const app = express();
app.use(express.json());

// Import routes (these would be imported from the actual server)
let server: any;

beforeAll(async () => {
  // Setup test server with routes
  server = await import('../../server/routes');
  app.use('/api', server);
});

describe('Backup & Sync API Integration Tests', () => {
  let authToken: string;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = 'Bearer test-token';
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    } as any;
    (db as any) = mockDb;
  });

  describe('POST /api/backup-sync/backup', () => {
    it('should create a backup successfully', async () => {
      const mockBackup = {
        id: 'backup-1',
        userId: 'test-user',
        backupType: 'manual',
        syncStatus: 'pending',
        createdAt: new Date(),
      };

      mockDb.insert.mockResolvedValue([mockBackup]);

      const response = await request(app)
        .post('/backup-sync/backup')
        .set('Authorization', authToken)
        .send({
          backupType: 'manual',
          cloudProvider: 'google_drive',
          isEncrypted: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockBackup);
    });

    it('should reject invalid backup data', async () => {
      const response = await request(app)
        .post('/backup-sync/backup')
        .set('Authorization', authToken)
        .send({
          backupType: 'invalid-type',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/backup-sync/backup')
        .send({
          backupType: 'manual',
          cloudProvider: 'google_drive',
          isEncrypted: true,
        })
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });
  });

  describe('GET /api/backup-sync/backups', () => {
    it('should get user backups successfully', async () => {
      const mockBackups = [
        { id: '1', backupType: 'manual', syncStatus: 'completed' },
        { id: '2', backupType: 'auto', syncStatus: 'pending' },
      ];

      mockDb.select.mockResolvedValue(mockBackups);

      const response = await request(app)
        .get('/backup-sync/backups')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockBackups);
    });

    it('should return empty array for user with no backups', async () => {
      mockDb.select.mockResolvedValue([]);

      const response = await request(app)
        .get('/backup-sync/backups')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/backup-sync/restore/:backupId', () => {
    it('should restore from backup successfully', async () => {
      const response = await request(app)
        .post('/backup-sync/restore/backup-1')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Backup restored successfully');
    });

    it('should reject restore for non-existent backup', async () => {
      mockDb.select.mockResolvedValue([]);

      const response = await request(app)
        .post('/backup-sync/restore/non-existent')
        .set('Authorization', authToken)
        .expect(500);

      expect(response.body.error).toBe('Failed to restore backup');
    });
  });

  describe('POST /api/backup-sync/analytics/track', () => {
    it('should track usage event successfully', async () => {
      const mockAnalytics = {
        id: 'analytics-1',
        userId: 'test-user',
        eventType: 'scan',
        eventName: 'medicine_scan',
        createdAt: new Date(),
      };

      mockDb.insert.mockResolvedValue([mockAnalytics]);

      const response = await request(app)
        .post('/backup-sync/analytics/track')
        .set('Authorization', authToken)
        .send({
          eventType: 'scan',
          eventName: 'medicine_scan',
          duration: 1500,
          success: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalytics);
    });

    it('should reject invalid analytics data', async () => {
      const response = await request(app)
        .post('/backup-sync/analytics/track')
        .set('Authorization', authToken)
        .send({
          eventType: 'invalid-type',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/backup-sync/analytics/stats', () => {
    it('should get usage statistics successfully', async () => {
      const mockStats = {
        totalScans: 150,
        totalSearches: 75,
        totalExports: 25,
        totalBackups: 10,
        avgSessionDuration: 1500,
        mostUsedFeatures: [
          { feature: 'scan', count: 150 },
          { feature: 'search', count: 75 },
        ],
      };

      mockDb.select.mockReturnValue({
        where: jest.fn().mockResolvedValue([
          { eventType: 'scan' },
          { eventType: 'search' },
          { eventType: 'export' },
          { eventType: 'backup' },
        ]),
      });

      const response = await request(app)
        .get('/backup-sync/analytics/stats')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
    });
  });

  describe('POST /api/backup-sync/price-trends/analyze', () => {
    it('should analyze price trends successfully', async () => {
      const mockTrends = [
        {
          id: 'trend-1',
          drugId: 123,
          region: 'Cairo',
          currentPrice: 100,
          previousPrice: 95,
          trendDirection: 'up',
          confidence: 0.85,
        },
      ];

      mockDb.select.mockResolvedValue([
        { newPrice: 100, createdAt: new Date('2024-01-15') },
        { newPrice: 95, createdAt: new Date('2024-01-10') },
      ]);
      mockDb.insert.mockResolvedValue([{}]);

      const response = await request(app)
        .post('/backup-sync/price-trends/analyze')
        .set('Authorization', authToken)
        .send({
          drugId: 123,
          region: 'Cairo',
          analysisPeriod: '30d',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4); // 7d, 30d, 90d, 1y
    });

    it('should handle insufficient price data', async () => {
      mockDb.select.mockResolvedValue([{ newPrice: 100 }]);

      const response = await request(app)
        .post('/backup-sync/price-trends/analyze')
        .set('Authorization', authToken)
        .send({
          drugId: 123,
          region: 'Cairo',
          analysisPeriod: '30d',
        })
        .expect(500);

      expect(response.body.error).toBe('Failed to analyze price trends');
    });
  });

  describe('POST /api/backup-sync/market-intelligence/generate', () => {
    it('should generate market intelligence successfully', async () => {
      const mockIntelligence = {
        id: 'intel-1',
        drugId: 123,
        region: 'Cairo',
        availabilityStatus: 'available',
        demandLevel: 'high',
        reliability: 8,
        recommendedAction: 'Increase stock levels',
      };

      mockDb.select.mockResolvedValue([{ id: 123, name: 'Test Drug' }]);
      mockDb.insert.mockResolvedValue([{}]);

      const response = await request(app)
        .post('/backup-sync/market-intelligence/generate')
        .set('Authorization', authToken)
        .send({
          drugId: 123,
          region: 'Cairo',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockIntelligence);
    });

    it('should handle drug not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const response = await request(app)
        .post('/backup-sync/market-intelligence/generate')
        .set('Authorization', authToken)
        .send({
          drugId: 999,
          region: 'Cairo',
        })
        .expect(500);

      expect(response.body.error).toBe('Failed to generate market intelligence');
    });
  });

  describe('POST /api/backup-sync/export', () => {
    it('should create export successfully', async () => {
      const mockExport = {
        id: 'export-1',
        exportType: 'pdf',
        contentType: 'prescription_history',
        status: 'pending',
        createdAt: new Date(),
      };

      mockDb.insert.mockResolvedValue([mockExport]);

      const response = await request(app)
        .post('/backup-sync/export')
        .set('Authorization', authToken)
        .send({
          exportType: 'pdf',
          contentType: 'prescription_history',
          format: 'pdf',
          deliveryMethod: 'download',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockExport);
    });

    it('should handle email export', async () => {
      const mockExport = {
        id: 'export-2',
        exportType: 'email',
        contentType: 'analysis_results',
        status: 'pending',
        recipientEmail: 'user@example.com',
        createdAt: new Date(),
      };

      mockDb.insert.mockResolvedValue([mockExport]);

      const response = await request(app)
        .post('/backup-sync/export')
        .set('Authorization', authToken)
        .send({
          exportType: 'email',
          contentType: 'analysis_results',
          format: 'pdf',
          deliveryMethod: 'email',
          recipientEmail: 'user@example.com',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recipientEmail).toBe('user@example.com');
    });
  });

  describe('GET /api/backup-sync/exports', () => {
    it('should get user exports successfully', async () => {
      const mockExports = [
        {
          id: '1',
          exportType: 'pdf',
          contentType: 'prescription_history',
          status: 'completed',
          createdAt: new Date(),
        },
        {
          id: '2',
          exportType: 'csv',
          contentType: 'analysis_results',
          status: 'processing',
          createdAt: new Date(),
        },
      ];

      mockDb.select.mockResolvedValue(mockExports);

      const response = await request(app)
        .get('/backup-sync/exports')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockExports);
    });
  });

  describe('GET /api/backup-sync/export/:exportId/download', () => {
    it('should provide download URL for valid export', async () => {
      const mockExport = {
        id: 'export-1',
        downloadUrl: 'https://api.medscanegypt.com/exports/export-1.pdf',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      mockDb.select.mockResolvedValue([mockExport]);

      const response = await request(app)
        .get('/backup-sync/export/export-1/download')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.downloadUrl).toBe('https://api.medscanegypt.com/exports/export-1.pdf');
    });

    it('should return null for expired export', async () => {
      const mockExport = {
        id: 'export-1',
        downloadUrl: 'https://api.medscanegypt.com/exports/export-1.pdf',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
      };

      mockDb.select.mockResolvedValue([mockExport]);

      const response = await request(app)
        .get('/backup-sync/export/export-1/download')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.downloadUrl).toBeNull();
    });

    it('should return 404 for non-existent export', async () => {
      mockDb.select.mockResolvedValue([]);

      const response = await request(app)
        .get('/backup-sync/export/non-existent/download')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body.error).toBe('Export not found or expired');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/backup-sync/backup')
        .set('Authorization', authToken)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/backup-sync/backup')
        .set('Authorization', authToken)
        .send({
          // Missing backupType
          cloudProvider: 'google_drive',
          isEncrypted: true,
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle rate limiting', async () => {
      // Mock rate limiting behavior
      let requestCount = 0;
      mockDb.insert.mockImplementation(() => {
        requestCount++;
        if (requestCount > 5) {
          throw new Error('Rate limit exceeded');
        }
        return [{}];
      });

      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/backup-sync/analytics/track')
          .set('Authorization', authToken)
          .send({
            eventType: 'scan',
            eventName: `scan_${i}`,
          });
        expect(response.status).toBe(201);
      }

      // 6th request should fail
      const response = await request(app)
        .post('/backup-sync/analytics/track')
        .set('Authorization', authToken)
        .send({
          eventType: 'scan',
          eventName: 'scan_6',
        });
        expect(response.status).toBe(500);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 20 }, (_, i) =>
        request(app)
          .post('/backup-sync/analytics/track')
          .set('Authorization', authToken)
          .send({
            eventType: 'scan',
            eventName: `concurrent_scan_${i}`,
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      expect(responses).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle large data payloads', async () => {
      const largePayload = {
        eventType: 'scan',
        eventName: 'large_data_scan',
        eventData: {
          // Simulate large event data
          largeArray: Array.from({ length: 10000 }, (_, i) => ({ id: i, data: `item_${i}` })),
          largeString: 'x'.repeat(100000),
        },
      };

      const response = await request(app)
        .post('/backup-sync/analytics/track')
        .set('Authorization', authToken)
        .send(largePayload)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  afterAll(() => {
    jest.clearAllMocks();
  });
});
