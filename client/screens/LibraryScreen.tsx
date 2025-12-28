import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { EGYPTIAN_DRUGS, Drug } from "@/data/egyptianDrugs";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = ["All", "Antibiotic", "Analgesic", "Antihypertensive", "Antidiabetic", "Antihistamine"];

export default function LibraryScreen() {
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredDrugs = EGYPTIAN_DRUGS.filter((drug) => {
    const matchesSearch =
      drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.nameArabic.includes(searchQuery) ||
      drug.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || drug.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.nameArabic}
          </ThemedText>
        </View>
        <ThemedText type="small" style={{ color: theme.primary }}>
          {item.activeIngredient}
        </ThemedText>
        <View style={styles.drugMeta}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <ThemedText type="small">{item.category}</ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.manufacturer}
          </ThemedText>
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
            placeholder="Search drugs (English or Arabic)..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedCategory(item)}
            style={[
              styles.categoryChip,
              {
                backgroundColor:
                  selectedCategory === item ? theme.primary : theme.backgroundDefault,
                borderColor: selectedCategory === item ? theme.primary : theme.border,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{
                color: selectedCategory === item ? "#FFFFFF" : theme.text,
              }}
            >
              {item}
            </ThemedText>
          </Pressable>
        )}
        style={styles.categoryContainer}
      />

      <FlatList
        data={filteredDrugs}
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
              No drugs found
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.emptySubtext, { color: theme.textSecondary }]}
            >
              Try adjusting your search or filter
            </ThemedText>
          </Card>
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
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
  categoryContainer: {
    maxHeight: 40,
  },
  categoryList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
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
