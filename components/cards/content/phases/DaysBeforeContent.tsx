/**
 * DaysBeforeContent - Days Before Race Phase Content
 *
 * Content shown when selectedPhase === 'days_before'
 * Now uses data-driven checklists based on race type.
 *
 * Includes:
 * - Equipment checklist (including carryover from previous races)
 * - Crew coordination
 * - Weather forecast (multi-day)
 * - Travel/logistics
 * - Race-type-specific items (distance, match, team)
 * - Team collaboration for team racing
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View, Pressable, TouchableOpacity, Modal } from 'react-native';
import { showAlert, showAlertWithButtons } from '@/lib/utils/crossPlatformAlert';
import { router } from 'expo-router';
import {
  Wrench,
  Users,
  CloudSun,
  Car,
  Shield,
  Compass,
  Target,
  BookOpen,
  UserPlus,
  Sailboat,
  ListChecks,
  ExternalLink,
  FileText,
  Sliders,
  X,
} from 'lucide-react-native';

import { CardRaceData } from '../../types';
import { PrepChecklistSection } from '@/components/races/prep/PrepChecklistSection';
import { ToolPopupModal } from '@/components/races/prep/ToolPopupModal';
import { useAcceptedSuggestions } from '@/hooks/useAcceptedSuggestions';
import { AcceptedSuggestionBannerList } from '@/components/races/suggestions/AcceptedSuggestionBanner';
import { useRaceChecklist, ChecklistItemWithState } from '@/hooks/useRaceChecklist';
import { useTeamRaceEntry, useTeamChecklist } from '@/hooks';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { useRegattaContent } from '@/hooks/useRegattaContent';
import { useAuth } from '@/providers/AuthProvider';
import { sailorBoatService, SailorBoat } from '@/services/SailorBoatService';
import { SailInspectionService, type SailWithHealth } from '@/services/SailInspectionService';
import { SailInspectionWizard } from '@/components/sail-inspection';
import { QuickTipsPanel } from '@/components/checklist-tools/QuickTipsPanel';
import {
  SafetyGearWizard,
  RiggingInspectionWizard,
  WatchScheduleWizard,
  ForecastCheckWizard,
  DocumentReviewWizard,
  CourseMapWizard,
  PreRaceBriefingWizard,
  StartPlannerWizard,
  WindShiftStrategyWizard,
  FirstBeatStrategyWizard,
  TideStrategyWizard,
  RigTuningWizard,
  SailSelectionWizard,
  TacticsReviewWizard,
} from '@/components/checklist-tools/wizards';
import { ElectronicsChecklist } from '@/components/checklist-tools/checklists/ElectronicsChecklist';
import { InteractiveChecklist } from '@/components/checklist-tools/InteractiveChecklist';
import { PositionAssignmentPanel, MeetingPointPicker, CrewManagementWizard } from '@/components/checklist-tools/crew';
import { LogisticsPlannerWizard } from '@/components/checklist-tools/logistics/LogisticsPlannerWizard';
import { crewManagementService } from '@/services/crewManagementService';
import { hasTool } from '@/lib/checklists/toolRegistry';
import { CATEGORY_CONFIG, ChecklistCategory } from '@/types/checklists';
import { IOSInsetGroupedSection } from '@/components/ui/ios';
import type { RaceType } from '@/types/raceEvents';
import { getLearningLinks, getLearningBrief, getItemCategory, getLessonLink, getLearningForItem } from '@/data/learningLinks';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useFocusIntentForRace, useDismissFocusIntent } from '@/hooks/useFocusIntent';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { CrossInterestInsight } from '@/components/cards/plan/CrossInterestInsight';
import { FocusConceptPicker } from '@/components/checklist-tools/wizards/FocusConceptPicker';
import type { RaceFocusConcept } from '@/types/raceIntentions';

// Team collaboration components
import {
  TeamSetupCard,
  TeamMembersList,
  TeamInviteModal,
  SharedChecklistItem,
} from '@/components/team';


// Course positioning
import { CoursePositionEditor } from '@/components/races/CoursePositionEditor';
import type { PositionedCourse, CourseType } from '@/types/courses';
import { supabase } from '@/services/supabase';
import { isUuid } from '@/utils/uuid';
import { Map } from 'lucide-react-native';
import { getOpenMeteoService } from '@/services/weather/OpenMeteoService';


// Historical view components
import {
  HistoricalSummaryCard,
  CompletionMeter,
  DataStatement,
  type CategoryProgress,
} from './historical';

import {
  summarizeChecklistCompletions,
  formatForecastSummary,
  formatArrivalTime,
  getForecastEvolution,
  getCompletedItems,
  formatRelativeTime,
  hasPhaseData,
} from '@/lib/historical/transformIntentions';
import { getItemsGroupedByCategory, getCategoriesForPhase } from '@/lib/checklists/checklistConfig';
import { CheckCircle2 } from 'lucide-react-native';
import { CourseMapTile } from '@/components/races/prep/PrepTabTiles';
import { getToolMetadata } from '@/lib/checklists/toolRegistry';
import { CoachingSuggestionTile, CoachSelectionSheet } from '@/components/races/coaching';
import { useSailorActiveCoaches } from '@/hooks/useSailorActiveCoaches';
import { ConditionsBriefCard } from '@/components/races/prep/ConditionsBriefCard';
import { useInterest } from '@/providers/InterestProvider';

/**
 * Convert wind direction in degrees to cardinal direction string
 */
function degreesToCardinal(degrees: number | undefined): string | undefined {
  if (degrees === undefined || !Number.isFinite(degrees)) return undefined;
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
  return directions[index];
}

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  purple: '#5856D6',
  pink: '#FF2D55',
  teal: '#0D9488',
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  separator: '#3C3C434A',
};

// Icon mapping for categories
const CATEGORY_ICONS: Record<ChecklistCategory, React.ComponentType<any>> = {
  equipment: Wrench,
  crew: Users,
  logistics: Car,
  safety: Shield,
  navigation: Compass,
  tactics: Target,
  team_coordination: Users,
  rules: BookOpen,
  weather: CloudSun,
  morning: CloudSun,
  on_water: Compass,
  documents: FileText,
  strategy: Target,
  review: BookOpen,
};

interface DaysBeforeContentProps {
  race: CardRaceData;
  isExpanded?: boolean;
  onSwitchToReview?: () => void;
}

/**
 * Get the race type, defaulting to 'fleet' if not specified
 */
function getRaceType(race: CardRaceData): RaceType {
  return race.race_type || 'fleet';
}

/**
 * NOTE: Legacy ChecklistItem and CategorySection removed — PrepChecklistRow
 * and PrepChecklistSection are now the canonical components.
 */

// Placeholder to keep line references stable for the rest of the file
// (getToolIcon, ChecklistItem, CategorySection all removed)
/**
 * Retrospective Checklist Section - Shows all checklist items with completed/not status
 * Used in historical view to show what was done vs what could have been done
 */
interface RetrospectiveChecklistSectionProps {
  raceType: RaceType;
  phase: 'days_before' | 'race_morning' | 'on_water';
  completions: Record<string, { completedAt: string; notes?: string }> | undefined;
  initialExpanded?: boolean;
}

function RetrospectiveChecklistSection({
  raceType,
  phase,
  completions,
  initialExpanded = true,
}: RetrospectiveChecklistSectionProps) {
  const itemsByCategory = getItemsGroupedByCategory(raceType, phase);
  const categories = getCategoriesForPhase(raceType, phase);

  // Calculate totals
  const allItems = Object.values(itemsByCategory).flat();
  const completedCount = allItems.filter((item) => completions?.[item.id]).length;
  const totalCount = allItems.length;

  if (totalCount === 0) return null;

  return (
    <HistoricalSummaryCard
      icon={ListChecks}
      iconColor={IOS_COLORS.blue}
      title="Preparation Checklist"
      expandable={true}
      initialExpanded={initialExpanded}
      summary={
        <View style={styles.retroSummary}>
          <Text style={styles.retroSummaryText}>
            {completedCount} of {totalCount} items completed
          </Text>
          <View style={styles.retroProgressBar}>
            <View
              style={[
                styles.retroProgressFill,
                { width: `${(completedCount / totalCount) * 100}%` },
              ]}
            />
          </View>
        </View>
      }
      details={
        <View style={styles.retroDetailsList}>
          {categories.map((category) => {
            const items = itemsByCategory[category];
            if (!items || items.length === 0) return null;
            const config = CATEGORY_CONFIG[category];
            const IconComponent = CATEGORY_ICONS[category] || Wrench;
            const categoryCompletedCount = items.filter(
              (item) => completions?.[item.id]
            ).length;

            return (
              <View key={category} style={styles.retroCategory}>
                <View style={styles.retroCategoryHeader}>
                  <IconComponent size={14} color={config.color} />
                  <Text style={styles.retroCategoryLabel}>{config.label}</Text>
                  <Text style={styles.retroCategoryCount}>
                    {categoryCompletedCount}/{items.length}
                  </Text>
                </View>
                <View style={styles.retroItemsList}>
                  {items.map((item) => {
                    const isCompleted = !!completions?.[item.id];
                    return (
                      <View key={item.id} style={styles.retroItem}>
                        <View
                          style={[
                            styles.retroCheckbox,
                            isCompleted && styles.retroCheckboxDone,
                          ]}
                        >
                          {isCompleted && (
                            <Text style={styles.retroCheckmark}>✓</Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.retroItemLabel,
                            !isCompleted && styles.retroItemLabelNotDone,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      }
    />
  );
}

// TileSection removed - replaced by PrepChecklistSection

export function DaysBeforeContent({
  race,
  isExpanded = true,
  onSwitchToReview,
}: DaysBeforeContentProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const { currentInterest } = useInterest();
  const raceType = getRaceType(race);
  const isTeamRace = raceType === 'team';

  // User settings for quick tips/learning visibility
  const { settings: userSettings } = useUserSettings();

  // Accepted follower suggestions for inline banners
  const { forCategory: acceptedForCategory, dismissSuggestion } = useAcceptedSuggestions(race.id);

  // Focus intent for this race (set from a previous race's review)
  const { focusIntent } = useFocusIntentForRace(race.id);
  const { dismiss: dismissFocusIntent, isPending: isDismissingFocus } = useDismissFocusIntent();

  // Cross-interest AI suggestions
  const {
    suggestions: aiSuggestions,
    applySuggestion,
    dismissSuggestion: dismissAISuggestion,
    saveSuggestion,
    hasSuggestions: hasAISuggestions,
  } = useAISuggestions();

  // State for team invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);

  // State for coach selection sheet
  const [showCoachSheet, setShowCoachSheet] = useState(false);

  // Active coaches for coaching suggestion tile
  const {
    hasCoach,
    primaryCoach,
    activeCoaches,
  } = useSailorActiveCoaches({
    raceBoatClass: race.boatClass,
    phase: 'prep',
  });

  // State for sail inspection
  const [showSailInspection, setShowSailInspection] = useState(false);
  const [showSailPicker, setShowSailPicker] = useState(false);
  const [userBoat, setUserBoat] = useState<SailorBoat | null>(null);
  const [crewNames, setCrewNames] = useState<string[]>([]);
  const [boatSails, setBoatSails] = useState<SailWithHealth[]>([]);
  const [selectedSail, setSelectedSail] = useState<SailWithHealth | null>(null);
  const [loadingSails, setLoadingSails] = useState(false);

  // State for generic tool launcher
  const [activeTool, setActiveTool] = useState<ChecklistItemWithState | null>(null);

  // State for learning tooltip
  const [tooltipItem, setTooltipItem] = useState<ChecklistItemWithState | null>(null);

  // State for Focus Concept Picker
  const [showFocusConceptPicker, setShowFocusConceptPicker] = useState(false);

  // Build venue object from race data for weather fetching (same as RaceMorningContent)
  // The race may have venueCoordinates (from useEnrichedRaces) or coordinates in metadata
  const venueCoordinates = (race as any).venueCoordinates;
  const venueName = race.venue || 'Racing Area';
  const venueId = (race as any).venue_id || race.id;

  // Also check metadata for coordinates (start_coordinates, venue_coordinates, etc.)
  const metadata = (race as any).metadata || {};
  const metadataCoords = metadata.start_coordinates || metadata.venue_coordinates || metadata.racing_area_coordinates;

  // Also check for direct latitude/longitude fields (used by demo races)
  const directCoords = (race as any).latitude != null && (race as any).longitude != null
    ? { lat: Number((race as any).latitude), lng: Number((race as any).longitude) }
    : null;

  // Priority: venueCoordinates (enriched) > metadataCoords > directCoords (demo/fallback)
  const coords = venueCoordinates || metadataCoords || directCoords;

  // Memoize location object for CoursePositionEditor to prevent unnecessary re-renders
  const memoizedLocation = useMemo(() =>
    coords ? { lat: coords.lat, lng: coords.lng } : undefined,
    [coords?.lat, coords?.lng]
  );

  // Create a minimal venue object that the weather services can use
  const venueForForecast = coords ? {
    id: venueId,
    name: venueName,
    coordinates: {
      lat: coords.lat,
      lng: coords.lng,
    },
    coordinates_lat: String(coords.lat),
    coordinates_lng: String(coords.lng),
  } as any : null;

  // Fetch user's primary boat for sail inspection on mount (not on every tab focus)
  // Note: sailor_boats.sailor_id = auth.uid() (user.id), not sailor_profiles.id
  useEffect(() => {
    const fetchUserBoat = async () => {
      if (!user?.id) return;

      try {
        // Get boats for this user (ordered by is_primary)
        // sailor_boats uses user.id as sailor_id (matches auth.uid() in RLS)
        const boats = await sailorBoatService.listBoatsForSailor(user.id);
        if (boats.length > 0) {
          setUserBoat(boats[0]); // First one is primary
        } else {
          setUserBoat(null); // Clear if no boats found
        }
      } catch (error) {
        console.error('[DaysBeforeContent] Failed to fetch user boat:', error);
        setUserBoat(null);
      }
    };

    fetchUserBoat();
  }, [user?.id]);

  // Fetch crew member names for the tile display
  useEffect(() => {
    const fetchCrew = async () => {
      if (!user?.id) return;
      try {
        const crew = await crewManagementService.getAllCrew(user.id);
        setCrewNames(crew.filter((c) => c.status === 'active').map((c) => c.name));
      } catch {
        // Silently fail - tile will just show progress
      }
    };
    fetchCrew();
  }, [user?.id]);

  // State for fetched weather forecast at race time
  const [forecastWind, setForecastWind] = useState<{ direction: number; speed: number } | null>(null);

  // Fetch weather forecast for race start time using OpenMeteo
  useEffect(() => {
    if (!coords) {
      setForecastWind(null);
      return;
    }

    // Construct proper Date from race.date and race.startTime
    // race.start_time might be a full ISO string or undefined
    // race.date is the date (e.g., "2026-02-10")
    // race.startTime is the time (e.g., "14:00")
    let targetTime: Date | null = null;

    // Try race.start_time first (if it's a full ISO timestamp)
    if (race.start_time && typeof race.start_time === 'string') {
      const parsed = new Date(race.start_time);
      if (!isNaN(parsed.getTime())) {
        targetTime = parsed;
      }
    }

    // Fall back to combining race.date and race.startTime
    if (!targetTime && race.date && race.startTime) {
      const dateOnly = race.date.split('T')[0];
      const combined = `${dateOnly}T${race.startTime}:00`;
      const parsed = new Date(combined);
      if (!isNaN(parsed.getTime())) {
        targetTime = parsed;
      }
    }

    if (!targetTime) {
      console.debug('[DaysBeforeContent] Could not construct target time from race data:', {
        start_time: race.start_time,
        date: race.date,
        startTime: race.startTime,
      });
      setForecastWind(null);
      return;
    }

    let cancelled = false;

    const fetchForecast = async () => {
      try {
        const openMeteo = getOpenMeteoService();

        // Only fetch if race is within the forecast window (16 days)
        const now = new Date();
        const daysAhead = (targetTime!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (daysAhead > 16 || daysAhead < 0) {
          // Race is too far ahead or in the past - skip forecast
          console.debug('[DaysBeforeContent] Race outside forecast window:', { daysAhead });
          return;
        }

        console.debug('[DaysBeforeContent] Fetching forecast for:', {
          coords,
          targetTime: targetTime!.toISOString(),
        });

        const weather = await openMeteo.getWeatherAtTime(
          { latitude: coords.lat, longitude: coords.lng },
          targetTime!
        );

        if (!cancelled && weather) {
          console.debug('[DaysBeforeContent] Forecast received:', {
            windDirection: weather.wind.direction,
            windSpeed: weather.wind.speed,
          });
          setForecastWind({
            direction: weather.wind.direction,
            speed: weather.wind.speed,
          });
        }
      } catch (error) {
        console.debug('[DaysBeforeContent] Could not fetch forecast for race time:', error);
      }
    };

    fetchForecast();

    return () => {
      cancelled = true;
    };
  }, [coords?.lat, coords?.lng, race.start_time, race.date, race.startTime]);

  // Check if this is a demo race (no carryover for demo races)
  const isDemo = race.isDemo === true;

  // Use the data-driven checklist hook (for non-team or fallback)
  const {
    itemsByCategory,
    categories,
    completedCount,
    totalCount,
    progress,
    toggleItem,
    completeItem,
    uncompleteItem,
    completions,
    isInitialLoading,
    hasData,
  } = useRaceChecklist({
    regattaId: race.id,
    raceName: race.name,
    raceType,
    phase: 'days_before',
    includeCarryover: !isDemo, // Don't include carryover for demo races
  });

  // Progressive disclosure: on a brand-new race with zero progress, collapse
  // non-primary sections so the user isn't faced with a wall of 0/X rows. The
  // first section (Race Intel) stays expanded as the "start here" anchor.
  // Once *any* item is completed, PrepChecklistSection auto-expands itself.
  const isFreshRace = completedCount === 0 && totalCount > 0;

  // Get items that have tools (computed from the actual items)
  const actionItems = useMemo(() => {
    const allItems = Object.values(itemsByCategory).flat();
    const itemsWithTools = allItems.filter(item => hasTool(item));
    return itemsWithTools.map(item => item.id);
  }, [itemsByCategory]);

  // Fetch sails for the boat and show picker or inspection
  const handleSailsAction = useCallback(async () => {
    if (!userBoat) {
      showAlertWithButtons(
        'Add a Boat First',
        'To inspect your sails, you need to add a boat to your profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Boat', onPress: () => router.push('/boat/add') },
        ]
      );
      return;
    }

    setLoadingSails(true);
    try {
      const sails = await SailInspectionService.getSailInventory(userBoat.id);
      setBoatSails(sails);

      if (sails.length === 0) {
        showAlertWithButtons(
          'No Sails Found',
          'Add sails to your boat to start inspecting them.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Sail', onPress: () => router.push(`/boat/${userBoat.id}`) },
          ]
        );
      } else if (sails.length === 1) {
        // Single sail - go directly to inspection
        setSelectedSail(sails[0]);
        setShowSailInspection(true);
      } else {
        // Multiple sails - show picker
        setShowSailPicker(true);
      }
    } catch (error) {
      console.error('[DaysBeforeContent] Failed to fetch sails:', error);
      showAlert('Error', 'Failed to load your sails. Please try again.');
    } finally {
      setLoadingSails(false);
    }
  }, [userBoat]);

  // Handle sail selection from picker
  const handleSailSelect = useCallback((sail: SailWithHealth) => {
    setSelectedSail(sail);
    setShowSailPicker(false);
    setShowSailInspection(true);
  }, []);

  // Handle checklist item actions (launch tools)
  const handleItemAction = useCallback((itemId: string) => {
    // Special handling for sails - requires boat and sails
    if (itemId === 'sails') {
      handleSailsAction();
      return;
    }

    // Find the item and launch its tool
    const allItems = Object.values(itemsByCategory).flat();
    const item = allItems.find((i) => i.id === itemId);
    if (item && hasTool(item)) {
      setActiveTool(item);
    }
  }, [userBoat, itemsByCategory]);

  // Handle tool completion
  const handleToolComplete = useCallback(() => {
    if (activeTool) {
      // Use completeItem (not toggleItem) to ensure the item is marked done
      completeItem(activeTool.id);
      // If this is the sail tool, also complete the sibling sail item ID
      if (activeTool.id === 'sails' || activeTool.id === 'select_sails') {
        completeItem('sails');
        completeItem('select_sails');
      }
    }
    setActiveTool(null);
  }, [activeTool, completeItem]);

  // Handle tool cancellation
  const handleToolCancel = useCallback(() => {
    console.log('[DaysBeforeContent] handleToolCancel called — setting activeTool=null (will unmount wizard)');
    setActiveTool(null);
  }, []);

  // Handle learning module press - navigate to the correct course with specific lesson
  const handleLearnPress = useCallback((item: ChecklistItemWithState) => {
    // Get lesson link info (lessonId + courseSlug) from registry for deep-linking
    const lessonLink = getLessonLink(item.id);
    const academyLinks = getLearningLinks(item.id);
    const category = getItemCategory(item.id) || item.category;

    // Map category to module ID in Race Preparation Mastery course (fallback)
    const categoryToModule: Record<string, string> = {
      weather: 'module-13-1',      // Weather & Conditions
      tactics: 'module-13-2',      // Tactical Planning
      equipment: 'module-13-3',    // Equipment & Rigging
      rules: 'module-13-4',        // Rules & Documents
      documents: 'module-13-4',    // Rules & Documents (documents fall under rules)
      safety: 'module-13-3',       // Safety is part of Equipment & Rigging
      crew: 'module-13-2',         // Crew coordination is part of Tactical Planning
      rig: 'module-13-3',          // Rig tuning is Equipment & Rigging
    };

    const moduleId = categoryToModule[category || ''] || 'module-13-1';

    // Navigate directly to lesson player if we have a lesson link, otherwise go to course overview
    if (lessonLink) {
      router.push({
        pathname: '/(tabs)/learn/[courseId]/player',
        params: { courseId: lessonLink.courseSlug, lessonId: lessonLink.lessonId },
      });
    } else {
      // Fallback to course overview
      const courseId = academyLinks?.courseId || 'race-preparation-mastery';
      router.push({
        pathname: `/(tabs)/learn/${courseId}` as any,
        params: { moduleId },
      });
    }
  }, []);

  // Handle long-press tooltip (show quick learning brief)
  const handleShowTooltip = useCallback((item: ChecklistItemWithState) => {
    setTooltipItem(item);
  }, []);

  // Handle sail inspection completion
  const handleSailInspectionComplete = useCallback(() => {
    setShowSailInspection(false);
    setSelectedSail(null);
    // Mark the sails item as completed
    toggleItem('sails');
  }, [toggleItem]);

  // Team race entry hook (only active for team racing)
  const {
    teamEntry,
    members,
    isTeamMember,
    isTeamCreator,
    inviteCode,
    inviteLink,
    createTeamEntry,
    generateInviteCode,
    joinTeam,
    isLoading: isTeamLoading,
    isCreating,
    isJoining,
    error: teamError,
  } = useTeamRaceEntry({
    raceEventId: race.id,
    raceType,
  });

  // Team checklist hook (only active when team entry exists)
  const {
    items: teamItems,
    completedCount: teamCompletedCount,
    totalCount: teamTotalCount,
    progress: teamProgress,
    toggleItem: teamToggleItem,
    isLoading: isTeamChecklistLoading,
    isSyncing,
  } = useTeamChecklist({
    teamEntryId: teamEntry?.id || null,
    raceType,
    phase: 'days_before',
  });

  // Race preparation data (for historical view, rig tuning persistence, and briefing wizard)
  const {
    intentions,
    isLoading: isPreparationLoading,
    updateStrategyNote,
    updateRigIntentions,
    updateIntentions,
    save: savePreparation,
    isSaving,
    hasPendingChanges,
    lastSavedAt,
  } = useRacePreparation({
    regattaId: race.id,
  });

  // Derive existingIntention for RigTuningWizard from intentions.rigIntentions
  // Converts from RigIntentions format to RigTuningIntention format
  const rigTuningExistingIntention = useMemo(() => {
    if (!intentions?.rigIntentions) return undefined;

    const { settings, overallNotes } = intentions.rigIntentions;

    // Convert RigIntentions.settings (Record<string, { status, value, notes }>)
    // to RigTuningIntention.plannedSettings (Record<string, string>)
    const plannedSettings: Record<string, string> = {};
    if (settings) {
      Object.entries(settings).forEach(([key, setting]) => {
        if (setting.status === 'adjusted' && setting.value) {
          plannedSettings[key] = setting.value;
        }
      });
    }

    return {
      recommendations: [],
      conditionsSummary: '',
      userNotes: overallNotes || '',
      plannedSettings,
      savedAt: intentions.updatedAt || new Date().toISOString(),
    };
  }, [intentions?.rigIntentions, intentions?.updatedAt]);

  // Regatta content for fleet sharing and displaying copied tuning settings
  const { content: regattaContent, savePreRaceContent } = useRegattaContent({
    regattaId: race.id,
  });

  // Format strategy notes into a shareable summary for fleet
  const formatStrategyForSharing = useCallback((strategyNotes: Record<string, string>): string => {
    const parts: string[] = [];

    // Start strategy
    const startNotes = [strategyNotes['start.lineBias'], strategyNotes['start.favoredEnd'], strategyNotes['start.timingApproach']]
      .filter(Boolean);
    if (startNotes.length > 0) {
      parts.push(`Start: ${startNotes.join(' | ')}`);
    }

    // First beat strategy
    const upwindNotes = [strategyNotes['upwind.favoredTack'], strategyNotes['upwind.shiftStrategy'], strategyNotes['upwind.laylineApproach']]
      .filter(Boolean);
    if (upwindNotes.length > 0) {
      parts.push(`First Beat: ${upwindNotes.join(' | ')}`);
    }

    // Tide strategy
    const tideNotes = [strategyNotes['tide.flow'], strategyNotes['tide.favoredSide']]
      .filter(Boolean);
    if (tideNotes.length > 0) {
      parts.push(`Tide: ${tideNotes.join(' | ')}`);
    }

    // Wind shift strategy
    const windNotes = [strategyNotes['upwind.shiftStrategy'], strategyNotes['wind.thermal']]
      .filter(Boolean);
    if (windNotes.length > 0 && !parts.some(p => p.includes('shift'))) {
      parts.push(`Wind: ${windNotes.join(' | ')}`);
    }

    return parts.join('\n');
  }, []);

  // Handler to capture strategy data from wizards and save to intentions
  const handleStrategyCapture = useCallback((strategyData: Record<string, string>) => {
    // Update local strategy notes
    Object.entries(strategyData).forEach(([key, value]) => {
      if (value) {
        updateStrategyNote(key, value);
      }
    });

    // Sync formatted strategy to fleet (merged with existing notes)
    const mergedNotes = {
      ...(intentions?.strategyNotes || {}),
      ...strategyData,
    };
    const formattedSummary = formatStrategyForSharing(mergedNotes);
    if (formattedSummary) {
      savePreRaceContent({
        prepNotes: formattedSummary,
        contentVisibility: 'fleet',
      });
    }
  }, [updateStrategyNote, intentions?.strategyNotes, formatStrategyForSharing, savePreRaceContent]);

  // Handler to save focus concepts from the picker
  const handleSaveFocusConcepts = useCallback(
    (concepts: RaceFocusConcept[]) => {
      updateIntentions({ raceFocusConcepts: concepts });
    },
    [updateIntentions]
  );

  // Course positioning state
  const [showCoursePositionEditor, setShowCoursePositionEditor] = useState(false);
  const [positionedCourse, setPositionedCourse] = useState<PositionedCourse | null>(null);
  const [positionedCourseLoading, setPositionedCourseLoading] = useState(false);

  // Fetch positioned course if available
  useEffect(() => {
    async function fetchPositionedCourse() {
      // Skip query for demo races or invalid UUIDs to prevent 400 errors
      if (!race.id || !isUuid(race.id)) {
        setPositionedCourseLoading(false);
        return;
      }

      setPositionedCourseLoading(true);
      try {
        // Fetch positioned course for this regatta
        const { data, error } = await supabase
          .from('race_positioned_courses')
          .select('*')
          .eq('regatta_id', race.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          // Log the error for debugging
          console.error('[DaysBeforeContent] Error fetching positioned course:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            raceId: race.id,
          });
          setPositionedCourse(null);
        } else if (data) {
          // Convert database format to PositionedCourse
          setPositionedCourse({
            id: data.id,
            regattaId: data.regatta_id,
            sourceDocumentId: data.source_document_id,
            userId: data.user_id,
            courseType: data.course_type as CourseType,
            marks: data.marks || [],
            startLine: {
              pin: { lat: data.start_pin_lat, lng: data.start_pin_lng },
              committee: { lat: data.start_committee_lat, lng: data.start_committee_lng },
            },
            windDirection: data.wind_direction,
            legLengthNm: parseFloat(data.leg_length_nm),
            startLineLengthM: data.start_line_length_m ? parseFloat(data.start_line_length_m) : 100,
            hasManualAdjustments: data.has_manual_adjustments,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        } else {
          // No positioned course found - try to auto-generate from metadata if course type is specified
          const metadataCourseType = metadata?.course_type;
          if (metadataCourseType && coords) {
            try {
              const { CoursePositioningService } = await import('@/services/CoursePositioningService');
              const courseTypeMap: Record<string, CourseType> = {
                'windward/leeward': 'windward_leeward',
                'windward_leeward': 'windward_leeward',
                'windward-leeward': 'windward_leeward',
                'triangle': 'triangle',
                'olympic': 'olympic',
                'trapezoid': 'trapezoid',
              };
              const courseType = courseTypeMap[metadataCourseType.toLowerCase()] || 'windward_leeward';

              // Use forecast wind direction if available, otherwise default to 225 (SW)
              const defaultWindDir = 225;
              const generatedCourse = CoursePositioningService.calculatePositionedCourse({
                startLineCenter: { lat: coords.lat, lng: coords.lng },
                courseType,
                windDirection: defaultWindDir,
                legLengthNm: 0.5, // Default leg length
              });

              // Validate generated marks have valid coordinates
              const validMarks = generatedCourse.marks.filter(
                mark => Number.isFinite(mark.latitude) && Number.isFinite(mark.longitude)
              );

              // Validate startLine coordinates
              const startLine = generatedCourse.startLine;
              const validStartLine = startLine &&
                Number.isFinite(startLine.pin?.lat) &&
                Number.isFinite(startLine.pin?.lng) &&
                Number.isFinite(startLine.committee?.lat) &&
                Number.isFinite(startLine.committee?.lng);

              if (validMarks.length > 0 && validStartLine) {
                setPositionedCourse({
                  id: 'auto-generated',
                  regattaId: race.id,
                  userId: '',
                  courseType,
                  marks: validMarks,
                  startLine,
                  windDirection: defaultWindDir,
                  legLengthNm: 0.5,
                  startLineLengthM: 100,
                  hasManualAdjustments: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                console.debug('[DaysBeforeContent] Auto-generated course from metadata:', courseType);
              } else {
                setPositionedCourse(null);
              }
            } catch (err) {
              console.debug('[DaysBeforeContent] Could not auto-generate course:', err);
              setPositionedCourse(null);
            }
          } else {
            setPositionedCourse(null);
          }
        }
      } catch (err) {
        console.error('[DaysBeforeContent] Exception fetching positioned course:', err);
        setPositionedCourse(null);
      } finally {
        setPositionedCourseLoading(false);
      }
    }

    fetchPositionedCourse();
  }, [race.id, metadata?.course_type, coords?.lat, coords?.lng]);

  // ========================================================================
  // TILE PREVIEW DATA
  // ========================================================================

  // Briefing: collect document names from checklist items
  const briefingDocNames = useMemo(() => {
    const docItemMap: Record<string, string> = {
      'review_nor': 'NOR',
      'nor_review': 'NOR',
      'review_si': 'SI',
      'si_review': 'SI',
      'amendments_check': 'Amendments',
      'pre_race_briefing': 'Race Briefing',
    };
    const allItems = Object.values(itemsByCategory).flat();
    const names: string[] = [];
    const seen = new Set<string>();
    for (const [id, label] of Object.entries(docItemMap)) {
      if (allItems.some(i => i.id === id) && !seen.has(label)) {
        seen.add(label);
        names.push(label);
      }
    }
    return names;
  }, [itemsByCategory]);

  // Weather: extract sparkline data from latest forecast snapshot
  const weatherSparklines = useMemo(() => {
    const snapshots = intentions?.forecastCheck?.snapshots;
    if (!snapshots || snapshots.length === 0) return null;
    const latest = snapshots[snapshots.length - 1];
    const windData = latest.windForecast?.map(d => d.value) || [];
    const tideData = latest.tideForecast?.map(d => d.value) || [];
    // Build tide label from high/low tide times
    let tideLabel: string | undefined;
    if (latest.highTide) {
      tideLabel = `HW ${latest.highTide.time}`;
    } else if (latest.lowTide) {
      tideLabel = `LW ${latest.lowTide.time}`;
    }
    return {
      windSparkline: windData.length >= 3 ? windData : undefined,
      tideSparkline: tideData.length >= 3 ? tideData : undefined,
      tideLabel,
    };
  }, [intentions?.forecastCheck?.snapshots]);

  // Weather: build tide label from race.tide if no snapshot data
  const raceTideLabel = useMemo(() => {
    if (weatherSparklines?.tideLabel) return undefined; // snapshot has label
    const tide = race.tide;
    if (!tide) return undefined;
    const stateLabels: Record<string, string> = {
      flooding: '↑ Flooding',
      ebbing: '↓ Ebbing',
      slack: '→ Slack',
      high: 'High water',
      low: 'Low water',
    };
    return stateLabels[tide.state] || tide.state;
  }, [race.tide, weatherSparklines?.tideLabel]);

  // Marine data: extract wind/current/wave data for CourseMapTile overlays
  const marineOverlayData = useMemo(() => {
    const snapshots = intentions?.forecastCheck?.snapshots;

    // Variables to populate
    let windDirection: number | undefined;
    let windSpeed: number | undefined;
    let currentDirection: number | undefined;
    let currentSpeed: number | undefined;
    let waveHeight: number | undefined;
    let waveDirection: number | undefined;
    let currentEstimated = false;
    let source = 'none';

    // HIGHEST PRIORITY: Use live forecast for race time from OpenMeteo
    // This is the actual forecast for when the race will happen
    if (forecastWind) {
      windDirection = forecastWind.direction;
      windSpeed = forecastWind.speed;
      source = 'openMeteo';
      console.debug('[marineOverlayData] Using OpenMeteo forecast:', { windDirection, windSpeed });
    }

    // Second priority: saved forecast snapshots (user-captured data)
    if (windDirection === undefined && snapshots && snapshots.length > 0) {
      const latest = snapshots[snapshots.length - 1];
      const raceWindow = latest.raceWindow;

      // Extract wind direction - try multiple sources
      windDirection = raceWindow?.windDirectionDegreesAtStart;
      windSpeed = windSpeed ?? raceWindow?.windAtStart;
      currentDirection = raceWindow?.currentDirectionAtStart;
      currentSpeed = raceWindow?.currentSpeedAtStart;
      waveHeight = raceWindow?.waveHeightAtStart;
      waveDirection = raceWindow?.waveDirectionAtStart != null ? parseFloat(String(raceWindow.waveDirectionAtStart)) || undefined : undefined;
    }

    // Third priority: Try strategy notes for wind if not found
    if (windDirection === undefined) {
      const cardinalDir = intentions?.strategyNotes?.['wind.direction'];
      if (cardinalDir) {
        const cardinalToDegreesMap: Record<string, number> = {
          'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
          'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
          'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
          'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
        };
        windDirection = cardinalToDegreesMap[cardinalDir.toUpperCase()];
      }
    }

    if (windSpeed === undefined) {
      const speedStr = intentions?.strategyNotes?.['wind.speed'];
      if (speedStr) {
        const match = speedStr.match(/(\d+)/);
        if (match) {
          windSpeed = parseInt(match[1], 10);
        }
      }
    }

    // Note: We intentionally do NOT fall back to positionedCourse.windDirection
    // because that's the course SETUP direction, not the actual forecast wind.
    // The map should show actual forecast conditions, not course configuration.

    // Final fallback: race.wind data (may be stale or static)
    if (windDirection === undefined && race.wind?.direction !== undefined) {
      windDirection = parseFloat(race.wind.direction) || undefined;
    }
    if (windSpeed === undefined && race.wind?.speedMax !== undefined) {
      windSpeed = race.wind.speedMax;
    }

    // Fallback: estimate current from TidalCurrentEstimator if we have venue coords
    // This provides real-time estimates based on lunar cycle and geographic factors
    if (currentDirection === undefined && currentSpeed === undefined && coords) {
      try {
        // Dynamic import to avoid circular dependencies
        const { TidalCurrentEstimator } = require('@/services/tides/TidalCurrentEstimator');

        // Use race start time or current time
        const targetTime = race.start_time ? new Date(race.start_time as string) : new Date();

        // Get tide extremes if available
        const highTide = (race.tide as any)?.extremes?.find((e: any) => e.type === 'high');
        const lowTide = (race.tide as any)?.extremes?.find((e: any) => e.type === 'low');

        const estimate = TidalCurrentEstimator.estimateCurrent(
          coords.lat,
          coords.lng,
          targetTime,
          highTide ? { type: 'high', time: new Date(highTide.time), height: highTide.height } : null,
          lowTide ? { type: 'low', time: new Date(lowTide.time), height: lowTide.height } : null
        );

        currentDirection = estimate.direction;
        currentSpeed = estimate.speed;
        currentEstimated = true;
      } catch (err) {
        // TidalCurrentEstimator not available or error - leave as undefined
        console.debug('[DaysBeforeContent] Could not estimate current:', err);
      }
    }

    // Return null only if we have absolutely no data
    if (!windDirection && !windSpeed && !currentDirection && !currentSpeed && !waveHeight) {
      console.debug('[marineOverlayData] No data available, returning null');
      return null;
    }

    const result = {
      windDirection,
      windSpeed,
      currentDirection,
      currentSpeed,
      waveHeight,
      waveDirection,
      currentEstimated,
    };
    console.debug('[marineOverlayData] Final result:', result);
    return result;
  }, [forecastWind, intentions?.forecastCheck?.snapshots, intentions?.strategyNotes, coords, race.start_time, race.tide, race.wind]);

  // Extract forecast data for CoursePositionEditor sparklines
  const courseForecastData = useMemo(() => {
    const snapshots = intentions?.forecastCheck?.snapshots;
    if (!snapshots || snapshots.length === 0) return null;

    const latest = snapshots[snapshots.length - 1];

    // Convert wind forecast to the format expected by CoursePositionEditor
    const windForecast = latest.windForecast?.map(d => ({
      time: d.time,
      value: d.value,
      direction: d.direction ? parseFloat(d.direction) || undefined : undefined,
    })) || [];

    // For current, we only have race window data, not time series
    // Create a simple array with the single value if available
    const currentForecast = latest.raceWindow?.currentSpeedAtStart !== undefined
      ? [{ time: 'start', value: latest.raceWindow.currentSpeedAtStart }]
      : [];

    return {
      windForecast: windForecast.length >= 3 ? windForecast : undefined,
      currentForecast: currentForecast.length > 0 ? currentForecast : undefined,
    };
  }, [intentions?.forecastCheck?.snapshots]);

  // Sails: get sail names from sailSelection intention
  const sailSelectionPreview = useMemo(() => {
    const sel = intentions?.sailSelection;
    if (!sel) return undefined;
    if (sel.mainsailName || sel.jibName || sel.spinnakerName) {
      return { mainsailName: sel.mainsailName, jibName: sel.jibName, spinnakerName: sel.spinnakerName };
    }
    return undefined;
  }, [intentions?.sailSelection]);

  // Rig: compute adjusted settings from rig intentions
  const rigPreview = useMemo(() => {
    const settings = intentions?.rigIntentions?.settings;
    if (!settings) return { adjustedCount: 0, adjustedSettings: [] as string[] };
    const adjusted = Object.entries(settings)
      .filter(([_, s]) => s.status === 'adjusted')
      .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    return { adjustedCount: adjusted.length, adjustedSettings: adjusted };
  }, [intentions?.rigIntentions?.settings]);

  // ========================================================================
  // TILE HELPERS
  // ========================================================================

  // Check if a specific checklist item is complete
  const isItemComplete = useCallback((itemId: string): boolean => {
    const allItems = Object.values(itemsByCategory).flat();
    const item = allItems.find((i) => i.id === itemId);
    return item?.isCompleted ?? false;
  }, [itemsByCategory]);

  // Check if any of the given item IDs exist in the checklist
  const hasAnyItem = useCallback((itemIds: string[]): boolean => {
    const allItems = Object.values(itemsByCategory).flat();
    return itemIds.some((id) => allItems.some((i) => i.id === id));
  }, [itemsByCategory]);

  // Find a specific item
  const findItem = useCallback((itemId: string): ChecklistItemWithState | undefined => {
    const allItems = Object.values(itemsByCategory).flat();
    return allItems.find((i) => i.id === itemId);
  }, [itemsByCategory]);

  // Handle tile press - launch the associated wizard/tool
  const handleTilePress = useCallback((checklistItemId: string, toolId: string | undefined) => {
    const allItems = Object.values(itemsByCategory).flat();
    const item = allItems.find((i) => i.id === checklistItemId);
    if (item && hasTool(item)) {
      setActiveTool(item);
    } else if (item) {
      // No tool - just toggle the item
      toggleItem(checklistItemId);
    }
  }, [itemsByCategory, toggleItem]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // Only show loading skeleton on initial load - when we have no cached data yet
  // On subsequent tab switches, show existing data immediately (background refresh if needed)
  if (isInitialLoading && !hasData) {
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <View style={[styles.loadingContainer, { flex: 1 }]}>
          <Text style={styles.loadingText}>Loading checklist...</Text>
        </View>
      </View>
    );
  }

  // ==========================================================================
  // TEAM RACING - Show team setup or collaboration UI
  // ==========================================================================

  if (isTeamRace) {
    // Still loading team state
    if (isTeamLoading) {
      return (
        <View style={[styles.container, { flex: 1 }]}>
          <View style={[styles.loadingContainer, { flex: 1 }]}>
            <Text style={styles.loadingText}>Loading team...</Text>
          </View>
        </View>
      );
    }

    // No team entry yet - show setup card
    if (!teamEntry) {
      return (
        <View style={styles.container}>
          <TeamSetupCard
            raceName={race.name}
            onCreateTeam={async (teamName) => { await createTeamEntry(teamName); }}
            onJoinTeam={async (code) => { await joinTeam({ inviteCode: code }); }}
            isCreating={isCreating}
            isJoining={isJoining}
            error={teamError?.message}
          />
        </View>
      );
    }

    // Team exists - show team collaboration UI
    const effectiveProgress = teamProgress;
    const effectiveCompleted = teamCompletedCount;
    const effectiveTotal = teamTotalCount;

    return (
      <View style={styles.container}>
        {/* Team Header */}
        <View style={styles.teamHeader}>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{teamEntry.teamName}</Text>
            {isSyncing && (
              <View style={styles.syncBadge}>
                <Text style={styles.syncText}>Syncing...</Text>
              </View>
            )}
          </View>
          {isTeamCreator && (
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => setShowInviteModal(true)}
            >
              <UserPlus size={16} color={IOS_COLORS.teal} />
              <Text style={styles.inviteButtonText}>Invite</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Team Members */}
        <TeamMembersList
          members={members}
          currentUserId={currentUserId}
          compact={!isExpanded}
        />

        {/* Team Checklist */}
        {isTeamChecklistLoading ? (
          <View style={[styles.loadingContainer, { flex: 1 }]}>
            <Text style={styles.loadingText}>Loading checklist...</Text>
          </View>
        ) : (
          <>
            {teamItems.map((item) => (
              <SharedChecklistItem
                key={item.id}
                id={item.id}
                label={item.label}
                isCompleted={item.isCompleted}
                completion={item.completion}
                currentUserId={currentUserId}
                onToggle={() => teamToggleItem(item.id)}
                priority={item.priority}
                disabled={isSyncing}
              />
            ))}
          </>
        )}


        {/* Team Invite Modal */}
        <TeamInviteModal
          visible={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          inviteCode={inviteCode}
          inviteLink={inviteLink}
          teamName={teamEntry.teamName}
          onGenerateCode={generateInviteCode}
        />
      </View>
    );
  }

  // ==========================================================================
  // NON-TEAM RACING - Standard checklist UI
  // ==========================================================================

  return (
    <View style={styles.container}>
      {/* Race Type Badge (for non-fleet races) */}
      {raceType !== 'fleet' && (
        <View style={styles.raceTypeBadge}>
          <Text style={styles.raceTypeBadgeText}>
            {raceType.charAt(0).toUpperCase() + raceType.slice(1)} Racing
          </Text>
        </View>
      )}

      {/* Focus Intent Card - carried over from previous race review */}
      {focusIntent && (
        <View style={styles.focusIntentCard}>
          <View style={styles.focusIntentHeader}>
            <Target size={14} color={IOS_COLORS.teal} />
            <Text style={styles.focusIntentLabel}>Your Focus</Text>
            <Pressable
              style={styles.focusIntentDismiss}
              onPress={() => dismissFocusIntent(focusIntent.id)}
              disabled={isDismissingFocus}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color={IOS_COLORS.gray} />
            </Pressable>
          </View>
          <Text style={styles.focusIntentText} numberOfLines={2}>
            "{focusIntent.focusText}"
          </Text>
          {focusIntent.sourceRaceId && (
            <Text style={styles.focusIntentMeta}>
              Set after previous race
            </Text>
          )}
        </View>
      )}

      {/* Race Intention Card - shows user's race plan (copied from Connect tab or manually set) */}
      {intentions?.strategyBrief?.raceIntention && (
        <View style={styles.raceIntentionCard}>
          <View style={styles.raceIntentionHeader}>
            <Target size={14} color={IOS_COLORS.blue} />
            <Text style={styles.raceIntentionLabel}>Race Plan</Text>
          </View>
          <Text style={styles.raceIntentionText}>
            {intentions.strategyBrief.raceIntention}
          </Text>
        </View>
      )}

      {/* Focus Concepts — linked Playbook concepts for race-day practice */}
      {(intentions?.raceFocusConcepts?.length ?? 0) > 0 ? (
        <Pressable
          style={styles.focusConceptsCard}
          onPress={() => setShowFocusConceptPicker(true)}
        >
          <View style={styles.focusConceptsHeader}>
            <BookOpen size={14} color={IOS_COLORS.blue} />
            <Text style={styles.focusConceptsLabel}>Focus Concepts</Text>
            <Text style={styles.focusConceptsCount}>
              {intentions!.raceFocusConcepts!.length}
            </Text>
          </View>
          {intentions!.raceFocusConcepts!.map((fc) => (
            <View key={fc.conceptId} style={styles.focusConceptItem}>
              <Text style={styles.focusConceptTitle} numberOfLines={1}>
                {fc.title}
              </Text>
              {fc.reminder && (
                <Text style={styles.focusConceptReminder} numberOfLines={1}>
                  {fc.reminder}
                </Text>
              )}
            </View>
          ))}
        </Pressable>
      ) : (
        <Pressable
          style={styles.focusConceptsEmpty}
          onPress={() => setShowFocusConceptPicker(true)}
        >
          <BookOpen size={16} color={IOS_COLORS.gray} />
          <Text style={styles.focusConceptsEmptyText}>
            Link a Playbook concept to practice
          </Text>
        </Pressable>
      )}

      {/* Focus Concept Picker Modal */}
      {showFocusConceptPicker && (
        <ToolPopupModal
          visible={showFocusConceptPicker}
          title="Focus Concepts"
          onClose={() => setShowFocusConceptPicker(false)}
          fullScreen
          hideHeader
        >
          <FocusConceptPicker
            existingConcepts={intentions?.raceFocusConcepts || []}
            onSave={handleSaveFocusConcepts}
            onClose={() => setShowFocusConceptPicker(false)}
          />
        </ToolPopupModal>
      )}

      {/* Rig Tuning Card - shows copied tuning settings from Connect tab */}
      {regattaContent?.tuningSettings && Object.keys(regattaContent.tuningSettings).length > 0 && (
        <View style={styles.rigTuningCard}>
          <View style={styles.rigTuningHeader}>
            <Sliders size={14} color={IOS_COLORS.orange} />
            <Text style={styles.rigTuningLabel}>Rig Tuning</Text>
          </View>
          <View style={styles.rigTuningGrid}>
            {Object.entries(regattaContent.tuningSettings)
              .filter(([_, value]) => value !== null && value !== undefined && value !== '')
              .map(([key, value]) => (
                <View key={key} style={styles.rigTuningRow}>
                  <Text style={styles.rigTuningKey}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <Text style={styles.rigTuningValue}>{String(value)}</Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Cross-Interest AI Suggestions */}
      {hasAISuggestions && (
        <View style={{ gap: 8, marginBottom: 12 }}>
          {aiSuggestions.map((suggestion) => (
            <CrossInterestInsight
              key={suggestion.id}
              suggestion={suggestion}
              onApply={(s) => applySuggestion(s, race.id)}
              onDismiss={dismissAISuggestion}
              onSave={saveSuggestion}
            />
          ))}
        </View>
      )}

      {/* Source document banner — prominent link when race was created from a URL */}
      {(race as any).notice_of_race_url && (
        <Pressable
          onPress={() => Linking.openURL((race as any).notice_of_race_url)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 12,
            backgroundColor: '#f0f7ff',
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: '#c7ddf5',
          }}
        >
          <FileText size={18} color="#2563eb" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e40af' }}>
              Source Document
            </Text>
            <Text style={{ fontSize: 12, color: '#3b82f6', marginTop: 1 }} numberOfLines={1}>
              {(race as any).notice_of_race_url.replace(/^https?:\/\//, '')}
            </Text>
          </View>
          <ExternalLink size={16} color="#2563eb" />
        </Pressable>
      )}

      {/* Overall progress bar */}
      {totalCount > 0 && (
        <View style={styles.overallProgressContainer}>
          <View style={styles.overallProgressRow}>
            <Text style={styles.overallProgressLabel}>Race Prep</Text>
            <Text style={styles.overallProgressCount}>
              {completedCount}/{totalCount}
            </Text>
          </View>
          <View style={styles.overallProgressTrack}>
            <View
              style={[
                styles.overallProgressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: progress >= 1 ? '#34C759' : '#007AFF',
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* ================================================================ */}
      {/* SECTION: RACE INTEL                                             */}
      {/* ================================================================ */}
      <PrepChecklistSection
        title="Race Intel"
        subtitle="Documents and weather forecast"
        accentColor="#5856D6"
        isComplete={
          isItemComplete('pre_race_briefing') &&
          isItemComplete('check_weather_forecast')
        }
        visible={hasAnyItem(['pre_race_briefing', 'check_weather_forecast', 'review_nor', 'review_si'])}
        items={[
          {
            item: findItem('pre_race_briefing')!,
            statusText: briefingDocNames.length > 0 ? `${briefingDocNames.length} docs` : undefined,
          },
          {
            item: findItem('check_weather_forecast')!,
            statusText: marineOverlayData?.windSpeed !== undefined
              ? `${degreesToCardinal(marineOverlayData.windDirection) || ''} ${Math.round(marineOverlayData.windSpeed)}kt`.trim()
              : undefined,
            statusColor: '#007AFF',
          },
        ].filter(cfg => cfg.item != null)}
        onToggle={toggleItem}
        onOpenTool={(item) => handleTilePress(item.id, item.toolId)}
      >
        {/* AI Conditions Brief — personalized tactical advice from Playbook */}
        {currentInterest?.id && marineOverlayData?.windSpeed != null && (
          <ConditionsBriefCard
            interestId={(race as any).interest_id ?? currentInterest.id}
            weather={{
              wind_speed_kt: marineOverlayData.windSpeed,
              wind_direction: degreesToCardinal(marineOverlayData.windDirection),
              wave_height_m: marineOverlayData.waveHeight,
            }}
            tide={race.tide ? {
              state: race.tide.state,
              height_m: race.tide.height,
            } : undefined}
            raceTitle={race.name}
            boatClass={race.boatClass}
          />
        )}
        {/* Course Map Tile - below briefing and weather */}
        {coords && (
          <View style={styles.mapSection}>
            <CourseMapTile
              coords={coords}
              positionedCourse={positionedCourse}
              isComplete={!!positionedCourse}
              venueName={venueName}
              onPress={() => setShowCoursePositionEditor(true)}
              windDirection={marineOverlayData?.windDirection}
              windSpeed={marineOverlayData?.windSpeed}
              currentDirection={marineOverlayData?.currentDirection}
              currentSpeed={marineOverlayData?.currentSpeed}
              waveHeight={marineOverlayData?.waveHeight}
              waveDirection={marineOverlayData?.waveDirection}
              currentEstimated={marineOverlayData?.currentEstimated}
            />
          </View>
        )}
        <AcceptedSuggestionBannerList
          suggestions={acceptedForCategory('weather')}
          onDismiss={dismissSuggestion}
        />
      </PrepChecklistSection>

      {/* ================================================================ */}
      {/* SECTION: EQUIPMENT                                              */}
      {/* ================================================================ */}
      <PrepChecklistSection
        title="Equipment"
        subtitle="Sails, rigging, electronics, and safety"
        accentColor="#FF9500"
        defaultCollapsed={isFreshRace}
        isComplete={
          (isItemComplete('sails') || isItemComplete('select_sails')) &&
          isItemComplete('lines') &&
          isItemComplete('tune_rig') &&
          isItemComplete('battery') &&
          isItemComplete('safety')
        }
        visible={hasAnyItem(['sails', 'select_sails', 'lines', 'tune_rig', 'battery', 'safety'])}
        items={[
          {
            item: findItem('sails') || findItem('select_sails'),
            statusText: sailSelectionPreview
              ? [sailSelectionPreview.mainsailName, sailSelectionPreview.jibName].filter(Boolean).join(', ')
              : undefined,
            hasTool: true,
          },
          {
            item: findItem('tune_rig'),
            statusText: rigPreview.adjustedCount > 0 ? `${rigPreview.adjustedCount} adjusted` : undefined,
          },
          {
            item: findItem('battery'),
            subItems: [
              { id: 'gps', label: 'GPS/chartplotter', isCompleted: isItemComplete('battery') },
              { id: 'vhf', label: 'VHF radio', isCompleted: isItemComplete('battery') },
              { id: 'phone', label: 'Phone/backup nav', isCompleted: isItemComplete('battery') },
              { id: 'camera', label: 'Camera', isCompleted: isItemComplete('battery') },
            ],
          },
          {
            item: findItem('safety'),
          },
        ].filter(cfg => cfg.item != null) as any}
        onToggle={toggleItem}
        onOpenTool={(item) => handleTilePress(item.id, item.toolId)}
      >
        <AcceptedSuggestionBannerList
          suggestions={[...acceptedForCategory('rig_tuning'), ...acceptedForCategory('equipment')]}
          onDismiss={dismissSuggestion}
        />
      </PrepChecklistSection>

      {/* ================================================================ */}
      {/* SECTION: CREW & LOGISTICS                                       */}
      {/* ================================================================ */}
      <PrepChecklistSection
        title="Crew & Logistics"
        subtitle="Team coordination and travel"
        accentColor="#007AFF"
        defaultCollapsed={isFreshRace}
        isComplete={
          isItemComplete('confirm_crew') &&
          isItemComplete('transport')
        }
        visible={hasAnyItem(['confirm_crew', 'assign_positions', 'meeting_point', 'transport', 'accommodation', 'food'])}
        items={[
          {
            item: findItem('confirm_crew'),
            statusText: crewNames.length > 0 ? `${crewNames.length} confirmed` : undefined,
            subItems: [
              { id: 'confirm_crew', label: 'Confirm crew', isCompleted: isItemComplete('confirm_crew') },
              { id: 'assign_positions', label: 'Assign positions', isCompleted: isItemComplete('assign_positions') },
              { id: 'meeting_point', label: 'Set meeting point', isCompleted: isItemComplete('meeting_point') },
            ],
          },
          {
            item: findItem('transport'),
            statusText: (() => {
              const done = [isItemComplete('transport'), isItemComplete('accommodation'), isItemComplete('food')].filter(Boolean).length;
              return done > 0 ? `${done}/3 planned` : undefined;
            })(),
            subItems: [
              { id: 'transport', label: 'Transport', isCompleted: isItemComplete('transport') },
              { id: 'accommodation', label: 'Accommodation', isCompleted: isItemComplete('accommodation') },
              { id: 'food', label: 'Food & provisions', isCompleted: isItemComplete('food') },
            ],
          },
        ].filter(cfg => cfg.item != null) as any}
        onToggle={toggleItem}
        onOpenTool={(item) => {
          if (item.id === 'confirm_crew') {
            handleTilePress('confirm_crew', 'crew_management');
          } else {
            handleTilePress('transport', 'logistics_planner');
          }
        }}
      >
        <AcceptedSuggestionBannerList
          suggestions={acceptedForCategory('crew')}
          onDismiss={dismissSuggestion}
        />
      </PrepChecklistSection>

      {/* ================================================================ */}
      {/* SECTION: STRATEGY                                               */}
      {/* ================================================================ */}
      <PrepChecklistSection
        title="Strategy"
        subtitle="Wind, start, upwind approach, and tide"
        accentColor="#FF2D55"
        defaultCollapsed={isFreshRace}
        isComplete={
          isItemComplete('strategy_wind_forecast') &&
          isItemComplete('strategy_start_plan') &&
          isItemComplete('strategy_upwind_approach') &&
          isItemComplete('strategy_current_tide')
        }
        visible={hasAnyItem(['strategy_wind_forecast', 'strategy_start_plan', 'strategy_upwind_approach', 'strategy_current_tide'])}
        items={[
          {
            item: findItem('strategy_wind_forecast'),
            statusText: intentions?.strategyNotes?.['wind.direction'] || undefined,
          },
          {
            item: findItem('strategy_start_plan'),
            statusText: intentions?.strategyNotes?.['start.favoredEnd'] || undefined,
          },
          {
            item: findItem('strategy_upwind_approach'),
            statusText: intentions?.strategyNotes?.['upwind.favoredTack'] || undefined,
          },
          {
            item: findItem('strategy_current_tide'),
            statusText: intentions?.strategyNotes?.['tide.flow'] || undefined,
          },
        ].filter(cfg => cfg.item != null) as any}
        onToggle={toggleItem}
        onOpenTool={(item) => handleTilePress(item.id, item.toolId)}
      >
        <AcceptedSuggestionBannerList
          suggestions={acceptedForCategory('strategy')}
          onDismiss={dismissSuggestion}
        />
      </PrepChecklistSection>

      {/* ================================================================ */}
      {/* SECTION: COACHING                                                */}
      {/* ================================================================ */}
      <Pressable
        style={styles.coachingCard}
        onPress={() => {
          if (hasCoach && activeCoaches.length === 1 && primaryCoach) {
            router.push(`/coach/${primaryCoach.coachId}?action=message&context=pre_race_consult&raceId=${race.id}` as any);
          } else if (hasCoach && activeCoaches.length > 1) {
            setShowCoachSheet(true);
          } else {
            router.push(`/coach/discover?boatClass=${encodeURIComponent(race.boatClass || '')}&source=prep` as any);
          }
        }}
      >
        <View style={styles.coachingCardIcon}>
          <Users size={18} color="#0D9488" />
        </View>
        <View style={styles.coachingCardContent}>
          <Text style={styles.coachingCardTitle}>
            {hasCoach && primaryCoach ? primaryCoach.displayName : 'Find a Coach'}
          </Text>
          <Text style={styles.coachingCardSubtitle}>
            {hasCoach ? 'Get pre-race guidance' : 'Expert advice for race day'}
          </Text>
        </View>
        {hasCoach && (
          <View style={styles.coachingAvailBadge}>
            <View style={styles.coachingAvailDot} />
            <Text style={styles.coachingAvailText}>Available</Text>
          </View>
        )}
      </Pressable>

      {/* ================================================================ */}
      {/* SECTION: TACTICS (conditional)                                   */}
      {/* ================================================================ */}
      <PrepChecklistSection
        title="Tactics"
        subtitle="Crew tactical briefing"
        accentColor="#FF9500"
        defaultCollapsed={isFreshRace}
        isComplete={isItemComplete('review_tactics')}
        visible={hasAnyItem(['review_tactics'])}
        items={[
          { item: findItem('review_tactics') },
        ].filter(cfg => cfg.item != null) as any}
        onToggle={toggleItem}
        onOpenTool={(item) => handleTilePress(item.id, item.toolId)}
      />

      {/* ================================================================ */}
      {/* RACE-TYPE SPECIFIC TILES                                        */}
      {/* ================================================================ */}

      {/* Distance Racing */}
      {raceType === 'distance' && (
        <PrepChecklistSection
          title="Distance Racing"
          subtitle="Navigation, watches, and offshore prep"
          accentColor="#5856D6"
          defaultCollapsed={isFreshRace}
          isComplete={
            isItemComplete('review_chart') &&
            isItemComplete('watch_schedule') &&
            isItemComplete('offshore_safety') &&
            isItemComplete('weather_routing')
          }
          items={[
            { item: findItem('review_chart') },
            { item: findItem('watch_schedule') },
            { item: findItem('offshore_safety') },
            { item: findItem('weather_routing') },
          ].filter(cfg => cfg.item != null) as any}
          onToggle={toggleItem}
          onOpenTool={(item) => handleTilePress(item.id, item.toolId)}
        />
      )}

      {/* Match Racing */}
      {raceType === 'match' && (
        <PrepChecklistSection
          title="Match Racing"
          subtitle="Opponent analysis and rules review"
          accentColor="#FF2D55"
          defaultCollapsed={isFreshRace}
          isComplete={
            isItemComplete('opponent_review') &&
            isItemComplete('prestart_tactics') &&
            isItemComplete('rules_review_18')
          }
          items={[
            { item: findItem('opponent_review') },
            { item: findItem('prestart_tactics') },
            { item: findItem('rules_review_18') },
          ].filter(cfg => cfg.item != null) as any}
          onToggle={toggleItem}
          onOpenTool={(item) => handleTilePress(item.id, item.toolId)}
        />
      )}

      {/* Team Racing */}
      {(raceType as string) === 'team' && !isTeamRace && (
        <PrepChecklistSection
          title="Team Racing"
          subtitle="Team coordination and combo plays"
          accentColor="#0D9488"
          defaultCollapsed={isFreshRace}
          isComplete={
            isItemComplete('team_boat_assignments') &&
            isItemComplete('combo_plays') &&
            isItemComplete('comm_signals')
          }
          items={[
            { item: findItem('team_boat_assignments') },
            { item: findItem('combo_plays') },
            { item: findItem('comm_signals') },
          ].filter(cfg => cfg.item != null) as any}
          onToggle={toggleItem}
          onOpenTool={(item) => handleTilePress(item.id, item.toolId)}
        />
      )}


      {/* All Tool Modals - rendered as bottom sheets */}
      {activeTool && (
        <ToolPopupModal
          visible={true}
          title={getToolMetadata(activeTool)?.displayName || activeTool.label}
          onClose={handleToolCancel}
          fullScreen
          hideHeader
        >
          {/* Safety Gear */}
          {activeTool.toolId === 'safety_gear' && (
            <SafetyGearWizard item={activeTool} regattaId={race.id} boatId={userBoat?.id} onComplete={handleToolComplete} onCancel={handleToolCancel} />
          )}
          {/* Rigging Inspection */}
          {activeTool.toolId === 'rigging_inspection' && (
            <RiggingInspectionWizard item={activeTool} regattaId={race.id} boatId={userBoat?.id} onComplete={handleToolComplete} onCancel={handleToolCancel} />
          )}
          {/* Watch Schedule */}
          {activeTool.toolId === 'watch_schedule' && (
            <WatchScheduleWizard
              item={activeTool} regattaId={race.id} boatId={userBoat?.id}
              raceStartTime={race.startTime} raceDate={race.date}
              raceDurationHours={race.time_limit_hours ? Number(race.time_limit_hours) : raceType === 'distance' ? 8 : raceType === 'match' ? 1.5 : 2}
              raceName={race.name}
              raceDistance={race.total_distance_nm ? Number(race.total_distance_nm) : undefined}
              onComplete={handleToolComplete} onCancel={handleToolCancel}
            />
          )}
          {/* Forecast Check */}
          {activeTool.toolId === 'forecast_check' && (
            <ForecastCheckWizard
              item={activeTool} regattaId={race.id} boatId={userBoat?.id}
              venue={venueForForecast} raceDate={race.date} raceName={race.name} raceStartTime={race.startTime}
              raceDurationHours={race.time_limit_hours ? Number(race.time_limit_hours) : raceType === 'distance' ? 8 : raceType === 'match' ? 1.5 : 2}
              onComplete={handleToolComplete} onCancel={handleToolCancel}
            />
          )}
          {/* Document Review (NOR / SI) */}
          {(activeTool.toolId === 'nor_review' || activeTool.toolId === 'si_review') && (
            <DocumentReviewWizard item={activeTool} regattaId={race.id} boatId={userBoat?.id} venue={venueForForecast} onComplete={handleToolComplete} onCancel={handleToolCancel} />
          )}
          {/* Course Map */}
          {activeTool.toolId === 'course_map' && (
            <CourseMapWizard item={activeTool} regattaId={race.id} boatId={userBoat?.id} course={race.course as any} venue={venueForForecast} onComplete={handleToolComplete} onCancel={handleToolCancel} />
          )}
          {/* Pre-Race Briefing */}
          {activeTool.toolId === 'pre_race_briefing' && (
            <PreRaceBriefingWizard item={activeTool} regattaId={race.id} boatId={userBoat?.id} raceName={race.name} raceDate={race.date} positionedCourse={positionedCourse} coords={coords} marineOverlayData={marineOverlayData} intentions={intentions} updateIntentions={updateIntentions} savePreparation={savePreparation} isPreparationLoading={isPreparationLoading} isSaving={isSaving} hasPendingChanges={hasPendingChanges} lastSavedAt={lastSavedAt} onComplete={handleToolComplete} onCancel={handleToolCancel} />
          )}
          {/* Start Planner */}
          {activeTool.toolId === 'start_planner' && (
            <StartPlannerWizard
              item={activeTool} regattaId={race.id} boatId={userBoat?.id}
              venue={venueForForecast} raceDate={race.date} raceName={race.name} raceStartTime={race.startTime}
              onComplete={handleToolComplete} onCancel={handleToolCancel} onStrategyCapture={handleStrategyCapture}
            />
          )}
          {/* Wind Shift Strategy */}
          {activeTool.toolId === 'wind_shift_strategy' && (
            <WindShiftStrategyWizard
              item={activeTool} regattaId={race.id} boatId={userBoat?.id}
              venue={venueForForecast} raceDate={race.date} raceName={race.name} raceStartTime={race.startTime}
              onComplete={handleToolComplete} onCancel={handleToolCancel} onStrategyCapture={handleStrategyCapture}
            />
          )}
          {/* First Beat Strategy */}
          {activeTool.toolId === 'first_beat_strategy' && (
            <FirstBeatStrategyWizard
              item={activeTool} regattaId={race.id} boatId={userBoat?.id}
              venue={venueForForecast} raceDate={race.date} raceName={race.name} raceStartTime={race.startTime}
              onComplete={handleToolComplete} onCancel={handleToolCancel} onStrategyCapture={handleStrategyCapture}
            />
          )}
          {/* Tide Strategy */}
          {activeTool.toolId === 'tide_strategy' && (
            <TideStrategyWizard
              item={activeTool} regattaId={race.id} boatId={userBoat?.id}
              venue={venueForForecast} raceDate={race.date} raceName={race.name} raceStartTime={race.startTime}
              onComplete={handleToolComplete} onCancel={handleToolCancel} onStrategyCapture={handleStrategyCapture}
            />
          )}
          {/* Rig Tuning */}
          {activeTool.toolId === 'rig_tuning_wizard' && (
            <RigTuningWizard
              item={activeTool} regattaId={race.id} boatId={userBoat?.id}
              classId={userBoat?.class_id} boatClass={userBoat?.boat_class?.name}
              venue={venueForForecast} raceDate={race.date}
              existingIntention={rigTuningExistingIntention} updateRigIntentions={updateRigIntentions}
              onComplete={handleToolComplete} onCancel={handleToolCancel}
            />
          )}
          {/* Sail Selection */}
          {(activeTool.toolId === 'sail_selection_wizard' || activeTool.toolId === 'sail_inspection') && (
            <SailSelectionWizard
              item={activeTool} regattaId={race.id} boatId={userBoat?.id}
              wind={marineOverlayData?.windSpeed !== undefined ? {
                direction: degreesToCardinal(marineOverlayData?.windDirection),
                speedMin: Math.round(marineOverlayData.windSpeed),
                speedMax: Math.round(marineOverlayData.windSpeed),
              } : undefined}
              onComplete={handleToolComplete} onCancel={handleToolCancel}
            />
          )}
          {/* Tactics Review */}
          {activeTool.toolId === 'tactics_review_wizard' && (
            <TacticsReviewWizard
              item={activeTool} regattaId={race.id} boatId={userBoat?.id}
              venueId={venueId} venueName={venueName}
              wind={marineOverlayData?.windSpeed !== undefined ? {
                direction: degreesToCardinal(marineOverlayData?.windDirection),
                speedMin: Math.round(marineOverlayData.windSpeed),
                speedMax: Math.round(marineOverlayData.windSpeed),
              } : undefined}
              tideState={weatherSparklines?.tideLabel || raceTideLabel}
              onComplete={handleToolComplete} onCancel={handleToolCancel}
            />
          )}
          {/* Electronics Checklist */}
          {activeTool.toolId === 'electronics_checklist' && (
            <ElectronicsChecklist item={activeTool} regattaId={race.id} boatId={userBoat?.id} onComplete={handleToolComplete} onCancel={handleToolCancel} />
          )}
          {/* Position Assignment */}
          {activeTool.toolId === 'position_assignment' && (
            <PositionAssignmentPanel item={activeTool} regattaId={race.id} boatId={userBoat?.id} classId={userBoat?.class_id} onComplete={handleToolComplete} onCancel={handleToolCancel} />
          )}
          {/* Meeting Point */}
          {activeTool.toolId === 'meeting_point' && (
            <MeetingPointPicker item={activeTool} regattaId={race.id} boatId={userBoat?.id} onComplete={handleToolComplete} onCancel={handleToolCancel} />
          )}
          {/* Crew Management */}
          {activeTool.toolId === 'crew_management' && (
            <CrewManagementWizard
              item={activeTool} regattaId={race.id} boatId={userBoat?.id} classId={userBoat?.class_id}
              onComplete={async () => {
                if (!isItemComplete('confirm_crew')) toggleItem('confirm_crew');
                if (!isItemComplete('assign_positions')) toggleItem('assign_positions');
                if (!isItemComplete('meeting_point')) toggleItem('meeting_point');
                try {
                  const crew = await crewManagementService.getAllCrew(user!.id);
                  setCrewNames(crew.filter((c) => c.status === 'active').map((c) => c.name));
                } catch { /* ignore */ }
                setActiveTool(null);
              }}
              onCancel={handleToolCancel}
            />
          )}
          {/* Logistics Planner */}
          {activeTool.toolId === 'logistics_planner' && (
            <LogisticsPlannerWizard
              item={activeTool} regattaId={race.id} boatId={userBoat?.id}
              onComplete={() => setActiveTool(null)} onCancel={handleToolCancel}
              onToggleItem={toggleItem} onCompleteItem={completeItem} onUncompleteItem={uncompleteItem}
              completedItems={{
                transport: isItemComplete('transport'),
                accommodation: isItemComplete('accommodation'),
                food: isItemComplete('food'),
              }}
              existingNotes={{
                transport: completions['transport']?.notes ?? '',
                accommodation: completions['accommodation']?.notes ?? '',
                food: completions['food']?.notes ?? '',
              }}
            />
          )}
          {/* Generic Interactive Checklist */}
          {activeTool.toolType === 'interactive' &&
           !['electronics_checklist', 'position_assignment', 'meeting_point'].includes(activeTool.toolId || '') && (
            <InteractiveChecklist item={activeTool} regattaId={race.id} boatId={userBoat?.id} onComplete={handleToolComplete} onCancel={handleToolCancel} />
          )}
        </ToolPopupModal>
      )}

      {/* Quick Tips Panel (bottom sheet, not modal) */}
      <QuickTipsPanel
        item={(activeTool ?? { id: '', label: '', priority: 'normal' }) as any}
        visible={activeTool?.toolType === 'quick_tips'}
        onComplete={handleToolComplete}
        onCancel={handleToolCancel}
      />

      {/* Course Position Editor Modal */}
      {showCoursePositionEditor && coords && (
        <CoursePositionEditor
          visible={true}
          regattaId={race.id}
          initialLocation={memoizedLocation}
          initialCourseType={positionedCourse?.courseType || (raceType === 'fleet' ? 'windward_leeward' : 'windward_leeward')}
          initialWindDirection={marineOverlayData?.windDirection || positionedCourse?.windDirection || 225}
          initialWindSpeed={marineOverlayData?.windSpeed}
          initialLegLength={positionedCourse?.legLengthNm}
          existingCourse={positionedCourse}
          numberOfBoats={race.expected_fleet_size || undefined}
          currentDirection={marineOverlayData?.currentDirection}
          currentSpeed={marineOverlayData?.currentSpeed}
          windForecast={courseForecastData?.windForecast}
          currentForecast={courseForecastData?.currentForecast}
          onSave={async (course) => {
            try {
              // Get current user
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                console.error('[DaysBeforeContent] No user found for course save');
                return;
              }

              // Skip database save for demo races (non-UUID IDs)
              if (!isUuid(course.regattaId)) {
                console.log('[DaysBeforeContent] Skipping DB save for demo race, updating local state only');
                setPositionedCourse({
                  ...course,
                  id: course.regattaId,
                  userId: user.id,
                } as PositionedCourse);
                setShowCoursePositionEditor(false);
                return;
              }

              // Prepare database record
              const dbRecord = {
                regatta_id: course.regattaId,
                user_id: user.id,
                course_type: course.courseType,
                wind_direction: course.windDirection,
                leg_length_nm: course.legLengthNm,
                start_line_length_m: course.startLineLengthM || 100,
                start_pin_lat: course.startLine.pin.lat,
                start_pin_lng: course.startLine.pin.lng,
                start_committee_lat: course.startLine.committee.lat,
                start_committee_lng: course.startLine.committee.lng,
                marks: course.marks,
                has_manual_adjustments: course.hasManualAdjustments || false,
              };

              // Upsert to database (update if exists, insert if not)
              const { data, error } = await supabase
                .from('race_positioned_courses')
                .upsert(dbRecord, {
                  onConflict: 'regatta_id,user_id',
                })
                .select()
                .single();

              if (error) {
                console.error('[DaysBeforeContent] Failed to save positioned course:', error);
                // Still update local state even if DB save fails
              } else {
                console.log('[DaysBeforeContent] Positioned course saved:', data?.id);
              }

              // Update local state
              setPositionedCourse({
                ...course,
                id: data?.id || course.regattaId,
                userId: user.id,
              } as PositionedCourse);
              setShowCoursePositionEditor(false);
            } catch (err) {
              console.error('[DaysBeforeContent] Exception saving positioned course:', err);
              // Still update local state
              setPositionedCourse(course as PositionedCourse);
              setShowCoursePositionEditor(false);
            }
          }}
          onCancel={() => setShowCoursePositionEditor(false)}
        />
      )}

      {/* Learning Tooltip Modal */}
      <Modal
        visible={!!tooltipItem}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltipItem(null)}
      >
        <Pressable
          style={styles.tooltipOverlay}
          onPress={() => setTooltipItem(null)}
        >
          <Pressable style={styles.tooltipContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.tooltipHeader}>
              <BookOpen size={18} color={IOS_COLORS.purple} />
              <Text style={styles.tooltipTitle}>{tooltipItem?.label}</Text>
            </View>
            <Text style={styles.tooltipBrief}>
              {tooltipItem ? getLearningBrief(tooltipItem.id) || 'Learn more about this topic in the Academy.' : ''}
            </Text>
            {tooltipItem && getLearningForItem(tooltipItem.id)?.detailed && (() => {
              const detailed = getLearningForItem(tooltipItem.id)?.detailed;
              // Handle different field names across learning data files
              const keyPoints = (detailed as any)?.keyConsiderations
                || (detailed as any)?.keyIndicators
                || (detailed as any)?.tacticalImplications
                || [];
              if (keyPoints.length === 0) return null;
              return (
                <View style={styles.tooltipDetailSection}>
                  <Text style={styles.tooltipDetailLabel}>Key Points:</Text>
                  {keyPoints.slice(0, 2).map((point: string, idx: number) => (
                    <Text key={idx} style={styles.tooltipDetailPoint}>• {point}</Text>
                  ))}
                </View>
              );
            })()}
            <View style={styles.tooltipActions}>
              <TouchableOpacity
                style={styles.tooltipDismiss}
                onPress={() => setTooltipItem(null)}
              >
                <Text style={styles.tooltipDismissText}>Got it</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tooltipLearnMore}
                onPress={() => {
                  if (tooltipItem) {
                    setTooltipItem(null);
                    handleLearnPress(tooltipItem);
                  }
                }}
              >
                <Text style={styles.tooltipLearnMoreText}>Open Lesson</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Coach Selection Sheet (for multiple coaches) */}
      <CoachSelectionSheet
        isOpen={showCoachSheet}
        onClose={() => setShowCoachSheet(false)}
        coaches={activeCoaches}
        phase="prep"
        raceId={race.id}
        raceBoatClass={race.boatClass}
        onSelectCoach={(coach, action) => {
          if (action === 'message') {
            // Navigate to coach messaging with pre-race context
            router.push(`/coach/${coach.coachId}?action=message&context=pre_race_consult&raceId=${race.id}` as any);
          } else {
            // Share action - less common in prep phase but handle it
            router.push(`/coach/${coach.coachId}?action=share&raceId=${race.id}` as any);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    paddingBottom: 40,
  },

  // Overall progress bar at top
  overallProgressContainer: {
    gap: 6,
  },
  overallProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overallProgressCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
    fontVariant: ['tabular-nums' as any],
  },
  overallProgressTrack: {
    height: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Course map section (inside Race Intel, below tiles)
  mapSection: {
    marginTop: 12,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Past Race Notice (legacy - kept for reference)
  pastRaceNotice: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  pastRaceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  pastRaceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Historical View Styles
  historicalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    marginBottom: 12,
  },
  historicalBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  historicalContent: {
    gap: 12,
  },
  emptyHistoricalContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyHistoricalText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  historicalSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  historicalSummaryText: {
    fontSize: 14,
    color: IOS_COLORS.label,
    fontWeight: '500',
    flex: 1,
  },
  historicalSummaryMeta: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  historicalDetailsList: {
    gap: 8,
  },
  historicalDetailsHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  historicalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  historicalDetailLabel: {
    fontSize: 13,
    color: IOS_COLORS.label,
    flex: 1,
  },
  historicalDetailSubtext: {
    fontSize: 11,
    color: IOS_COLORS.gray,
  },
  historicalDetailText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  historicalMoreItems: {
    fontSize: 12,
    color: IOS_COLORS.blue,
    fontWeight: '500',
    textAlign: 'center',
    paddingTop: 4,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  reviewButtonPressed: {
    backgroundColor: IOS_COLORS.gray5,
  },
  reviewButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  raceInfoContainer: {
    gap: 8,
  },

  // Retrospective Checklist Styles
  retroSummary: {
    gap: 8,
  },
  retroSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  retroProgressBar: {
    height: 6,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  retroProgressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.green,
    borderRadius: 3,
  },
  retroDetailsList: {
    gap: 16,
    marginTop: 8,
  },
  retroCategory: {
    gap: 8,
  },
  retroCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retroCategoryLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  retroCategoryCount: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  retroItemsList: {
    gap: 6,
    paddingLeft: 20,
  },
  retroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retroCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retroCheckboxDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  retroCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  retroItemLabel: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.label,
  },
  retroItemLabelNotDone: {
    color: IOS_COLORS.gray,
  },

  // Race Type Badge
  raceTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  raceTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Tile Row (2-up grid)
  tileRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Section - Flat header pattern (kept for backwards compat)
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Focus Intent Card
  focusIntentCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 8,
  },
  focusIntentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusIntentLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  focusIntentDismiss: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: `${IOS_COLORS.gray}15`,
  },
  focusIntentText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    fontStyle: 'italic',
    lineHeight: 21,
  },
  focusIntentMeta: {
    fontSize: 11,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },

  // Race Intention Card (copied from Connect tab or manually set)
  raceIntentionCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  raceIntentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  raceIntentionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  raceIntentionText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 22,
  },

  // Focus Concepts Card
  focusConceptsCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7DDF5',
    gap: 6,
  },
  focusConceptsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  focusConceptsLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  focusConceptsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  focusConceptItem: {
    paddingLeft: 20,
    gap: 2,
  },
  focusConceptTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  focusConceptReminder: {
    fontSize: 13,
    fontStyle: 'italic',
    color: IOS_COLORS.secondaryLabel,
  },
  focusConceptsEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: IOS_COLORS.gray3,
  },
  focusConceptsEmptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    flex: 1,
  },

  // Rig Tuning Card (copied from Connect tab)
  rigTuningCard: {
    backgroundColor: `${IOS_COLORS.orange}12`,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.orange,
    gap: 8,
  },
  rigTuningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rigTuningLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rigTuningGrid: {
    gap: 4,
  },
  rigTuningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rigTuningKey: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  rigTuningValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Coaching Card
  coachingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 12,
  },
  coachingCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachingCardContent: {
    flex: 1,
    gap: 2,
  },
  coachingCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  coachingCardSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  coachingAvailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
  },
  coachingAvailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  coachingAvailText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },

  // Team Racing
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  teamInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  syncBadge: {
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${IOS_COLORS.teal}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.teal,
  },

  // Learning Tooltip
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tooltipContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  tooltipBrief: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 22,
    marginBottom: 12,
  },
  tooltipDetailSection: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  tooltipDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tooltipDetailPoint: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
    marginBottom: 4,
  },
  tooltipActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  tooltipDismiss: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
  },
  tooltipDismissText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  tooltipLearnMore: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.purple,
    alignItems: 'center',
  },
  tooltipLearnMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Sail Picker Styles
  sailPickerContent: {
    gap: 8,
  },
  sailPickerSubtitle: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 4,
  },
  sailPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
  },
  sailPickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sailPickerItemContent: {
    flex: 1,
    gap: 2,
  },
  sailPickerItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  sailPickerItemMeta: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  sailConditionBar: {
    width: 40,
    height: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sailConditionFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default DaysBeforeContent;
