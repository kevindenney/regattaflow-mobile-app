/**
 * AddStepSheet
 *
 * Suggestion-driven modal sheet that replaces the flat "+" menu.
 * Surfaces the next logical step from subscribed blueprints,
 * org templates, and freeform creation options.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_SHADOWS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { useInterestEventConfig } from '@/hooks/useInterestEventConfig';

import type { BlueprintSuggestedNextStep } from '@/types/blueprint';

interface AddStepSheetProps {
  visible: boolean;
  onClose: () => void;
  suggestedNextSteps: BlueprintSuggestedNextStep[];
  onAdoptSuggestion: (s: BlueprintSuggestedNextStep) => void;
  onDismissSuggestion: (s: BlueprintSuggestedNextStep) => void;
  onAddStep: () => void;
  onAddRace?: () => void;
  onPublishBlueprint?: () => void;
  blueprintLabel?: string;
}

export function AddStepSheet({
  visible,
  onClose,
  suggestedNextSteps,
  onAdoptSuggestion,
  onDismissSuggestion,
  onAddStep,
  onAddRace,
  onPublishBlueprint,
  blueprintLabel,
}: AddStepSheetProps) {
  const config = useInterestEventConfig();

  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);

  React.useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 200 });
      scaleAnim.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
    } else {
      fadeAnim.value = withTiming(0, { duration: 150 });
      scaleAnim.value = withTiming(0.95, { duration: 150 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const handleOption = (action: () => void) => {
    onClose();
    setTimeout(action, 100);
  };

  const hasSuggestions = suggestedNextSteps.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.container, containerStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add to Timeline</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons name="close-circle" size={24} color={IOS_COLORS.systemGray3} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Suggested Next Section */}
            {hasSuggestions && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Suggested Next</Text>
                {suggestedNextSteps.slice(0, 2).map((suggestion) => {
                  const progressFraction =
                    suggestion.total_steps > 0
                      ? (suggestion.adopted_count + suggestion.dismissed_count) /
                        suggestion.total_steps
                      : 0;
                  const stepNumber = suggestion.adopted_count + suggestion.dismissed_count + 1;

                  return (
                    <View key={suggestion.next_step_id} style={styles.suggestionCard}>
                      <View style={styles.suggestionHeader}>
                        <View style={styles.suggestionMeta}>
                          <Text style={styles.suggestionBlueprintName} numberOfLines={1}>
                            {suggestion.blueprint_title}
                          </Text>
                          {suggestion.author_name && (
                            <Text style={styles.suggestionAuthor}>
                              by {suggestion.author_name}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.suggestionProgress}>
                          Step {stepNumber} of {suggestion.total_steps}
                        </Text>
                      </View>

                      {/* Progress bar */}
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.min(progressFraction * 100, 100)}%` },
                          ]}
                        />
                      </View>

                      <Text style={styles.suggestionStepTitle} numberOfLines={2}>
                        {suggestion.next_step_title}
                      </Text>
                      {suggestion.next_step_description && (
                        <Text style={styles.suggestionStepDesc} numberOfLines={2}>
                          {suggestion.next_step_description}
                        </Text>
                      )}

                      <View style={styles.suggestionActions}>
                        <TouchableOpacity
                          style={styles.adoptButton}
                          onPress={() => handleOption(() => onAdoptSuggestion(suggestion))}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add-circle" size={16} color="#fff" />
                          <Text style={styles.adoptButtonText}>Add to Timeline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.skipButton}
                          onPress={() => onDismissSuggestion(suggestion)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.skipButtonText}>Skip</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Hint when no suggestions */}
            {!hasSuggestions && (
              <View style={styles.emptyHint}>
                <Ionicons name="sparkles-outline" size={16} color={IOS_COLORS.systemBlue} />
                <Text style={styles.emptyHintText}>
                  Subscribe to a program to get personalized step suggestions here.
                </Text>
              </View>
            )}

            {/* Create Your Own Section */}
            <View style={styles.section}>
              {hasSuggestions && <View style={styles.sectionSeparator} />}
              <Text style={styles.sectionTitle}>Create Your Own</Text>

              {/* Add Step */}
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => handleOption(onAddStep)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.menuOptionIcon,
                    { backgroundColor: `${IOS_COLORS.systemTeal}15` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="plus-circle-outline"
                    size={24}
                    color={IOS_COLORS.systemTeal}
                  />
                </View>
                <View style={styles.menuOptionContent}>
                  <Text style={styles.menuOptionTitle}>Add Step</Text>
                  <Text style={styles.menuOptionSubtitle}>
                    Plan what to work on — training, prep, or goals
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={IOS_COLORS.systemGray3} />
              </TouchableOpacity>

              {/* Add Race / Event */}
              {onAddRace && (
                <>
                  <View style={styles.optionSeparator} />
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => handleOption(onAddRace)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuOptionIcon,
                        { backgroundColor: `${IOS_COLORS.systemBlue}15` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="flag-checkered"
                        size={24}
                        color={IOS_COLORS.systemBlue}
                      />
                    </View>
                    <View style={styles.menuOptionContent}>
                      <Text style={styles.menuOptionTitle}>{config.addEventLabel}</Text>
                      <Text style={styles.menuOptionSubtitle}>
                        Full setup — venue, wind, tides, boat & tuning
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={IOS_COLORS.systemGray3} />
                  </TouchableOpacity>
                </>
              )}

              {/* Publish as Blueprint */}
              {onPublishBlueprint && (
                <>
                  <View style={styles.optionSeparator} />
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => handleOption(onPublishBlueprint)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuOptionIcon,
                        { backgroundColor: 'rgba(0,137,123,0.1)' },
                      ]}
                    >
                      <Ionicons name="layers-outline" size={24} color="#00897B" />
                    </View>
                    <View style={styles.menuOptionContent}>
                      <Text style={styles.menuOptionTitle}>{blueprintLabel ?? 'Publish as Blueprint'}</Text>
                      <Text style={styles.menuOptionSubtitle}>
                        Make your timeline subscribable for others
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={IOS_COLORS.systemGray3} />
                  </TouchableOpacity>
                </>
              )}

            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.xl,
  },
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    ...(Platform.OS === 'ios' ? IOS_SHADOWS.card : {}),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.md,
  },
  title: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: IOS_TYPOGRAPHY.title3.fontWeight as any,
    color: IOS_COLORS.label,
  },
  closeButton: {
    padding: IOS_SPACING.xs,
    marginRight: -IOS_SPACING.xs,
  },
  scrollBody: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: IOS_SPACING.lg,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: IOS_SPACING.lg,
    marginTop: IOS_SPACING.xs,
    marginBottom: IOS_SPACING.sm,
    padding: IOS_SPACING.md,
    backgroundColor: `${IOS_COLORS.systemBlue}08`,
    borderRadius: IOS_RADIUS.md,
  },
  emptyHintText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  section: {
    paddingTop: IOS_SPACING.xs,
  },
  sectionTitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    fontWeight: '700',
    color: IOS_COLORS.secondaryLabel,
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginHorizontal: IOS_SPACING.lg,
    marginTop: IOS_SPACING.sm,
    marginBottom: IOS_SPACING.md,
  },

  // Suggestion card styles
  suggestionCard: {
    marginHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
    backgroundColor: '#fff',
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }
      : { elevation: 1 }),
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  suggestionMeta: {
    flex: 1,
    marginRight: IOS_SPACING.sm,
  },
  suggestionBlueprintName: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  suggestionAuthor: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  suggestionProgress: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: IOS_COLORS.systemGray5,
    borderRadius: 1.5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 1.5,
  },
  suggestionStepTitle: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  suggestionStepDesc: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
    marginBottom: 10,
  },
  suggestionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adoptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  adoptButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Menu option styles (reused from RacesFloatingHeader pattern)
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
  },
  menuOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: IOS_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionContent: {
    flex: 1,
    marginLeft: IOS_SPACING.md,
    marginRight: IOS_SPACING.sm,
  },
  menuOptionTitle: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  menuOptionSubtitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  optionSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginHorizontal: IOS_SPACING.lg,
    marginLeft: 76,
  },
  subtypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
  },
  subtypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${IOS_COLORS.systemTeal}10`,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.systemTeal}25`,
  },
  subtypeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.systemTeal,
  },
});

export default AddStepSheet;
