/**
 * Quick Results Entry Component
 * Fast entry of race results via drag-and-drop or quick position input
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Check,
  X,
  Flag,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Clock,
  Search,
} from 'lucide-react-native';
import { ScoreCode } from '@/services/scoring/ScoringEngine';

interface Entry {
  id: string;
  sailNumber: string;
  boatName?: string;
  skipperName?: string;
  boatClass?: string;
}

interface ResultEntry extends Entry {
  position?: number;
  scoreCode?: ScoreCode;
  finishTime?: string;
}

interface QuickResultsEntryProps {
  entries: Entry[];
  raceNumber: number;
  existingResults?: ResultEntry[];
  onSave: (results: ResultEntry[]) => Promise<void>;
  onCancel: () => void;
}

// Score codes that indicate non-finishers
const SCORE_CODES: { code: ScoreCode; label: string; color: string }[] = [
  { code: 'DNS', label: 'Did Not Start', color: '#F59E0B' },
  { code: 'DNF', label: 'Did Not Finish', color: '#EF4444' },
  { code: 'DSQ', label: 'Disqualified', color: '#DC2626' },
  { code: 'OCS', label: 'On Course Side', color: '#EA580C' },
  { code: 'BFD', label: 'Black Flag', color: '#111827' },
  { code: 'RET', label: 'Retired', color: '#6B7280' },
  { code: 'DNC', label: 'Did Not Compete', color: '#9CA3AF' },
];

export default function QuickResultsEntry({
  entries,
  raceNumber,
  existingResults = [],
  onSave,
  onCancel,
}: QuickResultsEntryProps) {
  // State
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [showScoreCodeModal, setShowScoreCodeModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'order' | 'position'>('order');

  // Initialize results from entries
  useEffect(() => {
    const initialResults: ResultEntry[] = entries.map(entry => {
      const existing = existingResults.find(r => r.id === entry.id);
      return {
        ...entry,
        position: existing?.position,
        scoreCode: existing?.scoreCode,
        finishTime: existing?.finishTime,
      };
    });
    setResults(initialResults);
  }, [entries, existingResults]);

  // Filter entries by search
  const filteredResults = results.filter(r => 
    !searchQuery || 
    r.sailNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.boatName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.skipperName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get finishers (entries with position or no score code)
  const finishers = results
    .filter(r => r.position && !r.scoreCode)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  // Get non-finishers
  const nonFinishers = results.filter(r => r.scoreCode);

  // Get unassigned
  const unassigned = results.filter(r => !r.position && !r.scoreCode);

  // Move entry up in finish order
  const moveUp = (entryId: string) => {
    const entryIndex = results.findIndex(r => r.id === entryId);
    const entry = results[entryIndex];
    if (!entry.position || entry.position <= 1) return;

    setResults(prev => prev.map(r => {
      if (r.id === entryId) {
        return { ...r, position: r.position! - 1 };
      }
      if (r.position === entry.position! - 1) {
        return { ...r, position: r.position! + 1 };
      }
      return r;
    }));
  };

  // Move entry down in finish order
  const moveDown = (entryId: string) => {
    const entry = results.find(r => r.id === entryId);
    if (!entry?.position) return;

    const maxPosition = finishers.length;
    if (entry.position >= maxPosition) return;

    setResults(prev => prev.map(r => {
      if (r.id === entryId) {
        return { ...r, position: r.position! + 1 };
      }
      if (r.position === entry.position! + 1) {
        return { ...r, position: r.position! - 1 };
      }
      return r;
    }));
  };

  // Add entry to finish order
  const addFinisher = (entryId: string) => {
    const nextPosition = finishers.length + 1;
    setResults(prev => prev.map(r => 
      r.id === entryId 
        ? { ...r, position: nextPosition, scoreCode: undefined }
        : r
    ));
  };

  // Remove entry from finish order
  const removeFinisher = (entryId: string) => {
    const entry = results.find(r => r.id === entryId);
    if (!entry?.position) return;

    setResults(prev => prev.map(r => {
      if (r.id === entryId) {
        return { ...r, position: undefined };
      }
      // Adjust positions for entries after this one
      if (r.position && r.position > entry.position!) {
        return { ...r, position: r.position - 1 };
      }
      return r;
    }));
  };

  // Set score code for entry
  const setScoreCode = (entryId: string, code: ScoreCode) => {
    setResults(prev => prev.map(r =>
      r.id === entryId
        ? { ...r, scoreCode: code, position: undefined }
        : r
    ));
    setShowScoreCodeModal(false);
    setSelectedEntry(null);
  };

  // Clear score code
  const clearScoreCode = (entryId: string) => {
    setResults(prev => prev.map(r =>
      r.id === entryId
        ? { ...r, scoreCode: undefined }
        : r
    ));
  };

  // Set position directly
  const setPosition = (entryId: string, position: number) => {
    if (position < 1) return;
    
    setResults(prev => {
      const updated = [...prev];
      const entryIndex = updated.findIndex(r => r.id === entryId);
      const entry = updated[entryIndex];
      
      // Remove old position
      if (entry.position) {
        updated.forEach(r => {
          if (r.position && r.position > entry.position!) {
            r.position = r.position - 1;
          }
        });
      }
      
      // Insert at new position
      updated.forEach(r => {
        if (r.position && r.position >= position && r.id !== entryId) {
          r.position = r.position + 1;
        }
      });
      
      updated[entryIndex] = { ...entry, position, scoreCode: undefined };
      return updated;
    });
  };

  // Save results
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(results);
      Alert.alert('Saved', `Race ${raceNumber} results saved successfully`);
    } catch (error) {
      console.error('Error saving results:', error);
      Alert.alert('Error', 'Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  // Auto-fill DNS for remaining entries
  const markRemainingDNS = () => {
    Alert.alert(
      'Mark Remaining DNS',
      `Mark ${unassigned.length} unassigned entries as DNS?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setResults(prev => prev.map(r =>
              !r.position && !r.scoreCode
                ? { ...r, scoreCode: 'DNS' }
                : r
            ));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Race {raceNumber} Results</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{finishers.length}</Text>
          <Text style={styles.statLabel}>Finished</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            {nonFinishers.length}
          </Text>
          <Text style={styles.statLabel}>DNF/DNS</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {unassigned.length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'order' && styles.modeButtonActive]}
          onPress={() => setInputMode('order')}
        >
          <Text style={[
            styles.modeButtonText,
            inputMode === 'order' && styles.modeButtonTextActive,
          ]}>
            Finish Order
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'position' && styles.modeButtonActive]}
          onPress={() => setInputMode('position')}
        >
          <Text style={[
            styles.modeButtonText,
            inputMode === 'position' && styles.modeButtonTextActive,
          ]}>
            Direct Entry
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {inputMode === 'order' ? (
          <>
            {/* Finishers Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Finish Order</Text>
              {finishers.length > 0 ? (
                finishers.map((entry) => (
                  <View key={entry.id} style={styles.finisherRow}>
                    <View style={styles.positionBadge}>
                      <Text style={styles.positionText}>{entry.position}</Text>
                    </View>
                    
                    <View style={styles.entryInfo}>
                      <Text style={styles.sailNumber}>{entry.sailNumber}</Text>
                      {entry.boatName && (
                        <Text style={styles.boatName}>{entry.boatName}</Text>
                      )}
                    </View>
                    
                    <View style={styles.entryActions}>
                      <TouchableOpacity
                        style={styles.moveButton}
                        onPress={() => moveUp(entry.id)}
                        disabled={entry.position === 1}
                      >
                        <ArrowUp size={18} color={entry.position === 1 ? '#D1D5DB' : '#6B7280'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.moveButton}
                        onPress={() => moveDown(entry.id)}
                        disabled={entry.position === finishers.length}
                      >
                        <ArrowDown size={18} color={entry.position === finishers.length ? '#D1D5DB' : '#6B7280'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeFinisher(entry.id)}
                      >
                        <X size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  Tap entries below to add finishers
                </Text>
              )}
            </View>

            {/* Non-Finishers Section */}
            {nonFinishers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Non-Finishers</Text>
                {nonFinishers.map((entry) => {
                  const codeInfo = SCORE_CODES.find(c => c.code === entry.scoreCode);
                  return (
                    <View key={entry.id} style={styles.nonFinisherRow}>
                      <View style={[styles.codeChip, { backgroundColor: codeInfo?.color || '#6B7280' }]}>
                        <Text style={styles.codeChipText}>{entry.scoreCode}</Text>
                      </View>
                      
                      <View style={styles.entryInfo}>
                        <Text style={styles.sailNumber}>{entry.sailNumber}</Text>
                        {entry.boatName && (
                          <Text style={styles.boatName}>{entry.boatName}</Text>
                        )}
                      </View>
                      
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => clearScoreCode(entry.id)}
                      >
                        <X size={18} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Unassigned Section */}
            {unassigned.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pending ({unassigned.length})</Text>
                  <TouchableOpacity
                    style={styles.markAllButton}
                    onPress={markRemainingDNS}
                  >
                    <Flag size={14} color="#6B7280" />
                    <Text style={styles.markAllText}>Mark all DNS</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Search */}
                <View style={styles.searchContainer}>
                  <Search size={18} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by sail number..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                
                <View style={styles.unassignedGrid}>
                  {filteredResults
                    .filter(r => !r.position && !r.scoreCode)
                    .map((entry) => (
                      <TouchableOpacity
                        key={entry.id}
                        style={styles.unassignedEntry}
                        onPress={() => addFinisher(entry.id)}
                        onLongPress={() => {
                          setSelectedEntry(entry.id);
                          setShowScoreCodeModal(true);
                        }}
                      >
                        <Text style={styles.unassignedSail}>{entry.sailNumber}</Text>
                        <Text style={styles.tapHint}>Tap to add</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
          </>
        ) : (
          /* Direct Entry Mode */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enter Positions</Text>
            {results.map((entry) => (
              <View key={entry.id} style={styles.directEntryRow}>
                <View style={styles.entryInfo}>
                  <Text style={styles.sailNumber}>{entry.sailNumber}</Text>
                  {entry.boatName && (
                    <Text style={styles.boatName}>{entry.boatName}</Text>
                  )}
                </View>
                
                <View style={styles.directEntryInputs}>
                  <TextInput
                    style={styles.positionInput}
                    keyboardType="number-pad"
                    placeholder="Pos"
                    placeholderTextColor="#9CA3AF"
                    value={entry.position?.toString() || ''}
                    onChangeText={(text) => {
                      const pos = parseInt(text, 10);
                      if (!isNaN(pos)) {
                        setPosition(entry.id, pos);
                      } else if (text === '') {
                        setResults(prev => prev.map(r =>
                          r.id === entry.id ? { ...r, position: undefined } : r
                        ));
                      }
                    }}
                  />
                  
                  <TouchableOpacity
                    style={[
                      styles.codeButton,
                      entry.scoreCode && styles.codeButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedEntry(entry.id);
                      setShowScoreCodeModal(true);
                    }}
                  >
                    <Text style={[
                      styles.codeButtonText,
                      entry.scoreCode && styles.codeButtonTextActive,
                    ]}>
                      {entry.scoreCode || 'Code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Score Code Modal */}
      <Modal
        visible={showScoreCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScoreCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Score Code</Text>
            
            {SCORE_CODES.map(({ code, label, color }) => (
              <TouchableOpacity
                key={code}
                style={styles.codeOption}
                onPress={() => selectedEntry && setScoreCode(selectedEntry, code)}
              >
                <View style={[styles.codeIndicator, { backgroundColor: color }]} />
                <View style={styles.codeInfo}>
                  <Text style={styles.codeLabel}>{code}</Text>
                  <Text style={styles.codeDescription}>{label}</Text>
                </View>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowScoreCodeModal(false);
                setSelectedEntry(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'ios' ? 56 : 12,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    margin: 12,
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modeButtonTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 24,
  },
  finisherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
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
  entryInfo: {
    flex: 1,
  },
  sailNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  boatName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moveButton: {
    padding: 8,
  },
  removeButton: {
    padding: 8,
  },
  nonFinisherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  codeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  codeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clearButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  unassignedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unassignedEntry: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  unassignedSail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  tapHint: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  directEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  directEntryInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  positionInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    width: 60,
    textAlign: 'center',
    color: '#1F2937',
  },
  codeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  codeButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  codeButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  codeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  codeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  codeIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  codeInfo: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  codeDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#6B7280',
  },
});

