/**
 * IOSResultsLeaderboard - iOS Leaderboard Style Results
 *
 * Leaderboard-style results list:
 * - Medal icons for top 3 (🥇🥈🥉)
 * - Position, sail number, name, points
 * - Alternating row backgrounds
 * - Sticky header with series info
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

// Types
interface RaceResult {
  raceNumber: number;
  position: number | null;
  points: number;
  isDiscarded?: boolean;
  status?: 'DNS' | 'DNF' | 'DSQ' | 'OCS' | 'BFD' | 'UFD' | 'RET' | null;
}

interface Competitor {
  id: string;
  position: number;
  sailNumber: string;
  boatName?: string;
  helmName: string;
  crewNames?: string[];
  clubName?: string;
  totalPoints: number;
  netPoints: number;
  raceResults: RaceResult[];
  tiebreaker?: string;
}

interface SeriesInfo {
  name: string;
  totalRaces: number;
  completedRaces: number;
  discards: number;
  lastUpdated?: Date;
}

interface IOSResultsLeaderboardProps {
  series: SeriesInfo;
  competitors: Competitor[];
  onCompetitorPress?: (competitor: Competitor) => void;
  onShareResults?: () => void;
  onExportResults?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Medal/Position Component
interface PositionBadgeProps {
  position: number;
}

function PositionBadge({ position }: PositionBadgeProps) {
  if (position === 1) {
    return <Text style={styles.medalEmoji}>🥇</Text>;
  }
  if (position === 2) {
    return <Text style={styles.medalEmoji}>🥈</Text>;
  }
  if (position === 3) {
    return <Text style={styles.medalEmoji}>🥉</Text>;
  }

  return (
    <View style={styles.positionBadge}>
      <Text style={styles.positionText}>{position}</Text>
    </View>
  );
}

// Competitor Row
interface CompetitorRowProps {
  competitor: Competitor;
  onPress: () => void;
  isEven: boolean;
}

function CompetitorRow({ competitor, onPress, isEven }: CompetitorRowProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isTopThree = competitor.position <= 3;

  return (
    <AnimatedPressable
      style={[
        styles.competitorRow,
        isEven && styles.competitorRowEven,
        isTopThree && styles.competitorRowTopThree,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Position ${competitor.position}, ${competitor.helmName}, ${competitor.netPoints} points`}
    >
      {/* Position */}
      <View style={styles.positionContainer}>
        <PositionBadge position={competitor.position} />
      </View>

      {/* Sail Number */}
      <View style={styles.sailContainer}>
        <Text style={styles.sailNumber}>{competitor.sailNumber}</Text>
      </View>

      {/* Name & Club */}
      <View style={styles.nameContainer}>
        <Text style={styles.helmName} numberOfLines={1}>
          {competitor.helmName}
        </Text>
        {competitor.clubName && (
          <Text style={styles.clubName} numberOfLines={1}>
            {competitor.clubName}
          </Text>
        )}
      </View>

      {/* Points */}
      <View style={styles.pointsContainer}>
        <Text style={[styles.netPoints, isTopThree && styles.netPointsTopThree]}>
          {competitor.netPoints}
        </Text>
        {competitor.totalPoints !== competitor.netPoints && (
          <Text style={styles.totalPoints}>
            ({competitor.totalPoints})
          </Text>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.systemGray3} />
    </AnimatedPressable>
  );
}

// Series Header
interface SeriesHeaderProps {
  series: SeriesInfo;
  onShare?: () => void;
  onExport?: () => void;
}

function SeriesHeader({ series, onShare, onExport }: SeriesHeaderProps) {
  return (
    <View style={styles.seriesHeader}>
      <View style={styles.seriesInfo}>
        <Text style={styles.seriesName}>{series.name}</Text>
        <Text style={styles.seriesStats}>
          {series.completedRaces} of {series.totalRaces} races completed
          {series.discards > 0 && ` • ${series.discards} discard${series.discards > 1 ? 's' : ''}`}
        </Text>
        {series.lastUpdated && (
          <Text style={styles.lastUpdated}>
            Updated {formatTimeAgo(series.lastUpdated)}
          </Text>
        )}
      </View>

      <View style={styles.seriesActions}>
        {onShare && (
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              triggerHaptic('impactLight');
              onShare();
            }}
          >
            <Ionicons name="share-outline" size={22} color={IOS_COLORS.systemBlue} />
          </Pressable>
        )}
        {onExport && (
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              triggerHaptic('impactLight');
              onExport();
            }}
          >
            <Ionicons name="download-outline" size={22} color={IOS_COLORS.systemBlue} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function formatTimeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Column Headers
function ColumnHeaders() {
  return (
    <View style={styles.columnHeaders}>
      <Text style={[styles.columnHeader, styles.columnPos]}>Pos</Text>
      <Text style={[styles.columnHeader, styles.columnSail]}>Sail</Text>
      <Text style={[styles.columnHeader, styles.columnName]}>Competitor</Text>
      <Text style={[styles.columnHeader, styles.columnPoints]}>Pts</Text>
    </View>
  );
}

// Main Component
export function IOSResultsLeaderboard({
  series,
  competitors,
  onCompetitorPress,
  onShareResults,
  onExportResults,
}: IOSResultsLeaderboardProps) {
  const renderCompetitor = ({ item, index }: { item: Competitor; index: number }) => (
    <CompetitorRow
      competitor={item}
      onPress={() => onCompetitorPress?.(item)}
      isEven={index % 2 === 0}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={competitors}
        renderItem={renderCompetitor}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <SeriesHeader
              series={series}
              onShare={onShareResults}
              onExport={onExportResults}
            />
            <ColumnHeaders />
          </>
        }
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={48} color={IOS_COLORS.systemGray3} />
            <Text style={styles.emptyTitle}>No Results Yet</Text>
            <Text style={styles.emptySubtitle}>Results will appear here once races are scored</Text>
          </View>
        }
      />
    </View>
  );
}

// Compact Leaderboard for embedding
interface IOSCompactLeaderboardProps {
  title?: string;
  competitors: Competitor[];
  maxDisplay?: number;
  onSeeAll?: () => void;
  onCompetitorPress?: (competitor: Competitor) => void;
}

export function IOSCompactLeaderboard({
  title = 'Standings',
  competitors,
  maxDisplay = 5,
  onSeeAll,
  onCompetitorPress,
}: IOSCompactLeaderboardProps) {
  const displayCompetitors = competitors.slice(0, maxDisplay);

  return (
    <View style={styles.compactContainer}>
      {/* Header */}
      <View style={styles.compactHeader}>
        <Text style={styles.compactTitle}>{title.toUpperCase()}</Text>
        {onSeeAll && competitors.length > maxDisplay && (
          <Pressable
            style={styles.seeAllButton}
            onPress={() => {
              triggerHaptic('impactLight');
              onSeeAll();
            }}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={14} color={IOS_COLORS.systemBlue} />
          </Pressable>
        )}
      </View>

      {/* List */}
      <View style={styles.compactList}>
        {displayCompetitors.map((competitor, index) => (
          <Pressable
            key={competitor.id}
            style={[
              styles.compactRow,
              index === 0 && styles.compactRowFirst,
              index === displayCompetitors.length - 1 && styles.compactRowLast,
            ]}
            onPress={() => {
              triggerHaptic('impactLight');
              onCompetitorPress?.(competitor);
            }}
          >
            <PositionBadge position={competitor.position} />
            <Text style={styles.compactSail}>{competitor.sailNumber}</Text>
            <Text style={styles.compactName} numberOfLines={1}>
              {competitor.helmName}
            </Text>
            <Text style={styles.compactPoints}>{competitor.netPoints} pts</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  listContent: {
    paddingBottom: IOS_SPACING.xxxl,
  },

  // Series Header
  seriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.md,
  },
  seriesInfo: {
    flex: 1,
  },
  seriesName: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  seriesStats: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
  lastUpdated: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: IOS_SPACING.xs,
  },
  seriesActions: {
    flexDirection: 'row',
    gap: IOS_SPACING.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Column Headers
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  columnHeader: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnPos: {
    width: 44,
    textAlign: 'center',
  },
  columnSail: {
    width: 60,
  },
  columnName: {
    flex: 1,
  },
  columnPoints: {
    width: 60,
    textAlign: 'right',
    paddingRight: IOS_SPACING.xl,
  },

  // Competitor Row
  competitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  competitorRowEven: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  competitorRowTopThree: {
    backgroundColor: `${IOS_COLORS.systemYellow}08`,
  },
  positionContainer: {
    width: 44,
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: 24,
  },
  positionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.systemGray5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  sailContainer: {
    width: 60,
  },
  sailNumber: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
  },
  helmName: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    color: IOS_COLORS.label,
  },
  clubName: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  pointsContainer: {
    width: 60,
    alignItems: 'flex-end',
    marginRight: IOS_SPACING.sm,
  },
  netPoints: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  netPointsTopThree: {
    color: IOS_COLORS.systemOrange,
  },
  totalPoints: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.xxxl * 2,
    paddingHorizontal: IOS_SPACING.xl,
  },
  emptyTitle: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.xs,
  },
  emptySubtitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },

  // Compact Leaderboard
  compactContainer: {
    gap: IOS_SPACING.sm,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
  },
  compactTitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  compactList: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.md,
    gap: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  compactRowFirst: {
    borderTopLeftRadius: IOS_RADIUS.md,
    borderTopRightRadius: IOS_RADIUS.md,
  },
  compactRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
  },
  compactSail: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    width: 50,
  },
  compactName: {
    flex: 1,
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.label,
  },
  compactPoints: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
});

export default IOSResultsLeaderboard;
