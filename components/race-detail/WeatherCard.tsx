/**
 * WeatherCard Component
 *
 * Displays wind and weather conditions with visual elements
 * Apple Weather-inspired design
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/race-ui/Card';
import { CardHeader } from '@/components/race-ui/CardHeader';
import { WindCompass } from './weather/WindCompass';
import { Typography, Spacing, colors, BorderRadius } from '@/constants/designSystem';

interface WindConditions {
  speed: number; // knots
  direction: number; // 0-360 degrees
  gusts?: number; // knots
  beaufortScale?: number; // 0-12
  description?: string; // e.g., "Fresh breeze"
}

interface WeatherCardProps {
  windConditions: WindConditions;
  showLiveIndicator?: boolean;
}

const getBeaufortDescription = (scale?: number): string => {
  if (scale === undefined) return '';
  const descriptions = [
    'Calm',
    'Light air',
    'Light breeze',
    'Gentle breeze',
    'Moderate breeze',
    'Fresh breeze',
    'Strong breeze',
    'Near gale',
    'Gale',
    'Strong gale',
    'Storm',
    'Violent storm',
    'Hurricane',
  ];
  return descriptions[Math.min(scale, 12)] || '';
};

export const WeatherCard: React.FC<WeatherCardProps> = ({
  windConditions,
  showLiveIndicator = true,
}) => {
  const beaufortDesc =
    windConditions.description || getBeaufortDescription(windConditions.beaufortScale);

  return (
    <Card>
      <CardHeader
        icon="partly-sunny-outline"
        title="Wind & Weather"
        badge={showLiveIndicator ? 'LIVE DATA' : undefined}
        badgeColor={colors.success[600]}
        iconColor={colors.warning[600]}
      />

      {/* Current conditions - BIG AND VISUAL */}
      <View style={styles.currentConditions}>
        {/* Wind speed display */}
        <View style={styles.windSpeedSection}>
          <View style={styles.windSpeedDisplay}>
            <Text style={styles.windSpeed}>{windConditions.speed}</Text>
            <Text style={styles.windUnit}>kts</Text>
          </View>

          {/* Gusts indicator */}
          {windConditions.gusts && windConditions.gusts > windConditions.speed && (
            <View style={styles.gustsDisplay}>
              <Ionicons name="arrow-up-outline" size={12} color={colors.danger[600]} />
              <Text style={styles.gustsText}>Gusts to {windConditions.gusts} kts</Text>
            </View>
          )}
        </View>

        {/* Wind compass */}
        <WindCompass direction={windConditions.direction} size={80} />

        {/* Beaufort scale description */}
        {beaufortDesc && (
          <View style={styles.descriptionSection}>
            {windConditions.beaufortScale !== undefined && (
              <Text style={styles.beaufortScale}>Force {windConditions.beaufortScale}</Text>
            )}
            <Text style={styles.windDescription}>{beaufortDesc}</Text>
          </View>
        )}
      </View>

      {/* Race time forecast section */}
      <View style={styles.forecastSection}>
        <Text style={styles.sectionLabel}>RACE TIME CONDITIONS</Text>
        <View style={styles.forecastCard}>
          <View style={styles.forecastRow}>
            <Ionicons name="cloudy" size={14} color={colors.wind} />
            <Text style={styles.forecastText}>
              {windConditions.speed} kts from {getCardinalDirection(windConditions.direction)}
            </Text>
          </View>
          {windConditions.gusts && (
            <View style={styles.forecastRow}>
              <Ionicons name="trending-up" size={14} color={colors.danger[600]} />
              <Text style={styles.forecastText}>Gusts up to {windConditions.gusts} kts</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

// Helper function to get cardinal direction
const getCardinalDirection = (deg: number): string => {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return cardinals[index];
};

const styles = StyleSheet.create({
  currentConditions: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  windSpeedSection: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  windSpeedDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  windSpeed: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.wind,
    lineHeight: 40,
  },
  windUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  gustsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: colors.danger[50],
    borderRadius: BorderRadius.small,
  },
  gustsText: {
    ...Typography.body,
    fontSize: 11,
    color: colors.danger[700],
    fontWeight: '600',
  },
  descriptionSection: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  beaufortScale: {
    ...Typography.captionBold,
    color: colors.text.secondary,
    marginBottom: 1,
  },
  windDescription: {
    ...Typography.body,
    fontSize: 11,
    color: colors.text.primary,
    fontWeight: '500',
  },
  forecastSection: {
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
  forecastCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.small,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  forecastText: {
    ...Typography.body,
    fontSize: 11,
    color: colors.text.primary,
    flex: 1,
  },
});
