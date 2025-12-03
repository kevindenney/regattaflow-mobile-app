/**
 * Committee Boat Log
 * Official timestamped event log for race documentation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ChevronLeft,
  Plus,
  Search,
  Filter,
  Clock,
  Flag,
  Wind,
  AlertTriangle,
  FileText,
  Check,
  Download,
  Calendar,
  ChevronDown,
  X,
  Megaphone,
  Timer,
  MapPin,
  Users,
  Settings,
  Edit,
  Trash2,
  CheckCircle,
} from 'lucide-react-native';
import {
  committeeLogService,
  LogEntry,
  LogCategory,
  LogTemplate,
  DailySummary,
} from '@/services/CommitteeLogService';

type TabType = 'timeline' | 'summary';

const CATEGORY_CONFIG: Record<LogCategory, { icon: any; color: string; bg: string; label: string }> = {
  signal: { icon: Flag, color: '#D97706', bg: '#FEF3C7', label: 'Signal' },
  course: { icon: MapPin, color: '#2563EB', bg: '#DBEAFE', label: 'Course' },
  weather: { icon: Wind, color: '#0891B2', bg: '#CFFAFE', label: 'Weather' },
  incident: { icon: AlertTriangle, color: '#DC2626', bg: '#FEE2E2', label: 'Incident' },
  protest: { icon: FileText, color: '#7C3AED', bg: '#EDE9FE', label: 'Protest' },
  safety: { icon: AlertTriangle, color: '#EF4444', bg: '#FEE2E2', label: 'Safety' },
  announcement: { icon: Megaphone, color: '#7C3AED', bg: '#F3E8FF', label: 'Announcement' },
  timing: { icon: Timer, color: '#059669', bg: '#D1FAE5', label: 'Timing' },
  penalty: { icon: Flag, color: '#DC2626', bg: '#FEE2E2', label: 'Penalty' },
  equipment: { icon: Settings, color: '#6B7280', bg: '#F3F4F6', label: 'Equipment' },
  committee: { icon: Users, color: '#1F2937', bg: '#F3F4F6', label: 'Committee' },
  general: { icon: FileText, color: '#6B7280', bg: '#F3F4F6', label: 'General' },
};

export default function CommitteeBoatLog() {
  const { regattaId } = useLocalSearchParams<{ regattaId: string }>();
  const router = useRouter();

  // State
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [templates, setTemplates] = useState<LogTemplate[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all');
  const [showAutoLogged, setShowAutoLogged] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Modals
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);

  // New entry form
  const [newCategory, setNewCategory] = useState<LogCategory>('general');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRaceNumber, setNewRaceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    if (regattaId) {
      loadData();
    }
  }, [regattaId, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesData, templatesData, summaryData] = await Promise.all([
        committeeLogService.getEntries(regattaId!, {
          date: selectedDate,
          includeAutoLogged: showAutoLogged,
        }),
        committeeLogService.getTemplates(),
        committeeLogService.getDailySummary(regattaId!, selectedDate),
      ]);

      setEntries(entriesData);
      setTemplates(templatesData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading log:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
      return false;
    }
    if (!showAutoLogged && entry.is_auto_logged) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        entry.title.toLowerCase().includes(query) ||
        entry.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Handle new entry
  const handleCreateEntry = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a title');
      return;
    }

    setSubmitting(true);
    try {
      await committeeLogService.createEntry({
        regatta_id: regattaId!,
        category: newCategory,
        title: newTitle,
        description: newDescription || undefined,
        race_number: newRaceNumber ? parseInt(newRaceNumber) : undefined,
      });

      setShowNewEntryModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewRaceNumber('');
      setNewCategory('general');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create log entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = async (template: LogTemplate) => {
    try {
      await committeeLogService.createFromTemplate(template.id, regattaId!, {
        race_number: newRaceNumber ? parseInt(newRaceNumber) : undefined,
      });
      setShowNewEntryModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create entry from template');
    }
  };

  // Handle verify
  const handleVerify = async (entryId: string) => {
    try {
      await committeeLogService.verifyEntry(entryId);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to verify entry');
    }
  };

  // Handle delete
  const handleDelete = (entry: LogEntry) => {
    Alert.alert(
      'Delete Entry',
      `Delete "${entry.title}"? This will be preserved for audit purposes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await committeeLogService.deleteEntry(entry.id);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  // Export log
  const handleExport = async () => {
    try {
      const text = await committeeLogService.exportToText(regattaId!, selectedDate);
      Alert.alert('Export', 'Log exported:\n\n' + text.substring(0, 500) + '...');
    } catch (error) {
      Alert.alert('Error', 'Failed to export log');
    }
  };

  // Render timeline tab
  const renderTimelineTab = () => (
    <View style={styles.tabContent}>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search log entries..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, categoryFilter === 'all' && styles.filterChipActive]}
          onPress={() => setCategoryFilter('all')}
        >
          <Text style={[
            styles.filterChipText,
            categoryFilter === 'all' && styles.filterChipTextActive,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {(['signal', 'timing', 'course', 'incident', 'safety'] as LogCategory[]).map(cat => {
          const config = CATEGORY_CONFIG[cat];
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                categoryFilter === cat && styles.filterChipActive,
              ]}
              onPress={() => setCategoryFilter(cat)}
            >
              <View style={[styles.categoryDot, { backgroundColor: config.color }]} />
              <Text style={[
                styles.filterChipText,
                categoryFilter === cat && styles.filterChipTextActive,
              ]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Timeline */}
      {filteredEntries.length > 0 ? (
        <View style={styles.timeline}>
          {filteredEntries.map((entry, index) => {
            const config = CATEGORY_CONFIG[entry.category];
            const Icon = config.icon;
            const time = new Date(entry.log_time);
            
            return (
              <View key={entry.id} style={styles.timelineItem}>
                {/* Time column */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.entryNum}>#{entry.entry_number}</Text>
                </View>

                {/* Line */}
                <View style={styles.lineColumn}>
                  <View style={[styles.dot, { backgroundColor: config.color }]}>
                    <Icon size={12} color="#FFFFFF" />
                  </View>
                  {index < filteredEntries.length - 1 && (
                    <View style={styles.line} />
                  )}
                </View>

                {/* Content */}
                <TouchableOpacity
                  style={styles.entryCard}
                  onPress={() => setSelectedEntry(entry)}
                >
                  <View style={styles.entryHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.categoryText, { color: config.color }]}>
                        {config.label}
                      </Text>
                    </View>
                    {entry.race_number && (
                      <Text style={styles.raceNumber}>Race {entry.race_number}</Text>
                    )}
                    {entry.is_auto_logged && (
                      <Text style={styles.autoLogged}>Auto</Text>
                    )}
                    {entry.verified && (
                      <CheckCircle size={14} color="#10B981" />
                    )}
                  </View>
                  
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  
                  {entry.description && (
                    <Text style={styles.entryDescription} numberOfLines={2}>
                      {entry.description}
                    </Text>
                  )}

                  {entry.flags_displayed && entry.flags_displayed.length > 0 && (
                    <View style={styles.flagsRow}>
                      {entry.flags_displayed.map(flag => (
                        <View key={flag} style={styles.flagTag}>
                          <Text style={styles.flagText}>{flag}</Text>
                        </View>
                      ))}
                      {entry.sound_signals && entry.sound_signals > 0 && (
                        <Text style={styles.signalsText}>
                          🔊 {entry.sound_signals}x
                        </Text>
                      )}
                    </View>
                  )}

                  <Text style={styles.loggedBy}>
                    {entry.logged_by_name || 'Unknown'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <FileText size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Log Entries</Text>
          <Text style={styles.emptyText}>
            {searchQuery || categoryFilter !== 'all'
              ? 'No entries match your filters'
              : 'Start logging race events'}
          </Text>
        </View>
      )}
    </View>
  );

  // Render summary tab
  const renderSummaryTab = () => (
    <View style={styles.tabContent}>
      {summary ? (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today's Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.total_entries}</Text>
                <Text style={styles.summaryLabel}>Total Entries</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.signal_count}</Text>
                <Text style={styles.summaryLabel}>Signals</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.timing_count}</Text>
                <Text style={styles.summaryLabel}>Timing</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.incident_count}</Text>
                <Text style={styles.summaryLabel}>Incidents</Text>
              </View>
            </View>
            <View style={styles.summaryTimes}>
              <Text style={styles.summaryTimeText}>
                First entry: {new Date(summary.first_entry).toLocaleTimeString()}
              </Text>
              <Text style={styles.summaryTimeText}>
                Last entry: {new Date(summary.last_entry).toLocaleTimeString()}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Download size={20} color="#0EA5E9" />
            <Text style={styles.exportButtonText}>Export Log</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noSummary}>
          <Calendar size={48} color="#D1D5DB" />
          <Text style={styles.noSummaryText}>No entries for this date</Text>
        </View>
      )}
    </View>
  );

  if (loading && entries.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <FileText size={48} color="#0EA5E9" />
        <Text style={styles.loadingText}>Loading Log...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Committee Log</Text>
          <TouchableOpacity style={styles.dateSelector}>
            <Calendar size={14} color="#BAE6FD" />
            <Text style={styles.headerDate}>
              {selectedDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewEntryModal(true)}
        >
          <Plus size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{entries.length}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {entries.filter(e => e.verified).length}
          </Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {entries.filter(e => e.is_auto_logged).length}
          </Text>
          <Text style={styles.statLabel}>Auto</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'timeline' && styles.tabActive]}
          onPress={() => setActiveTab('timeline')}
        >
          <Clock size={18} color={activeTab === 'timeline' ? '#0EA5E9' : '#6B7280'} />
          <Text style={[styles.tabLabel, activeTab === 'timeline' && styles.tabLabelActive]}>
            Timeline
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
          onPress={() => setActiveTab('summary')}
        >
          <FileText size={18} color={activeTab === 'summary' ? '#0EA5E9' : '#6B7280'} />
          <Text style={[styles.tabLabel, activeTab === 'summary' && styles.tabLabelActive]}>
            Summary
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'timeline' && renderTimelineTab()}
        {activeTab === 'summary' && renderSummaryTab()}
      </ScrollView>

      {/* New Entry Modal */}
      <Modal
        visible={showNewEntryModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowNewEntryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewEntryModal(false)}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Log Entry</Text>
            <TouchableOpacity
              style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
              onPress={handleCreateEntry}
              disabled={submitting}
            >
              <Text style={styles.saveButtonText}>
                {submitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Quick Templates */}
            <Text style={styles.sectionTitle}>Quick Templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesRow}>
              {templates.slice(0, 6).map(template => {
                const config = CATEGORY_CONFIG[template.category as LogCategory];
                return (
                  <TouchableOpacity
                    key={template.id}
                    style={[styles.templateCard, { borderColor: config.color }]}
                    onPress={() => handleTemplateSelect(template)}
                  >
                    <Text style={styles.templateIcon}>{template.icon || '📝'}</Text>
                    <Text style={styles.templateName}>{template.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Custom Entry */}
            <Text style={styles.sectionTitle}>Custom Entry</Text>
            
            {/* Category */}
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
              {(Object.keys(CATEGORY_CONFIG) as LogCategory[]).map(cat => {
                const config = CATEGORY_CONFIG[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      newCategory === cat && { backgroundColor: config.bg, borderColor: config.color },
                    ]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      newCategory === cat && { color: config.color },
                    ]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Race Number */}
            <Text style={styles.inputLabel}>Race Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 3"
              placeholderTextColor="#9CA3AF"
              value={newRaceNumber}
              onChangeText={setNewRaceNumber}
              keyboardType="number-pad"
            />

            {/* Title */}
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter title..."
              placeholderTextColor="#9CA3AF"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            {/* Description */}
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter details..."
              placeholderTextColor="#9CA3AF"
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Entry Detail Modal */}
      <Modal
        visible={!!selectedEntry}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEntry(null)}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailContent}>
            {selectedEntry && (
              <>
                <View style={styles.detailHeader}>
                  <View style={[
                    styles.detailCategory,
                    { backgroundColor: CATEGORY_CONFIG[selectedEntry.category].bg }
                  ]}>
                    <Text style={[
                      styles.detailCategoryText,
                      { color: CATEGORY_CONFIG[selectedEntry.category].color }
                    ]}>
                      {CATEGORY_CONFIG[selectedEntry.category].label}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedEntry(null)}>
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.detailTitle}>{selectedEntry.title}</Text>
                
                <View style={styles.detailMeta}>
                  <Text style={styles.detailTime}>
                    {new Date(selectedEntry.log_time).toLocaleString()}
                  </Text>
                  <Text style={styles.detailEntry}>Entry #{selectedEntry.entry_number}</Text>
                </View>

                {selectedEntry.description && (
                  <Text style={styles.detailDescription}>
                    {selectedEntry.description}
                  </Text>
                )}

                {selectedEntry.flags_displayed && selectedEntry.flags_displayed.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Flags</Text>
                    <View style={styles.flagsRow}>
                      {selectedEntry.flags_displayed.map(flag => (
                        <View key={flag} style={styles.flagTag}>
                          <Text style={styles.flagText}>{flag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Logged By</Text>
                  <Text style={styles.detailValue}>
                    {selectedEntry.logged_by_name || 'Unknown'}
                    {selectedEntry.logged_by_role && ` (${selectedEntry.logged_by_role})`}
                  </Text>
                </View>

                <View style={styles.detailActions}>
                  {!selectedEntry.verified && (
                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={() => {
                        handleVerify(selectedEntry.id);
                        setSelectedEntry(null);
                      }}
                    >
                      <Check size={18} color="#FFFFFF" />
                      <Text style={styles.verifyButtonText}>Verify</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      handleDelete(selectedEntry);
                      setSelectedEntry(null);
                    }}
                  >
                    <Trash2 size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  headerDate: {
    fontSize: 13,
    color: '#BAE6FD',
  },
  addButton: {
    backgroundColor: '#0EA5E9',
    padding: 10,
    borderRadius: 10,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  tabBar: {
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
    paddingVertical: 14,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0EA5E9',
  },
  tabLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#1F2937',
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterBar: {
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0EA5E9',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeColumn: {
    width: 55,
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  entryNum: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  lineColumn: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  entryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginLeft: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  raceNumber: {
    fontSize: 11,
    color: '#6B7280',
  },
  autoLogged: {
    fontSize: 10,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  entryDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  flagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  flagTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  flagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  signalsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  loggedBy: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  summaryItem: {
    width: '45%',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryTimes: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  summaryTimeText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  noSummary: {
    alignItems: 'center',
    padding: 48,
  },
  noSummaryText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 16,
  },
  templatesRow: {
    marginBottom: 8,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    minWidth: 100,
  },
  templateIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
  },
  categoryPicker: {
    marginBottom: 8,
  },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  // Detail modal
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  detailContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailCategory: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailCategoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailEntry: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 22,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
});

