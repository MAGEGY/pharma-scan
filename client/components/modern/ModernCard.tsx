import React, { ReactNode } from "react";
import { View, StyleSheet, Pressable, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { ModernSpacing, ModernBorderRadius, ModernShadows, AnimationDurations } from "@/constants/modernTheme";

interface ModernCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  elevation?: "none" | "sm" | "md" | "lg" | "xl";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  variant?: "default" | "outlined" | "elevated" | "filled";
  animated?: boolean;
  hoverScale?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.View;

export function ModernCard({
  children,
  style,
  onPress,
  disabled = false,
  elevation = "md",
  padding = "md",
  radius = "lg",
  variant = "default",
  animated = true,
  hoverScale = 0.98,
}: ModernCardProps) {
  const { theme } = useTheme();

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const elevationValue = useSharedValue(0);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const elevationStyle = useAnimatedStyle(() => ({
    shadowOpacity: elevationValue.value,
    elevation: elevationValue.value * 10,
  }));

  // Animation handlers
  const handlePressIn = () => {
    if (!disabled && onPress && animated) {
      scale.value = withSpring(hoverScale, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    if (!disabled && onPress && animated) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  // Animate elevation on mount
  React.useEffect(() => {
    if (elevation !== "none") {
      elevationValue.value = withTiming(1, {
        duration: AnimationDurations.normal,
      });
    }
  }, [elevation]);

  // Get card styles
  const getCardStyles = () => {
    const baseStyle = {
      overflow: "hidden" as const,
    };

    // Padding styles
    const paddingStyles = {
      none: {},
      sm: { padding: ModernSpacing.sm },
      md: { padding: ModernSpacing.md },
      lg: { padding: ModernSpacing.lg },
      xl: { padding: ModernSpacing.xl },
    };

    // Border radius styles
    const radiusStyles = {
      none: { borderRadius: 0 },
      sm: { borderRadius: ModernBorderRadius.sm },
      md: { borderRadius: ModernBorderRadius.md },
      lg: { borderRadius: ModernBorderRadius.lg },
      xl: { borderRadius: ModernBorderRadius.xl },
      full: { borderRadius: ModernBorderRadius.full },
    };

    // Variant styles
    const variantStyles = {
      default: {
        backgroundColor: theme.backgroundCard,
        borderWidth: 1,
        borderColor: theme.border,
      },
      outlined: {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: theme.primary,
      },
      elevated: {
        backgroundColor: theme.backgroundCard,
        borderWidth: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
      },
      filled: {
        backgroundColor: theme.backgroundSecondary,
        borderWidth: 0,
      },
    };

    // Elevation styles
    const elevationStyles = {
      none: {},
      sm: ModernShadows.sm,
      md: ModernShadows.md,
      lg: ModernShadows.lg,
      xl: ModernShadows.xl,
    };

    return {
      ...baseStyle,
      ...paddingStyles[padding],
      ...radiusStyles[radius],
      ...variantStyles[variant],
      ...elevationStyles[elevation],
    };
  };

  const cardStyles = getCardStyles();

  const CardComponent = onPress ? AnimatedPressable : AnimatedView;
  const cardProps = onPress
    ? {
        onPress: disabled ? undefined : onPress,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        disabled,
      }
    : {};

  return (
    <CardComponent
      {...cardProps}
      style={[
        styles.card,
        cardStyles,
        { opacity: disabled ? 0.5 : 1 },
        style,
        animated && animatedStyle,
        elevation !== "none" && elevationStyle,
      ]}
    >
      {children}
    </CardComponent>
  );
}

// Specialized card components
export function DrugCard({ children, ...props }: ModernCardProps) {
  return (
    <ModernCard
      elevation="lg"
      padding="md"
      radius="lg"
      variant="elevated"
      {...props}
    >
      {children}
    </ModernCard>
  );
}

export function PriceCard({ children, ...props }: ModernCardProps) {
  return (
    <ModernCard
      elevation="md"
      padding="lg"
      radius="xl"
      variant="outlined"
      {...props}
    >
      {children}
    </ModernCard>
  );
}

export function NotificationCard({ children, ...props }: ModernCardProps) {
  return (
    <ModernCard
      elevation="sm"
      padding="md"
      radius="md"
      variant="filled"
      {...props}
    >
      {children}
    </ModernCard>
  );
}

export function StatsCard({ children, ...props }: ModernCardProps) {
  return (
    <ModernCard
      elevation="md"
      padding="lg"
      radius="lg"
      variant="elevated"
      hoverScale={1.02}
      {...props}
    >
      {children}
    </ModernCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
  },
});

export default ModernCard;
