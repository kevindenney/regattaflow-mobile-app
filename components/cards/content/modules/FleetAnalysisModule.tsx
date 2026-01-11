/**
 * FleetAnalysisModule
 *
 * Displays fleet composition and competitor analysis.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Users, TrendingUp, Award } from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface FleetAnalysisModuleProps extends ContentModuleProps<CardRaceData> {}

/**
 * Fleet Analysis content module
 */
function FleetAnalysisModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: FleetAnalysisModuleProps) {
  if (isCollapsed) {
    return null;
  }

  // Extract fleet info from race data
  const boatClass = race.boatClass || (race as any).boat_class;
  const fleetSize = (race as any).fleet_size || (race as any).entries?.length;

  return (
    <View style={styles.container}>
      {/* Fleet Summary */}
      <View style={styles.summaryRow}>
        {boatClass && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Class</Text>
            <Text style={styles.summaryValue}>{boatClass}</Text>
          </View>
        )}
        {fleetSize && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Entries</Text>
            <Text style={styles.summaryValue}>{fleetSize}</Text>
          </View>
        )}
      </View>

      {/* Key Competitors Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Award size={14} color={IOS_COLORS.orange} />
          <Text style={styles.sectionTitle}>Key Competitors</Text>
        </View>
        <View style={styles.competitorsList}>
          {/* Placeholder - would be populated from actual data */}
          <View style={styles.competitorPlaceholder}>
            <Users size={16} color={IOS_COLORS.gray2} />
            <Text style={styles.placeholderText}>
              Competitor data will appear here
            </Text>
          </View>
        </View>
      </View>

      {/* Fleet Trends */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={14} color={IOS_COLORS.green} />
          <Text style={styles.sectionTitle}>Fleet Trends</Text>
        </View>
        <Text style={styles.trendsText}>
          Analysis available after series data collected
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  competitorsList: {
    gap: 8,
  },
  competitorPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
  },
  placeholderText: {
    fontSize: 13,
    color: IOS_COLORS.gray2,
    fontStyle: 'italic',
  },
  trendsText: {
    fontSize: 13,
    color: IOS_COLORS.gray2,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
  },
});

export default FleetAnalysisModule;
