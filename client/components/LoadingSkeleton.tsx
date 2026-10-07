import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: any;
  variant?: "rectangular" | "circular";
}

export function LoadingSkeleton({ 
  width = "100%", 
  height = 20, 
  style, 
  variant = "rectangular" 
}: LoadingSkeletonProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          backgroundColor: theme.backgroundSecondary,
          borderRadius: variant === "circular" ? (typeof height === "number" ? height / 2 : 20) : BorderRadius.sm,
        },
        style,
      ]}
    />
  );
}

interface DrugCardSkeletonProps {
  style?: any;
}

export function DrugCardSkeleton({ style }: DrugCardSkeletonProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.cardBorder,
        },
        style,
      ]}
    >
      <View style={styles.cardHeader}>
        <LoadingSkeleton width={60} height={60} variant="circular" />
        <View style={styles.cardHeaderText}>
          <LoadingSkeleton width="80%" height={16} />
          <LoadingSkeleton width="60%" height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <LoadingSkeleton width="100%" height={12} />
        <LoadingSkeleton width="90%" height={12} style={{ marginTop: 4 }} />
        <LoadingSkeleton width="70%" height={12} style={{ marginTop: 4 }} />
      </View>
      
      <View style={styles.cardFooter}>
        <LoadingSkeleton width={80} height={24} />
        <LoadingSkeleton width={60} height={24} />
      </View>
    </View>
  );
}

interface PriceHistorySkeletonProps {
  style?: any;
}

export function PriceHistorySkeleton({ style }: PriceHistorySkeletonProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.chartContainer,
        {
          backgroundColor: theme.backgroundSecondary,
        },
        style,
      ]}
    >
      <View style={styles.chartHeader}>
        <LoadingSkeleton width={120} height={20} />
        <LoadingSkeleton width={80} height={14} />
      </View>
      
      <View style={styles.chartArea}>
        <LoadingSkeleton width="100%" height={150} />
      </View>
      
      <View style={styles.chartFooter}>
        <LoadingSkeleton width={60} height={14} />
        <LoadingSkeleton width={60} height={14} />
        <LoadingSkeleton width={60} height={14} />
      </View>
    </View>
  );
}

interface ListSkeletonProps {
  items?: number;
  style?: any;
}

export function ListSkeleton({ items = 3, style }: ListSkeletonProps) {
  return (
    <View style={style}>
      {Array.from({ length: items }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <LoadingSkeleton width={40} height={40} variant="circular" />
          <View style={styles.listItemContent}>
            <LoadingSkeleton width="70%" height={16} />
            <LoadingSkeleton width="50%" height={12} style={{ marginTop: 4 }} />
          </View>
          <LoadingSkeleton width={60} height={20} />
        </View>
      ))}
    </View>
  );
}

interface SearchSkeletonProps {
  style?: any;
}

export function SearchSkeleton({ style }: SearchSkeletonProps) {
  return (
    <View style={[styles.searchContainer, style]}>
      <LoadingSkeleton height={48} style={styles.searchInput} />
      <View style={styles.searchResults}>
        <ListSkeleton items={3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginVertical: Spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardContent: {
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.md,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  chartArea: {
    marginBottom: Spacing.md,
  },
  chartFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    gap: Spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  searchContainer: {
    padding: Spacing.md,
  },
  searchInput: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  searchResults: {
    marginTop: Spacing.md,
  },
});
