/**
 * Step Detail Theme — warm cream/green palette matching the Pencil design.
 * Used exclusively by the Step detail screens (Plan/Act/Review tabs).
 */

export const STEP_COLORS = {
  // Backgrounds
  pageBg: '#F5F4F1',         // warm cream
  cardBg: '#FFFFFF',
  headerBg: '#FFFFFF',

  // Accent
  accent: '#3D8A5A',         // forest green
  accentLight: 'rgba(61,138,90,0.10)',
  accentMedium: 'rgba(61,138,90,0.18)',

  // Secondary accent
  coral: '#D89575',
  coralLight: 'rgba(216,149,117,0.12)',

  // Text
  label: '#1A1A1A',
  secondaryLabel: '#6B6B6B',
  tertiaryLabel: '#9E9E9E',
  onAccent: '#FFFFFF',

  // Borders & separators
  border: '#E8E6E1',
  cardBorder: '#ECEAE5',

  // Status
  complete: '#3D8A5A',
  completeLight: 'rgba(61,138,90,0.10)',
  pending: '#9E9E9E',

  // Tab control
  tabSelectedBg: '#3D8A5A',
  tabSelectedText: '#FFFFFF',
  tabUnselectedBg: 'transparent',
  tabUnselectedText: '#6B6B6B',
  tabBorder: '#D4D1CC',

  // Session badge
  badgeBg: 'rgba(61,138,90,0.10)',
  badgeText: '#3D8A5A',
} as const;
