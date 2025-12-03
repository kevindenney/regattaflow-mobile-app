/**
 * Crew Manifest Tab - Race Officer View
 * Shows crew assignments for all boats in the race
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { crewManagementService, CrewManifestEntry } from '@/services/crewManagementService';

interface CrewManifestTabProps {
  raceId: string;
}

export default function CrewManifestTab({ raceId }: CrewManifestTabProps) {
  const [manifest, setManifest] = useState<CrewManifestEntry[]>([]);
  const [summary, setSummary] = useState<{
    totalBoats: number;
    boatsWithFullCrew: number;
    boatsWithNoCrew: number;
    totalCrewAssigned: number;
    complianceRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadManifest();
  }, [raceId]);

  const loadManifest = async () => {
    try {
      setLoading(true);
      const [manifestData, summaryData] = await Promise.all([
        crewManagementService.getRaceCrewManifest(raceId),
        crewManagementService.getRaceCrewManifestSummary(raceId),
      ]);
      setManifest(manifestData);
      setSummary(summaryData);
    } catch (error) {
      console.error('[CrewManifestTab] Error loading manifest:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadManifest();
  };

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'helmsman':
        return 'steering';
      case 'tactician':
        return 'compass';
      case 'trimmer':
        return 'tune-vertical';
      case 'bowman':
        return 'anchor';
      default:
        return 'account';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading crew manifest...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Summary Stats */}
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Crew Manifest Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="sail-boat" size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{summary.totalBoats}</Text>
              <Text style={styles.statLabel}>Total Boats</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
              <Text style={styles.statValue}>{summary.boatsWithFullCrew}</Text>
              <Text style={styles.statLabel}>Full Crew</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.statValue}>{summary.boatsWithNoCrew}</Text>
              <Text style={styles.statLabel}>No Crew</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-group" size={24} color="#8B5CF6" />
              <Text style={styles.statValue}>{summary.totalCrewAssigned}</Text>
              <Text style={styles.statLabel}>Total Crew</Text>
            </View>
          </View>
          <View style={styles.complianceBar}>
            <View style={styles.complianceBarFill} style={{ width: `${summary.complianceRate}%` }} />
          </View>
          <Text style={styles.complianceText}>
            {summary.complianceRate.toFixed(0)}% Compliance Rate
          </Text>
        </View>
      )}

      {/* Manifest List */}
      {manifest.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="sail-boat-sink" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No boats registered yet</Text>
          <Text style={styles.emptySubtext}>
            Boats will appear here once sailors register for the race
          </Text>
        </View>
      ) : (
        <View style={styles.manifestList}>
          {manifest.map((entry) => (
            <View
              key={entry.sailNumber}
              style={[styles.manifestCard, !entry.isCompliant && styles.manifestCardWarning]}
            >
              {/* Header */}
              <View style={styles.manifestHeader}>
                <View style={styles.manifestHeaderLeft}>
                  <Text style={styles.sailNumber}>{entry.sailNumber}</Text>
                  {entry.boatName && <Text style={styles.boatName}>{entry.boatName}</Text>}
                </View>
                <View style={styles.complianceBadge}>
                  {entry.isCompliant ? (
                    <>
                      <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                      <Text style={styles.compliantText}>
                        {entry.crewCount}/{entry.minCrewRequired}
                      </Text>
                    </>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                      <Text style={styles.nonCompliantText}>
                        {entry.crewCount}/{entry.minCrewRequired}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* Skipper */}
              <View style={styles.skipperRow}>
                <MaterialCommunityIcons name="account-star" size={18} color="#64748B" />
                <Text style={styles.skipperName}>{entry.skipperName}</Text>
                {entry.registrationStatus && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{entry.registrationStatus}</Text>
                  </View>
                )}
              </View>

              {/* Crew List */}
              {entry.assignedCrew.length > 0 ? (
                <View style={styles.crewList}>
                  {entry.assignedCrew.map((crew, index) => (
                    <View key={crew.id} style={styles.crewRow}>
                      <MaterialCommunityIcons
                        name={getRoleIcon(crew.role)}
                        size={16}
                        color="#3B82F6"
                      />
                      <Text style={styles.crewName}>{crew.name}</Text>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{formatRole(crew.role)}</Text>
                      </View>
                      {crew.certifications && crew.certifications.length > 0 && (
                        <MaterialCommunityIcons
                          name="shield-check"
                          size={14}
                          color="#10B981"
                          style={styles.certIcon}
                        />
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noCrewRow}>
                  <MaterialCommunityIcons name="alert" size={16} color="#F59E0B" />
                  <Text style={styles.noCrewText}>No crew assigned</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  complianceBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  complianceBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  complianceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
  },
  manifestList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  manifestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  manifestCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  manifestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manifestHeaderLeft: {
    flex: 1,
  },
  sailNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  boatName: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  compliantText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  nonCompliantText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  skipperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  skipperName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'capitalize',
  },
  crewList: {
    gap: 8,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  crewName: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  certIcon: {
    marginLeft: 4,
  },
  noCrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  noCrewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
});
