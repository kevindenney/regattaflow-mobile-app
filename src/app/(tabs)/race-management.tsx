import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';

export default function RaceManagementScreen() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const TabButton = ({ id, title, isActive, onPress }: {
    id: string;
    title: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <ThemedText style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Race Management</ThemedText>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle" size={32} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="flag-outline" size={28} color="#007AFF" />
            <ThemedText style={styles.actionTitle}>Start Race</ThemedText>
            <ThemedText style={styles.actionSubtitle}>Begin race sequence</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="timer-outline" size={28} color="#10B981" />
            <ThemedText style={styles.actionTitle}>Results</ThemedText>
            <ThemedText style={styles.actionSubtitle}>Enter finish times</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TabButton
            id="upcoming"
            title="Upcoming"
            isActive={activeTab === 'upcoming'}
            onPress={() => setActiveTab('upcoming')}
          />
          <TabButton
            id="active"
            title="Active"
            isActive={activeTab === 'active'}
            onPress={() => setActiveTab('active')}
          />
          <TabButton
            id="completed"
            title="Completed"
            isActive={activeTab === 'completed'}
            onPress={() => setActiveTab('completed')}
          />
        </View>

        <View style={styles.section}>
          {activeTab === 'upcoming' && (
            <>
              <ThemedText style={styles.sectionTitle}>Upcoming Races</ThemedText>
              {[
                {
                  name: 'Spring Championship - Race 1',
                  date: 'March 15, 2024',
                  time: '10:00 AM',
                  fleet: 'Dragon Class',
                  entries: 12,
                  status: 'Ready'
                },
                {
                  name: 'Spring Championship - Race 2',
                  date: 'March 15, 2024',
                  time: '2:00 PM',
                  fleet: 'Dragon Class',
                  entries: 12,
                  status: 'Pending'
                },
                {
                  name: 'Junior Training Race',
                  date: 'March 22, 2024',
                  time: '11:00 AM',
                  fleet: 'Optimist',
                  entries: 8,
                  status: 'Setup Required'
                },
              ].map((race, i) => (
                <TouchableOpacity key={i} style={styles.raceCard}>
                  <View style={styles.raceHeader}>
                    <ThemedText style={styles.raceName}>{race.name}</ThemedText>
                    <View style={[
                      styles.statusBadge,
                      {
                        backgroundColor: race.status === 'Ready' ? '#10B98120' :
                                      race.status === 'Pending' ? '#F59E0B20' : '#EF444420'
                      }
                    ]}>
                      <ThemedText style={[
                        styles.statusText,
                        {
                          color: race.status === 'Ready' ? '#10B981' :
                                race.status === 'Pending' ? '#F59E0B' : '#EF4444'
                        }
                      ]}>
                        {race.status}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.raceInfo}>
                    <View style={styles.raceInfoRow}>
                      <Ionicons name="calendar-outline" size={16} color="#64748B" />
                      <ThemedText style={styles.raceInfoText}>{race.date} at {race.time}</ThemedText>
                    </View>
                    <View style={styles.raceInfoRow}>
                      <Ionicons name="sailboat" size={16} color="#64748B" />
                      <ThemedText style={styles.raceInfoText}>{race.fleet}</ThemedText>
                    </View>
                    <View style={styles.raceInfoRow}>
                      <Ionicons name="people-outline" size={16} color="#64748B" />
                      <ThemedText style={styles.raceInfoText}>{race.entries} entries</ThemedText>
                    </View>
                  </View>
                  <View style={styles.raceActions}>
                    <TouchableOpacity style={styles.raceActionButton}>
                      <Ionicons name="settings-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.raceActionButton}>
                      <Ionicons name="play-outline" size={20} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {activeTab === 'active' && (
            <>
              <ThemedText style={styles.sectionTitle}>Active Races</ThemedText>
              <View style={styles.activeRaceCard}>
                <View style={styles.activeRaceHeader}>
                  <ThemedText style={styles.activeRaceName}>Spring Championship - Race 1</ThemedText>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <ThemedText style={styles.liveText}>LIVE</ThemedText>
                  </View>
                </View>
                <View style={styles.raceTimer}>
                  <ThemedText style={styles.timerText}>12:34</ThemedText>
                  <ThemedText style={styles.timerLabel}>Race Time</ThemedText>
                </View>
                <View style={styles.raceControls}>
                  <TouchableOpacity style={styles.controlButton}>
                    <Ionicons name="flag-outline" size={24} color="#FFFFFF" />
                    <ThemedText style={styles.controlButtonText}>Finish</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.controlButton, styles.controlButtonSecondary]}>
                    <Ionicons name="pause-outline" size={24} color="#007AFF" />
                    <ThemedText style={[styles.controlButtonText, styles.controlButtonTextSecondary]}>
                      Pause
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {activeTab === 'completed' && (
            <>
              <ThemedText style={styles.sectionTitle}>Recent Results</ThemedText>
              {[
                {
                  name: 'Winter Series - Final',
                  date: 'March 8, 2024',
                  winner: 'Sarah Johnson',
                  participants: 15
                },
                {
                  name: 'Training Race',
                  date: 'March 1, 2024',
                  winner: 'Mike Chen',
                  participants: 8
                },
              ].map((race, i) => (
                <TouchableOpacity key={i} style={styles.resultCard}>
                  <View style={styles.resultInfo}>
                    <ThemedText style={styles.resultName}>{race.name}</ThemedText>
                    <ThemedText style={styles.resultDate}>{race.date}</ThemedText>
                    <ThemedText style={styles.resultWinner}>Winner: {race.winner}</ThemedText>
                  </View>
                  <View style={styles.resultActions}>
                    <TouchableOpacity style={styles.resultAction}>
                      <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resultAction}>
                      <Ionicons name="share-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    padding: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 15,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 15,
  },
  raceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  raceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  raceInfo: {
    marginBottom: 12,
  },
  raceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  raceInfoText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  raceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  raceActionButton: {
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  activeRaceCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  activeRaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activeRaceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  raceTimer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timerLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  raceControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonSecondary: {
    backgroundColor: '#FFFFFF',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  controlButtonTextSecondary: {
    color: '#007AFF',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  resultWinner: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resultAction: {
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
});