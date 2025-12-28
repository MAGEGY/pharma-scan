import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@medscan_history";

export interface Medicine {
  name: string;
  nameArabic?: string;
  confidence: number;
  activeIngredient?: string;
}

export interface Recommendation {
  dosing?: string;
  interactions?: string[];
  contraindications?: string[];
  recommendations?: string[];
}

export interface ScanResult {
  id: string;
  imageUri?: string;
  medicines: Medicine[];
  medicinesCount: number;
  recommendations?: Recommendation[];
  createdAt: string;
}

interface ScanStats {
  totalScans: number;
  medicinesFound: number;
}

interface UseScanHistoryResult {
  scans: ScanResult[];
  stats: ScanStats;
  isLoading: boolean;
  addScan: (scan: Omit<ScanResult, "id" | "createdAt">) => Promise<string>;
  getScan: (id: string) => ScanResult | undefined;
  deleteScan: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export function useScanHistory(): UseScanHistoryResult {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setScans(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading scan history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHistory = async (newScans: ScanResult[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newScans));
      setScans(newScans);
    } catch (error) {
      console.error("Error saving scan history:", error);
    }
  };

  const addScan = useCallback(
    async (scanData: Omit<ScanResult, "id" | "createdAt">): Promise<string> => {
      const id = Date.now().toString();
      const newScan: ScanResult = {
        ...scanData,
        id,
        createdAt: new Date().toISOString(),
      };
      const newScans = [newScan, ...scans];
      await saveHistory(newScans);
      return id;
    },
    [scans]
  );

  const getScan = useCallback(
    (id: string): ScanResult | undefined => {
      return scans.find((scan) => scan.id === id);
    },
    [scans]
  );

  const deleteScan = useCallback(
    async (id: string) => {
      const newScans = scans.filter((scan) => scan.id !== id);
      await saveHistory(newScans);
    },
    [scans]
  );

  const clearHistory = useCallback(async () => {
    await saveHistory([]);
  }, []);

  const stats: ScanStats = {
    totalScans: scans.length,
    medicinesFound: scans.reduce((acc, scan) => acc + scan.medicinesCount, 0),
  };

  return {
    scans,
    stats,
    isLoading,
    addScan,
    getScan,
    deleteScan,
    clearHistory,
  };
}
