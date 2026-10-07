import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { ModernSpacing, ModernBorderRadius, ModernTypography } from "@/constants/modernTheme";

interface SimpleButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SimpleButton({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
}: SimpleButtonProps) {
  const { theme } = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Animation handlers
  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  // Get button styles based on variant and size
  const getButtonStyles = () => {
    const baseStyle = {
      borderRadius: ModernBorderRadius.lg,
      minWidth: fullWidth ? "100%" : undefined,
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
    };

    return variantColors[variant];
  };

  // Get text size based on button size
  const getTextSize = () => {
    const sizeTextSizes = {
      sm: ModernTypography.buttonSmall,
      md: ModernTypography.button,
      lg: ModernTypography.buttonLarge,
    };

    return sizeTextSizes[size] || ModernTypography.button;
  };

  const buttonStyles = getButtonStyles();
  const textColor = getTextColor();
  const textSize = getTextSize();

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        buttonStyles,
        { opacity: disabled ? 0.5 : 1 },
        style,
        animatedStyle,
      ]}
    >
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
        {loading ? "Loading..." : children}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
  },
});

export default SimpleButton;
