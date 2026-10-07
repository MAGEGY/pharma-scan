import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";

interface PriceDataPoint {
  date: Date;
  price: number;
}

interface PriceHistoryChartProps {
  data: PriceDataPoint[];
  height?: number;
}

export default function PriceHistoryChart({ data, height = 200 }: PriceHistoryChartProps) {
  const { theme } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height, backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.emptyState}>
          <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
            No price history available
          </ThemedText>
        </View>
      </View>
    );
  }

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));
  const priceRange = maxPrice - minPrice || 1;

  const chartWidth = data.length * 60;
  const chartPoints = data.map((point, index) => {
    const x = (index / (data.length - 1 || 1)) * (chartWidth - 40) + 20;
    const y = height - 40 - ((point.price - minPrice) / priceRange) * (height - 80);
    return { x, y, price: point.price, date: point.date };
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.header}>
        <ThemedText type="h4" style={styles.title}>
          Price History
        </ThemedText>
        <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {data.length} price updates
        </ThemedText>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.chartContainer}
        contentContainerStyle={{ width: Math.max(chartWidth, 300) }}
      >
        <View style={[styles.chart, { height }]}>
          {/* Grid lines */}
          <View style={styles.grid}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.gridLine,
                  {
                    top: (i / 4) * (height - 80) + 20,
                    backgroundColor: theme.cardBorder,
                  },
                ]}
              />
            ))}
          </View>

          {/* Price line */}
          <svg
            width={chartWidth}
            height={height}
            style={styles.svg}
          >
            {/* Line path */}
            <path
              d={`M ${chartPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
              fill="none"
              stroke={theme.primary}
              strokeWidth="2"
            />

            {/* Area under the line */}
            <path
              d={`M ${chartPoints.map(p => `${p.x},${p.y}`).join(' L ')} L ${chartPoints[chartPoints.length - 1]?.x},${height - 20} L ${chartPoints[0]?.x},${height - 20} Z`}
              fill={theme.primary}
              fillOpacity="0.1"
            />

            {/* Data points */}
            {chartPoints.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={theme.primary}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            ))}
          </svg>

          {/* X-axis labels */}
          <View style={styles.xAxis}>
            {chartPoints.filter((_, index) => index % Math.ceil(chartPoints.length / 5) === 0).map((point, index) => (
              <Text
                key={index}
                style={[
                  styles.xAxisLabel,
                  { 
                    left: point.x - 30,
                    color: theme.textSecondary,
                  },
                ]}
              >
                {formatDate(point.date)}
              </Text>
            ))}
          </View>

          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[0, 1, 2, 3, 4].map((i) => {
              const price = maxPrice - (i / 4) * priceRange;
              return (
                <Text
                  key={i}
                  style={[
                    styles.yAxisLabel,
                    {
                      top: (i / 4) * (height - 80) + 15,
                      color: theme.textSecondary,
                    },
                  ]}
                >
                  {formatPrice(price)}
                </Text>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Price range indicator */}
      <View style={[styles.priceRange, { borderTopColor: theme.cardBorder }]}>
        <View style={styles.priceItem}>
          <ThemedText type="small" style={[styles.priceLabel, { color: theme.textSecondary }]}>
            Min:
          </ThemedText>
          <ThemedText type="small" style={[styles.priceValue, { color: theme.success }]}>
            {formatPrice(minPrice)} EGP
          </ThemedText>
        </View>
        <View style={styles.priceItem}>
          <ThemedText type="small" style={[styles.priceLabel, { color: theme.textSecondary }]}>
            Max:
          </ThemedText>
          <ThemedText type="small" style={[styles.priceValue, { color: theme.danger }]}>
            {formatPrice(maxPrice)} EGP
          </ThemedText>
        </View>
        <View style={styles.priceItem}>
          <ThemedText type="small" style={[styles.priceLabel, { color: theme.textSecondary }]}>
            Current:
          </ThemedText>
          <ThemedText type="small" style={[styles.priceValue, { color: theme.primary }]}>
            {formatPrice(data[data.length - 1].price)} EGP
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
  },
  chartContainer: {
    flex: 1,
  },
  chart: {
    position: "relative",
  },
  grid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 40,
  },
  gridLine: {
    position: "absolute",
    left: 40,
    right: 0,
    height: 1,
    opacity: 0.3,
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  xAxis: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  xAxisLabel: {
    position: "absolute",
    fontSize: 10,
    width: 60,
    textAlign: "center",
  },
  yAxis: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 40,
    width: 40,
  },
  yAxisLabel: {
    position: "absolute",
    fontSize: 10,
    textAlign: "right",
    width: 35,
  },
  priceRange: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  priceItem: {
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
  },
});
