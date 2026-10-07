import { Platform } from "react-native";

// Modern Egyptian-inspired color palette with medical/pharmaceutical theme
export const ModernColors = {
  light: {
    // Primary brand colors - Egyptian blue and teal
    primary: "#0D7377",          // Deep Egyptian teal
    primaryLight: "#14A89A",     // Lighter teal
    primaryDark: "#0A5659",       // Darker teal
    primaryGradient: ["#0D7377", "#14A89A"],
    
    // Secondary colors - Mediterranean accents
    secondary: "#E63946",        // Mediterranean red
    secondaryLight: "#F77F8D",    // Light red
    secondaryDark: "#C9184A",     // Dark red
    
    // Accent colors
    accent: "#F4A261",           // Sandy orange
    accentLight: "#FFB700",       // Bright gold
    accentDark: "#E76F51",        // Dark orange
    
    // Success colors - Medical green
    success: "#2A9D8F",          // Medical teal-green
    successLight: "#52B788",      // Light green
    successDark: "#1B6B73",       // Dark green
    
    // Warning colors
    warning: "#E9C46A",          // Warm yellow
    warningLight: "#F4E4C1",      // Light yellow
    warningDark: "#D4A017",       // Dark yellow
    
    // Error colors
    error: "#E63946",             // Medical red
    errorLight: "#F77F8D",        // Light red
    errorDark: "#C9184A",         // Dark red
    
    // Neutral colors - Clean medical palette
    background: "#FAFAFA",        // Pure white
    backgroundSecondary: "#F8F9FA", // Light gray
    backgroundTertiary: "#E9ECEF", // Medium gray
    backgroundCard: "#FFFFFF",     // Card white
    
    // Text colors
    text: "#212529",              // Primary text
    textSecondary: "#6C757D",     // Secondary text
    textTertiary: "#ADB5BD",      // Tertiary text
    textDisabled: "#DEE2E6",      // Disabled text
    textInverse: "#FFFFFF",       // White text
    
    // Border colors
    border: "#DEE2E6",            // Light border
    borderLight: "#F8F9FA",       // Very light border
    borderDark: "#ADB5BD",        // Dark border
    
    // Status colors
    available: "#2A9D8F",         // Available - green
    limited: "#F4A261",           // Limited - orange
    unavailable: "#E63946",       // Unavailable - red
    
    // Pharmacy specific colors
    pharmacy: "#0D7377",          // Pharmacy brand color
    generic: "#52B788",           // Generic drug color
    prescription: "#E63946",      // Prescription color
    
    // UI element colors
    shadow: "rgba(0, 0, 0, 0.1)", // Shadow color
    overlay: "rgba(0, 0, 0, 0.5)", // Overlay color
    shimmer: "#E9ECEF",           // Shimmer effect color
  },
  
  dark: {
    // Primary brand colors
    primary: "#14A89A",          // Lighter teal for dark mode
    primaryLight: "#52B788",     // Even lighter
    primaryDark: "#0D7377",      // Original primary
    primaryGradient: ["#14A89A", "#52B788"],
    
    // Secondary colors
    secondary: "#F77F8D",        // Lighter red
    secondaryLight: "#FFB700",    // Gold accent
    secondaryDark: "#E63946",     // Original red
    
    // Accent colors
    accent: "#FFB700",            // Bright gold
    accentLight: "#F4E4C1",      // Light yellow
    accentDark: "#F4A261",       // Original orange
    
    // Success colors
    success: "#52B788",          // Light green
    successLight: "#95D5B2",     // Even lighter green
    successDark: "#2A9D8F",       // Original green
    
    // Warning colors
    warning: "#F4E4C1",          // Light yellow
    warningLight: "#FAF3E0",      // Very light yellow
    warningDark: "#E9C46A",       // Original yellow
    
    // Error colors
    error: "#F77F8D",            // Light red
    errorLight: "#FFB700",        // Gold tinted red
    errorDark: "#E63946",         // Original red
    
    // Neutral colors - Dark theme
    background: "#1A1D23",        // Dark background
    backgroundSecondary: "#22262E", // Darker gray
    backgroundTertiary: "#2D3139", // Even darker
    backgroundCard: "#22262E",     // Card background
    
    // Text colors
    text: "#FFFFFF",              // White text
    textSecondary: "#B8BCC8",     // Light gray text
    textTertiary: "#6C757D",     // Muted text
    textDisabled: "#495057",      // Disabled text
    textInverse: "#212529",       // Dark text
    
    // Border colors
    border: "#2D3139",            // Dark border
    borderLight: "#22262E",       // Lighter border
    borderDark: "#495057",        // Darker border
    
    // Status colors
    available: "#52B788",         // Available - light green
    limited: "#F4A261",           // Limited - orange
    unavailable: "#F77F8D",       // Unavailable - light red
    
    // Pharmacy specific colors
    pharmacy: "#14A89A",          // Pharmacy brand color
    generic: "#95D5B2",           // Generic drug color
    prescription: "#F77F8D",      // Prescription color
    
    // UI element colors
    shadow: "rgba(0, 0, 0, 0.3)", // Darker shadow
    overlay: "rgba(0, 0, 0, 0.7)", // Darker overlay
    shimmer: "#2D3139",           // Dark shimmer
  },
};

// Modern spacing system - 8px base unit
export const ModernSpacing = {
  // Base spacing
  xs: 4,      // 0.25rem
  sm: 8,      // 0.5rem
  md: 16,     // 1rem
  lg: 24,     // 1.5rem
  xl: 32,     // 2rem
  "2xl": 48,  // 3rem
  "3xl": 64,  // 4rem
  "4xl": 96,  // 6rem
  "5xl": 128, // 8rem
  
  // Component-specific spacing
  padding: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  margin: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  // Layout spacing
  container: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
  
  // Component dimensions
  button: {
    sm: 36,
    md: 44,
    lg: 52,
    xl: 60,
  },
  
  input: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  
  card: {
    sm: 120,
    md: 160,
    lg: 200,
    xl: 240,
  },
  
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    "2xl": 40,
    "3xl": 48,
  },
  
  // Avatar sizes
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    "2xl": 80,
  },
};

// Modern border radius system
export const ModernBorderRadius = {
  none: 0,
  xs: 4,      // Subtle corners
  sm: 8,      // Small corners
  md: 12,     // Medium corners
  lg: 16,     // Large corners
  xl: 20,     // Extra large corners
  "2xl": 24,  // Very large corners
  "3xl": 32,  // Rounded
  full: 9999, // Full circle
  
  // Component-specific radius
  button: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 9999,
  },
  
  card: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  
  input: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  
  chip: {
    sm: 12,
    md: 16,
    lg: 20,
    pill: 9999,
  },
  
  avatar: {
    sm: 9999,
    md: 9999,
    lg: 9999,
    xl: 9999,
  },
};

// Modern typography system
export const ModernTypography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: "800" as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
    lineHeight: 32,
    letterSpacing: 0,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  h5: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  h6: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  
  // Body text
  body1: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body2: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  body3: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  
  // Specialized text
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
    letterSpacing: 0.25,
  },
  overline: {
    fontSize: 10,
    fontWeight: "600" as const,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },
  
  // Button text
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 18,
    letterSpacing: 0.25,
  },
  buttonLarge: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  
  // Input text
  input: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 18,
    letterSpacing: 0.25,
  },
  
  // Navigation
  tab: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  menu: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
};

// Modern font system
export const ModernFonts = Platform.select({
  ios: {
    primary: "SF Pro Display",
    secondary: "SF Pro Text",
    mono: "SF Mono",
    rounded: "SF Pro Rounded",
  },
  android: {
    primary: "Roboto",
    secondary: "Roboto",
    mono: "Roboto Mono",
    rounded: "Roboto",
  },
  web: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    secondary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    rounded: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  default: {
    primary: "System",
    secondary: "System",
    mono: "monospace",
    rounded: "System",
  },
});

// Modern shadow system
export const ModernShadows = {
  // Subtle shadows
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  "2xl": {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  
  // Colored shadows
  primary: {
    shadowColor: ModernColors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  success: {
    shadowColor: ModernColors.light.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  warning: {
    shadowColor: ModernColors.light.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  error: {
    shadowColor: ModernColors.light.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Animation durations
export const AnimationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 750,
  slowest: 1000,
};

// Easing functions
export const AnimationEasing = {
  // Standard easing
  ease: "ease",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
  
  // Custom easing for React Native
  spring: {
    tension: 100,
    friction: 8,
  },
  bouncy: {
    tension: 300,
    friction: 8,
  },
  gentle: {
    tension: 200,
    friction: 20,
  },
};

// Breakpoints for responsive design
export const Breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  "2xl": 1400,
};

// Z-index scale
export const ZIndex = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Export modern theme object
export const ModernTheme = {
  colors: ModernColors,
  spacing: ModernSpacing,
  borderRadius: ModernBorderRadius,
  typography: ModernTypography,
  fonts: ModernFonts,
  shadows: ModernShadows,
  animations: {
    durations: AnimationDurations,
    easing: AnimationEasing,
  },
  breakpoints: Breakpoints,
  zIndex: ZIndex,
};
