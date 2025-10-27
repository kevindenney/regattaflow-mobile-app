import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FleetCard } from '@/components/fleets/FleetCard';
import { FleetFeed } from '@/components/fleets/FleetFeed';
import { MembersList } from '@/components/fleets/MembersList';
import { TuningLibrary } from '@/components/fleets/TuningLibrary';
import { Leaderboard } from '@/components/fleets/Leaderboard';

type TabType = 'feed' | 'members' | 'tuning' | 'events' | 'leaderboard';

interface Fleet {
  id: string;
  name: string;
  boat_class: string;
  member_count: number;
  recent_activity?: string;
  user_stats?: {
    rank: number;
    points: number;
    events_participated: number;
  };
}

export default function FleetsScreen() {
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [fleets] = useState<Fleet[]>([
    {
      id: '1',
      name: 'Dragon Hong Kong Fleet',
      boat_class: 'Dragon',
      member_count: 24,
      recent_activity: 'Race results posted 2 hours ago',
      user_stats: {
        rank: 5,
        points: 72,
        events_participated: 10,
      },
    },
    {
      id: '2',
      name: 'J/70 Asian Circuit',
      boat_class: 'J/70',
      member_count: 18,
      recent_activity: 'New tuning guide shared 1 day ago',
      user_stats: {
        rank: 8,
        points: 56,
        events_participated: 6,
      },
    },
  ]);

  const tabs: { id: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'feed', label: 'Feed', icon: 'newspaper' },
    { id: 'members', label: 'Members', icon: 'people' },
    { id: 'tuning', label: 'Tuning', icon: 'construct' },
    { id: 'events', label: 'Events', icon: 'calendar' },
    { id: 'leaderboard', label: 'Standings', icon: 'trophy' },
  ];

  const renderFleetList = () => (
    <View style={styles.listContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Fleets</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="search" size={24} color="#6B7280" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={fleets}
        renderItem={({ item }) => (
          <FleetCard
            fleet={item}
            onPress={() => setSelectedFleet(item)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.fleetsList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.actionButtons}>
            <Pressable style={styles.primaryButton}>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Create Fleet</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton}>
              <Ionicons name="enter" size={20} color="#3B82F6" />
              <Text style={styles.secondaryButtonText}>Join Fleet</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );

  const renderDetailView = () => {
    if (!selectedFleet) return null;

    return (
      <Modal
        visible={!!selectedFleet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedFleet(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Pressable
              style={styles.backButton}
              onPress={() => setSelectedFleet(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </Pressable>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>{selectedFleet.name}</Text>
              <Text style={styles.modalSubtitle}>{selectedFleet.boat_class}</Text>
            </View>
            <Pressable style={styles.iconButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <View style={styles.tabsContainer}>
            {tabs.map(tab => (
              <Pressable
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon}
                  size={20}
                  color={activeTab === tab.id ? '#3B82F6' : '#9CA3AF'}
                />
                <Text style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.tabLabelActive
                ]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'feed' && <FleetFeed fleetId={selectedFleet.id} />}
            {activeTab === 'members' && <MembersList fleetId={selectedFleet.id} />}
            {activeTab === 'tuning' && <TuningLibrary fleetId={selectedFleet.id} />}
            {activeTab === 'events' && (
              <View style={styles.comingSoon}>
                <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                <Text style={styles.comingSoonText}>Events Coming Soon</Text>
              </View>
            )}
            {activeTab === 'leaderboard' && <Leaderboard fleetId={selectedFleet.id} />}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderFleetList()}
      {renderDetailView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fleetsList: {
    paddingVertical: 8,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  comingSoonText: {
    fontSize: 18,
    color: '#9CA3AF',
    marginTop: 16,
  },
});
