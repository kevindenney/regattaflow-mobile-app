/**
 * PerformanceTrendChart - Weekly performance trend visualization
 *
 * Shows average finish position over time, similar to Strava's
 * fitness trend chart.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { PerformanceTrend } from '@/hooks/useReflectData';

interface PerformanceTrendChartProps {
  trend: PerformanceTrend[];
  onSeeMore?: () => void;
}

const CHART_HEIGHT = 120;
const CHART_PADDING = 24;

export function PerformanceTrendChart({
  trend,
  onSeeMore,
}: PerformanceTrendChartProps) {
  // Calculate chart dimensions and scales
  const chartData = useMemo(() => {
    const dataWithValues = trend.filter((t) => t.avgPosition !== null);
    if (dataWithValues.length === 0) {
      return { points: [], minPos: 1, maxPos: 10, hasData: false };
    }

    const positions = dataWithValues.map((t) => t.avgPosition!);
    // For positions, lower is better, so we invert the scale
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);
    const range = Math.max(maxPos - minPos, 1);

    const screenWidth = Dimensions.get('window').width - 64; // Accounting for padding
    const barWidth = Math.floor(screenWidth / trend.length) - 4;

    const points = trend.map((t, index) => {
      if (t.avgPosition === null) {
        return {
          x: index * (barWidth + 4) + barWidth / 2,
          y: null,
          label: t.label,
          value: null,
          raceCount: t.raceCount,
        };
      }
      // Invert so better positions (lower numbers) are higher on chart
      const normalizedY = (t.avgPosition - minPos) / range;
      return {
        x: index * (barWidth + 4) + barWidth / 2,
        y: CHART_HEIGHT - CHART_PADDING - normalizedY * (CHART_HEIGHT - CHART_PADDING * 2),
        label: t.label,
        value: t.avgPosition,
        raceCount: t.raceCount,
      };
    });

    return { points, minPos, maxPos, hasData: true, barWidth };
  }, [trend]);

  // Calculate current week's improvement
  const currentWeekData = trend[trend.length - 1];
  const previousWeekData = trend[trend.length - 2];
  const improvement =
    currentWeekData?.avgPosition && previousWeekData?.avgPosition
      ? previousWeekData.avgPosition - currentWeekData.avgPosition
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Performance</Text>
          <Text style={styles.subtitle}>
            Your average finish position over time
          </Text>
        </View>
        {improvement !== null && (
          <View
            style={[
              styles.improvementBadge,
              improvement > 0 ? styles.improvementPositive : styles.improvementNegative,
            ]}
          >
            <Ionicons
              name={improvement > 0 ? 'trending-up' : 'trending-down'}
              size={14}
              color={improvement > 0 ? IOS_COLORS.systemGreen : IOS_COLORS.systemRed}
            />
            <Text
              style={[
                styles.improvementText,
                improvement > 0
                  ? styles.improvementTextPositive
                  : styles.improvementTextNegative,
              ]}
            >
              {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {chartData.hasData ? (
          <>
            {/* Y-axis labels */}
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>{Math.ceil(chartData.minPos)}</Text>
              <Text style={styles.yAxisLabel}>{Math.ceil(chartData.maxPos)}</Text>
            </View>

            {/* Chart area */}
            <View style={styles.chart}>
              {/* Grid lines */}
              <View style={[styles.gridLine, { top: CHART_PADDING }]} />
              <View style={[styles.gridLine, { top: CHART_HEIGHT / 2 }]} />
              <View style={[styles.gridLine, { bottom: CHART_PADDING }]} />

              {/* Data bars */}
              <View style={styles.barsContainer}>
                {chartData.points.map((point, index) => (
                  <View key={index} style={styles.barWrapper}>
                    {point.y !== null ? (
                      <View
                        style={[
                          styles.bar,
                          {
                            height: CHART_HEIGHT - CHART_PADDING - point.y,
                            backgroundColor:
                              index === chartData.points.length - 1
                                ? IOS_COLORS.systemBlue
                                : IOS_COLORS.systemBlue + '60',
                          },
                        ]}
                      />
                    ) : (
                      <View style={styles.noDataBar} />
                    )}
                  </View>
                ))}
              </View>

              {/* X-axis labels */}
              <View style={styles.xAxis}>
                {chartData.points.map(
                  (point, index) =>
                    // Only show every 3rd label to avoid crowding
                    index % 3 === 0 && (
                      <Text
                        key={index}
                        style={[
                          styles.xAxisLabel,
                          {
                            left: point.x - 15,
                            width: 30,
                          },
                        ]}
                      >
                        {point.label}
                      </Text>
                    )
                )}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="stats-chart-outline"
              size={32}
              color={IOS_COLORS.systemGray3}
            />
            <Text style={styles.emptyText}>
              Complete some races to see your performance trend
            </Text>
          </View>
        )}
      </View>

      {onSeeMore && (
        <Pressable style={styles.seeMoreButton} onPress={onSeeMore}>
          <Text style={styles.seeMoreText}>
            See your performance trend for up to 1 year
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...IOS_SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  improvementPositive: {
    backgroundColor: IOS_COLORS.systemGreen + '20',
  },
  improvementNegative: {
    backgroundColor: IOS_COLORS.systemRed + '20',
  },
  improvementText: {
    fontSize: 13,
    fontWeight: '600',
  },
  improvementTextPositive: {
    color: IOS_COLORS.systemGreen,
  },
  improvementTextNegative: {
    color: IOS_COLORS.systemRed,
  },
  chartContainer: {
    height: CHART_HEIGHT + 30,
    flexDirection: 'row',
  },
  yAxis: {
    width: 24,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  yAxisLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
  },
  chart: {
    flex: 1,
    height: CHART_HEIGHT,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: CHART_PADDING,
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: CHART_HEIGHT - CHART_PADDING,
  },
  bar: {
    width: '80%',
    borderRadius: 3,
    minHeight: 4,
  },
  noDataBar: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: IOS_COLORS.systemGray4,
  },
  xAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  seeMoreButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
    letterSpacing: -0.08,
  },
});

export default PerformanceTrendChart;
