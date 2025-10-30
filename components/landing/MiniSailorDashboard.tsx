import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export function MiniSailorDashboard() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>12</Text>
          <Text style={styles.kpiLabel}>Regattas</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>3rd</Text>
          <Text style={styles.kpiLabel}>Avg Pos</Text>
        </View>
      </View>

      {/* Next Race Card */}
      <View style={styles.raceCard}>
        <View style={styles.raceHeader}>
          <Ionicons name="boat" size={16} color="#3E92CC" />
          <Text style={styles.raceTitle}>Next Race</Text>
        </View>
        <Text style={styles.raceName}>Spring Championship</Text>
        <Text style={styles.raceVenue}>Hong Kong YC</Text>
        <View style={styles.raceStats}>
          <View style={styles.raceStat}>
            <Ionicons name="location" size={10} color="#10B981" />
            <Text style={styles.raceStatText}>Strategy Ready</Text>
          </View>
          <View style={styles.raceStat}>
            <Ionicons name="sunny" size={10} color="#F59E0B" />
            <Text style={styles.raceStatText}>14kt NE</Text>
          </View>
        </View>
      </View>

      {/* Weather Card */}
      <View style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
          <Ionicons name="cloud-outline" size={16} color="#3B82F6" />
          <Text style={styles.weatherTitle}>Weather Intel</Text>
        </View>
        <View style={styles.weatherGrid}>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherLabel}>Wind</Text>
            <Text style={styles.weatherValue}>14kt</Text>
          </View>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherLabel}>Gusts</Text>
            <Text style={styles.weatherValue}>18kt</Text>
          </View>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherLabel}>Tide</Text>
            <Text style={styles.weatherValue}>+1.2m</Text>
          </View>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherLabel}>Swell</Text>
            <Text style={styles.weatherValue}>0.5m</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        <View style={[styles.actionCard, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="compass-outline" size={20} color="#3B82F6" />
          <Text style={styles.actionText}>Plan Strategy</Text>
        </View>
        <View style={[styles.actionCard, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="document-text-outline" size={20} color="#10B981" />
          <Text style={styles.actionText}>Upload Docs</Text>
        </View>
      </View>

      {/* Recent Performance */}
      <View style={styles.performanceCard}>
        <Text style={styles.performanceTitle}>Recent Races</Text>
        <View style={styles.performanceItem}>
          <View style={styles.performanceRank}>
            <Text style={styles.performancePosition}>2nd</Text>
          </View>
          <View style={styles.performanceDetails}>
            <Text style={styles.performanceName}>Winter Series R3</Text>
            <Text style={styles.performanceDate}>Mar 15, 2025</Text>
          </View>
        </View>
        <View style={styles.performanceItem}>
          <View style={styles.performanceRank}>
            <Text style={styles.performancePosition}>4th</Text>
          </View>
          <View style={styles.performanceDetails}>
            <Text style={styles.performanceName}>Winter Series R2</Text>
            <Text style={styles.performanceDate}>Mar 8, 2025</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E92CC',
  },
  kpiLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  raceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  raceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  raceTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  raceName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  raceVenue: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 6,
  },
  raceStats: {
    flexDirection: 'row',
    gap: 8,
  },
  raceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  raceStatText: {
    fontSize: 9,
    color: '#6B7280',
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  weatherTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  weatherItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  weatherLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  weatherValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  actionCard: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#374151',
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  performanceTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  performanceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  performancePosition: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  performanceDetails: {
    flex: 1,
  },
  performanceName: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1F2937',
  },
  performanceDate: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 1,
  },
});
