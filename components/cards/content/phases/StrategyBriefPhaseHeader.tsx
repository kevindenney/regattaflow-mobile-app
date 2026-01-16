/**
 * StrategyBriefPhaseHeader
 *
 * Collapsible phase header for the Strategy Brief checklist.
 * Shows phase name, completion dots, and animated chevron.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

interface StrategyBriefPhaseHeaderProps {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  completedCount: number;
  totalCount: number;
}

export function StrategyBriefPhaseHeader({
  label,
  isExpanded,
  onToggle,
  completedCount,
  totalCount,
}: StrategyBriefPhaseHeaderProps) {
  // Animated rotation for chevron
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  // Generate completion dots
  const dots = [];
  for (let i = 0; i < totalCount; i++) {
    const isFilled = i < completedCount;
    dots.push(
      <View
        key={i}
        style={[
          styles.dot,
          isFilled ? styles.dotFilled : styles.dotEmpty,
        ]}
      />
    );
  }

  // Determine header color based on completion
  const isAllComplete = completedCount === totalCount;
  const hasProgress = completedCount > 0;

  return (
    <Pressable
      style={[styles.container, !isExpanded && styles.containerCollapsed]}
      onPress={onToggle}
    >
      {/* Chevron */}
      <Animated.View style={[
        styles.chevronContainer,
        !isExpanded && styles.chevronContainerCollapsed,
        { transform: [{ rotate }] }
      ]}>
        <ChevronDown size={18} color={isExpanded ? IOS_COLORS.gray : IOS_COLORS.secondaryLabel} />
      </Animated.View>

      {/* Phase Label + Tap Hint */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {!isExpanded && (
          <Text style={styles.tapHint}>Tap to expand</Text>
        )}
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Progress Count */}
      <Text style={[
        styles.progressText,
        isAllComplete && styles.progressComplete,
      ]}>
        {completedCount}/{totalCount}
      </Text>

      {/* Completion Dots */}
      <View style={styles.dotsContainer}>
        {dots}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
    borderRadius: 8,
  },
  containerCollapsed: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 2,
  },
  chevronContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronContainerCollapsed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
  },
  labelContainer: {
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },
  tapHint: {
    fontSize: 10,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
  spacer: {
    flex: 1,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  progressComplete: {
    color: IOS_COLORS.green,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotFilled: {
    backgroundColor: IOS_COLORS.green,
  },
  dotEmpty: {
    backgroundColor: IOS_COLORS.gray3,
  },
});
