/**
 * Account Screen Styles — iOS HIG
 *
 * Apple Settings-style account screen with inset grouped lists.
 * Uses IOS_COLORS from design-tokens-ios for full HIG compliance.
 */

import { StyleSheet, Platform } from 'react-native';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING } from '@/lib/design-tokens-ios';

// =============================================================================
// STATUS COLORS
// =============================================================================

export const STATUS_COLORS = {
  active: IOS_COLORS.systemGreen,
  enabled: IOS_COLORS.systemGreen,
  inactive: IOS_COLORS.systemGray,
  disabled: IOS_COLORS.systemGray,
  pending: IOS_COLORS.systemOrange,
  stored: IOS_COLORS.systemOrange,
  warning: IOS_COLORS.systemOrange,
  error: IOS_COLORS.systemRed,
} as const;

// =============================================================================
// ICON COLORS — colored background squares for leading icons
// =============================================================================

export const ICON_BACKGROUNDS = {
  blue: IOS_COLORS.systemBlue,
  red: IOS_COLORS.systemRed,
  orange: IOS_COLORS.systemOrange,
  yellow: '#FF9500', // system orange (used for bulb)
  green: IOS_COLORS.systemGreen,
  teal: IOS_COLORS.systemTeal,
  purple: IOS_COLORS.systemPurple,
  gray: IOS_COLORS.systemGray,
} as const;

// =============================================================================
// ACCOUNT STYLES
// =============================================================================

export const accountStyles = StyleSheet.create({
  // ---------------------------------------------------------------------------
  // SCROLL CONTENT
  // ---------------------------------------------------------------------------
  scrollContent: {
    paddingBottom: 40,
  },

  // ---------------------------------------------------------------------------
  // PROFILE CARD (Apple ID–style)
  // ---------------------------------------------------------------------------
  profileCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    minHeight: 72,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: IOS_COLORS.systemBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: IOS_SPACING.md,
  },
  profileAvatarText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: IOS_TYPOGRAPHY.headline.fontWeight,
    lineHeight: IOS_TYPOGRAPHY.headline.lineHeight,
    color: IOS_COLORS.label,
  },
  profileSubtitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: IOS_TYPOGRAPHY.subhead.fontWeight,
    lineHeight: IOS_TYPOGRAPHY.subhead.lineHeight,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  profilePlaceholder: {
    color: IOS_COLORS.tertiaryLabel,
  },

  // ---------------------------------------------------------------------------
  // SIGN OUT ROW
  // ---------------------------------------------------------------------------
  signOutText: {
    color: IOS_COLORS.systemRed,
    textAlign: 'center',
  },

  // ---------------------------------------------------------------------------
  // APP INFO FOOTER
  // ---------------------------------------------------------------------------
  appInfo: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.xxl,
    paddingHorizontal: IOS_SPACING.lg,
  },
  appInfoText: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 2,
  },

  // ---------------------------------------------------------------------------
  // EMPTY STATE
  // ---------------------------------------------------------------------------
  emptyState: {
    paddingVertical: IOS_SPACING.lg,
    paddingHorizontal: IOS_SPACING.lg,
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  emptyText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },

  // ---------------------------------------------------------------------------
  // CLAIM WORKSPACE MODAL
  // ---------------------------------------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: IOS_SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : IOS_SPACING.lg,
    paddingHorizontal: IOS_SPACING.lg,
    maxHeight: '80%',
  },
  claimModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    marginBottom: IOS_SPACING.lg,
  },
  claimModalTitle: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: IOS_TYPOGRAPHY.headline.fontWeight,
    color: IOS_COLORS.label,
  },
  claimModalCloseButton: {
    padding: 4,
  },
  formGroup: {
    gap: IOS_SPACING.xs,
    marginBottom: IOS_SPACING.lg,
  },
  formLabel: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  formInput: {
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    color: IOS_COLORS.label,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    backgroundColor: IOS_COLORS.systemBlue,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: IOS_SPACING.lg,
  },
  primaryButtonText: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ---------------------------------------------------------------------------
  // TRAILING VALUE TEXT (for rows like "Free Plan", "English")
  // ---------------------------------------------------------------------------
  trailingValueText: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getStatusColor(status: keyof typeof STATUS_COLORS): string {
  return STATUS_COLORS[status] || IOS_COLORS.systemGray;
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function formatMemberSince(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return `Member since ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
}
