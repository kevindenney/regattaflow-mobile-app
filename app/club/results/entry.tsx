/**
 * Quick Results Entry Screen
 * Race committee interface for rapid finish position entry
 * SAILTI-competitive scoring feature
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useClubWorkspace } from '@/hooks/useClubWorkspace';
import { supabase } from '@/services/supabase';
import { scoringService } from '@/services/ScoringService';

interface Entry {
  id: string;
  sail_number: string;
  boat_name?: string;
  skipper_name?: string;
  entry_number?: string;
}

interface FinishResult {
  entry_id: string;
  sail_number: string;
  position: number | null;
  status: 'finished' | 'dnf' | 'dns' | 'dsq' | 'ocs' | 'dnc' | 'ret';
  time?: string;
}

const STATUS_CODES = [
  { value: 'finished', label: 'OK', color: '#10B981' },
  { value: 'dnf', label: 'DNF', color: '#F59E0B' },
  { value: 'dns', label: 'DNS', color: '#6B7280' },
  { value: 'dsq', label: 'DSQ', color: '#EF4444' },
  { value: 'ocs', label: 'OCS', color: '#EC4899' },
  { value: 'dnc', label: 'DNC', color: '#94A3B8' },
  { value: 'ret', label: 'RET', color: '#8B5CF6' },
] as const;

export default function ResultsEntryScreen() {
  const router = useRouter();
  const { regattaId, raceNumber } = useLocalSearchParams<{ regattaId: string; raceNumber: string }>();
  const { clubId, loading: clubLoading } = useClubWorkspace();
  const inputRef = useRef<TextInput>(null);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [results, setResults] = useState<FinishResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regattaName, setRegattaName] = useState('');
  
  // Quick entry mode
  const [quickSailNumber, setQuickSailNumber] = useState('');
  const [finishOrder, setFinishOrder] = useState<string[]>([]);

  useEffect(() => {
    if (regattaId) {
      loadData();
    }
  }, [regattaId, raceNumber]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get regatta info
      const { data: regatta } = await supabase
        .from('regattas')
        .select('name')
        .eq('id', regattaId)
        .single();
      
      setRegattaName(regatta?.name || 'Regatta');

      // Get all entries for this regatta
      const { data: entriesData, error: entriesError } = await supabase
        .from('race_entries')
        .select('id, sail_number, boat_name, skipper_name, entry_number')
        .eq('regatta_id', regattaId)
        .eq('status', 'confirmed')
        .order('sail_number');

      if (entriesError) throw entriesError;
      setEntries(entriesData || []);

      // Get existing results for this race
      const { data: existingResults } = await supabase
        .from('race_results')
        .select('*')
        .eq('regatta_id', regattaId)
        .eq('race_number', parseInt(raceNumber || '1'));

      // Initialize results state
      const initialResults: FinishResult[] = (entriesData || []).map(entry => {
        const existing = existingResults?.find(r => r.entry_id === entry.id);
        return {
          entry_id: entry.id,
          sail_number: entry.sail_number,
          position: existing?.finish_position || null,
          status: existing?.status || 'finished',
          time: existing?.finish_time,
        };
      });

      setResults(initialResults);

      // Populate finish order from existing results
      const existingOrder = existingResults
        ?.filter(r => r.finish_position)
        .sort((a, b) => a.finish_position - b.finish_position)
        .map(r => {
          const entry = entriesData?.find(e => e.id === r.entry_id);
          return entry?.sail_number || '';
        }) || [];
      
      setFinishOrder(existingOrder);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load race data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickEntry = () => {
    const sailNumber = quickSailNumber.trim().toUpperCase();
    if (!sailNumber) return;

    // Find entry by sail number
    const entry = entries.find(
      e => e.sail_number.toUpperCase() === sailNumber
    );

    if (!entry) {
      Alert.alert('Not Found', `Sail number ${sailNumber} not found in entries`);
      setQuickSailNumber('');
      return;
    }

    // Check if already in finish order
    if (finishOrder.includes(sailNumber)) {
      Alert.alert('Duplicate', `${sailNumber} is already in finish order`);
      setQuickSailNumber('');
      return;
    }

    // Add to finish order
    const newOrder = [...finishOrder, sailNumber];
    setFinishOrder(newOrder);

    // Update results
    const newResults = results.map(r => {
      if (r.sail_number.toUpperCase() === sailNumber) {
        return { ...r, position: newOrder.length, status: 'finished' as const };
      }
      return r;
    });
    setResults(newResults);

    setQuickSailNumber('');
    inputRef.current?.focus();
  };

  const handleRemoveFromOrder = (sailNumber: string) => {
    const newOrder = finishOrder.filter(s => s !== sailNumber);
    setFinishOrder(newOrder);

    // Resequence positions
    const newResults = results.map(r => {
      const pos = newOrder.indexOf(r.sail_number.toUpperCase());
      if (pos >= 0) {
        return { ...r, position: pos + 1 };
      } else {
        return { ...r, position: null };
      }
    });
    setResults(newResults);
  };

  const handleStatusChange = (entryId: string, status: typeof STATUS_CODES[number]['value']) => {
    const newResults = results.map(r => {
      if (r.entry_id === entryId) {
        // If setting to DNF/DNS/etc, remove from finish order
        if (status !== 'finished') {
          const newOrder = finishOrder.filter(s => s.toUpperCase() !== r.sail_number.toUpperCase());
          setFinishOrder(newOrder);
          return { ...r, status, position: null };
        }
        return { ...r, status };
      }
      return r;
    });
    setResults(newResults);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare results data
      const resultsData = results.map(r => ({
        regatta_id: regattaId,
        race_number: parseInt(raceNumber || '1'),
        entry_id: r.entry_id,
        finish_position: r.position,
        status: r.status,
        finish_time: r.time,
      }));

      // Upsert results
      const { error } = await supabase
        .from('race_results')
        .upsert(resultsData, {
          onConflict: 'regatta_id,race_number,entry_id',
        });

      if (error) throw error;

      // Recalculate standings
      await scoringService.recalculateStandings(regattaId!);

      Alert.alert(
        'Saved',
        `Results saved for Race ${raceNumber}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error saving results:', error);
      Alert.alert('Error', error.message || 'Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    Alert.alert(
      'Publish Results',
      'This will make results visible to competitors and notify them. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            await handleSave();
            // TODO: Send notifications
          },
        },
      ]
    );
  };

  if (clubLoading || loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <ThemedText style={styles.loadingText}>Loading race data...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const unfinished = results.filter(r => !r.position && r.status === 'finished');
  const dnf = results.filter(r => r.status !== 'finished');

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Race {raceNumber} Results</ThemedText>
          <ThemedText style={styles.headerSubtitle}>{regattaName}</ThemedText>
        </View>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Save</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Entry Bar */}
      <View style={styles.quickEntryBar}>
        <View style={styles.quickEntryInput}>
          <Ionicons name="boat" size={20} color="#64748B" />
          <TextInput
            ref={inputRef}
            style={styles.sailInput}
            value={quickSailNumber}
            onChangeText={setQuickSailNumber}
            placeholder="Enter sail # as they finish..."
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={handleQuickEntry}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleQuickEntry}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Finish Order */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Finish Order ({finishOrder.length}/{entries.length})
          </ThemedText>
          
          {finishOrder.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="flag-outline" size={40} color="#94A3B8" />
              <ThemedText style={styles.emptyText}>
                Enter sail numbers as boats finish
              </ThemedText>
            </View>
          ) : (
            finishOrder.map((sailNumber, index) => {
              const entry = entries.find(e => e.sail_number.toUpperCase() === sailNumber);
              return (
                <View key={sailNumber} style={styles.finishCard}>
                  <View style={styles.positionBadge}>
                    <ThemedText style={styles.positionText}>{index + 1}</ThemedText>
                  </View>
                  <View style={styles.finishInfo}>
                    <ThemedText style={styles.finishSailNumber}>{sailNumber}</ThemedText>
                    {entry?.boat_name && (
                      <ThemedText style={styles.finishBoatName}>{entry.boat_name}</ThemedText>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveFromOrder(sailNumber)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Not Yet Finished */}
        {unfinished.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Still Racing ({unfinished.length})
            </ThemedText>
            <View style={styles.boatGrid}>
              {unfinished.map((r) => (
                <TouchableOpacity
                  key={r.entry_id}
                  style={styles.boatChip}
                  onPress={() => {
                    setQuickSailNumber(r.sail_number);
                    handleQuickEntry();
                  }}
                >
                  <ThemedText style={styles.boatChipText}>{r.sail_number}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* DNF/DNS Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Did Not Finish</ThemedText>
          
          {dnf.length === 0 ? (
            <View style={styles.emptySmall}>
              <ThemedText style={styles.emptySmallText}>
                Tap a boat below to mark as DNF/DNS/DSQ
              </ThemedText>
            </View>
          ) : (
            dnf.map((r) => {
              const entry = entries.find(e => e.id === r.entry_id);
              const statusInfo = STATUS_CODES.find(s => s.value === r.status);
              return (
                <View key={r.entry_id} style={styles.dnfCard}>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo?.color }]}>
                    <ThemedText style={styles.statusBadgeText}>{statusInfo?.label}</ThemedText>
                  </View>
                  <View style={styles.dnfInfo}>
                    <ThemedText style={styles.dnfSailNumber}>{r.sail_number}</ThemedText>
                    {entry?.boat_name && (
                      <ThemedText style={styles.dnfBoatName}>{entry.boat_name}</ThemedText>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => handleStatusChange(r.entry_id, 'finished')}
                  >
                    <Ionicons name="arrow-undo" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          {/* Quick Status Buttons */}
          <View style={styles.statusGrid}>
            <ThemedText style={styles.statusGridLabel}>Mark boat as:</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {STATUS_CODES.filter(s => s.value !== 'finished').map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[styles.statusButton, { borderColor: status.color }]}
                  onPress={() => {
                    Alert.prompt(
                      `Mark as ${status.label}`,
                      'Enter sail number',
                      (sailNumber) => {
                        if (!sailNumber) return;
                        const entry = entries.find(
                          e => e.sail_number.toUpperCase() === sailNumber.toUpperCase()
                        );
                        if (entry) {
                          handleStatusChange(entry.id, status.value);
                        } else {
                          Alert.alert('Not Found', `Sail number ${sailNumber} not found`);
                        }
                      }
                    );
                  }}
                >
                  <ThemedText style={[styles.statusButtonText, { color: status.color }]}>
                    {status.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="save-outline" size={20} color="#0EA5E9" />
          <ThemedText style={styles.secondaryButtonText}>Save Draft</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handlePublish}
          disabled={saving}
        >
          <Ionicons name="megaphone" size={20} color="#FFFFFF" />
          <ThemedText style={styles.primaryButtonText}>Publish</ThemedText>
        </TouchableOpacity>
      </View>
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
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  quickEntryBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  quickEntryInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  sailInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  finishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  positionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  finishInfo: {
    flex: 1,
  },
  finishSailNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  finishBoatName: {
    fontSize: 13,
    color: '#64748B',
  },
  removeButton: {
    padding: 4,
  },
  boatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  boatChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  boatChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptySmall: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  emptySmallText: {
    fontSize: 13,
    color: '#64748B',
  },
  dnfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dnfInfo: {
    flex: 1,
  },
  dnfSailNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  dnfBoatName: {
    fontSize: 12,
    color: '#64748B',
  },
  clearButton: {
    padding: 8,
  },
  statusGrid: {
    marginTop: 16,
    gap: 10,
  },
  statusGridLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    marginRight: 8,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0EA5E9',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

