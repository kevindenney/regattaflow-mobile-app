/**
 * ConditionsModule
 *
 * Displays weather and environmental conditions for the race.
 * Wraps existing ConditionsDetailCard for use in expanded card.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Wind, Waves, Thermometer, CloudRain } from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import { TinySparkline } from '@/components/shared/charts';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface ConditionsModuleProps extends ContentModuleProps<CardRaceData> {}

/**
 * Conditions content module
 */
function ConditionsModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: ConditionsModuleProps) {
  // Extract wind and tide from race data
  const wind = race.wind;
  const tide = race.tide;

  if (isCollapsed) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Wind Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Wind size={14} color={IOS_COLORS.blue} />
          <Text style={styles.sectionTitle}>Wind</Text>
        </View>
        {wind ? (
          <View style={styles.dataRow}>
            <Text style={styles.dataValue}>
              {wind.speedMin}-{wind.speedMax} kt
            </Text>
            <Text style={styles.dataLabel}>{wind.direction}</Text>
          </View>
        ) : (
          <Text style={styles.noData}>No wind data available</Text>
        )}
      </View>

      {/* Tide Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Waves size={14} color={IOS_COLORS.teal} />
          <Text style={styles.sectionTitle}>Tide</Text>
        </View>
        {tide ? (
          <View style={styles.dataRow}>
            <Text style={styles.dataValue}>
              {tide.state.charAt(0).toUpperCase() + tide.state.slice(1)}
            </Text>
            {tide.height !== undefined && (
              <Text style={styles.dataLabel}>{tide.height.toFixed(1)}m</Text>
            )}
          </View>
        ) : (
          <Text style={styles.noData}>No tide data available</Text>
        )}
      </View>

      {/* Additional conditions based on phase */}
      {phase === 'days_before' && (
        <View style={styles.alertSection}>
          <Text style={styles.alertText}>
            Check final forecast before launch
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 12,
  },
  section: {
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  dataLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  noData: {
    fontSize: 13,
    color: IOS_COLORS.gray2,
    fontStyle: 'italic',
  },
  alertSection: {
    backgroundColor: `${IOS_COLORS.yellow}15`,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.orange,
  },
  alertText: {
    fontSize: 12,
    color: IOS_COLORS.orange,
    fontWeight: '500',
  },
});

export default ConditionsModule;
