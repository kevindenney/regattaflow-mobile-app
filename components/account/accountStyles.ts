/**
 * Tufte-Style Account Screen Styles
 *
 * Design principles:
 * 1. Maximum data-ink ratio - remove decorative elements
 * 2. Typography hierarchy - use weight/size instead of boxes
 * 3. Inline status dots - small colored indicators
 * 4. Dense row layout - all data visible, scannable
 * 5. Whitespace separation - no background fills
 */

import { StyleSheet, Platform } from 'react-native';
import { TufteTokens } from '@/constants/designSystem';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';

// =============================================================================
// STATUS COLORS
// =============================================================================

export const STATUS_COLORS = {
  active: IOS_COLORS.green,
  enabled: IOS_COLORS.green,
  inactive: IOS_COLORS.gray,
  disabled: IOS_COLORS.gray,
  pending: IOS_COLORS.orange,
  stored: IOS_COLORS.orange,
  warning: IOS_COLORS.orange,
  error: IOS_COLORS.red,
} as const;

// =============================================================================
// TUFTE ACCOUNT STYLES
// =============================================================================

export const tufteAccountStyles = StyleSheet.create({
  // ---------------------------------------------------------------------------
  // CONTAINER
  // ---------------------------------------------------------------------------
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ---------------------------------------------------------------------------
  // PROFILE HEADER
  // ---------------------------------------------------------------------------
  profileHeader: {
    paddingVertical: TufteTokens.spacing.section,
    paddingHorizontal: TufteTokens.spacing.section,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.color,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: IOS_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: TufteTokens.spacing.standard,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 2,
  },
  profileMeta: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // ---------------------------------------------------------------------------
  // SECTION HEADER (UPPERCASE label with hairline)
  // ---------------------------------------------------------------------------
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: TufteTokens.spacing.section * 1.5,
    paddingBottom: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.section,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.color,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // ---------------------------------------------------------------------------
  // SETTING ROW (Dense layout)
  // ---------------------------------------------------------------------------
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: TufteTokens.spacing.standard,
    paddingHorizontal: TufteTokens.spacing.section,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
    minHeight: 44, // Touch target minimum
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingRowDanger: {
    backgroundColor: 'transparent',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.label,
    flex: 1,
  },
  settingLabelDanger: {
    color: IOS_COLORS.red,
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginRight: TufteTokens.spacing.tight,
  },
  settingChevron: {
    fontSize: 15,
    color: IOS_COLORS.gray3,
  },

  // ---------------------------------------------------------------------------
  // DATA ROW (Label + Value inline)
  // ---------------------------------------------------------------------------
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.section,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
    minHeight: 40,
  },
  dataRowLast: {
    borderBottomWidth: 0,
  },
  dataLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  dataValueWithStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // ---------------------------------------------------------------------------
  // STATUS DOT
  // ---------------------------------------------------------------------------
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotOutline: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },

  // ---------------------------------------------------------------------------
  // BOAT ROW (Name + Class + Status)
  // ---------------------------------------------------------------------------
  boatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.section,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
    minHeight: 44,
  },
  boatInfo: {
    flex: 1,
  },
  boatName: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  boatClass: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  boatStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  boatStatusText: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
  },

  // ---------------------------------------------------------------------------
  // TOGGLE ROW (with Switch)
  // ---------------------------------------------------------------------------
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.section,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
    minHeight: 44,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.label,
  },
  toggleValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleValueText: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },

  // ---------------------------------------------------------------------------
  // APP INFO FOOTER
  // ---------------------------------------------------------------------------
  appInfo: {
    alignItems: 'center',
    paddingVertical: TufteTokens.spacing.section * 2,
    paddingHorizontal: TufteTokens.spacing.section,
  },
  appInfoText: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
    marginBottom: 2,
  },

  // ---------------------------------------------------------------------------
  // EMPTY STATE
  // ---------------------------------------------------------------------------
  emptyState: {
    paddingVertical: TufteTokens.spacing.section,
    paddingHorizontal: TufteTokens.spacing.section,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },

  // ---------------------------------------------------------------------------
  // MODAL STYLES
  // ---------------------------------------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: TufteTokens.borderRadius.subtle,
    borderTopRightRadius: TufteTokens.borderRadius.subtle,
    paddingTop: TufteTokens.spacing.section,
    paddingBottom: Platform.OS === 'ios' ? 34 : TufteTokens.spacing.section,
    paddingHorizontal: TufteTokens.spacing.section,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: TufteTokens.spacing.standard,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.color,
    marginBottom: TufteTokens.spacing.section,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  modalCloseButton: {
    padding: 4,
  },

  // ---------------------------------------------------------------------------
  // FORM STYLES (Tufte)
  // ---------------------------------------------------------------------------
  formGroup: {
    gap: TufteTokens.spacing.tight,
    marginBottom: TufteTokens.spacing.section,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  formInput: {
    borderWidth: 1,
    borderColor: TufteTokens.borders.color,
    borderRadius: TufteTokens.borderRadius.subtle,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: IOS_COLORS.label,
    backgroundColor: 'transparent',
  },
  formInputFocused: {
    borderColor: IOS_COLORS.blue,
  },

  // ---------------------------------------------------------------------------
  // ACTION BUTTONS
  // ---------------------------------------------------------------------------
  primaryButton: {
    backgroundColor: IOS_COLORS.blue,
    paddingVertical: 14,
    borderRadius: TufteTokens.borderRadius.subtle,
    alignItems: 'center',
    marginTop: TufteTokens.spacing.section,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: TufteTokens.borderRadius.subtle,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TufteTokens.borders.color,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getStatusColor(status: keyof typeof STATUS_COLORS): string {
  return STATUS_COLORS[status] || IOS_COLORS.gray;
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
