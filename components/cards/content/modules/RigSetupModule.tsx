/**
 * RigSetupModule
 *
 * Displays rig tuning recommendations based on conditions.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Wrench, Gauge, ArrowUpDown } from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface RigSetupModuleProps extends ContentModuleProps<CardRaceData> {}

/**
 * Rig Setup content module
 */
function RigSetupModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: RigSetupModuleProps) {
  if (isCollapsed) {
    return null;
  }

  // Get wind conditions for tuning recommendations
  const wind = race.wind;
  const windRange = wind
    ? `${wind.speedMin}-${wind.speedMax} kt`
    : 'Unknown';

  // Generate tuning recommendations based on wind
  const tuning = getTuningRecommendations(wind);

  return (
    <View style={styles.container}>
      {/* Conditions Summary */}
      <View style={styles.conditionsBar}>
        <Text style={styles.conditionsLabel}>Tuning for:</Text>
        <Text style={styles.conditionsValue}>{windRange}</Text>
      </View>

      {/* Tuning Settings */}
      <View style={styles.settingsGrid}>
        {tuning.settings.map((setting, index) => (
          <View key={index} style={styles.settingItem}>
            <Text style={styles.settingLabel}>{setting.label}</Text>
            <Text style={styles.settingValue}>{setting.value}</Text>
          </View>
        ))}
      </View>

      {/* Notes */}
      {tuning.notes && (
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <Wrench size={14} color={IOS_COLORS.gray} />
            <Text style={styles.notesTitle}>Notes</Text>
          </View>
          <Text style={styles.notesText}>{tuning.notes}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Generate tuning recommendations based on wind conditions
 */
function getTuningRecommendations(wind: CardRaceData['wind']) {
  const avgWind = wind ? (wind.speedMin + wind.speedMax) / 2 : 12;

  if (avgWind < 8) {
    // Light air
    return {
      settings: [
        { label: 'Uppers', value: '28-30' },
        { label: 'Lowers', value: 'Loose' },
        { label: 'Mast Rake', value: 'Max aft' },
        { label: 'Spreaders', value: 'Swept' },
      ],
      notes: 'Light air setup: maximize power, reduce drag. Keep crew weight forward.',
    };
  } else if (avgWind < 15) {
    // Medium
    return {
      settings: [
        { label: 'Uppers', value: '32-34' },
        { label: 'Lowers', value: 'Medium' },
        { label: 'Mast Rake', value: 'Medium' },
        { label: 'Spreaders', value: 'Neutral' },
      ],
      notes: 'Medium conditions: balance setup. Adjust tension for gusts.',
    };
  } else {
    // Heavy
    return {
      settings: [
        { label: 'Uppers', value: '36+' },
        { label: 'Lowers', value: 'Firm' },
        { label: 'Mast Rake', value: 'Forward' },
        { label: 'Spreaders', value: 'Straight' },
      ],
      notes: 'Heavy air: depower setup. Consider smaller headsail if available.',
    };
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 12,
  },
  conditionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.gray6,
    padding: 10,
    borderRadius: 8,
  },
  conditionsLabel: {
    fontSize: 13,
    color: IOS_COLORS.gray,
  },
  conditionsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.blue,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingItem: {
    width: '47%',
    backgroundColor: IOS_COLORS.systemBackground,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  notesSection: {
    backgroundColor: `${IOS_COLORS.blue}08`,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.blue,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  notesText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
});

export default RigSetupModule;
