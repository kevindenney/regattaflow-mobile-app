/**
 * WatchScheduleWizard
 *
 * A multi-step wizard for creating crew watch schedules for distance racing.
 *
 * Steps:
 * 1. Settings - Race duration, watch length, number of watches
 * 2. Crew Selection - Select crew members for rotation
 * 3. Schedule Builder - Assign crew to watch groups
 * 4. Review - Summary view
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Users,
  Calendar,
  Settings,
  AlertCircle,
  Plus,
  Minus,
  User,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import crewManagementService, { CrewMember } from '@/services/crewManagementService';
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

// Watch group colors
const WATCH_COLORS = [
  IOS_COLORS.blue,
  IOS_COLORS.green,
  IOS_COLORS.orange,
  IOS_COLORS.purple,
];

interface WatchGroup {
  id: string;
  name: string;
  color: string;
  crewIds: string[];
}

interface WatchSchedule {
  raceDurationHours: number;
  watchLengthHours: number;
  watches: WatchGroup[];
}

interface WatchScheduleWizardProps extends ChecklistToolProps {}

export function WatchScheduleWizard({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
}: WatchScheduleWizardProps) {
  const { user } = useAuth();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const TOTAL_STEPS = 4;

  // Data state
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Schedule settings
  const [raceDuration, setRaceDuration] = useState(48); // hours
  const [watchLength, setWatchLength] = useState(4); // hours
  const [numberOfWatches, setNumberOfWatches] = useState(2);

  // Watch groups
  const [watches, setWatches] = useState<WatchGroup[]>([
    { id: 'watch-a', name: 'Watch A', color: WATCH_COLORS[0], crewIds: [] },
    { id: 'watch-b', name: 'Watch B', color: WATCH_COLORS[1], crewIds: [] },
  ]);

  // Selected crew for scheduling
  const [selectedCrewIds, setSelectedCrewIds] = useState<Set<string>>(new Set());

  // Fetch crew and existing schedule
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch crew
        const crew = await crewManagementService.getAllCrew(user.id);
        setCrewMembers(crew);

        // Fetch existing schedule
        if (raceEventId) {
          const { data } = await supabase
            .from('race_events')
            .select('watch_schedule')
            .eq('id', raceEventId)
            .single();

          if (data?.watch_schedule) {
            const schedule = data.watch_schedule as WatchSchedule;
            setRaceDuration(schedule.raceDurationHours);
            setWatchLength(schedule.watchLengthHours);
            setWatches(schedule.watches);
            setNumberOfWatches(schedule.watches.length);

            // Pre-select crew that are already assigned
            const assignedIds = new Set<string>();
            schedule.watches.forEach((w) => {
              w.crewIds.forEach((id) => assignedIds.add(id));
            });
            setSelectedCrewIds(assignedIds);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, raceEventId]);

  // Update number of watches
  const handleWatchCountChange = useCallback((delta: number) => {
    const newCount = Math.max(2, Math.min(4, numberOfWatches + delta));
    setNumberOfWatches(newCount);

    // Add or remove watch groups
    setWatches((prev) => {
      if (newCount > prev.length) {
        // Add new watch
        const newWatch: WatchGroup = {
          id: `watch-${String.fromCharCode(65 + prev.length).toLowerCase()}`,
          name: `Watch ${String.fromCharCode(65 + prev.length)}`,
          color: WATCH_COLORS[prev.length] || IOS_COLORS.gray,
          crewIds: [],
        };
        return [...prev, newWatch];
      } else if (newCount < prev.length) {
        // Remove last watch, redistribute crew
        const removed = prev[prev.length - 1];
        const remaining = prev.slice(0, newCount);
        // Unselect crew from removed watch
        removed.crewIds.forEach((id) => {
          setSelectedCrewIds((s) => {
            const next = new Set(s);
            next.delete(id);
            return next;
          });
        });
        return remaining;
      }
      return prev;
    });
  }, [numberOfWatches]);

  // Toggle crew selection
  const toggleCrewSelection = useCallback((crewId: string) => {
    setSelectedCrewIds((prev) => {
      const next = new Set(prev);
      if (next.has(crewId)) {
        next.delete(crewId);
        // Also remove from any watch group
        setWatches((watches) =>
          watches.map((w) => ({
            ...w,
            crewIds: w.crewIds.filter((id) => id !== crewId),
          }))
        );
      } else {
        next.add(crewId);
      }
      return next;
    });
  }, []);

  // Assign crew to watch
  const assignToWatch = useCallback((crewId: string, watchId: string) => {
    setWatches((prev) =>
      prev.map((w) => {
        if (w.id === watchId) {
          // Add to this watch if not already there
          if (!w.crewIds.includes(crewId)) {
            return { ...w, crewIds: [...w.crewIds, crewId] };
          }
        } else {
          // Remove from other watches
          return { ...w, crewIds: w.crewIds.filter((id) => id !== crewId) };
        }
        return w;
      })
    );
  }, []);

  // Get unassigned crew
  const unassignedCrew = useMemo(() => {
    const assignedIds = new Set<string>();
    watches.forEach((w) => w.crewIds.forEach((id) => assignedIds.add(id)));
    return Array.from(selectedCrewIds).filter((id) => !assignedIds.has(id));
  }, [watches, selectedCrewIds]);

  // Calculate schedule blocks
  const scheduleBlocks = useMemo(() => {
    const blocks: { hour: number; watchIndex: number }[] = [];
    for (let hour = 0; hour < raceDuration; hour += watchLength) {
      blocks.push({
        hour,
        watchIndex: (hour / watchLength) % numberOfWatches,
      });
    }
    return blocks;
  }, [raceDuration, watchLength, numberOfWatches]);

  // Navigate steps
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

  // Save schedule
  const handleSave = useCallback(async () => {
    if (!raceEventId) {
      onComplete();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const schedule: WatchSchedule = {
        raceDurationHours: raceDuration,
        watchLengthHours: watchLength,
        watches,
      };

      const { error: updateError } = await supabase
        .from('race_events')
        .update({ watch_schedule: schedule })
        .eq('id', raceEventId);

      if (updateError) throw updateError;

      onComplete();
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [raceDuration, watchLength, watches, raceEventId, onComplete]);

  // Get crew member by ID
  const getCrewMember = useCallback(
    (id: string) => crewMembers.find((m) => m.id === id),
    [crewMembers]
  );

  // Step titles
  const stepTitles = ['Settings', 'Select Crew', 'Assign Watches', 'Review'];

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderSettingsStep();
      case 1:
        return renderCrewSelectionStep();
      case 2:
        return renderAssignmentStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Step 1: Settings
  const renderSettingsStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContentInner}
    >
      {/* Race Duration */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Clock size={18} color={IOS_COLORS.blue} />
          <Text style={styles.settingLabel}>RACE DURATION</Text>
        </View>
        <View style={styles.settingRow}>
          <Pressable
            style={styles.stepperButton}
            onPress={() => setRaceDuration((d) => Math.max(12, d - 12))}
          >
            <Minus size={18} color={IOS_COLORS.blue} />
          </Pressable>
          <View style={styles.settingValueContainer}>
            <Text style={styles.settingValue}>{raceDuration}</Text>
            <Text style={styles.settingUnit}>hours</Text>
          </View>
          <Pressable
            style={styles.stepperButton}
            onPress={() => setRaceDuration((d) => Math.min(168, d + 12))}
          >
            <Plus size={18} color={IOS_COLORS.blue} />
          </Pressable>
        </View>
      </View>

      {/* Watch Length */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Calendar size={18} color={IOS_COLORS.orange} />
          <Text style={styles.settingLabel}>WATCH LENGTH</Text>
        </View>
        <View style={styles.settingRow}>
          <Pressable
            style={styles.stepperButton}
            onPress={() => setWatchLength((l) => Math.max(2, l - 1))}
          >
            <Minus size={18} color={IOS_COLORS.blue} />
          </Pressable>
          <View style={styles.settingValueContainer}>
            <Text style={styles.settingValue}>{watchLength}</Text>
            <Text style={styles.settingUnit}>hours</Text>
          </View>
          <Pressable
            style={styles.stepperButton}
            onPress={() => setWatchLength((l) => Math.min(8, l + 1))}
          >
            <Plus size={18} color={IOS_COLORS.blue} />
          </Pressable>
        </View>
      </View>

      {/* Number of Watches */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Users size={18} color={IOS_COLORS.green} />
          <Text style={styles.settingLabel}>NUMBER OF WATCHES</Text>
        </View>
        <View style={styles.settingRow}>
          <Pressable
            style={styles.stepperButton}
            onPress={() => handleWatchCountChange(-1)}
          >
            <Minus size={18} color={IOS_COLORS.blue} />
          </Pressable>
          <View style={styles.settingValueContainer}>
            <Text style={styles.settingValue}>{numberOfWatches}</Text>
            <Text style={styles.settingUnit}>watches</Text>
          </View>
          <Pressable
            style={styles.stepperButton}
            onPress={() => handleWatchCountChange(1)}
          >
            <Plus size={18} color={IOS_COLORS.blue} />
          </Pressable>
        </View>
      </View>

      {/* Preview */}
      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Schedule Preview</Text>
        <Text style={styles.previewText}>
          {Math.ceil(raceDuration / watchLength)} watch rotations over {raceDuration} hours
        </Text>
        <Text style={styles.previewText}>
          Each watch: {watchLength} hours on, {watchLength * (numberOfWatches - 1)} hours off
        </Text>
      </View>
    </ScrollView>
  );

  // Step 2: Crew Selection
  const renderCrewSelectionStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContentInner}
    >
      <Text style={styles.stepDescription}>
        Select crew members who will participate in the watch rotation.
      </Text>

      {crewMembers.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={40} color={IOS_COLORS.gray} />
          <Text style={styles.emptyStateTitle}>No Crew Members</Text>
          <Text style={styles.emptyStateText}>
            Add crew members in your boat settings first.
          </Text>
        </View>
      ) : (
        crewMembers.map((member) => {
          const isSelected = selectedCrewIds.has(member.id);
          return (
            <Pressable
              key={member.id}
              style={[styles.crewRow, isSelected && styles.crewRowSelected]}
              onPress={() => toggleCrewSelection(member.id)}
            >
              <View style={styles.crewAvatar}>
                <Text style={styles.crewAvatarText}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.crewInfo}>
                <Text style={styles.crewName}>{member.name}</Text>
                <Text style={styles.crewRole}>{member.role}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Check size={14} color="#FFFFFF" />}
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );

  // Step 3: Assignment
  const renderAssignmentStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContentInner}
    >
      <Text style={styles.stepDescription}>
        Assign crew members to watch groups.
      </Text>

      {/* Watch Groups */}
      {watches.map((watch) => (
        <View key={watch.id} style={styles.watchGroupCard}>
          <View style={[styles.watchGroupHeader, { backgroundColor: `${watch.color}15` }]}>
            <View style={[styles.watchGroupDot, { backgroundColor: watch.color }]} />
            <Text style={[styles.watchGroupName, { color: watch.color }]}>
              {watch.name}
            </Text>
            <Text style={styles.watchGroupCount}>
              {watch.crewIds.length} crew
            </Text>
          </View>

          <View style={styles.watchGroupCrew}>
            {watch.crewIds.map((crewId) => {
              const member = getCrewMember(crewId);
              if (!member) return null;
              return (
                <View key={crewId} style={styles.assignedCrewChip}>
                  <Text style={styles.assignedCrewName}>{member.name}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {/* Unassigned Crew */}
      {unassignedCrew.length > 0 && (
        <View style={styles.unassignedSection}>
          <Text style={styles.unassignedTitle}>Tap to assign:</Text>
          <View style={styles.unassignedList}>
            {unassignedCrew.map((crewId) => {
              const member = getCrewMember(crewId);
              if (!member) return null;
              return (
                <View key={crewId} style={styles.unassignedRow}>
                  <Text style={styles.unassignedName}>{member.name}</Text>
                  <View style={styles.watchButtons}>
                    {watches.map((watch) => (
                      <Pressable
                        key={watch.id}
                        style={[styles.watchButton, { backgroundColor: `${watch.color}15` }]}
                        onPress={() => assignToWatch(crewId, watch.id)}
                      >
                        <Text style={[styles.watchButtonText, { color: watch.color }]}>
                          {watch.name.split(' ')[1]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );

  // Step 4: Review
  const renderReviewStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContentInner}
    >
      <Text style={styles.stepDescription}>
        Review your watch schedule before saving.
      </Text>

      {/* Schedule Summary */}
      <View style={styles.reviewCard}>
        <Text style={styles.reviewCardTitle}>Schedule Summary</Text>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Race Duration</Text>
          <Text style={styles.reviewValue}>{raceDuration} hours</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Watch Length</Text>
          <Text style={styles.reviewValue}>{watchLength} hours</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Rotations</Text>
          <Text style={styles.reviewValue}>
            {Math.ceil(raceDuration / watchLength)}
          </Text>
        </View>
      </View>

      {/* Watch Groups */}
      {watches.map((watch) => (
        <View key={watch.id} style={styles.reviewCard}>
          <View style={styles.reviewWatchHeader}>
            <View style={[styles.watchGroupDot, { backgroundColor: watch.color }]} />
            <Text style={styles.reviewCardTitle}>{watch.name}</Text>
          </View>
          {watch.crewIds.length > 0 ? (
            watch.crewIds.map((crewId) => {
              const member = getCrewMember(crewId);
              if (!member) return null;
              return (
                <View key={crewId} style={styles.reviewCrewRow}>
                  <User size={14} color={IOS_COLORS.gray} />
                  <Text style={styles.reviewCrewName}>{member.name}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.reviewEmpty}>No crew assigned</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );

  // Check if can proceed to next step
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true; // Settings always valid
      case 1:
        return selectedCrewIds.size >= numberOfWatches; // Need at least 1 per watch
      case 2:
        return unassignedCrew.length === 0; // All crew assigned
      case 3:
        return true; // Review always valid
      default:
        return false;
    }
  };

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={goBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={IOS_COLORS.blue} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{stepTitles[currentStep]}</Text>
        <Text style={styles.stepIndicator}>
          {currentStep + 1}/{TOTAL_STEPS}
        </Text>
      </View>

      {/* Progress Bar */}
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

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={18} color={IOS_COLORS.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Step Content */}
      {renderStepContent()}

      {/* Bottom Actions */}
      <View style={styles.bottomAction}>
        {currentStep < TOTAL_STEPS - 1 ? (
          <Pressable
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={goNext}
            disabled={!canProceed()}
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
  // Settings Step
  settingCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.5,
  },
  settingRow: {
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
  settingValueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  settingValue: {
    fontSize: 32,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  settingUnit: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  previewCard: {
    backgroundColor: `${IOS_COLORS.blue}10`,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  previewText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  // Crew Selection Step
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
  emptyStateText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  crewRowSelected: {
    backgroundColor: `${IOS_COLORS.blue}10`,
  },
  crewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  crewRole: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'capitalize',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: IOS_COLORS.blue,
    borderColor: IOS_COLORS.blue,
  },
  // Assignment Step
  watchGroupCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  watchGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  watchGroupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  watchGroupName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  watchGroupCount: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  watchGroupCrew: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
  assignedCrewChip: {
    backgroundColor: IOS_COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assignedCrewName: {
    fontSize: 13,
    color: IOS_COLORS.label,
  },
  unassignedSection: {
    marginTop: 16,
  },
  unassignedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    marginBottom: 8,
  },
  unassignedList: {
    gap: 8,
  },
  unassignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  unassignedName: {
    fontSize: 14,
    color: IOS_COLORS.label,
    flex: 1,
  },
  watchButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  watchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  watchButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Review Step
  reviewCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  reviewCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  reviewWatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  reviewCrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  reviewCrewName: {
    fontSize: 14,
    color: IOS_COLORS.label,
  },
  reviewEmpty: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
  // Bottom Actions
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
});

export default WatchScheduleWizard;
