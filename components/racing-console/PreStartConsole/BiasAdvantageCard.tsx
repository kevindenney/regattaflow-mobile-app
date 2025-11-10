/**
 * Bias Advantage Card
 *
 * Displays start line bias information:
 * - Current bias in degrees and boat lengths
 * - Favored end (port/starboard/neutral)
 * - Trend over time
 * - Evolution prediction through countdown
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRaceConditions, selectWind, selectCurrent } from '@/stores/raceConditionsStore';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows
} from '@/constants/RacingDesignSystem';

interface BiasData {
  degrees: number; // Positive = port favored, Negative = starboard favored
  boatLengths: number;
  favoredEnd: 'PORT' | 'STARBOARD' | 'NEUTRAL';
  trend: 'increasing' | 'decreasing' | 'stable';
  trendRate: number; // degrees per minute
  confidence: 'high' | 'moderate' | 'low';
}

interface BiasEvolution {
  timeOffset: number; // minutes from now
  bias: number; // degrees
}

interface BiasAdvantageCardProps {
  startLineHeading?: number; // True heading of start line (0-360)
  lineLength?: number; // Length of start line in meters
  timeToStart?: number; // Minutes until start
}

export function BiasAdvantageCard({
  startLineHeading = 0,
  lineLength = 100,
  timeToStart = 10
}: BiasAdvantageCardProps) {
  const wind = useRaceConditions(selectWind);
  const current = useRaceConditions(selectCurrent);

  // Calculate bias
  const biasData = useMemo((): BiasData => {
    if (!wind) {
      return {
        degrees: 0,
        boatLengths: 0,
        favoredEnd: 'NEUTRAL',
        trend: 'stable',
        trendRate: 0,
        confidence: 'low'
      };
    }

    // Calculate wind angle relative to line
    // Positive = port favored, Negative = starboard favored
    const windAngleToLine = ((wind.trueDirection - startLineHeading + 180) % 360) - 180;

    // Calculate bias in degrees (simplified - real calc would use polars)
    const biasDegrees = windAngleToLine;

    // Calculate boat lengths advantage
    // Each degree of bias ≈ 0.15 boat lengths (rule of thumb)
    const boatLengths = Math.abs(biasDegrees) * 0.15;

    // Determine favored end
    let favoredEnd: 'PORT' | 'STARBOARD' | 'NEUTRAL' = 'NEUTRAL';
    if (Math.abs(biasDegrees) > 2) {
      favoredEnd = biasDegrees > 0 ? 'PORT' : 'STARBOARD';
    }

    // Estimate trend from wind forecast
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let trendRate = 0;

    if (wind.forecast && wind.forecast.length > 0) {
      const futureWind = wind.forecast[0];
      const futureAngleToLine = ((futureWind.direction - startLineHeading + 180) % 360) - 180;
      const changeDegrees = futureAngleToLine - biasDegrees;
      trendRate = changeDegrees / 5; // Assume forecast is 5 min ahead

      if (Math.abs(trendRate) > 0.3) {
        trend = trendRate > 0 ? 'increasing' : 'decreasing';
      }
    }

    // Factor in current effect on bias
    let currentEffect = 0;
    if (current) {
      // Current at an angle to the line shifts effective bias
      const currentAngleToLine = ((current.direction - startLineHeading + 180) % 360) - 180;
      currentEffect = currentAngleToLine * (current.speed / 10); // Normalize by speed
    }

    const totalBias = biasDegrees + currentEffect;

    return {
      degrees: Math.round(totalBias * 10) / 10,
      boatLengths: Math.round(Math.abs(totalBias) * 0.15 * 10) / 10,
      favoredEnd: Math.abs(totalBias) > 2
        ? (totalBias > 0 ? 'PORT' : 'STARBOARD')
        : 'NEUTRAL',
      trend,
      trendRate: Math.round(trendRate * 10) / 10,
      confidence: wind.forecast ? 'high' : 'moderate'
    };
  }, [wind, current, startLineHeading]);

  // Calculate bias evolution over time
  const biasEvolution = useMemo((): BiasEvolution[] => {
    const evolution: BiasEvolution[] = [];
    const checkpoints = [-10, -5, 0]; // T-10, T-5, T-0

    checkpoints.forEach(offset => {
      const projectedBias = biasData.degrees + (biasData.trendRate * offset);
      evolution.push({
        timeOffset: offset,
        bias: Math.round(projectedBias * 10) / 10
      });
    });

    return evolution;
  }, [biasData]);

  // Get color based on confidence
  const getConfidenceColor = () => {
    switch (biasData.confidence) {
      case 'high': return Colors.status.safe;
      case 'moderate': return Colors.status.caution;
      case 'low': return Colors.status.danger;
    }
  };

  // Get trend icon
  const getTrendIcon = () => {
    switch (biasData.trend) {
      case 'increasing': return 'trending-up';
      case 'decreasing': return 'trending-down';
      case 'stable': return 'trending-neutral';
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="compass"
          size={20}
          color={Colors.primary.blue}
        />
        <Text style={styles.title}>Bias Advantage</Text>
      </View>

      {/* Current Bias */}
      <View style={styles.currentBiasSection}>
        <View style={styles.biasMain}>
          <Text style={styles.biasValue}>
            {biasData.degrees > 0 ? '+' : ''}{biasData.degrees}°
          </Text>
          <Text style={styles.biasSeparator}>/</Text>
          <Text style={styles.boatLengthValue}>
            {biasData.boatLengths} BL
          </Text>
        </View>

        <View style={[
          styles.favoredEndBadge,
          {
            backgroundColor: biasData.favoredEnd === 'NEUTRAL'
              ? Colors.ui.surface
              : biasData.favoredEnd === 'PORT'
                ? Colors.primary.green + '20'
                : Colors.primary.red + '20'
          }
        ]}>
          <MaterialCommunityIcons
            name={biasData.favoredEnd === 'PORT' ? 'arrow-left-bold' : 'arrow-right-bold'}
            size={16}
            color={
              biasData.favoredEnd === 'NEUTRAL'
                ? Colors.text.tertiary
                : biasData.favoredEnd === 'PORT'
                  ? Colors.primary.green
                  : Colors.primary.red
            }
          />
          <Text style={[
            styles.favoredEndText,
            {
              color: biasData.favoredEnd === 'NEUTRAL'
                ? Colors.text.tertiary
                : biasData.favoredEnd === 'PORT'
                  ? Colors.primary.green
                  : Colors.primary.red
            }
          ]}>
            {biasData.favoredEnd} END
          </Text>
        </View>
      </View>

      {/* Trend */}
      <View style={styles.trendSection}>
        <View style={styles.trendHeader}>
          <MaterialCommunityIcons
            name={getTrendIcon()}
            size={16}
            color={
              biasData.trend === 'increasing'
                ? Colors.primary.green
                : biasData.trend === 'decreasing'
                  ? Colors.primary.red
                  : Colors.text.tertiary
            }
          />
          <Text style={styles.trendLabel}>
            {biasData.trend === 'stable'
              ? 'STABLE'
              : `${biasData.trend.toUpperCase()} ${Math.abs(biasData.trendRate).toFixed(1)}°/min`}
          </Text>
        </View>
      </View>

      {/* Evolution Chart */}
      <View style={styles.evolutionSection}>
        <Text style={styles.evolutionTitle}>Bias Evolution:</Text>
        <View style={styles.evolutionChart}>
          {biasEvolution.map((point, index) => (
            <View key={index} style={styles.evolutionPoint}>
              <Text style={styles.evolutionTime}>
                T{point.timeOffset === 0 ? '-0' : point.timeOffset}
              </Text>
              <View style={[
                styles.evolutionBar,
                {
                  height: Math.min(Math.abs(point.bias) * 3, 60),
                  backgroundColor: point.bias > 0
                    ? Colors.primary.green
                    : point.bias < 0
                      ? Colors.primary.red
                      : Colors.ui.border
                }
              ]} />
              <Text style={styles.evolutionValue}>
                {point.bias > 0 ? '+' : ''}{point.bias}°
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Confidence */}
      <View style={styles.confidenceSection}>
        <View style={[
          styles.confidenceBadge,
          { borderColor: getConfidenceColor() }
        ]}>
          <View style={[
            styles.confidenceDot,
            { backgroundColor: getConfidenceColor() }
          ]} />
          <Text style={[
            styles.confidenceText,
            { color: getConfidenceColor() }
          ]}>
            {biasData.confidence.toUpperCase()} CONFIDENCE
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

  currentBiasSection: {
    alignItems: 'center',
    marginBottom: Spacing.md
  },

  biasMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm
  },

  biasValue: {
    fontSize: 36,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.mono
  },

  biasSeparator: {
    fontSize: Typography.fontSize.h3,
    color: Colors.text.tertiary,
    marginHorizontal: Spacing.sm
  },

  boatLengthValue: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.mono
  },

  favoredEndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs
  },

  favoredEndText: {
    fontSize: Typography.fontSize.label,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.wide
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

  evolutionSection: {
    marginBottom: Spacing.md
  },

  evolutionTitle: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase'
  },

  evolutionChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
    backgroundColor: Colors.ui.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm
  },

  evolutionPoint: {
    alignItems: 'center',
    gap: Spacing.xs
  },

  evolutionTime: {
    fontSize: Typography.fontSize.micro,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.semiBold
  },

  evolutionBar: {
    width: 40,
    minHeight: 4,
    borderRadius: BorderRadius.sm
  },

  evolutionValue: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.mono
  },

  confidenceSection: {
    alignItems: 'center'
  },

  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
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
    letterSpacing: Typography.letterSpacing.wide
  }
});
