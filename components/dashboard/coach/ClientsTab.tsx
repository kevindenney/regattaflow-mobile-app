import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardSection } from '../shared';

interface Client {
  id: string;
  name: string;
  boatClass: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  totalSessions: number;
  lastSession: string;
  nextSession?: string;
  progress: {
    averagePosition: number;
    improvement: number;
    goalsAchieved: number;
    totalGoals: number;
  };
  status: 'active' | 'inactive' | 'on_hold';
  monthlyValue: number;
}

interface ClientsTabProps {
  clients: Client[];
  onClientPress: (clientId: string) => void;
  onScheduleSession: (clientId: string) => void;
  onViewProgress: (clientId: string) => void;
  onAddClient: () => void;
}

export function ClientsTab({
  clients,
  onClientPress,
  onScheduleSession,
  onViewProgress,
  onAddClient
}: ClientsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastSession' | 'value'>('name');

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      case 'professional': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'on_hold': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getProgressColor = (improvement: number) => {
    if (improvement > 0) return '#10B981';
    if (improvement < 0) return '#EF4444';
    return '#6B7280';
  };

  const filteredClients = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           client.boatClass.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || client.status === selectedFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastSession':
          return new Date(b.lastSession).getTime() - new Date(a.lastSession).getTime();
        case 'value':
          return b.monthlyValue - a.monthlyValue;
        default:
          return 0;
      }
    });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Actions */}
      <DashboardSection
        title="👥 Client Management"
        subtitle={`${clients.length} total clients`}
        headerAction={{
          label: 'Add Client',
          onPress: onAddClient,
          icon: 'person-add'
        }}
        showBorder={false}
      >
        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'inactive', label: 'Inactive' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(filter.key as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key && styles.filterButtonTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                const nextSort = sortBy === 'name' ? 'lastSession' : sortBy === 'lastSession' ? 'value' : 'name';
                setSortBy(nextSort);
              }}
            >
              <Text style={styles.sortButtonText}>
                {sortBy === 'name' ? 'Name' : sortBy === 'lastSession' ? 'Recent' : 'Value'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      </DashboardSection>

      {/* Client List */}
      <DashboardSection title="" showBorder={false} padding={0}>
        <View style={styles.clientsList}>
          {filteredClients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={styles.clientCard}
              onPress={() => onClientPress(client.id)}
            >
              {/* Client Header */}
              <View style={styles.clientHeader}>
                <View style={styles.clientInfo}>
                  <View style={styles.clientNameRow}>
                    <Text style={styles.clientName}>{client.name}</Text>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(client.status) }
                    ]}>
                      <Text style={styles.statusText}>{client.status}</Text>
                    </View>
                  </View>
                  <View style={styles.clientMeta}>
                    <Text style={styles.clientClass}>{client.boatClass}</Text>
                    <Text style={styles.separator}>•</Text>
                    <View style={[
                      styles.levelBadge,
                      { backgroundColor: getLevelColor(client.level) }
                    ]}>
                      <Text style={styles.levelText}>{client.level}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.clientValue}>
                  <Text style={styles.valueAmount}>${client.monthlyValue}</Text>
                  <Text style={styles.valueLabel}>monthly</Text>
                </View>
              </View>

              {/* Progress Overview */}
              <View style={styles.progressSection}>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Avg Position</Text>
                  <Text style={styles.progressValue}>{client.progress.averagePosition.toFixed(1)}</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Improvement</Text>
                  <Text style={[
                    styles.progressValue,
                    { color: getProgressColor(client.progress.improvement) }
                  ]}>
                    {client.progress.improvement > 0 ? '+' : ''}{client.progress.improvement.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Goals</Text>
                  <Text style={styles.progressValue}>
                    {client.progress.goalsAchieved}/{client.progress.totalGoals}
                  </Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Sessions</Text>
                  <Text style={styles.progressValue}>{client.totalSessions}</Text>
                </View>
              </View>

              {/* Session Information */}
              <View style={styles.sessionInfo}>
                <View style={styles.sessionItem}>
                  <Ionicons name="time" size={16} color="#64748B" />
                  <Text style={styles.sessionText}>Last: {client.lastSession}</Text>
                </View>
                {client.nextSession && (
                  <View style={styles.sessionItem}>
                    <Ionicons name="calendar" size={16} color="#10B981" />
                    <Text style={styles.sessionText}>Next: {client.nextSession}</Text>
                  </View>
                )}
              </View>

              {/* Quick Actions */}
              <View style={styles.clientActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onScheduleSession(client.id)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
                  <Text style={styles.actionButtonText}>Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onViewProgress(client.id)}
                >
                  <Ionicons name="analytics-outline" size={16} color="#10B981" />
                  <Text style={styles.actionButtonText}>Progress</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={16} color="#6366F1" />
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {filteredClients.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="person-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No clients found' : 'No clients yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Add your first client to start coaching'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity style={styles.addClientButton} onPress={onAddClient}>
                  <Ionicons name="person-add" size={20} color="#FFFFFF" />
                  <Text style={styles.addClientButtonText}>Add First Client</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </DashboardSection>

      {/* Client Statistics */}
      {clients.length > 0 && (
        <DashboardSection title="📈 Client Statistics">
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{clients.filter(c => c.status === 'active').length}</Text>
              <Text style={styles.statLabel}>Active Clients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {(clients.reduce((sum, c) => sum + c.progress.improvement, 0) / clients.length).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Avg Improvement</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.round(clients.reduce((sum, c) => sum + (c.progress.goalsAchieved / c.progress.totalGoals * 100), 0) / clients.length)}%
              </Text>
              <Text style={styles.statLabel}>Goals Achieved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                ${clients.reduce((sum, c) => sum + c.monthlyValue, 0).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Monthly Revenue</Text>
            </View>
          </View>
        </DashboardSection>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filtersContainer: {
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  clientsList: {
    padding: 16,
    gap: 12,
  },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 2px',
    elevation: 2,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  clientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientClass: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  separator: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  clientValue: {
    alignItems: 'flex-end',
  },
  valueAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  valueLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  sessionInfo: {
    gap: 8,
    marginBottom: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionText: {
    fontSize: 14,
    color: '#64748B',
  },
  clientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  addClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addClientButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});