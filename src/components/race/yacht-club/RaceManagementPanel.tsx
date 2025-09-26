import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { OfficialRaceCourse } from './YachtClubRaceBuilder';

interface RaceManagementPanelProps {
  course: OfficialRaceCourse | null;
  onCourseUpdate: (course: OfficialRaceCourse) => void;
}

interface RaceEvent {
  id: string;
  courseId: string;
  startTime: Date;
  actualStartTime?: Date;
  status: 'scheduled' | 'starting' | 'racing' | 'finished' | 'abandoned' | 'postponed';
  division: string;
  fleet: string;
  participants: number;
  weatherConditions?: {
    windSpeed: number;
    windDirection: number;
    visibility: number;
  };
}

interface Protest {
  id: string;
  raceId: string;
  protestingBoat: string;
  protestedBoat: string;
  incident: string;
  rule: string;
  status: 'filed' | 'scheduled' | 'hearing' | 'decided' | 'dismissed';
  filedAt: Date;
  decision?: string;
}

export function RaceManagementPanel({ course, onCourseUpdate }: RaceManagementPanelProps) {
  const [activeRaces, setActiveRaces] = useState<RaceEvent[]>([
    {
      id: 'race-1',
      courseId: course?.id || '',
      startTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
      status: 'scheduled',
      division: 'IRC Division 1',
      fleet: 'Keelboat',
      participants: 24,
      weatherConditions: {
        windSpeed: 12,
        windDirection: 220,
        visibility: 10
      }
    },
    {
      id: 'race-2',
      courseId: course?.id || '',
      startTime: new Date(Date.now() + 90 * 60000), // 90 minutes from now
      status: 'scheduled',
      division: 'IRC Division 2',
      fleet: 'Keelboat',
      participants: 18
    }
  ]);

  const [protests, setProtests] = useState<Protest[]>([
    {
      id: 'protest-1',
      raceId: 'race-1',
      protestingBoat: 'HKG 1234',
      protestedBoat: 'HKG 5678',
      incident: 'Right of way violation at windward mark',
      rule: 'RRS 11',
      status: 'filed',
      filedAt: new Date(Date.now() - 15 * 60000)
    }
  ]);

  const [selectedTab, setSelectedTab] = useState<'racing' | 'protests' | 'scoring'>('racing');

  const handleStartRace = (raceId: string) => {
    setActiveRaces(races => races.map(race =>
      race.id === raceId
        ? { ...race, status: 'starting' as const, actualStartTime: new Date() }
        : race
    ));

    Alert.alert(
      'Race Starting',
      'Start sequence initiated. All boats have been notified.',
      [{ text: 'OK' }]
    );
  };

  const handlePostponeRace = (raceId: string) => {
    setActiveRaces(races => races.map(race =>
      race.id === raceId
        ? { ...race, status: 'postponed' as const }
        : race
    ));

    Alert.alert(
      'Race Postponed',
      'Race has been postponed. Participants will be notified.',
      [{ text: 'OK' }]
    );
  };

  const handleAbandonRace = (raceId: string) => {
    Alert.alert(
      'Abandon Race?',
      'This action cannot be undone. All participants will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: () => {
            setActiveRaces(races => races.map(race =>
              race.id === raceId
                ? { ...race, status: 'abandoned' as const }
                : race
            ));
          }
        }
      ]
    );
  };

  const getStatusColor = (status: RaceEvent['status']) => {
    switch (status) {
      case 'scheduled': return '#6B7280';
      case 'starting': return '#F59E0B';
      case 'racing': return '#10B981';
      case 'finished': return '#3B82F6';
      case 'abandoned': return '#EF4444';
      case 'postponed': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: RaceEvent['status']) => {
    switch (status) {
      case 'scheduled': return '⏰';
      case 'starting': return '🚦';
      case 'racing': return '⛵';
      case 'finished': return '🏁';
      case 'abandoned': return '❌';
      case 'postponed': return '⏸️';
      default: return '📋';
    }
  };

  const TabButton = ({ id, label, active }: { id: typeof selectedTab; label: string; active: boolean }) => (
    <Button
      variant={active ? "default" : "outline"}
      onPress={() => setSelectedTab(id)}
      style={styles.tabButton}
    >
      <ThemedText style={{ color: active ? '#fff' : '#0066CC' }}>{label}</ThemedText>
    </Button>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">🏁 Race Management</ThemedText>
        <ThemedText type="subtitle">
          Live race control and administration
        </ThemedText>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TabButton id="racing" label="🏁 Active Races" active={selectedTab === 'racing'} />
        <TabButton id="protests" label="⚖️ Protests" active={selectedTab === 'protests'} />
        <TabButton id="scoring" label="📊 Scoring" active={selectedTab === 'scoring'} />
      </View>

      <ScrollView style={styles.content}>
        {/* Racing Tab */}
        {selectedTab === 'racing' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Race Events</ThemedText>
              <ThemedText style={styles.sectionSubtext}>
                {activeRaces.length} races scheduled
              </ThemedText>
            </View>

            {activeRaces.map((race) => (
              <View key={race.id} style={styles.raceCard}>
                <View style={styles.raceHeader}>
                  <View style={styles.raceInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.raceDivision}>
                      {getStatusIcon(race.status)} {race.division}
                    </ThemedText>
                    <ThemedText style={[styles.raceStatus, { color: getStatusColor(race.status) }]}>
                      {race.status.toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.raceFleet}>
                    {race.fleet} • {race.participants} boats
                  </ThemedText>
                </View>

                <View style={styles.raceDetails}>
                  <View style={styles.raceTime}>
                    <ThemedText style={styles.raceLabel}>Scheduled Start:</ThemedText>
                    <ThemedText style={styles.raceValue}>
                      {race.startTime.toLocaleTimeString()}
                    </ThemedText>
                  </View>

                  {race.actualStartTime && (
                    <View style={styles.raceTime}>
                      <ThemedText style={styles.raceLabel}>Actual Start:</ThemedText>
                      <ThemedText style={styles.raceValue}>
                        {race.actualStartTime.toLocaleTimeString()}
                      </ThemedText>
                    </View>
                  )}

                  {race.weatherConditions && (
                    <View style={styles.weatherInfo}>
                      <ThemedText style={styles.raceLabel}>Conditions:</ThemedText>
                      <ThemedText style={styles.raceValue}>
                        {race.weatherConditions.windSpeed} kts @ {race.weatherConditions.windDirection}° •
                        {race.weatherConditions.visibility} nm vis
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.raceActions}>
                  {race.status === 'scheduled' && (
                    <>
                      <Button
                        variant="default"
                        onPress={() => handleStartRace(race.id)}
                        style={styles.actionButton}
                      >
                        <ThemedText style={styles.actionButtonText}>🚦 Start Race</ThemedText>
                      </Button>
                      <Button
                        variant="outline"
                        onPress={() => handlePostponeRace(race.id)}
                        style={styles.actionButton}
                      >
                        <ThemedText style={styles.outlineButtonText}>⏸️ Postpone</ThemedText>
                      </Button>
                    </>
                  )}

                  {(race.status === 'starting' || race.status === 'racing') && (
                    <Button
                      variant="outline"
                      onPress={() => handleAbandonRace(race.id)}
                      style={[styles.actionButton, { borderColor: '#EF4444' }]}
                    >
                      <ThemedText style={[styles.outlineButtonText, { color: '#EF4444' }]}>
                        ❌ Abandon
                      </ThemedText>
                    </Button>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Protests Tab */}
        {selectedTab === 'protests' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Active Protests</ThemedText>
              <ThemedText style={styles.sectionSubtext}>
                {protests.filter(p => p.status !== 'decided').length} pending
              </ThemedText>
            </View>

            {protests.map((protest) => (
              <View key={protest.id} style={styles.protestCard}>
                <View style={styles.protestHeader}>
                  <ThemedText type="defaultSemiBold">
                    ⚖️ Protest #{protest.id.slice(-4)}
                  </ThemedText>
                  <ThemedText style={[styles.protestStatus,
                    { color: protest.status === 'decided' ? '#10B981' : '#F59E0B' }
                  ]}>
                    {protest.status.toUpperCase()}
                  </ThemedText>
                </View>

                <View style={styles.protestDetails}>
                  <ThemedText style={styles.protestInfo}>
                    <ThemedText style={styles.protestLabel}>Protestor: </ThemedText>
                    {protest.protestingBoat}
                  </ThemedText>
                  <ThemedText style={styles.protestInfo}>
                    <ThemedText style={styles.protestLabel}>Protested: </ThemedText>
                    {protest.protestedBoat}
                  </ThemedText>
                  <ThemedText style={styles.protestInfo}>
                    <ThemedText style={styles.protestLabel}>Rule: </ThemedText>
                    {protest.rule}
                  </ThemedText>
                  <ThemedText style={styles.protestIncident}>
                    {protest.incident}
                  </ThemedText>
                  <ThemedText style={styles.protestTime}>
                    Filed: {protest.filedAt.toLocaleString()}
                  </ThemedText>
                </View>

                {protest.status === 'filed' && (
                  <View style={styles.protestActions}>
                    <Button variant="default" style={styles.actionButton}>
                      <ThemedText style={styles.actionButtonText}>📋 Schedule Hearing</ThemedText>
                    </Button>
                    <Button variant="outline" style={styles.actionButton}>
                      <ThemedText style={styles.outlineButtonText}>❌ Dismiss</ThemedText>
                    </Button>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Scoring Tab */}
        {selectedTab === 'scoring' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Race Scoring</ThemedText>
              <ThemedText style={styles.sectionSubtext}>
                Results and handicap management
              </ThemedText>
            </View>

            <View style={styles.scoringCard}>
              <ThemedText style={styles.scoringTitle}>📊 Scoring System Integration</ThemedText>
              <ThemedText style={styles.scoringDescription}>
                Connect with SailWave, Regatta Network, or other scoring systems for seamless results management.
              </ThemedText>

              <View style={styles.scoringActions}>
                <Button variant="outline" style={styles.scoringButton}>
                  <ThemedText style={styles.outlineButtonText}>📥 Import Results</ThemedText>
                </Button>
                <Button variant="outline" style={styles.scoringButton}>
                  <ThemedText style={styles.outlineButtonText}>📤 Export Data</ThemedText>
                </Button>
                <Button variant="default" style={styles.scoringButton}>
                  <ThemedText style={styles.actionButtonText}>🔧 Configure</ThemedText>
                </Button>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  raceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  raceDivision: {
    marginBottom: 4,
  },
  raceStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  raceFleet: {
    fontSize: 12,
    color: '#6B7280',
  },
  raceDetails: {
    marginBottom: 16,
  },
  raceTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weatherInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  raceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  raceValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  raceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  outlineButtonText: {
    color: '#0066CC',
    fontSize: 12,
    textAlign: 'center',
  },
  protestCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  protestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  protestStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  protestDetails: {
    marginBottom: 16,
  },
  protestInfo: {
    marginBottom: 4,
  },
  protestLabel: {
    fontWeight: '600',
  },
  protestIncident: {
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
    color: '#374151',
  },
  protestTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  protestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scoringCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scoringTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoringDescription: {
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  scoringActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scoringButton: {
    flex: 1,
    paddingVertical: 10,
  },
});