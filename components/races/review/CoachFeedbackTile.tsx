/**
 * CoachFeedbackTile - Apple Weather-inspired coach feedback widget
 *
 * Compact 155x155 pressable tile matching the RaceResultTile pattern.
 * Shows whether a coach has left feedback/annotations for this race.
 * Three visual states: no feedback, new (unread) feedback, read feedback.
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
import { MessageSquare, Check } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

export interface CoachFeedbackTileProps {
  /** Whether there is coach feedback */
  hasFeedback: boolean;
  /** Whether the feedback is new/unread */
  isNew: boolean;
  /** Preview of the feedback text */
  feedbackPreview?: string;
  /** Callback when tile is pressed */
  onPress: () => void;
}

export function CoachFeedbackTile({
  hasFeedback,
  isNew,
  feedbackPreview,
  onPress,
}: CoachFeedbackTileProps) {
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

  return (
    <AnimatedPressable
      style={[
        styles.tile,
        hasFeedback && styles.tileComplete,
        animatedStyle,
        Platform.OS !== 'web' && IOS_SHADOWS.card,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={
        hasFeedback
          ? isNew
            ? 'New coach feedback available'
            : 'View coach feedback'
          : 'No coach feedback yet'
      }
    >
      {/* Completion badge */}
      {hasFeedback && (
        <View style={styles.completeBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <MessageSquare size={12} color={COLORS.green} />
        <Text style={styles.headerLabel}>COACH</Text>
      </View>

      {/* Central content area */}
      <View style={styles.body}>
        {hasFeedback ? (
          isNew ? (
            <>
              <View style={styles.iconContainer}>
                <MessageSquare size={24} color={COLORS.green} />
                <View style={styles.newDot} />
              </View>
              {feedbackPreview ? (
                <Text style={styles.previewText} numberOfLines={2}>
                  {feedbackPreview}
                </Text>
              ) : (
                <Text style={styles.completeText}>Feedback</Text>
              )}
            </>
          ) : (
            <>
              <View style={styles.completeIcon}>
                <Check size={24} color={COLORS.green} />
              </View>
              {feedbackPreview ? (
                <Text style={styles.previewText} numberOfLines={2}>
                  {feedbackPreview}
                </Text>
              ) : (
                <Text style={styles.completeText}>Feedback</Text>
              )}
            </>
          )
        ) : (
          <>
            <MessageSquare size={24} color={COLORS.gray3} />
            <Text style={styles.noneText}>None</Text>
          </>
        )}
      </View>

      {/* Footer */}
      <Text style={styles.hint} numberOfLines={1}>
        {hasFeedback
          ? isNew
            ? 'New feedback'
            : 'View feedback'
          : 'No feedback yet'}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
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
    gap: 6,
  },
  // Icon with new dot badge
  iconContainer: {
    position: 'relative',
  },
  newDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  // Complete / read state
  completeIcon: {
    marginBottom: 2,
  },
  completeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  previewText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 15,
  },
  // No feedback state
  noneText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray3,
  },
  // Footer
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.blue,
  },
});

export default CoachFeedbackTile;
