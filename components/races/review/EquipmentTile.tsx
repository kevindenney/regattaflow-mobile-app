/**
 * EquipmentTile - Apple Weather-inspired equipment notes widget
 *
 * Compact 155x155 pressable tile matching the RaceResultTile pattern.
 * Shows whether equipment issues have been noted for this race.
 * Tapping opens the parent's equipment input flow.
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
import { Wrench, Check, AlertTriangle } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

export interface EquipmentTileProps {
  /** Number of equipment issues noted */
  issueCount: number;
  /** Issue descriptions to display inline */
  issues?: { description: string; priority: 'high' | 'medium' | 'low' }[];
  /** Whether there's a pending unsaved note */
  hasPendingNote: boolean;
  /** Callback when tile is pressed */
  onPress: () => void;
}

export function EquipmentTile({
  issueCount,
  issues = [],
  hasPendingNote,
  onPress,
}: EquipmentTileProps) {
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

  const hasIssues = issueCount > 0;

  return (
    <AnimatedPressable
      style={[
        styles.tile,
        hasIssues && styles.tileComplete,
        animatedStyle,
        Platform.OS !== 'web' && IOS_SHADOWS.card,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={
        hasIssues
          ? `Equipment: ${issueCount} issue${issueCount !== 1 ? 's' : ''} noted`
          : 'Note equipment issues'
      }
    >
      {/* Completion badge */}
      {hasIssues && (
        <View style={styles.completeBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <Wrench size={12} color={COLORS.blue} />
        <Text style={styles.headerLabel}>EQUIPMENT</Text>
      </View>

      {/* Central content area */}
      <View style={styles.body}>
        {hasIssues ? (
          issues.length > 0 ? (
            <View style={styles.issuesList}>
              {issues.slice(0, 3).map((issue, i) => (
                <View key={i} style={styles.issueRow}>
                  <AlertTriangle
                    size={10}
                    color={issue.priority === 'high' ? COLORS.orange : COLORS.gray}
                  />
                  <Text style={styles.issueText} numberOfLines={1}>
                    {issue.description}
                  </Text>
                </View>
              ))}
              {issueCount > 3 && (
                <Text style={styles.moreText}>
                  +{issueCount - 3} more
                </Text>
              )}
            </View>
          ) : (
            <>
              <View style={styles.completeIcon}>
                <AlertTriangle size={24} color={COLORS.orange} />
              </View>
              <Text style={styles.issueCountText}>
                {issueCount} issue{issueCount !== 1 ? 's' : ''}
              </Text>
            </>
          )
        ) : hasPendingNote ? (
          <>
            <Wrench size={24} color={COLORS.blue} />
            <Text style={styles.pendingText}>Drafting...</Text>
          </>
        ) : (
          <>
            <Check size={24} color={COLORS.green} />
            <Text style={styles.allGoodText}>All good</Text>
          </>
        )}
      </View>

      {/* Footer */}
      <Text style={styles.hint} numberOfLines={1}>
        {hasIssues ? 'View issues' : 'Note issues'}
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
  completeIcon: {
    marginBottom: 2,
  },
  issuesList: {
    width: '100%',
    gap: 4,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  issueText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    flex: 1,
  },
  moreText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.gray,
    marginTop: 1,
  },
  issueCountText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.orange,
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.blue,
  },
  allGoodText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.blue,
  },
});

export default EquipmentTile;
