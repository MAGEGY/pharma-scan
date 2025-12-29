import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#1A1D29",
    textSecondary: "#6B7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#0891B2",
    link: "#0891B2",
    backgroundRoot: "#F0F9FF",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#E0F2FE",
    backgroundTertiary: "#BAE6FD",
    primary: "#0891B2",
    primaryGradientStart: "#06B6D4",
    primaryGradientEnd: "#0284C7",
    secondary: "#8B5CF6",
    accent: "#F472B6",
    success: "#059669",
    warning: "#F59E0B",
    danger: "#DC2626",
    info: "#0EA5E9",
    border: "#E0F2FE",
    cardBorder: "#BAE6FD",
  },
  dark: {
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#22D3EE",
    link: "#22D3EE",
    backgroundRoot: "#0C1222",
    backgroundDefault: "#1A2332",
    backgroundSecondary: "#243447",
    backgroundTertiary: "#334155",
    primary: "#22D3EE",
    primaryGradientStart: "#06B6D4",
    primaryGradientEnd: "#0891B2",
    secondary: "#A78BFA",
    accent: "#F472B6",
    success: "#10B981",
    warning: "#FBBF24",
    danger: "#EF4444",
    info: "#38BDF8",
    border: "#243447",
    cardBorder: "#334155",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  fabSize: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
};
