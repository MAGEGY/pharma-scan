import React from "react";
import { View, StyleSheet, Pressable, Alert, Image } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useScanHistory } from "@/hooks/useScanHistory";

interface SettingsRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, label, value, onPress, danger }: SettingsRowProps) {
  const { theme } = useTheme();
  const textColor = danger ? theme.danger : theme.text;
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        {
          backgroundColor: pressed ? theme.backgroundSecondary : "transparent",
        },
      ]}
    >
      <View style={styles.settingsRowLeft}>
        <Feather name={icon} size={20} color={textColor} />
        <ThemedText type="body" style={{ color: textColor }}>{label}</ThemedText>
      </View>
      <View style={styles.settingsRowRight}>
        {value ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {value}
          </ThemedText>
        ) : null}
        {onPress ? (
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { clearHistory } = useScanHistory();

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete all scan history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => clearHistory(),
        },
      ]
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: tabBarHeight + Spacing.xl },
      ]}
    >
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Feather name="user" size={40} color="#FFFFFF" />
        </View>
        <ThemedText type="h4">MedScan User</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Using local storage
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          PREFERENCES
        </ThemedText>
        <Card elevation={1} style={styles.settingsCard}>
          <SettingsRow
            icon="globe"
            label="Language"
            value="English"
            onPress={() => Alert.alert("Language", "Language settings coming soon")}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsRow
            icon="bell"
            label="Notifications"
            value="On"
            onPress={() => Alert.alert("Notifications", "Notification settings coming soon")}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          DATA
        </ThemedText>
        <Card elevation={1} style={styles.settingsCard}>
          <SettingsRow
            icon="trash-2"
            label="Clear Scan History"
            onPress={handleClearHistory}
            danger
          />
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ABOUT
        </ThemedText>
        <Card elevation={1} style={styles.settingsCard}>
          <SettingsRow icon="info" label="Version" value="1.0.0" />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsRow
            icon="shield"
            label="Privacy Policy"
            onPress={() => Alert.alert("Privacy Policy", "Privacy policy will be displayed here")}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsRow
            icon="file-text"
            label="Terms of Service"
            onPress={() => Alert.alert("Terms", "Terms of service will be displayed here")}
          />
        </Card>
      </View>

      <ThemedText
        type="small"
        style={[styles.disclaimer, { color: theme.textSecondary }]}
      >
        This app is for informational purposes only and should not replace professional medical advice. Always consult with a healthcare provider.
      </ThemedText>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    gap: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    letterSpacing: 0.5,
  },
  settingsCard: {
    padding: 0,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingsRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.lg + 20 + Spacing.md,
  },
  disclaimer: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
});
