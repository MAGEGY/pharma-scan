// Background sync and offline data synchronization service

export interface SyncConfig {
  enableBackgroundSync: boolean;
  syncInterval: number; // in minutes
  retryAttempts: number;
  retryDelay: number; // in seconds
  maxQueueSize: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  attempts: number;
  lastError?: string;
}

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  duration: number;
}

export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private config: SyncConfig;
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = true;
  private syncTimer?: NodeJS.Timeout;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      enableBackgroundSync: true,
      syncInterval: 5, // 5 minutes
      retryAttempts: 3,
      retryDelay: 30, // 30 seconds
      maxQueueSize: 1000,
      ...config,
    };

    // Monitor network status
    this.setupNetworkMonitoring();
    
    // Load queue from storage
    this.loadQueueFromStorage();
    
    // Start background sync if enabled
    if (this.config.enableBackgroundSync) {
      this.startBackgroundSync();
    }
  }

  static getInstance(config?: Partial<SyncConfig>): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService(config);
    }
    return BackgroundSyncService.instance;
  }

  // Add item to sync queue
  addToQueue(type: 'create' | 'update' | 'delete', endpoint: string, data: any): string {
    const id = this.generateId();
    const item: SyncQueueItem = {
      id,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      attempts: 0,
    };

    // Add to queue (respect max size)
    if (this.syncQueue.length >= this.config.maxQueueSize) {
      this.syncQueue.shift(); // Remove oldest item
    }
    
    this.syncQueue.push(item);
    this.saveQueueToStorage();
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.processQueue();
    }
    
    this.emit('itemAdded', item);
    return id;
  }

  // Remove item from queue
  removeFromQueue(id: string): boolean {
    const index = this.syncQueue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.syncQueue.splice(index, 1);
      this.saveQueueToStorage();
      this.emit('itemRemoved', id);
      return true;
    }
    return false;
  }

  // Get queue status
  getQueueStatus() {
    return {
      size: this.syncQueue.length,
      maxSize: this.config.maxQueueSize,
      isOnline: this.isOnline,
      isBackgroundSyncEnabled: this.config.enableBackgroundSync,
      pendingItems: this.syncQueue.filter(item => item.attempts === 0).length,
      retryingItems: this.syncQueue.filter(item => item.attempts > 0).length,
    };
  }

  // Process the sync queue
  async processQueue(): Promise<SyncResult> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return {
        success: true,
        processed: 0,
        failed: 0,
        errors: [],
        duration: 0,
      };
    }

    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    // Process items in order
    const itemsToProcess = [...this.syncQueue];
    
    for (const item of itemsToProcess) {
      try {
        const success = await this.processItem(item);
        
        if (success) {
          this.removeFromQueue(item.id);
          result.processed++;
          this.emit('itemSynced', item);
        } else {
          result.failed++;
          if (item.attempts >= this.config.retryAttempts) {
            this.removeFromQueue(item.id);
            result.errors.push(`Max retries exceeded for ${item.endpoint}`);
            this.emit('itemFailed', item);
          }
        }
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(errorMessage);
        
        // Update item with error
        item.lastError = errorMessage;
        item.attempts++;
        
        this.emit('itemError', { item, error: errorMessage });
      }
    }

    result.duration = Date.now() - startTime;
    this.saveQueueToStorage();
    this.emit('queueProcessed', result);
    
    return result;
  }

  // Process individual queue item
  private async processItem(item: SyncQueueItem): Promise<boolean> {
    try {
      const response = await fetch(item.endpoint, {
        method: this.getMethodForType(item.type),
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if available
          ...(this.getAuthHeaders && this.getAuthHeaders()),
        },
        body: item.type !== 'delete' ? JSON.stringify(item.data) : undefined,
      });

      if (response.ok) {
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Retry logic
      if (item.attempts < this.config.retryAttempts) {
        item.attempts++;
        await this.delay(this.config.retryDelay * Math.pow(2, item.attempts - 1)); // Exponential backoff
        return false; // Will be retried
      }
      throw error;
    }
  }

  // Get HTTP method for sync type
  private getMethodForType(type: 'create' | 'update' | 'delete'): string {
    switch (type) {
      case 'create': 
        return 'POST';
      case 'update': 
        return 'PUT';
      case 'delete': 
        return 'DELETE';
      default: 
        return 'POST';
    }
  }

  // Setup network monitoring
  private setupNetworkMonitoring() {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      // Browser environment
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.emit('online');
        if (this.config.enableBackgroundSync) {
          this.processQueue();
        }
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.emit('offline');
      });

      this.isOnline = navigator.onLine;
    } else {
      // Node.js environment - assume online
      this.isOnline = true;
    }
  }

  // Start background sync
  private startBackgroundSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processQueue();
      }
    }, this.config.syncInterval * 60 * 1000); // Convert minutes to milliseconds
  }

  // Stop background sync
  stopBackgroundSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Storage helpers (implement based on your storage solution)
  private loadQueueFromStorage() {
    try {
      // This would load from AsyncStorage in React Native or localStorage in web
      const stored = localStorage.getItem('syncQueue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private saveQueueToStorage() {
    try {
      // This would save to AsyncStorage in React Native or localStorage in web
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Utility functions
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get auth headers (implement based on your auth system)
  private getAuthHeaders(): Record<string, string> {
    // This would get the auth token from your auth system
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Force sync now
  async forceSync(): Promise<SyncResult> {
    return this.processQueue();
  }

  // Clear queue
  clearQueue() {
    this.syncQueue = [];
    this.saveQueueToStorage();
    this.emit('queueCleared');
  }

  // Update configuration
  updateConfig(newConfig: Partial<SyncConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enableBackgroundSync && !this.syncTimer) {
      this.startBackgroundSync();
    } else if (!this.config.enableBackgroundSync && this.syncTimer) {
      this.stopBackgroundSync();
    }
  }

  // Destroy service
  destroy() {
    this.stopBackgroundSync();
    this.clearQueue();
    this.eventListeners.clear();
  }
}

// Offline data manager for caching data locally
export class OfflineDataManager {
  private static instance: OfflineDataManager;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  private constructor() {}

  static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager();
    }
    return OfflineDataManager.instance;
  }

  // Store data with TTL
  set(key: string, data: any, ttlMinutes: number = 60) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000, // Convert to milliseconds
    });
    
    // Also persist to storage
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000,
      }));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  // Get data (from memory or storage)
  get(key: string): any | null {
    // Try memory first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Try storage
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < parsed.ttl) {
          // Restore to memory cache
          this.cache.set(key, parsed);
          return parsed.data;
        } else {
          // Expired, remove from storage
          localStorage.removeItem(`offline_${key}`);
        }
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }

    return null;
  }

  // Remove data
  remove(key: string) {
    this.cache.delete(key);
    try {
      localStorage.removeItem(`offline_${key}`);
    } catch (error) {
      console.error('Failed to remove offline data:', error);
    }
  }

  // Clear all offline data
  clear() {
    this.cache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('offline_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp >= item.ttl) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    return {
      memorySize: this.cache.size,
      validCount,
      expiredCount,
    };
  }
}

export default BackgroundSyncService;
