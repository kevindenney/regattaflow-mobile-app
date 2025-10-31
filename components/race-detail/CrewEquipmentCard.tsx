// @ts-nocheck

/**
 * Crew & Equipment Card
 * Shows crew assigned to a race with availability status
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, Spacing } from '@/constants/designSystem';
import { crewManagementService, CrewMember } from '@/services/crewManagementService';
import { useAuth } from '@/providers/AuthProvider';

interface CrewEquipmentCardProps {
  raceId: string;
  classId?: string;
  raceDate?: string;
  onManageCrew?: () => void;
}

export function CrewEquipmentCard({ raceId, classId, raceDate, onManageCrew }: CrewEquipmentCardProps) {
  const { user } = useAuth();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCrew();
  }, [user, classId]);

  const loadCrew = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      let crewMembers;
      if (classId) {
        crewMembers = await crewManagementService.getCrewForClass(user.id, classId);
      } else {
        // If no classId, get all crew members
        crewMembers = await crewManagementService.getAllCrew(user.id);
      }
      // Filter to active crew only
      const activeCrew = crewMembers.filter((c) => c.status === 'active');
      setCrew(activeCrew);
    } catch (error) {
      console.error('Error loading crew:', error);
      // Gracefully handle the error without showing an alert
      setCrew([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'helmsman':
        return 'sail';
      case 'tactician':
        return 'compass';
      case 'trimmer':
        return 'tune-vertical';
      case 'bowman':
        return 'anchor';
      case 'pit':
        return 'cog';
      case 'grinder':
        return 'sync';
      default:
        return 'person';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'helmsman':
        return colors.primary[600];
      case 'tactician':
        return colors.info[600];
      case 'trimmer':
        return colors.success[600];
      default:
        return colors.text.secondary;
    }
  };

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="account-group" size={24} color={colors.primary[600]} />
          <Text style={styles.title}>Crew & Equipment</Text>
        </View>
        <TouchableOpacity style={styles.manageButton} onPress={onManageCrew}>
          <MaterialCommunityIcons name="account-edit" size={18} color={colors.primary[600]} />
          <Text style={styles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading crew...</Text>
        </View>
      ) : crew.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-plus" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>No crew assigned yet</Text>
          <Text style={styles.emptySubtext}>Add crew members to track who's sailing</Text>
          <TouchableOpacity style={styles.addCrewButton} onPress={onManageCrew}>
            <Ionicons name="add-circle" size={20} color={colors.primary[600]} />
            <Text style={styles.addCrewButtonText}>Add Crew</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Crew List */}
          <ScrollView style={styles.crewList} showsVerticalScrollIndicator={false}>
            {crew.map((member) => (
              <View key={member.id} style={styles.crewCard}>
                <View style={styles.crewIconContainer}>
                  <MaterialCommunityIcons
                    name={getRoleIcon(member.role)}
                    size={24}
                    color={getRoleColor(member.role)}
                  />
                </View>

                <View style={styles.crewInfo}>
                  <Text style={styles.crewName}>{member.name}</Text>
                  <View style={styles.crewMeta}>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) + '20' }]}>
                      <Text style={[styles.roleText, { color: getRoleColor(member.role) }]}>
                        {formatRole(member.role)}
                      </Text>
                    </View>
                    {member.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Ionicons name="star" size={12} color={colors.warning[600]} />
                        <Text style={styles.primaryText}>Primary</Text>
                      </View>
                    )}
                  </View>

                  {/* Certifications */}
                  {member.certifications && member.certifications.length > 0 && (
                    <View style={styles.certifications}>
                      {member.certifications.slice(0, 2).map((cert, idx) => (
                        <View key={idx} style={styles.certBadge}>
                          <Ionicons name="shield-checkmark" size={10} color={colors.success[600]} />
                          <Text style={styles.certText}>{cert.name}</Text>
                        </View>
                      ))}
                      {member.certifications.length > 2 && (
                        <Text style={styles.moreCerts}>+{member.certifications.length - 2}</Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Availability Status (future enhancement) */}
                <View style={styles.availabilityIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success[500]} />
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="account-check" size={18} color={colors.success[600]} />
              <Text style={styles.summaryText}>{crew.length} crew members</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="shield-check" size={18} color={colors.info[600]} />
              <Text style={styles.summaryText}>
                {crew.filter((c) => c.certifications?.length > 0).length} certified
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  loadingState: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  addCrewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  addCrewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  crewList: {
    maxHeight: 300,
  },
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  crewIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  crewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.warning[50],
    borderRadius: 10,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning[700],
  },
  certifications: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.success[50],
    borderRadius: 8,
  },
  certText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success[700],
  },
  moreCerts: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  availabilityIndicator: {
    marginLeft: Spacing.sm,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border.light,
  },
});
