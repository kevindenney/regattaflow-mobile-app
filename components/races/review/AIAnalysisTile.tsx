/**
 * AIAnalysisTile - Apple Weather-inspired AI analysis widget
 *
 * Compact 155x155 pressable tile matching the RaceResultTile pattern.
 * Shows AI analysis state: locked (prerequisites not met), ready to generate,
 * generating (spinner), complete (shows key insight).
 *
 * Follows IOSWidgetCard animation (Reanimated scale 0.96 spring, haptics)
 * and IOSConditionsWidgets visual style.
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Brain, Check, Lock, Sparkles } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

export interface AIAnalysisTileProps {
  /** Whether AI analysis has been generated */
  hasAnalysis: boolean;
  /** Whether prerequisites (result + debrief) are met */
  canGenerate: boolean;
  /** Whether analysis is currently being generated */
  isGenerating: boolean;
  /** Whether there was a generation error */
  hasError: boolean;
  /** Primary insight text to show when complete */
  insightText?: string;
  /** Whether the analysis was just newly generated */
  isNew?: boolean;
  /** Callback when tile is pressed */
  onPress: () => void;
}

export function AIAnalysisTile({
  hasAnalysis,
  canGenerate,
  isGenerating,
  hasError,
  insightText,
  isNew,
  onPress,
}: AIAnalysisTileProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = !hasAnalysis && !canGenerate;

  const handlePressIn = () => {
    if (!isDisabled) {
      scale.value = withSpring(0.96, IOS_ANIMATIONS.spring.snappy);
    }
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePress = () => {
    if (!isDisabled) {
      triggerHaptic('impactLight');
      onPress();
    }
  };

  const getHint = () => {
    if (hasAnalysis) return 'View insights';
    if (hasError) return 'Tap to retry';
    if (isGenerating) return 'Analyzing...';
    if (canGenerate) return 'Generate';
    return 'Complete debrief first';
  };

  const getAccessibilityLabel = () => {
    if (hasAnalysis) return 'AI analysis complete. View insights';
    if (isGenerating) return 'AI analysis generating';
    if (canGenerate) return 'Generate AI analysis';
    return 'AI analysis locked. Complete debrief first';
  };

  return (
    <AnimatedPressable
      style={[
        styles.tile,
        hasAnalysis && styles.tileComplete,
        animatedStyle,
        Platform.OS !== 'web' && IOS_SHADOWS.card,
        isDisabled && styles.tileDisabled,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled && !hasError}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
    >
      {/* Completion badge */}
      {hasAnalysis && (
        <View style={styles.completeBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <Brain size={12} color={isDisabled ? COLORS.gray3 : COLORS.purple} />
        <Text style={[styles.headerLabel, isDisabled && styles.headerLabelDisabled]}>
          AI ANALYSIS
        </Text>
        {isNew && (
          <View style={styles.newBadge}>
            <Sparkles size={8} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Central content area */}
      <View style={styles.body}>
        {hasAnalysis ? (
          <>
            <View style={styles.completeIcon}>
              <Check size={24} color={COLORS.green} />
            </View>
            {insightText ? (
              <Text style={styles.insightText} numberOfLines={2}>
                {insightText}
              </Text>
            ) : (
              <Text style={styles.completeText}>Generated</Text>
            )}
          </>
        ) : isGenerating ? (
          <>
            <ActivityIndicator size="small" color={COLORS.purple} />
            <Text style={styles.generatingText}>Analyzing</Text>
          </>
        ) : isDisabled ? (
          <>
            <Lock size={24} color={COLORS.gray3} />
            <Text style={styles.lockedText}>Locked</Text>
          </>
        ) : hasError ? (
          <>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorText}>Failed</Text>
          </>
        ) : (
          <>
            <Sparkles size={24} color={COLORS.purple} />
            <Text style={styles.readyText}>Ready</Text>
          </>
        )}
      </View>

      {/* Footer */}
      <Text
        style={[styles.hint, isDisabled && styles.hintDisabled]}
        numberOfLines={1}
      >
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
  tileDisabled: {
    opacity: 0.7,
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
  headerLabelDisabled: {
    color: COLORS.gray3,
  },
  newBadge: {
    backgroundColor: COLORS.purple,
    borderRadius: 6,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
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
  insightText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 15,
  },
  // Generating state
  generatingText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.purple,
  },
  // Locked state
  lockedText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray3,
  },
  // Ready state
  readyText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.purple,
  },
  // Error state
  errorIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF3B30',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF3B30',
  },
  // Footer
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.blue,
  },
  hintDisabled: {
    color: COLORS.gray,
  },
});

export default AIAnalysisTile;
