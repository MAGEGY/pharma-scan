import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BackupSyncService } from '../server/backupSyncService';
import { db } from '../server/db';
import { 
  prescriptionBackups,
  usageAnalytics,
  priceTrends,
  marketIntelligence,
  exportHistory,
  userPrescriptions
} from '../shared/schema';

// Mock dependencies
jest.mock('../server/db');
jest.mock('../server/encryption', () => ({
  generateChecksum: jest.fn((data: string) => `mock-checksum-${data.length}`),
}));

describe('BackupSyncService', () => {
  let service: BackupSyncService;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BackupSyncService();
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    } as any;
    (db as any) = mockDb;
  });

  describe('Prescription Backup', () => {
    const mockUserId = 'test-user-id';
    const mockBackupData = {
      backupType: 'manual' as const,
      cloudProvider: 'google_drive' as const,
      deviceId: 'test-device',
      isEncrypted: true,
    };

    it('should create a prescription backup successfully', async () => {
      const mockPrescriptions = [
        { id: '1', drugName: 'Test Drug', dosage: '500mg', frequency: 'twice daily' }
      ];
      
      mockDb.select.mockResolvedValue(mockPrescriptions);
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{
            id: 'backup-1',
            userId: mockUserId,
            backupData: mockPrescriptions,
            syncStatus: 'pending',
            createdAt: new Date(),
          }])
        })
      });

      const result = await service.createPrescriptionBackup(mockUserId, mockBackupData);

      expect(mockDb.select).toHaveBeenCalledWith(
        expect.objectContaining({
          from: userPrescriptions,
          where: expect.objectContaining({
            userId: mockUserId,
          }),
        })
      );
      
      expect(result).toEqual({
        id: 'backup-1',
        userId: mockUserId,
        backupData: mockPrescriptions,
        syncStatus: 'pending',
        createdAt: expect.any(Date),
      });
    });

    it('should handle backup creation errors gracefully', async () => {
      const mockError = new Error('Database error');
      mockDb.insert.mockImplementation(() => {
        throw mockError;
      });

      await expect(service.createPrescriptionBackup(mockUserId, mockBackupData))
        .rejects.toThrow('Database error');
    });

    it('should sync backup to cloud successfully', async () => {
      const mockBackup = {
        id: 'backup-1',
        userId: mockUserId,
        syncStatus: 'pending' as const,
      };

      mockDb.select.mockResolvedValue([mockBackup]);
      mockDb.update.mockResolvedValue([mockBackup]);

      await service.syncToCloud('backup-1');

      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          syncStatus: 'syncing',
        })
      );
    });

    it('should handle cloud sync failures', async () => {
      const mockBackup = {
        id: 'backup-1',
        userId: mockUserId,
        syncStatus: 'pending' as const,
      };

      mockDb.select.mockResolvedValue([mockBackup]);
      mockDb.update.mockImplementation(() => {
        throw new Error('Cloud sync failed');
      });

      await expect(service.syncToCloud('backup-1'))
        .rejects.toThrow('Cloud sync failed');
    });

    it('should restore from backup successfully', async () => {
      const mockBackup = {
        id: 'backup-1',
        userId: mockUserId,
        backupData: {
          prescriptions: [
            { id: '1', drugName: 'Test Drug', dosage: '500mg', frequency: 'twice daily' }
          ],
        },
        checksum: 'valid-checksum',
      };

      mockDb.select.mockResolvedValue([mockBackup]);
      mockDb.insert.mockResolvedValue([{}]);

      await service.restoreFromBackup(mockUserId, 'backup-1');

      expect(mockDb.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          isActive: true,
        })
      );
    });

    it('should reject restore with invalid checksum', async () => {
      const mockBackup = {
        id: 'backup-1',
        userId: mockUserId,
        backupData: {},
        checksum: 'invalid-checksum',
      };

      mockDb.select.mockResolvedValue([mockBackup]);

      await expect(service.restoreFromBackup(mockUserId, 'backup-1'))
        .rejects.toThrow('Backup integrity check failed');
    });
  });

  describe('Usage Analytics', () => {
    const mockUserId = 'test-user-id';
    const mockEventData = {
      eventType: 'scan' as const,
      eventName: 'medicine_scan',
      duration: 1500,
      success: true,
    };

    it('should track usage event successfully', async () => {
      mockDb.insert.mockResolvedValue([{
        id: 'analytics-1',
        userId: mockUserId,
        ...mockEventData,
        createdAt: new Date(),
      }]);

      const result = await service.trackUsageEvent(mockUserId, mockEventData);

      expect(mockDb.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          ...mockEventData,
        })
      );
      
      expect(result).toEqual({
        id: 'analytics-1',
        userId: mockUserId,
        ...mockEventData,
        createdAt: expect.any(Date),
      });
    });

    it('should get user analytics with filters', async () => {
      const mockAnalytics = [
        { id: '1', eventType: 'scan', eventName: 'scan_1' },
        { id: '2', eventType: 'search', eventName: 'search_1' },
      ];

      mockDb.select.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockAnalytics),
        }),
      });

      const result = await service.getUserUsageAnalytics(mockUserId, {
        eventType: 'scan',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(result).toEqual(mockAnalytics);
    });

    it('should calculate usage statistics correctly', async () => {
      const mockAnalytics = [
        { eventType: 'scan', eventName: 'scan_1' },
        { eventType: 'scan', eventName: 'scan_2' },
        { eventType: 'search', eventName: 'search_1' },
        { eventType: 'export', eventName: 'export_1' },
        { eventType: 'backup', eventName: 'backup_1' },
        { duration: 1000 },
        { duration: 2000 },
        { duration: 1500 },
      ];

      mockDb.select.mockReturnValue({
        where: jest.fn().mockResolvedValue(mockAnalytics),
      });

      const stats = await service.getUsageStats(mockUserId);

      expect(stats).toEqual({
        totalScans: 2,
        totalSearches: 1,
        totalExports: 1,
        totalBackups: 1,
        avgSessionDuration: 1500,
        mostUsedFeatures: [
          { feature: 'scan', count: 2 },
          { feature: 'search', count: 1 },
          { feature: 'export', count: 1 },
          { feature: 'backup', count: 1 },
        ],
      });
    });
  });

  describe('Price Trend Analysis', () => {
    const mockDrugId = 123;
    const mockRegion = 'Cairo';
    const mockPriceData = [
      { newPrice: 100, createdAt: new Date('2024-01-15') },
      { newPrice: 105, createdAt: new Date('2024-01-10') },
      { newPrice: 95, createdAt: new Date('2024-01-05') },
    ];

    it('should analyze price trends successfully', async () => {
      mockDb.select.mockResolvedValue(mockPriceData);
      mockDb.insert.mockResolvedValue([{}]);

      const result = await service.analyzePriceTrends(mockDrugId, mockRegion, '30d');

      expect(mockDb.select).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            drugId: mockDrugId,
            region: mockRegion,
          }),
        })
      );

      expect(result).toHaveLength(4); // 7d, 30d, 90d, 1y
      expect(result[0]).toEqual(
        expect.objectContaining({
          drugId: mockDrugId,
          region: mockRegion,
          currentPrice: 100,
          previousPrice: 95,
          priceChange: 5,
          priceChangePercent: 5.26,
          trendDirection: 'up',
          analysisPeriod: '30d',
        })
      );
    });

    it('should handle insufficient data gracefully', async () => {
      mockDb.select.mockResolvedValue([{ newPrice: 100 }]);

      await expect(service.analyzePriceTrends(mockDrugId, mockRegion))
        .rejects.toThrow('Insufficient data for trend analysis');
    });

    it('should get price trends for a drug', async () => {
      const mockTrends = [
        { id: '1', drugId: mockDrugId, trendDirection: 'up' },
        { id: '2', drugId: mockDrugId, trendDirection: 'down' },
      ];

      mockDb.select.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockTrends),
        }),
      });

      const result = await service.getPriceTrends(mockDrugId, mockRegion);

      expect(result).toEqual(mockTrends);
    });
  });

  describe('Market Intelligence', () => {
    const mockDrugId = 123;
    const mockRegion = 'Cairo';
    const mockDrug = {
      id: mockDrugId,
      name: 'Test Drug',
      price: 100,
      activeIngredient: 'Test Ingredient',
    };

    it('should generate market intelligence successfully', async () => {
      mockDb.select.mockResolvedValueOnce([mockDrug]);
      mockDb.select.mockResolvedValueOnce([
        { newPrice: 100, createdAt: new Date('2024-01-15') },
        { newPrice: 105, createdAt: new Date('2024-01-10') },
      ]);
      mockDb.insert.mockResolvedValue([{}]);

      const result = await service.generateMarketIntelligence(mockDrugId, mockRegion);

      expect(result).toEqual(
        expect.objectContaining({
          drugId: mockDrugId,
          region: mockRegion,
          availabilityStatus: expect.any(String),
          demandLevel: expect.any(String),
          reliability: 7,
          recommendedAction: expect.any(String),
        })
      );
    });

    it('should analyze demand levels correctly', async () => {
      const service = new BackupSyncService();
      
      // Test high demand scenario
      const highDemandData = [
        { newPrice: 120, createdAt: new Date('2024-01-15') },
        { newPrice: 110, createdAt: new Date('2024-01-14') },
        { newPrice: 115, createdAt: new Date('2024-01-13') },
      ];

      const demandLevel = (service as any).analyzeDemandLevel(highDemandData);
      expect(demandLevel).toBe('high');
    });

    it('should analyze availability status correctly', async () => {
      const service = new BackupSyncService();
      
      // Test out of stock scenario
      const outOfStockData = [
        { newPrice: 100, createdAt: new Date('2024-01-01') },
      ];

      const availability = (service as any).analyzeAvailability(mockDrug, outOfStockData);
      expect(availability).toBe('limited');
    });
  });

  describe('Export Features', () => {
    const mockUserId = 'test-user-id';
    const mockExportData = {
      exportType: 'pdf' as const,
      contentType: 'prescription_history' as const,
      format: 'pdf' as const,
      deliveryMethod: 'download' as const,
    };

    it('should create export successfully', async () => {
      mockDb.insert.mockResolvedValue([{
        id: 'export-1',
        userId: mockUserId,
        ...mockExportData,
        status: 'pending',
        createdAt: new Date(),
      }]);

      const result = await service.createExport(mockUserId, mockExportData);

      expect(mockDb.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          ...mockExportData,
          status: 'pending',
        })
      );

      expect(result).toEqual({
        id: 'export-1',
        userId: mockUserId,
        ...mockExportData,
        status: 'pending',
        createdAt: expect.any(Date),
      });
    });

    it('should process export successfully', async () => {
      const mockExport = {
        id: 'export-1',
        userId: mockUserId,
        exportType: 'pdf',
        contentType: 'prescription_history',
      };

      mockDb.select.mockResolvedValueOnce([mockExport]);
      mockDb.update.mockResolvedValueOnce([mockExport]);

      await (service as any).processExport('export-1');

      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'processing',
        })
      );
    });

    it('should generate PDF export correctly', async () => {
      const mockExport = {
        id: 'export-1',
        exportType: 'pdf',
        contentData: { prescriptions: [] },
      };

      const result = await (service as any).generatePDFExport(mockExport);

      expect(result).toEqual({
        url: 'https://api.medscanegypt.com/exports/export-1.pdf',
        size: expect.any(Number),
      });
    });

    it('should generate CSV export correctly', async () => {
      const mockExport = {
        id: 'export-1',
        exportType: 'csv',
        contentData: [
          { drugName: 'Test Drug', price: 100 },
          { drugName: 'Test Drug 2', price: 150 },
        ],
      };

      const result = await (service as any).generateCSVExport(mockExport);

      expect(result).toEqual({
        url: 'https://api.medscanegypt.com/exports/export-1.csv',
        size: expect.any(Number),
      });
    });

    it('should get export download URL successfully', async () => {
      const mockExport = {
        id: 'export-1',
        userId: mockUserId,
        status: 'completed',
        downloadUrl: 'https://api.medscanegypt.com/exports/export-1.pdf',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      mockDb.select.mockResolvedValue([mockExport]);

      const result = await service.getExportDownloadUrl('export-1', mockUserId);

      expect(result).toBe('https://api.medscanegypt.com/exports/export-1.pdf');
    });

    it('should return null for expired export', async () => {
      const mockExport = {
        id: 'export-1',
        userId: mockUserId,
        status: 'completed',
        downloadUrl: 'https://api.medscanegypt.com/exports/export-1.pdf',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
      };

      mockDb.select.mockResolvedValue([mockExport]);

      const result = await service.getExportDownloadUrl('export-1', mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const dbError = new Error('Connection failed');
      mockDb.select.mockImplementation(() => {
        throw dbError;
      });

      await expect(service.getUserBackups('test-user'))
        .rejects.toThrow('Connection failed');
    });

    it('should handle invalid input gracefully', async () => {
      const invalidBackupData = {
        backupType: 'invalid' as any,
        cloudProvider: 'invalid' as any,
      };

      await expect(service.createPrescriptionBackup('test-user', invalidBackupData))
        .rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const largePrescriptionData = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        drugName: `Drug ${i}`,
        dosage: '500mg',
        frequency: 'twice daily',
      }));

      mockDb.select.mockResolvedValue(largePrescriptionData);
      mockDb.insert.mockResolvedValue([{}]);

      const startTime = Date.now();
      await service.createPrescriptionBackup('test-user', {
        backupType: 'manual',
        cloudProvider: 'google_drive',
        deviceId: 'test-device',
        isEncrypted: true,
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent operations', async () => {
      const concurrentOperations = Array.from({ length: 10 }, (_, i) =>
        service.createPrescriptionBackup('test-user', {
          backupType: 'manual',
          cloudProvider: 'google_drive',
          deviceId: `device-${i}`,
          isEncrypted: true,
        })
      );

      const results = await Promise.all(concurrentOperations);

      expect(results).toHaveLength(10);
      expect(mockDb.insert).toHaveBeenCalledTimes(10);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
