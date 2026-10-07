import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";

interface TarshoubyProduct {
  name: string;
  price?: number;
  availability: 'available' | 'out_of_stock' | 'prescription_required';
  imageUrl?: string;
  productUrl: string;
  manufacturer?: string;
  requiresPrescription: boolean;
}

interface TarshoubySearchResult {
  products: TarshoubyProduct[];
  totalCount: number;
  searchQuery: string;
  timestamp: string;
}

interface TarshoubyPriceComparisonProps {
  drugName: string;
  drugId?: number;
  currentPrice?: number;
  onPriceUpdate?: (newPrice: number) => void;
}

export default function TarshoubyPriceComparison({
  drugName,
  drugId,
  currentPrice,
  onPriceUpdate,
}: TarshoubyPriceComparisonProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchResult, setSearchResult] = useState<TarshoubySearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [websiteHealth, setWebsiteHealth] = useState<any>(null);

  useEffect(() => {
    searchTarshouby();
    checkWebsiteHealth();
  }, [drugName]);

  const searchTarshouby = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tarshouby/search?drugName=${encodeURIComponent(drugName)}`);
      const result = await response.json();

      if (response.ok) {
        setSearchResult(result.data);
      } else {
        setError(result.message || "Failed to search Tarshouby");
      }
    } catch (error) {
      console.error("Error searching Tarshouby:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkWebsiteHealth = async () => {
    try {
      const response = await fetch("/api/tarshouby/health");
      const result = await response.json();
      
      if (response.ok) {
        setWebsiteHealth(result.data);
      }
    } catch (error) {
      console.error("Error checking Tarshouby health:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await searchTarshouby();
    await checkWebsiteHealth();
    setRefreshing(false);
  };

  const updatePriceFromTarshouby = async (product: TarshoubyProduct) => {
    if (!drugId || !product.price) {
      return;
    }

    Alert.alert(
      "Update Price",
      `Update price for ${drugName} to ${product.price.toFixed(2)} EGP from Tarshouby?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Update",
          onPress: async () => {
            try {
              const response = await fetch("/api/tarshouby/update-price", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  drugId,
                  tarshoubyProduct: product,
                }),
              });

              const result = await response.json();

              if (response.ok) {
                Alert.alert(
                  "Success",
                  "Price updated successfully from Tarshouby",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        onPriceUpdate?.(product.price!);
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
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return `EGP ${price.toFixed(2)}`;
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return theme.success;
      case 'out_of_stock':
        return theme.danger;
      case 'prescription_required':
        return theme.warning;
      default:
        return theme.textSecondary;
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available':
        return "Available";
      case 'out_of_stock':
        return "Out of Stock";
      case 'prescription_required':
        return "Prescription Required";
      default:
        return "Unknown";
    }
  };

  const getPriceDifference = (tarshoubyPrice: number) => {
    if (!currentPrice) return null;
    
    const difference = tarshoubyPrice - currentPrice;
    const percentage = (difference / currentPrice) * 100;
    
    return {
      difference,
      percentage,
      isHigher: difference > 0,
    };
  };

  return (
    <Card elevation={1} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText type="h4" style={styles.title}>
            Tarshouby Price Check
          </ThemedText>
          <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Al Abdellatif Tarshouby Pharmacy
          </ThemedText>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Website Health Status */}
      {websiteHealth && (
        <View style={[styles.healthStatus, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.healthItem}>
            <Feather 
              name={websiteHealth.accessible ? "check-circle" : "x-circle"} 
              size={16} 
              color={websiteHealth.accessible ? theme.success : theme.danger} 
            />
            <ThemedText type="small" style={styles.healthText}>
              {websiteHealth.accessible ? "Online" : "Offline"}
            </ThemedText>
          </View>
          {websiteHealth.responseTime && (
            <ThemedText type="small" style={[styles.healthText, { color: theme.textSecondary }]}>
              {websiteHealth.responseTime}ms
            </ThemedText>
          )}
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && !searchResult ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="body" style={styles.loadingText}>
              Searching Tarshouby...
            </ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={24} color={theme.danger} />
            <ThemedText type="body" style={[styles.errorText, { color: theme.danger }]}>
              {error}
            </ThemedText>
            <Button title="Retry" onPress={searchTarshouby} style={styles.retryButton} />
          </View>
        ) : searchResult?.products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="search" size={24} color={theme.textSecondary} />
            <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
              No products found for "{drugName}"
            </ThemedText>
            <ThemedText type="small" style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Try searching with a different name
            </ThemedText>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            {searchResult?.products.map((product, index) => {
              const priceDiff = product.price ? getPriceDifference(product.price) : null;
              
              return (
                <Card key={index} elevation={0} style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <View style={styles.productInfo}>
                      <ThemedText type="body" style={styles.productName}>
                        {product.name}
                      </ThemedText>
                      {product.manufacturer && (
                        <ThemedText type="small" style={[styles.manufacturer, { color: theme.textSecondary }]}>
                          {product.manufacturer}
                        </ThemedText>
                      )}
                    </View>
                    <View style={styles.productStatus}>
                      <ThemedText type="small" style={{ color: getAvailabilityColor(product.availability) }}>
                        {getAvailabilityText(product.availability)}
                      </ThemedText>
                      {product.requiresPrescription && (
                        <ThemedText type="small" style={[styles.prescriptionBadge, { color: theme.warning }]}>
                          RX
                        </ThemedText>
                      )}
                    </View>
                  </View>

                  <View style={styles.priceSection}>
                    {product.price ? (
                      <View style={styles.priceRow}>
                        <ThemedText type="h4" style={[styles.price, { color: theme.primary }]}>
                          {formatPrice(product.price)}
                        </ThemedText>
                        {priceDiff && (
                          <View style={styles.priceComparison}>
                            <ThemedText 
                              type="small" 
                              style={[
                                styles.priceDiff,
                                { color: priceDiff.isHigher ? theme.danger : theme.success }
                              ]}
                            >
                              {priceDiff.isHigher ? '+' : ''}{priceDiff.difference.toFixed(2)} EGP
                            </ThemedText>
                            <ThemedText 
                              type="small" 
                              style={[
                                styles.pricePercent,
                                { color: priceDiff.isHigher ? theme.danger : theme.success }
                              ]}
                            >
                              ({priceDiff.isHigher ? '+' : ''}{priceDiff.percentage.toFixed(1)}%)
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    ) : (
                      <ThemedText type="body" style={[styles.noPrice, { color: theme.textSecondary }]}>
                        Price not available
                      </ThemedText>
                    )}
                  </View>

                  {product.price && drugId && (
                    <Button
                      title="Update Price"
                      onPress={() => updatePriceFromTarshouby(product)}
                      style={styles.updateButton}
                      size="small"
                    />
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  healthStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  healthItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  healthText: {
    fontSize: 12,
  },
  content: {
    maxHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  resultsContainer: {
    gap: Spacing.md,
  },
  productCard: {
    padding: Spacing.md,
  },
  productHeader: {
    marginBottom: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  manufacturer: {
    fontSize: 12,
  },
  productStatus: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  prescriptionBadge: {
    fontSize: 10,
    fontWeight: "600",
  },
  priceSection: {
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
  },
  priceComparison: {
    alignItems: "flex-end",
  },
  priceDiff: {
    fontSize: 12,
    fontWeight: "500",
  },
  pricePercent: {
    fontSize: 10,
  },
  noPrice: {
    fontStyle: "italic",
  },
  updateButton: {
    marginTop: Spacing.sm,
  },
});
