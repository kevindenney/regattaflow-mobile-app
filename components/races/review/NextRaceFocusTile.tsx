/**
 * NextRaceFocusTile - Apple Weather-inspired next race focus widget
 *
 * Compact 155x155 pressable tile matching the RaceResultTile pattern.
 * Represents a deliberate practice loop where sailors rate their
 * previous focus and set a new one for the next race.
 *
 * When no focus is set yet, shows useful context:
 * - AI-suggested focus from race analysis
 * - Previous race focus that needs evaluation
 * - Focus progress stats
 *
 * Follows IOSWidgetCard animation (Reanimated scale 0.96 spring, haptics)
 * and IOSConditionsWidgets visual style.
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Target, Check, Sparkles, RotateCcw } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  purple: '#AF52DE',
  teal: '#0D9488',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

export interface NextRaceFocusTileProps {
  /** Whether a focus has been set from this race */
  hasFocusSet: boolean;
  /** Whether there's a previous focus to evaluate */
  hasPreviousFocus: boolean;
  /** Whether the previous focus has been evaluated */
  hasEvaluated: boolean;
  /** The current focus text (if set) */
  focusText?: string;
  /** AI-suggested focus from race analysis (shown as teaser before focus is set) */
  aiSuggestedFocus?: string;
  /** Previous focus text that needs evaluation */
  previousFocusText?: string;
  /** Callback when tile is pressed */
  onPress: () => void;
}

export function NextRaceFocusTile({
  hasFocusSet,
  hasPreviousFocus,
  hasEvaluated,
  focusText,
  aiSuggestedFocus,
  previousFocusText,
  onPress,
}: NextRaceFocusTileProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress();
  };

  const isComplete = hasFocusSet && (!hasPreviousFocus || hasEvaluated);

  // Partial: one of the two steps done but not both
  const stepsCompleted =
    (hasFocusSet ? 1 : 0) + (hasPreviousFocus && hasEvaluated ? 1 : 0);
  const isPartial = !isComplete && stepsCompleted > 0;

  const getHint = () => {
    if (isComplete) return 'View focus';
    if (isPartial) return 'Continue';
    if (hasPreviousFocus) return 'Rate & set new';
    return 'Set focus';
  };

  const getAccessibilityLabel = () => {
    if (isComplete) return `Next race focus complete: ${focusText ?? 'set'}`;
    if (isPartial) return 'Next race focus: 1 of 2 steps complete';
    if (aiSuggestedFocus) return `Set next race focus. Suggestion: ${aiSuggestedFocus}`;
    return 'Set next race focus';
  };

  // Render the pre-set "not started" body content
  const renderNotSetContent = () => {
    // Case 1: Has a previous focus to evaluate — show it
    if (hasPreviousFocus && previousFocusText) {
      return (
        <>
          <RotateCcw size={18} color={COLORS.orange} />
          <Text style={styles.contextLabel}>Last focus</Text>
          <Text style={styles.contextText} numberOfLines={2}>
            {previousFocusText}
          </Text>
        </>
      );
    }

    // Case 2: AI has a suggestion from analysis — show as teaser
    if (aiSuggestedFocus) {
      return (
        <>
          <Sparkles size={18} color={COLORS.purple} />
          <Text style={styles.contextLabel}>Suggested</Text>
          <Text style={styles.contextText} numberOfLines={2}>
            {aiSuggestedFocus}
          </Text>
        </>
      );
    }

    // Case 3: No context — show default empty state
    return (
      <>
        <Target size={24} color={COLORS.teal} />
        <Text style={styles.notSetText}>Pick a focus</Text>
      </>
    );
  };

  return (
    <AnimatedPressable
      style={[
        styles.tile,
        isComplete && styles.tileComplete,
        animatedStyle,
        Platform.OS !== 'web' && IOS_SHADOWS.card,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
    >
      {/* Completion badge */}
      {isComplete && (
        <View style={styles.completeBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <Target size={12} color={COLORS.teal} />
        <Text style={styles.headerLabel}>FOCUS</Text>
      </View>

      {/* Central content area */}
      <View style={styles.body}>
        {isComplete ? (
          <>
            <View style={styles.completeIcon}>
              <Check size={24} color={COLORS.green} />
            </View>
            {focusText ? (
              <Text style={styles.focusPreviewText} numberOfLines={2}>
                {focusText}
              </Text>
            ) : (
              <Text style={styles.completeText}>Focus set</Text>
            )}
          </>
        ) : isPartial ? (
          <>
            <View style={styles.countRow}>
              <Text style={styles.countLarge}>1</Text>
              <Text style={styles.countSuffix}>/2</Text>
            </View>
            <Target size={16} color={COLORS.teal} />
          </>
        ) : (
          renderNotSetContent()
        )}
      </View>

      {/* Footer */}
      <Text style={styles.hint} numberOfLines={1}>
        {getHint()}
      </Text>
    </AnimatedPressable>
  );
}

const TILE_SIZE = 155;

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    padding: 12,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
      },
      default: {},
    }),
  },
  tileComplete: {
    borderColor: `${COLORS.green}60`,
    backgroundColor: `${COLORS.green}06`,
  },
  completeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  // Not started state — context labels
  contextLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 14,
  },
  notSetText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  // Partial state
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  countLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.label,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  countSuffix: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  // Complete state
  completeIcon: {
    marginBottom: 2,
  },
  completeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  focusPreviewText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 15,
  },
  // Footer
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.blue,
  },
});

export default NextRaceFocusTile;
