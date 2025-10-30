import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DashboardKPICard, DashboardSection, QuickAction, QuickActionGrid } from '../shared';
import { createLogger } from '@/lib/utils/logger';

interface UpcomingRace {
  id: string;
  title: string;
  venue: string;
  country: string;
  startDate: string;
  daysUntil: number;
  strategyStatus: 'ready' | 'in_progress' | 'pending';
  weatherConfidence: number;
  hasDocuments: boolean;
  hasTuningGuides?: boolean;
  hasCrewAssigned?: boolean;
  classId?: string;
}

interface SailorStats {
  totalRegattas: number;
  venuesVisited: number;
  avgPosition: number;
  globalRanking: number;
  recentRaces: number;
  strategyWinRate: number;
}

interface SailorOverviewProps {
  upcomingRaces: UpcomingRace[];
  stats: SailorStats;
  currentVenue?: {
    name: string;
    country: string;
    confidence: number;
  };
  onRacePress: (raceId: string) => void;
  onPlanStrategy: (raceId: string) => void;
  onUploadDocuments: () => void;
  onCheckWeather: () => void;
  onViewVenues: () => void;
}

const logger = createLogger('SailorOverview');
export function SailorOverview({
  upcomingRaces,
  stats,
  currentVenue,
  onRacePress,
  onPlanStrategy,
  onUploadDocuments,
  onCheckWeather,
  onViewVenues
}: SailorOverviewProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'plan-strategy',
      title: 'Plan Race Strategy',
      icon: 'compass-rose',
      iconSet: 'mci',
      gradientColors: ['#667eea', '#764ba2'],
      onPress: () => onPlanStrategy(upcomingRaces?.[0]?.id || ''),
    },
    {
      id: 'upload-docs',
      title: 'Upload Documents',
      icon: 'file-upload-outline',
      iconSet: 'mci',
      gradientColors: ['#f093fb', '#f5576c'],
      onPress: onUploadDocuments,
    },
    {
      id: 'check-weather',
      title: 'Check Weather',
      icon: 'weather-windy',
      iconSet: 'mci',
      gradientColors: ['#4facfe', '#00f2fe'],
      onPress: onCheckWeather,
    },
  ];

  const getStrategyStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'pending': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStrategyStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Strategy Ready';
      case 'in_progress': return 'In Progress';
      case 'pending': return 'Needs Planning';
      default: return 'Unknown';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Current Venue Context */}
      {currentVenue && (
        <DashboardSection
          title="📍 Current Location"
          subtitle="Auto-detected venue with global intelligence"
          showBorder={false}
          padding={16}
        >
          <LinearGradient
            colors={['#4C63D2', '#667eea']}
            style={styles.venueCard}
          >
            <View style={styles.venueInfo}>
              <Text style={styles.venueName}>{currentVenue.name}</Text>
              <Text style={styles.venueLocation}>{currentVenue.country}</Text>
              <Text style={styles.venueConfidence}>
                Confidence: {Math.round(currentVenue.confidence * 100)}%
              </Text>
            </View>
            <TouchableOpacity
              style={styles.venueAction}
              onPress={onViewVenues}
            >
              <MaterialCommunityIcons name="map-search" size={20} color="#FFFFFF" />
              <Text style={styles.venueActionText}>View Details</Text>
            </TouchableOpacity>
          </LinearGradient>
        </DashboardSection>
      )}

      {/* Upcoming Races - Featured Section */}
      <DashboardSection
        title="🏁 Upcoming Races"
        subtitle="Your racing pipeline with strategy status"
        headerAction={{
          label: 'View All',
          onPress: () => logger.debug('View all races'),
          icon: 'calendar-outline'
        }}
      >
        {upcomingRaces.slice(0, 3).map((race) => (
          <TouchableOpacity
            key={race.id}
            style={styles.raceCard}
            onPress={() => onRacePress(race.id)}
          >
            <View style={styles.raceHeader}>
              <View style={styles.raceInfo}>
                <Text style={styles.raceTitle}>{race.title}</Text>
                <Text style={styles.raceVenue}>{race.venue} • {race.country}</Text>
                <Text style={styles.raceDate}>{race.startDate}</Text>
              </View>
              <View style={styles.raceCountdown}>
                <Text style={styles.countdownNumber}>{race.daysUntil}</Text>
                <Text style={styles.countdownLabel}>days</Text>
              </View>
            </View>

            <View style={styles.raceStatus}>
              <View style={styles.statusItem}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: getStrategyStatusColor(race.strategyStatus) }
                ]} />
                <Text style={styles.statusText}>
                  {getStrategyStatusText(race.strategyStatus)}
                </Text>
              </View>

              <View style={styles.statusItem}>
                <MaterialCommunityIcons
                  name={race.hasDocuments ? 'file-document-check-outline' : 'file-alert-outline'}
                  size={16}
                  color={race.hasDocuments ? '#10B981' : '#F59E0B'}
                />
                <Text style={styles.statusText}>
                  {race.hasDocuments ? 'Documents Ready' : 'Missing Documents'}
                </Text>
              </View>

              <View style={styles.statusItem}>
                <MaterialCommunityIcons
                  name={race.hasTuningGuides ? 'tune-variant' : 'tune-vertical'}
                  size={16}
                  color={race.hasTuningGuides ? '#10B981' : '#94A3B8'}
                />
                <Text style={styles.statusText}>
                  {race.hasTuningGuides ? 'Tuning Guides' : 'No Tuning Guides'}
                </Text>
              </View>

              <View style={styles.statusItem}>
                <MaterialCommunityIcons
                  name={race.hasCrewAssigned ? 'account-group' : 'account-group-outline'}
                  size={16}
                  color={race.hasCrewAssigned ? '#10B981' : '#94A3B8'}
                />
                <Text style={styles.statusText}>
                  {race.hasCrewAssigned ? 'Crew Assigned' : 'No Crew'}
                </Text>
              </View>

              <View style={styles.statusItem}>
                <MaterialCommunityIcons name="weather-windy" size={16} color="#3B82F6" />
                <Text style={styles.statusText}>
                  Weather {race.weatherConfidence}% confident
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.strategyButton}
              onPress={() => onPlanStrategy(race.id)}
            >
              <MaterialCommunityIcons name="compass-rose" size={16} color="#FFFFFF" />
              <Text style={styles.strategyButtonText}>
                {race.strategyStatus === 'ready' ? 'Review Strategy' : 'Plan Strategy'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {upcomingRaces.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="sail-boat" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Upcoming Races</Text>
            <Text style={styles.emptyText}>Add races to your calendar to see them here</Text>
          </View>
        )}
      </DashboardSection>

      {/* Performance Stats */}
      <DashboardSection title="📊 Performance Overview" showBorder={false}>
        <View style={styles.statsGrid}>
          <DashboardKPICard
            title="Total Regattas"
            value={stats.totalRegattas}
            icon="trophy-outline"
            iconColor="#FF9800"
            trend={{ direction: 'up', value: '+3 this year' }}
          />
          <DashboardKPICard
            title="Venues Visited"
            value={stats.venuesVisited}
            icon="location-outline"
            iconColor="#9C27B0"
          />
          <DashboardKPICard
            title="Avg Position"
            value={stats.avgPosition.toFixed(1)}
            icon="podium-outline"
            iconColor="#4CAF50"
            trend={{ direction: 'up', value: '+0.8' }}
          />
          <DashboardKPICard
            title="Global Ranking"
            value={`#${stats.globalRanking}`}
            icon="globe-outline"
            iconColor="#2196F3"
            trend={{ direction: 'up', value: '+12' }}
          />
        </View>
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection title="⚡ Quick Actions" showBorder={false}>
        <QuickActionGrid actions={quickActions} />
      </DashboardSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  venueCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  venueConfidence: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  venueAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  venueActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  raceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 2px',
    elevation: 2,
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  raceInfo: {
    flex: 1,
  },
  raceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  raceVenue: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 2,
  },
  raceDate: {
    fontSize: 14,
    color: '#64748B',
  },
  raceCountdown: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  countdownNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D97706',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  raceStatus: {
    marginBottom: 12,
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
  },
  strategyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  strategyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: -4,
  },
});