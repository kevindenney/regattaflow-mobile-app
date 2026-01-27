/**
 * FourPeaksScheduleWizard
 *
 * A multi-step wizard for creating crew schedules for the 4 Peaks race.
 * Handles leg-based scheduling with climbing activities and dynamic crew
 * availability based on climbing and rest requirements.
 *
 * Steps:
 * 1. Setup - Race date, start time, leg durations
 * 2. Crew - Add crew members and assign roles (sailor/climber/both)
 * 3. Peaks - Assign climbers to each of the 4 peaks
 * 4. Review - Review complete schedule with timing
 * 5. Share - Save and share the schedule
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Users,
  Calendar,
  Mountain,
  AlertCircle,
  Plus,
  Minus,
  User,
  UserPlus,
  X,
  Share2,
  Anchor,
  Navigation,
  Edit3,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import {
  FOUR_PEAKS,
  FOUR_PEAKS_DEFAULT_LEGS,
  type FourPeakId,
  type MultiActivityCrewMember,
  type MultiActivitySchedule,
  type FourPeaksWizardFormData,
  formatDuration,
  getActivityColor,
} from '@/types/multiActivitySchedule';
import {
  createMultiActivitySchedule,
  getDefaultFourPeaksFormData,
  createMultiActivityCrewMember,
  formatScheduleForShare,
} from '@/lib/watchSchedule/generateMultiActivitySchedule';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#5856D6',
  teal: '#0D9488',
  gray: '#8E8E93',
  gray2: '#636366',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

// Role colors
const ROLE_COLORS = {
  climber: IOS_COLORS.green,
  sailor: IOS_COLORS.blue,
  both: IOS_COLORS.purple,
};

interface FourPeaksScheduleWizardProps extends ChecklistToolProps {
  raceStartTime?: string;
  raceDate?: string;
  raceName?: string;
}

export function FourPeaksScheduleWizard({
  item,
  regattaId,
  boatId,
  onComplete,
  onCancel,
  raceStartTime,
  raceDate,
  raceName,
}: FourPeaksScheduleWizardProps) {
  const { user } = useAuth();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const TOTAL_STEPS = 5;
  const stepTitles = ['Setup', 'Crew', 'Peak Assignment', 'Review', 'Save & Share'];

  // Loading/saving state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<FourPeaksWizardFormData>(
    getDefaultFourPeaksFormData()
  );

  // Generated schedule
  const [schedule, setSchedule] = useState<MultiActivitySchedule | null>(null);

  // Add crew modal
  const [showAddCrewModal, setShowAddCrewModal] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewRole, setNewCrewRole] = useState<'sailor' | 'climber' | 'both'>('both');

  // View mode for existing schedules
  const [isViewMode, setIsViewMode] = useState(false);

  // Initialize with props
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      // Set defaults from props
      const updates: Partial<FourPeaksWizardFormData> = {};
      if (raceStartTime) {
        updates.raceStartTime = raceStartTime;
      }
      if (raceDate) {
        updates.raceDate = raceDate;
      }

      // Load existing schedule if available
      if (regattaId) {
        try {
          const { data } = await supabase
            .from('regattas')
            .select('multi_activity_schedule, watch_schedule')
            .eq('id', regattaId)
            .maybeSingle();

          if (data?.multi_activity_schedule) {
            const existingSchedule = data.multi_activity_schedule as MultiActivitySchedule;
            setSchedule(existingSchedule);
            setIsViewMode(true);

            // Populate form data from existing schedule
            const startDate = new Date(existingSchedule.raceStart);
            updates.raceStartTime = startDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
            updates.raceDate = existingSchedule.raceStart.split('T')[0];
            updates.crew = existingSchedule.crew;
            updates.watchLengthHours = existingSchedule.watchLengthHours;

            // Reconstruct leg durations
            const legDurations: { [key: number]: number } = {};
            existingSchedule.legs.forEach((leg) => {
              legDurations[leg.legNumber] = leg.estimatedDurationHours;
            });
            updates.legDurations = legDurations;

            // Reconstruct peak assignments
            const peakAssignments: { [key: string]: string[] } = {};
            existingSchedule.climbTasks.forEach((task) => {
              peakAssignments[task.peakId] = task.climbers;
            });
            updates.peakAssignments = peakAssignments;
          }
        } catch (err) {
          console.error('[FourPeaksWizard] Error loading schedule:', err);
        }
      }

      setFormData((prev) => ({ ...prev, ...updates }));
      setIsLoading(false);
    };

    initialize();
  }, [regattaId, raceStartTime, raceDate]);

  // Generate schedule when moving to review step
  useEffect(() => {
    if (currentStep === 3 && !isViewMode) {
      const generated = createMultiActivitySchedule(formData);
      setSchedule(generated);
    }
  }, [currentStep, formData, isViewMode]);

  // Update form data
  const updateFormData = useCallback(
    <K extends keyof FourPeaksWizardFormData>(
      key: K,
      value: FourPeaksWizardFormData[K]
    ) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Update leg duration
  const updateLegDuration = useCallback((legNumber: number, delta: number) => {
    setFormData((prev) => {
      const currentDuration = prev.legDurations[legNumber] || 3;
      const newDuration = Math.max(1, Math.min(12, currentDuration + delta));
      return {
        ...prev,
        legDurations: { ...prev.legDurations, [legNumber]: newDuration },
      };
    });
  }, []);

  // Add crew member
  const handleAddCrew = useCallback(() => {
    if (!newCrewName.trim()) return;

    const newMember = createMultiActivityCrewMember(newCrewName.trim(), newCrewRole);

    setFormData((prev) => ({
      ...prev,
      crew: [...prev.crew, newMember],
    }));

    setNewCrewName('');
    setNewCrewRole('both');
    setShowAddCrewModal(false);
  }, [newCrewName, newCrewRole]);

  // Remove crew member
  const removeCrew = useCallback((crewId: string) => {
    setFormData((prev) => ({
      ...prev,
      crew: prev.crew.filter((c) => c.id !== crewId),
      // Also remove from peak assignments
      peakAssignments: Object.fromEntries(
        Object.entries(prev.peakAssignments).map(([peakId, climbers]) => [
          peakId,
          climbers.filter((id) => id !== crewId),
        ])
      ),
    }));
  }, []);

  // Toggle climber assignment to peak
  const togglePeakAssignment = useCallback((peakId: FourPeakId, crewId: string) => {
    setFormData((prev) => {
      const currentAssigned = prev.peakAssignments[peakId] || [];
      const isAssigned = currentAssigned.includes(crewId);

      return {
        ...prev,
        peakAssignments: {
          ...prev.peakAssignments,
          [peakId]: isAssigned
            ? currentAssigned.filter((id) => id !== crewId)
            : [...currentAssigned, crewId],
        },
      };
    });
  }, []);

  // Get climbers (crew who can climb)
  const climbers = useMemo(
    () => formData.crew.filter((c) => c.multiActivityRole !== 'sailor'),
    [formData.crew]
  );

  // Calculate total estimated time
  const totalEstimatedHours = useMemo(() => {
    const legTotal = Object.values(formData.legDurations).reduce(
      (sum, dur) => sum + dur,
      0
    );
    const climbTotal = FOUR_PEAKS.reduce(
      (sum, peak) => sum + peak.estimatedClimbHours,
      0
    );
    return legTotal + climbTotal;
  }, [formData.legDurations]);

  // Navigation
  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    } else {
      onCancel();
    }
  }, [currentStep, onCancel]);

  // Validation for each step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: // Setup
        return formData.raceStartTime && formData.raceDate;
      case 1: // Crew
        return formData.crew.length >= 2;
      case 2: // Peak Assignment
        // Each peak should have at least one climber
        return FOUR_PEAKS.every(
          (peak) => (formData.peakAssignments[peak.id]?.length || 0) > 0
        );
      case 3: // Review
        return true;
      case 4: // Share
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  // Save schedule
  const handleSave = useCallback(async () => {
    if (!schedule || !regattaId) {
      onComplete();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('regattas')
        .update({ multi_activity_schedule: schedule })
        .eq('id', regattaId);

      if (updateError) throw updateError;

      onComplete();
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  }, [schedule, regattaId, onComplete]);

  // Share schedule
  const handleShare = useCallback(async () => {
    if (!schedule) return;

    try {
      const message = formatScheduleForShare(schedule, raceName);
      const title = `4 Peaks Schedule - ${raceName || 'Race'}`;
      if (Platform.OS === 'web') {
        const nav = typeof navigator !== 'undefined' ? navigator : undefined;
        if (nav?.share) {
          await nav.share({ title, text: message });
        } else if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(message);
          Alert.alert('Copied', 'Schedule copied to clipboard');
        }
      } else {
        const { Share } = await import('react-native');
        await Share.share({ message, title });
      }
    } catch (err) {
      if ((err as Error).message !== 'User did not share') {
        Alert.alert('Share Error', 'Unable to share schedule');
      }
    }
  }, [schedule, raceName]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render step content
  const renderStepContent = () => {
    if (isViewMode && schedule) {
      return renderViewMode();
    }

    switch (currentStep) {
      case 0:
        return renderSetupStep();
      case 1:
        return renderCrewStep();
      case 2:
        return renderPeaksStep();
      case 3:
        return renderReviewStep();
      case 4:
        return renderShareStep();
      default:
        return null;
    }
  };

  // Step 1: Setup
  const renderSetupStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContentInner}
    >
      <Text style={styles.stepDescription}>
        Configure race timing and leg durations for the 4 Peaks race.
      </Text>

      {/* Race Date */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Calendar size={18} color={IOS_COLORS.blue} />
          <Text style={styles.cardLabel}>RACE DATE</Text>
        </View>
        <TextInput
          style={styles.textInput}
          value={formData.raceDate}
          onChangeText={(value) => updateFormData('raceDate', value)}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
      </View>

      {/* Start Time */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Clock size={18} color={IOS_COLORS.teal} />
          <Text style={styles.cardLabel}>START TIME</Text>
        </View>
        <TextInput
          style={styles.textInput}
          value={formData.raceStartTime}
          onChangeText={(value) => updateFormData('raceStartTime', value)}
          placeholder="10:30"
          keyboardType="numbers-and-punctuation"
        />
      </View>

      {/* Watch Length */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Users size={18} color={IOS_COLORS.orange} />
          <Text style={styles.cardLabel}>WATCH LENGTH (for long legs)</Text>
        </View>
        <View style={styles.stepperRow}>
          <Pressable
            style={styles.stepperButton}
            onPress={() =>
              updateFormData(
                'watchLengthHours',
                Math.max(1, formData.watchLengthHours - 1)
              )
            }
          >
            <Minus size={18} color={IOS_COLORS.blue} />
          </Pressable>
          <View style={styles.stepperValue}>
            <Text style={styles.stepperValueText}>{formData.watchLengthHours}</Text>
            <Text style={styles.stepperValueUnit}>hours</Text>
          </View>
          <Pressable
            style={styles.stepperButton}
            onPress={() =>
              updateFormData(
                'watchLengthHours',
                Math.min(4, formData.watchLengthHours + 1)
              )
            }
          >
            <Plus size={18} color={IOS_COLORS.blue} />
          </Pressable>
        </View>
      </View>

      {/* Leg Durations */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Navigation size={18} color={IOS_COLORS.purple} />
          <Text style={styles.cardLabel}>LEG DURATIONS</Text>
        </View>
        {FOUR_PEAKS_DEFAULT_LEGS.map((leg) => (
          <View key={leg.legNumber} style={styles.legRow}>
            <View style={styles.legInfo}>
              <Text style={styles.legName}>Leg {leg.legNumber}</Text>
              <Text style={styles.legRoute}>
                {leg.startLocation} → {leg.endLocation}
              </Text>
            </View>
            <View style={styles.legDuration}>
              <Pressable
                style={styles.stepperButtonSmall}
                onPress={() => updateLegDuration(leg.legNumber, -0.5)}
              >
                <Minus size={14} color={IOS_COLORS.blue} />
              </Pressable>
              <Text style={styles.legDurationText}>
                {formatDuration(formData.legDurations[leg.legNumber] || leg.estimatedDurationHours)}
              </Text>
              <Pressable
                style={styles.stepperButtonSmall}
                onPress={() => updateLegDuration(leg.legNumber, 0.5)}
              >
                <Plus size={14} color={IOS_COLORS.blue} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Estimated Total Duration</Text>
        <Text style={styles.summaryValue}>~{Math.round(totalEstimatedHours)} hours</Text>
        <Text style={styles.summaryNote}>
          Including {FOUR_PEAKS.length} peak climbs
        </Text>
      </View>
    </ScrollView>
  );

  // Step 2: Crew
  const renderCrewStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContentInner}
    >
      <Text style={styles.stepDescription}>
        Add crew members and assign their roles. Climbers will be assigned to
        peaks in the next step.
      </Text>

      {/* Add Crew Button */}
      <Pressable
        style={styles.addCrewButton}
        onPress={() => setShowAddCrewModal(true)}
      >
        <UserPlus size={24} color={IOS_COLORS.blue} />
        <Text style={styles.addCrewButtonText}>Add Crew Member</Text>
      </Pressable>

      {/* Crew List */}
      {formData.crew.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={40} color={IOS_COLORS.gray} />
          <Text style={styles.emptyStateTitle}>No Crew Added</Text>
          <Text style={styles.emptyStateText}>
            Add at least 2 crew members to continue
          </Text>
        </View>
      ) : (
        <View style={styles.crewList}>
          {formData.crew.map((member) => (
            <View key={member.id} style={styles.crewCard}>
              <View style={styles.crewCardLeft}>
                <View
                  style={[
                    styles.crewAvatar,
                    { backgroundColor: ROLE_COLORS[member.multiActivityRole] },
                  ]}
                >
                  <Text style={styles.crewAvatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.crewInfo}>
                  <Text style={styles.crewName}>{member.name}</Text>
                  <View style={styles.crewRoleBadge}>
                    <Text
                      style={[
                        styles.crewRoleText,
                        { color: ROLE_COLORS[member.multiActivityRole] },
                      ]}
                    >
                      {member.multiActivityRole.charAt(0).toUpperCase() +
                        member.multiActivityRole.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
              <Pressable
                style={styles.removeCrewButton}
                onPress={() => removeCrew(member.id)}
              >
                <X size={18} color={IOS_COLORS.red} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Role Legend */}
      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Crew Roles</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ROLE_COLORS.sailor }]} />
          <Text style={styles.legendLabel}>
            Sailor - Always on boat, never climbs
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ROLE_COLORS.climber }]} />
          <Text style={styles.legendLabel}>
            Climber - Primary climbing duties
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ROLE_COLORS.both }]} />
          <Text style={styles.legendLabel}>
            Both - Can sail and climb as needed
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // Step 3: Peak Assignment
  const renderPeaksStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContentInner}
    >
      <Text style={styles.stepDescription}>
        Assign climbers to each peak. Each peak needs at least one climber.
      </Text>

      {climbers.length === 0 ? (
        <View style={styles.warningCard}>
          <AlertCircle size={24} color={IOS_COLORS.orange} />
          <Text style={styles.warningText}>
            No climbers available. Go back and add crew members with Climber or
            Both role.
          </Text>
        </View>
      ) : (
        FOUR_PEAKS.map((peak) => {
          const assigned = formData.peakAssignments[peak.id] || [];
          return (
            <View key={peak.id} style={styles.peakCard}>
              <View style={styles.peakHeader}>
                <Mountain size={20} color={IOS_COLORS.green} />
                <View style={styles.peakInfo}>
                  <Text style={styles.peakName}>{peak.name}</Text>
                  <Text style={styles.peakLocation}>
                    {peak.location} • ~{formatDuration(peak.estimatedClimbHours)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.peakStatus,
                    {
                      backgroundColor:
                        assigned.length > 0
                          ? `${IOS_COLORS.green}20`
                          : `${IOS_COLORS.red}20`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.peakStatusText,
                      { color: assigned.length > 0 ? IOS_COLORS.green : IOS_COLORS.red },
                    ]}
                  >
                    {assigned.length} assigned
                  </Text>
                </View>
              </View>

              <View style={styles.peakClimbers}>
                {climbers.map((member) => {
                  const isAssigned = assigned.includes(member.id);
                  return (
                    <Pressable
                      key={member.id}
                      style={[
                        styles.climberChip,
                        isAssigned && styles.climberChipSelected,
                      ]}
                      onPress={() => togglePeakAssignment(peak.id, member.id)}
                    >
                      <Text
                        style={[
                          styles.climberChipText,
                          isAssigned && styles.climberChipTextSelected,
                        ]}
                      >
                        {member.name}
                      </Text>
                      {isAssigned && <Check size={14} color="#FFFFFF" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  // Step 4: Review
  const renderReviewStep = () => {
    if (!schedule) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Generating schedule...</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.stepContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.stepContentInner}
      >
        <Text style={styles.stepDescription}>
          Review your 4 Peaks schedule before saving.
        </Text>

        {/* Schedule Timeline */}
        {schedule.legs.map((leg, index) => {
          const activity = schedule.activities.find(
            (a) => a.afterLeg === leg.legNumber
          );

          return (
            <View key={leg.id}>
              {/* Leg Card */}
              <View style={styles.timelineCard}>
                <View style={styles.timelineHeader}>
                  <View
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: `${IOS_COLORS.blue}15` },
                    ]}
                  >
                    <Navigation size={16} color={IOS_COLORS.blue} />
                  </View>
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineName}>{leg.name}</Text>
                    <Text style={styles.timelineTime}>
                      {leg.startTime
                        ? new Date(leg.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : ''}{' '}
                      -{' '}
                      {leg.endTime
                        ? new Date(leg.endTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : ''}
                    </Text>
                  </View>
                  <Text style={styles.timelineDuration}>
                    {formatDuration(leg.estimatedDurationHours)}
                  </Text>
                </View>

                {/* Crew for this leg */}
                <View style={styles.timelineCrew}>
                  <Text style={styles.timelineCrewLabel}>On boat:</Text>
                  <Text style={styles.timelineCrewNames}>
                    {schedule.crew
                      .filter((c) => leg.availableCrew.includes(c.id))
                      .map((c) => c.name)
                      .join(', ') || 'All crew'}
                  </Text>
                </View>

                {/* Watch blocks within leg */}
                {leg.watchBlocks && leg.watchBlocks.length > 0 && (
                  <View style={styles.watchBlocksContainer}>
                    <Text style={styles.watchBlocksTitle}>Watch Rotation:</Text>
                    {leg.watchBlocks.map((block, blockIdx) => (
                      <View key={blockIdx} style={styles.watchBlockRow}>
                        <Text style={styles.watchBlockTime}>
                          {new Date(block.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                        <View
                          style={[
                            styles.watchBlockBar,
                            {
                              backgroundColor:
                                block.watch === 'A'
                                  ? IOS_COLORS.blue
                                  : IOS_COLORS.green,
                            },
                          ]}
                        >
                          <Text style={styles.watchBlockCrew}>
                            {block.crew.join(', ')}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Activity Card (Climb) */}
              {activity && (
                <View style={styles.timelineCard}>
                  <View style={styles.timelineHeader}>
                    <View
                      style={[
                        styles.timelineIcon,
                        { backgroundColor: `${IOS_COLORS.green}15` },
                      ]}
                    >
                      <Mountain size={16} color={IOS_COLORS.green} />
                    </View>
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelineName}>{activity.name}</Text>
                      <Text style={styles.timelineTime}>
                        {activity.startTime
                          ? new Date(activity.startTime).toLocaleTimeString(
                              'en-US',
                              { hour: 'numeric', minute: '2-digit' }
                            )
                          : ''}{' '}
                        -{' '}
                        {activity.endTime
                          ? new Date(activity.endTime).toLocaleTimeString(
                              'en-US',
                              { hour: 'numeric', minute: '2-digit' }
                            )
                          : ''}
                      </Text>
                    </View>
                    <Text style={styles.timelineDuration}>
                      {formatDuration(activity.estimatedDurationHours)}
                    </Text>
                  </View>

                  <View style={styles.activityDetails}>
                    <View style={styles.activityRow}>
                      <Text style={styles.activityLabel}>Climbers:</Text>
                      <Text style={styles.activityValue}>
                        {schedule.crew
                          .filter((c) => activity.participants.includes(c.id))
                          .map((c) => c.name)
                          .join(', ')}
                      </Text>
                    </View>
                    <View style={styles.activityRow}>
                      <Text style={styles.activityLabel}>Boat:</Text>
                      <View style={styles.boatStatusBadge}>
                        {activity.boatStatusDuring === 'repositioning' ? (
                          <Navigation size={12} color={IOS_COLORS.purple} />
                        ) : (
                          <Anchor size={12} color={IOS_COLORS.orange} />
                        )}
                        <Text style={styles.boatStatusText}>
                          {activity.boatStatusDuring === 'repositioning'
                            ? 'Repositioning'
                            : 'Hove To'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Climb Tasks */}
                  <View style={styles.climbTasks}>
                    <Text style={styles.climbTasksTitle}>Recording Tasks:</Text>
                    <View style={styles.climbTask}>
                      <View style={styles.climbTaskCheckbox} />
                      <Text style={styles.climbTaskText}>
                        Record departure from boat time
                      </Text>
                    </View>
                    <View style={styles.climbTask}>
                      <View style={styles.climbTaskCheckbox} />
                      <Text style={styles.climbTaskText}>
                        Record time reporting to race control
                      </Text>
                    </View>
                    <View style={styles.climbTask}>
                      <View style={styles.climbTaskCheckbox} />
                      <Text style={styles.climbTaskText}>
                        Record arrival back at boat time
                      </Text>
                    </View>
                    <View style={styles.climbTask}>
                      <View style={styles.climbTaskCheckbox} />
                      <Text style={styles.climbTaskText}>
                        Record total climb time
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // Step 5: Share
  const renderShareStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContentInner}
    >
      <Text style={styles.stepDescription}>
        Save your schedule and share it with your crew.
      </Text>

      <View style={styles.shareCard}>
        <View style={styles.shareIcon}>
          <Check size={40} color={IOS_COLORS.green} />
        </View>
        <Text style={styles.shareTitle}>Schedule Ready!</Text>
        <Text style={styles.shareText}>
          Your 4 Peaks schedule has been generated with {schedule?.legs.length || 0}{' '}
          legs and {schedule?.climbTasks.length || 0} peak climbs.
        </Text>
      </View>

      <Pressable style={styles.shareButton} onPress={handleShare}>
        <Share2 size={20} color={IOS_COLORS.blue} />
        <Text style={styles.shareButtonText}>Share Schedule</Text>
      </Pressable>
    </ScrollView>
  );

  // View mode for existing schedules
  const renderViewMode = () => {
    if (!schedule) return null;

    return (
      <ScrollView
        style={styles.stepContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.stepContentInner}
      >
        {/* Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock size={18} color={IOS_COLORS.blue} />
            <Text style={styles.cardLabel}>SCHEDULE SUMMARY</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Race Start</Text>
            <Text style={styles.summaryRowValue}>
              {new Date(schedule.raceStart).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Total Duration</Text>
            <Text style={styles.summaryRowValue}>
              ~{Math.round(schedule.estimatedDuration)} hours
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Crew</Text>
            <Text style={styles.summaryRowValue}>
              {schedule.crew.length} members
            </Text>
          </View>
          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.summaryRowLabel}>Peaks</Text>
            <Text style={styles.summaryRowValue}>
              {schedule.climbTasks.length} climbs
            </Text>
          </View>
        </View>

        {/* Crew by Role */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Users size={18} color={IOS_COLORS.purple} />
            <Text style={styles.cardLabel}>CREW</Text>
          </View>
          {schedule.crew.map((member) => (
            <View key={member.id} style={styles.crewViewRow}>
              <View
                style={[
                  styles.crewAvatarSmall,
                  { backgroundColor: ROLE_COLORS[member.multiActivityRole] },
                ]}
              >
                <Text style={styles.crewAvatarTextSmall}>
                  {member.name.charAt(0)}
                </Text>
              </View>
              <Text style={styles.crewViewName}>{member.name}</Text>
              <Text
                style={[
                  styles.crewViewRole,
                  { color: ROLE_COLORS[member.multiActivityRole] },
                ]}
              >
                {member.multiActivityRole}
              </Text>
            </View>
          ))}
        </View>

        {/* Peak Assignments */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Mountain size={18} color={IOS_COLORS.green} />
            <Text style={styles.cardLabel}>PEAK ASSIGNMENTS</Text>
          </View>
          {schedule.climbTasks.map((task) => (
            <View key={task.id} style={styles.peakViewRow}>
              <Text style={styles.peakViewName}>{task.peakName}</Text>
              <Text style={styles.peakViewClimbers}>
                {task.climberNames.join(', ')}
              </Text>
            </View>
          ))}
        </View>

        {/* Share Button */}
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Share2 size={20} color={IOS_COLORS.blue} />
          <Text style={styles.shareButtonText}>Share Schedule</Text>
        </Pressable>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={isViewMode ? onCancel : goBack}
        >
          {isViewMode ? (
            <Text style={styles.backText}>Close</Text>
          ) : (
            <>
              <ChevronLeft size={24} color={IOS_COLORS.blue} />
              <Text style={styles.backText}>Back</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.headerTitle}>
          {isViewMode ? '4 Peaks Schedule' : stepTitles[currentStep]}
        </Text>
        {isViewMode ? (
          <View style={styles.headerRight} />
        ) : (
          <Text style={styles.stepIndicator}>
            {currentStep + 1}/{TOTAL_STEPS}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      {!isViewMode && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={18} color={IOS_COLORS.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Content */}
      {renderStepContent()}

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        {isViewMode ? (
          <Pressable
            style={styles.editButton}
            onPress={() => setIsViewMode(false)}
          >
            <Edit3 size={18} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Schedule</Text>
          </Pressable>
        ) : currentStep < TOTAL_STEPS - 1 ? (
          <Pressable
            style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
            onPress={goNext}
            disabled={!canProceed}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </Pressable>
        ) : (
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
                <Text style={styles.saveButtonText}>Save Schedule</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Add Crew Modal */}
      <Modal
        visible={showAddCrewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddCrewModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <View style={styles.modalHeader}>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowAddCrewModal(false);
                  setNewCrewName('');
                  setNewCrewRole('both');
                }}
              >
                <X size={24} color={IOS_COLORS.blue} />
              </Pressable>
              <Text style={styles.modalTitle}>Add Crew Member</Text>
              <View style={styles.modalHeaderRight} />
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentInner}
            >
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCrewName}
                  onChangeText={setNewCrewName}
                  placeholder="Enter crew member name"
                  placeholderTextColor={IOS_COLORS.gray}
                  autoFocus
                />
              </View>

              {/* Role Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ROLE</Text>
                <View style={styles.roleOptions}>
                  {(['sailor', 'climber', 'both'] as const).map((role) => (
                    <Pressable
                      key={role}
                      style={[
                        styles.roleOption,
                        newCrewRole === role && [
                          styles.roleOptionSelected,
                          { borderColor: ROLE_COLORS[role] },
                        ],
                      ]}
                      onPress={() => setNewCrewRole(role)}
                    >
                      <View
                        style={[
                          styles.roleOptionDot,
                          { backgroundColor: ROLE_COLORS[role] },
                        ]}
                      />
                      <Text
                        style={[
                          styles.roleOptionText,
                          newCrewRole === role && {
                            color: ROLE_COLORS[role],
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalBottomAction}>
              <Pressable
                style={[
                  styles.addCrewSubmitButton,
                  !newCrewName.trim() && styles.addCrewSubmitButtonDisabled,
                ]}
                onPress={handleAddCrew}
                disabled={!newCrewName.trim()}
              >
                <UserPlus size={18} color="#FFFFFF" />
                <Text style={styles.addCrewSubmitButtonText}>
                  Add Crew Member
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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
  stepIndicator: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    minWidth: 80,
    textAlign: 'right',
    paddingRight: 8,
  },
  headerRight: {
    minWidth: 80,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  progressBar: {
    height: 4,
    backgroundColor: IOS_COLORS.separator,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 2,
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
  stepContent: {
    flex: 1,
  },
  stepContentInner: {
    padding: 16,
    gap: 16,
  },
  stepDescription: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 8,
  },
  // Card Styles
  card: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: IOS_COLORS.background,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: IOS_COLORS.label,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
  },
  // Stepper Styles
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    alignItems: 'center',
    minWidth: 60,
  },
  stepperValueText: {
    fontSize: 28,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  stepperValueUnit: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  // Leg Styles
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  legInfo: {
    flex: 1,
  },
  legName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  legRoute: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  legDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legDurationText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    minWidth: 45,
    textAlign: 'center',
  },
  // Summary Styles
  summaryCard: {
    backgroundColor: `${IOS_COLORS.blue}10`,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  summaryTitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: IOS_COLORS.blue,
  },
  summaryNote: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  summaryRowLabel: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  summaryRowValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  // Crew Styles
  addCrewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: IOS_COLORS.blue,
    borderStyle: 'dashed',
    padding: 16,
    gap: 10,
  },
  addCrewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptyStateText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
  crewList: {
    gap: 12,
  },
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 12,
  },
  crewCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  crewInfo: {
    gap: 4,
  },
  crewName: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  crewRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crewRoleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeCrewButton: {
    padding: 8,
  },
  // Legend Styles
  legendCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  // Peak Styles
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${IOS_COLORS.orange}15`,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.orange,
  },
  peakCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  peakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  peakInfo: {
    flex: 1,
  },
  peakName: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  peakLocation: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  peakStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  peakStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  peakClimbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  climberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.background,
    gap: 6,
  },
  climberChipSelected: {
    backgroundColor: IOS_COLORS.green,
  },
  climberChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  climberChipTextSelected: {
    color: '#FFFFFF',
  },
  // Timeline Styles
  timelineCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInfo: {
    flex: 1,
  },
  timelineName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  timelineTime: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  timelineDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  timelineCrew: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    gap: 8,
  },
  timelineCrewLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  timelineCrewNames: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
    flex: 1,
  },
  watchBlocksContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    gap: 8,
  },
  watchBlocksTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    marginBottom: 4,
  },
  watchBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  watchBlockTime: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    width: 65,
  },
  watchBlockBar: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  watchBlockCrew: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  activityDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    width: 70,
  },
  activityValue: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
    flex: 1,
  },
  boatStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  boatStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  climbTasks: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    gap: 6,
  },
  climbTasksTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    marginBottom: 4,
  },
  climbTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  climbTaskCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: IOS_COLORS.gray,
  },
  climbTaskText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  // Share Styles
  shareCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  shareIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${IOS_COLORS.green}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  shareText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.blue}15`,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  // View Mode Styles
  crewViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    gap: 10,
  },
  crewAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewAvatarTextSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  crewViewName: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
  },
  crewViewRole: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  peakViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  peakViewName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  peakViewClimbers: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  // Bottom Action
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
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
  nextButtonDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.green,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.orange,
    gap: 8,
  },
  editButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  modalCloseButton: {
    padding: 4,
    minWidth: 60,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  modalHeaderRight: {
    minWidth: 60,
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 16,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.5,
  },
  roleOptions: {
    gap: 10,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  roleOptionSelected: {
    borderWidth: 2,
  },
  roleOptionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  roleOptionText: {
    fontSize: 16,
    color: IOS_COLORS.label,
  },
  modalBottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  addCrewSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.blue,
    gap: 8,
  },
  addCrewSubmitButtonDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  addCrewSubmitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FourPeaksScheduleWizard;
