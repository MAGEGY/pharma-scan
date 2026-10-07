import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { ModernSpacing, ModernColors } from "@/constants/modernTheme";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  style?: any;
}

export function LoadingSpinner({ 
  size = "md", 
  color, 
  style 
}: LoadingSpinnerProps) {
  const { theme } = useTheme();
  
  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  // Size configurations
  const sizeConfig = {
    xs: { width: 16, height: 16, strokeWidth: 2 },
    sm: { width: 20, height: 20, strokeWidth: 2 },
    md: { width: 24, height: 24, strokeWidth: 3 },
    lg: { width: 32, height: 32, strokeWidth: 3 },
    xl: { width: 40, height: 40, strokeWidth: 4 },
  };

  const currentSize = sizeConfig[size];

  // Rotation animation
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, []);

  // Scale animation for pulse effect
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const spinnerColor = color || theme.primary;

  return (
    <View style={[styles.container, { width: currentSize.width, height: currentSize.height }, style]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: currentSize.width,
            height: currentSize.height,
            borderTopColor: spinnerColor,
            borderRightColor: spinnerColor,
            borderBottomColor: `${spinnerColor}20`,
            borderLeftColor: `${spinnerColor}20`,
            borderWidth: currentSize.strokeWidth,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

// Pulse Loading Spinner
export function PulseLoadingSpinner({ 
  size = "md", 
  color, 
  style 
}: LoadingSpinnerProps) {
  const { theme } = useTheme();
  
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const opacity1 = useSharedValue(1);
  const opacity2 = useSharedValue(1);
  const opacity3 = useSharedValue(1);

  const sizeConfig = {
    xs: 8,
    sm: 10,
    md: 12,
    lg: 16,
    xl: 20,
  };

  const dotSize = sizeConfig[size];
  const spinnerColor = color || theme.primary;

  useEffect(() => {
    // Create staggered animations
    scale1.value = withRepeat(
      withTiming(1.5, { duration: 1000 }),
      -1,
      true
    );
    opacity1.value = withRepeat(
      withTiming(0.3, { duration: 1000 }),
      -1,
      true
    );

    scale2.value = withRepeat(
      withTiming(1.5, { duration: 1000 }, (finished) => {
        if (finished) {
          scale2.value = withTiming(1.5, { duration: 1000 });
        }
      }),
      -1,
      true
    );
    opacity2.value = withRepeat(
      withTiming(0.3, { duration: 1000 }, (finished) => {
        if (finished) {
          opacity2.value = withTiming(0.3, { duration: 1000 });
        }
      }),
      -1,
      true
    );

    scale3.value = withRepeat(
      withTiming(1.5, { duration: 1000 }, (finished) => {
        if (finished) {
          scale3.value = withTiming(1.5, { duration: 1000 });
        }
      }),
      -1,
      true
    );
    opacity3.value = withRepeat(
      withTiming(0.3, { duration: 1000 }, (finished) => {
        if (finished) {
          opacity3.value = withTiming(0.3, { duration: 1000 });
        }
      }),
      -1,
      true
    );
  }, []);

  const dotStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const dotStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  const dotStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  return (
    <View style={[styles.pulseContainer, style]}>
      <Animated.View
        style={[
          styles.pulseDot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: spinnerColor,
            borderRadius: dotSize / 2,
          },
          dotStyle1,
        ]}
      />
      <Animated.View
        style={[
          styles.pulseDot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: spinnerColor,
            borderRadius: dotSize / 2,
          },
          dotStyle2,
        ]}
      />
      <Animated.View
        style={[
          styles.pulseDot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: spinnerColor,
            borderRadius: dotSize / 2,
          },
          dotStyle3,
        ]}
      />
    </View>
  );
}

// Dots Loading Indicator
export function DotsLoadingIndicator({ 
  size = "md", 
  color, 
  style 
}: LoadingSpinnerProps) {
  const { theme } = useTheme();
  
  const translateY1 = useSharedValue(0);
  const translateY2 = useSharedValue(0);
  const translateY3 = useSharedValue(0);

  const sizeConfig = {
    xs: 6,
    sm: 8,
    md: 10,
    lg: 12,
    xl: 14,
  };

  const dotSize = sizeConfig[size];
  const spinnerColor = color || theme.primary;

  useEffect(() => {
    // Create bouncing animation
    const animateDot = (sharedValue: any, delay: number) => {
      sharedValue.value = withRepeat(
        withTiming(-10, { duration: 600 }, (finished) => {
          if (finished) {
            sharedValue.value = withTiming(0, { duration: 600 });
          }
        }),
        -1,
        false
      );
    };

    animateDot(translateY1, 0);
    animateDot(translateY2, 200);
    animateDot(translateY3, 400);
  }, []);

  const dotStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY1.value }],
  }));

  const dotStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY2.value }],
  }));

  const dotStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY3.value }],
  }));

  return (
    <View style={[styles.dotsContainer, style]}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: spinnerColor,
            borderRadius: dotSize / 2,
          },
          dotStyle1,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: spinnerColor,
            borderRadius: dotSize / 2,
          },
          dotStyle2,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: spinnerColor,
            borderRadius: dotSize / 2,
          },
          dotStyle3,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    borderRadius: 9999,
    borderStyle: "solid",
  },
  pulseContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: ModernSpacing.sm,
  },
  pulseDot: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: ModernSpacing.xs,
  },
  dot: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default LoadingSpinner;
