import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { ModernSpacing, ModernColors, ModernTypography, AnimationDurations } from "@/constants/modernTheme";

interface CountdownTimerProps {
  targetTime: Date;
  onComplete?: () => void;
  format?: "full" | "compact" | "minimal";
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
  style?: any;
}

export function CountdownTimer({
  targetTime,
  onComplete,
  format = "full",
  showLabels = true,
  size = "md",
  style,
}: CountdownTimerProps) {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  // Animation values
  const progress = useSharedValue(1);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Size configurations
  const sizeConfig = {
    sm: {
      fontSize: 12,
      labelSize: 10,
      spacing: 4,
      padding: 8,
    },
    md: {
      fontSize: 16,
      labelSize: 12,
      spacing: 6,
      padding: 12,
    },
    lg: {
      fontSize: 20,
      labelSize: 14,
      spacing: 8,
      padding: 16,
    },
  };

  const currentSize = sizeConfig[size];

  // Calculate time left
  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const target = targetTime.getTime();
    const difference = target - now;

    if (difference <= 0) {
      setIsExpired(true);
      if (onComplete) {
        onComplete();
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }, [targetTime, onComplete]);

  // Update timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  // Animate progress and scale
  useEffect(() => {
    const totalSeconds = timeLeft.days * 86400 + timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
    const maxSeconds = 30 * 86400; // 30 days max
    const currentProgress = Math.max(0, totalSeconds / maxSeconds);

    progress.value = withTiming(currentProgress, {
      duration: 500,
      easing: Easing.out(Easing.quad),
    });

    // Pulse animation for last 10 seconds
    if (totalSeconds <= 10 && totalSeconds > 0) {
      scale.value = withTiming(1.1, {
        duration: 500,
        easing: Easing.inOut(Easing.quad),
      });
    } else {
      scale.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    }

    // Fade out when expired
    if (isExpired) {
      opacity.value = withTiming(0.5, {
        duration: 1000,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [timeLeft, isExpired]);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => {
    const circumference = 2 * Math.PI * 45; // radius of 45
    const strokeDashoffset = circumference * (1 - progress.value);
    
    return {
      strokeDashoffset,
    };
  });

  const formatTime = () => {
    const { days, hours, minutes, seconds } = timeLeft;

    switch (format) {
      case "compact":
        if (days > 0) {
          return `${days}d ${hours}h`;
        } else if (hours > 0) {
          return `${hours}h ${minutes}m`;
        } else {
          return `${minutes}m ${seconds}s`;
        }

      case "minimal":
        if (days > 0) {
          return `${days}:${hours.toString().padStart(2, "0")}`;
        } else if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, "0")}`;
        } else {
          return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        }

      case "full":
      default:
        return { days, hours, minutes, seconds };
    }
  };

  const getTimeColor = () => {
    const totalSeconds = timeLeft.days * 86400 + timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
    
    if (isExpired) return theme.textDisabled;
    if (totalSeconds <= 60) return theme.error;
    if (totalSeconds <= 300) return theme.warning;
    if (totalSeconds <= 3600) return theme.accent;
    return theme.primary;
  };

  const timeColor = getTimeColor();

  if (format === "compact" || format === "minimal") {
    return (
      <Animated.View style={[styles.compactContainer, progressStyle, style]}>
        <Text
          style={[
            styles.compactText,
            {
              fontSize: currentSize.fontSize,
              color: timeColor,
              fontWeight: "600",
            },
          ]}
        >
          {formatTime()}
        </Text>
      </Animated.View>
    );
  }

  const { days, hours, minutes, seconds } = formatTime() as {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };

  return (
    <Animated.View style={[styles.container, progressStyle, style]}>
      {/* Progress Ring */}
      <View style={styles.progressRing}>
        <svg width="100" height="100" style={styles.svg}>
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={theme.border}
            strokeWidth="4"
            fill="transparent"
          />
          {/* Progress ring */}
          <AnimatedCircle
            cx="50"
            cy="50"
            r="45"
            stroke={timeColor}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 45}`}
            style={ringStyle}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        
        {/* Time display */}
        <View style={styles.timeDisplay}>
          {(days > 0 || hours > 0) && (
            <View style={styles.timeUnit}>
              <Text
                style={[
                  styles.timeNumber,
                  {
                    fontSize: currentSize.fontSize,
                    color: timeColor,
                    fontWeight: "700",
                  },
                ]}
              >
                {days > 0 ? days : hours}
              </Text>
              {showLabels && (
                <Text
                  style={[
                    styles.timeLabel,
                    {
                      fontSize: currentSize.labelSize,
                      color: theme.textSecondary,
                    },
                  ]}
                >
                  {days > 0 ? "days" : "hours"}
                </Text>
              )}
            </View>
          )}
          
          {(days > 0 || hours > 0) && (
            <Text
              style={[
                styles.separator,
                {
                  fontSize: currentSize.fontSize,
                  color: timeColor,
                  fontWeight: "700",
                },
              ]}
            >
              :
            </Text>
          )}
          
          <View style={styles.timeUnit}>
            <Text
              style={[
                styles.timeNumber,
                {
                  fontSize: currentSize.fontSize,
                  color: timeColor,
                  fontWeight: "700",
                },
              ]}
            >
              {days > 0 ? hours : minutes}
            </Text>
            {showLabels && (
              <Text
                style={[
                  styles.timeLabel,
                  {
                    fontSize: currentSize.labelSize,
                    color: theme.textSecondary,
                  },
                ]}
              >
                {days > 0 ? "hours" : "min"}
              </Text>
            )}
          </View>
          
          <Text
            style={[
              styles.separator,
              {
                fontSize: currentSize.fontSize,
                color: timeColor,
                fontWeight: "700",
              },
            ]}
          >
            :
          </Text>
          
          <View style={styles.timeUnit}>
            <Text
              style={[
                styles.timeNumber,
                {
                  fontSize: currentSize.fontSize,
                  color: timeColor,
                  fontWeight: "700",
                },
              ]}
            >
              {days > 0 ? minutes : seconds}
            </Text>
            {showLabels && (
              <Text
                style={[
                  styles.timeLabel,
                  {
                    fontSize: currentSize.labelSize,
                    color: theme.textSecondary,
                  },
                ]}
              >
                {days > 0 ? "min" : "sec"}
              </Text>
            )}
          </View>
        </View>
      </View>
      
      {isExpired && (
        <Text
          style={[
            styles.expiredText,
            {
              fontSize: currentSize.labelSize,
              color: theme.error,
              marginTop: ModernSpacing.sm,
            },
          ]}
        >
          Time expired
        </Text>
      )}
    </Animated.View>
  );
}

// Simple countdown component for quick usage
export function SimpleCountdown({
  targetTime,
  onComplete,
  style,
}: {
  targetTime: Date;
  onComplete?: () => void;
  style?: any;
}) {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = targetTime.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("Expired");
        if (onComplete) onComplete();
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime, onComplete]);

  return (
    <Text style={[styles.simpleText, { color: theme.primary }, style]}>
      {timeLeft}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressRing: {
    position: "relative",
    width: 100,
    height: 100,
  },
  svg: {
    transform: [{ rotate: "-90deg" }],
  },
  timeDisplay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  timeUnit: {
    alignItems: "center",
    justifyContent: "center",
  },
  timeNumber: {
    lineHeight: 1,
  },
  timeLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  separator: {
    lineHeight: 1,
    marginHorizontal: 2,
  },
  expiredText: {
    textAlign: "center",
    fontWeight: "600",
  },
  compactContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  compactText: {
    fontWeight: "600",
  },
  simpleText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

// Note: For the AnimatedCircle component, you'll need to install react-native-svg
// npm install react-native-svg
// and add: import { Circle } from "react-native-svg";
// const AnimatedCircle = Animated.createAnimatedComponent(Circle);
