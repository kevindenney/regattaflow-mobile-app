/**
 * Tufte Form Styles
 *
 * Shared styles for the Tufte-style single-page Add Race form.
 * Follows Edward Tufte's design principles:
 * - Typography-driven hierarchy
 * - Minimal decoration
 * - High data-ink ratio
 */

import { StyleSheet, Platform } from 'react-native';
import { TUFTE_BACKGROUND, IOS_COLORS } from '@/components/cards/constants';

// =============================================================================
// COLOR TOKENS
// =============================================================================

export const TUFTE_FORM_COLORS = {
  // Backgrounds
  background: TUFTE_BACKGROUND,
  cardBackground: '#FFFFFF',
  inputBackground: '#FFFFFF',
  inputBackgroundDisabled: '#F9FAFB',

  // Text
  label: '#111827',
  secondaryLabel: '#6B7280',
  sectionLabel: '#8E8E93',
  placeholder: '#9CA3AF',
  error: '#DC2626',

  // Borders
  inputBorder: '#E5E7EB',
  inputBorderFocus: IOS_COLORS.blue,
  inputBorderError: '#DC2626',
  separator: '#F3F4F6',
  separatorSubtle: '#F9FAFB',

  // Accents
  primary: IOS_COLORS.blue,
  aiAccent: '#8B5CF6',
  success: '#16A34A',
} as const;

// =============================================================================
// SPACING TOKENS
// =============================================================================

export const TUFTE_FORM_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// =============================================================================
// SHARED STYLES
// =============================================================================

export const tufteFormStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: TUFTE_FORM_SPACING.lg,
    paddingBottom: 120, // Space for fixed footer
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    paddingVertical: TUFTE_FORM_SPACING.md,
    backgroundColor: TUFTE_BACKGROUND,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
  },
  headerSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 8,
  },
  headerSaveButtonDisabled: {
    opacity: 0.5,
  },
  headerSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Section Labels (Tufte typography)
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: TUFTE_FORM_SPACING.xl,
    marginBottom: TUFTE_FORM_SPACING.md,
  },
  sectionLabelFirst: {
    marginTop: TUFTE_FORM_SPACING.lg,
  },

  // Field Container
  fieldContainer: {
    marginBottom: TUFTE_FORM_SPACING.lg,
  },
  fieldContainerHalf: {
    flex: 1,
  },

  // Field Label
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.label,
    marginBottom: 6,
  },
  fieldLabelRequired: {
    color: TUFTE_FORM_COLORS.error,
  },

  // Input
  input: {
    backgroundColor: TUFTE_FORM_COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: TUFTE_FORM_COLORS.label,
  },
  inputFocused: {
    borderColor: TUFTE_FORM_COLORS.inputBorderFocus,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: TUFTE_FORM_COLORS.inputBorderError,
  },
  inputDisabled: {
    backgroundColor: TUFTE_FORM_COLORS.inputBackgroundDisabled,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Error Text
  errorText: {
    fontSize: 11,
    color: TUFTE_FORM_COLORS.error,
    marginTop: 4,
  },

  // Row Layout
  row: {
    flexDirection: 'row',
    gap: TUFTE_FORM_SPACING.md,
  },

  // Separator
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: TUFTE_FORM_COLORS.separator,
    marginVertical: TUFTE_FORM_SPACING.sm,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    paddingTop: TUFTE_FORM_SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : TUFTE_FORM_SPACING.lg,
    backgroundColor: TUFTE_BACKGROUND,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TUFTE_FORM_COLORS.separator,
  },
  footerCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  footerCancelText: {
    fontSize: 15,
    color: IOS_COLORS.blue,
  },
  footerSaveButton: {
    backgroundColor: IOS_COLORS.blue,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  footerSaveButtonDisabled: {
    opacity: 0.5,
  },
  footerSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // AI Extracted Indicator
  aiIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TUFTE_FORM_COLORS.aiAccent,
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -3,
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 8,
    padding: 2,
    marginBottom: TUFTE_FORM_SPACING.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  segmentTextActive: {
    color: TUFTE_FORM_COLORS.label,
    fontWeight: '600',
  },

  // Collapsible Section
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: TUFTE_FORM_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  collapsibleContent: {
    paddingTop: TUFTE_FORM_SPACING.md,
  },

  // Switch Row
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: TUFTE_FORM_SPACING.sm,
  },
  switchLabel: {
    fontSize: 15,
    color: TUFTE_FORM_COLORS.label,
  },
});

export default tufteFormStyles;
