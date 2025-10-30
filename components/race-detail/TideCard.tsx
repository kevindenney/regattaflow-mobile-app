/**
 * TideCard Component
 *
 * Displays current and tide information with visual elements
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/race-ui/Card';
import { CardHeader } from '@/components/race-ui/CardHeader';
import { Badge } from '@/components/race-ui/Badge';
import { Typography, Spacing, colors, BorderRadius } from '@/constants/designSystem';
import Svg, { Path } from 'react-native-svg';

interface CurrentConditions {
  speed: number; // knots
  direction: number; // 0-360 degrees
  strength: 'slack' | 'moderate' | 'strong';
}

interface TideData {
  highTide?: { time: string; height: string };
  lowTide?: { time: string; height: string };
  range?: string;
}

interface TideCardProps {
  currentConditions: CurrentConditions;
  tideData?: TideData;
  showLiveIndicator?: boolean;
}

// Current arrow component
const CurrentArrow: React.FC<{ direction: number; strength: string }> = ({
  direction,
  strength,
}) => {
  const color =
    strength === 'slack'
      ? colors.neutral[400]
      : strength === 'moderate'
      ? colors.current
      : colors.danger[600];

  return (
    <Svg width={50} height={50}>
      <Path
        d="M25,10 L25,40 M25,40 L18,33 M25,40 L32,33"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        transform={`rotate(${direction} 25 25)`}
      />
    </Svg>
  );
};

// Tide info mini card
const TideInfoCard: React.FC<{
  type: 'high' | 'low' | 'range';
  time?: string;
  height?: string;
  value?: string;
}> = ({ type, time, height, value }) => {
  const config = {
    high: {
      icon: 'arrow-up-circle' as keyof typeof Ionicons.glyphMap,
      color: colors.info[600],
      label: 'High Tide',
    },
    low: {
      icon: 'arrow-down-circle' as keyof typeof Ionicons.glyphMap,
      color: colors.warning[600],
      label: 'Low Tide',
    },
    range: {
      icon: 'swap-vertical' as keyof typeof Ionicons.glyphMap,
      color: colors.text.secondary,
      label: 'Tidal Range',
    },
  };

  const { icon, color, label } = config[type];

  return (
    <View style={styles.tideInfoCard}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.tideInfoLabel}>{label}</Text>
      {type === 'range' ? (
        <Text style={styles.tideInfoValue}>{value}</Text>
      ) : (
        <>
          <Text style={styles.tideInfoTime}>{time}</Text>
          <Text style={styles.tideInfoHeight}>{height}</Text>
        </>
      )}
    </View>
  );
};

const getStrengthLabel = (strength: string): string => {
  return strength.charAt(0).toUpperCase() + strength.slice(1);
};

const getCardinalDirection = (deg: number): string => {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return cardinals[index];
};

export const TideCard: React.FC<TideCardProps> = ({
  currentConditions,
  tideData,
  showLiveIndicator = true,
}) => {
  const strengthColor =
    currentConditions.strength === 'slack'
      ? colors.neutral[400]
      : currentConditions.strength === 'moderate'
      ? colors.current
      : colors.danger[600];

  return (
    <Card>
      <CardHeader
        icon="water-outline"
        title="Current & Tide"
        badge={showLiveIndicator ? 'LIVE DATA' : undefined}
        badgeColor={colors.success[600]}
        iconColor={colors.info[600]}
      />

      {/* Current display */}
      <View style={styles.currentDisplay}>
        {/* Current speed */}
        <View style={styles.currentSpeedSection}>
          <View style={styles.currentSpeedDisplay}>
            <Text style={[styles.currentSpeed, { color: strengthColor }]}>
              {currentConditions.speed.toFixed(1)}
            </Text>
            <Text style={styles.currentUnit}>kts</Text>
          </View>

          {/* Strength badge */}
          <Badge
            text={getStrengthLabel(currentConditions.strength).toUpperCase()}
            color={strengthColor}
          />
        </View>

        {/* Current arrow */}
        <CurrentArrow
          direction={currentConditions.direction}
          strength={currentConditions.strength}
        />

        {/* Direction */}
        <Text style={styles.currentDirection}>
          {getCardinalDirection(currentConditions.direction)} ({currentConditions.direction}°)
        </Text>
      </View>

      {/* Tide times */}
      {tideData && (tideData.highTide || tideData.lowTide || tideData.range) && (
        <View style={styles.tideTimesSection}>
          <Text style={styles.sectionLabel}>TIDE INFORMATION</Text>
          <View style={styles.tideTimesRow}>
            {tideData.highTide && (
              <TideInfoCard
                type="high"
                time={tideData.highTide.time}
                height={tideData.highTide.height}
              />
            )}
            {tideData.lowTide && (
              <TideInfoCard
                type="low"
                time={tideData.lowTide.time}
                height={tideData.lowTide.height}
              />
            )}
            {tideData.range && <TideInfoCard type="range" value={tideData.range} />}
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  currentDisplay: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  currentSpeedSection: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  currentSpeedDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentSpeed: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  currentUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  currentDirection: {
    ...Typography.body,
    fontSize: 11,
    color: colors.text.primary,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  tideTimesSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  sectionLabel: {
    ...Typography.captionBold,
    color: colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  tideTimesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tideInfoCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.small,
    padding: Spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  tideInfoLabel: {
    ...Typography.caption,
    fontSize: 8,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  tideInfoTime: {
    ...Typography.bodyBold,
    color: colors.text.primary,
    fontSize: 14,
  },
  tideInfoHeight: {
    ...Typography.caption,
    fontSize: 8,
    color: colors.text.secondary,
  },
  tideInfoValue: {
    ...Typography.bodyBold,
    color: colors.text.primary,
    fontSize: 14,
  },
});
