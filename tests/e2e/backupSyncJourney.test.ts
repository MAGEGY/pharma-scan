import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { db } from '../../server/db';
import { 
  userPrescriptions,
  userAllergies,
  drugInteractions,
  dosageGuidelines
} from '../../shared/schema';

// Mock database for E2E tests
jest.mock('../../server/db');

const app = express();
app.use(express.json());

let server: any;

beforeAll(async () => {
  server = await import('../../server/routes');
  app.use('/api', server);
});

describe('E2E Tests - Complete User Journeys', () => {
  let authToken: string;
  let mockDb: any;
  let userId: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup mock user and authentication
    userId = 'test-user-e2e';
    authToken = 'Bearer e2e-test-token';
    
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    } as any;
    
    // Mock user authentication
    mockDb.select.mockImplementation((query: any) => {
      if (query.from?.table === 'users') {
        return [{
          id: userId,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        }];
      }
      return [];
    });

    (db as any) = mockDb;
  });

  describe('Complete Backup and Sync Journey', () => {
    it('should complete full backup workflow', async () => {
      // Step 1: Create initial prescription data
      const mockPrescriptions = [
        {
          id: '1',
          drugId: 123,
          drugName: 'Aspirin',
          dosage: '500mg',
          frequency: 'twice daily',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: '2',
          drugId: 124,
          drugName: 'Ibuprofen',
          dosage: '400mg',
          frequency: 'three times daily',
          isActive: true,
          createdAt: new Date(),
        },
      ];

      mockDb.select.mockResolvedValueOnce(mockPrescriptions);

      // Step 2: Create manual backup
      const mockBackup = {
        id: 'backup-1',
        userId: userId,
        backupType: 'manual',
        syncStatus: 'pending',
        createdAt: new Date(),
      };

      mockDb.insert.mockResolvedValueOnce([mockBackup]);

      const backupResponse = await request(app)
        .post('/backup-sync/backup')
        .set('Authorization', authToken)
        .send({
          backupType: 'manual',
          cloudProvider: 'google_drive',
          isEncrypted: true,
        })
        .expect(201);

      expect(backupResponse.body.success).toBe(true);
      expect(backupResponse.body.data.backupType).toBe('manual');

      // Step 3: Simulate sync completion
      mockDb.select.mockResolvedValueOnce([{
        ...mockBackup,
        syncStatus: 'completed',
        lastSyncAt: new Date(),
      }]);

      const backupsResponse = await request(app)
        .get('/backup-sync/backups')
        .set('Authorization', authToken)
        .expect(200);

      expect(backupsResponse.body.success).toBe(true);
      expect(backupsResponse.body.data[0].syncStatus).toBe('completed');

      // Step 4: Test restore functionality
      const restoreResponse = await request(app)
        .post('/backup-sync/restore/backup-1')
        .set('Authorization', authToken)
        .expect(200);

      expect(restoreResponse.body.success).toBe(true);
      expect(restoreResponse.body.message).toBe('Backup restored successfully');

      // Verify restored data
      expect(mockDb.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId,
          isActive: true,
        })
      );
    });

    it('should handle backup failure and recovery', async () => {
      // Step 1: Create backup that fails sync
      const mockBackup = {
        id: 'backup-failed',
        userId: userId,
        backupType: 'auto',
        syncStatus: 'failed',
        createdAt: new Date(),
      };

      mockDb.insert.mockResolvedValueOnce([mockBackup]);

      await request(app)
        .post('/backup-sync/backup')
        .set('Authorization', authToken)
        .send({
          backupType: 'auto',
          cloudProvider: 'dropbox',
          isEncrypted: true,
        })
        .expect(201);

      // Step 2: Check backup status
      mockDb.select.mockResolvedValueOnce([mockBackup]);

      const backupsResponse = await request(app)
        .get('/backup-sync/backups')
        .set('Authorization', authToken)
        .expect(200);

      expect(backupsResponse.body.data[0].syncStatus).toBe('failed');

      // Step 3: Retry backup with different provider
      mockDb.insert.mockResolvedValueOnce([{
        ...mockBackup,
        id: 'backup-retry',
        syncStatus: 'completed',
      }]);

      const retryResponse = await request(app)
        .post('/backup-sync/backup')
        .set('Authorization', authToken)
        .send({
          backupType: 'manual',
          cloudProvider: 'google_drive',
          isEncrypted: true,
        })
        .expect(201);

      expect(retryResponse.body.success).toBe(true);
    });
  });

  describe('Complete Analytics Journey', () => {
    it('should track user interactions throughout the app lifecycle', async () => {
      // Step 1: Track app launch
      mockDb.insert.mockResolvedValueOnce([{
        id: 'analytics-1',
        userId: userId,
        eventType: 'app_launch',
        eventName: 'application_start',
        createdAt: new Date(),
      }]);

      await request(app)
        .post('/backup-sync/analytics/track')
        .set('Authorization', authToken)
        .send({
          eventType: 'app_launch',
          eventName: 'application_start',
        })
        .expect(201);

      // Step 2: Track medicine scan
      mockDb.insert.mockResolvedValueOnce([{
        id: 'analytics-2',
        userId: userId,
        eventType: 'scan',
        eventName: 'medicine_scan',
        eventData: {
          drugName: 'Aspirin',
          scanResult: 'success',
          confidence: 0.95,
        },
        duration: 2500,
        createdAt: new Date(),
      }]);

      const scanResponse = await request(app)
        .post('/backup-sync/analytics/track')
        .set('Authorization', authToken)
        .send({
          eventType: 'scan',
          eventName: 'medicine_scan',
          eventData: {
            drugName: 'Aspirin',
            scanResult: 'success',
            confidence: 0.95,
          },
          duration: 2500,
        })
        .expect(201);

      // Step 3: Track search activity
      mockDb.insert.mockResolvedValueOnce([{
        id: 'analytics-3',
        userId: userId,
        eventType: 'search',
        eventName: 'drug_search',
        eventData: {
          query: 'Ibuprofen',
          resultsCount: 5,
          selectedResult: 2,
        },
        duration: 800,
        createdAt: new Date(),
      }]);

      await request(app)
        .post('/backup-sync/analytics/track')
        .set('Authorization', authToken)
        .send({
          eventType: 'search',
          eventName: 'drug_search',
          eventData: {
            query: 'Ibuprofen',
            resultsCount: 5,
            selectedResult: 2,
          },
          duration: 800,
        })
        .expect(201);

      // Step 4: Get usage statistics
      const mockStats = {
        totalScans: 25,
        totalSearches: 10,
        totalExports: 5,
        totalBackups: 3,
        avgSessionDuration: 1800,
        mostUsedFeatures: [
          { feature: 'scan', count: 25 },
          { feature: 'search', count: 10 },
        ],
      };

      mockDb.select.mockReturnValueOnce({
        where: jest.fn().mockResolvedValue([
          { eventType: 'scan' },
          { eventType: 'search' },
          { eventType: 'export' },
          { eventType: 'backup' },
        ]),
      });

      const statsResponse = await request(app)
        .get('/backup-sync/analytics/stats')
        .set('Authorization', authToken)
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.totalScans).toBe(25);
    });
  });

  describe('Complete Export Journey', () => {
    it('should handle full export workflow', async () => {
      // Step 1: Create PDF export
      const mockPdfExport = {
        id: 'export-pdf-1',
        userId: userId,
        exportType: 'pdf',
        contentType: 'prescription_history',
        status: 'pending',
        fileName: 'prescription_history_2024_01_15.pdf',
        createdAt: new Date(),
      };

      mockDb.insert.mockResolvedValueOnce([mockPdfExport]);

      const pdfResponse = await request(app)
        .post('/backup-sync/export')
        .set('Authorization', authToken)
        .send({
          exportType: 'pdf',
          contentType: 'prescription_history',
          format: 'pdf',
          deliveryMethod: 'download',
        })
        .expect(201);

      expect(pdfResponse.body.success).toBe(true);
      expect(pdfResponse.body.data.fileName).toContain('.pdf');

      // Step 2: Simulate processing completion
      mockDb.select.mockResolvedValueOnce([{
        ...mockPdfExport,
        status: 'completed',
        downloadUrl: 'https://api.medscanegypt.com/exports/export-pdf-1.pdf',
        fileSize: 1024000,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }]);

      const exportsResponse = await request(app)
        .get('/backup-sync/exports')
        .set('Authorization', authToken)
        .expect(200);

      expect(exportsResponse.body.data[0].status).toBe('completed');

      // Step 3: Download export
      const downloadResponse = await request(app)
        .get('/backup-sync/export/export-pdf-1/download')
        .set('Authorization', authToken)
        .expect(200);

      expect(downloadResponse.body.success).toBe(true);
      expect(downloadResponse.body.data.downloadUrl).toBe('https://api.medscanegypt.com/exports/export-pdf-1.pdf');

      // Step 4: Create email export
      const mockEmailExport = {
        id: 'export-email-1',
        userId: userId,
        exportType: 'email',
        contentType: 'analysis_results',
        status: 'pending',
        recipientEmail: 'user@example.com',
        createdAt: new Date(),
      };

      mockDb.insert.mockResolvedValueOnce([mockEmailExport]);

      const emailResponse = await request(app)
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

      expect(emailResponse.body.success).toBe(true);
      expect(emailResponse.body.data.recipientEmail).toBe('user@example.com');
    });

    it('should handle export failure and retry', async () => {
      // Step 1: Create export that fails
      mockDb.insert.mockResolvedValueOnce([{
        id: 'export-failed',
        userId: userId,
        exportType: 'pdf',
        contentType: 'prescription_history',
        status: 'failed',
        errorMessage: 'PDF generation failed',
        createdAt: new Date(),
      }]);

      await request(app)
        .post('/backup-sync/export')
        .set('Authorization', authToken)
        .send({
          exportType: 'pdf',
          contentType: 'prescription_history',
          format: 'pdf',
          deliveryMethod: 'download',
        })
        .expect(201);

      // Step 2: Check export status
      mockDb.select.mockResolvedValueOnce([{
        ...mockDb.insert.mock.calls[0].args[0][0],
        status: 'failed',
      }]);

      const exportsResponse = await request(app)
        .get('/backup-sync/exports')
        .set('Authorization', authToken)
        .expect(200);

      expect(exportsResponse.body.data[0].status).toBe('failed');

      // Step 3: Retry export successfully
      mockDb.insert.mockResolvedValueOnce([{
        id: 'export-retry',
        userId: userId,
        exportType: 'pdf',
        contentType: 'prescription_history',
        status: 'completed',
        downloadUrl: 'https://api.medscanegypt.com/exports/export-retry.pdf',
        createdAt: new Date(),
      }]);

      const retryResponse = await request(app)
        .post('/backup-sync/export')
        .set('Authorization', authToken)
        .send({
          exportType: 'pdf',
          contentType: 'prescription_history',
          format: 'pdf',
          deliveryMethod: 'download',
        })
        .expect(201);

      expect(retryResponse.body.success).toBe(true);
    });
  });

  describe('Cross-Feature Integration Journey', () => {
    it('should integrate analytics with backup and export features', async () => {
      // Step 1: User performs multiple actions
      const actions = [
        {
          type: 'scan',
          data: { drugName: 'Aspirin', confidence: 0.95 },
        },
        {
          type: 'backup',
          data: { backupType: 'manual' },
        },
        {
          type: 'export',
          data: { exportType: 'pdf', contentType: 'prescription_history' },
        },
      ];

      // Mock all database operations
      mockDb.insert.mockResolvedValue([{}]);

      // Execute actions in sequence
      for (const action of actions) {
        if (action.type === 'scan') {
          await request(app)
            .post('/backup-sync/analytics/track')
            .set('Authorization', authToken)
            .send({
              eventType: 'scan',
              eventName: 'medicine_scan',
              eventData: action.data,
              duration: 2000,
            });
        } else if (action.type === 'backup') {
          await request(app)
            .post('/backup-sync/backup')
            .set('Authorization', authToken)
            .send(action.data);
        } else if (action.type === 'export') {
          await request(app)
            .post('/backup-sync/export')
            .set('Authorization', authToken)
            .send(action.data);
        }
      }

      // Verify all actions were recorded
      expect(mockDb.insert).toHaveBeenCalledTimes(3);

      // Step 2: Verify analytics data
      mockDb.select.mockReturnValueOnce([
        { eventType: 'scan' },
        { eventType: 'backup' },
        { eventType: 'export' },
      ]);

      const analyticsResponse = await request(app)
        .get('/backup-sync/analytics')
        .set('Authorization', authToken)
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.data).toHaveLength(3);
    });
  });

  describe('Error Recovery Journey', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network failure for backup
      mockDb.insert.mockImplementationOnce(() => {
        throw new Error('Network timeout');
      });

      const backupResponse = await request(app)
        .post('/backup-sync/backup')
        .set('Authorization', authToken)
        .send({
          backupType: 'manual',
          cloudProvider: 'google_drive',
          isEncrypted: true,
        });

      expect(backupResponse.status).toBe(500);
      expect(backupResponse.body.error).toBeDefined();

      // Verify user can still access other features
      const analyticsResponse = await request(app)
        .get('/backup-sync/analytics/stats')
        .set('Authorization', authToken)
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);
    });

    it('should handle partial data corruption', async () => {
      // Mock backup with corrupted data
      const mockCorruptedBackup = {
        id: 'backup-corrupted',
        userId: userId,
        backupType: 'manual',
        syncStatus: 'completed',
        backupData: null, // Corrupted data
        checksum: 'invalid-checksum',
        createdAt: new Date(),
      };

      mockDb.select.mockResolvedValueOnce([mockCorruptedBackup]);

      const restoreResponse = await request(app)
        .post('/backup-sync/restore/backup-corrupted')
        .set('Authorization', authToken)
        .expect(500);

      expect(restoreResponse.body.error).toBe('Failed to restore backup');

      // User should be able to create new backup
      mockDb.insert.mockResolvedValueOnce([{
        id: 'backup-new',
        userId: userId,
        backupType: 'manual',
        syncStatus: 'pending',
        backupData: { prescriptions: [] },
        checksum: 'valid-checksum',
        createdAt: new Date(),
      }]);

      const newBackupResponse = await request(app)
        .post('/backup-sync/backup')
        .set('Authorization', authToken)
        .send({
          backupType: 'manual',
          cloudProvider: 'google_drive',
          isEncrypted: true,
        })
        .expect(201);

      expect(newBackupResponse.body.success).toBe(true);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high-volume concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 100 }, (_, i) =>
        request(app)
          .post('/backup-sync/analytics/track')
          .set('Authorization', authToken)
          .send({
            eventType: 'load_test',
            eventName: `load_test_${i}`,
            duration: 100,
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      expect(responses).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });

    it('should maintain data consistency under load', async () => {
      // Simulate multiple backup operations
      const backupPromises = Array.from({ length: 10 }, (_, i) => {
        mockDb.insert.mockResolvedValueOnce([{
          id: `backup-${i}`,
          userId: userId,
          backupType: 'auto',
          syncStatus: 'pending',
          createdAt: new Date(),
        }]);

        return request(app)
          .post('/backup-sync/backup')
          .set('Authorization', authToken)
          .send({
            backupType: 'auto',
            cloudProvider: 'google_drive',
            isEncrypted: true,
          });
      });

      const backupResponses = await Promise.all(backupPromises);

      expect(backupResponses).toHaveLength(10);
      backupResponses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      // Verify all backups are recorded
      expect(mockDb.insert).toHaveBeenCalledTimes(10);

      // Check backups list
      mockDb.select.mockResolvedValueOnce(
        Array.from({ length: 10 }, (_, i) => ({
          id: `backup-${i}`,
          userId: userId,
          backupType: 'auto',
          syncStatus: 'pending',
          createdAt: new Date(),
        }))
      );

      const backupsResponse = await request(app)
        .get('/backup-sync/backups')
        .set('Authorization', authToken)
        .expect(200);

      expect(backupsResponse.body.data).toHaveLength(10);
    });
  });

  afterAll(() => {
    jest.clearAllMocks();
  });
});
