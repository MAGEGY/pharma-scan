import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react';
import { EgyptianDrug } from '../../shared/schema';

// Offline storage keys
const STORAGE_KEYS = {
  DRUGS: '@pharma_scan_drugs',
  SEARCH_INDEX: '@pharma_scan_search_index',
  CATEGORIES: '@pharma_scan_categories',
  LAST_SYNC: '@pharma_scan_last_sync',
  USER_PREFERENCES: '@pharma_scan_preferences',
  OFFLINE_MODE: '@pharma_scan_offline_mode',
};

// Search index for fast offline lookup
interface SearchIndex {
  [key: string]: number[]; // drug name -> array of drug IDs
}

// Offline data manager
export class OfflineDataManager {
  private static instance: OfflineDataManager;
  private drugs: EgyptianDrug[] = [];
  private searchIndex: SearchIndex = {};
  private categories: string[] = [];
  private lastSyncTime: number | null = null;

  static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager();
    }
    return OfflineDataManager.instance;
  }

  // Initialize offline data
  async initialize(): Promise<void> {
    try {
      await this.loadOfflineData();
      await this.buildSearchIndex();
      console.log('✅ Offline data manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize offline data:', error);
      throw error;
    }
  }

  // Load data from local storage
  private async loadOfflineData(): Promise<void> {
    try {
      const drugsData = await AsyncStorage.getItem(STORAGE_KEYS.DRUGS);
      if (drugsData) {
        this.drugs = JSON.parse(drugsData);
      }

      const indexData = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_INDEX);
      if (indexData) {
        this.searchIndex = JSON.parse(indexData);
      }

      const categoriesData = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (categoriesData) {
        this.categories = JSON.parse(categoriesData);
      }

      const lastSyncData = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (lastSyncData) {
        this.lastSyncTime = parseInt(lastSyncData, 10);
      }

      console.log(`📦 Loaded ${this.drugs.length} drugs offline`);
    } catch (error) {
      console.error('Error loading offline data:', error);
      throw error;
    }
  }

  // Save data to local storage
  private async saveOfflineData(): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.DRUGS, JSON.stringify(this.drugs)],
        [STORAGE_KEYS.SEARCH_INDEX, JSON.stringify(this.searchIndex)],
        [STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories)],
        [STORAGE_KEYS.LAST_SYNC, this.lastSyncTime?.toString() || ''],
      ]);
    } catch (error) {
      console.error('Error saving offline data:', error);
      throw error;
    }
  }

  // Build search index for fast lookup
  private async buildSearchIndex(): Promise<void> {
    this.searchIndex = {};
    
    this.drugs.forEach((drug, index) => {
      // Index by name (English and Arabic)
      if (drug.name) {
        const nameWords = drug.name.toLowerCase().split(' ');
        nameWords.forEach(word => {
          if (word.length > 2) {
            if (!this.searchIndex[word]) {
              this.searchIndex[word] = [];
            }
            this.searchIndex[word].push(index);
          }
        });
      }

      // Index by Arabic name
      if (drug.nameArabic) {
        const arabicWords = drug.nameArabic.toLowerCase().split(' ');
        arabicWords.forEach(word => {
          if (word.length > 1) {
            if (!this.searchIndex[word]) {
              this.searchIndex[word] = [];
            }
            this.searchIndex[word].push(index);
          }
        });
      }

      // Index by active ingredient
      if (drug.activeIngredient) {
        const ingredientWords = drug.activeIngredient.toLowerCase().split(' ');
        ingredientWords.forEach(word => {
          if (word.length > 2) {
            if (!this.searchIndex[word]) {
              this.searchIndex[word] = [];
            }
            this.searchIndex[word].push(index);
          }
        });
      }

      // Index by category
      if (drug.category) {
        const category = drug.category.toLowerCase();
        if (!this.searchIndex[category]) {
          this.searchIndex[category] = [];
        }
        this.searchIndex[category].push(index);
      }

      // Index by manufacturer
      if (drug.manufacturer) {
        const manufacturerWords = drug.manufacturer.toLowerCase().split(' ');
        manufacturerWords.forEach(word => {
          if (word.length > 2) {
            if (!this.searchIndex[word]) {
              this.searchIndex[word] = [];
            }
            this.searchIndex[word].push(index);
          }
        });
      }
    });

    console.log(`🔍 Built search index with ${Object.keys(this.searchIndex).length} terms`);
  }

  // Sync data from server
  async syncFromServer(drugs: EgyptianDrug[]): Promise<void> {
    try {
      console.log(`🔄 Syncing ${drugs.length} drugs to offline storage...`);
      
      this.drugs = drugs;
      this.categories = [...new Set(drugs.map(drug => drug.category).filter((cat): cat is string => Boolean(cat)))];
      this.lastSyncTime = Date.now();
      
      await this.buildSearchIndex();
      await this.saveOfflineData();
      
      console.log('✅ Offline data sync completed');
    } catch (error) {
      console.error('❌ Failed to sync offline data:', error);
      throw error;
    }
  }

  // Search drugs offline
  searchDrugs(query: string, category?: string): EgyptianDrug[] {
    if (!query && !category) {
      return this.drugs.slice(0, 50); // Return first 50 if no query
    }

    const queryLower = query.toLowerCase().trim();
    const categoryLower = category?.toLowerCase();
    let matchingIndices: number[] = [];

    // Search by query
    if (queryLower) {
      const queryWords = queryLower.split(' ').filter(word => word.length > 1);
      const wordMatches: number[][] = [];

      queryWords.forEach(word => {
        const matches = this.searchIndex[word] || [];
        wordMatches.push(matches);
      });

      // Find drugs that match all words (intersection)
      if (wordMatches.length > 0) {
        matchingIndices = wordMatches.reduce((intersection, current) => {
          return intersection.filter(id => current.includes(id));
        });
      }
    }

    // Filter by category if specified
    if (categoryLower) {
      const categoryMatches = this.searchIndex[categoryLower] || [];
      if (matchingIndices.length > 0) {
        matchingIndices = matchingIndices.filter(id => categoryMatches.includes(id));
      } else {
        matchingIndices = categoryMatches;
      }
    }

    // Convert indices to drug objects
    const results = matchingIndices.map(index => this.drugs[index]);

    // Sort by relevance (exact matches first)
    return results.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      
      const aExactMatch = aName === queryLower;
      const bExactMatch = bName === queryLower;
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      return aName.localeCompare(bName);
    });
  }

  // Get drug by ID
  getDrugById(id: number): EgyptianDrug | undefined {
    return this.drugs.find(drug => drug.id === id);
  }

  // Get drug suggestions for autocomplete
  getSuggestions(query: string, limit: number = 10): string[] {
    const queryLower = query.toLowerCase();
    const suggestions = new Set<string>();

    // Find matching drug names
    this.drugs.forEach(drug => {
      if (drug.name && drug.name.toLowerCase().includes(queryLower)) {
        suggestions.add(drug.name);
      }
      if (drug.nameArabic && drug.nameArabic.toLowerCase().includes(queryLower)) {
        suggestions.add(drug.nameArabic);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  // Get all categories
  getCategories(): string[] {
    return this.categories;
  }

  // Get offline statistics
  getOfflineStats() {
    return {
      totalDrugs: this.drugs.length,
      totalSearchTerms: Object.keys(this.searchIndex).length,
      totalCategories: this.categories.length,
      lastSyncTime: this.lastSyncTime,
      storageSize: this.estimateStorageSize(),
    };
  }

  // Estimate storage size
  private estimateStorageSize(): string {
    const drugsSize = JSON.stringify(this.drugs).length;
    const indexSize = JSON.stringify(this.searchIndex).length;
    const totalSize = drugsSize + indexSize;
    
    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Clear offline data
  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.DRUGS,
        STORAGE_KEYS.SEARCH_INDEX,
        STORAGE_KEYS.CATEGORIES,
        STORAGE_KEYS.LAST_SYNC,
      ]);
      
      this.drugs = [];
      this.searchIndex = {};
      this.categories = [];
      this.lastSyncTime = null;
      
      console.log('🗑️ Offline data cleared');
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  }

  // Check if offline data is available
  isOfflineDataAvailable(): boolean {
    return this.drugs.length > 0;
  }

  // Check if data needs sync
  needsSync(maxAgeHours: number = 24): boolean {
    if (!this.lastSyncTime) return true;
    
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    return Date.now() - this.lastSyncTime > maxAge;
  }

  // Export offline data for backup
  async exportOfflineData(): Promise<string> {
    const exportData = {
      drugs: this.drugs,
      searchIndex: this.searchIndex,
      categories: this.categories,
      lastSyncTime: this.lastSyncTime,
      exportTime: Date.now(),
    };
    
    return JSON.stringify(exportData);
  }

  // Import offline data from backup
  async importOfflineData(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);
      
      this.drugs = importData.drugs || [];
      this.searchIndex = importData.searchIndex || {};
      this.categories = importData.categories || [];
      this.lastSyncTime = importData.lastSyncTime || Date.now();
      
      await this.saveOfflineData();
      console.log('📥 Offline data imported successfully');
    } catch (error) {
      console.error('Error importing offline data:', error);
      throw error;
    }
  }
}

// React hook for offline data
export function useOfflineData() {
  const [offlineManager] = useState(() => OfflineDataManager.getInstance());
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);
  const [offlineStats, setOfflineStats] = useState(offlineManager.getOfflineStats());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeOfflineData = async () => {
      try {
        await offlineManager.initialize();
        setIsOfflineAvailable(offlineManager.isOfflineDataAvailable());
        setOfflineStats(offlineManager.getOfflineStats());
      } catch (error) {
        console.error('Failed to initialize offline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeOfflineData();
  }, [offlineManager]);

  const searchDrugs = useCallback((query: string, category?: string) => {
    return offlineManager.searchDrugs(query, category);
  }, [offlineManager]);

  const getSuggestions = useCallback((query: string, limit?: number) => {
    return offlineManager.getSuggestions(query, limit);
  }, [offlineManager]);

  const syncFromServer = useCallback(async (drugs: EgyptianDrug[]) => {
    await offlineManager.syncFromServer(drugs);
    setOfflineStats(offlineManager.getOfflineStats());
  }, [offlineManager]);

  return {
    isOfflineAvailable,
    offlineStats,
    isLoading,
    searchDrugs,
    getSuggestions,
    syncFromServer,
    getDrugById: offlineManager.getDrugById.bind(offlineManager),
    getCategories: offlineManager.getCategories.bind(offlineManager),
    needsSync: offlineManager.needsSync.bind(offlineManager),
    clearOfflineData: offlineManager.clearOfflineData.bind(offlineManager),
  };
}

export default OfflineDataManager;
