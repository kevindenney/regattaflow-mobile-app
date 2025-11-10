/**
 * Clearance Outlook Card
 *
 * Displays upcoming depth and clearance information along the racecourse:
 * - Current clearance status
 * - Depth forecast along track
 * - Critical waypoints and hazards
 * - Timeline to next shallow area
 * - Safe routing recommendations
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useRaceConditions,
  selectDepth,
  selectDraft,
  selectClearance,
  selectCourse
} from '@/stores/raceConditionsStore';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  getClearanceStatus,
  getDepthColor
} from '@/constants/RacingDesignSystem';

interface DepthWaypoint {
  distance: number; // meters along track
  depth: number; // meters
  clearance: number; // meters
  status: 'safe' | 'caution' | 'danger';
  description: string;
}

interface ClearanceOutlook {
  currentStatus: 'safe' | 'caution' | 'danger';
  currentClearance: number;
  minimumAhead: number;
  minimumDistance: number; // meters to minimum
  waypoints: DepthWaypoint[];
  recommendation: string;
  confidence: 'high' | 'moderate' | 'low';
}

interface ClearanceOutlookCardProps {
  lookAheadDistance?: number; // meters to look ahead along track
  criticalClearance?: number; // meters - threshold for warnings
}

export function ClearanceOutlookCard({
  lookAheadDistance = 1000,
  criticalClearance = 2
}: ClearanceOutlookCardProps) {
  const depth = useRaceConditions(selectDepth);
  const draft = useRaceConditions(selectDraft);
  const clearance = useRaceConditions(selectClearance);
  const course = useRaceConditions(selectCourse);

  // Calculate clearance outlook
  const outlook = useMemo((): ClearanceOutlook | null => {
    if (!depth || !course) {
      return null;
    }

    // Get current status
    const currentStatus = getClearanceStatus(clearance, draft);

    // Generate waypoints from depth forecast
    const waypoints: DepthWaypoint[] = [];

    if (depth.forecast && depth.forecast.length > 0) {
      depth.forecast.forEach((forecast, index) => {
        // Estimate distance (assuming 5 knots average speed)
        // Each forecast point is ~5 minutes apart
        const distance = (index + 1) * 5 * 5 * 30.87; // ~772m per forecast point

        if (distance <= lookAheadDistance) {
          const waypointClearance = forecast.depth - draft;
          const waypointStatus = getClearanceStatus(waypointClearance, draft);

          let description = '';
          if (waypointStatus.status === 'danger') {
            description = `Critical: ${waypointClearance.toFixed(1)}m clearance`;
          } else if (waypointStatus.status === 'caution') {
            description = `Low clearance: ${waypointClearance.toFixed(1)}m`;
          } else {
            description = `Safe: ${waypointClearance.toFixed(1)}m clearance`;
          }

          waypoints.push({
            distance,
            depth: forecast.depth,
            clearance: waypointClearance,
            status: waypointStatus.status,
            description
          });
        }
      });
    }

    // Find minimum clearance ahead
    let minimumAhead = clearance;
    let minimumDistance = 0;

    waypoints.forEach(wp => {
      if (wp.clearance < minimumAhead) {
        minimumAhead = wp.clearance;
        minimumDistance = wp.distance;
      }
    });

    // Generate recommendation
    let recommendation = '';
    if (minimumAhead < criticalClearance) {
      const timeToHazard = minimumDistance / (5 * 30.87); // Assuming 5 knots
      recommendation = `⚠️ Shallow water in ${Math.round(timeToHazard)} min - consider alternate route`;
    } else if (currentStatus.status === 'caution') {
      recommendation = 'Monitor depth continuously - clearance is minimal';
    } else {
      recommendation = 'Clear track ahead - maintain course';
    }

    return {
      currentStatus: currentStatus.status,
      currentClearance: clearance,
      minimumAhead,
      minimumDistance,
      waypoints,
      recommendation,
      confidence: depth.forecast ? 'high' : 'moderate'
    };
  }, [depth, draft, clearance, course, lookAheadDistance, criticalClearance]);

  // Format distance for display
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Get status icon
  const getStatusIcon = (status: 'safe' | 'caution' | 'danger') => {
    switch (status) {
      case 'safe': return 'check-circle';
      case 'caution': return 'alert';
      case 'danger': return 'alert-circle';
    }
  };

  // Get status color
  const getStatusColor = (status: 'safe' | 'caution' | 'danger') => {
    switch (status) {
      case 'safe': return Colors.status.safe;
      case 'caution': return Colors.status.caution;
      case 'danger': return Colors.status.danger;
    }
  };

  if (!depth || !outlook) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="chart-line-variant"
            size={20}
            color={Colors.text.tertiary}
          />
          <Text style={styles.title}>Clearance Outlook</Text>
        </View>
        <View style={styles.noDataContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={32}
            color={Colors.text.tertiary}
          />
          <Text style={styles.noDataText}>No depth forecast</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="chart-line-variant"
          size={20}
          color={Colors.primary.blue}
        />
        <Text style={styles.title}>Clearance Outlook</Text>
      </View>

      {/* Current Status */}
      <View style={styles.currentSection}>
        <View style={styles.currentHeader}>
          <Text style={styles.currentLabel}>CURRENT</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(outlook.currentStatus) + '20' }
          ]}>
            <MaterialCommunityIcons
              name={getStatusIcon(outlook.currentStatus)}
              size={16}
              color={getStatusColor(outlook.currentStatus)}
            />
            <Text style={[
              styles.statusText,
              { color: getStatusColor(outlook.currentStatus) }
            ]}>
              {outlook.currentStatus.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.clearanceValue}>
          {outlook.currentClearance.toFixed(1)}m clearance
        </Text>
      </View>

      {/* Minimum Ahead */}
      {outlook.minimumAhead < outlook.currentClearance && (
        <View style={[
          styles.minimumSection,
          {
            backgroundColor: outlook.minimumAhead < criticalClearance
              ? Colors.status.danger + '20'
              : Colors.status.caution + '20',
            borderLeftColor: outlook.minimumAhead < criticalClearance
              ? Colors.status.danger
              : Colors.status.caution
          }
        ]}>
          <View style={styles.minimumHeader}>
            <MaterialCommunityIcons
              name="alert-outline"
              size={20}
              color={
                outlook.minimumAhead < criticalClearance
                  ? Colors.status.danger
                  : Colors.status.caution
              }
            />
            <Text style={styles.minimumLabel}>Minimum Ahead</Text>
          </View>
          <View style={styles.minimumDetails}>
            <Text style={styles.minimumValue}>
              {outlook.minimumAhead.toFixed(1)}m
            </Text>
            <Text style={styles.minimumDistance}>
              in {formatDistance(outlook.minimumDistance)}
            </Text>
          </View>
        </View>
      )}

      {/* Depth Timeline */}
      {outlook.waypoints.length > 0 && (
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Depth Along Track:</Text>
          <View style={styles.timelineChart}>
            {outlook.waypoints.map((wp, index) => {
              const barHeight = Math.min((wp.clearance / 20) * 60, 60);
              return (
                <View key={index} style={styles.timelinePoint}>
                  <View
                    style={[
                      styles.timelineBar,
                      {
                        height: Math.max(barHeight, 4),
                        backgroundColor: getStatusColor(wp.status)
                      }
                    ]}
                  />
                  <Text style={styles.timelineDistance}>
                    {formatDistance(wp.distance)}
                  </Text>
                  <Text style={styles.timelineClearance}>
                    {wp.clearance.toFixed(1)}m
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Waypoint List */}
      {outlook.waypoints.filter(wp => wp.status !== 'safe').length > 0 && (
        <View style={styles.waypointSection}>
          <Text style={styles.waypointTitle}>Critical Points:</Text>
          {outlook.waypoints
            .filter(wp => wp.status !== 'safe')
            .slice(0, 3)
            .map((wp, index) => (
              <View key={index} style={styles.waypointItem}>
                <MaterialCommunityIcons
                  name={getStatusIcon(wp.status)}
                  size={16}
                  color={getStatusColor(wp.status)}
                />
                <View style={styles.waypointInfo}>
                  <Text style={styles.waypointDescription}>
                    {wp.description}
                  </Text>
                  <Text style={styles.waypointMeta}>
                    {formatDistance(wp.distance)} • {wp.depth.toFixed(1)}m depth
                  </Text>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Recommendation */}
      <View style={[
        styles.recommendationSection,
        {
          backgroundColor:
            outlook.minimumAhead < criticalClearance
              ? Colors.status.danger + '10'
              : outlook.currentStatus === 'caution'
                ? Colors.status.caution + '10'
                : Colors.status.safe + '10',
          borderColor:
            outlook.minimumAhead < criticalClearance
              ? Colors.status.danger
              : outlook.currentStatus === 'caution'
                ? Colors.status.caution
                : Colors.status.safe
        }
      ]}>
        <Text style={styles.recommendationText}>
          {outlook.recommendation}
        </Text>
      </View>

      {/* Confidence */}
      <View style={styles.confidenceSection}>
        <View style={styles.confidenceBadge}>
          <View style={[
            styles.confidenceDot,
            {
              backgroundColor:
                outlook.confidence === 'high'
                  ? Colors.status.safe
                  : outlook.confidence === 'moderate'
                    ? Colors.status.caution
                    : Colors.status.danger
            }
          ]} />
          <Text style={styles.confidenceText}>
            {outlook.confidence.toUpperCase()} CONFIDENCE
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.ui.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    padding: Spacing.md,
    ...Shadows.card
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md
  },

  title: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginLeft: Spacing.sm
  },

  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm
  },

  noDataText: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.tertiary
  },

  currentSection: {
    backgroundColor: Colors.ui.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md
  },

  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs
  },

  currentLabel: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
    letterSpacing: Typography.letterSpacing.wide
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs
  },

  statusText: {
    fontSize: Typography.fontSize.micro,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.wide
  },

  clearanceValue: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.mono
  },

  minimumSection: {
    borderLeftWidth: 4,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md
  },

  minimumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs
  },

  minimumLabel: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary
  },

  minimumDetails: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm
  },

  minimumValue: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.mono
  },

  minimumDistance: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium
  },

  timelineSection: {
    marginBottom: Spacing.md
  },

  timelineTitle: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase'
  },

  timelineChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
    backgroundColor: Colors.ui.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm
  },

  timelinePoint: {
    alignItems: 'center',
    gap: Spacing.xs
  },

  timelineBar: {
    width: 24,
    minHeight: 4,
    borderRadius: BorderRadius.sm
  },

  timelineDistance: {
    fontSize: Typography.fontSize.micro,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.semiBold
  },

  timelineClearance: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.mono
  },

  waypointSection: {
    marginBottom: Spacing.md
  },

  waypointTitle: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase'
  },

  waypointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border
  },

  waypointInfo: {
    flex: 1
  },

  waypointDescription: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs
  },

  waypointMeta: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.tertiary
  },

  recommendationSection: {
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md
  },

  recommendationText: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center'
  },

  confidenceSection: {
    alignItems: 'center'
  },

  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs
  },

  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },

  confidenceText: {
    fontSize: Typography.fontSize.micro,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
    letterSpacing: Typography.letterSpacing.wide
  }
});
