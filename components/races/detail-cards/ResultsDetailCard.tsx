/**
 * Results Detail Card
 * Expandable card showing race finishing position and performance
 * Collapsed: Header + position + points
 * Expanded: Full results with series context and trends
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { CARD_EXPAND_DURATION, CARD_COLLAPSE_DURATION } from '@/constants/navigationAnimations';
import { IOS_COLORS } from '@/components/cards/constants';
import type { RaceResultData } from './index';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ResultsDetailCardProps {
  raceId: string;
  result?: RaceResultData | null;
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getTrendIndicator(
  position: number,
  averagePosition?: number
): { icon: 'trending-up' | 'trending-down' | 'trending-neutral'; color: string; label: string } | null {
  if (averagePosition === undefined) return null;
  const diff = averagePosition - position;
  if (diff > 1) return { icon: 'trending-up', color: IOS_COLORS.green, label: 'Above average' };
  if (diff < -1) return { icon: 'trending-down', color: IOS_COLORS.orange, label: 'Below average' };
  return { icon: 'trending-neutral', color: IOS_COLORS.secondaryLabel, label: 'Typical result' };
}

function getPositionColor(position: number): string {
  if (position === 1) return IOS_COLORS.orange;  // Gold
  if (position === 2) return IOS_COLORS.gray;    // Silver
  if (position === 3) return '#CD7F32';          // Bronze (keep traditional)
  return IOS_COLORS.label;
}

function getStatusLabel(status?: string): string | null {
  switch (status) {
    case 'dnf': return 'Did Not Finish';
    case 'dns': return 'Did Not Start';
    case 'dsq': return 'Disqualified';
    case 'ocs': return 'On Course Side';
    case 'ret': return 'Retired';
    default: return null;
  }
}

export function ResultsDetailCard({
  raceId,
  result,
  isExpanded = false,
  onToggle,
  onPress,
}: ResultsDetailCardProps) {
  const hasResult = result && result.position > 0;
  const isPodium = hasResult && result.position <= 3;
  const trend = hasResult ? getTrendIndicator(result.position, result.averagePosition) : null;
  const statusLabel = result?.status ? getStatusLabel(result.status) : null;
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? CARD_EXPAND_DURATION : CARD_COLLAPSE_DURATION,
    });
  }, [isExpanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => {
    'worklet';
    const rotationValue = rotation.value ?? 0;
    return {
      transform: [{ rotate: `${interpolate(rotationValue, [0, 1], [0, 90])}deg` }],
    };
  });

  const handlePress = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: isExpanded ? CARD_COLLAPSE_DURATION : CARD_EXPAND_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    if (onToggle) onToggle();
    else if (onPress) onPress();
  }, [isExpanded, onToggle, onPress]);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, isPodium && styles.headerIconPodium]}>
          <MaterialCommunityIcons
            name={isPodium ? 'trophy' : 'flag-checkered'}
            size={18}
            color={isPodium ? IOS_COLORS.orange : IOS_COLORS.blue}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Results</Text>
          <Text style={styles.headerSubtitle}>Race finish & performance</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={IOS_COLORS.gray} />
        </Animated.View>
      </View>

      {hasResult ? (
        <>
          {/* Collapsed: Position preview */}
          {!isExpanded && (
            <View style={styles.collapsedContent}>
              <View style={styles.positionBadge}>
                <Text style={[styles.positionText, { color: getPositionColor(result.position) }]}>
                  {getOrdinalSuffix(result.position)}
                </Text>
                <Text style={styles.fleetText}>of {result.fleetSize}</Text>
              </View>
              <View style={styles.pointsChip}>
                <Text style={styles.pointsValue}>{result.points}</Text>
                <Text style={styles.pointsLabel}>pts</Text>
              </View>
            </View>
          )}

          {/* Expanded: Full results */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* Main Position */}
              <View style={styles.positionContainer}>
                <Text style={[styles.positionNumber, { color: getPositionColor(result.position) }]}>
                  {result.position}
                </Text>
                <View style={styles.positionMeta}>
                  <Text style={styles.positionSuffix}>
                    {getOrdinalSuffix(result.position).replace(String(result.position), '')}
                  </Text>
                  <Text style={styles.fleetContext}>of {result.fleetSize} boats</Text>
                </View>
              </View>

              {statusLabel && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{statusLabel}</Text>
                </View>
              )}

              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Points</Text>
                  <Text style={styles.metricValue}>{result.points}</Text>
                </View>
                {result.seriesPosition && result.totalRaces && (
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Series</Text>
                    <Text style={styles.metricValue}>
                      {getOrdinalSuffix(result.seriesPosition)} ({result.totalRaces} races)
                    </Text>
                  </View>
                )}
              </View>

              {trend && (
                <View style={styles.trendContainer}>
                  <MaterialCommunityIcons name={trend.icon} size={18} color={trend.color} />
                  <Text style={[styles.trendText, { color: trend.color }]}>{trend.label}</Text>
                </View>
              )}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="timer-sand-empty" size={32} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyTitle}>No Result Yet</Text>
          <Text style={styles.emptySubtext}>Results will appear after the race</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconPodium: {
    backgroundColor: `${IOS_COLORS.orange}15`,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  positionText: {
    fontSize: 24,
    fontWeight: '700',
  },
  fleetText: {
    fontSize: 13,
    color: IOS_COLORS.gray,
  },
  pointsChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  pointsLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 16,
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  positionNumber: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
  },
  positionMeta: {
    paddingBottom: 8,
  },
  positionSuffix: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  fleetContext: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${IOS_COLORS.red}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.red,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  metric: {
    gap: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.gray,
  },
});
