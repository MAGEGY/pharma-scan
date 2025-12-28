import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useScanHistory } from "@/hooks/useScanHistory";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { scans, stats } = useScanHistory();

  const recentScans = scans.slice(0, 3);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: tabBarHeight + Spacing["4xl"] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => navigation.navigate("Camera")}
        style={({ pressed }) => [
          styles.scanCard,
          {
            backgroundColor: theme.primary,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <View style={styles.scanCardContent}>
          <View style={styles.scanIconContainer}>
            <Feather name="camera" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.scanTextContainer}>
            <ThemedText type="h4" style={styles.scanTitle}>
              Scan Prescription
            </ThemedText>
            <ThemedText type="small" style={styles.scanSubtitle}>
              Take a photo or select from gallery
            </ThemedText>
          </View>
        </View>
        <Feather name="arrow-right" size={24} color="#FFFFFF" />
      </Pressable>

      <View style={styles.statsContainer}>
        <Card elevation={1} style={styles.statCard}>
          <ThemedText type="h3" style={{ color: theme.primary }}>
            {stats.totalScans}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total Scans
          </ThemedText>
        </Card>
        <Card elevation={1} style={styles.statCard}>
          <ThemedText type="h3" style={{ color: theme.success }}>
            {stats.medicinesFound}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Medicines Found
          </ThemedText>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText type="h4">Recent Scans</ThemedText>
        {scans.length > 0 ? (
          <Pressable onPress={() => {}}>
            <ThemedText type="link">See All</ThemedText>
          </Pressable>
        ) : null}
      </View>

      {recentScans.length === 0 ? (
        <Card elevation={1} style={styles.emptyCard}>
          <Feather name="file-text" size={48} color={theme.textSecondary} />
          <ThemedText
            type="body"
            style={[styles.emptyText, { color: theme.textSecondary }]}
          >
            No prescriptions scanned yet
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.emptySubtext, { color: theme.textSecondary }]}
          >
            Tap the camera button to scan your first prescription
          </ThemedText>
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
        >
          {recentScans.map((scan) => (
            <Pressable
              key={scan.id}
              onPress={() => navigation.navigate("AnalysisResults", { scanId: scan.id })}
              style={({ pressed }) => [
                styles.recentCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.cardBorder,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              {scan.imageUri ? (
                <Image source={{ uri: scan.imageUri }} style={styles.recentImage} />
              ) : (
                <View style={[styles.recentImagePlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="file-text" size={24} color={theme.textSecondary} />
                </View>
              )}
              <View style={styles.recentInfo}>
                <ThemedText type="small" numberOfLines={1}>
                  {scan.medicinesCount} medicine{scan.medicinesCount !== 1 ? "s" : ""} found
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {new Date(scan.createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  scanCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  scanIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanTextContainer: {
    gap: Spacing.xs,
  },
  scanTitle: {
    color: "#FFFFFF",
  },
  scanSubtitle: {
    color: "rgba(255,255,255,0.8)",
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  recentList: {
    gap: Spacing.md,
  },
  recentCard: {
    width: 160,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  recentImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#E2E8F0",
  },
  recentImagePlaceholder: {
    width: "100%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: {
    padding: Spacing.md,
  },
});
