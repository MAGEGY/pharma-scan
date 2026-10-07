import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeInUp,
  SlideInRight,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { SimpleButton } from "@/components/modern/SimpleButton";
import { LoadingSpinner } from "@/components/modern/LoadingSpinner";
import { useTheme } from "@/hooks/useTheme";
import { ModernSpacing, ModernBorderRadius } from "@/constants/modernTheme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useScanHistory } from "@/hooks/useScanHistory";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ModernHomeScreenFixed() {
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { scans, stats, isLoading, refresh } = useScanHistory();
  const [refreshing, setRefreshing] = useState(false);

  const recentScans = scans.slice(0, 3);

  // Animation values
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);
  const scanCardScale = useSharedValue(1);
  const statsTranslateY = useSharedValue(0);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const scanCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanCardScale.value }],
  }));

  const statsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: statsTranslateY.value }],
  }));

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    if (refresh) {
      await refresh();
    }
    setRefreshing(false);
  };

  // Animate elements on mount
  useEffect(() => {
    scanCardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    statsTranslateY.value = withTiming(0, { duration: 600 });
  }, []);

  const handleScanPress = () => {
    scanCardScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    setTimeout(() => {
      scanCardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      navigation.navigate("Camera");
    }, 150);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: tabBarHeight + ModernSpacing["4xl"] },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
      onScroll={(event) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
        headerOpacity.value = interpolate(
          scrollY.value,
          [0, 100],
          [1, 0.8]
        );
      }
      scrollEventThrottle={16}
    >
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.greetingContainer}>
          <ThemedText type="h4" style={styles.greeting}>
            {getGreeting()}
          </ThemedText>
          <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
            How can we help you today?
          </ThemedText>
        </View>
        
        <Pressable style={styles.profileButton}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Feather name="user" size={20} color="#FFFFFF" />
          </View>
        </Pressable>
      </Animated.View>

      {/* Scan Card */}
      <Animated.View entering={FadeInUp.duration(600).delay(200)}>
        <Pressable onPress={handleScanPress}>
          <Animated.View
            style={[
              styles.scanCard,
              { backgroundColor: theme.primary },
              scanCardStyle,
            ]}
          >
            <View style={styles.scanCardContent}>
              <View style={styles.scanIconContainer}>
                <Feather name="camera" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.scanTextContainer}>
                <ThemedText type="h4" style={[styles.scanTitle, { color: "#FFFFFF" }]}>
                  Scan Prescription
                </ThemedText>
                <ThemedText type="small" style={[styles.scanSubtitle, { color: "rgba(255,255,255,0.8)" }]}>
                  AI-powered drug identification
                </ThemedText>
              </View>
            </View>
            <View style={styles.scanArrow}>
              <Feather name="arrow-right" size={24} color="#FFFFFF" />
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View entering={SlideInRight.duration(500).delay(300)}>
        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${theme.success}20` }]}>
              <Feather name="search" size={20} color={theme.success} />
            </View>
            <ThemedText type="small" style={styles.quickActionText}>
              Search Drugs
            </ThemedText>
          </Pressable>
          
          <Pressable style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${theme.warning}20` }]}>
              <Feather name="bell" size={20} color={theme.warning} />
            </View>
            <ThemedText type="small" style={styles.quickActionText}>
              Price Alerts
            </ThemedText>
          </Pressable>
          
          <Pressable style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${theme.secondary}20` }]}>
              <Feather name="shield" size={20} color={theme.secondary} />
            </View>
            <ThemedText type="small" style={styles.quickActionText}>
              Check Interactions
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>

      {/* Stats Cards */}
      <Animated.View entering={FadeInUp.duration(600).delay(400)} style={statsStyle}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.primary}20` }]}>
                <Feather name="file-text" size={20} color={theme.primary} />
              </View>
              <View style={styles.statInfo}>
                <ThemedText type="h3" style={{ color: theme.primary }}>
                  {stats.totalScans}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Total Scans
                </ThemedText>
              </View>
            </View>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: `${theme.success}20` }]}>
                <Feather name="package" size={20} color={theme.success} />
              </View>
              <View style={styles.statInfo}>
                <ThemedText type="h3" style={{ color: theme.success }}>
                  {stats.medicinesFound}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Medicines Found
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Recent Scans */}
      <View style={styles.sectionHeader}>
        <ThemedText type="h4">Recent Scans</ThemedText>
        {scans.length > 0 && (
          <Pressable onPress={() => navigation.navigate("Main" as any)}>
            <ThemedText type="link">See All</ThemedText>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
        </View>
      ) : recentScans.length === 0 ? (
        <Animated.View entering={FadeIn.duration(600).delay(500)}>
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.emptyContent}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}10` }]}>
                <Feather name="file-text" size={48} color={theme.primary} />
              </View>
              <ThemedText type="h4" style={styles.emptyTitle}>
                No prescriptions scanned yet
              </ThemedText>
              <ThemedText type="small" style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Tap the camera button to scan your first prescription and get instant drug information
              </ThemedText>
              <SimpleButton
                onPress={handleScanPress}
                variant="outline"
                size="md"
                style={styles.emptyButton}
              >
                Start Scanning
              </SimpleButton>
            </View>
          </View>
        </Animated.View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
        >
          {recentScans.map((scan, index) => (
            <Animated.View
              key={scan.id}
              entering={SlideInRight.duration(400).delay(600 + index * 100)}
            >
              <Pressable
                onPress={() => navigation.navigate("AnalysisResults", { scanId: scan.id })}
              >
                <View
                  style={[
                    styles.recentCard,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                      borderWidth: 1,
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
                    <ThemedText type="small" style={styles.recentTitle}>
                      {scan.medicinesCount} medicine{scan.medicinesCount !== 1 ? "s" : ""} found
                    </ThemedText>
                    <ThemedText type="small" style={[styles.recentDate, { color: theme.textSecondary }]}>
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
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
    padding: ModernSpacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: ModernSpacing.xl,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    marginBottom: ModernSpacing.xs,
  },
  subtitle: {
    marginBottom: ModernSpacing.sm,
  },
  profileButton: {
    padding: ModernSpacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scanCard: {
    marginBottom: ModernSpacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: ModernSpacing.xl,
    borderRadius: ModernBorderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  scanCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: ModernSpacing.lg,
  },
  scanIconContainer: {
    width: 56,
    height: 56,
    borderRadius: ModernBorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanTextContainer: {
    gap: ModernSpacing.xs,
  },
  scanTitle: {
    color: "#FFFFFF",
  },
  scanSubtitle: {
    color: "rgba(255,255,255,0.8)",
  },
  scanArrow: {
    marginLeft: ModernSpacing.md,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: ModernSpacing.xl,
    gap: ModernSpacing.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    padding: ModernSpacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: ModernBorderRadius.lg,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ModernSpacing.sm,
  },
  quickActionText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    gap: ModernSpacing.md,
    marginBottom: ModernSpacing.xl,
  },
  statCard: {
    flex: 1,
    padding: ModernSpacing.lg,
    borderRadius: ModernBorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: ModernSpacing.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ModernSpacing.lg,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: ModernSpacing["3xl"],
  },
  emptyCard: {
    alignItems: "center",
    padding: ModernSpacing.xl,
    borderRadius: ModernBorderRadius.lg,
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ModernSpacing.lg,
  },
  emptyTitle: {
    marginBottom: ModernSpacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
    marginBottom: ModernSpacing.xl,
    paddingHorizontal: ModernSpacing.lg,
  },
  emptyButton: {
    minWidth: 150,
  },
  recentList: {
    gap: ModernSpacing.md,
  },
  recentCard: {
    width: 160,
    borderRadius: ModernBorderRadius.lg,
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
    padding: ModernSpacing.md,
  },
  recentTitle: {
    marginBottom: ModernSpacing.xs,
  },
  recentDate: {
    marginBottom: ModernSpacing.xs,
  },
});
