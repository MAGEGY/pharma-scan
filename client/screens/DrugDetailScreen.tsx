import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useRoute, RouteProp } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { EGYPTIAN_DRUGS } from "@/data/egyptianDrugs";

type RouteParams = RouteProp<RootStackParamList, "DrugDetail">;

interface InfoRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  color?: string;
}

function InfoRow({ icon, label, value, color }: InfoRowProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={20} color={color || theme.primary} />
      <View style={styles.infoContent}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {label}
        </ThemedText>
        <ThemedText type="body">{value}</ThemedText>
      </View>
    </View>
  );
}

export default function DrugDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const route = useRoute<RouteParams>();

  const drug = EGYPTIAN_DRUGS.find((d) => d.id === route.params.drugId);

  if (!drug) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <Feather name="alert-circle" size={48} color={theme.textSecondary} />
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Drug not found
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText type="h3">{drug.name}</ThemedText>
        <ThemedText type="h4" style={{ color: theme.textSecondary }}>
          {drug.nameArabic}
        </ThemedText>
      </View>

      <Card elevation={1} style={styles.infoCard}>
        <InfoRow icon="box" label="Active Ingredient" value={drug.activeIngredient} />
        <View style={[styles.separator, { backgroundColor: theme.border }]} />
        <InfoRow icon="tag" label="Category" value={drug.category} />
        <View style={[styles.separator, { backgroundColor: theme.border }]} />
        <InfoRow icon="briefcase" label="Manufacturer" value={drug.manufacturer} />
        <View style={[styles.separator, { backgroundColor: theme.border }]} />
        <InfoRow icon="package" label="Form" value={drug.form} />
        <View style={[styles.separator, { backgroundColor: theme.border }]} />
        <InfoRow icon="dollar-sign" label="Price (EGP)" value={drug.price} />
      </Card>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Dosing Information
        </ThemedText>
        <Card elevation={1}>
          <ThemedText type="body">{drug.dosing}</ThemedText>
        </Card>
      </View>

      {drug.interactions && drug.interactions.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Drug Interactions
          </ThemedText>
          <Card
            elevation={1}
            style={[
              styles.warningCard,
              { borderLeftColor: theme.danger, backgroundColor: `${theme.danger}08` },
            ]}
          >
            {drug.interactions.map((interaction, idx) => (
              <View key={idx} style={styles.listItem}>
                <Feather name="alert-triangle" size={16} color={theme.danger} />
                <ThemedText type="body" style={styles.listItemText}>
                  {interaction}
                </ThemedText>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {drug.contraindications && drug.contraindications.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Contraindications
          </ThemedText>
          <Card
            elevation={1}
            style={[
              styles.warningCard,
              { borderLeftColor: theme.warning, backgroundColor: `${theme.warning}08` },
            ]}
          >
            {drug.contraindications.map((contra, idx) => (
              <View key={idx} style={styles.listItem}>
                <Feather name="x-circle" size={16} color={theme.warning} />
                <ThemedText type="body" style={styles.listItemText}>
                  {contra}
                </ThemedText>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {drug.sideEffects && drug.sideEffects.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Side Effects
          </ThemedText>
          <Card elevation={1}>
            {drug.sideEffects.map((effect, idx) => (
              <View key={idx} style={styles.listItem}>
                <Feather name="info" size={16} color={theme.textSecondary} />
                <ThemedText type="body" style={styles.listItemText}>
                  {effect}
                </ThemedText>
              </View>
            ))}
          </Card>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  infoCard: {
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  separator: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  warningCard: {
    borderLeftWidth: 3,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  listItemText: {
    flex: 1,
  },
});
