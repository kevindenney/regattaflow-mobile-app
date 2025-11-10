/**
 * Water Push Card
 *
 * Displays current impact on boat movement:
 * - Current speed and direction
 * - Leeway effect (sideways push)
 * - Tactical impact in boat lengths
 * - Visual current vector
 * - Trend over time
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRaceConditions, selectCurrent, selectWind, selectPosition } from '@/stores/raceConditionsStore';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  getCurrentColor
} from '@/constants/RacingDesignSystem';
import Svg, { Path, Circle, Line, Defs, Marker } from 'react-native-svg';

interface CurrentImpact {
  speed: number; // knots
  direction: number; // degrees true
  leeway: number; // degrees of sideways push
  boatLengthsPerMinute: number; // advantage/disadvantage
  tacticalAdvice: string;
  heading: 'favorable' | 'neutral' | 'adverse';
  trend: 'increasing' | 'decreasing' | 'stable';
  trendRate: number; // knots per minute
  confidence: 'high' | 'moderate' | 'low';
}

interface WaterPushCardProps {
  boatSpeed?: number; // Current boat speed in knots
  courseHeading?: number; // Intended course heading (0-360)
  boatLength?: number; // Boat length in meters (for calculations)
}

export function WaterPushCard({
  boatSpeed = 5,
  courseHeading = 0,
  boatLength = 10
}: WaterPushCardProps) {
  const current = useRaceConditions(selectCurrent);
  const wind = useRaceConditions(selectWind);
  const position = useRaceConditions(selectPosition);

  // Calculate current impact
  const impact = useMemo((): CurrentImpact | null => {
    if (!current) {
      return null;
    }

    // Calculate relative current angle to course
    const relativeAngle = ((current.direction - courseHeading + 180) % 360) - 180;

    // Calculate leeway (simplified - real calc would use boat polars)
    // Positive leeway = pushed to port, Negative = pushed to starboard
    const leeway = Math.sin(relativeAngle * Math.PI / 180) * current.speed * 10;

    // Calculate speed advantage/disadvantage
    // Positive = current helping, Negative = current hindering
    const speedEffect = Math.cos(relativeAngle * Math.PI / 180) * current.speed;

    // Convert to boat lengths per minute
    // 1 knot = 1852m/hour = 30.87m/min
    const metersPerMinute = speedEffect * 30.87;
    const boatLengthsPerMinute = metersPerMinute / boatLength;

    // Determine heading favorability
    let heading: 'favorable' | 'neutral' | 'adverse' = 'neutral';
    if (Math.abs(relativeAngle) < 30) {
      heading = speedEffect > 0 ? 'favorable' : 'adverse';
    } else if (Math.abs(relativeAngle) > 150) {
      heading = speedEffect < 0 ? 'adverse' : 'neutral';
    }

    // Generate tactical advice
    let tacticalAdvice = '';
    if (Math.abs(leeway) > 5) {
      const direction = leeway > 0 ? 'PORT' : 'STARBOARD';
      tacticalAdvice = `Strong ${direction} set - compensate ${Math.abs(Math.round(leeway))}° upwind`;
    } else if (Math.abs(boatLengthsPerMinute) > 2) {
      const effect = boatLengthsPerMinute > 0 ? 'Ride the push' : 'Fighting current';
      tacticalAdvice = `${effect} - ${Math.abs(boatLengthsPerMinute).toFixed(1)} BL/min`;
    } else {
      tacticalAdvice = 'Minimal current impact on speed';
    }

    // Estimate trend from forecast
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let trendRate = 0;

    if (current.forecast && current.forecast.length > 0) {
      const futureCurrent = current.forecast[0];
      const speedChange = futureCurrent.speed - current.speed;
      trendRate = speedChange / 5; // Assume forecast is 5 min ahead

      if (Math.abs(trendRate) > 0.1) {
        trend = trendRate > 0 ? 'increasing' : 'decreasing';
      }
    }

    return {
      speed: current.speed,
      direction: current.direction,
      leeway: Math.round(leeway * 10) / 10,
      boatLengthsPerMinute: Math.round(boatLengthsPerMinute * 10) / 10,
      tacticalAdvice,
      heading,
      trend,
      trendRate: Math.round(trendRate * 100) / 100,
      confidence: current.forecast ? 'high' : 'moderate'
    };
  }, [current, courseHeading, boatSpeed, boatLength]);

  // Get current color based on speed
  const currentColor = current ? getCurrentColor(current.speed) : Colors.ui.border;

  // Get heading color
  const getHeadingColor = () => {
    if (!impact) return Colors.text.tertiary;
    switch (impact.heading) {
      case 'favorable': return Colors.primary.green;
      case 'adverse': return Colors.primary.red;
      case 'neutral': return Colors.primary.yellow;
    }
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (!impact) return 'trending-neutral';
    switch (impact.trend) {
      case 'increasing': return 'trending-up';
      case 'decreasing': return 'trending-down';
      case 'stable': return 'trending-neutral';
    }
  };

  // Format direction for display
  const formatDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees % 360) / 22.5)) % 16;
    return directions[index];
  };

  if (!current || !impact) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="waves"
            size={20}
            color={Colors.text.tertiary}
          />
          <Text style={styles.title}>Water Push</Text>
        </View>
        <View style={styles.noDataContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={32}
            color={Colors.text.tertiary}
          />
          <Text style={styles.noDataText}>No current data</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="waves"
          size={20}
          color={Colors.primary.blue}
        />
        <Text style={styles.title}>Water Push</Text>
      </View>

      {/* Current Vector Visualization */}
      <View style={styles.vectorSection}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          <Defs>
            <Marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="5"
              orient="auto"
            >
              <Path
                d="M 0 0 L 10 5 L 0 10 Z"
                fill={currentColor}
              />
            </Marker>
          </Defs>

          {/* Center circle (boat) */}
          <Circle
            cx="60"
            cy="60"
            r="8"
            fill={Colors.ui.background}
            stroke={Colors.primary.blue}
            strokeWidth="2"
          />

          {/* Course heading line */}
          <Line
            x1="60"
            y1="60"
            x2="60"
            y2="20"
            stroke={Colors.text.tertiary}
            strokeWidth="2"
            strokeDasharray="4,4"
          />

          {/* Current vector */}
          <Line
            x1="60"
            y1="60"
            x2={60 + Math.sin(impact.direction * Math.PI / 180) * (impact.speed * 8)}
            y2={60 - Math.cos(impact.direction * Math.PI / 180) * (impact.speed * 8)}
            stroke={currentColor}
            strokeWidth="3"
            markerEnd="url(#arrowhead)"
          />
        </Svg>

        {/* Speed and Direction */}
        <View style={styles.vectorInfo}>
          <Text style={[styles.speedValue, { color: currentColor }]}>
            {impact.speed.toFixed(1)} kt
          </Text>
          <Text style={styles.directionValue}>
            {formatDirection(impact.direction)} ({impact.direction}°)
          </Text>
        </View>
      </View>

      {/* Tactical Impact */}
      <View style={styles.impactSection}>
        <View style={[
          styles.impactBadge,
          {
            backgroundColor: getHeadingColor() + '20',
            borderColor: getHeadingColor()
          }
        ]}>
          <MaterialCommunityIcons
            name={
              impact.heading === 'favorable'
                ? 'chevron-double-up'
                : impact.heading === 'adverse'
                  ? 'chevron-double-down'
                  : 'equal'
            }
            size={20}
            color={getHeadingColor()}
          />
          <View style={styles.impactText}>
            <Text style={[styles.impactValue, { color: getHeadingColor() }]}>
              {impact.boatLengthsPerMinute > 0 ? '+' : ''}
              {impact.boatLengthsPerMinute.toFixed(1)} BL/min
            </Text>
            <Text style={styles.impactLabel}>
              {impact.heading.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Leeway Effect */}
      {Math.abs(impact.leeway) > 2 && (
        <View style={styles.leewaySection}>
          <View style={styles.leewayIndicator}>
            <MaterialCommunityIcons
              name={impact.leeway > 0 ? 'arrow-left-bold' : 'arrow-right-bold'}
              size={16}
              color={Colors.primary.purple}
            />
            <Text style={styles.leewayValue}>
              {Math.abs(impact.leeway).toFixed(1)}° {impact.leeway > 0 ? 'PORT' : 'STBD'} SET
            </Text>
          </View>
          <Text style={styles.leewayAdvice}>
            Compensate upwind to maintain course
          </Text>
        </View>
      )}

      {/* Tactical Advice */}
      <View style={styles.adviceSection}>
        <Text style={styles.adviceText}>
          {impact.tacticalAdvice}
        </Text>
      </View>

      {/* Trend */}
      <View style={styles.trendSection}>
        <View style={styles.trendHeader}>
          <MaterialCommunityIcons
            name={getTrendIcon()}
            size={16}
            color={
              impact.trend === 'increasing'
                ? Colors.primary.green
                : impact.trend === 'decreasing'
                  ? Colors.primary.red
                  : Colors.text.tertiary
            }
          />
          <Text style={styles.trendLabel}>
            {impact.trend === 'stable'
              ? 'STABLE CURRENT'
              : `${impact.trend.toUpperCase()} ${Math.abs(impact.trendRate).toFixed(2)} kt/min`}
          </Text>
        </View>
      </View>

      {/* Forecast */}
      {current.forecast && current.forecast.length > 0 && (
        <View style={styles.forecastSection}>
          <Text style={styles.forecastTitle}>Next 15 minutes:</Text>
          <View style={styles.forecastGrid}>
            {current.forecast.slice(0, 3).map((forecast, index) => {
              const relativeAngle = ((forecast.direction - courseHeading + 180) % 360) - 180;
              const speedEffect = Math.cos(relativeAngle * Math.PI / 180) * forecast.speed;
              const metersPerMinute = speedEffect * 30.87;
              const forecastBL = metersPerMinute / boatLength;

              return (
                <View key={index} style={styles.forecastItem}>
                  <Text style={styles.forecastTime}>+{(index + 1) * 5}min</Text>
                  <Text style={styles.forecastSpeed}>
                    {forecast.speed.toFixed(1)} kt
                  </Text>
                  <Text style={[
                    styles.forecastBL,
                    { color: forecastBL > 0 ? Colors.primary.green : Colors.primary.red }
                  ]}>
                    {forecastBL > 0 ? '+' : ''}{forecastBL.toFixed(1)} BL/min
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Confidence */}
      <View style={styles.confidenceSection}>
        <View style={styles.confidenceBadge}>
          <View style={[
            styles.confidenceDot,
            {
              backgroundColor:
                impact.confidence === 'high'
                  ? Colors.status.safe
                  : impact.confidence === 'moderate'
                    ? Colors.status.caution
                    : Colors.status.danger
            }
          ]} />
          <Text style={styles.confidenceText}>
            {impact.confidence.toUpperCase()} CONFIDENCE
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

  vectorSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm
  },

  vectorInfo: {
    alignItems: 'center'
  },

  speedValue: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.mono
  },

  directionValue: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.semiBold
  },

  impactSection: {
    alignItems: 'center',
    marginBottom: Spacing.md
  },

  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.sm
  },

  impactText: {
    alignItems: 'center'
  },

  impactValue: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.mono
  },

  impactLabel: {
    fontSize: Typography.fontSize.micro,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
    letterSpacing: Typography.letterSpacing.wide
  },

  leewaySection: {
    backgroundColor: Colors.primary.purple + '10',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.purple
  },

  leewayIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs
  },

  leewayValue: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.purple
  },

  leewayAdvice: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
    fontStyle: 'italic'
  },

  adviceSection: {
    backgroundColor: Colors.ui.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md
  },

  adviceText: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium
  },

  trendSection: {
    marginBottom: Spacing.md
  },

  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm
  },

  trendLabel: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.secondary
  },

  forecastSection: {
    marginBottom: Spacing.md
  },

  forecastTitle: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase'
  },

  forecastGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.ui.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm
  },

  forecastItem: {
    alignItems: 'center',
    gap: Spacing.xs
  },

  forecastTime: {
    fontSize: Typography.fontSize.micro,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.semiBold
  },

  forecastSpeed: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.mono
  },

  forecastBL: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.mono
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
