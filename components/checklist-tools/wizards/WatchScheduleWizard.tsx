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
  Modal,
  KeyboardAvoidingView,
  Share,
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
  Settings,
  AlertCircle,
  Plus,
  Minus,
  User,
  UserPlus,
  X,
  Sun,
  Moon,
  Share2,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { crewManagementService, CrewMember, CrewRole } from '@/services/crewManagementService';
import MutationQueueService from '@/services/MutationQueueService';
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

type WatchMode = 'full_24h' | 'night_only';

interface WatchSchedule {
  raceDurationHours: number;
  watchLengthHours: number;
  watches: WatchGroup[];
  watchMode: WatchMode;
  scheduleStartTime?: string;  // When first watch begins (e.g., "10:30")
  nightStartHour?: number;     // For night-only mode (e.g., 18 for 6pm)
  nightEndHour?: number;       // For night-only mode (e.g., 6 for 6am)
  raceDate?: string;           // ISO date for reference
}

interface WatchScheduleWizardProps extends ChecklistToolProps {
  raceStartTime?: string;      // e.g., "10:30"
  raceDate?: string;           // ISO date
  raceDurationHours?: number;  // From time_limit_hours
  raceName?: string;           // For share formatting
}

export function WatchScheduleWizard({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
  raceStartTime,
  raceDate,
  raceDurationHours: propRaceDuration,
  raceName,
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
  const [raceDuration, setRaceDuration] = useState(propRaceDuration || 48); // hours
  const [watchLength, setWatchLength] = useState(4); // hours
  const [numberOfWatches, setNumberOfWatches] = useState(2);

  // Watch mode settings (new)
  const [watchMode, setWatchMode] = useState<WatchMode>('full_24h');
  const [scheduleStartTime, setScheduleStartTime] = useState(raceStartTime || '10:00');
  const [nightStartHour, setNightStartHour] = useState(18); // 6pm
  const [nightEndHour, setNightEndHour] = useState(6); // 6am

  // Watch groups
  const [watches, setWatches] = useState<WatchGroup[]>([
    { id: 'watch-a', name: 'Watch A', color: WATCH_COLORS[0], crewIds: [] },
    { id: 'watch-b', name: 'Watch B', color: WATCH_COLORS[1], crewIds: [] },
  ]);

  // Selected crew for scheduling
  const [selectedCrewIds, setSelectedCrewIds] = useState<Set<string>>(new Set());

  // Add crew modal state
  const [sailorId, setSailorId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [showAddCrewModal, setShowAddCrewModal] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewPosition, setNewCrewPosition] = useState<CrewRole>('other');
  const [isAddingCrew, setIsAddingCrew] = useState(false);

  // View mode state (for existing schedules)
  const [isViewMode, setIsViewMode] = useState(false);

  // Calculate night duration (hours per night)
  const nightDurationHours = useMemo(() => {
    if (nightEndHour > nightStartHour) {
      // Same day (e.g., 18:00 - 22:00)
      return nightEndHour - nightStartHour;
    } else {
      // Crosses midnight (e.g., 18:00 - 06:00)
      return (24 - nightStartHour) + nightEndHour;
    }
  }, [nightStartHour, nightEndHour]);

  // Calculate effective rotation count based on mode
  const effectiveRotations = useMemo(() => {
    if (watchMode === 'night_only') {
      const nightsInRace = Math.ceil(raceDuration / 24);
      const rotationsPerNight = Math.ceil(nightDurationHours / watchLength);
      return nightsInRace * rotationsPerNight;
    }
    return Math.ceil(raceDuration / watchLength);
  }, [watchMode, raceDuration, watchLength, nightDurationHours]);

  // Format hour as time string
  const formatHour = (hour: number) => {
    const h = hour % 24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:00 ${ampm}`;
  };

  // Fetch crew and existing schedule
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Clear any stale crew_members mutations from offline queue
      try {
        await MutationQueueService.clearCollection('crew_members');
      } catch (e) {
        // Ignore errors clearing queue
      }

      try {
        // First, get the sailor profile ID for this user
        const { data: sailorProfile } = await supabase
          .from('sailor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        // crew_members.sailor_id is the auth user ID, not sailor_profiles.id
        // RLS policy: auth.uid() = sailor_id
        setSailorId(user.id);

        // Get a classId for adding new crew members
        let foundClassId: string | null = null;

        // Try to get classId from user's boats
        if (sailorProfile?.id) {
          const { data: boats } = await supabase
            .from('sailor_boats')
            .select('class_id')
            .eq('sailor_id', sailorProfile.id)
            .limit(1)
            .maybeSingle();

          if (boats?.class_id) {
            foundClassId = boats.class_id;
          }
        }

        // If no classId from boats, try from existing crew
        if (!foundClassId) {
          const { data: existingCrew } = await supabase
            .from('crew_members')
            .select('class_id')
            .eq('sailor_id', user.id)
            .limit(1)
            .maybeSingle();

          if (existingCrew?.class_id) {
            foundClassId = existingCrew.class_id;
          }
        }

        // If still no classId, get any boat class as fallback
        if (!foundClassId) {
          const { data: defaultClass } = await supabase
            .from('boat_classes')
            .select('id')
            .limit(1)
            .maybeSingle();

          if (defaultClass?.id) {
            foundClassId = defaultClass.id;
          }
        }

        if (foundClassId) {
          setClassId(foundClassId);
        }

        // Fetch crew using auth user ID (sailor_id in crew_members = auth.uid())
        try {
          const crew = await crewManagementService.getAllCrew(user.id);
          setCrewMembers(crew || []);
        } catch (crewErr) {
          console.error('[WatchScheduleWizard] Error fetching crew:', crewErr);
          setCrewMembers([]);
        }

        // Fetch existing schedule from regattas table
        // Note: raceEventId is actually a regatta ID in this context
        if (raceEventId) {
          const { data } = await supabase
            .from('regattas')
            .select('watch_schedule')
            .eq('id', raceEventId)
            .maybeSingle();

          if (data?.watch_schedule) {
            const schedule = data.watch_schedule as WatchSchedule;
            setRaceDuration(schedule.raceDurationHours || 48);
            setWatchLength(schedule.watchLengthHours || 4);

            // Load new watch mode settings
            if (schedule.watchMode) {
              setWatchMode(schedule.watchMode);
            }
            if (schedule.scheduleStartTime) {
              setScheduleStartTime(schedule.scheduleStartTime);
            }
            if (schedule.nightStartHour !== undefined) {
              setNightStartHour(schedule.nightStartHour);
            }
            if (schedule.nightEndHour !== undefined) {
              setNightEndHour(schedule.nightEndHour);
            }

            const watchesArray = schedule.watches || [];
            if (watchesArray.length > 0) {
              setWatches(watchesArray);
              setNumberOfWatches(watchesArray.length);
            }

            // Pre-select crew that are already assigned
            const assignedIds = new Set<string>();
            watchesArray.forEach((w) => {
              (w.crewIds || []).forEach((id) => assignedIds.add(id));
            });
            setSelectedCrewIds(assignedIds);

            // Show view mode for ANY existing schedule (even without crew assigned)
            setIsViewMode(true);
          }
        }

        setError(null);
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

  // Generate rotation timeline with actual times
  const rotationTimeline = useMemo(() => {
    const timeline: {
      day: number;
      startTime: string;
      endTime: string;
      watchIndex: number;
      watchName: string;
      watchColor: string;
    }[] = [];

    // Parse schedule start time
    const [startHour, startMinute] = (scheduleStartTime || '10:00').split(':').map(Number);

    // Format time helper
    const formatTime = (hour: number, minute: number = 0) => {
      const h = ((hour % 24) + 24) % 24;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
    };

    if (watchMode === 'full_24h') {
      // Continuous 24-hour rotations
      let currentHour = startHour;
      let currentDay = 1;
      let rotationIndex = 0;
      let hoursElapsed = 0;

      while (hoursElapsed < raceDuration) {
        const watchIdx = rotationIndex % watches.length;
        const watch = watches[watchIdx];
        const endHour = currentHour + watchLength;

        timeline.push({
          day: currentDay,
          startTime: formatTime(currentHour, startMinute),
          endTime: formatTime(endHour, startMinute),
          watchIndex: watchIdx,
          watchName: watch?.name || `Watch ${String.fromCharCode(65 + watchIdx)}`,
          watchColor: watch?.color || WATCH_COLORS[watchIdx] || IOS_COLORS.gray,
        });

        currentHour = endHour;
        hoursElapsed += watchLength;
        rotationIndex++;

        // Track day changes
        if (currentHour >= 24) {
          currentHour = currentHour % 24;
          currentDay++;
        }
      }
    } else {
      // Night-only rotations
      const nightsInRace = Math.ceil(raceDuration / 24);
      let rotationIndex = 0;

      for (let night = 0; night < nightsInRace; night++) {
        const day = night + 1;
        let currentHour = nightStartHour;
        let hoursIntoNight = 0;

        while (hoursIntoNight < nightDurationHours) {
          const watchIdx = rotationIndex % watches.length;
          const watch = watches[watchIdx];
          let endHour = currentHour + watchLength;

          // Don't exceed night end
          const remainingNightHours = nightDurationHours - hoursIntoNight;
          const actualWatchLength = Math.min(watchLength, remainingNightHours);
          endHour = currentHour + actualWatchLength;

          timeline.push({
            day,
            startTime: formatTime(currentHour),
            endTime: formatTime(endHour),
            watchIndex: watchIdx,
            watchName: watch?.name || `Watch ${String.fromCharCode(65 + watchIdx)}`,
            watchColor: watch?.color || WATCH_COLORS[watchIdx] || IOS_COLORS.gray,
          });

          currentHour = endHour % 24;
          hoursIntoNight += actualWatchLength;
          rotationIndex++;
        }
      }
    }

    return timeline;
  }, [scheduleStartTime, watchMode, raceDuration, watchLength, watches, nightStartHour, nightDurationHours]);

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
        watchMode,
        scheduleStartTime,
        nightStartHour: watchMode === 'night_only' ? nightStartHour : undefined,
        nightEndHour: watchMode === 'night_only' ? nightEndHour : undefined,
        raceDate,
      };

      console.log('[WatchScheduleWizard] Saving schedule to regatta:', raceEventId, schedule);

      // Save to regattas table (raceEventId is actually a regatta ID)
      const { data: updateData, error: updateError } = await supabase
        .from('regattas')
        .update({ watch_schedule: schedule })
        .eq('id', raceEventId)
        .select('id, watch_schedule');

      if (updateError) {
        console.error('[WatchScheduleWizard] Update error:', updateError);
        throw updateError;
      }

      if (!updateData || updateData.length === 0) {
        console.error('[WatchScheduleWizard] Update returned no rows - RLS may be blocking');
        throw new Error('Unable to save schedule. You may not have permission to update this race.');
      }

      console.log('[WatchScheduleWizard] Save successful:', updateData);
      onComplete();
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [raceDuration, watchLength, watches, watchMode, scheduleStartTime, nightStartHour, nightEndHour, raceDate, raceEventId, onComplete]);

  // Get crew member by ID
  const getCrewMember = useCallback(
    (id: string) => crewMembers.find((m) => m.id === id),
    [crewMembers]
  );

  // Format schedule for sharing
  const formatScheduleForShare = useCallback(() => {
    const title = raceName || 'Watch Schedule';
    const modeText = watchMode === 'night_only'
      ? `Night-Only (${formatHour(nightStartHour)} - ${formatHour(nightEndHour)})`
      : '24-Hour Coverage';

    let text = `⏰ WATCH SCHEDULE - ${title}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Mode: ${modeText}\n`;
    text += `Duration: ${raceDuration} hours | Watch Length: ${watchLength} hours\n`;
    text += `Schedule starts: ${scheduleStartTime}\n\n`;

    // Watch Groups with crew
    text += `👥 WATCH GROUPS\n`;
    watches.forEach((watch) => {
      const crewNames = watch.crewIds
        .map((id) => getCrewMember(id)?.name)
        .filter(Boolean)
        .join(', ');
      text += `• ${watch.name}: ${crewNames || 'No crew assigned'}\n`;
    });

    // Rotation Timeline
    text += `\n📅 ROTATION TIMELINE\n`;

    // Group timeline by day
    const dayGroups: { [key: number]: typeof rotationTimeline } = {};
    rotationTimeline.forEach((rotation) => {
      if (!dayGroups[rotation.day]) {
        dayGroups[rotation.day] = [];
      }
      dayGroups[rotation.day].push(rotation);
    });

    Object.entries(dayGroups).forEach(([day, rotations]) => {
      const dayLabel = watchMode === 'night_only' ? `Night ${day}` : `Day ${day}`;
      text += `\n${dayLabel}:\n`;
      rotations.forEach((rotation) => {
        // Get crew names for this watch
        const watch = watches.find((w) => w.name === rotation.watchName);
        const crewNames = watch?.crewIds
          .map((id) => getCrewMember(id)?.name)
          .filter(Boolean)
          .join(', ') || '';

        const crewInfo = crewNames ? ` (${crewNames})` : '';
        text += `  ${rotation.startTime} - ${rotation.endTime}  ${rotation.watchName}${crewInfo}\n`;
      });
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Total: ${effectiveRotations} rotations\n`;
    if (watchMode === 'night_only') {
      text += `No formal watches during daylight hours`;
    }

    return text;
  }, [raceName, watchMode, nightStartHour, nightEndHour, raceDuration, watchLength, scheduleStartTime, watches, getCrewMember, effectiveRotations, rotationTimeline]);

  // Handle sharing schedule
  const handleShareSchedule = useCallback(async () => {
    try {
      const message = formatScheduleForShare();
      await Share.share({
        message,
        title: `Watch Schedule - ${raceName || 'Race'}`,
      });
    } catch (err) {
      if ((err as Error).message !== 'User did not share') {
        Alert.alert('Share Error', 'Unable to share schedule. Please try again.');
      }
    }
  }, [formatScheduleForShare, raceName]);

  // Handle adding new crew member
  const handleAddCrewMember = useCallback(async () => {
    if (!newCrewName.trim() || !sailorId || !classId) return;

    setIsAddingCrew(true);
    try {
      const newMember = await crewManagementService.addCrewMember(sailorId, classId, {
        name: newCrewName.trim(),
        role: newCrewPosition,
      });

      if (newMember) {
        setCrewMembers((prev) => [...prev, newMember]);
        setNewCrewName('');
        setNewCrewPosition('other');
        setShowAddCrewModal(false);
      }
    } catch (err: any) {
      // Check if it was queued for offline sync
      if (err?.queuedForSync && err?.entity) {
        setCrewMembers((prev) => [...prev, err.entity]);
        setNewCrewName('');
        setNewCrewPosition('other');
        setShowAddCrewModal(false);
      } else {
        console.error('Failed to add crew member:', err);
        setError('Failed to add crew member');
      }
    } finally {
      setIsAddingCrew(false);
    }
  }, [newCrewName, newCrewPosition, sailorId, classId]);

  // Step titles
  const stepTitles = ['Settings', 'Select Crew', 'Assign Watches', 'Review'];

  // Render view mode (existing schedule summary)
  const renderViewMode = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContentInner}
    >
      {/* Schedule Summary Card */}
      <View style={styles.viewModeCard}>
        <View style={styles.viewModeHeader}>
          <Clock size={20} color={IOS_COLORS.blue} />
          <Text style={styles.viewModeTitle}>Schedule Summary</Text>
        </View>
        <View style={styles.viewModeSummaryRow}>
          <Text style={styles.viewModeSummaryLabel}>Watch Mode</Text>
          <View style={styles.viewModeBadge}>
            {watchMode === 'night_only' ? (
              <Moon size={12} color={IOS_COLORS.purple} />
            ) : (
              <Sun size={12} color={IOS_COLORS.orange} />
            )}
            <Text style={styles.viewModeBadgeText}>
              {watchMode === 'night_only' ? 'Night Only' : '24-Hour'}
            </Text>
          </View>
        </View>
        {watchMode === 'night_only' && (
          <View style={styles.viewModeSummaryRow}>
            <Text style={styles.viewModeSummaryLabel}>Night Hours</Text>
            <Text style={styles.viewModeSummaryValue}>
              {formatHour(nightStartHour)} - {formatHour(nightEndHour)}
            </Text>
          </View>
        )}
        <View style={styles.viewModeSummaryRow}>
          <Text style={styles.viewModeSummaryLabel}>Schedule Starts</Text>
          <Text style={styles.viewModeSummaryValue}>{scheduleStartTime}</Text>
        </View>
        <View style={styles.viewModeSummaryRow}>
          <Text style={styles.viewModeSummaryLabel}>Race Duration</Text>
          <Text style={styles.viewModeSummaryValue}>{raceDuration} hours</Text>
        </View>
        <View style={styles.viewModeSummaryRow}>
          <Text style={styles.viewModeSummaryLabel}>Watch Length</Text>
          <Text style={styles.viewModeSummaryValue}>{watchLength} hours</Text>
        </View>
        <View style={[styles.viewModeSummaryRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.viewModeSummaryLabel}>Total Rotations</Text>
          <Text style={styles.viewModeSummaryValue}>{effectiveRotations}</Text>
        </View>
      </View>

      {/* Rotation Timeline */}
      <View style={styles.viewModeCard}>
        <View style={styles.viewModeHeader}>
          <Calendar size={20} color={IOS_COLORS.teal} />
          <Text style={styles.viewModeTitle}>Rotation Timeline</Text>
        </View>
        {(() => {
          // Group timeline by day
          const dayGroups: { [key: number]: typeof rotationTimeline } = {};
          rotationTimeline.forEach((rotation) => {
            if (!dayGroups[rotation.day]) {
              dayGroups[rotation.day] = [];
            }
            dayGroups[rotation.day].push(rotation);
          });

          return Object.entries(dayGroups).map(([day, rotations]) => (
            <View key={day} style={styles.timelineDayGroup}>
              <Text style={styles.timelineDayLabel}>
                {watchMode === 'night_only' ? `Night ${day}` : `Day ${day}`}
              </Text>
              {rotations.map((rotation, idx) => (
                <View key={idx} style={styles.timelineRow}>
                  <Text style={styles.timelineTime}>
                    {rotation.startTime}
                  </Text>
                  <View style={[styles.timelineBar, { backgroundColor: rotation.watchColor }]}>
                    <Text style={styles.timelineBarText}>{rotation.watchName}</Text>
                  </View>
                </View>
              ))}
            </View>
          ));
        })()}
        <View style={styles.timelineNote}>
          <Text style={styles.timelineNoteText}>
            {watchMode === 'night_only'
              ? `No formal watches during daylight hours`
              : `Continuous ${watchLength}h rotations`}
          </Text>
        </View>
      </View>

      {/* Watch Groups */}
      {watches.map((watch) => (
        <View key={watch.id} style={styles.viewModeCard}>
          <View style={[styles.viewModeWatchHeader, { backgroundColor: `${watch.color}15` }]}>
            <View style={[styles.watchGroupDot, { backgroundColor: watch.color }]} />
            <Text style={[styles.viewModeWatchName, { color: watch.color }]}>
              {watch.name}
            </Text>
            <Text style={styles.viewModeCrewCount}>
              {watch.crewIds.length} crew
            </Text>
          </View>
          <View style={styles.viewModeCrewList}>
            {watch.crewIds.length > 0 ? (
              watch.crewIds.map((crewId) => {
                const member = getCrewMember(crewId);
                if (!member) return null;
                return (
                  <View key={crewId} style={styles.viewModeCrewRow}>
                    <View style={[styles.crewAvatar, { backgroundColor: watch.color }]}>
                      <Text style={styles.crewAvatarText}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.viewModeCrewInfo}>
                      <Text style={styles.viewModeCrewName}>{member.name}</Text>
                      <Text style={styles.viewModeCrewRole}>{member.role}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.viewModeEmptyText}>No crew assigned</Text>
            )}
          </View>
        </View>
      ))}

      {/* Share Schedule Button */}
      <Pressable style={styles.shareScheduleButton} onPress={handleShareSchedule}>
        <Share2 size={18} color={IOS_COLORS.blue} />
        <Text style={styles.shareScheduleButtonText}>Share Schedule</Text>
      </Pressable>
    </ScrollView>
  );

  // Render step content
  const renderStepContent = () => {
    // Show view mode for existing schedules
    if (isViewMode) {
      return renderViewMode();
    }

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
      {/* Watch Mode Selector */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Settings size={18} color={IOS_COLORS.purple} />
          <Text style={styles.settingLabel}>WATCH MODE</Text>
        </View>
        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segmentButton,
              watchMode === 'full_24h' && styles.segmentButtonActive,
            ]}
            onPress={() => setWatchMode('full_24h')}
          >
            <Sun size={16} color={watchMode === 'full_24h' ? '#FFFFFF' : IOS_COLORS.blue} />
            <Text style={[
              styles.segmentButtonText,
              watchMode === 'full_24h' && styles.segmentButtonTextActive,
            ]}>24-Hour</Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentButton,
              watchMode === 'night_only' && styles.segmentButtonActive,
            ]}
            onPress={() => setWatchMode('night_only')}
          >
            <Moon size={16} color={watchMode === 'night_only' ? '#FFFFFF' : IOS_COLORS.blue} />
            <Text style={[
              styles.segmentButtonText,
              watchMode === 'night_only' && styles.segmentButtonTextActive,
            ]}>Night Only</Text>
          </Pressable>
        </View>
        <Text style={styles.settingHint}>
          {watchMode === 'full_24h'
            ? 'Watches rotate continuously throughout the race'
            : 'Watches only during night hours (no formal watches during day)'}
        </Text>
      </View>

      {/* Schedule Start Time */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Clock size={18} color={IOS_COLORS.teal} />
          <Text style={styles.settingLabel}>SCHEDULE START TIME</Text>
        </View>
        <View style={styles.timeInputRow}>
          <TextInput
            style={styles.timeInput}
            value={scheduleStartTime}
            onChangeText={setScheduleStartTime}
            placeholder="10:00"
            keyboardType="numbers-and-punctuation"
          />
          {raceStartTime && (
            <Pressable
              style={styles.suggestButton}
              onPress={() => setScheduleStartTime(raceStartTime)}
            >
              <Text style={styles.suggestButtonText}>Use race start ({raceStartTime})</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Night-Only Settings (conditional) */}
      {watchMode === 'night_only' && (
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <Moon size={18} color={IOS_COLORS.purple} />
            <Text style={styles.settingLabel}>NIGHT HOURS</Text>
          </View>
          <View style={styles.nightHoursRow}>
            <View style={styles.nightHourInput}>
              <Text style={styles.nightHourLabel}>Start</Text>
              <View style={styles.settingRow}>
                <Pressable
                  style={styles.stepperButtonSmall}
                  onPress={() => setNightStartHour((h) => (h - 1 + 24) % 24)}
                >
                  <Minus size={14} color={IOS_COLORS.blue} />
                </Pressable>
                <Text style={styles.nightHourValue}>{formatHour(nightStartHour)}</Text>
                <Pressable
                  style={styles.stepperButtonSmall}
                  onPress={() => setNightStartHour((h) => (h + 1) % 24)}
                >
                  <Plus size={14} color={IOS_COLORS.blue} />
                </Pressable>
              </View>
            </View>
            <View style={styles.nightHourInput}>
              <Text style={styles.nightHourLabel}>End</Text>
              <View style={styles.settingRow}>
                <Pressable
                  style={styles.stepperButtonSmall}
                  onPress={() => setNightEndHour((h) => (h - 1 + 24) % 24)}
                >
                  <Minus size={14} color={IOS_COLORS.blue} />
                </Pressable>
                <Text style={styles.nightHourValue}>{formatHour(nightEndHour)}</Text>
                <Pressable
                  style={styles.stepperButtonSmall}
                  onPress={() => setNightEndHour((h) => (h + 1) % 24)}
                >
                  <Plus size={14} color={IOS_COLORS.blue} />
                </Pressable>
              </View>
            </View>
          </View>
          <Text style={styles.settingHint}>
            Night duration: {nightDurationHours} hours per night
          </Text>
        </View>
      )}

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
          {effectiveRotations} watch rotations over {raceDuration} hours
        </Text>
        <Text style={styles.previewText}>
          Each watch: {watchLength} hours on, {watchLength * (numberOfWatches - 1)} hours off
        </Text>
        {watchMode === 'night_only' && (
          <Text style={styles.previewText}>
            Night watches: {formatHour(nightStartHour)} - {formatHour(nightEndHour)}
          </Text>
        )}
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

      {/* Add Crew Member Button */}
      <Pressable
        style={styles.addCrewButton}
        onPress={() => setShowAddCrewModal(true)}
      >
        <UserPlus size={24} color={IOS_COLORS.blue} />
        <Text style={styles.addCrewButtonText}>Add Crew Member</Text>
      </Pressable>

      {crewMembers.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={40} color={IOS_COLORS.gray} />
          <Text style={styles.emptyStateTitle}>No Crew Members</Text>
          <Text style={styles.emptyStateText}>
            Tap the button above to add crew members.
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
          onPress={isViewMode ? onCancel : goBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          {isViewMode ? 'Watch Schedule' : stepTitles[currentStep]}
        </Text>
        {isViewMode ? (
          <View style={styles.headerRight} />
        ) : (
          <Text style={styles.stepIndicator}>
            {currentStep + 1}/{TOTAL_STEPS}
          </Text>
        )}
      </View>

      {/* Progress Bar - hide in view mode */}
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

      {/* Step Content */}
      {renderStepContent()}

      {/* Bottom Actions */}
      <View style={styles.bottomAction}>
        {isViewMode ? (
          <Pressable
            style={styles.editButton}
            onPress={() => setIsViewMode(false)}
          >
            <Settings size={18} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Schedule</Text>
          </Pressable>
        ) : currentStep < TOTAL_STEPS - 1 ? (
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
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowAddCrewModal(false);
                  setNewCrewName('');
                  setNewCrewPosition('other');
                }}
              >
                <X size={24} color={IOS_COLORS.blue} />
              </Pressable>
              <Text style={styles.modalTitle}>Add Crew Member</Text>
              <View style={styles.modalHeaderRight} />
            </View>

            {/* Modal Content */}
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentInner}
              keyboardShouldPersistTaps="handled"
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

              {/* Position Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>POSITION</Text>
                <View style={styles.positionOptions}>
                  {(['helmsman', 'tactician', 'trimmer', 'bowman', 'pit', 'grinder', 'other'] as CrewRole[]).map((role) => (
                    <Pressable
                      key={role}
                      style={[
                        styles.positionOption,
                        newCrewPosition === role && styles.positionOptionSelected,
                      ]}
                      onPress={() => setNewCrewPosition(role)}
                    >
                      <Text
                        style={[
                          styles.positionOptionText,
                          newCrewPosition === role && styles.positionOptionTextSelected,
                        ]}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Bottom Action */}
            <View style={styles.modalBottomAction}>
              <Pressable
                style={[
                  styles.addCrewSubmitButton,
                  (!newCrewName.trim() || isAddingCrew) && styles.addCrewSubmitButtonDisabled,
                ]}
                onPress={handleAddCrewMember}
                disabled={!newCrewName.trim() || isAddingCrew}
              >
                {isAddingCrew ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <UserPlus size={18} color="#FFFFFF" />
                    <Text style={styles.addCrewSubmitButtonText}>Add Crew Member</Text>
                  </>
                )}
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
  // Watch Mode Selector
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.background,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: IOS_COLORS.blue,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  settingHint: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 8,
  },
  // Schedule Start Time
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  suggestButton: {
    backgroundColor: `${IOS_COLORS.teal}15`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.teal,
  },
  // Night Hours Settings
  nightHoursRow: {
    flexDirection: 'row',
    gap: 16,
  },
  nightHourInput: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  nightHourLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  nightHourValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    minWidth: 80,
    textAlign: 'center',
  },
  stepperButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Add Crew Button
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
  textInput: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: IOS_COLORS.label,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
  },
  positionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
  },
  positionOptionSelected: {
    backgroundColor: IOS_COLORS.blue,
    borderColor: IOS_COLORS.blue,
  },
  positionOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  positionOptionTextSelected: {
    color: '#FFFFFF',
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
  // View Mode Styles
  viewModeCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  viewModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  viewModeSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  viewModeSummaryLabel: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  viewModeSummaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  viewModeWatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  viewModeWatchName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  viewModeCrewCount: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  viewModeCrewList: {
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
  viewModeCrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewModeCrewInfo: {
    flex: 1,
  },
  viewModeCrewName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  viewModeCrewRole: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'capitalize',
  },
  viewModeEmptyText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  viewModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewModeBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  shareScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.blue}15`,
    gap: 8,
    marginTop: 8,
  },
  shareScheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  // Edit Button
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
  // Header Right
  headerRight: {
    minWidth: 80,
  },
  // Rotation Timeline Styles
  timelineDayGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  timelineDayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  timelineTime: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    width: 80,
    textAlign: 'right',
  },
  timelineBar: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  timelineBarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timelineNote: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timelineNoteText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
});

export default WatchScheduleWizard;
