/**
 * Season Picker Modal
 *
 * Simple picker for selecting which season to filter races by.
 * Shows:
 * - "All Races" option (no filter)
 * - Current active season (highlighted)
 * - Recent/past seasons
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';
import type { SeasonWithSummary, SeasonListItem } from '@/types/season';

// =============================================================================
// TYPES
// =============================================================================

export interface SeasonPickerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Currently selected season ID (null = All Races) */
  selectedSeasonId: string | null;
  /** Current active season */
  currentSeason: SeasonWithSummary | null;
  /** All user seasons */
  allSeasons: SeasonListItem[];
  /** Loading state */
  isLoading?: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when a season is selected */
  onSelectSeason: (seasonId: string | null) => void;
  /** Callback to open season settings (create/edit) */
  onManageSeasons: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SeasonPickerModal({
  visible,
  selectedSeasonId,
  currentSeason,
  allSeasons,
  isLoading,
  onClose,
  onSelectSeason,
  onManageSeasons,
}: SeasonPickerModalProps) {
  const handleSelectSeason = (seasonId: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectSeason(seasonId);
    onClose();
  };

  const handleManageSeasons = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    // Small delay to allow modal to close before opening settings
    setTimeout(() => {
      onManageSeasons();
    }, 100);
  };

  // Filter out archived seasons for cleaner list, keep active/completed
  const displaySeasons = allSeasons.filter(s => s.status !== 'archived');

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Season</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={IOS_COLORS.secondaryLabel}
                />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* All Races Option */}
              <TouchableOpacity
                style={[
                  styles.option,
                  selectedSeasonId === null && styles.optionSelected,
                ]}
                onPress={() => handleSelectSeason(null)}
              >
                <View style={styles.optionIconContainer}>
                  <MaterialCommunityIcons
                    name="calendar-multiple"
                    size={22}
                    color={selectedSeasonId === null ? IOS_COLORS.blue : IOS_COLORS.secondaryLabel}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionTitle,
                    selectedSeasonId === null && styles.optionTitleSelected,
                  ]}>
                    All Races
                  </Text>
                  <Text style={styles.optionSubtitle}>
                    Show races from all seasons
                  </Text>
                </View>
                {selectedSeasonId === null && (
                  <MaterialCommunityIcons
                    name="check"
                    size={22}
                    color={IOS_COLORS.blue}
                  />
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <Text style={styles.dividerText}>SEASONS</Text>
              </View>

              {/* Current Active Season (if exists) */}
              {currentSeason && (
                <TouchableOpacity
                  style={[
                    styles.option,
                    selectedSeasonId === currentSeason.id && styles.optionSelected,
                  ]}
                  onPress={() => handleSelectSeason(currentSeason.id)}
                >
                  <View style={[styles.optionIconContainer, styles.activeSeasonIcon]}>
                    <MaterialCommunityIcons
                      name="flag"
                      size={22}
                      color={IOS_COLORS.green}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <View style={styles.optionTitleRow}>
                      <Text style={[
                        styles.optionTitle,
                        selectedSeasonId === currentSeason.id && styles.optionTitleSelected,
                      ]}>
                        {currentSeason.name}
                      </Text>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    </View>
                    <Text style={styles.optionSubtitle}>
                      {currentSeason.summary.completed_races} of {currentSeason.summary.total_races} completed
                    </Text>
                  </View>
                  {selectedSeasonId === currentSeason.id && (
                    <MaterialCommunityIcons
                      name="check"
                      size={22}
                      color={IOS_COLORS.blue}
                    />
                  )}
                </TouchableOpacity>
              )}

              {/* Other Seasons */}
              {displaySeasons
                .filter(s => s.id !== currentSeason?.id)
                .map((season) => (
                  <TouchableOpacity
                    key={season.id}
                    style={[
                      styles.option,
                      selectedSeasonId === season.id && styles.optionSelected,
                    ]}
                    onPress={() => handleSelectSeason(season.id)}
                  >
                    <View style={styles.optionIconContainer}>
                      <MaterialCommunityIcons
                        name={season.status === 'completed' ? 'flag-checkered' : 'calendar'}
                        size={22}
                        color={selectedSeasonId === season.id ? IOS_COLORS.blue : IOS_COLORS.secondaryLabel}
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[
                        styles.optionTitle,
                        selectedSeasonId === season.id && styles.optionTitleSelected,
                      ]}>
                        {season.name}
                      </Text>
                      <Text style={styles.optionSubtitle}>
                        {season.completed_count} of {season.race_count} completed
                        {season.status === 'completed' && ' • Ended'}
                      </Text>
                    </View>
                    {selectedSeasonId === season.id && (
                      <MaterialCommunityIcons
                        name="check"
                        size={22}
                        color={IOS_COLORS.blue}
                      />
                    )}
                  </TouchableOpacity>
                ))}

              {/* No seasons message */}
              {!currentSeason && displaySeasons.length === 0 && (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="calendar-blank"
                    size={32}
                    color={IOS_COLORS.tertiaryLabel}
                  />
                  <Text style={styles.emptyStateText}>
                    No seasons yet
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Create a season to organize your races
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer - Manage Seasons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleManageSeasons}
              >
                <MaterialCommunityIcons
                  name="cog"
                  size={18}
                  color={IOS_COLORS.blue}
                />
                <Text style={styles.manageButtonText}>
                  {currentSeason ? 'Manage Season' : 'Create Season'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    maxHeight: '70%',
  },
  container: {
    backgroundColor: TUFTE_BACKGROUND,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  closeButton: {
    padding: 4,
  },

  // Content
  content: {
    maxHeight: 400,
  },

  // Option
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: IOS_COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  optionSelected: {
    backgroundColor: `${IOS_COLORS.blue}08`,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.tertiarySystemBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeSeasonIcon: {
    backgroundColor: `${IOS_COLORS.green}15`,
  },
  optionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  optionTitleSelected: {
    color: IOS_COLORS.blue,
  },
  optionSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: `${IOS_COLORS.green}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },

  // Divider
  divider: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.tertiarySystemBackground,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 4,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
});

export default SeasonPickerModal;
