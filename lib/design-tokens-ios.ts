/**
 * RegattaFlow iOS Design System
 * Apple Human Interface Guidelines compliant design tokens
 */

// iOS System Colors (Light Mode)
export const IOS_COLORS = {
  // Labels
  label: '#000000',
  secondaryLabel: 'rgba(60, 60, 67, 0.6)',
  tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
  quaternaryLabel: 'rgba(60, 60, 67, 0.18)',

  // Backgrounds
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tertiarySystemGroupedBackground: '#F2F2F7',

  // System Colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemOrange: '#FF9500',
  systemRed: '#FF3B30',
  systemYellow: '#FFCC00',
  systemPurple: '#AF52DE',
  systemPink: '#FF2D55',
  systemTeal: '#5AC8FA',
  systemIndigo: '#5856D6',
  systemMint: '#00C7BE',
  systemCyan: '#32ADE6',
  systemBrown: '#A2845E',

  // Grays
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',

  // Separators
  separator: 'rgba(60, 60, 67, 0.29)',
  opaqueSeparator: '#C6C6C8',

  // Fill Colors
  systemFill: 'rgba(120, 120, 128, 0.2)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.16)',
  tertiarySystemFill: 'rgba(118, 118, 128, 0.12)',
  quaternarySystemFill: 'rgba(116, 116, 128, 0.08)',
} as const;

// iOS System Colors (Dark Mode)
export const IOS_COLORS_DARK = {
  // Labels
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
  quaternaryLabel: 'rgba(235, 235, 245, 0.18)',

  // Backgrounds
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',
  systemGroupedBackground: '#000000',
  secondarySystemGroupedBackground: '#1C1C1E',
  tertiarySystemGroupedBackground: '#2C2C2E',

  // System Colors (Dark variants - slightly brighter)
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemOrange: '#FF9F0A',
  systemRed: '#FF453A',
  systemYellow: '#FFD60A',
  systemPurple: '#BF5AF2',
  systemPink: '#FF375F',
  systemTeal: '#64D2FF',
  systemIndigo: '#5E5CE6',
  systemMint: '#63E6E2',
  systemCyan: '#5AC8FA',
  systemBrown: '#AC8E68',

  // Grays
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray3: '#48484A',
  systemGray4: '#3A3A3C',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',

  // Separators
  separator: 'rgba(84, 84, 88, 0.65)',
  opaqueSeparator: '#38383A',

  // Fill Colors
  systemFill: 'rgba(120, 120, 128, 0.36)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.32)',
  tertiarySystemFill: 'rgba(118, 118, 128, 0.24)',
  quaternarySystemFill: 'rgba(116, 116, 128, 0.18)',
} as const;

// iOS Typography Scale (following SF Pro guidelines)
export const IOS_TYPOGRAPHY = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, lineHeight: 41, letterSpacing: 0.37 },
  title1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: 0.36 },
  title2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28, letterSpacing: 0.35 },
  title3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 25, letterSpacing: 0.38 },
  headline: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22, letterSpacing: -0.41 },
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22, letterSpacing: -0.41 },
  callout: { fontSize: 16, fontWeight: '400' as const, lineHeight: 21, letterSpacing: -0.32 },
  subhead: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20, letterSpacing: -0.24 },
  footnote: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, letterSpacing: -0.08 },
  caption1: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16, letterSpacing: 0 },
  caption2: { fontSize: 11, fontWeight: '400' as const, lineHeight: 13, letterSpacing: 0.07 },
} as const;

// iOS Spacing following 8-point grid
export const IOS_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

// iOS Corner Radii
export const IOS_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  continuous: 'continuous', // For smooth/continuous corners
  full: 9999,
} as const;

// iOS Shadows (Apple-style soft shadows)
export const IOS_SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
} as const;

// iOS Animation durations and easings
export const IOS_ANIMATIONS = {
  // Duration in milliseconds
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
  // Spring configurations for react-native-reanimated
  spring: {
    snappy: { damping: 20, stiffness: 300 },
    bouncy: { damping: 15, stiffness: 200 },
    gentle: { damping: 20, stiffness: 150 },
    stiff: { damping: 30, stiffness: 400 },
  },
} as const;

// iOS Touch targets and interaction areas
export const IOS_TOUCH = {
  minHeight: 44,
  minWidth: 44,
  listItemHeight: 44,
  compactListItemHeight: 38,
  largeListItemHeight: 56,
} as const;

// iOS Blur effects (for use with expo-blur)
export const IOS_BLUR = {
  light: 'light',
  dark: 'dark',
  chromeMaterial: 'chromeMaterial',
  material: 'systemMaterial',
  thinMaterial: 'systemThinMaterial',
  ultraThinMaterial: 'systemUltraThinMaterial',
  thickMaterial: 'systemThickMaterial',
} as const;

// iOS List insets (for grouped/inset grouped styles)
export const IOS_LIST_INSETS = {
  grouped: {
    marginHorizontal: 16,
    borderRadius: 10,
  },
  insetGrouped: {
    marginHorizontal: 16,
    borderRadius: 10,
  },
  plain: {
    marginHorizontal: 0,
    borderRadius: 0,
  },
} as const;

// Semantic colors for RegattaFlow (mapped to iOS colors)
export const REGATTA_SEMANTIC_COLORS = {
  // Race status colors
  raceUpcoming: IOS_COLORS.systemBlue,
  raceInProgress: IOS_COLORS.systemGreen,
  raceCompleted: IOS_COLORS.systemGray,
  raceCancelled: IOS_COLORS.systemRed,

  // Weather condition colors
  weatherGood: IOS_COLORS.systemGreen,
  weatherCaution: IOS_COLORS.systemOrange,
  weatherDanger: IOS_COLORS.systemRed,

  // Checklist status
  checklistComplete: IOS_COLORS.systemGreen,
  checklistPending: IOS_COLORS.systemOrange,
  checklistNotStarted: IOS_COLORS.systemGray,

  // Navigation
  tabActive: IOS_COLORS.systemBlue,
  tabInactive: IOS_COLORS.systemGray,

  // Coaching
  coachAvailable: IOS_COLORS.systemGreen,
  coachBusy: IOS_COLORS.systemOrange,
  coachOffline: IOS_COLORS.systemGray,
} as const;

// Export type helpers
export type IOSColor = keyof typeof IOS_COLORS;
export type IOSTypographyStyle = keyof typeof IOS_TYPOGRAPHY;
export type IOSSpacing = keyof typeof IOS_SPACING;
export type IOSRadius = keyof typeof IOS_RADIUS;
export type IOSShadow = keyof typeof IOS_SHADOWS;
