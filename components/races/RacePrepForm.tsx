/**
 * RacePrepForm Component
 *
 * Form for entering pre-race preparation notes and tuning settings.
 * Part of the Sailor Discovery feature - allows sailors to share
 * their race prep with fleet mates or publicly.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ChevronDown,
  History,
  Settings2,
  Sparkles,
  X,
} from 'lucide-react-native';
import { IOS_COLORS, IOS_SPACING, IOS_RADIUS, IOS_TYPOGRAPHY, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import { useRegattaContent, TuningSettings } from '@/hooks/useRegattaContent';
import { usePastTuningSettings } from '@/hooks/usePastTuningSettings';

// =============================================================================
// TYPES
// =============================================================================

export interface RacePrepFormProps {
  /** Regatta ID to save content to */
  regattaId: string;
  /** Race name for display */
  raceName?: string;
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when content is saved successfully */
  onSaved?: () => void;
}

// =============================================================================
// TUNING SETTINGS INPUTS
// =============================================================================

const TUNING_FIELDS = [
  { key: 'upper_shroud_tension', label: 'Upper Shroud Tension', placeholder: 'e.g., 28 on gauge' },
  { key: 'lower_shroud_tension', label: 'Lower Shroud Tension', placeholder: 'e.g., 24 on gauge' },
  { key: 'vang', label: 'Vang', placeholder: 'e.g., Loose upwind, tight downwind' },
  { key: 'cunningham', label: 'Cunningham', placeholder: 'e.g., Light air: off, Heavy: max' },
  { key: 'outhaul', label: 'Outhaul', placeholder: 'e.g., 1" from boom' },
  { key: 'backstay', label: 'Backstay', placeholder: 'e.g., Medium pre-bend' },
  { key: 'jib_car', label: 'Jib Car Position', placeholder: 'e.g., Hole 4' },
  { key: 'mast_rake', label: 'Mast Rake', placeholder: 'e.g., 25ft 8in' },
];

/**
 * Normalizes tuning settings from legacy format to new format for display
 * - Maps `kicker` to `vang` if vang is empty
 * - Maps single `shroud_tension` to upper/lower if not already split
 */
function normalizeSettingsForDisplay(settings: TuningSettings): TuningSettings {
  if (!settings) return {};

  const normalized: TuningSettings = { ...settings };

  // Map legacy kicker field to vang for display
  if (settings.kicker && !settings.vang) {
    normalized.vang = settings.kicker;
  }

  // If we have legacy shroud_tension but no split values, use it for display hint
  // We don't auto-populate because user should consciously set upper/lower
  return normalized;
}

/**
 * Gets a display value for a field, considering legacy mappings
 */
function getFieldValue(settings: TuningSettings, key: string): string {
  if (!settings) return '';

  const normalized = normalizeSettingsForDisplay(settings);
  return String(normalized[key] || '');
}

/**
 * Gets a hint from past settings for a field
 */
function getPastSettingHint(pastSettings: TuningSettings | null, key: string): string | null {
  if (!pastSettings) return null;

  const normalized = normalizeSettingsForDisplay(pastSettings);
  const value = normalized[key];

  // For shroud tension fields, also check legacy single field
  if ((key === 'upper_shroud_tension' || key === 'lower_shroud_tension') && !value) {
    const legacyValue = pastSettings.shroud_tension;
    if (legacyValue) {
      return `Last: ${legacyValue} (was single value)`;
    }
  }

  if (value && String(value).trim()) {
    return `Last: ${value}`;
  }

  return null;
}

function TuningSettingsInputs({
  value,
  onChange,
  pastSettings,
  pastRaceName,
  onApplyPastSettings,
}: {
  value: TuningSettings;
  onChange: (settings: TuningSettings) => void;
  pastSettings: TuningSettings | null;
  pastRaceName: string | null;
  onApplyPastSettings: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = useCallback((key: string, fieldValue: string) => {
    onChange({ ...value, [key]: fieldValue });
  }, [value, onChange]);

  // Count filled fields (using normalized values for accurate count)
  const filledCount = TUNING_FIELDS.filter(
    field => getFieldValue(value || {}, field.key).trim()
  ).length;

  // Truncate race name for display
  const truncatedRaceName = pastRaceName && pastRaceName.length > 25
    ? pastRaceName.substring(0, 22) + '...'
    : pastRaceName;

  return (
    <View style={styles.tuningContainer}>
      <Pressable
        style={styles.tuningHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Settings2 size={18} color={IOS_COLORS.systemOrange} />
        <Text style={styles.tuningHeaderText}>Tuning Settings</Text>
        {filledCount > 0 && (
          <View style={styles.tuningBadge}>
            <Text style={styles.tuningBadgeText}>{filledCount}</Text>
          </View>
        )}
        <ChevronDown
          size={16}
          color={IOS_COLORS.secondaryLabel}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }], marginLeft: 'auto' }}
        />
      </Pressable>

      {expanded && (
        <View style={styles.tuningFields}>
          {/* AI Suggestions Banner */}
          {pastSettings && pastRaceName && (
            <View style={styles.pastSettingsBanner}>
              <View style={styles.pastSettingsInfo}>
                <Sparkles size={16} color={IOS_COLORS.systemPurple} />
                <Text style={styles.pastSettingsText} numberOfLines={1}>
                  Use settings from {truncatedRaceName}
                </Text>
              </View>
              <Pressable
                style={styles.pastSettingsApplyButton}
                onPress={onApplyPastSettings}
              >
                <History size={14} color={IOS_COLORS.systemBackground} />
                <Text style={styles.pastSettingsApplyText}>Apply</Text>
              </Pressable>
            </View>
          )}

          {/* Tuning Fields */}
          {TUNING_FIELDS.map(field => {
            const currentValue = getFieldValue(value || {}, field.key);
            const pastHint = getPastSettingHint(pastSettings, field.key);

            return (
              <View key={field.key} style={styles.tuningField}>
                <View style={styles.tuningFieldLabelRow}>
                  <Text style={styles.tuningFieldLabel}>{field.label}</Text>
                  {pastHint && !currentValue && (
                    <Text style={styles.tuningFieldHint}>{pastHint}</Text>
                  )}
                </View>
                <TextInput
                  style={styles.tuningFieldInput}
                  value={currentValue}
                  onChangeText={(text) => handleChange(field.key, text)}
                  placeholder={pastHint || field.placeholder}
                  placeholderTextColor={pastHint ? IOS_COLORS.systemPurple : IOS_COLORS.tertiaryLabel}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RacePrepForm({
  regattaId,
  raceName,
  visible,
  onClose,
  onSaved,
}: RacePrepFormProps) {
  const {
    content,
    isLoading,
    isSaving,
    savePreRaceContent,
    refetch,
  } = useRegattaContent({ regattaId, onSaved });

  // Fetch past tuning settings for AI suggestions
  const {
    pastSettings,
    pastRaceName,
  } = usePastTuningSettings({
    excludeRegattaId: regattaId,
  });

  // Local form state
  const [prepNotes, setPrepNotes] = useState('');
  const [tuningSettings, setTuningSettings] = useState<TuningSettings>({});

  // Load existing content when modal opens
  useEffect(() => {
    if (visible && regattaId) {
      refetch();
    }
  }, [visible, regattaId, refetch]);

  // Sync local state with loaded content (with legacy normalization)
  useEffect(() => {
    if (content) {
      setPrepNotes(content.prepNotes || '');
      // Normalize legacy tuning settings when loading
      const loadedSettings = content.tuningSettings || {};
      const normalized: TuningSettings = { ...loadedSettings };

      // Map legacy kicker to vang if needed
      if (loadedSettings.kicker && !loadedSettings.vang) {
        normalized.vang = loadedSettings.kicker;
        // Don't keep the legacy field in the form state
        delete normalized.kicker;
      }

      setTuningSettings(normalized);
    }
  }, [content]);

  // Handler to apply past tuning settings
  const handleApplyPastSettings = useCallback(() => {
    if (!pastSettings) return;

    // Apply past settings, preserving any current values that are already filled
    const merged: TuningSettings = { ...tuningSettings };

    TUNING_FIELDS.forEach(field => {
      const pastValue = pastSettings[field.key];
      const currentValue = tuningSettings[field.key];

      // Only apply if current is empty and past has a value
      if ((!currentValue || !String(currentValue).trim()) && pastValue && String(pastValue).trim()) {
        merged[field.key] = pastValue;
      }
    });

    setTuningSettings(merged);
  }, [pastSettings, tuningSettings]);

  const handleSave = useCallback(async () => {
    const success = await savePreRaceContent({
      prepNotes,
      tuningSettings,
    });
    if (success) {
      onClose();
    }
  }, [prepNotes, tuningSettings, savePreRaceContent, onClose]);

  const hasChanges = prepNotes !== (content?.prepNotes || '') ||
    JSON.stringify(tuningSettings) !== JSON.stringify(content?.tuningSettings || {});

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <X size={24} color={IOS_COLORS.systemBlue} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Share Your Prep</Text>
            {raceName && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>{raceName}</Text>
            )}
          </View>
          <Pressable
            onPress={handleSave}
            style={[styles.headerButton, styles.saveButton]}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={IOS_COLORS.systemBackground} />
            ) : (
              <Text style={[
                styles.saveButtonText,
                (!hasChanges) && styles.saveButtonTextDisabled,
              ]}>
                Save
              </Text>
            )}
          </Pressable>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Prep Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Your Race Prep</Text>
              <Text style={styles.hint}>
                Share what you're focusing on - others racing similar conditions will learn from you
              </Text>
              <TextInput
                style={styles.textArea}
                value={prepNotes}
                onChangeText={setPrepNotes}
                placeholder="What are you focusing on for this race? Any equipment changes or repairs?"
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Tuning Settings */}
            <TuningSettingsInputs
              value={tuningSettings}
              onChange={setTuningSettings}
              pastSettings={pastSettings}
              pastRaceName={pastRaceName}
              onApplyPastSettings={handleApplyPastSettings}
            />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  headerButton: {
    padding: IOS_SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.md,
  },
  saveButtonText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },
  saveButtonTextDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.md,
  },
  loadingText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.lg,
  },
  section: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.lg,
    ...IOS_SHADOWS.sm,
  },
  label: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  hint: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.md,
  },
  textArea: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: IOS_TYPOGRAPHY.body.fontWeight,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
    minHeight: 120,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray5,
  },
  // Tuning styles
  tuningContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    overflow: 'hidden',
    ...IOS_SHADOWS.sm,
  },
  tuningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    padding: IOS_SPACING.lg,
  },
  tuningHeaderText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tuningBadge: {
    backgroundColor: IOS_COLORS.systemOrange,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 2,
    borderRadius: IOS_RADIUS.full,
  },
  tuningBadgeText: {
    ...IOS_TYPOGRAPHY.caption2,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },
  tuningFields: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },
  // Past settings suggestion banner
  pastSettingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${IOS_COLORS.systemPurple}15`,
    padding: IOS_SPACING.md,
    borderRadius: IOS_RADIUS.md,
    marginBottom: IOS_SPACING.sm,
  },
  pastSettingsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    flex: 1,
  },
  pastSettingsText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.systemPurple,
    flex: 1,
  },
  pastSettingsApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.systemPurple,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.xs,
    borderRadius: IOS_RADIUS.sm,
  },
  pastSettingsApplyText: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },
  tuningField: {
    gap: IOS_SPACING.xs,
  },
  tuningFieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tuningFieldLabel: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tuningFieldHint: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemPurple,
    fontStyle: 'italic',
  },
  tuningFieldInput: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: IOS_TYPOGRAPHY.body.fontWeight,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: IOS_RADIUS.sm,
    padding: IOS_SPACING.md,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray5,
  },
});

export default RacePrepForm;
