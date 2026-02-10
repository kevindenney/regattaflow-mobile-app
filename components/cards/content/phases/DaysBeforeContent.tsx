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
import { StyleSheet, Text, View, Pressable, TouchableOpacity, Modal } from 'react-native';
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
  AlertCircle,
  UserPlus,
  Sailboat,
  Camera,
  ListChecks,
  Info,
  FileText,
  Pencil,
  Sliders,
  X,
} from 'lucide-react-native';

import { CardRaceData } from '../../types';
import { TileGrid } from '../TileGrid';
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
import {
  BriefingTile,
  WeatherTile,
  SailsTile,
  RigTile,
  ElectronicsTile,
  SafetyTile,
  CrewTile,
  LogisticsTile,
  WindStrategyTile,
  StartStrategyTile,
  UpwindTile,
  TideStrategyTile,
  TacticsTile,
  NavigationTile,
  WatchScheduleTile,
  OffshoreSafetyTile,
  WeatherRoutingTile,
  OpponentTile,
  PreStartTacticsTile,
  RulesTile,
  TeamSetupTile,
  ComboPlaysTile,
  TeamCommsTile,
  CourseMapTile,
} from '@/components/races/prep/PrepTabTiles';

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
 * Get the appropriate icon for a tool type
 */
function getToolIcon(toolType: string | undefined) {
  switch (toolType) {
    case 'full_wizard':
      return <Camera size={14} color={IOS_COLORS.blue} />;
    case 'interactive':
      return <ListChecks size={14} color={IOS_COLORS.blue} />;
    case 'quick_tips':
      return <Info size={14} color={IOS_COLORS.blue} />;
    default:
      return <Sailboat size={14} color={IOS_COLORS.blue} />;
  }
}

/**
 * Render a single checklist item - Simple row layout with checkbox + label + badges
 */
function ChecklistItem({
  item,
  onToggle,
  onAction,
  onLearnPress,
  onShowTooltip,
  hasAction,
  showLearning = true,
}: {
  item: ChecklistItemWithState;
  onToggle: () => void;
  onAction?: () => void;
  onLearnPress?: () => void;
  onShowTooltip?: () => void;
  hasAction?: boolean;
  showLearning?: boolean;
}) {
  // Get learning brief for tooltip - try registry first, then fall back to old method
  const learningBrief = getLearningBrief(item.id);
  // Check if item has learning content (via registry or legacy field) AND learning is enabled
  const hasLearningLink = showLearning && (!!learningBrief || !!item.learningModuleSlug);

  // Get tooltip text - use brief from registry or default message
  const tooltipText = learningBrief || 'Tap to learn more about this topic';

  return (
    <View style={styles.checklistItem}>
      {/* Checkbox + Label area - toggles completion */}
      <Pressable style={styles.checklistMainArea} onPress={onToggle}>
        <View style={[styles.checkbox, item.isCompleted && styles.checkboxDone]}>
          {item.isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.checklistItemContent}>
          <Text
            style={[
              styles.checklistLabel,
              item.isCompleted && styles.checklistLabelDone,
            ]}
          >
            {item.label}
          </Text>
          {item.isCarryover && item.carryoverSource && (
            <Text style={styles.carryoverSource}>from {item.carryoverSource}</Text>
          )}
          {item.completion?.completedByName && (
            <Text style={styles.completedByText}>
              ✓ {item.completion.completedByName}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Action icons area */}
      <View style={styles.actionIconsRow}>
        {/* Learning link badge - tap to navigate, long-press for tooltip */}
        {hasLearningLink && (
          <Pressable
            style={styles.learnBadge}
            onPress={onLearnPress || (() => {})}
            onLongPress={onShowTooltip || (() => {})}
            delayLongPress={300}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={tooltipText}
            accessibilityHint="Tap to open lesson, long-press for quick tip"
            accessibilityRole="button"
          >
            <BookOpen size={14} color={IOS_COLORS.purple} />
          </Pressable>
        )}
        {/* Tool action badge - tappable */}
        {hasAction && onAction ? (
          item.isCompleted ? (
            // Completed: Show "Edit" badge (orange pencil)
            <Pressable
              style={styles.editBadge}
              onPress={onAction}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Pencil size={14} color={IOS_COLORS.orange} />
            </Pressable>
          ) : (
            // Not completed: Show tool icon (blue)
            <Pressable
              style={styles.actionBadge}
              onPress={onAction}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {getToolIcon(item.toolType)}
            </Pressable>
          )
        ) : item.priority === 'high' && !hasLearningLink ? (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>!</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Render a category section with its items - Flat header pattern
 */
function CategorySection({
  category,
  items,
  onToggle,
  onItemAction,
  onLearnPress,
  onShowTooltip,
  actionItems,
  showCarryoverHeader,
  showLearning = true,
}: {
  category: ChecklistCategory;
  items: ChecklistItemWithState[];
  onToggle: (itemId: string) => void;
  onItemAction?: (itemId: string) => void;
  onLearnPress?: (item: ChecklistItemWithState) => void;
  onShowTooltip?: (item: ChecklistItemWithState) => void;
  actionItems?: string[];
  showCarryoverHeader?: boolean;
  showLearning?: boolean;
}) {
  const config = CATEGORY_CONFIG[category];
  const IconComponent = CATEGORY_ICONS[category] || Wrench;

  // Separate carryover items from regular items
  const carryoverItems = items.filter((item) => item.isCarryover);
  const regularItems = items.filter((item) => !item.isCarryover);

  const hasAction = (itemId: string) => actionItems?.includes(itemId) ?? false;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <IconComponent size={16} color={config.color} />
        <Text style={styles.sectionLabel}>{config.label}</Text>
      </View>

      {/* Carryover items from previous races */}
      {carryoverItems.length > 0 && (
        <View style={styles.carryoverContainer}>
          <View style={styles.carryoverHeader}>
            <AlertCircle size={14} color={IOS_COLORS.orange} />
            <Text style={styles.carryoverLabel}>From previous race:</Text>
          </View>
          {carryoverItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggle={() => onToggle(item.id)}
              onAction={() => onItemAction?.(item.id)}
              onLearnPress={() => onLearnPress?.(item)}
              onShowTooltip={() => onShowTooltip?.(item)}
              hasAction={hasAction(item.id)}
              showLearning={showLearning}
            />
          ))}
        </View>
      )}

      {/* Regular checklist items */}
      <View style={styles.checklistContainer}>
        {regularItems.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={() => onToggle(item.id)}
            onAction={() => onItemAction?.(item.id)}
            onLearnPress={() => onLearnPress?.(item)}
            onShowTooltip={() => onShowTooltip?.(item)}
            hasAction={hasAction(item.id)}
            showLearning={showLearning}
          />
        ))}
      </View>
    </View>
  );
}

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

/**
 * TileSection - Section wrapper for tile groups, matching AfterRaceContent pattern
 */
function TileSection({
  title,
  subtitle,
  isComplete,
  visible = true,
  children,
}: {
  title: string;
  subtitle: string;
  isComplete: boolean;
  visible?: boolean;
  children: React.ReactNode;
}) {
  if (!visible) return null;
  return (
    <View style={tileSectionStyles.section}>
      <View style={tileSectionStyles.sectionHeader}>
        <View style={tileSectionStyles.sectionTitleRow}>
          <Text style={tileSectionStyles.sectionTitle}>{title}</Text>
          {isComplete && (
            <CheckCircle2 size={16} color="#34C759" />
          )}
        </View>
        <Text style={tileSectionStyles.sectionSubtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

const tileSectionStyles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 2,
    paddingBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3C3C43',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
});

export function DaysBeforeContent({
  race,
  isExpanded = true,
  onSwitchToReview,
}: DaysBeforeContentProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const raceType = getRaceType(race);
  const isTeamRace = raceType === 'team';

  // User settings for quick tips/learning visibility
  const { settings: userSettings } = useUserSettings();

  // Accepted follower suggestions for inline banners
  const { forCategory: acceptedForCategory, dismissSuggestion } = useAcceptedSuggestions(race.id);

  // Focus intent for this race (set from a previous race's review)
  const { focusIntent } = useFocusIntentForRace(race.id);
  const { dismiss: dismissFocusIntent, isPending: isDismissingFocus } = useDismissFocusIntent();

  // State for team invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);

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
  } : null;

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
      toggleItem(activeTool.id);
    }
    setActiveTool(null);
  }, [activeTool, toggleItem]);

  // Handle tool cancellation
  const handleToolCancel = useCallback(() => {
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
        pathname: `/(tabs)/learn/${courseId}`,
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

  // Race preparation data (for historical view and rig tuning persistence)
  const { intentions, isLoading: isPreparationLoading, updateStrategyNote, updateRigIntentions } = useRacePreparation({
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
                mark => Number.isFinite(mark.lat) && Number.isFinite(mark.lng)
              );

              // Validate startLine coordinates
              const startLine = generatedCourse.startLine;
              const validStartLine = startLine &&
                Number.isFinite(startLine.portEnd?.lat) &&
                Number.isFinite(startLine.portEnd?.lng) &&
                Number.isFinite(startLine.starboardEnd?.lat) &&
                Number.isFinite(startLine.starboardEnd?.lng);

              if (validMarks.length > 0 && validStartLine) {
                setPositionedCourse({
                  id: 'auto-generated',
                  regattaId: race.id,
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
      windSpeed = windSpeed ?? raceWindow?.windSpeedAtStart;
      currentDirection = raceWindow?.currentDirection;
      currentSpeed = raceWindow?.currentSpeed;
      waveHeight = latest.waveHeight;
      waveDirection = latest.waveDirection;
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
      windDirection = race.wind.direction;
    }
    if (windSpeed === undefined && race.wind?.speed !== undefined) {
      windSpeed = race.wind.speed;
    }

    // Fallback: estimate current from TidalCurrentEstimator if we have venue coords
    // This provides real-time estimates based on lunar cycle and geographic factors
    if (currentDirection === undefined && currentSpeed === undefined && coords) {
      try {
        // Dynamic import to avoid circular dependencies
        const { TidalCurrentEstimator } = require('@/services/tides/TidalCurrentEstimator');

        // Use race start time or current time
        const targetTime = race.start_time ? new Date(race.start_time) : new Date();

        // Get tide extremes if available
        const highTide = race.tide?.extremes?.find((e: any) => e.type === 'high');
        const lowTide = race.tide?.extremes?.find((e: any) => e.type === 'low');

        const estimate = TidalCurrentEstimator.estimateCurrent(
          coords.lat,
          coords.lng,
          targetTime,
          highTide ? { type: 'high', time: new Date(highTide.time), height: highTide.height } : null,
          lowTide ? { type: 'low', time: new Date(lowTide.time), height: lowTide.height } : null
        );

        currentDirection = estimate.direction;
        currentSpeed = estimate.speed;
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
            onCreateTeam={createTeamEntry}
            onJoinTeam={(code) => joinTeam({ inviteCode: code })}
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

      {/* ================================================================ */}
      {/* SECTION: RACE INTEL                                             */}
      {/* ================================================================ */}
      <TileSection
        title="Race Intel"
        subtitle="Documents and weather forecast"
        isComplete={
          isItemComplete('pre_race_briefing') &&
          isItemComplete('check_weather_forecast')
        }
        visible={hasAnyItem(['pre_race_briefing', 'check_weather_forecast', 'review_nor', 'review_si'])}
      >
        <TileGrid>
          <BriefingTile
            isComplete={isItemComplete('pre_race_briefing') || (isItemComplete('review_nor') && isItemComplete('review_si'))}
            onPress={() => handleTilePress('pre_race_briefing', 'pre_race_briefing')}
            documentNames={briefingDocNames}
            raceName={race.name}
          />
          <WeatherTile
            isComplete={isItemComplete('check_weather_forecast')}
            onPress={() => handleTilePress('check_weather_forecast', 'forecast_check')}
            windDirection={
              // Prefer live forecast direction, fall back to saved strategy notes
              degreesToCardinal(marineOverlayData?.windDirection) ||
              intentions?.strategyNotes?.['wind.direction']
            }
            windSpeed={
              // Prefer live forecast speed, fall back to saved strategy notes
              marineOverlayData?.windSpeed !== undefined
                ? `${Math.round(marineOverlayData.windSpeed)}`
                : intentions?.strategyNotes?.['wind.speed']
            }
            raceWind={race.wind}
            windSparkline={weatherSparklines?.windSparkline}
            tideSparkline={weatherSparklines?.tideSparkline}
            tideLabel={weatherSparklines?.tideLabel || raceTideLabel}
          />
        </TileGrid>
        {/* Course Map Tile - below briefing and weather tiles */}
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
            />
          </View>
        )}
        <AcceptedSuggestionBannerList
          suggestions={acceptedForCategory('weather')}
          onDismiss={dismissSuggestion}
        />
      </TileSection>

      {/* ================================================================ */}
      {/* SECTION: EQUIPMENT                                              */}
      {/* ================================================================ */}
      <TileSection
        title="Equipment"
        subtitle="Sails, rigging, electronics, and safety"
        isComplete={
          isItemComplete('sails') &&
          isItemComplete('select_sails') &&
          isItemComplete('lines') &&
          isItemComplete('tune_rig') &&
          isItemComplete('battery') &&
          isItemComplete('safety')
        }
        visible={hasAnyItem(['sails', 'select_sails', 'lines', 'tune_rig', 'battery', 'safety'])}
      >
        <TileGrid>
          <SailsTile
            isComplete={isItemComplete('sails') && isItemComplete('select_sails')}
            onPress={() => {
              if (findItem('sails')) handleSailsAction();
              else handleTilePress('select_sails', 'sail_selection_wizard');
            }}
            sailSelection={sailSelectionPreview}
            boatClass={race.boatClass}
          />
          <RigTile
            isComplete={isItemComplete('lines') && isItemComplete('tune_rig')}
            onPress={() => handleTilePress('tune_rig', 'rig_tuning_wizard')}
            tuningSummary={
              intentions?.rigIntentions?.overallNotes
                ? intentions.rigIntentions.overallNotes.substring(0, 30)
                : undefined
            }
            adjustedCount={rigPreview.adjustedCount}
            adjustedSettings={rigPreview.adjustedSettings}
          />
          <ElectronicsTile
            isComplete={isItemComplete('battery')}
            onPress={() => handleTilePress('battery', 'electronics_checklist')}
          />
          <SafetyTile
            isComplete={isItemComplete('safety')}
            onPress={() => handleTilePress('safety', 'safety_gear')}
          />
        </TileGrid>
        <AcceptedSuggestionBannerList
          suggestions={[...acceptedForCategory('rig_tuning'), ...acceptedForCategory('equipment')]}
          onDismiss={dismissSuggestion}
        />
      </TileSection>

      {/* ================================================================ */}
      {/* SECTION: CREW & LOGISTICS                                       */}
      {/* ================================================================ */}
      <TileSection
        title="Crew & Logistics"
        subtitle="Team coordination and travel"
        isComplete={
          isItemComplete('confirm_crew') &&
          isItemComplete('transport')
        }
        visible={hasAnyItem(['confirm_crew', 'assign_positions', 'meeting_point', 'transport', 'accommodation', 'food'])}
      >
        <TileGrid>
          <CrewTile
            isComplete={isItemComplete('confirm_crew') && isItemComplete('assign_positions') && isItemComplete('meeting_point')}
            onPress={() => handleTilePress('confirm_crew', 'crew_management')}
            progress={{
              current: [isItemComplete('confirm_crew'), isItemComplete('assign_positions'), isItemComplete('meeting_point')].filter(Boolean).length,
              total: 3,
            }}
            crewNames={crewNames}
            isConfirmed={isItemComplete('confirm_crew')}
          />
          <LogisticsTile
            isComplete={isItemComplete('transport') && isItemComplete('accommodation') && isItemComplete('food')}
            onPress={() => handleTilePress('transport', 'logistics_planner')}
            progress={{
              current: [isItemComplete('transport'), isItemComplete('accommodation'), isItemComplete('food')].filter(Boolean).length,
              total: 3,
            }}
            transportNotes={completions['transport']?.notes}
            accommodationNotes={completions['accommodation']?.notes}
            foodNotes={completions['food']?.notes}
          />
        </TileGrid>
        <AcceptedSuggestionBannerList
          suggestions={acceptedForCategory('crew')}
          onDismiss={dismissSuggestion}
        />
      </TileSection>

      {/* ================================================================ */}
      {/* SECTION: STRATEGY                                               */}
      {/* ================================================================ */}
      <TileSection
        title="Strategy"
        subtitle="Wind, start, upwind approach, and tide"
        isComplete={
          isItemComplete('strategy_wind_forecast') &&
          isItemComplete('strategy_start_plan') &&
          isItemComplete('strategy_upwind_approach') &&
          isItemComplete('strategy_current_tide')
        }
        visible={hasAnyItem(['strategy_wind_forecast', 'strategy_start_plan', 'strategy_upwind_approach', 'strategy_current_tide'])}
      >
        <TileGrid>
          <WindStrategyTile
            isComplete={isItemComplete('strategy_wind_forecast')}
            onPress={() => handleTilePress('strategy_wind_forecast', 'wind_shift_strategy')}
            direction={intentions?.strategyNotes?.['wind.direction']}
            shiftPattern={intentions?.strategyNotes?.['upwind.shiftStrategy']}
          />
          <StartStrategyTile
            isComplete={isItemComplete('strategy_start_plan')}
            onPress={() => handleTilePress('strategy_start_plan', 'start_planner')}
            favoredEnd={intentions?.strategyNotes?.['start.favoredEnd']}
            approach={intentions?.strategyNotes?.['start.timingApproach']}
          />
          <UpwindTile
            isComplete={isItemComplete('strategy_upwind_approach')}
            onPress={() => handleTilePress('strategy_upwind_approach', 'first_beat_strategy')}
            favoredSide={intentions?.strategyNotes?.['upwind.favoredTack']}
            shiftExpectation={intentions?.strategyNotes?.['upwind.shiftStrategy']}
          />
          <TideStrategyTile
            isComplete={isItemComplete('strategy_current_tide')}
            onPress={() => handleTilePress('strategy_current_tide', 'tide_strategy')}
            tideState={intentions?.strategyNotes?.['tide.flow']}
            strategy={intentions?.strategyNotes?.['tide.favoredSide']}
          />
        </TileGrid>
        <AcceptedSuggestionBannerList
          suggestions={acceptedForCategory('strategy')}
          onDismiss={dismissSuggestion}
        />
      </TileSection>

      {/* ================================================================ */}
      {/* SECTION: TACTICS (conditional)                                   */}
      {/* ================================================================ */}
      {hasAnyItem(['review_tactics']) && (
        <TileSection
          title="Tactics"
          subtitle="Crew tactical briefing"
          isComplete={isItemComplete('review_tactics')}
        >
          <TileGrid>
            <TacticsTile
              isComplete={isItemComplete('review_tactics')}
              onPress={() => handleTilePress('review_tactics', 'tactics_review_wizard')}
            />
          </TileGrid>
        </TileSection>
      )}

      {/* ================================================================ */}
      {/* RACE-TYPE SPECIFIC TILES                                        */}
      {/* ================================================================ */}

      {/* Distance Racing */}
      {raceType === 'distance' && (
        <TileSection
          title="Distance Racing"
          subtitle="Navigation, watches, and offshore prep"
          isComplete={
            isItemComplete('review_chart') &&
            isItemComplete('watch_schedule') &&
            isItemComplete('offshore_safety') &&
            isItemComplete('weather_routing')
          }
        >
          <TileGrid>
            <NavigationTile
              isComplete={isItemComplete('review_chart')}
              onPress={() => handleTilePress('review_chart', 'course_map')}
            />
            <WatchScheduleTile
              isComplete={isItemComplete('watch_schedule')}
              onPress={() => handleTilePress('watch_schedule', 'watch_schedule')}
            />
            <OffshoreSafetyTile
              isComplete={isItemComplete('offshore_safety')}
              onPress={() => {
                if (!isItemComplete('offshore_safety')) toggleItem('offshore_safety');
              }}
            />
            <WeatherRoutingTile
              isComplete={isItemComplete('weather_routing')}
              onPress={() => {
                if (!isItemComplete('weather_routing')) toggleItem('weather_routing');
              }}
            />
          </TileGrid>
        </TileSection>
      )}

      {/* Match Racing */}
      {raceType === 'match' && (
        <TileSection
          title="Match Racing"
          subtitle="Opponent analysis and rules review"
          isComplete={
            isItemComplete('opponent_review') &&
            isItemComplete('prestart_tactics') &&
            isItemComplete('rules_review_18')
          }
        >
          <TileGrid>
            <OpponentTile
              isComplete={isItemComplete('opponent_review')}
              onPress={() => handleTilePress('opponent_review', 'opponent_review')}
            />
            <PreStartTacticsTile
              isComplete={isItemComplete('prestart_tactics')}
              onPress={() => handleTilePress('prestart_tactics', 'prestart_tactics')}
            />
            <RulesTile
              isComplete={isItemComplete('rules_review_18') && isItemComplete('rules_review_31')}
              onPress={() => handleTilePress('rules_review_18', 'rules_review')}
            />
          </TileGrid>
        </TileSection>
      )}

      {/* Team Racing */}
      {raceType === 'team' && !isTeamRace && (
        <TileSection
          title="Team Racing"
          subtitle="Team coordination and combo plays"
          isComplete={
            isItemComplete('team_boat_assignments') &&
            isItemComplete('combo_plays') &&
            isItemComplete('comm_signals')
          }
        >
          <TileGrid>
            <TeamSetupTile
              isComplete={isItemComplete('team_boat_assignments')}
              onPress={() => handleTilePress('team_boat_assignments', 'team_assignments')}
            />
            <ComboPlaysTile
              isComplete={isItemComplete('combo_plays')}
              onPress={() => handleTilePress('combo_plays', 'combo_plays')}
            />
            <TeamCommsTile
              isComplete={isItemComplete('comm_signals')}
              onPress={() => handleTilePress('comm_signals', undefined)}
            />
          </TileGrid>
        </TileSection>
      )}


      {/* Sail Picker Modal */}
      <Modal
        visible={showSailPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSailPicker(false)}
      >
        <View style={styles.sailPickerContainer}>
          <View style={styles.sailPickerHeader}>
            <TouchableOpacity onPress={() => setShowSailPicker(false)}>
              <Text style={styles.sailPickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.sailPickerTitle}>Select Sail</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.sailPickerContent}>
            <Text style={styles.sailPickerSubtitle}>
              Choose which sail to inspect
            </Text>
            {boatSails.map((sail) => (
              <TouchableOpacity
                key={sail.equipment_id}
                style={styles.sailPickerItem}
                onPress={() => handleSailSelect(sail)}
              >
                <View style={styles.sailPickerItemContent}>
                  <Text style={styles.sailPickerItemName}>
                    {sail.name || sail.sail_type || 'Sail'}
                  </Text>
                  <Text style={styles.sailPickerItemMeta}>
                    {sail.sailmaker ? `${sail.sailmaker} • ` : ''}
                    {sail.condition_score != null ? `${sail.condition_score}% condition` : 'Not inspected'}
                  </Text>
                </View>
                <Sailboat size={20} color="#007AFF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Sail Inspection Modal */}
      {selectedSail && userBoat && (
        <Modal
          visible={showSailInspection}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSailInspection(false)}
        >
          <SailInspectionWizard
            equipmentId={selectedSail.equipment_id}
            boatId={userBoat.id}
            sailName={selectedSail.name || selectedSail.sail_type || 'Sail'}
            inspectionType="pre_race"
            onComplete={handleSailInspectionComplete}
            onCancel={() => {
              setShowSailInspection(false);
              setSelectedSail(null);
            }}
          />
        </Modal>
      )}

      {/* Full Wizard Modals */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'safety_gear' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <SafetyGearWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'rigging_inspection' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <RiggingInspectionWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'watch_schedule' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <WatchScheduleWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            raceStartTime={race.startTime}
            raceDate={race.date}
            raceDurationHours={
              // Use explicit time_limit_hours if set, otherwise sensible defaults by race type
              race.time_limit_hours ? Number(race.time_limit_hours) :
              raceType === 'distance' ? 8 : raceType === 'match' ? 1.5 : 2
            }
            raceName={race.name}
            raceDistance={race.total_distance_nm ? Number(race.total_distance_nm) : undefined}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'forecast_check' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <ForecastCheckWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            venue={venueForForecast}
            raceDate={race.date}
            raceName={race.name}
            raceStartTime={race.startTime}
            raceDurationHours={
              // Use explicit time_limit_hours if set, otherwise sensible defaults by race type
              race.time_limit_hours ? Number(race.time_limit_hours) :
              raceType === 'distance' ? 8 : raceType === 'match' ? 1.5 : 2
            }
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Document Review Wizard (NOR) */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'nor_review' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <DocumentReviewWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            venue={venueForForecast}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Document Review Wizard (SI) */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'si_review' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <DocumentReviewWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            venue={venueForForecast}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Course Map Wizard */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'course_map' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <CourseMapWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            course={race.course}
            venue={venueForForecast}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Pre-Race Briefing Wizard */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'pre_race_briefing' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <PreRaceBriefingWizard
            item={activeTool}
            regattaId={race.id}
            boatId={userBoat?.id}
            raceName={race.name}
            raceDate={race.date}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Start Planner Wizard */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'start_planner' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <StartPlannerWizard
            item={activeTool}
            regattaId={race.id}
            boatId={userBoat?.id}
            venue={venueForForecast}
            raceDate={race.date}
            raceName={race.name}
            raceStartTime={race.startTime}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
            onStrategyCapture={handleStrategyCapture}
          />
        </Modal>
      )}

      {/* Wind Shift Strategy Wizard */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'wind_shift_strategy' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <WindShiftStrategyWizard
            item={activeTool}
            regattaId={race.id}
            boatId={userBoat?.id}
            venue={venueForForecast}
            raceDate={race.date}
            raceName={race.name}
            raceStartTime={race.startTime}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
            onStrategyCapture={handleStrategyCapture}
          />
        </Modal>
      )}

      {/* First Beat Strategy Wizard */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'first_beat_strategy' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <FirstBeatStrategyWizard
            item={activeTool}
            regattaId={race.id}
            boatId={userBoat?.id}
            venue={venueForForecast}
            raceDate={race.date}
            raceName={race.name}
            raceStartTime={race.startTime}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
            onStrategyCapture={handleStrategyCapture}
          />
        </Modal>
      )}

      {/* Tide Strategy Wizard */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'tide_strategy' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <TideStrategyWizard
            item={activeTool}
            regattaId={race.id}
            boatId={userBoat?.id}
            venue={venueForForecast}
            raceDate={race.date}
            raceName={race.name}
            raceStartTime={race.startTime}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
            onStrategyCapture={handleStrategyCapture}
          />
        </Modal>
      )}

      {/* Rig Tuning Wizard */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'rig_tuning_wizard' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <RigTuningWizard
            item={activeTool}
            regattaId={race.id}
            boatId={userBoat?.id}
            classId={userBoat?.class_id}
            boatClass={userBoat?.boat_class?.name}
            venue={venueForForecast}
            raceDate={race.date}
            existingIntention={rigTuningExistingIntention}
            updateRigIntentions={updateRigIntentions}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Sail Selection Wizard */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'sail_selection_wizard' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <SailSelectionWizard
            item={activeTool}
            regattaId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Tactics Review Wizard */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'tactics_review_wizard' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <TacticsReviewWizard
            item={activeTool}
            regattaId={race.id}
            boatId={userBoat?.id}
            venueId={venueId}
            venueName={venueName}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Interactive Checklist Modal */}
      {activeTool?.toolType === 'interactive' && activeTool.toolId === 'electronics_checklist' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <ElectronicsChecklist
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Position Assignment Modal */}
      {activeTool?.toolType === 'interactive' && activeTool.toolId === 'position_assignment' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <PositionAssignmentPanel
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            classId={userBoat?.class_id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Meeting Point Modal */}
      {activeTool?.toolType === 'interactive' && activeTool.toolId === 'meeting_point' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <MeetingPointPicker
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Crew Management Wizard Modal */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'crew_management' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <CrewManagementWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            classId={userBoat?.class_id}
            onComplete={async () => {
              // Mark all crew items complete
              if (!isItemComplete('confirm_crew')) toggleItem('confirm_crew');
              if (!isItemComplete('assign_positions')) toggleItem('assign_positions');
              if (!isItemComplete('meeting_point')) toggleItem('meeting_point');
              // Refresh crew names for tile display
              try {
                const crew = await crewManagementService.getAllCrew(user!.id);
                setCrewNames(crew.filter((c) => c.status === 'active').map((c) => c.name));
              } catch { /* ignore */ }
              setActiveTool(null);
            }}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Logistics Planner Wizard Modal */}
      {activeTool?.toolType === 'full_wizard' && activeTool.toolId === 'logistics_planner' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <LogisticsPlannerWizard
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={() => setActiveTool(null)}
            onCancel={handleToolCancel}
            onToggleItem={toggleItem}
            onCompleteItem={completeItem}
            onUncompleteItem={uncompleteItem}
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
        </Modal>
      )}

      {/* Generic Interactive Checklist Modal (for other interactive items) */}
      {activeTool?.toolType === 'interactive' &&
       activeTool.toolId !== 'electronics_checklist' &&
       activeTool.toolId !== 'position_assignment' &&
       activeTool.toolId !== 'meeting_point' && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleToolCancel}
        >
          <InteractiveChecklist
            item={activeTool}
            raceEventId={race.id}
            boatId={userBoat?.id}
            onComplete={handleToolComplete}
            onCancel={handleToolCancel}
          />
        </Modal>
      )}

      {/* Quick Tips Panel (bottom sheet, not modal) */}
      <QuickTipsPanel
        item={activeTool ?? { id: '', label: '', priority: 'normal' }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
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
    backgroundColor: `${IOS_COLORS.teal}12`,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.teal,
    gap: 6,
  },
  focusIntentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusIntentLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  },
  focusIntentMeta: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },

  // Race Intention Card (copied from Connect tab or manually set)
  raceIntentionCard: {
    backgroundColor: `${IOS_COLORS.blue}12`,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.blue,
    gap: 6,
  },
  raceIntentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  raceIntentionLabel: {
    fontSize: 12,
    fontWeight: '600',
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

  // Carryover
  carryoverContainer: {
    backgroundColor: `${IOS_COLORS.orange}15`,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.orange,
    gap: 8,
    marginBottom: 8,
  },
  carryoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  carryoverLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },
  carryoverSource: {
    fontSize: 11,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },

  // Checklist - Simple row layout (no card backgrounds)
  checklistContainer: {
    gap: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistMainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checklistItemContent: {
    flex: 1,
    gap: 2,
  },
  // Square checkbox (22x22 with rounded corners)
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checklistLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  checklistLabelDone: {
    color: IOS_COLORS.gray,
    textDecorationLine: 'line-through',
  },
  completedByText: {
    fontSize: 11,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Action badge - circular icon button
  actionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadgeText: {
    color: IOS_COLORS.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  // Edit badge - orange pencil for completed items with tools
  editBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.orange}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Learn badge - purple book icon button
  learnBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${IOS_COLORS.purple}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
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
  sailPickerContainer: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  sailPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  sailPickerCancel: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  sailPickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  sailPickerContent: {
    padding: 16,
  },
  sailPickerSubtitle: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 16,
  },
  sailPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 12,
    marginBottom: 10,
  },
  sailPickerItemContent: {
    flex: 1,
  },
  sailPickerItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  sailPickerItemMeta: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
});

export default DaysBeforeContent;
