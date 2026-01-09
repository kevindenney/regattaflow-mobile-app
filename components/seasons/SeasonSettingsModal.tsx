/**
 * Season Settings Modal
 *
 * Full settings modal for managing seasons:
 * - Create new season
 * - Edit current season (name, dates)
 * - End season with immediate prompt to start new one
 *
 * Follows Apple HIG patterns with Tufte-inspired typography.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';
import {
  useCreateSeason,
  useUpdateSeason,
  useCurrentSeason,
} from '@/hooks/useSeason';
import { SeasonService } from '@/services/SeasonService';
import type { SeasonWithSummary, CreateSeasonInput, UpdateSeasonInput } from '@/types/season';

// Only import DateTimePicker on native platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

// =============================================================================
// TYPES
// =============================================================================

export interface SeasonSettingsModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Current season (null for create mode) */
  season: SeasonWithSummary | null;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when season is created */
  onSeasonCreated?: (seasonId: string) => void;
  /** Callback when season is updated */
  onSeasonUpdated?: (seasonId: string) => void;
  /** Callback when season is ended */
  onSeasonEnded?: (seasonId: string) => void;
}

type ModalMode = 'create' | 'edit' | 'end-confirm' | 'create-after-end';

interface FormData {
  name: string;
  shortName: string;
  startDate: Date;
  endDate: Date;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SeasonSettingsModal({
  visible,
  season,
  onClose,
  onSeasonCreated,
  onSeasonUpdated,
  onSeasonEnded,
}: SeasonSettingsModalProps) {
  // Determine initial mode
  const initialMode: ModalMode = season ? 'edit' : 'create';
  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [endedSeasonName, setEndedSeasonName] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<FormData>(() =>
    getDefaultFormData(season)
  );

  // Date picker state
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Mutations
  const createSeason = useCreateSeason();
  const updateSeason = useUpdateSeason();

  // Reset state when modal opens/closes or season changes
  useEffect(() => {
    if (visible) {
      setMode(season ? 'edit' : 'create');
      setFormData(getDefaultFormData(season));
      setEndedSeasonName('');
    }
  }, [visible, season]);

  // Handle create season
  const handleCreate = useCallback(async () => {
    if (!formData.name.trim()) {
      Alert.alert('Name Required', 'Please enter a season name.');
      return;
    }

    const year = formData.startDate.getFullYear();
    const yearEnd =
      formData.endDate.getFullYear() !== year
        ? formData.endDate.getFullYear()
        : undefined;

    const input: CreateSeasonInput = {
      name: formData.name.trim(),
      short_name: formData.shortName.trim() || undefined,
      year,
      year_end: yearEnd,
      start_date: formData.startDate.toISOString().split('T')[0],
      end_date: formData.endDate.toISOString().split('T')[0],
    };

    try {
      const newSeason = await createSeason.mutateAsync(input);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSeasonCreated?.(newSeason.id);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create season. Please try again.');
    }
  }, [formData, createSeason, onSeasonCreated, onClose]);

  // Handle update season
  const handleUpdate = useCallback(async () => {
    if (!season) return;

    if (!formData.name.trim()) {
      Alert.alert('Name Required', 'Please enter a season name.');
      return;
    }

    const input: UpdateSeasonInput = {
      name: formData.name.trim(),
      short_name: formData.shortName.trim() || undefined,
      start_date: formData.startDate.toISOString().split('T')[0],
      end_date: formData.endDate.toISOString().split('T')[0],
    };

    try {
      await updateSeason.mutateAsync({ seasonId: season.id, input });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSeasonUpdated?.(season.id);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update season. Please try again.');
    }
  }, [season, formData, updateSeason, onSeasonUpdated, onClose]);

  // Handle end season confirmation
  const handleEndSeasonPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMode('end-confirm');
  }, []);

  // Handle confirmed end season
  const handleConfirmEndSeason = useCallback(async () => {
    if (!season) return;

    try {
      // Update status to completed
      await updateSeason.mutateAsync({
        seasonId: season.id,
        input: { status: 'completed' },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEndedSeasonName(season.name);
      onSeasonEnded?.(season.id);

      // Switch to create-after-end mode with smart defaults for next season
      const nextSeasonDefaults = getNextSeasonDefaults();
      setFormData(nextSeasonDefaults);
      setMode('create-after-end');
    } catch (error) {
      Alert.alert('Error', 'Failed to end season. Please try again.');
    }
  }, [season, updateSeason, onSeasonEnded]);

  // Handle date picker changes
  const handleStartDateChange = useCallback(
    (_event: any, date?: Date) => {
      setShowStartPicker(Platform.OS === 'ios');
      if (date) {
        setFormData((prev) => ({
          ...prev,
          startDate: date,
          // Auto-adjust end date if it's before new start date
          endDate: date > prev.endDate ? date : prev.endDate,
        }));
      }
    },
    []
  );

  const handleEndDateChange = useCallback((_event: any, date?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (date) {
      setFormData((prev) => ({ ...prev, endDate: date }));
    }
  }, []);

  // Skip creating new season after ending
  const handleSkipNewSeason = useCallback(() => {
    onClose();
  }, [onClose]);

  const isLoading = createSeason.isPending || updateSeason.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerButton}
              disabled={isLoading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {mode === 'create' && 'New Season'}
              {mode === 'edit' && 'Season Settings'}
              {mode === 'end-confirm' && 'End Season'}
              {mode === 'create-after-end' && 'Start New Season'}
            </Text>

            <TouchableOpacity
              onPress={
                mode === 'create' || mode === 'create-after-end'
                  ? handleCreate
                  : mode === 'edit'
                  ? handleUpdate
                  : undefined
              }
              style={styles.headerButton}
              disabled={
                isLoading ||
                mode === 'end-confirm' ||
                !formData.name.trim()
              }
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={IOS_COLORS.blue} />
              ) : (
                <Text
                  style={[
                    styles.saveText,
                    (mode === 'end-confirm' || !formData.name.trim()) &&
                      styles.saveTextDisabled,
                  ]}
                >
                  {mode === 'create' || mode === 'create-after-end'
                    ? 'Create'
                    : 'Save'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* End Confirm View */}
            {mode === 'end-confirm' && season && (
              <View style={styles.confirmSection}>
                <MaterialCommunityIcons
                  name="flag-checkered"
                  size={48}
                  color={IOS_COLORS.orange}
                  style={styles.confirmIcon}
                />
                <Text style={styles.confirmTitle}>
                  End "{season.name}"?
                </Text>
                <Text style={styles.confirmSubtitle}>
                  This season will be marked as completed. You can view it
                  anytime in your archive.
                </Text>

                {season.summary && (
                  <View style={styles.seasonStats}>
                    <Text style={styles.statsText}>
                      {season.summary.completed_races} of{' '}
                      {season.summary.total_races} races completed
                    </Text>
                  </View>
                )}

                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.confirmCancel}
                    onPress={() => setMode('edit')}
                  >
                    <Text style={styles.confirmCancelText}>Go Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmEnd}
                    onPress={handleConfirmEndSeason}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmEndText}>End Season</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Create After End - Success Message */}
            {mode === 'create-after-end' && endedSeasonName && (
              <View style={styles.successBanner}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={IOS_COLORS.green}
                />
                <Text style={styles.successText}>
                  "{endedSeasonName}" ended successfully
                </Text>
              </View>
            )}

            {/* Form Fields */}
            {mode !== 'end-confirm' && (
              <>
                {/* Season Name */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>SEASON NAME</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, name: text }))
                      }
                      placeholder="e.g., Winter Series 2025-26"
                      placeholderTextColor={IOS_COLORS.gray2}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Short Name */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>SHORT NAME (OPTIONAL)</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      value={formData.shortName}
                      onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, shortName: text }))
                      }
                      placeholder="e.g., W25"
                      placeholderTextColor={IOS_COLORS.gray2}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={10}
                    />
                  </View>
                  <Text style={styles.sectionHint}>
                    Used in compact displays
                  </Text>
                </View>

                {/* Date Range */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>DATE RANGE</Text>

                  {/* Start Date */}
                  <TouchableOpacity
                    style={styles.dateRow}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={styles.dateLabel}>Start</Text>
                    <View style={styles.dateValueContainer}>
                      <Text style={styles.dateValue}>
                        {formatDate(formData.startDate)}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={IOS_COLORS.gray2}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* End Date */}
                  <TouchableOpacity
                    style={[styles.dateRow, styles.dateRowLast]}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Text style={styles.dateLabel}>End</Text>
                    <View style={styles.dateValueContainer}>
                      <Text style={styles.dateValue}>
                        {formatDate(formData.endDate)}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={IOS_COLORS.gray2}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* End Season Button (only in edit mode) */}
                {mode === 'edit' && season && (
                  <View style={styles.dangerSection}>
                    <TouchableOpacity
                      style={styles.endSeasonButton}
                      onPress={handleEndSeasonPress}
                    >
                      <MaterialCommunityIcons
                        name="flag-checkered"
                        size={20}
                        color={IOS_COLORS.orange}
                      />
                      <Text style={styles.endSeasonText}>End Season</Text>
                    </TouchableOpacity>
                    <Text style={styles.dangerHint}>
                      Mark this season as complete and start a new one
                    </Text>
                  </View>
                )}

                {/* Skip button for create-after-end mode */}
                {mode === 'create-after-end' && (
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkipNewSeason}
                  >
                    <Text style={styles.skipText}>
                      Skip for now
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>

          {/* Date Pickers */}
          {showStartPicker && Platform.OS !== 'web' && DateTimePicker && (
            <DateTimePicker
              value={formData.startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
            />
          )}

          {showEndPicker && Platform.OS !== 'web' && DateTimePicker && (
            <DateTimePicker
              value={formData.endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndDateChange}
              minimumDate={formData.startDate}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getDefaultFormData(season: SeasonWithSummary | null): FormData {
  if (season) {
    return {
      name: season.name,
      shortName: season.short_name || '',
      startDate: new Date(season.start_date),
      endDate: new Date(season.end_date),
    };
  }

  // Smart defaults for new season
  return getNextSeasonDefaults();
}

function getNextSeasonDefaults(): FormData {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();

  let seasonName: string;
  let startDate: Date;
  let endDate: Date;
  let shortName: string;

  // Determine season based on current month
  if (month >= 10 || month <= 2) {
    // Winter (Nov-Mar)
    const seasonStartYear = month >= 10 ? year : year - 1;
    const seasonEndYear = month >= 10 ? year + 1 : year;
    seasonName = `Winter ${seasonStartYear}-${String(seasonEndYear).slice(-2)}`;
    shortName = `W${String(seasonEndYear).slice(-2)}`;
    startDate = new Date(seasonStartYear, 10, 1); // Nov 1
    endDate = new Date(seasonEndYear, 2, 31); // Mar 31
  } else if (month >= 3 && month <= 4) {
    // Spring (Mar-May)
    seasonName = `Spring ${year}`;
    shortName = `Sp${String(year).slice(-2)}`;
    startDate = new Date(year, 2, 1); // Mar 1
    endDate = new Date(year, 4, 31); // May 31
  } else if (month >= 5 && month <= 7) {
    // Summer (Jun-Aug)
    seasonName = `Summer ${year}`;
    shortName = `Su${String(year).slice(-2)}`;
    startDate = new Date(year, 5, 1); // Jun 1
    endDate = new Date(year, 7, 31); // Aug 31
  } else {
    // Fall (Sep-Nov)
    seasonName = `Fall ${year}`;
    shortName = `F${String(year).slice(-2)}`;
    startDate = new Date(year, 8, 1); // Sep 1
    endDate = new Date(year, 10, 30); // Nov 30
  }

  return {
    name: seasonName,
    shortName,
    startDate,
    endDate,
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray4,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  cancelText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    textAlign: 'right',
  },
  saveTextDisabled: {
    color: IOS_COLORS.gray2,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: IOS_COLORS.gray2,
    marginTop: 6,
    paddingLeft: 4,
  },

  // Input
  inputRow: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    fontSize: 17,
    color: IOS_COLORS.label,
  },

  // Date rows
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: IOS_COLORS.systemBackground,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  dateRowLast: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomWidth: 0,
  },
  dateLabel: {
    fontSize: 17,
    color: IOS_COLORS.label,
  },
  dateValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateValue: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },

  // Danger section
  dangerSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray4,
  },
  endSeasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    paddingVertical: 14,
  },
  endSeasonText: {
    fontSize: 17,
    fontWeight: '500',
    color: IOS_COLORS.orange,
  },
  dangerHint: {
    fontSize: 13,
    color: IOS_COLORS.gray2,
    textAlign: 'center',
    marginTop: 8,
  },

  // Confirm section
  confirmSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  confirmIcon: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  seasonStats: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
  },
  statsText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    width: '100%',
  },
  confirmCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray5,
  },
  confirmCancelText: {
    fontSize: 17,
    fontWeight: '500',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  confirmEnd: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.orange,
  },
  confirmEndText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },

  // Success banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
  },
  successText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.green,
    flex: 1,
  },

  // Skip button
  skipButton: {
    paddingVertical: 16,
    marginTop: 16,
  },
  skipText: {
    fontSize: 15,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
});

export default SeasonSettingsModal;
