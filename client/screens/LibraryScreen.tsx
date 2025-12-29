import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Drug {
  id: string;
  name: string;
  nameArabic: string;
  activeIngredient: string;
  category: string;
  manufacturer: string;
  form: string;
  price: string;
  dosing: string;
  description?: string;
}

interface DrugsResponse {
  drugs: Drug[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function LibraryScreen() {
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  }, []);

  const { data, isLoading, error } = useQuery<DrugsResponse>({
    queryKey: ["/api/drugs", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      params.append("limit", "100");
      const response = await fetch(`/api/drugs?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch drugs");
      }
      return response.json();
    },
  });

  const drugs = data?.drugs || [];
  const total = data?.total || 0;

  const renderItem = ({ item }: { item: Drug }) => (
    <Pressable
      onPress={() => navigation.navigate("DrugDetail", { drugId: item.id })}
      style={({ pressed }) => [
        styles.drugItem,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.cardBorder,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.drugInfo}>
        <View style={styles.drugHeader}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {item.name}
          </ThemedText>
          {item.nameArabic ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.nameArabic}
            </ThemedText>
          ) : null}
        </View>
        {item.activeIngredient ? (
          <ThemedText type="small" style={{ color: theme.primary }}>
            {item.activeIngredient}
          </ThemedText>
        ) : null}
        <View style={styles.drugMeta}>
          {item.category ? (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText type="small">{item.category}</ThemedText>
            </View>
          ) : null}
          {item.price ? (
            <ThemedText type="small" style={{ color: theme.success }}>
              {item.price} EGP
            </ThemedText>
          ) : null}
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search 16,710 medicines..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery ? (
            <Pressable onPress={() => { setSearchQuery(""); setDebouncedSearch(""); }}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.resultCount}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {isLoading ? "Searching..." : `${total.toLocaleString()} medicines found`}
          </ThemedText>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            Loading medicines...
          </ThemedText>
        </View>
      ) : error ? (
        <Card elevation={1} style={styles.emptyCard}>
          <Feather name="alert-circle" size={48} color={theme.danger} />
          <ThemedText
            type="body"
            style={[styles.emptyText, { color: theme.danger }]}
          >
            Failed to load medicines
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.emptySubtext, { color: theme.textSecondary }]}
          >
            Please check your connection and try again
          </ThemedText>
        </Card>
      ) : (
        <FlatList
          data={drugs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl },
          ]}
          ListEmptyComponent={
            <Card elevation={1} style={styles.emptyCard}>
              <Feather name="search" size={48} color={theme.textSecondary} />
              <ThemedText
                type="body"
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                No medicines found
              </ThemedText>
              <ThemedText
                type="small"
                style={[styles.emptySubtext, { color: theme.textSecondary }]}
              >
                Try a different search term
              </ThemedText>
            </Card>
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  resultCount: {
    marginTop: Spacing.sm,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  drugItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  drugInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  drugHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  drugMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    marginTop: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
