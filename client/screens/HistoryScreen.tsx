import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
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
import { useScanHistory, ScanResult } from "@/hooks/useScanHistory";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { scans } = useScanHistory();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredScans = scans.filter((scan) =>
    scan.medicines?.some((med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || searchQuery === ""
  );

  const renderItem = ({ item }: { item: ScanResult }) => (
    <Pressable
      onPress={() => navigation.navigate("AnalysisResults", { scanId: item.id })}
      style={({ pressed }) => [
        styles.scanItem,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.cardBorder,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      ) : (
        <View
          style={[
            styles.thumbnailPlaceholder,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="file-text" size={24} color={theme.textSecondary} />
        </View>
      )}
      <View style={styles.scanInfo}>
        <ThemedText type="body" numberOfLines={1}>
          {item.medicinesCount} medicine{item.medicinesCount !== 1 ? "s" : ""} found
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {new Date(item.createdAt).toLocaleString()}
        </ThemedText>
        {item.medicines && item.medicines.length > 0 ? (
          <View style={styles.medicinesList}>
            {item.medicines.slice(0, 2).map((med, idx) => (
              <View
                key={idx}
                style={[styles.medicineBadge, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText type="small" numberOfLines={1}>
                  {med.name}
                </ThemedText>
              </View>
            ))}
            {item.medicines.length > 2 ? (
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                +{item.medicines.length - 2} more
              </ThemedText>
            ) : null}
          </View>
        ) : null}
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
            placeholder="Search by medicine name..."
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
        data={filteredScans}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        ListEmptyComponent={
          <Card elevation={1} style={styles.emptyCard}>
            <Feather name="clock" size={48} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              {searchQuery ? "No matching scans found" : "No scan history yet"}
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.emptySubtext, { color: theme.textSecondary }]}
            >
              {searchQuery
                ? "Try a different search term"
                : "Your scanned prescriptions will appear here"}
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  scanItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xs,
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  scanInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  medicinesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  medicineBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
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
