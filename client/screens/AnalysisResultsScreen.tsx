import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  Linking,
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

interface PharmacyLink {
  pharmacy: string;
  searchUrl: string;
  logoColor: string;
}

type RouteParams = RouteProp<RootStackParamList, "AnalysisResults">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ExpandableCardProps {
  medicine: Medicine;
  recommendation?: Recommendation;
}

function generatePharmacyLinks(medicineName: string): PharmacyLink[] {
  const encodedName = encodeURIComponent(medicineName);
  
  return [
    {
      pharmacy: "Seif",
      searchUrl: `https://www.seif-online.com/en/products?search=${encodedName}`,
      logoColor: "#E31837",
    },
    {
      pharmacy: "Tarshouby",
      searchUrl: `https://alabdellatif-tarshouby.com/en/products?search=${encodedName}`,
      logoColor: "#1E3A8A",
    },
    {
      pharmacy: "Google",
      searchUrl: `https://www.google.com/search?q=${encodedName}+Egypt+pharmacy+price`,
      logoColor: "#4285F4",
    },
  ];
}

function ExpandableCard({ medicine, recommendation }: ExpandableCardProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const pharmacyLinks = generatePharmacyLinks(medicine.name);

  const isVerifiedOrSuggested = medicine.verificationStatus === "verified" || medicine.verificationStatus === "suggested";
  const hasComposition = medicine.composition || medicine.therapeuticClass || medicine.activeIngredient;

  const handlePharmacyPress = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this link");
      }
    } catch (error) {
      console.error("Error opening URL:", error);
      Alert.alert("Error", "Failed to open pharmacy website");
    }
  };

  const hasWarnings =
    (recommendation?.interactions && recommendation.interactions.length > 0) ||
    (recommendation?.contraindications && recommendation.contraindications.length > 0);

  return (
    <Card
      elevation={1}
      onPress={() => setExpanded(!expanded)}
      style={styles.medicineCard}
    >
      <View style={styles.medicineHeader}>
        <View style={styles.medicineInfo}>
          <ThemedText type="body" style={{ fontWeight: "700", fontSize: 18 }}>
            {medicine.name}
          </ThemedText>
          {medicine.nameArabic ? (
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
              {medicine.nameArabic}
            </ThemedText>
          ) : null}
          {hasComposition && isVerifiedOrSuggested ? (
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
              {medicine.activeIngredient || medicine.therapeuticClass}
            </ThemedText>
          ) : null}
        </View>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.textSecondary}
        />
      </View>

      <View style={styles.statusRow}>
        {medicine.verificationStatus === "verified" ? (
          <View style={[styles.availableBadge, { borderColor: theme.success }]}>
            <Feather name="check-circle" size={12} color={theme.success} />
            <ThemedText type="small" style={{ color: theme.success, fontWeight: "600", marginLeft: 4 }}>
              Verified
            </ThemedText>
          </View>
        ) : medicine.verificationStatus === "suggested" ? (
          <View style={[styles.availableBadge, { borderColor: theme.warning }]}>
            <Feather name="alert-circle" size={12} color={theme.warning} />
            <ThemedText type="small" style={{ color: theme.warning, fontWeight: "600", marginLeft: 4 }}>
              Suggested
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.availableBadge, { borderColor: theme.danger }]}>
            <Feather name="help-circle" size={12} color={theme.danger} />
            <ThemedText type="small" style={{ color: theme.danger, fontWeight: "600", marginLeft: 4 }}>
              Not Found
            </ThemedText>
          </View>
        )}
        {hasWarnings ? (
          <View style={[styles.availableBadge, { borderColor: theme.danger }]}>
            <Feather name="alert-triangle" size={12} color={theme.danger} />
            <ThemedText type="small" style={{ color: theme.danger, fontWeight: "600", marginLeft: 4 }}>
              Warnings
            </ThemedText>
          </View>
        ) : null}
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
      </View>

      {medicine.verificationStatus === "suggested" && medicine.suggestedMatch ? (
        <View style={[styles.suggestedMatchAlert, { backgroundColor: `${theme.warning}15` }]}>
          <Feather name="info" size={14} color={theme.warning} />
          <ThemedText type="small" style={{ color: theme.warning, flex: 1, marginLeft: Spacing.xs }}>
            Did you mean: {medicine.suggestedMatch.name}
            {medicine.suggestedMatch.nameArabic ? ` (${medicine.suggestedMatch.nameArabic})` : ""}?
          </ThemedText>
        </View>
      ) : null}

      {expanded && recommendation ? (
        <View style={styles.recommendationSection}>
          {(medicine.composition || medicine.therapeuticClass) && medicine.verificationStatus !== "unverified" ? (
            <View
              style={[
                styles.infoBlock,
                styles.compositionBlock,
                { backgroundColor: `${theme.primary}10` },
              ]}
            >
              <View style={styles.infoHeader}>
                <Feather name="database" size={16} color={theme.primary} />
                <ThemedText
                  type="small"
                  style={{ fontWeight: "600", color: theme.primary }}
                >
                  Drug Composition (Dalil Aldawaa)
                </ThemedText>
              </View>
              {medicine.composition ? (
                <ThemedText
                  type="small"
                  style={{ color: theme.text, marginTop: Spacing.xs }}
                >
                  {medicine.composition}
                </ThemedText>
              ) : null}
              {medicine.therapeuticClass ? (
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                >
                  Class: {medicine.therapeuticClass}
                </ThemedText>
              ) : null}
              {medicine.manufacturer ? (
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                >
                  Manufacturer: {medicine.manufacturer}
                </ThemedText>
              ) : null}
            </View>
          ) : null}

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

          {isVerifiedOrSuggested ? (
            <View style={styles.pharmacySection}>
              <View style={styles.infoHeader}>
                <Feather name="shopping-bag" size={16} color={theme.primary} />
                <ThemedText type="small" style={{ fontWeight: "600" }}>
                  Find in Egyptian Pharmacies
                </ThemedText>
              </View>
              <View style={styles.pharmacyLinks}>
                {pharmacyLinks.map((link, idx) => (
                  <Pressable
                    key={idx}
                    style={[
                      styles.pharmacyButton,
                      { backgroundColor: link.logoColor },
                    ]}
                    onPress={() => handlePharmacyPress(link.searchUrl)}
                  >
                    <Feather name="external-link" size={12} color="#FFFFFF" />
                    <ThemedText
                      type="small"
                      style={{ color: "#FFFFFF", fontWeight: "600" }}
                    >
                      {link.pharmacy}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {medicine.alternatives && medicine.alternatives.length > 0 ? (
            <View
              style={[
                styles.infoBlock,
                styles.alternativesBlock,
                { backgroundColor: `${theme.info}10` },
              ]}
            >
              <View style={styles.infoHeader}>
                <Feather name="shuffle" size={16} color={theme.info} />
                <ThemedText
                  type="small"
                  style={{ fontWeight: "600", color: theme.info }}
                >
                  Alternative Medicines (Same Active Ingredient)
                </ThemedText>
              </View>
              {medicine.alternatives.map((alt, idx) => (
                <View key={idx} style={styles.alternativeItem}>
                  <ThemedText type="small" style={{ fontWeight: "600" }}>
                    {alt.name}
                    {alt.nameArabic ? ` (${alt.nameArabic})` : ""}
                  </ThemedText>
                  {alt.dosing ? (
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary, marginTop: 2 }}
                    >
                      Dosing: {alt.dosing}
                    </ThemedText>
                  ) : null}
                </View>
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
  pharmacySection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  pharmacyLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pharmacyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  compositionBlock: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  suggestedMatchAlert: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.xs,
  },
  alternativesBlock: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  alternativeItem: {
    marginTop: Spacing.sm,
    paddingLeft: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(0,0,0,0.1)",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
});
