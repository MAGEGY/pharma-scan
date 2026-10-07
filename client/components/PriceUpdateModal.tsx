import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";

interface PriceUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  drugId: number;
  drugName: string;
  currentPrice?: number;
  onSuccess?: (newPrice: number) => void;
}

export default function PriceUpdateModal({
  visible,
  onClose,
  drugId,
  drugName,
  currentPrice,
  onSuccess,
}: PriceUpdateModalProps) {
  const { theme } = useTheme();
  const [newPrice, setNewPrice] = useState("");
  const [pharmacy, setPharmacy] = useState("");
  const [region, setRegion] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const price = parseFloat(newPrice);
    
    if (!newPrice || isNaN(price) || price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price greater than 0");
      return;
    }

    if (price > 99999.99) {
      Alert.alert("Invalid Price", "Price cannot exceed 99,999.99 EGP");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/drugs/${drugId}/price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          drugId,
          newPrice: price,
          pharmacy: pharmacy.trim() || undefined,
          region: region.trim() || undefined,
          source: "user_update",
          notes: notes.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          "Success",
          `Price updated successfully for ${drugName}`,
          [
            {
              text: "OK",
              onPress: () => {
                onSuccess?.(price);
                onClose();
                resetForm();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", result.message || "Failed to update price");
      }
    } catch (error) {
      console.error("Error updating price:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewPrice("");
    setPharmacy("");
    setRegion("");
    setNotes("");
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="h4" style={styles.title}>
            Update Price
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.drugInfo}>
            <ThemedText type="h4" style={styles.drugName}>
              {drugName}
            </ThemedText>
            {currentPrice && (
              <ThemedText type="body" style={[styles.currentPrice, { color: theme.textSecondary }]}>
                Current price: {currentPrice.toFixed(2)} EGP
              </ThemedText>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <ThemedText type="small" style={styles.label}>
                New Price (EGP) *
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.cardBorder,
                    color: theme.text,
                  },
                ]}
                value={newPrice}
                onChangeText={setNewPrice}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="small" style={styles.label}>
                Pharmacy Name
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.cardBorder,
                    color: theme.text,
                  },
                ]}
                value={pharmacy}
                onChangeText={setPharmacy}
                placeholder="e.g., Seif Pharmacy"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="small" style={styles.label}>
                Region/City
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.cardBorder,
                    color: theme.text,
                  },
                ]}
                value={region}
                onChangeText={setRegion}
                placeholder="e.g., Cairo, Alexandria"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="small" style={styles.label}>
                Notes (Optional)
              </ThemedText>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.cardBorder,
                    color: theme.text,
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional information about this price..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={handleClose}
              variant="outline"
              disabled={isSubmitting}
              style={styles.cancelButton}
            />
            <Button
              title={isSubmitting ? "Updating..." : "Update Price"}
              onPress={handleSubmit}
              disabled={isSubmitting || !newPrice}
              style={styles.updateButton}
            />
          </View>
        </ScrollView>

        {isSubmitting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="body" style={styles.loadingText}>
              Updating price...
            </ThemedText>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  drugInfo: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: "#F0F9FF",
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
  },
  drugName: {
    marginBottom: Spacing.xs,
  },
  currentPrice: {
    fontSize: 14,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  updateButton: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    color: "#FFFFFF",
  },
});
