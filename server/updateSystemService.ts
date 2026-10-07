import { db } from '../server/db';
import { auditLogs } from '../shared/schema';
import { loggingService } from './loggingService';
import { healthCheckService } from './healthCheckService';

interface UpdateVersion {
  id: string;
  version: string;
  buildNumber: string;
  releaseDate: string;
  description: string;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  status: 'draft' | 'testing' | 'staged' | 'released' | 'deprecated';
  downloadUrl: string;
  checksum: string;
  size: number;
  mandatory: boolean;
  rollbackVersion?: string;
  dependencies: string[];
  breakingChanges: string[];
  features: string[];
  bugFixes: string[];
  securityUpdates: string[];
  compatibility: {
    minVersion: string;
    maxVersion?: string;
    platforms: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface UpdateDevice {
  id: string;
  deviceId: string;
  userId: string;
  platform: 'ios' | 'android' | 'web';
  currentVersion: string;
  buildNumber: string;
  lastSeen: string;
  updateEligibility: {
    eligible: boolean;
    reason?: string;
    requiredVersion?: string;
  };
  updateHistory: Array<{
    version: string;
    installedAt: string;
    success: boolean;
    rollback?: boolean;
    error?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface UpdateDeployment {
  id: string;
  versionId: string;
  status: 'pending' | 'downloading' | 'installing' | 'completed' | 'failed' | 'rolled_back';
  deviceId: string;
  userId: string;
  platform: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  downloadProgress: number;
  installProgress: number;
  rollbackReason?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

interface UpdateAnalytics {
  id: string;
  versionId: string;
  timestamp: string;
  totalDevices: number;
  successfulUpdates: number;
  failedUpdates: number;
  rolledBackUpdates: number;
  averageDownloadTime: number;
  averageInstallTime: number;
  successRate: number;
  platformBreakdown: Record<string, {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }>;
  errorBreakdown: Record<string, number>;
}

export class UpdateSystemService {
  private versions: Map<string, UpdateVersion> = new Map();
  private devices: Map<string, UpdateDevice> = new Map();
  private deployments: Map<string, UpdateDeployment> = new Map();
  private analytics: Map<string, UpdateAnalytics> = new Map();
  private updateQueue: UpdateDeployment[] = [];
  private maxConcurrentUpdates = 10;
  private activeDeployments: Map<string, UpdateDeployment> = new Map();

  constructor() {
    this.initializeDefaultVersions();
    this.startUpdateProcessor();
    this.startDeviceMonitoring();
  }

  // VERSION MANAGEMENT
  private initializeDefaultVersions(): void {
    const currentVersion: UpdateVersion = {
      id: 'v1.0.0',
      version: '1.0.0',
      buildNumber: '100',
      releaseDate: new Date().toISOString(),
      description: 'Initial release of Pharma-Scan with advanced features',
      type: 'major',
      status: 'released',
      downloadUrl: 'https://api.medscanegypt.com/updates/v1.0.0',
      checksum: 'abc123def456',
      size: 50000000, // 50MB
      mandatory: false,
      dependencies: [],
      breakingChanges: [],
      features: [
        'Drug Interaction Checker',
        'Allergy Management',
        'Dosage Calculator',
        'Backup & Sync',
        'Usage Analytics',
        'Price Trend Analysis',
        'Market Intelligence',
        'Export Features',
      ],
      bugFixes: [],
      securityUpdates: [
        'Enhanced encryption for user data',
        'Improved authentication security',
      ],
      compatibility: {
        minVersion: '1.0.0',
        platforms: ['ios', 'android', 'web'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.versions.set(currentVersion.id, currentVersion);
  }

  async createVersion(versionData: Omit<UpdateVersion, 'id' | 'createdAt' | 'updatedAt'>): Promise<UpdateVersion> {
    const version: UpdateVersion = {
      id: `v${versionData.version}`,
      ...versionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.versions.set(version.id, version);

    loggingService.info('Update version created', {
      versionId: version.id,
      version: version.version,
    }, {
      business: {
        action: 'version_created',
        result: 'success',
      },
    });

    return version;
  }

  async updateVersion(versionId: string, updates: Partial<UpdateVersion>): Promise<UpdateVersion | null> {
    const version = this.versions.get(versionId);
    if (!version) return null;

    const updatedVersion = {
      ...version,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.versions.set(versionId, updatedVersion);

    loggingService.info('Update version updated', {
      versionId,
      version: version.version,
    }, {
      business: {
        action: 'version_updated',
        result: 'success',
      },
    });

    return updatedVersion;
  }

  async releaseVersion(versionId: string): Promise<boolean> {
    const version = this.versions.get(versionId);
    if (!version) return false;

    version.status = 'released';
    version.updatedAt = new Date().toISOString();

    // Queue updates for eligible devices
    await this.queueUpdatesForVersion(version);

    loggingService.info('Version released', {
      versionId,
      version: version.version,
    }, {
      business: {
        action: 'version_released',
        result: 'success',
      },
    });

    return true;
  }

  // DEVICE MANAGEMENT
  async registerDevice(deviceData: Omit<UpdateDevice, 'id' | 'createdAt' | 'updatedAt'>): Promise<UpdateDevice> {
    const device: UpdateDevice = {
      id: crypto.randomUUID(),
      ...deviceData,
      updateEligibility: this.checkUpdateEligibility(deviceData),
      updateHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.devices.set(device.deviceId, device);

    loggingService.info('Device registered', {
      deviceId: device.deviceId,
      userId: device.userId,
      platform: device.platform,
    }, {
      business: {
        action: 'device_registered',
        result: 'success',
      },
    });

    return device;
  }

  async updateDevice(deviceId: string, updates: Partial<UpdateDevice>): Promise<UpdateDevice | null> {
    const device = this.devices.get(deviceId);
    if (!device) return null;

    const updatedDevice = {
      ...device,
      ...updates,
      updateEligibility: this.checkUpdateEligibility({ ...device, ...updates }),
      updatedAt: new Date().toISOString(),
    };

    this.devices.set(deviceId, updatedDevice);

    return updatedDevice;
  }

  private checkUpdateEligibility(device: UpdateDevice): UpdateDevice['updateEligibility'] {
    const latestVersion = this.getLatestVersion();
    if (!latestVersion) {
      return { eligible: false, reason: 'No versions available' };
    }

    // Check if device is already on latest version
    if (this.isVersionNewer(latestVersion.version, device.currentVersion)) {
      return { eligible: true, requiredVersion: latestVersion.version };
    }

    // Check if current version is deprecated
    const currentVersion = this.versions.get(`v${device.currentVersion}`);
    if (currentVersion && currentVersion.status === 'deprecated') {
      return { eligible: true, requiredVersion: latestVersion.version, reason: 'Current version deprecated' };
    }

    return { eligible: false, reason: 'Device is up to date' };
  }

  private isVersionNewer(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (version: string) => {
      const parts = version.split('.').map(Number);
      return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    };

    const [newMajor, newMinor, newPatch] = parseVersion(newVersion);
    const [currentMajor, currentMinor, currentPatch] = parseVersion(currentVersion);

    if (newMajor > currentMajor) return true;
    if (newMajor < currentMajor) return false;
    if (newMinor > currentMinor) return true;
    if (newMinor < currentMinor) return false;
    return newPatch > currentPatch;
  }

  private getLatestVersion(): UpdateVersion | null {
    const releasedVersions = Array.from(this.versions.values())
      .filter(v => v.status === 'released')
      .sort((a, b) => this.compareVersions(b.version, a.version));

    return releasedVersions[0] || null;
  }

  private compareVersions(a: string, b: string): number {
    const parseVersion = (version: string) => {
      const parts = version.split('.').map(Number);
      return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    };

    const [aMajor, aMinor, aPatch] = parseVersion(a);
    const [bMajor, bMinor, bPatch] = parseVersion(b);

    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  }

  // UPDATE DEPLOYMENT
  async deployUpdate(deviceId: string, versionId?: string): Promise<UpdateDeployment> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const targetVersion = versionId 
      ? this.versions.get(versionId)
      : this.getLatestVersion();

    if (!targetVersion) {
      throw new Error(`Version not found: ${versionId}`);
    }

    if (!device.updateEligibility.eligible) {
      throw new Error(`Device not eligible for update: ${device.updateEligibility.reason}`);
    }

    const deployment: UpdateDeployment = {
      id: crypto.randomUUID(),
      versionId: targetVersion.id,
      status: 'pending',
      deviceId,
      userId: device.userId,
      platform: device.platform,
      startTime: new Date().toISOString(),
      downloadProgress: 0,
      installProgress: 0,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.deployments.set(deployment.id, deployment);
    this.updateQueue.push(deployment);

    loggingService.info('Update deployment created', {
      deploymentId: deployment.id,
      deviceId,
      versionId: targetVersion.id,
    }, {
      business: {
        action: 'update_deployed',
        result: 'pending',
      },
    });

    return deployment;
  }

  private async executeUpdateDeployment(deployment: UpdateDeployment): Promise<void> {
    const device = this.devices.get(deployment.deviceId);
    const version = this.versions.get(deployment.versionId);
    
    if (!device || !version) {
      throw new Error('Device or version not found');
    }

    deployment.status = 'downloading';
    deployment.updatedAt = new Date().toISOString();
    this.activeDeployments.set(deployment.id, deployment);

    try {
      // Step 1: Download update
      await this.downloadUpdate(deployment);
      
      // Step 2: Install update
      await this.installUpdate(deployment);
      
      // Step 3: Verify installation
      await this.verifyInstallation(deployment);
      
      // Step 4: Update device record
      await this.updateDeviceAfterInstallation(deployment, device, version);
      
      deployment.status = 'completed';
      deployment.endTime = new Date().toISOString();
      deployment.duration = Date.now() - new Date(deployment.startTime!).getTime();
      deployment.updatedAt = new Date().toISOString();

      loggingService.info('Update deployment completed', {
        deploymentId: deployment.id,
        deviceId: deployment.deviceId,
        versionId: deployment.versionId,
        duration: deployment.duration,
      }, {
        business: {
          action: 'update_completed',
          result: 'success',
        },
      });

    } catch (error) {
      deployment.status = 'failed';
      deployment.endTime = new Date().toISOString();
      deployment.duration = Date.now() - new Date(deployment.startTime!).getTime();
      deployment.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      deployment.updatedAt = new Date().toISOString();

      loggingService.error('Update deployment failed', {
        deploymentId: deployment.id,
        deviceId: deployment.deviceId,
        versionId: deployment.versionId,
      }, {
        business: {
          action: 'update_failed',
          result: 'failure',
        },
        error: {
          name: error instanceof Error ? error.name : 'UpdateError',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Retry logic
      if (deployment.retryCount < deployment.maxRetries) {
        deployment.retryCount++;
        deployment.status = 'pending';
        deployment.updatedAt = new Date().toISOString();
        
        // Add back to queue with delay
        setTimeout(() => {
          this.updateQueue.push(deployment);
        }, Math.pow(2, deployment.retryCount) * 60000); // Exponential backoff

        loggingService.info('Update deployment queued for retry', {
          deploymentId: deployment.id,
          retryCount: deployment.retryCount,
        });
      }
    } finally {
      this.activeDeployments.delete(deployment.id);
    }
  }

  private async downloadUpdate(deployment: UpdateDeployment): Promise<void> {
    // Simulate download progress
    const downloadSteps = 10;
    
    for (let i = 0; i <= downloadSteps; i++) {
      deployment.downloadProgress = (i / downloadSteps) * 100;
      deployment.updatedAt = new Date().toISOString();
      
      // Simulate download time
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async installUpdate(deployment: UpdateDeployment): Promise<void> {
    // Simulate install progress
    const installSteps = 20;
    
    for (let i = 0; i <= installSteps; i++) {
      deployment.installProgress = (i / installSteps) * 100;
      deployment.updatedAt = new Date().toISOString();
      
      // Simulate install time
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private async verifyInstallation(deployment: UpdateDeployment): Promise<void> {
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production, this would verify the installation
    // Check if the app can start with the new version
    // Verify all features are working
    // Check data integrity
  }

  private async updateDeviceAfterInstallation(
    deployment: UpdateDeployment,
    device: UpdateDevice,
    version: UpdateVersion
  ): Promise<void> {
    const updateHistory = [
      ...device.updateHistory,
      {
        version: version.version,
        installedAt: new Date().toISOString(),
        success: true,
      },
    ];

    await this.updateDevice(deployment.deviceId, {
      currentVersion: version.version,
      buildNumber: version.buildNumber,
      lastSeen: new Date().toISOString(),
      updateHistory,
      updateEligibility: this.checkUpdateEligibility({
        ...device,
        currentVersion: version.version,
        buildNumber: version.buildNumber,
      }),
    });
  }

  async rollbackUpdate(deploymentId: string): Promise<boolean> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return false;

    const device = this.devices.get(deployment.deviceId);
    if (!device) return false;

    // Find rollback version
    const rollbackVersion = this.versions.get(`v${device.currentVersion}`);
    if (!rollbackVersion) return false;

    deployment.status = 'rolled_back';
    deployment.rollbackReason = 'Manual rollback requested';
    deployment.endTime = new Date().toISOString();
    deployment.updatedAt = new Date().toISOString();

    // Update device history
    const updateHistory = [
      ...device.updateHistory,
      {
        version: deployment.versionId.replace('v', ''),
        installedAt: deployment.startTime!,
        success: false,
        rollback: true,
      },
    ];

    await this.updateDevice(deployment.deviceId, {
      updateHistory,
    });

    loggingService.warn('Update rolled back', {
      deploymentId,
      deviceId: deployment.deviceId,
      fromVersion: deployment.versionId,
      toVersion: rollbackVersion.id,
    }, {
      business: {
        action: 'update_rolled_back',
        result: 'success',
      },
    });

    return true;
  }

  // UPDATE PROCESSOR
  private startUpdateProcessor(): void {
    setInterval(async () => {
      if (this.activeDeployments.size >= this.maxConcurrentUpdates || this.updateQueue.length === 0) {
        return;
      }

      const deployment = this.updateQueue.shift();
      if (!deployment) return;

      try {
        await this.executeUpdateDeployment(deployment);
      } catch (error) {
        loggingService.error('Update processor error', {
          deploymentId: deployment.id,
        }, {
          error: {
            name: error instanceof Error ? error.name : 'UpdateProcessorError',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }, 5000); // Check every 5 seconds
  }

  private async queueUpdatesForVersion(version: UpdateVersion): Promise<void> {
    const eligibleDevices = Array.from(this.devices.values())
      .filter(device => device.updateEligibility.eligible)
      .filter(device => version.compatibility.platforms.includes(device.platform));

    for (const device of eligibleDevices) {
      try {
        await this.deployUpdate(device.deviceId, version.id);
      } catch (error) {
        loggingService.error('Failed to queue update for device', {
          deviceId: device.deviceId,
          versionId: version.id,
        }, {
          error: {
            name: error instanceof Error ? error.name : 'QueueError',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    loggingService.info('Updates queued for version', {
      versionId: version.id,
      version: version.version,
      eligibleDeviceCount: eligibleDevices.length,
    }, {
      business: {
        action: 'updates_queued',
        result: 'success',
        value: eligibleDevices.length,
      },
    });
  }

  // DEVICE MONITORING
  private startDeviceMonitoring(): void {
    setInterval(async () => {
      try {
        await this.checkDeviceHealth();
      } catch (error) {
        loggingService.error('Device monitoring error', {}, {
          error: {
            name: error instanceof Error ? error.name : 'MonitoringError',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }, 60000); // Check every minute
  }

  private async checkDeviceHealth(): Promise<void> {
    const now = new Date();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours

    for (const device of this.devices.values()) {
      const lastSeen = new Date(device.lastSeen);
      
      if (now.getTime() - lastSeen.getTime() > staleThreshold) {
        // Device is stale, mark as offline
        await this.updateDevice(device.deviceId, {
          lastSeen: device.lastSeen, // Keep the last seen time
        });

        loggingService.warn('Device marked as stale', {
          deviceId: device.deviceId,
          lastSeen: device.lastSeen,
        });
      }
    }
  }

  // ANALYTICS
  async generateUpdateAnalytics(versionId: string): Promise<UpdateAnalytics> {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version not found: ${versionId}`);
    }

    const deployments = Array.from(this.deployments.values())
      .filter(d => d.versionId === versionId);

    const totalDevices = deployments.length;
    const successfulUpdates = deployments.filter(d => d.status === 'completed').length;
    const failedUpdates = deployments.filter(d => d.status === 'failed').length;
    const rolledBackUpdates = deployments.filter(d => d.status === 'rolled_back').length;

    const completedDeployments = deployments.filter(d => d.status === 'completed');
    const averageDownloadTime = completedDeployments.length > 0
      ? completedDeployments.reduce((sum, d) => sum + (d.duration || 0), 0) / completedDeployments.length / 2
      : 0;

    const averageInstallTime = completedDeployments.length > 0
      ? completedDeployments.reduce((sum, d) => sum + (d.duration || 0), 0) / completedDeployments.length / 2
      : 0;

    const successRate = totalDevices > 0 ? (successfulUpdates / totalDevices) * 100 : 0;

    // Platform breakdown
    const platformBreakdown: Record<string, {
      total: number;
      successful: number;
      failed: number;
      successRate: number;
    }> = {};

    deployments.forEach(deployment => {
      if (!platformBreakdown[deployment.platform]) {
        platformBreakdown[deployment.platform] = {
          total: 0,
          successful: 0,
          failed: 0,
          successRate: 0,
        };
      }

      platformBreakdown[deployment.platform].total++;
      
      if (deployment.status === 'completed') {
        platformBreakdown[deployment.platform].successful++;
      } else if (deployment.status === 'failed') {
        platformBreakdown[deployment.platform].failed++;
      }
      
      platformBreakdown[deployment.platform].successRate = 
        platformBreakdown[deployment.platform].total > 0 
          ? (platformBreakdown[deployment.platform].successful / platformBreakdown[deployment.platform].total) * 100
          : 0;
    });

    // Error breakdown
    const errorBreakdown: Record<string, number> = {};
    deployments
      .filter(d => d.status === 'failed' && d.errorMessage)
      .forEach(d => {
        const error = d.errorMessage || 'Unknown error';
        errorBreakdown[error] = (errorBreakdown[error] || 0) + 1;
      });

    const analytics: UpdateAnalytics = {
      id: crypto.randomUUID(),
      versionId,
      timestamp: new Date().toISOString(),
      totalDevices,
      successfulUpdates,
      failedUpdates,
      rolledBackUpdates,
      averageDownloadTime,
      averageInstallTime,
      successRate,
      platformBreakdown,
      errorBreakdown,
    };

    this.analytics.set(analytics.id, analytics);

    return analytics;
  }

  // API METHODS
  async getVersions(filter?: {
    status?: UpdateVersion['status'];
    type?: UpdateVersion['type'];
    limit?: number;
  }): Promise<UpdateVersion[]> {
    let versions = Array.from(this.versions.values());

    if (filter) {
      if (filter.status) {
        versions = versions.filter(v => v.status === filter.status);
      }
      if (filter.type) {
        versions = versions.filter(v => v.type === filter.type);
      }
    }

    // Sort by version (newest first)
    versions.sort((a, b) => this.compareVersions(b.version, a.version));

    if (filter.limit) {
      versions = versions.slice(0, filter.limit);
    }

    return versions;
  }

  async getVersion(versionId: string): Promise<UpdateVersion | null> {
    return this.versions.get(versionId) || null;
  }

  async getDevices(filter?: {
    userId?: string;
    platform?: UpdateDevice['platform'];
    eligible?: boolean;
    limit?: number;
  }): Promise<UpdateDevice[]> {
    let devices = Array.from(this.devices.values());

    if (filter) {
      if (filter.userId) {
        devices = devices.filter(d => d.userId === filter.userId);
      }
      if (filter.platform) {
        devices = devices.filter(d => d.platform === filter.platform);
      }
      if (filter.eligible !== undefined) {
        devices = devices.filter(d => d.updateEligibility.eligible === filter.eligible);
      }
    }

    if (filter.limit) {
      devices = devices.slice(0, filter.limit);
    }

    return devices;
  }

  async getDevice(deviceId: string): Promise<UpdateDevice | null> {
    return this.devices.get(deviceId) || null;
  }

  async getDeployments(filter?: {
    deviceId?: string;
    userId?: string;
    status?: UpdateDeployment['status'];
    limit?: number;
  }): Promise<UpdateDeployment[]> {
    let deployments = Array.from(this.deployments.values());

    if (filter) {
      if (filter.deviceId) {
        deployments = deployments.filter(d => d.deviceId === filter.deviceId);
      }
      if (filter.userId) {
        deployments = deployments.filter(d => d.userId === filter.userId);
      }
      if (filter.status) {
        deployments = deployments.filter(d => d.status === filter.status);
      }
    }

    // Sort by start time (newest first)
    deployments.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    if (filter.limit) {
      deployments = deployments.slice(0, filter.limit);
    }

    return deployments;
  }

  async getDeployment(deploymentId: string): Promise<UpdateDeployment | null> {
    return this.deployments.get(deploymentId) || null;
  }

  async getAnalytics(filter?: {
    versionId?: string;
    limit?: number;
  }): Promise<UpdateAnalytics[]> {
    let analytics = Array.from(this.analytics.values());

    if (filter) {
      if (filter.versionId) {
        analytics = analytics.filter(a => a.versionId === filter.versionId);
      }
    }

    // Sort by timestamp (newest first)
    analytics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filter.limit) {
      analytics = analytics.slice(0, filter.limit);
    }

    return analytics;
  }

  async getSystemStatus(): Promise<{
    totalVersions: number;
    releasedVersions: number;
    totalDevices: number;
    activeDevices: number;
    eligibleDevices: number;
    activeDeployments: number;
    queuedDeployments: number;
    recentAnalytics?: UpdateAnalytics;
  }> {
    const versions = Array.from(this.versions.values());
    const devices = Array.from(this.devices.values());
    const deployments = Array.from(this.deployments.values());
    const analytics = Array.from(this.analytics.values());

    return {
      totalVersions: versions.length,
      releasedVersions: versions.filter(v => v.status === 'released').length,
      totalDevices: devices.length,
      activeDevices: devices.filter(d => 
        new Date().getTime() - new Date(d.lastSeen).getTime() < 24 * 60 * 60 * 1000
      ).length,
      eligibleDevices: devices.filter(d => d.updateEligibility.eligible).length,
      activeDeployments: this.activeDeployments.size,
      queuedDeployments: this.updateQueue.length,
      recentAnalytics: analytics.length > 0 ? analytics[analytics.length - 1] : undefined,
    };
  }
}

export const updateSystemService = new UpdateSystemService();
