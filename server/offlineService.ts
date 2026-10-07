import { loggingService } from './loggingService';
import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';
import { 
  users, 
  egyptianDrugs, 
  userPrescriptions, 
  userAllergies,
  drugReviews,
  medicalQuestions,
  supportTickets,
  helpRequests,
  prescriptionBackups
} from '../shared/schema';

export interface OfflineData {
  drugs: any[];
  userPrescriptions: any[];
  userAllergies: any[];
  userReviews: any[];
  userQuestions: any[];
  userTickets: any[];
  userHelpRequests: any[];
  lastSync: string;
  version: string;
}

export interface SyncQueue {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  data: any;
  timestamp: string;
  retryCount: number;
  lastRetry?: string;
}

export interface OfflineCache {
  key: string;
  data: any;
  timestamp: string;
  expiresAt?: string;
  version: string;
}

export class OfflineService {
  private readonly CACHE_VERSION = '1.0.0';
  private readonly SYNC_QUEUE_KEY = 'sync_queue';
  private readonly OFFLINE_DATA_KEY = 'offline_data';
  private readonly CACHE_PREFIX = 'pharma_scan_cache_';
  private readonly DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_SYNC_RETRIES = 3;
  private readonly SYNC_RETRY_DELAY = 5000; // 5 seconds

  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private syncQueue: SyncQueue[] = [];
  private cache: Map<string, OfflineCache> = new Map();

  constructor() {
    this.initializeOfflineMode();
    this.startConnectivityMonitoring();
    this.startPeriodicSync();
  }

  // OFFLINE MODE INITIALIZATION
  private async initializeOfflineMode(): Promise<void> {
    try {
      // Load sync queue from localStorage
      const savedQueue = localStorage.getItem(this.SYNC_QUEUE_KEY);
      if (savedQueue) {
        this.syncQueue = JSON.parse(savedQueue);
      }

      // Load cache from localStorage
      this.loadCacheFromStorage();

      // Check initial connectivity
      this.updateConnectivityStatus();

      loggingService.info('Offline mode initialized', {
        queueSize: this.syncQueue.length,
        cacheSize: this.cache.size,
        isOnline: this.isOnline,
      });
    } catch (error) {
      loggingService.error('Failed to initialize offline mode', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // CONNECTIVITY MONITORING
  private startConnectivityMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.updateConnectivityStatus();
      if (this.isOnline) {
        this.processSyncQueue();
      }
    });

    window.addEventListener('offline', () => {
      this.updateConnectivityStatus();
    });

    // Periodic connectivity check
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Every 30 seconds
  }

  private updateConnectivityStatus(): void {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;

    if (wasOnline !== this.isOnline) {
      loggingService.info('Connectivity status changed', {
        from: wasOnline ? 'online' : 'offline',
        to: this.isOnline ? 'online' : 'offline',
      });

      if (this.isOnline && !wasOnline) {
        // Back online - start syncing
        this.processSyncQueue();
      }
    }
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      // Try to reach a reliable endpoint
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        timeout: 5000,
      });

      const isOnline = response.ok;
      if (isOnline !== this.isOnline) {
        this.isOnline = isOnline;
        this.updateConnectivityStatus();
      }

      return isOnline;
    } catch (error) {
      if (this.isOnline) {
        this.isOnline = false;
        this.updateConnectivityStatus();
      }
      return false;
    }
  }

  // OFFLINE DATA MANAGEMENT
  async cacheOfflineData(): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      // Cache essential data for offline use
      const drugs = await this.getEssentialDrugs();
      const userPrescriptions = await this.getUserPrescriptions(userId);
      const userAllergies = await this.getUserAllergies(userId);
      const userReviews = await this.getUserReviews(userId);
      const userQuestions = await this.getUserQuestions(userId);
      const userTickets = await this.getUserTickets(userId);
      const userHelpRequests = await this.getUserHelpRequests(userId);

      const offlineData: OfflineData = {
        drugs,
        userPrescriptions,
        userAllergies,
        userReviews,
        userQuestions,
        userTickets,
        userHelpRequests,
        lastSync: new Date().toISOString(),
        version: this.CACHE_VERSION,
      };

      // Save to localStorage
      localStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(offlineData));

      // Save to memory cache
      this.setCache(this.OFFLINE_DATA_KEY, offlineData, this.DEFAULT_CACHE_TTL);

      loggingService.info('Offline data cached', {
        drugsCount: drugs.length,
        prescriptionsCount: userPrescriptions.length,
        allergiesCount: userAllergies.length,
        reviewsCount: userReviews.length,
      });
    } catch (error) {
      loggingService.error('Failed to cache offline data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  getOfflineData(): OfflineData | null {
    try {
      // Try memory cache first
      const cached = this.getCache(this.OFFLINE_DATA_KEY);
      if (cached) {
        return cached as OfflineData;
      }

      // Try localStorage
      const saved = localStorage.getItem(this.OFFLINE_DATA_KEY);
      if (saved) {
        const data = JSON.parse(saved) as OfflineData;
        
        // Validate version
        if (data.version !== this.CACHE_VERSION) {
          loggingService.warn('Offline data version mismatch', {
            expected: this.CACHE_VERSION,
            actual: data.version,
          });
          return null;
        }

        return data;
      }

      return null;
    } catch (error) {
      loggingService.error('Failed to get offline data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  // SYNC QUEUE MANAGEMENT
  private addToSyncQueue(operation: Omit<SyncQueue, 'id' | 'timestamp' | 'retryCount'>): void {
    const syncItem: SyncQueue = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      ...operation,
    };

    this.syncQueue.push(syncItem);
    this.saveSyncQueue();

    loggingService.debug('Added to sync queue', {
      id: syncItem.id,
      type: syncItem.type,
      resource: syncItem.resource,
    });
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      loggingService.info('Processing sync queue', {
        queueSize: this.syncQueue.length,
      });

      const failedItems: SyncQueue[] = [];

      for (const item of this.syncQueue) {
        try {
          const success = await this.processSyncItem(item);
          
          if (!success) {
            item.retryCount++;
            item.lastRetry = new Date().toISOString();

            if (item.retryCount < this.MAX_SYNC_RETRIES) {
              failedItems.push(item);
              loggingService.warn('Sync item failed, will retry', {
                id: item.id,
                retryCount: item.retryCount,
              });
            } else {
              loggingService.error('Sync item failed permanently', {
                id: item.id,
                retryCount: item.retryCount,
              });
            }
          }
        } catch (error) {
          loggingService.error('Error processing sync item', {
            id: item.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          
          item.retryCount++;
          item.lastRetry = new Date().toISOString();

          if (item.retryCount < this.MAX_SYNC_RETRIES) {
            failedItems.push(item);
          }
        }

        // Add delay between sync operations
        await new Promise(resolve => setTimeout(resolve, this.SYNC_RETRY_DELAY));
      }

      // Update sync queue
      this.syncQueue = failedItems;
      this.saveSyncQueue();

      // Refresh offline data after successful sync
      if (failedItems.length === 0) {
        await this.cacheOfflineData();
      }

      loggingService.info('Sync queue processed', {
        processedItems: this.syncQueue.length - failedItems.length,
        failedItems: failedItems.length,
      });
    } catch (error) {
      loggingService.error('Sync queue processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processSyncItem(item: SyncQueue): Promise<boolean> {
    try {
      switch (item.resource) {
        case 'drugReview':
          return await this.syncDrugReview(item);
        case 'medicalQuestion':
          return await this.syncMedicalQuestion(item);
        case 'supportTicket':
          return await this.syncSupportTicket(item);
        case 'helpRequest':
          return await this.syncHelpRequest(item);
        case 'userPrescription':
          return await this.syncUserPrescription(item);
        case 'userAllergy':
          return await this.syncUserAllergy(item);
        default:
          loggingService.warn('Unknown sync resource', { resource: item.resource });
          return true; // Don't retry unknown resources
      }
    } catch (error) {
      loggingService.error('Failed to process sync item', {
        id: item.id,
        resource: item.resource,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  private async syncDrugReview(item: SyncQueue): Promise<boolean> {
    const response = await fetch('/api/community/reviews', {
      method: item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
      body: item.type !== 'delete' ? JSON.stringify(item.data) : undefined,
    });

    return response.ok;
  }

  private async syncMedicalQuestion(item: SyncQueue): Promise<boolean> {
    const endpoint = item.type === 'answer' 
      ? `/api/community/questions/${item.data.questionId}/answer`
      : `/api/community/questions`;

    const response = await fetch(endpoint, {
      method: item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
      body: item.type !== 'delete' ? JSON.stringify(item.data) : undefined,
    });

    return response.ok;
  }

  private async syncSupportTicket(item: SyncQueue): Promise<boolean> {
    const endpoint = item.type === 'close' 
      ? `/api/community/support/tickets/${item.data.ticketId}/close`
      : `/api/community/support/tickets`;

    const response = await fetch(endpoint, {
      method: item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
      body: JSON.stringify(item.data),
    });

    return response.ok;
  }

  private async syncHelpRequest(item: SyncQueue): Promise<boolean> {
    const endpoint = item.type === 'respond' 
      ? `/api/community/help/requests/${item.data.requestId}/respond`
      : `/api/community/help/requests`;

    const response = await fetch(endpoint, {
      method: item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
      body: item.type !== 'delete' ? JSON.stringify(item.data) : undefined,
    });

    return response.ok;
  }

  private async syncUserPrescription(item: SyncQueue): Promise<boolean> {
    const response = await fetch('/api/advanced/prescriptions', {
      method: item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
      body: item.type !== 'delete' ? JSON.stringify(item.data) : undefined,
    });

    return response.ok;
  }

  private async syncUserAllergy(item: SyncQueue): Promise<boolean> {
    const response = await fetch('/api/advanced/allergies', {
      method: item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
      body: item.type !== 'delete' ? JSON.stringify(item.data) : undefined,
    });

    return response.ok;
  }

  // OFFLINE OPERATIONS
  async createOfflineReview(reviewData: any): Promise<void> {
    // Add to sync queue
    this.addToSyncQueue({
      type: 'create',
      resource: 'drugReview',
      data: reviewData,
    });

    // Add to local cache immediately
    const offlineData = this.getOfflineData();
    if (offlineData) {
      const newReview = {
        ...reviewData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOffline: true,
      };
      offlineData.userReviews.push(newReview);
      this.updateOfflineData(offlineData);
    }

    loggingService.info('Review created offline', { drugId: reviewData.drugId });
  }

  async createOfflineQuestion(questionData: any): Promise<void> {
    this.addToSyncQueue({
      type: 'create',
      resource: 'medicalQuestion',
      data: questionData,
    });

    const offlineData = this.getOfflineData();
    if (offlineData) {
      const newQuestion = {
        ...questionData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOffline: true,
      };
      offlineData.userQuestions.push(newQuestion);
      this.updateOfflineData(offlineData);
    }

    loggingService.info('Question created offline', { category: questionData.category });
  }

  async createOfflineTicket(ticketData: any): Promise<void> {
    this.addToSyncQueue({
      type: 'create',
      resource: 'supportTicket',
      data: ticketData,
    });

    const offlineData = this.getOfflineData();
    if (offlineData) {
      const newTicket = {
        ...ticketData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOffline: true,
      };
      offlineData.userTickets.push(newTicket);
      this.updateOfflineData(offlineData);
    }

    loggingService.info('Support ticket created offline', { issueType: ticketData.issueType });
  }

  // CACHE MANAGEMENT
  private setCache(key: string, data: any, ttl: number = this.DEFAULT_CACHE_TTL): void {
    const cacheItem: OfflineCache = {
      key: this.CACHE_PREFIX + key,
      data,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttl).toISOString(),
      version: this.CACHE_VERSION,
    };

    this.cache.set(cacheItem.key, cacheItem);
    this.saveCacheToStorage();
  }

  private getCache(key: string): any | null {
    const cacheItem = this.cache.get(this.CACHE_PREFIX + key);
    
    if (!cacheItem) {
      return null;
    }

    // Check expiration
    if (cacheItem.expiresAt && new Date() > new Date(cacheItem.expiresAt)) {
      this.cache.delete(cacheItem.key);
      this.saveCacheToStorage();
      return null;
    }

    // Check version
    if (cacheItem.version !== this.CACHE_VERSION) {
      this.cache.delete(cacheItem.key);
      this.saveCacheToStorage();
      return null;
    }

    return cacheItem.data;
  }

  private clearCache(pattern?: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (!pattern || key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    this.saveCacheToStorage();
  }

  private saveCacheToStorage(): void {
    try {
      const cacheArray = Array.from(this.cache.entries());
      localStorage.setItem('pharma_scan_cache', JSON.stringify(cacheArray));
    } catch (error) {
      loggingService.error('Failed to save cache to storage', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private loadCacheFromStorage(): void {
    try {
      const saved = localStorage.getItem('pharma_scan_cache');
      if (saved) {
        const cacheArray = JSON.parse(saved);
        this.cache = new Map(cacheArray);
      }
    } catch (error) {
      loggingService.error('Failed to load cache from storage', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // HELPER METHODS
  private updateOfflineData(data: OfflineData): void {
    data.lastSync = new Date().toISOString();
    localStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(data));
    this.setCache(this.OFFLINE_DATA_KEY, data, this.DEFAULT_CACHE_TTL);
  }

  private saveSyncQueue(): void {
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
  }

  private getCurrentUserId(): string | null {
    // This should get the current user ID from auth context
    // Implementation depends on your auth system
    return localStorage.getItem('currentUserId');
  }

  private getAccessToken(): string {
    // This should get the current access token
    // Implementation depends on your auth system
    return localStorage.getItem('accessToken') || '';
  }

  // DATA FETCHING METHODS (to be implemented with your actual data services)
  private async getEssentialDrugs(): Promise<any[]> {
    // Fetch essential drugs for offline use
    try {
      const response = await fetch('/api/drugs?limit=1000');
      if (response.ok) {
        const data = await response.json();
        return data.drugs || [];
      }
    } catch (error) {
      loggingService.error('Failed to fetch essential drugs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return [];
  }

  private async getUserPrescriptions(userId: string): Promise<any[]> {
    // Implementation depends on your prescription service
    return [];
  }

  private async getUserAllergies(userId: string): Promise<any[]> {
    // Implementation depends on your allergy service
    return [];
  }

  private async getUserReviews(userId: string): Promise<any[]> {
    // Implementation depends on your reviews service
    return [];
  }

  private async getUserQuestions(userId: string): Promise<any[]> {
    // Implementation depends on your Q&A service
    return [];
  }

  private async getUserTickets(userId: string): Promise<any[]> {
    // Implementation depends on your support service
    return [];
  }

  private async getUserHelpRequests(userId: string): Promise<any[]> {
    // Implementation depends on your help service
    return [];
  }

  // PERIODIC SYNC
  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.cacheOfflineData();
        this.processSyncQueue();
      }
    }, 5 * 60 * 1000);
  }

  // PUBLIC API
  isOfflineMode(): boolean {
    return !this.isOnline;
  }

  getSyncStatus(): {
    isOnline: boolean;
    syncInProgress: boolean;
    queueSize: number;
    lastSync: string | null;
  } {
    const offlineData = this.getOfflineData();
    
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueSize: this.syncQueue.length,
      lastSync: offlineData?.lastSync || null,
    };
  }

  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.cacheOfflineData();
      await this.processSyncQueue();
    }
  }

  clearOfflineData(): void {
    localStorage.removeItem(this.OFFLINE_DATA_KEY);
    localStorage.removeItem(this.SYNC_QUEUE_KEY);
    this.clearCache();
    this.syncQueue = [];
    loggingService.info('Offline data cleared');
  }

  getOfflineStats(): {
    cacheSize: number;
    queueSize: number;
    lastSync: string | null;
    version: string;
  } {
    const offlineData = this.getOfflineData();
    
    return {
      cacheSize: this.cache.size,
      queueSize: this.syncQueue.length,
      lastSync: offlineData?.lastSync || null,
      version: this.CACHE_VERSION,
    };
  }
}

export const offlineService = new OfflineService();
