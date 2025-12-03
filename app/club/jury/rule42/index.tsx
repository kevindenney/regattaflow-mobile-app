/**
 * Rule 42 Log Screen
 * Track propulsion infractions - SAILTI-competitive feature
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useClubWorkspace } from '@/hooks/useClubWorkspace';
import { 
  rule42Service, 
  Rule42Infraction, 
  Rule42Summary,
  Rule42InfractionType,
} from '@/services/Rule42Service';

const INFRACTION_TYPES: { value: Rule42InfractionType; label: string; icon: string }[] = [
  { value: 'pumping', label: 'Pumping', icon: 'arrow-up' },
  { value: 'rocking', label: 'Rocking', icon: 'swap-horizontal' },
  { value: 'ooching', label: 'Ooching', icon: 'arrow-forward' },
  { value: 'sculling', label: 'Sculling', icon: 'water' },
  { value: 'repeated_tacks', label: 'Repeated Tacks', icon: 'git-compare' },
  { value: 'repeated_gybes', label: 'Repeated Gybes', icon: 'git-branch' },
  { value: 'torquing', label: 'Torquing', icon: 'refresh' },
  { value: 'other', label: 'Other', icon: 'help-circle' },
];

export default function Rule42Screen() {
  const router = useRouter();
  const { regattaId } = useLocalSearchParams<{ regattaId: string }>();
  const { clubId, loading: clubLoading } = useClubWorkspace();

  const [infractions, setInfractions] = useState<Rule42Infraction[]>([]);
  const [summary, setSummary] = useState<Rule42Summary[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Quick log state
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogSailNumber, setQuickLogSailNumber] = useState('');
  const [quickLogRace, setQuickLogRace] = useState('');
  const [quickLogType, setQuickLogType] = useState<Rule42InfractionType>('pumping');
  const [quickLogIsWarning, setQuickLogIsWarning] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (regattaId) {
      loadData();
    }
  }, [regattaId]);

  const loadData = async () => {
    if (!regattaId) return;
    
    try {
      setLoading(true);
      const [infractionsData, summaryData, statsData] = await Promise.all([
        rule42Service.getRegattaInfractions(regattaId),
        rule42Service.getCompetitorSummary(regattaId),
        rule42Service.getRegattaStats(regattaId),
      ]);

      setInfractions(infractionsData);
      setSummary(summaryData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading Rule 42 data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [regattaId]);

  const handleQuickLog = async () => {
    if (!quickLogSailNumber.trim() || !quickLogRace.trim()) {
      Alert.alert('Missing Info', 'Please enter sail number and race number');
      return;
    }

    setSubmitting(true);
    try {
      await rule42Service.quickLog(
        regattaId!,
        parseInt(quickLogRace),
        quickLogSailNumber.trim().toUpperCase(),
        quickLogType,
        quickLogIsWarning
      );

      // Reset form
      setQuickLogSailNumber('');
      setQuickLogRace('');
      setShowQuickLog(false);

      // Reload data
      await loadData();

      Alert.alert(
        'Logged',
        `${quickLogIsWarning ? 'Warning' : 'Penalty'} logged for ${quickLogSailNumber.toUpperCase()}`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log infraction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInfraction = async (id: string) => {
    Alert.alert(
      'Delete Infraction',
      'Are you sure you want to delete this infraction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await rule42Service.deleteInfraction(id);
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete infraction');
            }
          },
        },
      ]
    );
  };

  const getInfractionIcon = (type: Rule42InfractionType): keyof typeof Ionicons.glyphMap => {
    const found = INFRACTION_TYPES.find(t => t.value === type);
    return (found?.icon as any) || 'help-circle';
  };

  if (clubLoading || loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <ThemedText style={styles.loadingText}>Loading Rule 42 Log...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Rule 42 Log</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Propulsion Infractions</ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => setShowQuickLog(true)}
        >
          <Ionicons name="add-circle" size={28} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Quick Log Panel */}
      {showQuickLog && (
        <View style={styles.quickLogPanel}>
          <View style={styles.quickLogHeader}>
            <ThemedText style={styles.quickLogTitle}>Quick Log Infraction</ThemedText>
            <TouchableOpacity onPress={() => setShowQuickLog(false)}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.quickLogRow}>
            <View style={styles.quickLogInput}>
              <ThemedText style={styles.inputLabel}>Sail #</ThemedText>
              <TextInput
                style={styles.textInput}
                value={quickLogSailNumber}
                onChangeText={setQuickLogSailNumber}
                placeholder="e.g. GBR 123"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.quickLogInput}>
              <ThemedText style={styles.inputLabel}>Race #</ThemedText>
              <TextInput
                style={styles.textInput}
                value={quickLogRace}
                onChangeText={setQuickLogRace}
                placeholder="1"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.infractionTypes}>
            {INFRACTION_TYPES.slice(0, 4).map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  quickLogType === type.value && styles.typeButtonSelected,
                ]}
                onPress={() => setQuickLogType(type.value)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={18} 
                  color={quickLogType === type.value ? '#FFFFFF' : '#64748B'} 
                />
                <ThemedText style={[
                  styles.typeButtonText,
                  quickLogType === type.value && styles.typeButtonTextSelected,
                ]}>
                  {type.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.warningToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                quickLogIsWarning && styles.toggleButtonActive,
                { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
              ]}
              onPress={() => setQuickLogIsWarning(true)}
            >
              <Ionicons 
                name="flag" 
                size={18} 
                color={quickLogIsWarning ? '#FFFFFF' : '#F59E0B'} 
              />
              <ThemedText style={[
                styles.toggleText,
                quickLogIsWarning && styles.toggleTextActive
              ]}>
                Warning (Yellow)
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !quickLogIsWarning && styles.toggleButtonPenalty,
                { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
              ]}
              onPress={() => setQuickLogIsWarning(false)}
            >
              <Ionicons 
                name="alert-circle" 
                size={18} 
                color={!quickLogIsWarning ? '#FFFFFF' : '#EF4444'} 
              />
              <ThemedText style={[
                styles.toggleText,
                !quickLogIsWarning && styles.toggleTextActive
              ]}>
                Penalty
              </ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.logButton, submitting && styles.logButtonDisabled]}
            onPress={handleQuickLog}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <ThemedText style={styles.logButtonText}>Log Infraction</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardRed]}>
            <ThemedText style={styles.statValue}>{stats?.totalInfractions || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Infractions</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats?.totalWarnings || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Warnings</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: '#EF4444' }]}>
              {stats?.totalPenalties || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Penalties</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: '#6366F1' }]}>
              {stats?.boatsFlagged || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Boats Flagged</ThemedText>
          </View>
        </View>

        {/* Competitor Summary */}
        {summary.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Competitor Summary</ThemedText>
            {summary.map((s) => (
              <View key={s.entry_id} style={styles.summaryCard}>
                <View style={styles.summaryInfo}>
                  <ThemedText style={styles.summarySailNumber}>{s.sail_number}</ThemedText>
                  {s.boat_name && (
                    <ThemedText style={styles.summaryBoatName}>{s.boat_name}</ThemedText>
                  )}
                </View>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryBadge}>
                    <ThemedText style={styles.summaryBadgeText}>{s.warnings}W</ThemedText>
                  </View>
                  <View style={[styles.summaryBadge, { backgroundColor: '#FEE2E2' }]}>
                    <ThemedText style={[styles.summaryBadgeText, { color: '#EF4444' }]}>
                      {s.penalties}P
                    </ThemedText>
                  </View>
                  {s.dsqs > 0 && (
                    <View style={[styles.summaryBadge, { backgroundColor: '#1E293B' }]}>
                      <ThemedText style={[styles.summaryBadgeText, { color: '#FFFFFF' }]}>
                        {s.dsqs} DSQ
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Infractions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Infraction Log</ThemedText>
          
          {infractions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              <ThemedText style={styles.emptyTitle}>No Infractions</ThemedText>
              <ThemedText style={styles.emptyText}>
                No Rule 42 infractions have been logged
              </ThemedText>
            </View>
          ) : (
            infractions.map((inf) => (
              <View key={inf.id} style={styles.infractionCard}>
                <View style={[
                  styles.infractionStatus,
                  { backgroundColor: inf.is_warning ? '#FEF3C7' : '#FEE2E2' }
                ]}>
                  <Ionicons 
                    name={inf.is_warning ? 'flag' : 'alert-circle'} 
                    size={20} 
                    color={inf.is_warning ? '#F59E0B' : '#EF4444'} 
                  />
                </View>
                <View style={styles.infractionInfo}>
                  <View style={styles.infractionHeader}>
                    <ThemedText style={styles.infractionSail}>
                      {inf.entry?.sail_number || inf.sail_number}
                    </ThemedText>
                    <ThemedText style={styles.infractionRace}>
                      Race {inf.race_number}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.infractionType}>
                    {inf.infraction_type.replace('_', ' ')}
                  </ThemedText>
                  <ThemedText style={styles.infractionTime}>
                    {format(new Date(inf.infraction_time), 'HH:mm')} • {inf.is_warning ? 'Warning' : inf.penalty_type?.replace('_', ' ')}
                  </ThemedText>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteInfraction(inf.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowQuickLog(true)}
      >
        <Ionicons name="flag" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  headerAction: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
  },
  quickLogPanel: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  quickLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickLogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickLogRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickLogInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  infractionTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeButtonSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  typeButtonTextSelected: {
    color: '#FFFFFF',
  },
  warningToggle: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  toggleButtonPenalty: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 10,
  },
  logButtonDisabled: {
    opacity: 0.6,
  },
  logButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCardRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryInfo: {
    flex: 1,
  },
  summarySailNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryBoatName: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 6,
  },
  summaryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  infractionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infractionStatus: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infractionInfo: {
    flex: 1,
  },
  infractionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infractionSail: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  infractionRace: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infractionType: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  infractionTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

