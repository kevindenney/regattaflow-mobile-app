/**
 * PositionAssignmentPanel
 *
 * An interactive panel for assigning crew members to positions.
 * Allows selection of crew for each sailing role (helm, tactician, trim, bow).
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Check,
  Users,
  AlertCircle,
} from 'lucide-react-native';
import { CrewMemberPicker } from './CrewMemberPicker';
import { useAuth } from '@/providers/AuthProvider';
import {
  crewManagementService,
  CrewMember,
  CrewRole,
} from '@/services/crewManagementService';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray2: '#636366',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

// Positions to assign (in order)
const POSITIONS: { role: CrewRole; label: string; description: string }[] = [
  { role: 'helmsman', label: 'Helmsman', description: 'Steers the boat' },
  { role: 'tactician', label: 'Tactician', description: 'Race strategy and calls' },
  { role: 'trimmer', label: 'Trimmer', description: 'Sail trim and adjustments' },
  { role: 'bowman', label: 'Bowman', description: 'Foredeck work and spinnaker' },
];

interface PositionAssignment {
  role: CrewRole;
  crewMemberId?: string;
}

interface PositionAssignmentPanelProps extends ChecklistToolProps {}

export function PositionAssignmentPanel({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
}: PositionAssignmentPanelProps) {
  const { user } = useAuth();

  // State
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
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

  // Fetch crew members
  useEffect(() => {
    const fetchCrew = async () => {
      if (!user?.id || !boatId) {
        setIsLoading(false);
        return;
      }

      try {
        // Get all crew for this sailor
        const crew = await crewManagementService.getAllCrew(user.id);
        setCrewMembers(crew);
        setError(null); // Clear any previous error on success

        // Pre-populate with current role assignments
        const newAssignments = { ...assignments };
        for (const member of crew) {
          // If crew member has a preferred role, pre-select them
          if (POSITIONS.some((p) => p.role === member.role)) {
            if (!newAssignments[member.role]) {
              newAssignments[member.role] = member.id;
            }
          }
        }
        setAssignments(newAssignments);
      } catch (err) {
        console.error('Failed to fetch crew:', err);
        setError('Failed to load crew members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCrew();
  }, [user?.id, boatId]);

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
  }, []);

  // Check if any positions are assigned
  const hasAssignments = useMemo(() => {
    return Object.values(assignments).some((id) => id !== undefined);
  }, [assignments]);

  // Count assigned positions
  const assignedCount = useMemo(() => {
    return Object.values(assignments).filter((id) => id !== undefined).length;
  }, [assignments]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!raceEventId) {
      onComplete();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Assign each crew member to the race with their position
      const assignmentPromises = Object.entries(assignments)
        .filter(([_, crewMemberId]) => crewMemberId)
        .map(([role, crewMemberId]) =>
          crewManagementService.assignCrewToRace(
            raceEventId,
            crewMemberId!,
            user?.id,
            `Position: ${role}`
          )
        );

      await Promise.all(assignmentPromises);
      onComplete();
    } catch (err) {
      console.error('Failed to save assignments:', err);
      setError('Failed to save assignments. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [assignments, raceEventId, user?.id, onComplete]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={IOS_COLORS.blue} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Assign Positions</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryIcon}>
          <Users size={24} color={IOS_COLORS.blue} />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryTitle}>Crew Positions</Text>
          <Text style={styles.summarySubtitle}>
            {assignedCount} of {POSITIONS.length} assigned
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Loading crew...</Text>
        </View>
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={18} color={IOS_COLORS.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Position Pickers */}
          <ScrollView
            style={styles.listContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {crewMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={IOS_COLORS.gray} />
                <Text style={styles.emptyStateTitle}>No Crew Members</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Add crew members in your boat settings to assign positions.
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

          {/* Bottom Action */}
          <View style={styles.bottomAction}>
            <Pressable
              style={[
                styles.saveButton,
                (!hasAssignments || isSaving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!hasAssignments || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={18} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    {hasAssignments ? 'Save Assignments' : 'No Positions Assigned'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  backText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 80,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    gap: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  summarySubtitle: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    padding: 12,
    backgroundColor: `${IOS_COLORS.red}15`,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 14,
    color: IOS_COLORS.red,
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  positionCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  positionDescription: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
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
    backgroundColor: IOS_COLORS.gray,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PositionAssignmentPanel;
