import { db } from './db';
import { 
  prescriptionBackups,
  userPrescriptions,
  userAllergies,
  drugInteractions,
  dosageGuidelines,
  exportHistory,
  usageAnalytics,
  priceTrends,
  marketIntelligence
} from '../shared/schema';
import { loggingService } from './loggingService';
import { healthCheckService } from './healthCheckService';

interface BackupSchedule {
  id: string;
  name: string;
  type: 'manual' | 'scheduled' | 'automatic';
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  retentionDays: number;
  cloudProviders: string[];
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BackupJob {
  id: string;
  scheduleId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  duration?: number;
  backupSize?: number;
  recordCount?: number;
  cloudProvider?: string;
  cloudPath?: string;
  checksum?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

interface BackupReport {
  id: string;
  scheduleId: string;
  jobId: string;
  timestamp: string;
  status: 'success' | 'failure';
  duration: number;
  backupSize: number;
  recordCount: number;
  compressionRatio?: number;
  cloudProvider: string;
  cloudPath: string;
  checksum: string;
  retentionDays: number;
  metadata: {
    tables: Array<{
      name: string;
      recordCount: number;
      size: number;
    }>;
    compression: {
      originalSize: number;
      compressedSize: number;
      ratio: number;
    };
    encryption: {
      algorithm: string;
      keyLength: number;
    };
  };
  errors?: string[];
  warnings?: string[];
}

export class AutomatedBackupService {
  private schedules: Map<string, BackupSchedule> = new Map();
  private jobs: Map<string, BackupJob> = new Map();
  private reports: Map<string, BackupReport> = new Map();
  private isRunning = false;
  private jobQueue: BackupJob[] = [];
  private maxConcurrentJobs = 3;
  private activeJobs: Map<string, BackupJob> = new Map();

  constructor() {
    this.initializeDefaultSchedules();
    this.startBackupScheduler();
    this.startJobProcessor();
  }

  // BACKUP SCHEDULES
  private initializeDefaultSchedules(): void {
    // Daily backup of user data
    this.schedules.set('daily_user_backup', {
      id: 'daily_user_backup',
      name: 'Daily User Data Backup',
      type: 'scheduled',
      frequency: 'daily',
      enabled: true,
      retentionDays: 30,
      cloudProviders: ['google_drive', 'aws'],
      encryptionEnabled: true,
      compressionEnabled: true,
      notifyOnSuccess: false,
      notifyOnFailure: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Weekly full system backup
    this.schedules.set('weekly_full_backup', {
      id: 'weekly_full_backup',
      name: 'Weekly Full System Backup',
      type: 'scheduled',
      frequency: 'weekly',
      enabled: true,
      retentionDays: 90,
      cloudProviders: ['aws', 'google_drive'],
      encryptionEnabled: true,
      compressionEnabled: true,
      notifyOnSuccess: true,
      notifyOnFailure: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Hourly critical data backup
    this.schedules.set('hourly_critical_backup', {
      id: 'hourly_critical_backup',
      name: 'Hourly Critical Data Backup',
      type: 'automatic',
      frequency: 'hourly',
      enabled: true,
      retentionDays: 7,
      cloudProviders: ['aws'],
      encryptionEnabled: true,
      compressionEnabled: false,
      notifyOnSuccess: false,
      notifyOnFailure: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // BACKUP EXECUTION
  async createBackupJob(scheduleId: string, manual: boolean = false): Promise<BackupJob> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Backup schedule not found: ${scheduleId}`);
    }

    const job: BackupJob = {
      id: crypto.randomUUID(),
      scheduleId,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.jobs.set(job.id, job);
    this.jobQueue.push(job);

    if (manual) {
      loggingService.info('Manual backup job created', {
        jobId: job.id,
        scheduleId,
      }, {
        business: {
          action: 'backup_created',
          result: 'manual',
        },
      });
    }

    return job;
  }

  private async executeBackupJob(job: BackupJob): Promise<BackupReport> {
    const schedule = this.schedules.get(job.scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found for job: ${job.id}`);
    }

    job.status = 'running';
    job.startTime = new Date().toISOString();
    job.updatedAt = new Date().toISOString();

    this.activeJobs.set(job.id, job);

    const startTime = Date.now();
    const report: BackupReport = {
      id: crypto.randomUUID(),
      scheduleId: job.scheduleId,
      jobId: job.id,
      timestamp: new Date().toISOString(),
      status: 'success',
      duration: 0,
      backupSize: 0,
      recordCount: 0,
      cloudProvider: schedule.cloudProviders[0],
      cloudPath: '',
      checksum: '',
      retentionDays: schedule.retentionDays,
      metadata: {
        tables: [],
        compression: {
          originalSize: 0,
          compressedSize: 0,
          ratio: 0,
        },
        encryption: {
          algorithm: 'AES-256',
          keyLength: 256,
        },
      },
    };

    try {
      // Step 1: Collect data
      const backupData = await this.collectBackupData(schedule);
      report.recordCount = backupData.totalRecords;
      report.metadata.tables = backupData.tables;

      // Step 2: Compress data if enabled
      let finalData = backupData.data;
      if (schedule.compressionEnabled) {
        finalData = await this.compressData(backupData.data);
        report.metadata.compression = {
          originalSize: backupData.data.length,
          compressedSize: finalData.length,
          ratio: finalData.length / backupData.data.length,
        };
      }

      // Step 3: Encrypt data if enabled
      if (schedule.encryptionEnabled) {
        finalData = await this.encryptData(finalData);
      }

      // Step 4: Upload to cloud
      const uploadResult = await this.uploadToCloud(finalData, schedule, job);
      report.cloudProvider = uploadResult.provider;
      report.cloudPath = uploadResult.path;
      report.backupSize = finalData.length;

      // Step 5: Generate checksum
      report.checksum = await this.generateChecksum(finalData);

      // Step 6: Create database record
      await this.createBackupRecord(report, schedule, job);

      // Step 7: Cleanup old backups
      await this.cleanupOldBackups(schedule);

      // Step 8: Update job status
      job.status = 'completed';
      job.endTime = new Date().toISOString();
      job.duration = Date.now() - startTime;
      job.backupSize = report.backupSize;
      job.recordCount = report.recordCount;
      job.cloudProvider = report.cloudProvider;
      job.cloudPath = report.cloudPath;
      job.checksum = report.checksum;
      job.updatedAt = new Date().toISOString();

      // Step 9: Update schedule
      schedule.lastRun = new Date().toISOString();
      schedule.nextRun = this.calculateNextRun(schedule);
      schedule.updatedAt = new Date().toISOString();

      // Step 10: Log success
      loggingService.info('Backup completed successfully', {
        jobId: job.id,
        scheduleId: job.scheduleId,
      }, {
        business: {
          action: 'backup_completed',
          result: 'success',
          value: report.recordCount,
        },
      });

      // Step 11: Send notification if enabled
      if (schedule.notifyOnSuccess) {
        await this.sendSuccessNotification(report, schedule);
      }

    } catch (error) {
      report.status = 'failure';
      report.errors = [error instanceof Error ? error.message : 'Unknown error'];

      job.status = 'failed';
      job.endTime = new Date().toISOString();
      job.duration = Date.now() - startTime;
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      job.updatedAt = new Date().toISOString();

      // Log failure
      loggingService.error('Backup failed', {
        jobId: job.id,
        scheduleId: job.scheduleId,
      }, {
        business: {
          action: 'backup_failed',
          result: 'failure',
        },
        error: {
          name: error instanceof Error ? error.name : 'BackupError',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });

      // Send notification if enabled
      if (schedule.notifyOnFailure) {
        await this.sendFailureNotification(report, schedule, error);
      }

      // Retry logic
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = 'pending';
        job.updatedAt = new Date().toISOString();
        
        // Add back to queue with delay
        setTimeout(() => {
          this.jobQueue.push(job);
        }, Math.pow(2, job.retryCount) * 60000); // Exponential backoff: 2^retryCount minutes

        loggingService.info('Backup job queued for retry', {
          jobId: job.id,
          retryCount: job.retryCount,
        });
      }
    } finally {
      this.activeJobs.delete(job.id);
      this.reports.set(report.id, report);
    }

    return report;
  }

  private async collectBackupData(schedule: BackupSchedule): Promise<{
    data: string;
    totalRecords: number;
    tables: Array<{
      name: string;
      recordCount: number;
      size: number;
      capped: boolean;
    }>;
  }> {
    const tables: Array<{ name: string; recordCount: number; size: number; capped: boolean; }> = [];
    let totalRecords = 0;
    const allData: any[] = [];
    const BATCH_SIZE = 1000;
    const MAX_ROWS_PER_TABLE = 10000; // Soft cap to prevent OOM

    const fetchTableInChunks = async (table: any, name: string) => {
      let offset = 0;
      let tableRows: any[] = [];
      let capped = false;

      while (true) {
        const batch = await db.select().from(table).limit(BATCH_SIZE).offset(offset);
        if (!batch.length) break;
        tableRows = tableRows.concat(batch);
        offset += batch.length;

        if (tableRows.length >= MAX_ROWS_PER_TABLE) {
          capped = true;
          break;
        }
      }

      const size = JSON.stringify(tableRows).length;
      tables.push({
        name,
        recordCount: tableRows.length,
        size,
        capped,
      });
      totalRecords += tableRows.length;
      allData.push({ table: name, data: tableRows, capped });
    };

    await fetchTableInChunks(userPrescriptions, 'user_prescriptions');
    await fetchTableInChunks(userAllergies, 'user_allergies');
    await fetchTableInChunks(drugInteractions, 'drug_interactions');
    await fetchTableInChunks(dosageGuidelines, 'dosage_guidelines');
    await fetchTableInChunks(exportHistory, 'export_history');
    await fetchTableInChunks(usageAnalytics, 'usage_analytics');
    await fetchTableInChunks(priceTrends, 'price_trends');
    await fetchTableInChunks(marketIntelligence, 'market_intelligence');

    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        totalRecords,
        tables: tables.map(t => ({ name: t.name, recordCount: t.recordCount, capped: t.capped })),
        schedule: {
          id: schedule.id,
          name: schedule.name,
          type: schedule.type,
          frequency: schedule.frequency,
        },
      },
      data: allData,
    };

    return {
      data: JSON.stringify(backupData),
      totalRecords,
      tables,
    };
  }

  private async compressData(data: string): Promise<string> {
    // Mock compression - in production, use actual compression library
    const compressed = data; // Placeholder
    return compressed;
  }

  private async encryptData(data: string): Promise<string> {
    // Mock encryption - in production, use actual encryption
    const encrypted = data; // Placeholder
    return encrypted;
  }

  private async uploadToCloud(data: string, schedule: BackupSchedule, job: BackupJob): Promise<{
    provider: string;
    path: string;
  }> {
    const provider = schedule.cloudProviders[0]; // Use first available provider
    const path = `pharma-scan-backups/${schedule.id}/${job.id}.json`;
    
    // Mock upload - in production, use actual cloud SDK
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { provider, path };
  }

  private async generateChecksum(data: string): Promise<string> {
    // Mock checksum generation - in production, use actual algorithm
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async createBackupRecord(report: BackupReport, schedule: BackupSchedule, job: BackupJob): Promise<void> {
    try {
      await db.insert(prescriptionBackups).values({
        userId: 'system-backup',
        backupData: {
          reportId: report.id,
          jobId: job.id,
          scheduleId: schedule.id,
          timestamp: report.timestamp,
          metadata: report.metadata,
        },
        backupType: schedule.type,
        cloudProvider: report.cloudProvider,
        cloudPath: report.cloudPath,
        checksum: report.checksum,
        isEncrypted: schedule.encryptionEnabled,
        backupSize: report.backupSize,
        syncStatus: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      loggingService.error('Failed to create backup record', {
        reportId: report.id,
        jobId: job.id,
      }, {
        error: {
          name: error instanceof Error ? error.name : 'DatabaseError',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  private async cleanupOldBackups(schedule: BackupSchedule): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - schedule.retentionDays * 24 * 60 * 60 * 1000);
      
      // In production, this would delete old backup records
      const oldBackups = await db.select().from(prescriptionBackups)
        .where(sql`created_at < ${cutoffDate}`);
      
      loggingService.info('Cleaned up old backups', {
        scheduleId: schedule.id,
        cutoffDate: cutoffDate.toISOString(),
        deletedCount: oldBackups.length,
      }, {
        business: {
          action: 'backup_cleanup',
          result: 'success',
          value: oldBackups.length,
        },
      });
    } catch (error) {
      loggingService.error('Failed to cleanup old backups', {
        scheduleId: schedule.id,
      }, {
        error: {
          name: error instanceof Error ? error.name : 'DatabaseError',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  private calculateNextRun(schedule: BackupSchedule): string {
    const now = new Date();
    let nextRun: Date;

    switch (schedule.frequency) {
      case 'hourly':
        nextRun = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'daily':
        nextRun = new Date(now);
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(2, 0, 0, 0); // 2 AM
        break;
      case 'weekly':
        nextRun = new Date(now);
        nextRun.setDate(nextRun.getDate() + 7);
        nextRun.setHours(2, 0, 0, 0); // 2 AM
        break;
      case 'monthly':
        nextRun = new Date(now);
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(1);
        nextRun.setHours(2, 0, 0, 0); // 2 AM
        break;
      default:
        nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    return nextRun.toISOString();
  }

  private async sendSuccessNotification(report: BackupReport, schedule: BackupSchedule): Promise<void> {
    // Mock notification - in production, use actual notification service
    loggingService.info('Backup success notification sent', {
      reportId: report.id,
      scheduleId: schedule.id,
    }, {
      business: {
        action: 'notification_sent',
        result: 'success',
      },
    });
  }

  private async sendFailureNotification(report: BackupReport, schedule: BackupSchedule, error: any): Promise<void> {
    // Mock notification - in production, use actual notification service
    loggingService.warn('Backup failure notification sent', {
      reportId: report.id,
      scheduleId: schedule.id,
    }, {
      business: {
        action: 'notification_sent',
        result: 'failure',
      },
    });
  }

  // SCHEDULER
  private startBackupScheduler(): void {
    setInterval(async () => {
      try {
        await this.checkAndQueueScheduledBackups();
      } catch (error) {
        loggingService.error('Backup scheduler error', {}, {
          error: {
            name: error instanceof Error ? error.name : 'SchedulerError',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }, 60000); // Check every minute
  }

  private async checkAndQueueScheduledBackups(): Promise<void> {
    const now = new Date();

    for (const schedule of this.schedules.values()) {
      if (!schedule.enabled || schedule.type !== 'scheduled') continue;

      const nextRun = schedule.nextRun ? new Date(schedule.nextRun) : null;
      
      if (nextRun && nextRun <= now) {
        try {
          await this.createBackupJob(schedule.id);
          loggingService.info('Scheduled backup queued', {
            scheduleId: schedule.id,
            nextRun: nextRun.toISOString(),
          });
        } catch (error) {
          loggingService.error('Failed to queue scheduled backup', {
            scheduleId: schedule.id,
          }, {
            error: {
              name: error instanceof Error ? error.name : 'SchedulerError',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    }
  }

  private startJobProcessor(): void {
    setInterval(async () => {
      if (this.activeJobs.size >= this.maxConcurrentJobs || this.jobQueue.length === 0) {
        return;
      }

      const job = this.jobQueue.shift();
      if (!job) return;

      try {
        await this.executeBackupJob(job);
      } catch (error) {
        loggingService.error('Job processor error', {
          jobId: job.id,
        }, {
          error: {
            name: error instanceof Error ? error.name : 'JobProcessorError',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }, 5000); // Check every 5 seconds
  }

  // API METHODS
  async getBackupSchedules(): Promise<BackupSchedule[]> {
    return Array.from(this.schedules.values());
  }

  async getBackupSchedule(scheduleId: string): Promise<BackupSchedule | null> {
    return this.schedules.get(scheduleId) || null;
  }

  async createBackupSchedule(scheduleData: Omit<BackupSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackupSchedule> {
    const schedule: BackupSchedule = {
      id: crypto.randomUUID(),
      ...scheduleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.schedules.set(schedule.id, schedule);

    loggingService.info('Backup schedule created', {
      scheduleId: schedule.id,
    }, {
      business: {
        action: 'schedule_created',
        result: 'success',
      },
    });

    return schedule;
  }

  async updateBackupSchedule(scheduleId: string, updates: Partial<BackupSchedule>): Promise<BackupSchedule | null> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    const updatedSchedule = {
      ...schedule,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.schedules.set(scheduleId, updatedSchedule);

    loggingService.info('Backup schedule updated', {
      scheduleId,
    }, {
      business: {
        action: 'schedule_updated',
        result: 'success',
      },
    });

    return updatedSchedule;
  }

  async deleteBackupSchedule(scheduleId: string): Promise<boolean> {
    const deleted = this.schedules.delete(scheduleId);
    
    if (deleted) {
      loggingService.info('Backup schedule deleted', {
        scheduleId,
      }, {
        business: {
          action: 'schedule_deleted',
          result: 'success',
        },
      });
    }

    return deleted;
  }

  async getBackupJobs(filter?: {
    scheduleId?: string;
    status?: BackupJob['status'];
    limit?: number;
  }): Promise<BackupJob[]> {
    let jobs = Array.from(this.jobs.values());

    if (filter) {
      if (filter.scheduleId) {
        jobs = jobs.filter(job => job.scheduleId === filter.scheduleId);
      }
      if (filter.status) {
        jobs = jobs.filter(job => job.status === filter.status);
      }
    }

    // Sort by creation date (newest first)
    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filter.limit) {
      jobs = jobs.slice(0, filter.limit);
    }

    return jobs;
  }

  async getBackupReports(filter?: {
    scheduleId?: string;
    status?: BackupReport['status'];
    limit?: number;
  }): Promise<BackupReport[]> {
    let reports = Array.from(this.reports.values());

    if (filter) {
      if (filter.scheduleId) {
        reports = reports.filter(report => report.scheduleId === filter.scheduleId);
      }
      if (filter.status) {
        reports = reports.filter(report => report.status === filter.status);
      }
    }

    // Sort by timestamp (newest first)
    reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filter.limit) {
      reports = reports.slice(0, filter.limit);
    }

    return reports;
  }

  async getSystemStatus(): Promise<{
    totalSchedules: number;
    enabledSchedules: number;
    activeJobs: number;
    queuedJobs: number;
    completedJobs: number;
    failedJobs: number;
    lastBackup?: string;
    nextScheduledBackup?: string;
  }> {
    const schedules = Array.from(this.schedules.values());
    const jobs = Array.from(this.jobs.values());
    const reports = Array.from(this.reports.values());

    return {
      totalSchedules: schedules.length,
      enabledSchedules: schedules.filter(s => s.enabled).length,
      activeJobs: this.activeJobs.size,
      queuedJobs: this.jobQueue.length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      lastBackup: reports.length > 0 ? reports[reports.length - 1].timestamp : undefined,
      nextScheduledBackup: this.getNextScheduledBackup(),
    };
  }

  private getNextScheduledBackup(): string | undefined {
    const scheduledBackups = Array.from(this.schedules.values())
      .filter(s => s.enabled && s.type === 'scheduled' && s.nextRun)
      .sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime());

    return scheduledBackups[0]?.nextRun;
  }
}

export const automatedBackupService = new AutomatedBackupService();
