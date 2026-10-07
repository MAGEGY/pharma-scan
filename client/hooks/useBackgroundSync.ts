import { useEffect, useState, useCallback } from 'react';
import { BackgroundSyncService, OfflineDataManager, SyncResult } from '../services/backgroundSync';

// Hook for background sync functionality
export function useBackgroundSync() {
  const [syncService] = useState(() => BackgroundSyncService.getInstance());
  const [offlineManager] = useState(() => OfflineDataManager.getInstance());
  const [queueStatus, setQueueStatus] = useState(syncService.getQueueStatus());
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Update queue status when sync events occur
  useEffect(() => {
    const updateStatus = () => setQueueStatus(syncService.getQueueStatus());
    
    syncService.on('itemAdded', updateStatus);
    syncService.on('itemRemoved', updateStatus);
    syncService.on('itemSynced', updateStatus);
    syncService.on('itemFailed', updateStatus);
    syncService.on('queueProcessed', (result: SyncResult) => {
      setLastSyncResult(result);
      updateStatus();
    });
    
    syncService.on('online', () => setIsOnline(true));
    syncService.on('offline', () => setIsOnline(false));

    return () => {
      syncService.off('itemAdded', updateStatus);
      syncService.off('itemRemoved', updateStatus);
      syncService.off('itemSynced', updateStatus);
      syncService.off('itemFailed', updateStatus);
      syncService.off('queueProcessed', updateStatus);
      syncService.off('online', () => setIsOnline(true));
      syncService.off('offline', () => setIsOnline(false));
    };
  }, [syncService]);

  // Force sync
  const forceSync = useCallback(async () => {
    try {
      const result = await syncService.forceSync();
      setLastSyncResult(result);
      return result;
    } catch (error) {
      console.error('Force sync failed:', error);
      throw error;
    }
  }, [syncService]);

  // Add item to sync queue
  const addToQueue = useCallback((type: 'create' | 'update' | 'delete', endpoint: string, data: any) => {
    return syncService.addToQueue(type, endpoint, data);
  }, [syncService]);

  // Clear queue
  const clearQueue = useCallback(() => {
    syncService.clearQueue();
    setLastSyncResult(null);
  }, [syncService]);

  return {
    queueStatus,
    isOnline,
    lastSyncResult,
    forceSync,
    addToQueue,
    clearQueue,
    syncService,
  };
}

// Hook for offline data management
export function useOfflineData() {
  const [offlineManager] = useState(() => OfflineDataManager.getInstance());
  const [stats, setStats] = useState(offlineManager.getStats());

  // Get data
  const getData = useCallback((key: string) => {
    return offlineManager.get(key);
  }, [offlineManager]);

  // Set data
  const setData = useCallback((key: string, data: any, ttlMinutes?: number) => {
    offlineManager.set(key, data, ttlMinutes);
    setStats(offlineManager.getStats());
  }, [offlineManager]);

  // Remove data
  const removeData = useCallback((key: string) => {
    offlineManager.remove(key);
    setStats(offlineManager.getStats());
  }, [offlineManager]);

  // Clear all data
  const clearData = useCallback(() => {
    offlineManager.clear();
    setStats(offlineManager.getStats());
  }, [offlineManager]);

  return {
    stats,
    getData,
    setData,
    removeData,
    clearData,
    offlineManager,
  };
}

// Hook for API calls with offline support
export function useOfflineApi() {
  const { isOnline, addToQueue } = useBackgroundSync();
  const { getData, setData } = useOfflineData();

  // Make API call with offline fallback
  const apiCall = useCallback(async (
    endpoint: string,
    options: RequestInit = {},
    cacheKey?: string,
    cacheTtlMinutes?: number
  ) => {
    // Try to get cached data first if offline
    if (!isOnline && cacheKey) {
      const cachedData = getData(cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          isOffline: true,
        };
      }
    }

    if (!isOnline) {
      throw new Error('No network connection and no cached data available');
    }

    try {
      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful responses
      if (cacheKey && response.ok) {
        setData(cacheKey, data, cacheTtlMinutes);
      }

      return {
        data,
        fromCache: false,
        isOffline: false,
      };
    } catch (error) {
      // If online request fails, try to get cached data
      if (cacheKey) {
        const cachedData = getData(cacheKey);
        if (cachedData) {
          return {
            data: cachedData,
            fromCache: true,
            isOffline: true,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }
      
      throw error;
    }
  }, [isOnline, getData, setData]);

  // Queue API call for when offline
  const queueApiCall = useCallback((
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any
  ) => {
    return addToQueue(type, endpoint, data);
  }, [addToQueue]);

  return {
    apiCall,
    queueApiCall,
    isOnline,
  };
}

// Hook for sync status indicator
export function useSyncStatus() {
  const { queueStatus, isOnline, lastSyncResult } = useBackgroundSync();

  const getStatusColor = useCallback(() => {
    if (!isOnline) return '#FF6B6B'; // Red
    if (queueStatus.pendingItems > 0) return '#FFA500'; // Orange
    if (queueStatus.retryingItems > 0) return '#FFD700'; // Yellow
    return '#51CF66'; // Green
  }, [queueStatus, isOnline]);

  const getStatusText = useCallback(() => {
    if (!isOnline) return 'Offline';
    if (queueStatus.retryingItems > 0) return `Retrying (${queueStatus.retryingItems})`;
    if (queueStatus.pendingItems > 0) return `Pending (${queueStatus.pendingItems})`;
    return 'Synced';
  }, [queueStatus]);

  const getLastSyncText = useCallback(() => {
    if (!lastSyncResult) return 'Never synced';
    
    const { processed, failed, duration } = lastSyncResult;
    const time = new Date(Date.now() - duration).toLocaleTimeString();
    
    if (failed === 0) {
      return `Last sync: ${time} (${processed} items)`;
    } else {
      return `Last sync: ${time} (${processed} success, ${failed} failed)`;
    }
  }, [lastSyncResult]);

  return {
    queueStatus,
    isOnline,
    lastSyncResult,
    statusColor: getStatusColor(),
    statusText: getStatusText(),
    lastSyncText: getLastSyncText(),
  };
}
