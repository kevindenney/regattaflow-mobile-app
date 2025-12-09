import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RaceCommsModal } from '@/components/ai/RaceCommsModal';
import { useRaceCommsDraft } from '@/hooks/ai/useRaceCommsDraft';
import { SailwaveImportModal } from '@/components/sailwave';

const UPCOMING_RACES = [
  {
    id: 'race-1',
    name: 'Spring Championship • Race 1',
    start: '2024-03-15T10:00:00Z',
    fleet: 'Dragon Class',
    entries: 12,
    status: 'Ready',
  },
  {
    id: 'race-2',
    name: 'Spring Championship • Race 2',
    start: '2024-03-15T14:00:00Z',
    fleet: 'Dragon Class',
    entries: 12,
    status: 'Pending',
  },
  {
    id: 'race-3',
    name: 'Junior Training Scrimmage',
    start: '2024-03-22T11:00:00Z',
    fleet: 'Optimist',
    entries: 8,
    status: 'Setup Required',
  },
];

const ACTIVE_RACES = [
  {
    id: 'race-live',
    name: 'Spring Championship • Race 1',
    elapsed: '00:24:16',
    course: 'Windward / Leeward',
    checkIn: 11,
  },
];

const COMPLETED_RACES = [
  {
    id: 'race-done-1',
    name: 'Winter Series • Final',
    finished: '2024-03-08T16:00:00Z',
    winner: 'Sarah Johnson',
    boats: 15,
  },
  {
    id: 'race-done-2',
    name: 'Training Race',
    finished: '2024-03-01T16:00:00Z',
    winner: 'Mike Chen',
    boats: 8,
  },
];

const STATUS_COLORS: Record<string, string> = {
  Ready: '#10B981',
  Pending: '#F59E0B',
  'Setup Required': '#EF4444',
};

const QuickAction = ({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={styles.quickIcon}>
      <Ionicons name={icon} size={18} color="#2563EB" />
    </View>
    <View style={{ flex: 1 }}>
      <ThemedText style={styles.quickLabel}>{label}</ThemedText>
      <ThemedText style={styles.quickHelper}>{subtitle}</ThemedText>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
  </TouchableOpacity>
);

export default function RaceManagementScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active' | 'completed'>('upcoming');
  const [commsModalVisible, setCommsModalVisible] = useState(false);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [selectedRaceName, setSelectedRaceName] = useState<string | null>(null);
  const [sailwaveModalVisible, setSailwaveModalVisible] = useState(false);
  const {
    draft: commsDraft,
    isGenerating: commsGenerating,
    error: commsError,
    generate: generateComms,
    reset: resetComms,
    lastGeneratedAt: commsGeneratedAt,
  } = useRaceCommsDraft({
    raceId: selectedRaceId,
    enabled: commsModalVisible,
  });

  useEffect(() => {
    if (commsModalVisible && selectedRaceId) {
      generateComms();
    }
  }, [commsModalVisible, selectedRaceId, generateComms]);

  const openCommsModal = (raceId: string, raceName: string) => {
    setSelectedRaceId(raceId);
    setSelectedRaceName(raceName);
    setCommsModalVisible(true);
  };

  const closeCommsModal = () => {
    setCommsModalVisible(false);
    setSelectedRaceId(null);
    setSelectedRaceName(null);
    resetComms();
  };

  const metrics = useMemo(() => {
    return [
      {
        key: 'upcoming',
        label: 'Upcoming Races',
        value: UPCOMING_RACES.length,
        helper: 'Scheduled and ready to brief',
        icon: 'calendar-outline',
      },
      {
        key: 'active',
        label: 'On the water',
        value: ACTIVE_RACES.length,
        helper: 'Running right now',
        icon: 'speedometer-outline',
      },
      {
        key: 'results',
        label: 'Results posted',
        value: COMPLETED_RACES.length,
        helper: 'Awaiting publishing review',
        icon: 'trophy-outline',
      },
    ];
  }, []);

  const quickActions = [
    {
      icon: 'flag-outline',
      label: 'Launch start sequence',
      subtitle: 'Signal timers & notify fleet',
      onPress: () => Alert.alert('Start sequence', 'Race automation coming soon.'),
    },
    {
      icon: 'document-text-outline',
      label: 'Post course updates',
      subtitle: 'Share mark changes instantly',
      onPress: () => Alert.alert('Course updates', 'Course management coming soon.'),
    },
    {
      icon: 'timer-outline',
      label: 'Record finishes',
      subtitle: 'Capture times & penalties',
      onPress: () => Alert.alert('Record finishes', 'Finish recording is coming soon.'),
    },
  ] as const;

  const renderUpcoming = () => (
    <View style={styles.listColumn}>
      {UPCOMING_RACES.map((race) => (
        <View key={race.id} style={styles.upcomingCard}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>{race.name}</ThemedText>
            <View
              style={[styles.statusBadge, { backgroundColor: `${(STATUS_COLORS[race.status] ?? '#64748B')}1A` }]}
            >
              <Ionicons name="ellipse" size={10} color={STATUS_COLORS[race.status] ?? '#64748B'} />
              <ThemedText
                style={[styles.statusText, { color: STATUS_COLORS[race.status] ?? '#64748B' }]}
              >
                {race.status}
              </ThemedText>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <ThemedText style={styles.metaText}>
                {format(new Date(race.start), 'MMM d • h:mm a')}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="boat-outline" size={16} color="#64748B" />
              <ThemedText style={styles.metaText}>{race.fleet}</ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color="#64748B" />
              <ThemedText style={styles.metaText}>{race.entries} entries</ThemedText>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.cardButton} onPress={() => Alert.alert('Assign PRO', 'Assign race team coming soon.')}>
              <Ionicons name="people-circle-outline" size={18} color="#2563EB" />
              <ThemedText style={styles.cardButtonText}>Assign team</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardButton} onPress={() => Alert.alert('Documents', 'Document workflow coming soon.')}>
              <Ionicons name="document-outline" size={18} color="#2563EB" />
              <ThemedText style={styles.cardButtonText}>Docs</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardButton} onPress={() => openCommsModal(race.id, race.name)}>
              <Ionicons name="sparkles-outline" size={18} color="#2563EB" />
              <ThemedText style={styles.cardButtonText}>AI update</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardButtonPrimary} onPress={() => Alert.alert('Brief sailors', 'Sailor brief coming soon.')}>
              <Ionicons name="megaphone-outline" size={18} color="#FFFFFF" />
              <ThemedText style={styles.cardButtonPrimaryText}>Brief sailors</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderActive = () => (
    <View style={styles.listColumn}>
      {ACTIVE_RACES.map((race) => (
        <View key={race.id} style={styles.activeCard}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>{race.name}</ThemedText>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <ThemedText style={styles.liveText}>LIVE</ThemedText>
            </View>
          </View>
          <View style={styles.activeBody}>
            <View style={styles.activeMetric}>
              <ThemedText style={styles.activeValue}>{race.elapsed}</ThemedText>
              <ThemedText style={styles.activeLabel}>Elapsed</ThemedText>
            </View>
            <View style={styles.activeMetric}>
              <ThemedText style={styles.activeValue}>{race.course}</ThemedText>
              <ThemedText style={styles.activeLabel}>Course</ThemedText>
            </View>
            <View style={styles.activeMetric}>
              <ThemedText style={styles.activeValue}>{race.checkIn}</ThemedText>
              <ThemedText style={styles.activeLabel}>Checked in</ThemedText>
            </View>
          </View>
          <View style={styles.activeActions}>
            <TouchableOpacity style={styles.controlPrimary} onPress={() => Alert.alert('Finish race', 'Finish flow coming soon.')}>
              <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.controlPrimaryText}>Finish race</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlSecondary} onPress={() => Alert.alert('Pause race', 'Pause control coming soon.')}>
              <Ionicons name="pause-outline" size={20} color="#2563EB" />
              <ThemedText style={styles.controlSecondaryText}>Pause</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlSecondary} onPress={() => Alert.alert('Send update', 'On-water messaging coming soon.')}>
              <Ionicons name="chatbubble-outline" size={20} color="#2563EB" />
              <ThemedText style={styles.controlSecondaryText}>Send update</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCompleted = () => (
    <View style={styles.listColumn}>
      {COMPLETED_RACES.map((race) => (
        <View key={race.id} style={styles.completedCard}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>{race.name}</ThemedText>
            <ThemedText style={styles.completedDate}>
              {format(new Date(race.finished), 'MMM d, yyyy')}
            </ThemedText>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="trophy-outline" size={16} color="#64748B" />
              <ThemedText style={styles.metaText}>Winner: {race.winner}</ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color="#64748B" />
              <ThemedText style={styles.metaText}>{race.boats} boats</ThemedText>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.cardButton} onPress={() => Alert.alert('Publish results', 'Result publishing coming soon.')}>
              <Ionicons name="cloud-upload-outline" size={18} color="#2563EB" />
              <ThemedText style={styles.cardButtonText}>Publish</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardButton} onPress={() => Alert.alert('Send recap', 'Recap workflow coming soon.')}>
              <Ionicons name="mail-outline" size={18} color="#2563EB" />
              <ThemedText style={styles.cardButtonText}>Send recap</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardButtonPrimary} onPress={() => Alert.alert('View analytics', 'Analytics coming soon.')}>
              <Ionicons name="analytics-outline" size={18} color="#FFFFFF" />
              <ThemedText style={styles.cardButtonPrimaryText}>Open analytics</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <ThemedText style={styles.heroTitle}>Race Command Center</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Coordinate starts, documents, and scoring with one view for your race committee.
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => Alert.alert('Create race', 'Race creation is coming soon.')}
          >
            <Ionicons name="add-circle" size={22} color="#FFFFFF" />
            <ThemedText style={styles.heroButtonText}>Create Race</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          {metrics.map((metric) => (
            <View key={metric.key} style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Ionicons name={metric.icon as any} size={18} color="#2563EB" />
              </View>
              <ThemedText style={styles.metricLabel}>{metric.label}</ThemedText>
              <ThemedText style={styles.metricValue}>{metric.value}</ThemedText>
              <ThemedText style={styles.metricHelper}>{metric.helper}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.quickColumn}>
          {quickActions.map((action) => (
            <QuickAction key={action.label} {...action} />
          ))}
        </View>

        <View style={styles.tabRow}>
          {(
            [
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <ThemedText
                style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'upcoming' && renderUpcoming()}
        {activeTab === 'active' && renderActive()}
        {activeTab === 'completed' && renderCompleted()}

        <View style={styles.operationsCard}>
          <ThemedText style={styles.sectionTitle}>Operations toolkit</ThemedText>
          <ThemedText style={styles.sectionHelper}>
            Keep race documentation and safety plans current before teams leave the dock.
          </ThemedText>
          <View style={styles.operationsGrid}>
            <TouchableOpacity
              style={styles.operationTile}
              onPress={() => Alert.alert('Safety checklist', 'Safety workflows coming soon.')}
            >
              <Ionicons name="medkit-outline" size={20} color="#2563EB" />
              <ThemedText style={styles.operationLabel}>Safety checklist</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.operationTile}
              onPress={() => Alert.alert('Weather briefing', 'Weather integrations coming soon.')}
            >
              <Ionicons name="cloudy-outline" size={20} color="#2563EB" />
              <ThemedText style={styles.operationLabel}>Weather briefing</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.operationTile}
              onPress={() => Alert.alert('Course library', 'Course management coming soon.')}
            >
              <Ionicons name="map-outline" size={20} color="#2563EB" />
              <ThemedText style={styles.operationLabel}>Course library</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.operationTile}
              onPress={() => Alert.alert('Result templates', 'Template management coming soon.')}
            >
              <Ionicons name="clipboard-outline" size={20} color="#2563EB" />
              <ThemedText style={styles.operationLabel}>Result templates</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.operationTile, styles.operationTileSailwave]}
              onPress={() => setSailwaveModalVisible(true)}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="#059669" />
              <ThemedText style={styles.operationLabelSailwave}>Sailwave Import</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <RaceCommsModal
        visible={commsModalVisible}
        onClose={closeCommsModal}
        raceName={selectedRaceName ?? undefined}
        draft={commsDraft}
        isGenerating={commsGenerating}
        error={commsError}
        onGenerate={generateComms}
        lastGeneratedAt={commsGeneratedAt ?? null}
      />
      <SailwaveImportModal
        visible={sailwaveModalVisible}
        onClose={() => setSailwaveModalVisible(false)}
        onImportComplete={(data) => {
          setSailwaveModalVisible(false);
          Alert.alert(
            'Import Successful',
            `Imported ${data.competitors?.length || 0} competitors and ${data.races?.length || 0} races from Sailwave.`,
            [{ text: 'View Results', onPress: () => {} }]
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.78)',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 180,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 10,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricHelper: {
    fontSize: 12,
    color: '#64748B',
  },
  quickColumn: {
    gap: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  quickHelper: {
    fontSize: 12,
    color: '#64748B',
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tabButtonTextActive: {
    color: '#0F172A',
  },
  listColumn: {
    gap: 12,
  },
  upcomingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
  },
  cardButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  cardButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
  },
  cardButtonPrimaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 16,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDE68A',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA580C',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  activeBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  activeMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  activeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  activeLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  activeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  controlPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#2563EB',
  },
  controlPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  controlSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  controlSecondaryText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  completedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  completedDate: {
    fontSize: 12,
    color: '#64748B',
  },
  operationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHelper: {
    fontSize: 13,
    color: '#64748B',
  },
  operationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  operationTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  operationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  operationTileSailwave: {
    borderColor: '#6EE7B7',
    backgroundColor: '#ECFDF5',
  },
  operationLabelSailwave: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
});
