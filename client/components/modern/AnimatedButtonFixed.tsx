import React, { ReactNode, useEffect } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { ModernSpacing, ModernBorderRadius, ModernTypography } from "@/constants/modernTheme";

interface AnimatedButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  animated?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedButton({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  animated = true,
}: AnimatedButtonProps) {
  const { theme } = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const loadingRotation = useSharedValue(0);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const loadingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loadingRotation.value}deg` }],
  }));

  // Animation handlers
  const handlePressIn = () => {
    if (!disabled && !loading && animated) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading && animated) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  // Loading animation
  useEffect(() => {
    if (loading) {
      loadingRotation.value = withSequence(
        withTiming(360, { duration: 1000 }),
        withTiming(720, { duration: 1000 })
      );
    } else {
      loadingRotation.value = withTiming(0);
    }
  }, [loading]);

  // Get button styles based on variant and size
  const getButtonStyles = () => {
    const baseStyle = {
      borderRadius: ModernBorderRadius.lg,
      minWidth: fullWidth ? "100%" : undefined,
      overflow: "hidden" as const,
    };

    const sizeStyles = {
      height: ModernSpacing.button[size] || ModernSpacing.button.md,
      paddingHorizontal: size === "sm" ? ModernSpacing.md : ModernSpacing.lg,
    };

    const variantStyles = {
      primary: {
        backgroundColor: theme.primary,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      },
      secondary: {
        backgroundColor: theme.secondary,
        shadowColor: theme.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: theme.primary,
      },
      ghost: {
        backgroundColor: "transparent",
      },
      danger: {
        backgroundColor: theme.error,
        shadowColor: theme.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      },
      success: {
        backgroundColor: theme.success,
        shadowColor: theme.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      },
    };

    return { ...baseStyle, ...sizeStyles, ...variantStyles[variant] };
  };

  // Get text color based on variant
  const getTextColor = () => {
    if (disabled) return theme.textSecondary;
    
    const variantColors = {
      primary: "#FFFFFF",
      secondary: "#FFFFFF",
      outline: theme.primary,
      ghost: theme.primary,
      danger: "#FFFFFF",
      success: "#FFFFFF",
    };

    return variantColors[variant];
  };

  // Get text size based on button size
  const getTextSize = () => {
    const sizeTextSizes = {
      sm: ModernTypography.buttonSmall,
      md: ModernTypography.button,
      lg: ModernTypography.buttonLarge,
      xl: ModernTypography.buttonLarge,
    };

    return sizeTextSizes[size] || ModernTypography.button;
  };

  const buttonStyles = getButtonStyles();
  const textColor = getTextColor();
  const textSize = getTextSize();

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        buttonStyles,
        { opacity: disabled ? 0.5 : 1 },
        style,
        animated && animatedStyle,
      ]}
    >
      <View style={styles.content}>
        {/* Loading indicator */}
        {loading && (
          <Animated.View style={[styles.loadingIndicator, loadingStyle]}>
            <View style={styles.loadingDot} />
            <View style={styles.loadingDot} />
            <View style={styles.loadingDot} />
          </Animated.View>
        )}

        {/* Icon */}
        {!loading && icon && iconPosition === "left" && (
          <View style={styles.iconLeft}>{icon}</View>
        )}

        {/* Button text */}
        {!loading && (
          <ThemedText
            style={[
              styles.text,
              {
                color: textColor,
                fontSize: textSize.fontSize,
                fontWeight: textSize.fontWeight,
              },
            ]}
          >
            {children}
          </ThemedText>
        )}

        {/* Right icon */}
        {!loading && icon && iconPosition === "right" && (
          <View style={styles.iconRight}>{icon}</View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ModernSpacing.sm,
  },
  text: {
    textAlign: "center",
  },
  iconLeft: {
    marginRight: -ModernSpacing.xs,
  },
  iconRight: {
    marginLeft: -ModernSpacing.xs,
  },
  loadingIndicator: {
    flexDirection: "row",
    gap: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});

export default AnimatedButton;
