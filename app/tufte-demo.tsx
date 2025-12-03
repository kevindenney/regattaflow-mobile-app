/**
 * Tufte Design Showcase
 *
 * Demo page showing before/after comparisons of Tufte-inspired components
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Sparkline, SparklineWithValue } from '@/components/viz/Sparkline';
import { SmallMultiples, ComparisonTable } from '@/components/viz/SmallMultiples';
import { DataTable, CompactDataGrid } from '@/components/viz/DataTable';
import { NextRaceCardTufte } from '@/components/dashboard/NextRaceCardTufte';
import { WeatherCardTufte } from '@/components/race-detail/WeatherCardTufte';

export default function TufteDemoScreen() {
  // Sample data
  const windHistory = [12, 13, 14, 15, 14, 13, 15, 16, 15, 14, 15, 14];
  const tideHistory = [0.5, 0.8, 1.1, 1.3, 1.4, 1.3, 1.0, 0.7, 0.3, 0.1, -0.2, -0.3];

  const raceData = [
    { id: 'r1', title: 'Race 1', subtitle: 'Light wind', data: [10, 11, 12, 11, 10], value: 11.2, unit: 'kts' },
    { id: 'r2', title: 'Race 2', subtitle: 'Moderate', data: [14, 15, 16, 15, 14], value: 14.8, unit: 'kts', highlight: true },
    { id: 'r3', title: 'Race 3', subtitle: 'Strong wind', data: [18, 19, 20, 19, 18], value: 18.6, unit: 'kts' },
  ];

  const compactGridData = [
    { label: 'Wind', value: '14.2', unit: 'kts NE', trend: 'up' as const, sparkline: windHistory },
    { label: 'Tide', value: '+0.8', unit: 'm rising', sparkline: tideHistory },
    { label: 'Current', value: '2.1', unit: 'kts S', trend: 'down' as const },
    { label: 'Wave', value: '0.5', unit: 'm', trend: 'neutral' as const },
    { label: 'Visibility', value: '10', unit: 'km' },
    { label: 'Pressure', value: '1013', unit: 'hPa', trend: 'up' as const },
  ];

  const tableData = [
    { time: '+1h', speed: 15.2, direction: '055° NE', confidence: '92%' },
    { time: '+2h', speed: 16.1, direction: '058° NE', confidence: '87%' },
    { time: '+3h', speed: 17.3, direction: '062° ENE', confidence: '78%' },
    { time: '+4h', speed: 16.8, direction: '065° ENE', confidence: '71%' },
  ];

  const tableColumns = [
    { id: 'time', header: 'Time', width: 60, align: 'left' as const },
    { id: 'speed', header: 'Speed', width: 70, align: 'right' as const, precision: 1 },
    { id: 'direction', header: 'Direction', width: 100, align: 'left' as const },
    { id: 'confidence', header: 'Conf.', width: 70, align: 'right' as const },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tufte Design Showcase</Text>
          <Text style={styles.subtitle}>
            Edward Tufte-inspired components for RegattaFlow
          </Text>
        </View>

        {/* Section: Sparklines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Sparklines</Text>
          <Text style={styles.sectionDesc}>
            "Intense, simple, word-sized graphics" - Edward Tufte
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Basic Sparkline (Wind History)</Text>
            <View style={styles.sparklineExample}>
              <Text style={styles.exampleLabel}>Wind: 15.2 kts</Text>
              <Sparkline
                data={windHistory}
                width={100}
                height={30}
                strokeWidth={1.5}
                color="#0284C7"
                showDot={true}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Sparkline with Value</Text>
            <SparklineWithValue
              value={15.2}
              unit="kts"
              data={windHistory}
              width={80}
              height={24}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Multiple Sparklines (Tide + Wind)</Text>
            <View style={styles.multiSparkline}>
              <View style={styles.sparklineRow}>
                <Text style={styles.sparklineLabel}>Wind</Text>
                <Text style={styles.sparklineValue}>15.2 kts</Text>
                <Sparkline data={windHistory} width={80} height={20} color="#0284C7" />
              </View>
              <View style={styles.sparklineRow}>
                <Text style={styles.sparklineLabel}>Tide</Text>
                <Text style={styles.sparklineValue}>+0.8 m</Text>
                <Sparkline data={tideHistory} width={80} height={20} color="#10B981" />
              </View>
            </View>
          </View>
        </View>

        {/* Section: Small Multiples */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Small Multiples</Text>
          <Text style={styles.sectionDesc}>
            "Compared to what?" - Easy race comparisons
          </Text>

          <View style={styles.card}>
            <SmallMultiples
              items={raceData}
              columns={3}
              sparklineHeight={40}
              sparklineWidth={80}
              showValues={true}
            />
          </View>
        </View>

        {/* Section: Compact Data Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Compact Data Grid</Text>
          <Text style={styles.sectionDesc}>
            Maximum information per square inch
          </Text>

          <View style={styles.card}>
            <CompactDataGrid
              items={compactGridData}
              columns={3}
              showTrends={true}
            />
          </View>
        </View>

        {/* Section: Data Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Table</Text>
          <Text style={styles.sectionDesc}>
            Dense, minimal-border tables
          </Text>

          <View style={styles.card}>
            <DataTable
              columns={tableColumns}
              data={tableData}
              showBorders="horizontal"
              dense={true}
            />
          </View>
        </View>

        {/* Section: NextRaceCard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Next Race Card (Tufte Edition)</Text>
          <Text style={styles.sectionDesc}>
            High data-ink ratio • Precise timing • Comparative context
          </Text>

          <NextRaceCardTufte />
        </View>

        {/* Section: WeatherCard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Weather Card (Tufte Edition)</Text>
          <Text style={styles.sectionDesc}>
            Compact notation • Sparklines • Forecast confidence
          </Text>

          <WeatherCardTufte
            windConditions={{
              speed: 15.2,
              direction: 55,
              gusts: 18.1,
              beaufortScale: 4,
            }}
            windHistory={windHistory}
            historicalAverage={12.5}
            showLiveIndicator={true}
          />
        </View>

        {/* Design Principles Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tufte Principles Applied</Text>
          <View style={styles.principlesList}>
            <Text style={styles.principle}>✅ Maximize data-ink ratio</Text>
            <Text style={styles.principle}>✅ High information density</Text>
            <Text style={styles.principle}>✅ Integrate text and graphics</Text>
            <Text style={styles.principle}>✅ Small multiples for comparison</Text>
            <Text style={styles.principle}>✅ Sparklines for inline trends</Text>
            <Text style={styles.principle}>✅ Precise, credible data</Text>
            <Text style={styles.principle}>✅ Comparative context</Text>
            <Text style={styles.principle}>✅ Minimal chartjunk</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#0284C7',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  sparklineExample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  multiSparkline: {
    gap: 12,
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparklineLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    width: 50,
  },
  sparklineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    width: 70,
    fontVariant: ['tabular-nums'],
  },
  principlesList: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    padding: 16,
    borderRadius: 4,
    gap: 8,
  },
  principle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
});
