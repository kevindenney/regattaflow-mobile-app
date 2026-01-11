/**
 * Tufte-Style Crew Management Styles
 *
 * Design principles:
 * 1. Maximum data-ink ratio - remove decorative elements
 * 2. Typography hierarchy - use weight/size instead of boxes
 * 3. Inline status dots - small colored indicators
 * 4. Dense table layout - all data visible, scannable
 * 5. Whitespace separation - no background fills
 */

import { StyleSheet, Platform } from 'react-native';
import { TufteTokens, Typography } from '@/constants/designSystem';
import { IOS_COLORS } from '@/components/cards/constants';

// =============================================================================
// STATUS COLORS
// =============================================================================

export const STATUS_COLORS = {
  available: IOS_COLORS.green,
  unavailable: IOS_COLORS.gray,
  tentative: IOS_COLORS.orange,
  pending: IOS_COLORS.orange,
  active: IOS_COLORS.green,
  inactive: IOS_COLORS.gray,
} as const;

// =============================================================================
// ROLE ABBREVIATIONS (for dense display)
// =============================================================================

export const ROLE_ABBREVIATIONS: Record<string, string> = {
  helmsman: 'Helm',
  tactician: 'Tactics',
  trimmer: 'Trim',
  bowman: 'Bow',
  pit: 'Pit',
  grinder: 'Grind',
  other: 'Crew',
};

// =============================================================================
// TUFTE CREW STYLES
// =============================================================================

export const tufteCrewStyles = StyleSheet.create({
  // ---------------------------------------------------------------------------
  // CONTAINER
  // ---------------------------------------------------------------------------
  container: {
    backgroundColor: 'transparent',
    paddingVertical: TufteTokens.spacing.compact,
  },

  // ---------------------------------------------------------------------------
  // SECTION HEADER (Boat name + crew count marginalia)
  // ---------------------------------------------------------------------------
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: TufteTokens.spacing.tight,
    paddingHorizontal: TufteTokens.spacing.standard,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.color,
    marginBottom: TufteTokens.spacing.compact,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: 0.2,
  },
  sectionMeta: {
    ...TufteTokens.typography.tertiary,
    color: IOS_COLORS.secondaryLabel,
  },

  // ---------------------------------------------------------------------------
  // CREW LIST
  // ---------------------------------------------------------------------------
  crewList: {
    gap: 0, // Hairline borders provide separation
  },

  // ---------------------------------------------------------------------------
  // CREW ROW (Dense table-style layout)
  // ---------------------------------------------------------------------------
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.standard,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
    minHeight: 44, // Touch target minimum
  },
  crewRowLast: {
    borderBottomWidth: 0,
  },

  // Name column (primary info)
  nameColumn: {
    flex: 1,
    marginRight: TufteTokens.spacing.compact,
  },
  crewName: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 18,
  },
  crewEmail: {
    ...TufteTokens.typography.micro,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 1,
  },

  // Role column
  roleColumn: {
    width: 56,
    marginRight: TufteTokens.spacing.compact,
  },
  crewRole: {
    ...TufteTokens.typography.tertiary,
    color: IOS_COLORS.secondaryLabel,
  },

  // Status column (dots + label)
  statusColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    marginRight: TufteTokens.spacing.tight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusDotOutline: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    marginRight: 4,
  },
  statusLabel: {
    ...TufteTokens.typography.micro,
    color: IOS_COLORS.tertiaryLabel,
    textTransform: 'lowercase',
  },

  // Primary star indicator
  primaryStar: {
    marginLeft: 4,
  },

  // Actions column (menu)
  actionsColumn: {
    width: 32,
    alignItems: 'flex-end',
  },

  // ---------------------------------------------------------------------------
  // EMPTY STATE
  // ---------------------------------------------------------------------------
  emptyState: {
    paddingVertical: TufteTokens.spacing.section * 2,
    paddingHorizontal: TufteTokens.spacing.standard,
    alignItems: 'center',
  },
  emptyText: {
    ...TufteTokens.typography.secondary,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    marginBottom: TufteTokens.spacing.compact,
  },

  // ---------------------------------------------------------------------------
  // ADD CREW LINK (text-only, no button)
  // ---------------------------------------------------------------------------
  addCrewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.standard,
    minHeight: 44,
  },
  addCrewText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
    marginLeft: 4,
  },

  // ---------------------------------------------------------------------------
  // MODAL STYLES (Tufte form patterns)
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
  form: {
    gap: TufteTokens.spacing.section,
  },
  formGroup: {
    gap: TufteTokens.spacing.tight,
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
  formHelperText: {
    ...TufteTokens.typography.micro,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // ---------------------------------------------------------------------------
  // ROLE SELECTOR (Simple text list, not colored buttons)
  // ---------------------------------------------------------------------------
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TufteTokens.spacing.compact,
  },
  roleOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: TufteTokens.borders.color,
    borderRadius: TufteTokens.borderRadius.subtle,
    backgroundColor: 'transparent',
  },
  roleOptionSelected: {
    borderColor: IOS_COLORS.blue,
    backgroundColor: IOS_COLORS.blue + '10',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  roleOptionTextSelected: {
    color: IOS_COLORS.blue,
  },

  // ---------------------------------------------------------------------------
  // SUBMIT BUTTON (Minimal)
  // ---------------------------------------------------------------------------
  submitButton: {
    backgroundColor: IOS_COLORS.blue,
    paddingVertical: 14,
    borderRadius: TufteTokens.borderRadius.subtle,
    alignItems: 'center',
    marginTop: TufteTokens.spacing.section,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------
  loadingContainer: {
    paddingVertical: TufteTokens.spacing.section * 2,
    alignItems: 'center',
  },
});

// =============================================================================
// CALENDAR STYLES (for CrewAvailabilityCalendar)
// =============================================================================

export const tufteCalendarStyles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },

  // Month navigation
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.standard,
    marginBottom: TufteTokens.spacing.compact,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  monthNavButton: {
    padding: 8,
  },

  // Day headers
  dayHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: TufteTokens.spacing.compact,
    marginBottom: TufteTokens.spacing.tight,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    ...TufteTokens.typography.micro,
    color: IOS_COLORS.tertiaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Calendar grid
  calendarGrid: {
    paddingHorizontal: TufteTokens.spacing.compact,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.label,
  },
  dayTextToday: {
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  dayTextOutside: {
    color: IOS_COLORS.gray3,
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  daySelected: {
    backgroundColor: IOS_COLORS.blue,
    borderRadius: TufteTokens.borderRadius.subtle,
  },
  dayInRange: {
    backgroundColor: IOS_COLORS.blue + '20',
    borderRadius: 0,
  },

  // Status dots under dates
  statusDotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dayStatusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Legend (inline text, not boxed)
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.standard,
    borderTopWidth: TufteTokens.borders.hairline,
    borderTopColor: TufteTokens.borders.colorSubtle,
    marginTop: TufteTokens.spacing.compact,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    ...TufteTokens.typography.micro,
    color: IOS_COLORS.tertiaryLabel,
  },

  // Availability entries list
  entriesList: {
    marginTop: TufteTokens.spacing.section,
  },
  entriesHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: TufteTokens.spacing.standard,
    marginBottom: TufteTokens.spacing.tight,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TufteTokens.spacing.compact,
    paddingHorizontal: TufteTokens.spacing.standard,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
    minHeight: 44,
  },
  entryDateRange: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  entryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: TufteTokens.spacing.compact,
  },
  entryReason: {
    ...TufteTokens.typography.micro,
    color: IOS_COLORS.tertiaryLabel,
    flex: 1,
    marginLeft: TufteTokens.spacing.compact,
  },
  entryActions: {
    width: 32,
    alignItems: 'flex-end',
  },
});
