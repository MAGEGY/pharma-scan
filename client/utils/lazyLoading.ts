import React, { Suspense, lazy } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';

// Loading component for lazy loaded screens
interface LoadingFallbackProps {
  message?: string;
}

const LoadingFallback = ({ message = 'Loading...' }: LoadingFallbackProps) => {
  const { theme } = useTheme();
  
  return React.createElement(
    View,
    {
      style: [
        styles.container,
        { backgroundColor: theme.backgroundDefault }
      ]
    },
    React.createElement(ActivityIndicator, {
      size: 'large',
      color: theme.primary
    }),
    React.createElement(
      ThemedText,
      {
        style: [
          styles.message,
          { color: theme.textSecondary }
        ]
      },
      message
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 16,
  },
});

// Lazy loading wrapper with error boundary
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallbackMessage?: string
) {
  const LazyComponent = lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => (
    React.createElement(
      Suspense,
      { fallback: React.createElement(LoadingFallback, { message: fallbackMessage }) },
      React.createElement(LazyComponent, props)
    )
  );
}

// Lazy loaded screens for better bundle splitting
export const LazyCameraScreen = createLazyComponent(
  () => import('@/screens/CameraScreen'),
  'Loading Camera...'
);

export const LazyHistoryScreen = createLazyComponent(
  () => import('@/screens/HistoryScreen'),
  'Loading History...'
);

export const LazyLibraryScreen = createLazyComponent(
  () => import('@/screens/LibraryScreen'),
  'Loading Library...'
);

export const LazyProfileScreen = createLazyComponent(
  () => import('@/screens/ProfileScreen'),
  'Loading Profile...'
);

// Lazy loaded components
export const LazyPriceHistoryChart = createLazyComponent(
  () => import('@/components/PriceHistoryChart'),
  'Loading Chart...'
);

export const LazyTarshoubyPriceComparison = createLazyComponent(
  () => import('@/components/TarshoubyPriceComparison'),
  'Loading Price Comparison...'
);

export const LazyPriceUpdateModal = createLazyComponent(
  () => import('@/components/PriceUpdateModal'),
  'Loading Price Update...'
);

// Preload utilities
export class PreloadManager {
  private static preloadedComponents = new Set<string>();
  
  // Preload a component
  static async preloadComponent(importFunc: () => Promise<any>, name: string) {
    if (this.preloadedComponents.has(name)) {
      return;
    }
    
    try {
      await importFunc();
      this.preloadedComponents.add(name);
      console.log(`✅ Preloaded: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to preload: ${name}`, error);
    }
  }
  
  // Preload critical components
  static async preloadCriticalComponents() {
    const criticalComponents = [
      { importFunc: () => import('@/screens/HomeScreen'), name: 'HomeScreen' },
      { importFunc: () => import('@/components/Card'), name: 'Card' },
      { importFunc: () => import('@/components/Button'), name: 'Button' },
    ];
    
    const promises = criticalComponents.map(({ importFunc, name }) => 
      this.preloadComponent(importFunc, name)
    );
    
    await Promise.all(promises);
  }
  
  // Preload on-demand components
  static async preloadOnDemand(componentName: string) {
    const componentMap: Record<string, () => Promise<any>> = {
      'CameraScreen': () => import('@/screens/CameraScreen'),
      'HistoryScreen': () => import('@/screens/HistoryScreen'),
      'LibraryScreen': () => import('@/screens/LibraryScreen'),
      'ProfileScreen': () => import('@/screens/ProfileScreen'),
      'PriceHistoryChart': () => import('@/components/PriceHistoryChart'),
      'TarshoubyPriceComparison': () => import('@/components/TarshoubyPriceComparison'),
    };
    
    const importFunc = componentMap[componentName];
    if (importFunc) {
      await this.preloadComponent(importFunc, componentName);
    }
  }
}

// Hook for preloading components based on user behavior
export function usePreloadOnDemand() {
  const preloadComponent = async (componentName: string) => {
    await PreloadManager.preloadOnDemand(componentName);
  };
  
  // Preload components when user is likely to navigate
  const preloadForNavigation = async (targetScreen: string) => {
    // Preload the target screen
    await preloadComponent(targetScreen);
    
    // Preload related components
    const relatedComponents: Record<string, string[]> = {
      'CameraScreen': ['PriceUpdateModal'],
      'HistoryScreen': ['PriceHistoryChart'],
      'LibraryScreen': ['TarshoubyPriceComparison'],
      'ProfileScreen': [],
    };
    
    const related = relatedComponents[targetScreen] || [];
    await Promise.all(related.map(comp => preloadComponent(comp)));
  };
  
  return {
    preloadComponent,
    preloadForNavigation,
  };
}

// Bundle analyzer hook
export function useBundleAnalyzer() {
  const [bundleInfo, setBundleInfo] = React.useState({
    size: 0,
    chunks: [],
    loadTimes: {},
  });
  
  // Analyze bundle performance
  const analyzePerformance = React.useCallback(() => {
    if (__DEV__) {
      // Development mode - use React DevTools Profiler
      console.log('🔍 Bundle Analysis (Development Mode):');
      console.log('  • Use React DevTools Profiler to analyze component performance');
      console.log('  • Check Network tab for bundle sizes');
      console.log('  • Use "npm run analyze:bundle" for detailed analysis');
    } else {
      // Production mode - use Performance API
      if (typeof performance !== 'undefined') {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        
        setBundleInfo(prev => ({
          ...prev,
          loadTimes: {
            ...prev.loadTimes,
            app: loadTime,
          },
        }));
        
        console.log(`🚀 App Load Time: ${loadTime.toFixed(2)}ms`);
      }
    }
  }, []);
  
  return {
    bundleInfo,
    analyzePerformance,
  };
}

// Dynamic import utility with retry logic
export async function dynamicImportWithRetry<T>(
  importFunc: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await importFunc();
    } catch (error) {
      lastError = error as Error;
      
      if (i < retries - 1) {
        console.warn(`Import failed, retrying in ${delay}ms... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}

// Resource preloading utilities
export class ResourcePreloader {
  private static preloadedResources = new Map<string, string>();
  
  // Preload images
  static async preloadImages(imageUrls: string[]) {
    const promises = imageUrls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          this.preloadedResources.set(url, URL.createObjectURL(blob));
        }
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
      }
    });
    
    await Promise.all(promises);
  }
  
  // Get preloaded resource
  static getResource(url: string): string | undefined {
    return this.preloadedResources.get(url);
  }
  
  // Clear preloaded resources
  static clearResources() {
    this.preloadedResources.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.preloadedResources.clear();
  }
}

export default {
  createLazyComponent,
  LazyCameraScreen,
  LazyHistoryScreen,
  LazyLibraryScreen,
  LazyProfileScreen,
  LazyPriceHistoryChart,
  LazyTarshoubyPriceComparison,
  LazyPriceUpdateModal,
  PreloadManager,
  usePreloadOnDemand,
  useBundleAnalyzer,
  dynamicImportWithRetry,
  ResourcePreloader,
};
