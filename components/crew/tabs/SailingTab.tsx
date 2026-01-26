/**
 * SailingTab Component
 *
 * Displays position assignments for a specific race.
 * Allows assigning crew members from the roster to sailing positions.
 * Adapted from PositionAssignmentPanel for use in CrewHub.
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Anchor, Users, Check, AlertCircle, UserPlus } from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';
import { useAuth } from '@/providers/AuthProvider';
import {
  crewManagementService,
  CrewMember,
  CrewRole,
} from '@/services/crewManagementService';
import { RaceCollaborationService } from '@/services/RaceCollaborationService';
import { CrewMemberPicker } from '@/components/checklist-tools/crew/CrewMemberPicker';

// =============================================================================
// TYPES
// =============================================================================

interface SailingTabProps {
  sailorId: string;
  classId: string;
  regattaId: string;
  raceName?: string;
  onCrewChange?: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const POSITIONS: { role: CrewRole; label: string; description: string }[] = [
  { role: 'helmsman', label: 'Helmsman', description: 'Steers the boat' },
  { role: 'tactician', label: 'Tactician', description: 'Race strategy and calls' },
  { role: 'trimmer', label: 'Trimmer', description: 'Sail trim and adjustments' },
  { role: 'bowman', label: 'Bowman', description: 'Foredeck work and spinnaker' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SailingTab({
  sailorId,
  classId,
  regattaId,
  raceName,
  onCrewChange,
}: SailingTabProps) {
  const { user } = useAuth();

  // State
  const [crewMembers, setCrew] = useState<CrewMember[]>([]);
  const [assignments, setAssignments] = useState<Record<CrewRole, string | undefined>>({
    helmsman: undefined,
    tactician: undefined,
    trimmer: undefined,
    bowman: undefined,
    pit: undefined,
    grinder: undefined,
    other: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Track initial assignments to detect changes for collaborator sync
  const initialAssignmentsRef = useRef<Record<CrewRole, string | undefined>>({
    helmsman: undefined,
    tactician: undefined,
    trimmer: undefined,
    bowman: undefined,
    pit: undefined,
    grinder: undefined,
    other: undefined,
  });

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const fetchData = async () => {
      // Skip if user, sailorId, or classId are missing/invalid
      if (!user?.id || !sailorId || !classId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Get all crew for this sailor/class
        const crew = await crewManagementService.getCrewByClass(sailorId, classId);
        setCrew(crew);
        setError(null);

        // Pre-populate with current role assignments
        const newAssignments = { ...assignments };
        for (const member of crew) {
          if (POSITIONS.some((p) => p.role === member.role)) {
            if (!newAssignments[member.role]) {
              newAssignments[member.role] = member.id;
            }
          }
        }
        setAssignments(newAssignments);
        // Store initial state to detect changes for collaborator sync
        initialAssignmentsRef.current = { ...newAssignments };
      } catch (err) {
        console.error('Failed to fetch crew:', err);
        setError('Failed to load crew members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, sailorId, classId]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  // Get IDs that are already assigned to other positions
  const getExcludedIds = useCallback(
    (currentRole: CrewRole) => {
      return Object.entries(assignments)
        .filter(([role, id]) => role !== currentRole && id)
        .map(([_, id]) => id as string);
    },
    [assignments]
  );

  // Handle position assignment
  const handleAssignment = useCallback((role: CrewRole, member: CrewMember | null) => {
    setAssignments((prev) => ({
      ...prev,
      [role]: member?.id,
    }));
    setHasChanges(true);
  }, []);

  // Count assigned positions
  const assignedCount = useMemo(() => {
    return POSITIONS.filter((p) => assignments[p.role] !== undefined).length;
  }, [assignments]);

  // Check if any positions are assigned
  const hasAssignments = useMemo(() => {
    return assignedCount > 0;
  }, [assignedCount]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!regattaId || !user?.id) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Assign each crew member to the race with their position
      const assignmentPromises = Object.entries(assignments)
        .filter(([role, crewMemberId]) => {
          // Only include positions that are defined in POSITIONS
          return POSITIONS.some((p) => p.role === role) && crewMemberId;
        })
        .map(([role, crewMemberId]) =>
          crewManagementService.assignCrewToRace(
            regattaId,
            crewMemberId!,
            user.id,
            `Position: ${role}`
          )
        );

      await Promise.all(assignmentPromises);

      // Sync collaborators: add newly assigned crew, remove de-assigned crew
      await syncCrewCollaborators();

      Alert.alert('Saved', 'Position assignments saved successfully');
      setHasChanges(false);
      // Update initial assignments ref to current state
      initialAssignmentsRef.current = { ...assignments };
      onCrewChange?.();
    } catch (err) {
      console.error('Failed to save assignments:', err);
      setError('Failed to save assignments. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [assignments, regattaId, user?.id, onCrewChange]);

  // Sync crew collaborators based on position assignments
  const syncCrewCollaborators = useCallback(async () => {
    const initialAssignments = initialAssignmentsRef.current;

    // Get current assigned crew member IDs with their positions
    const currentAssigned = new Map<string, string>(); // crewMemberId -> position
    for (const position of POSITIONS) {
      const crewMemberId = assignments[position.role];
      if (crewMemberId) {
        currentAssigned.set(crewMemberId, position.label);
      }
    }

    // Get previously assigned crew member IDs
    const previousAssigned = new Set<string>();
    for (const position of POSITIONS) {
      const crewMemberId = initialAssignments[position.role];
      if (crewMemberId) {
        previousAssigned.add(crewMemberId);
      }
    }

    // Find newly assigned crew (in current but not in previous)
    const newlyAssigned: Array<{ crewMemberId: string; position: string }> = [];
    for (const [crewMemberId, position] of currentAssigned) {
      if (!previousAssigned.has(crewMemberId)) {
        newlyAssigned.push({ crewMemberId, position });
      }
    }

    // Find de-assigned crew (in previous but not in current)
    const deAssigned: string[] = [];
    for (const crewMemberId of previousAssigned) {
      if (!currentAssigned.has(crewMemberId)) {
        deAssigned.push(crewMemberId);
      }
    }

    // Add newly assigned crew as collaborators
    for (const { crewMemberId, position } of newlyAssigned) {
      const crewMember = crewMembers.find((c) => c.id === crewMemberId);
      if (crewMember?.userId) {
        try {
          await RaceCollaborationService.addCrewAsCollaborator(
            regattaId,
            crewMember.userId,
            position
          );
        } catch (err) {
          console.warn(`Failed to add crew ${crewMemberId} as collaborator:`, err);
          // Continue with other crew - don't fail the whole save
        }
      }
    }

    // Remove de-assigned crew from collaborators
    for (const crewMemberId of deAssigned) {
      const crewMember = crewMembers.find((c) => c.id === crewMemberId);
      if (crewMember?.userId) {
        try {
          await RaceCollaborationService.removeCrewCollaborator(
            regattaId,
            crewMember.userId
          );
        } catch (err) {
          console.warn(`Failed to remove crew ${crewMemberId} from collaborators:`, err);
          // Continue with other crew - don't fail the whole save
        }
      }
    }
  }, [assignments, crewMembers, regattaId]);

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOS_COLORS.blue} />
        <Text style={styles.loadingText}>Loading positions...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Header with summary */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Anchor size={20} color={IOS_COLORS.blue} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {raceName ? `Sailing ${raceName}` : 'Race Positions'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {assignedCount} of {POSITIONS.length} positions assigned
          </Text>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color={IOS_COLORS.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Position Pickers */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {crewMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={IOS_COLORS.gray3} />
            <Text style={styles.emptyTitle}>No Crew Members</Text>
            <Text style={styles.emptyText}>
              Add crew members in the Roster tab to assign positions.
            </Text>
          </View>
        ) : (
          POSITIONS.map((position) => (
            <View key={position.role} style={styles.positionCard}>
              <Text style={styles.positionDescription}>
                {position.description}
              </Text>
              <CrewMemberPicker
                label={position.label}
                crewMembers={crewMembers}
                selectedMemberId={assignments[position.role]}
                onSelect={(member) => handleAssignment(position.role, member)}
                excludeIds={getExcludedIds(position.role)}
                placeholder={`Select ${position.label.toLowerCase()}`}
              />
            </View>
          ))
        )}
      </ScrollView>

      {/* Save Button */}
      {crewMembers.length > 0 && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!hasChanges || isSaving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={IOS_COLORS.systemBackground} />
            ) : (
              <>
                <Check size={18} color={IOS_COLORS.systemBackground} />
                <Text style={styles.saveButtonText}>
                  {hasChanges ? 'Save Assignments' : 'No Changes'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray5,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: `${IOS_COLORS.red}15`,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    color: IOS_COLORS.red,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  positionCard: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  positionDescription: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginBottom: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bottomAction: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.blue,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: IOS_COLORS.gray3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },
});

export default SailingTab;
