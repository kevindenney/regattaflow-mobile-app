import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface FleetComparisonMetric {
  id: string;
  label: string;
  value: string;
  benchmark: string;
}

interface FleetPerformanceComparisonProps {
  metrics?: FleetComparisonMetric[];
}

const DEFAULT_METRICS: FleetComparisonMetric[] = [
  { id: '1', label: 'Start Position', value: 'P8', benchmark: 'Fleet median: P12' },
  { id: '2', label: 'Windward Mark', value: '+3 places', benchmark: 'Fleet median: +1' },
  { id: '3', label: 'Downwind VMG', value: '5.9 kt', benchmark: 'Top quartile: 6.1 kt' },
  { id: '4', label: 'Finish', value: 'P6', benchmark: 'Fleet median: P11' },
];

export function FleetPerformanceComparison({ metrics = DEFAULT_METRICS }: FleetPerformanceComparisonProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fleet Comparison</Text>
      {metrics.map((metric) => (
        <View key={metric.id} style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.label}>{metric.label}</Text>
            <Text style={styles.benchmark}>{metric.benchmark}</Text>
          </View>
          <Text style={styles.value}>{metric.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  left: {
    flex: 1,
    marginRight: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  benchmark: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});
