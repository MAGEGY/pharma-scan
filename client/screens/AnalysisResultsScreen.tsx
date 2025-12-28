import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useScanHistory, Medicine, Recommendation } from "@/hooks/useScanHistory";
import { generatePdfHtml } from "@/lib/pdfGenerator";

type RouteParams = RouteProp<RootStackParamList, "AnalysisResults">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ExpandableCardProps {
  medicine: Medicine;
  recommendation?: Recommendation;
}

function ExpandableCard({ medicine, recommendation }: ExpandableCardProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const hasWarnings =
    (recommendation?.interactions && recommendation.interactions.length > 0) ||
    (recommendation?.contraindications && recommendation.contraindications.length > 0);

  return (
    <Card
      elevation={1}
      onPress={() => setExpanded(!expanded)}
      style={[
        styles.medicineCard,
        hasWarnings && { borderLeftWidth: 3, borderLeftColor: theme.warning },
      ]}
    >
      <View style={styles.medicineHeader}>
        <View style={styles.medicineInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {medicine.name}
          </ThemedText>
          {medicine.nameArabic ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {medicine.nameArabic}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.confidenceContainer}>
          <View
            style={[
              styles.confidenceBadge,
              {
                backgroundColor:
                  medicine.confidence >= 80
                    ? theme.success
                    : medicine.confidence >= 60
                    ? theme.warning
                    : theme.danger,
              },
            ]}
          >
            <ThemedText type="small" style={{ color: "#FFFFFF" }}>
              {medicine.confidence}%
            </ThemedText>
          </View>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.textSecondary}
          />
        </View>
      </View>

      {expanded && recommendation ? (
        <View style={styles.recommendationSection}>
          {recommendation.dosing ? (
            <View style={styles.infoBlock}>
              <View style={styles.infoHeader}>
                <Feather name="clock" size={16} color={theme.primary} />
                <ThemedText type="small" style={{ fontWeight: "600" }}>
                  Dosing
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {recommendation.dosing}
              </ThemedText>
            </View>
          ) : null}

          {recommendation.interactions && recommendation.interactions.length > 0 ? (
            <View
              style={[
                styles.infoBlock,
                styles.warningBlock,
                { backgroundColor: `${theme.danger}15` },
              ]}
            >
              <View style={styles.infoHeader}>
                <Feather name="alert-triangle" size={16} color={theme.danger} />
                <ThemedText
                  type="small"
                  style={{ fontWeight: "600", color: theme.danger }}
                >
                  Drug Interactions
                </ThemedText>
              </View>
              {recommendation.interactions.map((interaction, idx) => (
                <ThemedText
                  key={idx}
                  type="small"
                  style={{ color: theme.text, marginTop: Spacing.xs }}
                >
                  {interaction}
                </ThemedText>
              ))}
            </View>
          ) : null}

          {recommendation.contraindications &&
          recommendation.contraindications.length > 0 ? (
            <View
              style={[
                styles.infoBlock,
                styles.warningBlock,
                { backgroundColor: `${theme.warning}15` },
              ]}
            >
              <View style={styles.infoHeader}>
                <Feather name="x-circle" size={16} color={theme.warning} />
                <ThemedText
                  type="small"
                  style={{ fontWeight: "600", color: theme.warning }}
                >
                  Contraindications
                </ThemedText>
              </View>
              {recommendation.contraindications.map((contra, idx) => (
                <ThemedText
                  key={idx}
                  type="small"
                  style={{ color: theme.text, marginTop: Spacing.xs }}
                >
                  {contra}
                </ThemedText>
              ))}
            </View>
          ) : null}

          {recommendation.recommendations &&
          recommendation.recommendations.length > 0 ? (
            <View style={styles.infoBlock}>
              <View style={styles.infoHeader}>
                <Feather name="info" size={16} color={theme.success} />
                <ThemedText type="small" style={{ fontWeight: "600" }}>
                  Recommendations
                </ThemedText>
              </View>
              {recommendation.recommendations.map((rec, idx) => (
                <ThemedText
                  key={idx}
                  type="small"
                  style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                >
                  {rec}
                </ThemedText>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export default function AnalysisResultsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NavigationProp>();
  const { getScan } = useScanHistory();
  const [isExporting, setIsExporting] = useState(false);

  const scan = getScan(route.params.scanId);

  const handleExportPdf = async () => {
    if (!scan) return;

    try {
      setIsExporting(true);
      const html = generatePdfHtml(scan);
      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Prescription Analysis",
        });
      } else {
        Alert.alert("Success", "PDF saved successfully!");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      Alert.alert("Error", "Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!scan) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <Feather name="file-text" size={48} color={theme.textSecondary} />
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Scan not found
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
      {scan.imageUri ? (
        <Pressable
          onPress={() => {}}
          style={[styles.imageContainer, { borderColor: theme.border }]}
        >
          <Image source={{ uri: scan.imageUri }} style={styles.prescriptionImage} />
          <View style={styles.imageOverlay}>
            <Feather name="maximize-2" size={16} color="#FFFFFF" />
          </View>
        </Pressable>
      ) : null}

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <ThemedText type="h3" style={{ color: theme.primary }}>
            {scan.medicinesCount}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Medicines Found
          </ThemedText>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}>
          <ThemedText type="h3" style={{ color: theme.text }}>
            {new Date(scan.createdAt).toLocaleDateString()}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Scan Date
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Recognized Medicines
        </ThemedText>
        {scan.medicines?.map((medicine, idx) => (
          <ExpandableCard
            key={idx}
            medicine={medicine}
            recommendation={scan.recommendations?.[idx]}
          />
        ))}
      </View>

      <Button
        onPress={handleExportPdf}
        disabled={isExporting}
        style={styles.exportButton}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          "Export as PDF"
        )}
      </Button>
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
  imageContainer: {
    height: 180,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  prescriptionImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    marginVertical: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  medicineCard: {
    marginBottom: Spacing.md,
  },
  medicineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  medicineInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  recommendationSection: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  infoBlock: {
    gap: Spacing.xs,
  },
  warningBlock: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  exportButton: {
    marginTop: Spacing.lg,
  },
});
