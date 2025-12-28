import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
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

interface ScanHistoryContextType {
  scans: ScanResult[];
  stats: ScanStats;
  isLoading: boolean;
  addScan: (scan: Omit<ScanResult, "id" | "createdAt">) => Promise<string>;
  getScan: (id: string) => ScanResult | undefined;
  deleteScan: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const ScanHistoryContext = createContext<ScanHistoryContextType | null>(null);

export function ScanHistoryProvider({ children }: { children: ReactNode }) {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const saveHistory = useCallback(async (newScans: ScanResult[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newScans));
    } catch (error) {
      console.error("Error saving scan history:", error);
    }
  }, []);

  const addScan = useCallback(
    async (scanData: Omit<ScanResult, "id" | "createdAt">): Promise<string> => {
      const id = Date.now().toString();
      const newScan: ScanResult = {
        ...scanData,
        id,
        createdAt: new Date().toISOString(),
      };

      const updatedScans = await new Promise<ScanResult[]>((resolve) => {
        setScans((prevScans) => {
          const updated = [newScan, ...prevScans];
          resolve(updated);
          return updated;
        });
      });

      await saveHistory(updatedScans);
      return id;
    },
    [saveHistory]
  );

  const getScan = useCallback(
    (id: string): ScanResult | undefined => {
      return scans.find((scan) => scan.id === id);
    },
    [scans]
  );

  const deleteScan = useCallback(
    async (id: string) => {
      const updatedScans = await new Promise<ScanResult[]>((resolve) => {
        setScans((prevScans) => {
          const updated = prevScans.filter((scan) => scan.id !== id);
          resolve(updated);
          return updated;
        });
      });

      await saveHistory(updatedScans);
    },
    [saveHistory]
  );

  const clearHistory = useCallback(async () => {
    setScans([]);
    await saveHistory([]);
  }, [saveHistory]);

  const refreshHistory = useCallback(async () => {
    setIsLoading(true);
    await loadHistory();
  }, [loadHistory]);

  const stats: ScanStats = {
    totalScans: scans.length,
    medicinesFound: scans.reduce((acc, scan) => acc + scan.medicinesCount, 0),
  };

  return (
    <ScanHistoryContext.Provider
      value={{
        scans,
        stats,
        isLoading,
        addScan,
        getScan,
        deleteScan,
        clearHistory,
        refreshHistory,
      }}
    >
      {children}
    </ScanHistoryContext.Provider>
  );
}

export function useScanHistoryContext(): ScanHistoryContextType {
  const context = useContext(ScanHistoryContext);
  if (!context) {
    throw new Error(
      "useScanHistoryContext must be used within a ScanHistoryProvider"
    );
  }
  return context;
}
