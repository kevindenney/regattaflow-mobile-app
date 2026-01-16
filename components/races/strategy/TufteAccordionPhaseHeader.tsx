/**
 * TufteAccordionPhaseHeader - Tappable phase header with expand/collapse
 *
 * A more prominent phase header that doubles as an accordion toggle.
 * Displays phase name, progress indicator, and animated chevron.
 *
 * Follows Tufte principles while adding necessary touch affordance:
 * - Clear typography hierarchy (14px semibold vs previous 11px)
 * - Minimal decoration (subtle background when expanded)
 * - Information-dense progress badge
 */

import React, { useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { TufteTokens } from '@/constants/designSystem';

// Tufte-inspired colors with enhanced hierarchy
const COLORS = {
  text: '#3D3832', // Warm gray - primary
  secondaryText: '#6B7280', // Medium gray
  tertiaryText: '#9CA3AF', // Light gray
  chevron: '#9CA3AF', // Matches tertiary
  expandedBg: '#F5F3EF', // Subtle warm tint when expanded
  progressBadge: 'rgba(0, 0, 0, 0.04)', // Subtle neutral badge
  progressBadgeActive: '#E8F5E9', // Light green when has progress
  progressTextActive: '#2E7D32', // Green text
};

export interface TufteAccordionPhaseHeaderProps {
  /** Phase name to display (e.g., "START", "UPWIND") */
  phase: string;
  /** Whether this phase is currently expanded */
  isExpanded: boolean;
  /** Toggle callback */
  onToggle: () => void;
  /** Number of items with user plans */
  plannedCount: number;
  /** Total items in this phase */
  totalCount: number;
  /** Whether this is the first phase (no top margin) */
  isFirst?: boolean;
  /** Animation value (0-1) for smooth transitions */
  animationValue: Animated.Value;
}

export function TufteAccordionPhaseHeader({
  phase,
  isExpanded,
  onToggle,
  plannedCount,
  totalCount,
  isFirst = false,
  animationValue,
}: TufteAccordionPhaseHeaderProps) {
  const hasProgress = plannedCount > 0;
  const isComplete = plannedCount === totalCount;

  // Animated chevron rotation
  const chevronRotation = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Animated background opacity
  const backgroundOpacity = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.container, isFirst && styles.containerFirst]}>
      {/* Animated background */}
      <Animated.View
        style={[
          styles.expandedBackground,
          { opacity: backgroundOpacity },
        ]}
      />

      <TouchableOpacity
        style={[styles.header, !isExpanded && styles.headerCollapsed]}
        onPress={onToggle}
        activeOpacity={0.7}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${phase} section, ${plannedCount} of ${totalCount} planned`}
        accessibilityHint={`${isExpanded ? 'Collapse' : 'Expand'} to ${isExpanded ? 'hide' : 'show'} strategy items`}
        accessibilityState={{ expanded: isExpanded }}
      >
        {/* Left side: Phase label + tap hint */}
        <View style={styles.leftContainer}>
          <Text style={styles.label}>{phase.toUpperCase()}</Text>
          {!isExpanded && (
            <Text style={styles.tapHint}>Tap to expand</Text>
          )}
        </View>

        {/* Right side: progress badge + chevron */}
        <View style={styles.rightContainer}>
          {/* Progress badge */}
          <View
            style={[
              styles.progressBadge,
              hasProgress && styles.progressBadgeActive,
              isComplete && styles.progressBadgeComplete,
            ]}
          >
            <Text
              style={[
                styles.progressText,
                hasProgress && styles.progressTextActive,
                isComplete && styles.progressTextComplete,
              ]}
            >
              {plannedCount}/{totalCount} planned
            </Text>
          </View>

          {/* Animated chevron */}
          <Animated.View
            style={[
              styles.chevronContainer,
              !isExpanded && styles.chevronContainerCollapsed,
              { transform: [{ rotate: chevronRotation }] },
            ]}
          >
            <ChevronDown size={20} color={isExpanded ? COLORS.chevron : COLORS.text} />
          </Animated.View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    position: 'relative',
  },
  containerFirst: {
    marginTop: 8,
  },
  expandedBackground: {
    position: 'absolute',
    top: 0,
    left: -8,
    right: -8,
    bottom: 0,
    backgroundColor: COLORS.expandedBg,
    borderRadius: TufteTokens.borderRadius.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 48, // Touch-friendly tap target
    borderRadius: 8,
  },
  headerCollapsed: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  leftContainer: {
    flexDirection: 'column',
    gap: 2,
  },
  label: {
    fontSize: 14, // Upgraded from 11px
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  tapHint: {
    fontSize: 11,
    color: COLORS.tertiaryText,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.progressBadge,
  },
  progressBadgeActive: {
    backgroundColor: COLORS.progressBadgeActive,
  },
  progressBadgeComplete: {
    backgroundColor: '#C8E6C9', // Darker green for complete
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.secondaryText,
    fontVariant: ['tabular-nums'],
  },
  progressTextActive: {
    color: COLORS.progressTextActive,
  },
  progressTextComplete: {
    color: '#1B5E20', // Dark green for complete
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
});

export default TufteAccordionPhaseHeader;
