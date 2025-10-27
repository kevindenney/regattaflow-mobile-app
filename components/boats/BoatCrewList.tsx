/**
 * BoatCrewList Component
 * Displays crew members assigned to a specific boat
 */

import {
  AvailabilityStatus,
  crewManagementService,
  CrewMemberWithAvailability,
  CrewRole
} from '@/services/crewManagementService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface BoatCrewListProps {
  boatId: string;
  sailorId: string;
  classId: string;
}

const ROLE_ICONS: Record<CrewRole, string> = {
  helmsman: 'navigate-circle',
  tactician: 'compass',
  trimmer: 'hand-left',
  bowman: 'arrow-up-circle',
  pit: 'construct',
  grinder: 'fitness',
  other: 'person',
};

const ROLE_COLORS: Record<CrewRole, string> = {
  helmsman: '#3B82F6',
  tactician: '#8B5CF6',
  trimmer: '#10B981',
  bowman: '#F59E0B',
  pit: '#EF4444',
  grinder: '#6366F1',
  other: '#64748B',
};

export function BoatCrewList({ boatId, sailorId, classId }: BoatCrewListProps) {
  const [crew, setCrew] = useState<CrewMemberWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCrew();
  }, [boatId, sailorId, classId]);

  const loadCrew = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const data = await crewManagementService.getCrewWithAvailability(sailorId, classId, today);
      setCrew(data);
    } catch (err) {
      console.error('Error loading boat crew:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (availability?: AvailabilityStatus) => {
    switch (availability) {
      case 'available':
        return '#10B981';
      case 'unavailable':
        return '#EF4444';
      case 'tentative':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  const getAvailabilityLabel = (availability?: AvailabilityStatus) => {
    switch (availability) {
      case 'available':
        return 'Available';
      case 'unavailable':
        return 'Unavailable';
      case 'tentative':
        return 'Tentative';
      default:
        return 'Available';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading crew...</Text>
      </View>
    );
  }

  if (crew.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No Crew Assigned</Text>
        <Text style={styles.emptyText}>Add crew members from the Crew tab</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push('/(tabs)/crew')}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>Add Crew</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={20} color="#3B82F6" />
          <Text style={styles.headerTitle}>Crew ({crew.length})</Text>
        </View>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => router.push('/(tabs)/crew')}
        >
          <Text style={styles.manageButtonText}>Manage</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.crewList}>
        {crew.map((member) => (
          <View key={member.id} style={styles.crewCard}>
            <View
              style={[
                styles.roleIcon,
                { backgroundColor: ROLE_COLORS[member.role] + '20' },
              ]}
            >
              <Ionicons
                name={ROLE_ICONS[member.role] as any}
                size={24}
                color={ROLE_COLORS[member.role]}
              />
            </View>

            <View style={styles.crewInfo}>
              <Text style={styles.crewName}>{member.name}</Text>
              <Text style={styles.crewEmail}>{member.email}</Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: ROLE_COLORS[member.role] + '15' },
                  ]}
                >
                  <Text style={[styles.roleText, { color: ROLE_COLORS[member.role] }]}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Text>
                </View>
                {member.currentAvailability && (
                  <View
                    style={[
                      styles.availabilityBadge,
                      {
                        backgroundColor:
                          getAvailabilityColor(member.currentAvailability) + '15',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.availabilityDot,
                        {
                          backgroundColor: getAvailabilityColor(
                            member.currentAvailability
                          ),
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.availabilityText,
                        { color: getAvailabilityColor(member.currentAvailability) },
                      ]}
                    >
                      {getAvailabilityLabel(member.currentAvailability)}
                    </Text>
                  </View>
                )}
              </View>

              {member.nextUnavailable && (
                <View style={styles.nextUnavailableBadge}>
                  <Ionicons name="calendar-outline" size={10} color="#F59E0B" />
                  <Text style={styles.nextUnavailableText}>
                    Unavailable {new Date(member.nextUnavailable.startDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.statusIndicator}>
              {member.status === 'pending' ? (
                <View style={styles.pendingIndicator}>
                  <Ionicons name="time-outline" size={16} color="#F59E0B" />
                </View>
              ) : (
                <View style={styles.activeIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  crewList: {
    gap: 12,
  },
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crewInfo: {
    flex: 1,
    gap: 4,
  },
  crewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  crewEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  availabilityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  availabilityText: {
    fontSize: 9,
    fontWeight: '600',
  },
  nextUnavailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  nextUnavailableText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#D97706',
  },
  statusIndicator: {
    marginLeft: 'auto',
  },
  pendingIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
