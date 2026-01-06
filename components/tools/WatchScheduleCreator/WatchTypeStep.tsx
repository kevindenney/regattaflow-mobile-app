/**
 * WatchTypeStep Component
 *
 * Step 1 of Watch Schedule Creator: Select watch rotation system.
 * Displays options for 4on/4off and 3on/3off with descriptions.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Clock, Check, ChevronRight, Users } from 'lucide-react-native';

import type { WatchSystem } from '@/types/watchSchedule';
import { WATCH_SYSTEM_OPTIONS } from '@/types/watchSchedule';

// =============================================================================
// iOS SYSTEM COLORS (Apple HIG)
// =============================================================================

const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#8E8E93',
  cardBackground: '#FFFFFF',
};

// =============================================================================
// TYPES
// =============================================================================

interface WatchTypeStepProps {
  selectedSystem: WatchSystem | null;
  onSelect: (system: WatchSystem) => void;
  onNext: () => void;
  canProceed: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function WatchTypeStep({
  selectedSystem,
  onSelect,
  onNext,
  canProceed,
}: WatchTypeStepProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose Your Watch System</Text>
          <Text style={styles.headerSubtitle}>
            Select how your crew will rotate watches during the race
          </Text>
        </View>

        {/* Watch System Options */}
        <View style={styles.optionsContainer}>
          {WATCH_SYSTEM_OPTIONS.map((option) => {
            const isSelected = selectedSystem === option.id;
            return (
              <Pressable
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => onSelect(option.id)}
              >
                {/* Selection indicator */}
                <View
                  style={[
                    styles.selectionCircle,
                    isSelected && styles.selectionCircleSelected,
                  ]}
                >
                  {isSelected && <Check size={16} color="#FFFFFF" />}
                </View>

                {/* Content */}
                <View style={styles.optionContent}>
                  {/* Title row */}
                  <View style={styles.optionTitleRow}>
                    <View style={styles.iconContainer}>
                      <Clock
                        size={20}
                        color={isSelected ? IOS_COLORS.purple : IOS_COLORS.gray}
                      />
                    </View>
                    <View style={styles.optionTitleContainer}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text
                        style={[
                          styles.optionSubtitle,
                          isSelected && styles.optionSubtitleSelected,
                        ]}
                      >
                        {option.subtitle}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.optionDescription}>{option.description}</Text>

                  {/* Crew recommendation */}
                  <View style={styles.crewRecommendation}>
                    <Users size={14} color={IOS_COLORS.gray2} />
                    <Text style={styles.crewRecommendationText}>
                      {option.recommendedCrew}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Watch Rotations Work</Text>
          <Text style={styles.infoText}>
            Two groups (Watch A and Watch B) alternate being on deck throughout the
            race. While one watch is on duty, the other rests below.
          </Text>
        </View>
      </ScrollView>

      {/* Footer with Next button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={!canProceed}
        >
          <Text
            style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}
          >
            Next
          </Text>
          <ChevronRight
            size={20}
            color={canProceed ? '#FFFFFF' : IOS_COLORS.gray2}
          />
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Header
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },

  // Options
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: IOS_COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: IOS_COLORS.purple,
    backgroundColor: '#FAF5FF',
  },

  // Selection indicator
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  selectionCircleSelected: {
    borderColor: IOS_COLORS.purple,
    backgroundColor: IOS_COLORS.purple,
  },

  // Option content
  optionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  optionSubtitleSelected: {
    color: IOS_COLORS.purple,
  },
  optionDescription: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
    marginBottom: 10,
  },

  // Crew recommendation
  crewRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  crewRecommendationText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Info card
  infoCard: {
    backgroundColor: IOS_COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: IOS_COLORS.gray6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.purple,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
  },
  nextButtonDisabled: {
    backgroundColor: IOS_COLORS.gray5,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: IOS_COLORS.gray2,
  },
});

export default WatchTypeStep;
