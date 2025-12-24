// @ts-nocheck

/**
 * Crew & Equipment Card
 * Shows crew assigned to a race with availability status
 */

import { colors, Spacing } from '@/constants/designSystem';
import { useAuth } from '@/providers/AuthProvider';
import { crewManagementService, CrewMemberWithAssignment } from '@/services/crewManagementService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CrewEquipmentCardProps {
  raceId: string;
  classId?: string;
  raceDate?: string;
  onManageCrew?: () => void;
}

export function CrewEquipmentCard({ raceId, classId, raceDate, onManageCrew }: CrewEquipmentCardProps) {
  const { user } = useAuth();
  const [crew, setCrew] = useState<CrewMemberWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvailable, setShowAvailable] = useState(false);

  useEffect(() => {
    loadCrew();
  }, [user, classId, raceId]);

  const loadCrew = async () => {
    if (!user?.id) {
      console.log('[CrewEquipmentCard] No user ID, skipping load');
      setLoading(false);
      return;
    }

    if (!raceId) {
      console.log('[CrewEquipmentCard] No raceId, skipping load');
      setLoading(false);
      setCrew([]);
      return;
    }

    try {
      setLoading(true);
      console.log('[CrewEquipmentCard] Loading crew for:', { userId: user.id, classId, raceId });

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout loading crew after 10 seconds')), 10000);
      });
      
      const crewPromise = crewManagementService.getCrewWithAssignmentStatus(
        user.id,
        classId || null,
        raceId
      );
      
      // Get crew with assignment status for this race
      const crewMembers = await Promise.race([crewPromise, timeoutPromise]);

      console.log('[CrewEquipmentCard] Loaded crew members:', crewMembers.length);

      // Show both active AND pending crew (pending = invited but not yet accepted)
      // This helps sailors see their full crew roster including pending invites
      const relevantCrew = crewMembers.filter((c) => c.status === 'active' || c.status === 'pending');
      console.log('[CrewEquipmentCard] Relevant crew (active + pending):', relevantCrew.length);
      setCrew(relevantCrew);
      
      // Auto-expand "Available crew" section if there are unassigned crew members
      const unassignedCount = relevantCrew.filter((c) => !c.isAssigned).length;
      if (unassignedCount > 0) {
        setShowAvailable(true);
      }
    } catch (error: any) {
      console.error('[CrewEquipmentCard] Error loading crew:', error);
      console.error('[CrewEquipmentCard] Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack?.substring(0, 200),
      });
      // Gracefully handle the error without showing an alert
      setCrew([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCrew = async (crewMemberId: string) => {
    try {
      await crewManagementService.assignCrewToRace(raceId, crewMemberId);
      await loadCrew(); // Refresh the list
    } catch (error) {
      console.error('Error assigning crew:', error);
      Alert.alert('Error', 'Failed to assign crew member');
    }
  };

  const handleUnassignCrew = async (assignmentId: string) => {
    try {
      await crewManagementService.unassignCrewFromRace(assignmentId);
      await loadCrew(); // Refresh the list
    } catch (error) {
      console.error('Error unassigning crew:', error);
      Alert.alert('Error', 'Failed to unassign crew member');
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

  const assignedCrew = crew.filter((c) => c.isAssigned);
  const availableCrew = crew.filter((c) => !c.isAssigned);

  const renderCrewMember = (member: CrewMemberWithAssignment) => {
    const isPending = member.status === 'pending';
    
    return (
    <View key={member.id} style={[styles.crewCard, isPending && styles.crewCardPending]}>
      <View style={styles.crewIconContainer}>
        <MaterialCommunityIcons
          name={getRoleIcon(member.role)}
          size={24}
          color={isPending ? colors.text.tertiary : getRoleColor(member.role)}
        />
        {isPending && (
          <View style={styles.pendingIndicator}>
            <Ionicons name="time" size={10} color={colors.warning[600]} />
          </View>
        )}
      </View>

      <View style={styles.crewInfo}>
        <View style={styles.crewNameRow}>
          <Text style={[styles.crewName, isPending && styles.crewNamePending]}>{member.name}</Text>
          {isPending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          )}
        </View>
        <View style={styles.crewMeta}>
          <View style={[styles.roleBadge, { backgroundColor: (isPending ? colors.text.tertiary : getRoleColor(member.role)) + '20' }]}>
            <Text style={[styles.roleText, { color: isPending ? colors.text.tertiary : getRoleColor(member.role) }]}>
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

      {/* Assignment Action - disabled for pending crew */}
      {isPending ? (
        <View style={styles.pendingAction}>
          <Ionicons name="mail-outline" size={18} color={colors.text.tertiary} />
          <Text style={styles.pendingActionText}>Invited</Text>
        </View>
      ) : member.isAssigned ? (
        <TouchableOpacity
          style={styles.unassignButton}
          onPress={() => member.assignmentId && handleUnassignCrew(member.assignmentId)}
        >
          <Ionicons name="close-circle" size={20} color={colors.error[500]} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => handleAssignCrew(member.id)}
        >
          <Ionicons name="add-circle" size={20} color={colors.primary[600]} />
        </TouchableOpacity>
      )}
    </View>
  );
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
          <Text style={styles.emptyText}>No crew configured</Text>
          <Text style={styles.emptySubtext}>Set up your crew roster to assign them to races</Text>
          <TouchableOpacity style={styles.addCrewButton} onPress={onManageCrew}>
            <Ionicons name="add-circle" size={20} color={colors.primary[600]} />
            <Text style={styles.addCrewButtonText}>Add Crew</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Assigned Crew Section */}
          {assignedCrew.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assigned to this race</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{assignedCrew.length}</Text>
                </View>
              </View>
              <ScrollView style={styles.crewList} showsVerticalScrollIndicator={false}>
                {assignedCrew.map(renderCrewMember)}
              </ScrollView>
            </>
          )}

          {/* Available Crew Section */}
          {availableCrew.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setShowAvailable(!showAvailable)}
              >
                <Text style={styles.sectionTitle}>Available crew</Text>
                <View style={styles.headerRight}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{availableCrew.length}</Text>
                  </View>
                  <Ionicons
                    name={showAvailable ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.text.secondary}
                  />
                </View>
              </TouchableOpacity>
              {showAvailable && (
                <ScrollView style={styles.crewList} showsVerticalScrollIndicator={false}>
                  {availableCrew.map(renderCrewMember)}
                </ScrollView>
              )}
            </>
          )}

          {/* Empty State for No Assigned Crew */}
          {assignedCrew.length === 0 && (
            <View style={styles.noAssignedState}>
              <MaterialCommunityIcons name="sail-boat" size={32} color={colors.text.tertiary} />
              <Text style={styles.noAssignedText}>No crew assigned to this race yet</Text>
              <Text style={styles.noAssignedSubtext}>
                Tap the + button on crew members to assign them
              </Text>
            </View>
          )}

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="account-check" size={18} color={colors.success[600]} />
              <Text style={styles.summaryText}>{assignedCrew.length} assigned</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="account-multiple" size={18} color={colors.info[600]} />
              <Text style={styles.summaryText}>{crew.filter(c => c.status === 'active').length} active</Text>
            </View>
            {crew.filter(c => c.status === 'pending').length > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Ionicons name="time" size={16} color={colors.warning[600]} />
                  <Text style={styles.summaryText}>{crew.filter(c => c.status === 'pending').length} pending</Text>
                </View>
              </>
            )}
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
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[700],
  },
  assignButton: {
    padding: 8,
  },
  unassignButton: {
    padding: 8,
  },
  noAssignedState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  noAssignedText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  noAssignedSubtext: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  // Pending crew styles
  crewCardPending: {
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
    borderStyle: 'dashed',
  },
  pendingIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.warning[100],
    borderRadius: 8,
    padding: 2,
  },
  crewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  crewNamePending: {
    color: colors.text.secondary,
  },
  pendingBadge: {
    backgroundColor: colors.warning[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning[700],
  },
  pendingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingActionText: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
});
