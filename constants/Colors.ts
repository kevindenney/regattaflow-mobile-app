import { colors as designSystemColors } from './designSystem';

/**
 * Legacy Expo-generated theme map used by a few system hooks (e.g. useThemeColor).
 * For new UI work prefer the semantic tokens defined in designSystem.ts.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

/**
 * Convenience wrapper that exposes semantic design tokens using
 * a simpler `colors.<token>.<alias>` API expected by a few older screens.
 * This keeps those screens working while we continue migrating them to the
 * fully-typed design system.
 */
export const colors = {
  ...designSystemColors,
  primary: {
    ...designSystemColors.primary,
    default: designSystemColors.primary[600],
    light: designSystemColors.primary[50],
    dark: designSystemColors.primary[700],
  },
  success: {
    ...designSystemColors.success,
    default: designSystemColors.success[600],
    light: designSystemColors.success[100],
    dark: designSystemColors.success[700],
  },
  warning: {
    ...designSystemColors.warning,
    default: designSystemColors.warning[600],
    light: designSystemColors.warning[100],
    dark: designSystemColors.warning[700],
  },
  error: {
    ...designSystemColors.danger,
    default: designSystemColors.danger[600],
    light: designSystemColors.danger[100],
    dark: designSystemColors.danger[700],
  },
  accent: {
    default: designSystemColors.ai[600],
    light: designSystemColors.ai[100],
    dark: designSystemColors.ai[700],
  },
  background: {
    ...designSystemColors.background,
    default: designSystemColors.background.primary,
    elevated: designSystemColors.background.tertiary,
  },
  border: {
    ...designSystemColors.border,
    default: designSystemColors.border.medium,
  },
} as const;
