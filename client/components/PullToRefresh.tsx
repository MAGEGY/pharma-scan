import React from "react";
import { ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  refreshing?: boolean;
  style?: any;
  contentContainerStyle?: any;
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshing = false,
  style,
  contentContainerStyle,
}: PullToRefreshProps) {
  const { theme } = useTheme();

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
          progressBackgroundColor={theme.backgroundSecondary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
