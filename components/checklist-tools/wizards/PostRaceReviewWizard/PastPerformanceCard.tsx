/**
 * PastPerformanceCard
 *
 * Displays trend data from previous races for context.
 * Shows:
 * - Visual trend indicator (improving/declining/stable)
 * - Mini bar chart of past ratings
 * - Average rating
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Minus, History } from 'lucide-react-native';
import type { TrendDataPoint } from '@/hooks/usePostRaceReviewData';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
};

interface PastPerformanceCardProps {
  pastTrends: TrendDataPoint[];
  averageRating?: number;
  trend?: 'improving' | 'declining' | 'stable';
  accentColor: string;
}

/**
 * Render a mini bar for a single rating
 */
function RatingBar({ rating, maxRating = 5, color }: { rating?: number; maxRating?: number; color: string }) {
  const height = rating ? (rating / maxRating) * 40 : 0;

  return (
    <View style={styles.barContainer}>
      <View
        style={[
          styles.bar,
          {
            height,
            backgroundColor: rating ? color : IOS_COLORS.gray5,
          },
        ]}
      />
    </View>
  );
}

export function PastPerformanceCard({
  pastTrends,
  averageRating,
  trend,
  accentColor,
}: PastPerformanceCardProps) {
  // Get trend icon and label
  const trendInfo = useMemo(() => {
    switch (trend) {
      case 'improving':
        return { Icon: TrendingUp, label: 'Improving', color: IOS_COLORS.green };
      case 'declining':
        return { Icon: TrendingDown, label: 'Declining', color: IOS_COLORS.orange };
      case 'stable':
        return { Icon: Minus, label: 'Stable', color: IOS_COLORS.blue };
      default:
        return null;
    }
  }, [trend]);

  // No past data
  if (pastTrends.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <History size={20} color={IOS_COLORS.gray} />
        <Text style={styles.emptyText}>First review for this area</Text>
        <Text style={styles.emptySubtext}>
          Your ratings will build a trend over time
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with trend */}
      <View style={styles.header}>
        <Text style={styles.title}>Past Performance</Text>
        {trendInfo && (
          <View style={[styles.trendBadge, { backgroundColor: `${trendInfo.color}15` }]}>
            <trendInfo.Icon size={14} color={trendInfo.color} />
            <Text style={[styles.trendText, { color: trendInfo.color }]}>
              {trendInfo.label}
            </Text>
          </View>
        )}
      </View>

      {/* Bar chart */}
      <View style={styles.chartContainer}>
        {pastTrends.slice(0, 5).reverse().map((point, index) => (
          <View key={point.raceId} style={styles.chartColumn}>
            <RatingBar rating={point.rating} color={accentColor} />
            <Text style={styles.chartLabel} numberOfLines={1}>
              {index + 1}
            </Text>
          </View>
        ))}
      </View>

      {/* Average */}
      {averageRating !== undefined && (
        <View style={styles.averageContainer}>
          <Text style={styles.averageLabel}>Average Rating</Text>
          <Text style={[styles.averageValue, { color: accentColor }]}>
            {averageRating.toFixed(1)}/5
          </Text>
        </View>
      )}

      {/* Most recent race note */}
      {pastTrends[0]?.notes && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>Last race note:</Text>
          <Text style={styles.noteText} numberOfLines={2}>
            {pastTrends[0].notes}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 60,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    width: 20,
    height: 40,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 4,
  },
  averageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  averageLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  averageValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  noteContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default PastPerformanceCard;
