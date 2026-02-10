/**
 * CrewManagementWizard
 *
 * An interactive wizard that consolidates all crew preparation steps:
 * - Manage & confirm crew (add, remove, confirm availability)
 * - Assign positions (helm, tactician, trimmer, bow)
 * - Set meeting point/time
 *
 * Presented as a multi-step wizard launched from the Crew tile.
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ChevronLeft,
  Check,
  Users,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  ChevronRight,
  Circle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react-native';
import { CrewMemberPicker } from './CrewMemberPicker';
import { LocationMapPicker } from '@/components/races/LocationMapPicker';
import { useAuth } from '@/providers/AuthProvider';
import {
  crewManagementService,
  CrewMember,
  CrewRole,
} from '@/services/crewManagementService';
import { supabase } from '@/services/supabase';
import { showConfirm } from '@/lib/utils/crossPlatformAlert';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

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

type Step = 'confirm' | 'positions' | 'meeting_point';

const STEPS: { id: Step; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'confirm', label: 'Confirm Crew', icon: Phone },
  { id: 'positions', label: 'Assign Positions', icon: Users },
  { id: 'meeting_point', label: 'Meeting Point', icon: MapPin },
];

const POSITIONS: { role: CrewRole; label: string; description: string }[] = [
  { role: 'helmsman', label: 'Helmsman', description: 'Steers the boat' },
  { role: 'tactician', label: 'Tactician', description: 'Race strategy and calls' },
  { role: 'trimmer', label: 'Trimmer', description: 'Sail trim and adjustments' },
  { role: 'bowman', label: 'Bowman', description: 'Foredeck work and spinnaker' },
];

const ROLES: { value: CrewRole; label: string }[] = [
  { value: 'helmsman', label: 'Helmsman' },
  { value: 'tactician', label: 'Tactician' },
  { value: 'trimmer', label: 'Trimmer' },
  { value: 'bowman', label: 'Bowman' },
  { value: 'pit', label: 'Pit' },
  { value: 'grinder', label: 'Grinder' },
  { value: 'other', label: 'Other' },
];

interface CrewManagementWizardProps extends ChecklistToolProps {
  /** Class ID for adding crew members */
  classId?: string;
}

export function CrewManagementWizard({
  item,
  raceEventId,
  boatId,
  classId,
  onComplete,
  onCancel,
}: CrewManagementWizardProps) {
  const { user } = useAuth();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>('confirm');

  // Crew data
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [confirmedMembers, setConfirmedMembers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add crew form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewRole, setNewCrewRole] = useState<CrewRole>('trimmer');
  const [isAdding, setIsAdding] = useState(false);

  // Position assignments
  const [assignments, setAssignments] = useState<Record<CrewRole, string | undefined>>({
    helmsman: undefined,
    tactician: undefined,
    trimmer: undefined,
    bowman: undefined,
    pit: undefined,
    grinder: undefined,
    other: undefined,
  });

  // Meeting point
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [meetingTime, setMeetingTime] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');

  // Saving
  const [isSaving, setIsSaving] = useState(false);

  // Load crew members and existing data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const crew = await crewManagementService.getAllCrew(user.id);
        setCrewMembers(crew);

        // Pre-populate position assignments from preferred roles
        const newAssignments = { ...assignments };
        for (const member of crew) {
          if (POSITIONS.some((p) => p.role === member.role)) {
            if (!newAssignments[member.role]) {
              newAssignments[member.role] = member.id;
            }
          }
        }
        setAssignments(newAssignments);

        // Fetch existing meeting location
        if (raceEventId) {
          const { data } = await supabase
            .from('race_events')
            .select('meeting_location, start_time')
            .eq('id', raceEventId)
            .maybeSingle();

          if (data?.meeting_location) {
            const ml = data.meeting_location as any;
            setLocation({ name: ml.name, lat: ml.lat, lng: ml.lng });
            if (ml.time) setMeetingTime(new Date(ml.time));
            if (ml.notes) setNotes(ml.notes);
          } else if (data?.start_time) {
            const startTime = new Date(data.start_time);
            startTime.setHours(startTime.getHours() - 1);
            setMeetingTime(startTime);
          }
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch crew data:', err);
        setError('Failed to load crew data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, raceEventId]);

  // Step navigation
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const canGoBack = currentStepIndex > 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  }, [currentStepIndex, isLastStep]);

  const goToPrevStep = useCallback(() => {
    if (canGoBack) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    } else {
      onCancel();
    }
  }, [currentStepIndex, canGoBack, onCancel]);

  // ---- Add Crew ----
  const handleAddCrew = useCallback(async () => {
    if (!user?.id || !newCrewName.trim()) return;

    // Use the classId passed in, or fall back to a generic one
    const effectiveClassId = classId || 'default';

    setIsAdding(true);
    setError(null);

    try {
      const newMember = await crewManagementService.addCrewMember(
        user.id,
        effectiveClassId,
        {
          name: newCrewName.trim(),
          role: newCrewRole,
        }
      );
      setCrewMembers((prev) => [...prev, newMember]);
      setNewCrewName('');
      setNewCrewRole('trimmer');
      setShowAddForm(false);
    } catch (err: any) {
      // Handle offline queue
      if (err?.queuedForSync && err?.entity) {
        setCrewMembers((prev) => [...prev, err.entity]);
        setNewCrewName('');
        setNewCrewRole('trimmer');
        setShowAddForm(false);
      } else {
        console.error('Failed to add crew member:', err);
        setError('Failed to add crew member');
      }
    } finally {
      setIsAdding(false);
    }
  }, [user?.id, classId, newCrewName, newCrewRole]);

  // ---- Remove Crew ----
  const handleRemoveCrew = useCallback(
    (member: CrewMember) => {
      showConfirm(
        'Remove Crew Member',
        `Remove ${member.name} from your crew?`,
        async () => {
          try {
            await crewManagementService.removeCrewMember(member.id);
            setCrewMembers((prev) => prev.filter((m) => m.id !== member.id));
            setConfirmedMembers((prev) => {
              const next = new Set(prev);
              next.delete(member.id);
              return next;
            });
            // Clear any position assignments for this member
            setAssignments((prev) => {
              const next = { ...prev };
              for (const [role, id] of Object.entries(next)) {
                if (id === member.id) {
                  next[role as CrewRole] = undefined;
                }
              }
              return next;
            });
          } catch (err: any) {
            if (err?.queuedForSync) {
              // Optimistic removal for offline
              setCrewMembers((prev) => prev.filter((m) => m.id !== member.id));
              setConfirmedMembers((prev) => {
                const next = new Set(prev);
                next.delete(member.id);
                return next;
              });
            } else {
              console.error('Failed to remove crew member:', err);
              setError('Failed to remove crew member');
            }
          }
        },
        { destructive: true }
      );
    },
    []
  );

  // Crew confirmation
  const toggleCrewConfirm = useCallback((memberId: string) => {
    setConfirmedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  // Position assignment
  const getExcludedIds = useCallback(
    (currentRole: CrewRole) => {
      return Object.entries(assignments)
        .filter(([role, id]) => role !== currentRole && id)
        .map(([_, id]) => id as string);
    },
    [assignments]
  );

  const handleAssignment = useCallback((role: CrewRole, member: CrewMember | null) => {
    setAssignments((prev) => ({
      ...prev,
      [role]: member?.id,
    }));
  }, []);

  const assignedCount = useMemo(() => {
    return POSITIONS.filter((p) => assignments[p.role]).length;
  }, [assignments]);

  // Meeting point
  const handleLocationSelect = useCallback(
    (loc: { name: string; lat: number; lng: number }) => {
      setLocation(loc);
      setShowLocationPicker(false);
    },
    []
  );

  const handleTimeChange = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setMeetingTime(selectedDate);
    }
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Step completion status
  const isStepComplete = useCallback(
    (step: Step) => {
      switch (step) {
        case 'confirm':
          return crewMembers.length > 0 && confirmedMembers.size > 0;
        case 'positions':
          return assignedCount > 0;
        case 'meeting_point':
          return location !== null;
      }
    },
    [crewMembers.length, confirmedMembers.size, assignedCount, location]
  );

  // Save all data
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Save position assignments
      if (raceEventId && assignedCount > 0) {
        const assignmentPromises = Object.entries(assignments)
          .filter(([role, crewMemberId]) => crewMemberId && POSITIONS.some((p) => p.role === role))
          .map(([role, crewMemberId]) =>
            crewManagementService.assignCrewToRace(
              raceEventId,
              crewMemberId!,
              user?.id,
              `Position: ${role}`
            )
          );
        await Promise.all(assignmentPromises);
      }

      // Save meeting location
      if (raceEventId && location) {
        const meetingLocation = {
          name: location.name,
          lat: location.lat,
          lng: location.lng,
          time: meetingTime.toISOString(),
          notes: notes.trim() || undefined,
        };

        await supabase
          .from('race_events')
          .update({ meeting_location: meetingLocation })
          .eq('id', raceEventId);
      }

      onComplete();
    } catch (err) {
      console.error('Failed to save crew data:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [assignments, assignedCount, location, meetingTime, notes, raceEventId, user?.id, onComplete]);

  // Step progress indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step) => {
        const isActive = step.id === currentStep;
        const complete = isStepComplete(step.id);
        return (
          <Pressable
            key={step.id}
            style={[styles.stepDot, isActive && styles.stepDotActive]}
            onPress={() => setCurrentStep(step.id)}
          >
            {complete ? (
              <CheckCircle2 size={20} color={IOS_COLORS.green} />
            ) : isActive ? (
              <View style={styles.stepDotActiveFill} />
            ) : (
              <Circle size={20} color={IOS_COLORS.gray} />
            )}
            <Text
              style={[styles.stepLabel, isActive && styles.stepLabelActive]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // ---- Add Crew Form (inline) ----
  const renderAddCrewForm = () => (
    <View style={styles.addFormCard}>
      <View style={styles.addFormHeader}>
        <UserPlus size={18} color={IOS_COLORS.blue} />
        <Text style={styles.addFormTitle}>Add Crew Member</Text>
        <Pressable
          onPress={() => { setShowAddForm(false); setNewCrewName(''); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={20} color={IOS_COLORS.gray} />
        </Pressable>
      </View>

      <TextInput
        style={styles.addFormInput}
        placeholder="Name"
        placeholderTextColor={IOS_COLORS.gray}
        value={newCrewName}
        onChangeText={setNewCrewName}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => { if (newCrewName.trim()) handleAddCrew(); }}
      />

      <View style={styles.roleChipsRow}>
        {ROLES.map((r) => (
          <Pressable
            key={r.value}
            style={[
              styles.roleChip,
              newCrewRole === r.value && styles.roleChipActive,
            ]}
            onPress={() => setNewCrewRole(r.value)}
          >
            <Text
              style={[
                styles.roleChipText,
                newCrewRole === r.value && styles.roleChipTextActive,
              ]}
            >
              {r.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[
          styles.addFormButton,
          (!newCrewName.trim() || isAdding) && styles.addFormButtonDisabled,
        ]}
        onPress={handleAddCrew}
        disabled={!newCrewName.trim() || isAdding}
      >
        {isAdding ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addFormButtonText}>Add</Text>
          </>
        )}
      </Pressable>
    </View>
  );

  // ---- STEP 1: Confirm Crew ----
  const renderConfirmStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconBg, { backgroundColor: `${IOS_COLORS.blue}15` }]}>
          <Phone size={24} color={IOS_COLORS.blue} />
        </View>
        <View style={styles.stepHeaderText}>
          <Text style={styles.stepTitle}>Manage & Confirm Crew</Text>
          <Text style={styles.stepSubtitle}>
            {crewMembers.length} crew member{crewMembers.length !== 1 ? 's' : ''}
            {confirmedMembers.size > 0 ? ` · ${confirmedMembers.size} confirmed` : ''}
          </Text>
        </View>
      </View>

      {/* Crew member list */}
      {crewMembers.length > 0 && (
        <View style={styles.crewList}>
          {crewMembers.map((member) => {
            const isConfirmed = confirmedMembers.has(member.id);
            return (
              <View key={member.id} style={[styles.crewRow, isConfirmed && styles.crewRowConfirmed]}>
                <Pressable
                  style={styles.crewMainArea}
                  onPress={() => toggleCrewConfirm(member.id)}
                >
                  <View style={styles.crewInfo}>
                    <Text style={styles.crewName}>{member.name}</Text>
                    {member.role && (
                      <Text style={styles.crewRole}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Text>
                    )}
                  </View>
                  {isConfirmed ? (
                    <CheckCircle2 size={24} color={IOS_COLORS.green} />
                  ) : (
                    <Circle size={24} color={IOS_COLORS.gray} />
                  )}
                </Pressable>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => handleRemoveCrew(member)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                >
                  <Trash2 size={16} color={IOS_COLORS.red} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {/* Empty state */}
      {crewMembers.length === 0 && !showAddForm && (
        <View style={styles.emptyState}>
          <Users size={40} color={IOS_COLORS.gray} />
          <Text style={styles.emptyTitle}>No crew members found</Text>
          <Text style={styles.emptySubtitle}>
            Add your crew below to get started.
          </Text>
        </View>
      )}

      {/* Add crew form or button */}
      {showAddForm ? (
        renderAddCrewForm()
      ) : (
        <Pressable
          style={styles.addCrewButton}
          onPress={() => setShowAddForm(true)}
        >
          <Plus size={18} color={IOS_COLORS.blue} />
          <Text style={styles.addCrewButtonText}>Add Crew Member</Text>
        </Pressable>
      )}

      {crewMembers.length > 0 && (
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Tips</Text>
          <Text style={styles.tipText}>• Tap a crew member to confirm availability</Text>
          <Text style={styles.tipText}>• Contact crew 48+ hours before the race</Text>
          <Text style={styles.tipText}>• Verify everyone has required personal gear</Text>
        </View>
      )}
    </ScrollView>
  );

  // ---- STEP 2: Assign Positions ----
  const renderPositionsStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconBg, { backgroundColor: `${IOS_COLORS.blue}15` }]}>
          <Users size={24} color={IOS_COLORS.blue} />
        </View>
        <View style={styles.stepHeaderText}>
          <Text style={styles.stepTitle}>Assign Positions</Text>
          <Text style={styles.stepSubtitle}>
            {assignedCount} of {POSITIONS.length} assigned
          </Text>
        </View>
      </View>

      {crewMembers.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={40} color={IOS_COLORS.gray} />
          <Text style={styles.emptyTitle}>No Crew Members</Text>
          <Text style={styles.emptySubtitle}>
            Go back and add crew members first.
          </Text>
        </View>
      ) : (
        <View style={styles.positionsList}>
          {POSITIONS.map((position) => (
            <View key={position.role} style={styles.positionCard}>
              <Text style={styles.positionDescription}>{position.description}</Text>
              <CrewMemberPicker
                label={position.label}
                crewMembers={crewMembers}
                selectedMemberId={assignments[position.role]}
                onSelect={(member) => handleAssignment(position.role, member)}
                excludeIds={getExcludedIds(position.role)}
                placeholder={`Select ${position.label.toLowerCase()}`}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  // ---- STEP 3: Meeting Point ----
  const renderMeetingPointStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconBg, { backgroundColor: `${IOS_COLORS.blue}15` }]}>
          <MapPin size={24} color={IOS_COLORS.blue} />
        </View>
        <View style={styles.stepHeaderText}>
          <Text style={styles.stepTitle}>Meeting Point</Text>
          <Text style={styles.stepSubtitle}>Where and when to meet</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.fieldCard}>
        <View style={styles.fieldHeader}>
          <MapPin size={18} color={IOS_COLORS.blue} />
          <Text style={styles.fieldLabel}>LOCATION</Text>
        </View>
        <Pressable
          style={styles.fieldButton}
          onPress={() => setShowLocationPicker(true)}
        >
          {location ? (
            <Text style={styles.fieldValue}>{location.name}</Text>
          ) : (
            <Text style={styles.fieldPlaceholder}>Tap to select location</Text>
          )}
          <ChevronRight size={18} color={IOS_COLORS.gray} />
        </Pressable>
      </View>

      {/* Time */}
      <View style={styles.fieldCard}>
        <View style={styles.fieldHeader}>
          <Clock size={18} color={IOS_COLORS.orange} />
          <Text style={styles.fieldLabel}>TIME</Text>
        </View>
        <Pressable
          style={styles.fieldButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.fieldValue}>{formatTime(meetingTime)}</Text>
          <ChevronRight size={18} color={IOS_COLORS.gray} />
        </Pressable>

        {(showTimePicker || Platform.OS === 'ios') && (
          <View style={styles.timePickerWrap}>
            <DateTimePicker
              value={meetingTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              style={{ height: 120 }}
            />
          </View>
        )}
      </View>

      {/* Notes */}
      <View style={styles.fieldCard}>
        <View style={styles.fieldHeader}>
          <MessageSquare size={18} color={IOS_COLORS.green} />
          <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
        </View>
        <TextInput
          style={styles.notesInput}
          placeholder="e.g., Meet at the main dock entrance"
          placeholderTextColor={IOS_COLORS.gray}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={goToPrevStep}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={IOS_COLORS.blue} />
          <Text style={styles.backText}>{canGoBack ? 'Back' : 'Cancel'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Manage Crew</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Step indicator */}
      {renderStepIndicator()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Loading crew...</Text>
        </View>
      ) : (
        <>
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={18} color={IOS_COLORS.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Step content */}
          {currentStep === 'confirm' && renderConfirmStep()}
          {currentStep === 'positions' && renderPositionsStep()}
          {currentStep === 'meeting_point' && renderMeetingPointStep()}

          {/* Bottom actions */}
          <View style={styles.bottomAction}>
            {isLastStep ? (
              <Pressable
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save & Complete</Text>
                  </>
                )}
              </Pressable>
            ) : (
              <Pressable style={styles.nextButton} onPress={goToNextStep}>
                <Text style={styles.nextButtonText}>Next</Text>
                <ChevronRight size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </>
      )}

      {/* Location Map Picker Modal */}
      <LocationMapPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleLocationSelect}
        initialLocation={location}
        initialName={location?.name}
      />
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
  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    gap: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  stepDot: {
    alignItems: 'center',
    gap: 4,
  },
  stepDotActive: {},
  stepDotActiveFill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.blue,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  stepLabelActive: {
    color: IOS_COLORS.blue,
    fontWeight: '600',
  },
  // Step content
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  stepIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepHeaderText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  stepSubtitle: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  // Crew list
  crewList: {
    gap: 8,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  crewRowConfirmed: {
    backgroundColor: `${IOS_COLORS.green}08`,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.green}30`,
  },
  crewMainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  crewRole: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: IOS_COLORS.separator,
  },
  // Add crew button
  addCrewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.blue}30`,
    borderStyle: 'dashed',
  },
  addCrewButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  // Add crew form
  addFormCard: {
    marginTop: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.blue}30`,
  },
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addFormTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  addFormInput: {
    fontSize: 15,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  roleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
  },
  roleChipActive: {
    backgroundColor: `${IOS_COLORS.blue}15`,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  roleChipTextActive: {
    color: IOS_COLORS.blue,
  },
  addFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.blue,
    gap: 6,
  },
  addFormButtonDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  addFormButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Tips
  tipCard: {
    marginTop: 20,
    backgroundColor: `${IOS_COLORS.blue}08`,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  // Positions
  positionsList: {
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
  // Meeting point fields
  fieldCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.5,
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 10,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    flex: 1,
  },
  fieldPlaceholder: {
    fontSize: 15,
    color: IOS_COLORS.gray,
    flex: 1,
  },
  timePickerWrap: {
    marginTop: 8,
  },
  notesInput: {
    fontSize: 15,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 10,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // Common
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtitle: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 32,
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.blue,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CrewManagementWizard;
