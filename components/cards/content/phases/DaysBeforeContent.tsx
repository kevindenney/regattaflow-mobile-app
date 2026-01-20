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

import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, TouchableOpacity, Modal, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
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
  ChevronRight,
  Clock,
  Wind,
  Waves,
} from 'lucide-react-native';

import { CardRaceData, getTimeContext } from '../../types';
import { useRaceChecklist, ChecklistItemWithState } from '@/hooks/useRaceChecklist';
import { useTeamRaceEntry, useTeamChecklist } from '@/hooks';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { useAuth } from '@/providers/AuthProvider';
import { sailorBoatService, SailorBoat } from '@/services/SailorBoatService';
import { SailInspectionWizard } from '@/components/sail-inspection';
import { QuickTipsPanel } from '@/components/checklist-tools/QuickTipsPanel';
import { SafetyGearWizard, RiggingInspectionWizard, WatchScheduleWizard, ForecastCheckWizard, DocumentReviewWizard, CourseMapWizard, PreRaceBriefingWizard } from '@/components/checklist-tools/wizards';
import { ElectronicsChecklist } from '@/components/checklist-tools/checklists/ElectronicsChecklist';
import { InteractiveChecklist } from '@/components/checklist-tools/InteractiveChecklist';
import { PositionAssignmentPanel, MeetingPointPicker } from '@/components/checklist-tools/crew';
import { hasTool } from '@/lib/checklists/toolRegistry';
import { CATEGORY_CONFIG, ChecklistCategory } from '@/types/checklists';
import type { RaceType } from '@/types/raceEvents';
import { getLearningLinks, getLearningBrief, getItemCategory, getLessonId, getLearningForItem } from '@/data/learningLinks';
import { useUserSettings } from '@/hooks/useUserSettings';

// Team collaboration components
import {
  TeamSetupCard,
  TeamMembersList,
  TeamInviteModal,
  SharedChecklistItem,
} from '@/components/team';

// Pre-race sharing
import { ShareWithTeamSection } from './ShareWithTeamSection';

// Race documents display (with club document inheritance)
import { RaceDocumentsDisplay } from '@/components/races/RaceDocumentsDisplay';
import { useRaceDocuments } from '@/hooks/useRaceDocuments';

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
 * Render a single checklist item
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
            onPress={onLearnPress}
            onLongPress={onShowTooltip}
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
          <Pressable
            style={styles.actionBadge}
            onPress={onAction}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {getToolIcon(item.toolType)}
          </Pressable>
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
 * Render a category section with its items
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
}

function RetrospectiveChecklistSection({
  raceType,
  phase,
  completions,
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

  // State for team invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);

  // State for sail inspection (legacy - kept for specific sail inspection)
  const [showSailInspection, setShowSailInspection] = useState(false);
  const [userBoat, setUserBoat] = useState<SailorBoat | null>(null);

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

  // Use venueCoordinates (from enrichment) or fall back to metadata coordinates
  const coords = venueCoordinates || metadataCoords;

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

  // Fetch user's primary boat for sail inspection
  // Use useFocusEffect to refresh when returning from adding a boat
  // Note: sailor_boats.sailor_id = auth.uid() (user.id), not sailor_profiles.id
  useFocusEffect(
    useCallback(() => {
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
    }, [user?.id])
  );

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
    isLoading,
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

  // Handle checklist item actions (launch tools)
  const handleItemAction = useCallback((itemId: string) => {
    // Special handling for sails - requires boat
    if (itemId === 'sails') {
      if (userBoat) {
        setShowSailInspection(true);
      } else {
        Alert.alert(
          'Add a Boat First',
          'To inspect your sails, you need to add a boat to your profile.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Boat',
              onPress: () => router.push('/(tabs)/boat/add'),
            },
          ]
        );
      }
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

  // Handle learning module press - navigate to Race Preparation Mastery course with specific lesson
  const handleLearnPress = useCallback((item: ChecklistItemWithState) => {
    // Get lesson ID from registry for deep-linking to specific lesson
    const lessonId = getLessonId(item.id);
    const academyLinks = getLearningLinks(item.id);
    const category = getItemCategory(item.id) || item.category;

    // Map category to module ID in Race Preparation Mastery course
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
    const courseId = academyLinks?.courseId || 'race-preparation-mastery';

    // Navigate directly to lesson player if we have a lessonId, otherwise go to course overview
    if (lessonId) {
      router.push({
        pathname: '/(tabs)/learn/[courseId]/player',
        params: { courseId, lessonId },
      });
    } else {
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

  // Time context (handles past and future races)
  const timeContext = getTimeContext(race.date, race.startTime);

  // Race preparation data (for historical view)
  const { intentions, isLoading: isPreparationLoading } = useRacePreparation({
    regattaId: race.id,
  });

  // Race documents (with inherited club documents)
  const {
    displayDocuments,
    isLoading: isDocumentsLoading,
  } = useRaceDocuments({
    raceId: race.id,
    includeClubDocs: true,
  });

  // Categories to show based on expansion state
  const visibleCategories = useMemo(() => {
    if (isExpanded) {
      return categories;
    }
    // In collapsed state, show main categories only
    const mainCategories: ChecklistCategory[] = [
      'equipment',
      'safety',
      'crew',
      'team_coordination',
      'tactics',
    ];
    return categories.filter((cat) => mainCategories.includes(cat));
  }, [categories, isExpanded]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // For past races, show historical data view
  if (timeContext.isPast) {
    // Get historical data summaries
    const categorySummaries = summarizeChecklistCompletions(
      intentions.checklistCompletions,
      'days_before',
      raceType
    );
    const forecastSummary = formatForecastSummary(intentions.forecastCheck);
    const forecastEvolution = getForecastEvolution(intentions.forecastCheck);
    const arrivalTime = formatArrivalTime(intentions);
    const completedItems = getCompletedItems(
      intentions.checklistCompletions,
      'days_before',
      raceType
    );
    const hasData = hasPhaseData(intentions, 'days_before');

    if (isPreparationLoading) {
      return (
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading preparation data...</Text>
          </View>
        </View>
      );
    }

    // Format race conditions from race object (always available)
    const windData = race.wind;
    const tideData = race.tide;
    const hasRaceConditions = !!(windData || tideData);

    // Format wind summary
    const windSummary = windData
      ? `${windData.direction || ''} ${windData.speedMin || 0}-${windData.speedMax || 0}kt`.trim()
      : null;

    // Format tide summary
    const tideSummary = tideData?.state
      ? `${tideData.state.charAt(0).toUpperCase() + tideData.state.slice(1)}${tideData.height ? ` (${tideData.height}m)` : ''}`
      : null;

    // Format time badge text - handle "Completed" case specially
    const timeBadgeText = timeContext.value === 'Completed'
      ? 'Completed'
      : `${timeContext.value} ago`;

    return (
      <View style={styles.container}>
        {/* Subtle Time Badge */}
        <View style={styles.historicalBadge}>
          <Clock size={12} color={IOS_COLORS.gray} />
          <Text style={styles.historicalBadgeText}>
            {timeBadgeText}
          </Text>
        </View>

        <View style={styles.historicalContent}>
          {/* Race Conditions - Always show from race object */}
          {hasRaceConditions && (
            <HistoricalSummaryCard
              icon={CloudSun}
              iconColor={IOS_COLORS.blue}
              title="Race Conditions"
              expandable={false}
              summary={
                <View style={styles.conditionsRow}>
                  {windSummary && (
                    <View style={styles.conditionItem}>
                      <Wind size={14} color={IOS_COLORS.secondaryLabel} />
                      <Text style={styles.conditionText}>{windSummary}</Text>
                    </View>
                  )}
                  {tideSummary && (
                    <View style={styles.conditionItem}>
                      <Waves size={14} color={IOS_COLORS.secondaryLabel} />
                      <Text style={styles.conditionText}>{tideSummary}</Text>
                    </View>
                  )}
                </View>
              }
            />
          )}

          {/* Race Info - Venue, Type, Date */}
          <HistoricalSummaryCard
            icon={Compass}
            iconColor={IOS_COLORS.green}
            title="Race Info"
            expandable={false}
            summary={
              <View style={styles.raceInfoContainer}>
                {race.venue && (
                  <DataStatement label="Venue" value={race.venue} />
                )}
                <DataStatement
                  label="Type"
                  value={raceType.charAt(0).toUpperCase() + raceType.slice(1)}
                />
                <DataStatement
                  label="Date"
                  value={new Date(race.date).toLocaleDateString()}
                />
              </View>
            }
          />

          {/* User-Captured Preparation Data (if any) */}
          {hasData && (
            <>
              {/* Checklist Completion Summary */}
              {categorySummaries.length > 0 && (
                <HistoricalSummaryCard
                  icon={ListChecks}
                  iconColor={IOS_COLORS.blue}
                  title="Your Preparation"
                  summary={
                    <CompletionMeter
                      categories={categorySummaries.map((cat) => ({
                        id: cat.id,
                        name: cat.name,
                        completed: cat.completed,
                        total: cat.total,
                        color: cat.color,
                      }))}
                      variant="compact"
                    />
                  }
                  details={
                    completedItems.length > 0 ? (
                      <View style={styles.historicalDetailsList}>
                        <Text style={styles.historicalDetailsHeader}>
                          Completed Items ({completedItems.length})
                        </Text>
                        {completedItems.slice(0, 10).map((item) => (
                          <View key={item.id} style={styles.historicalDetailItem}>
                            <Text style={styles.historicalDetailLabel}>
                              {item.label}
                            </Text>
                            <Text style={styles.historicalDetailSubtext}>
                              {formatRelativeTime(item.completedAt)}
                            </Text>
                          </View>
                        ))}
                        {completedItems.length > 10 && (
                          <Text style={styles.historicalMoreItems}>
                            +{completedItems.length - 10} more items
                          </Text>
                        )}
                      </View>
                    ) : undefined
                  }
                />
              )}

              {/* Weather Forecast Summary - User captured */}
              {forecastSummary && (
                <HistoricalSummaryCard
                  icon={CloudSun}
                  iconColor={IOS_COLORS.blue}
                  title="Your Forecast Checks"
                  summary={
                    <View style={styles.historicalSummaryRow}>
                      <Text style={styles.historicalSummaryText}>
                        {forecastSummary}
                      </Text>
                      {forecastEvolution.snapshotCount > 1 && (
                        <Text style={styles.historicalSummaryMeta}>
                          {forecastEvolution.snapshotCount} checks
                        </Text>
                      )}
                    </View>
                  }
                  details={
                    forecastEvolution.latestAnalysis ? (
                      <View style={styles.historicalDetailsList}>
                        <Text style={styles.historicalDetailsHeader}>
                          Forecast Evolution
                        </Text>
                        <Text style={styles.historicalDetailText}>
                          {forecastEvolution.latestAnalysis}
                        </Text>
                      </View>
                    ) : undefined
                  }
                />
              )}

              {/* Arrival Time Intention */}
              {arrivalTime && (
                <HistoricalSummaryCard
                  icon={Car}
                  iconColor={IOS_COLORS.green}
                  title="Arrival Plan"
                  expandable={false}
                  summary={
                    <Text style={styles.historicalSummaryText}>{arrivalTime}</Text>
                  }
                />
              )}
            </>
          )}

          {/* Retrospective Checklist - Show all items with completed/not status */}
          <RetrospectiveChecklistSection
            raceType={raceType}
            phase="days_before"
            completions={intentions.checklistCompletions}
          />

          {/* Review Button */}
          <Pressable
            style={({ pressed }) => [
              styles.reviewButton,
              pressed && styles.reviewButtonPressed,
            ]}
            onPress={onSwitchToReview}
          >
            <Clock size={18} color={IOS_COLORS.blue} />
            <Text style={styles.reviewButtonText}>Review your race</Text>
            <ChevronRight size={16} color={IOS_COLORS.gray} />
          </Pressable>
        </View>
      </View>
    );
  }

  if (isLoading) {
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
          {/* Time Context */}
          <View style={styles.timeContext}>
            <Text style={styles.timeContextValue}>{timeContext.value}</Text>
            {timeContext.label && (
              <Text style={styles.timeContextLabel}>{timeContext.label}</Text>
            )}
          </View>

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
        {/* Time Context */}
        <View style={styles.timeContext}>
          <Text style={styles.timeContextValue}>{timeContext.value}</Text>
          {timeContext.label && (
            <Text style={styles.timeContextLabel}>{timeContext.label}</Text>
          )}
        </View>

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

        {/* Progress Summary */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            {effectiveCompleted} / {effectiveTotal} items completed
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${effectiveProgress * 100}%` },
              ]}
            />
          </View>
        </View>

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
      {/* Time Context */}
      <View style={styles.timeContext}>
        <Text style={styles.timeContextValue}>{timeContext.value}</Text>
        {timeContext.label && (
          <Text style={styles.timeContextLabel}>{timeContext.label}</Text>
        )}
      </View>

      {/* Race Type Badge (for non-fleet races) */}
      {raceType !== 'fleet' && (
        <View style={styles.raceTypeBadge}>
          <Text style={styles.raceTypeBadgeText}>
            {raceType.charAt(0).toUpperCase() + raceType.slice(1)} Racing
          </Text>
        </View>
      )}

      {/* Category Sections */}
      {visibleCategories.map((category) => {
        const items = itemsByCategory[category];
        if (!items || items.length === 0) return null;

        return (
          <CategorySection
            key={category}
            category={category}
            items={items}
            onToggle={toggleItem}
            onItemAction={handleItemAction}
            onLearnPress={handleLearnPress}
            onShowTooltip={handleShowTooltip}
            actionItems={actionItems}
            showLearning={userSettings.showQuickTips}
          />
        );
      })}

      {/* Race Documents Section (with inherited club SSI) */}
      {!isDocumentsLoading && (displayDocuments.raceDocuments.length > 0 || displayDocuments.clubDocuments.length > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={16} color={IOS_COLORS.blue} />
            <Text style={styles.sectionLabel}>DOCUMENTS</Text>
          </View>
          <RaceDocumentsDisplay
            raceDocuments={displayDocuments.raceDocuments}
            clubDocuments={displayDocuments.clubDocuments}
            showEmptyState={false}
            compact={!isExpanded}
          />
        </View>
      )}

      {/* Share with Team Section */}
      <ShareWithTeamSection race={race} />

      {/* Progress Summary */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>
          {completedCount} / {totalCount} items completed
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Sail Inspection Modal */}
      {userBoat && (
        <Modal
          visible={showSailInspection}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSailInspection(false)}
        >
          <SailInspectionWizard
            equipmentId={userBoat.id}
            boatId={userBoat.id}
            sailName={userBoat.name || 'Main Sail'}
            inspectionType="pre_race"
            onComplete={handleSailInspectionComplete}
            onCancel={() => setShowSailInspection(false)}
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
            raceDurationHours={race.time_limit_hours ? Number(race.time_limit_hours) : undefined}
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
            raceDurationHours={race.time_limit_hours ? Number(race.time_limit_hours) : undefined}
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
            raceEventId={race.id}
            boatId={userBoat?.id}
            raceName={race.name}
            raceDate={race.date}
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
    gap: 16,
  },

  // Time Context
  timeContext: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  timeContextValue: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },
  timeContextLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
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

  // Section
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

  // Checklist
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
    color: IOS_COLORS.green,
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
  learnBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${IOS_COLORS.purple}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },

  // Progress
  progressContainer: {
    gap: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.green,
    borderRadius: 2,
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
});

export default DaysBeforeContent;
