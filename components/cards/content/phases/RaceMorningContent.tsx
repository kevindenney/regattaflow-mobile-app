/**
 * RaceMorningContent - Race Morning Phase Content
 *
 * Content shown when selectedPhase === 'race_morning'
 * Now uses data-driven checklists based on race type.
 *
 * Includes:
 * - Final weather check with sparklines
 * - Rig tune recommendations
 * - Sail selection
 * - Strategy Brief (condensed from 5 strategy cards, with drill-down)
 * - Race-type-specific checklist items
 */

import { NudgeList } from '@/components/checklist-tools/NudgeBanner';
import { QuickTipsPanel } from '@/components/checklist-tools/QuickTipsPanel';
import { FirstBeatStrategyWizard } from '@/components/checklist-tools/wizards/FirstBeatStrategyWizard';
import { ForecastCheckWizard } from '@/components/checklist-tools/wizards/ForecastCheckWizard';
import { RigTuningWizard } from '@/components/checklist-tools/wizards/RigTuningWizard';
import { RouteBriefingWizard } from '@/components/checklist-tools/wizards/RouteBriefingWizard';
import { SailSelectionWizard } from '@/components/checklist-tools/wizards/SailSelectionWizard';
import { StartPlannerWizard } from '@/components/checklist-tools/wizards/StartPlannerWizard';
import { TacticsReviewWizard } from '@/components/checklist-tools/wizards/TacticsReviewWizard';
import { TideStrategyWizard } from '@/components/checklist-tools/wizards/TideStrategyWizard';
import { WeatherRoutingWizard } from '@/components/checklist-tools/wizards/WeatherRoutingWizard';
import { WindShiftStrategyWizard } from '@/components/checklist-tools/wizards/WindShiftStrategyWizard';
import type { DetailCardType } from '@/constants/navigationAnimations';
import { usePersonalizedNudges } from '@/hooks/useAdaptiveLearning';
import { useUserSettings } from '@/hooks/useUserSettings';
import {
  BookOpen,
  Car,
  ChevronRight,
  Clock,
  CloudSun,
  Compass,
  FileText,
  Info,
  ListChecks,
  Shield,
  Target,
  Users,
  Waves,
  Wind,
  Wrench,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { TinySparkline } from '@/components/shared/charts';
import { ChecklistItemWithState, useRaceChecklist } from '@/hooks/useRaceChecklist';
import { useRaceTuningRecommendation } from '@/hooks/useRaceTuningRecommendation';
import { useRaceWeatherForecast } from '@/hooks/useRaceWeatherForecast';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { ChecklistCategory } from '@/types/checklists';
import type { RaceType } from '@/types/raceEvents';
import { CardRaceData, getTimeContext } from '../../types';
import { ShareWithTeamSection } from './ShareWithTeamSection';
import { StrategyBrief } from './StrategyBrief';

// Historical view components
import {
  HistoricalSummaryCard,
  CompletionMeter,
  DataStatement,
} from './historical';
import {
  summarizeChecklistCompletions,
  formatSailSelectionCompact,
  formatRigSettingsCompact,
  getStrategyIntention,
  getStrategyNotesCount,
  formatForecastSummary,
  hasPhaseData,
} from '@/lib/historical/transformIntentions';
import { getItemsGroupedByCategory, getCategoriesForPhase } from '@/lib/checklists/checklistConfig';
import { CATEGORY_CONFIG } from '@/types/checklists';

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
};

interface RaceMorningContentProps {
  race: CardRaceData;
  /** Callback to open detail bottom sheet for a specific type */
  onOpenDetail?: (type: DetailCardType) => void;
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
 * Simplify rig setting label
 */
function simplifyLabel(label: string): string {
  const shortenings: Record<string, string> = {
    'Upper Shrouds': 'Uppers',
    'Lower Shrouds': 'Lowers',
    'Forestay Length': 'Forestay',
    'Forestay Tension': 'Forestay',
    'Mast Rake': 'Rake',
    'Spreader Sweep': 'Spreaders',
    'Backstay Tension': 'Backstay',
  };
  return shortenings[label] || label;
}

/**
 * Simplify rig setting value
 */
function simplifyValue(value: string): string {
  if (!value) return '';

  const extractions = [
    { pattern: /Loos(?:\s+PT-\d+\w*)?\s*(\d+)/i, format: (m: RegExpMatchArray) => `${m[1]}` },
    { pattern: /^(Firm|Light|Moderate|Tight|Loose|Medium|Max|Min)/i, format: (m: RegExpMatchArray) => m[1] },
    { pattern: /(\d+(?:[.-]\d+)?)\s*(?:degrees?|°)/i, format: (m: RegExpMatchArray) => `${m[1]}°` },
    { pattern: /(\d+(?:\.\d+)?)\s*cm/i, format: (m: RegExpMatchArray) => `${m[1]}cm` },
    { pattern: /(?:minus\s+)?(\d+)\s*turns?/i, format: (m: RegExpMatchArray) => `${m[1]}t` },
    { pattern: /^(\d+(?:[.-]\d+)?)/i, format: (m: RegExpMatchArray) => m[1] },
  ];

  for (const { pattern, format } of extractions) {
    const match = value.match(pattern);
    if (match) return format(match);
  }

  return value.split(/\s+/).slice(0, 2).join(' ') || '—';
}

/**
 * Format tide state
 */
function formatTideState(state: string): string {
  const stateMap: Record<string, string> = {
    flooding: 'Flood',
    ebbing: 'Ebb',
    slack: 'Slack',
    rising: 'Rising',
    falling: 'Falling',
    high: 'High',
    low: 'Low',
  };
  return stateMap[state] || state;
}

/**
 * Render a single checklist item
 */
function ChecklistItem({
  item,
  onToggle,
  onOpenTool,
  showQuickTips = true,
}: {
  item: ChecklistItemWithState;
  onToggle: () => void;
  onOpenTool?: () => void;
  showQuickTips?: boolean;
}) {
  const isFullWizard = item.toolType === 'full_wizard';
  // Full wizards always show, quick tips only show when enabled in settings
  const hasTool = isFullWizard ||
    (showQuickTips && !!(item.quickTips?.length || item.learningModuleSlug));

  return (
    <Pressable style={styles.checklistItem} onPress={onToggle}>
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
        {item.completion?.completedByName && (
          <Text style={styles.completedByText}>
            ✓ {item.completion.completedByName}
          </Text>
        )}
      </View>
      {hasTool && (
        <Pressable
          style={[styles.toolIndicator, isFullWizard && styles.toolIndicatorWizard]}
          onPress={(e) => {
            e.stopPropagation();
            onOpenTool?.();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isFullWizard ? (
            <Wrench size={18} color={IOS_COLORS.blue} />
          ) : (
            <Info size={18} color={IOS_COLORS.blue} />
          )}
        </Pressable>
      )}
      {item.priority === 'high' && !hasTool && (
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityText}>!</Text>
        </View>
      )}
    </Pressable>
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
      title="Morning Checklist"
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

export function RaceMorningContent({
  race,
  onOpenDetail,
  isExpanded = true,
  onSwitchToReview,
}: RaceMorningContentProps) {
  // Debug: Log race data to trace route_waypoints
  console.log('[RaceMorningContent] race.route_waypoints:', {
    hasWaypoints: !!(race as any).route_waypoints,
    waypointCount: (race as any).route_waypoints?.length ?? 0,
    raceId: race.id,
    raceName: race.name,
  });

  const raceType = getRaceType(race);

  // User settings for quick tips visibility
  const { settings: userSettings } = useUserSettings();

  // State for selected checklist item (for QuickTipsPanel)
  const [selectedItem, setSelectedItem] = useState<ChecklistItemWithState | null>(null);
  // State for full wizard modal
  const [activeWizard, setActiveWizard] = useState<string | null>(null);

  // Build venue object from race data for weather fetching
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
  // The RegionalWeatherService.resolveVenueLocation() looks for venue.coordinates as an object
  const venueForForecast = coords ? {
    id: venueId,
    name: venueName,
    coordinates: {
      lat: coords.lat,
      lng: coords.lng,
    },
    // Also include flat properties for compatibility with various services
    coordinates_lat: String(coords.lat),
    coordinates_lng: String(coords.lng),
  } : null;

  const { data: forecastData } = useRaceWeatherForecast(venueForForecast, race.date, !!venueForForecast);

  // Get rig tuning recommendations
  const windData = race.wind;
  const tideData = race.tide;
  const boatClassName = race.boatClass || (race as any).boat_class || (race as any).class_name;
  const hasWindData = !!(windData?.speedMin || windData?.speedMax);

  const { settings: rigSettings } = useRaceTuningRecommendation({
    className: boatClassName,
    windMin: windData?.speedMin,
    windMax: windData?.speedMax,
    limit: 4,
    enabled: !!boatClassName && hasWindData,
  });

  // Use the data-driven checklist hook for race morning
  const {
    items: checklistItems,
    itemsByCategory,
    categories,
    completedCount,
    totalCount,
    toggleItem,
    isLoading,
  } = useRaceChecklist({
    regattaId: race.id,
    raceName: race.name,
    raceType,
    phase: 'race_morning',
    includeCarryover: false, // No carryover for morning phase
  });

  // Fetch personalized nudges from adaptive learning
  const boatClassId = (race as any).class_id;
  const {
    highPriorityNudges,
    checklistAdditions,
    isLoading: isLoadingNudges,
    recordDelivery,
  } = usePersonalizedNudges(race.id, {
    venueId: venueId || undefined,
    boatClassId: boatClassId || undefined,
    forecast: windData?.speedMin ? {
      windSpeed: windData.speedMin,
      windDirection: 0,
    } : undefined,
    raceType,
  });

  // Combine high priority and checklist nudges for morning display
  const morningNudges = useMemo(() => {
    return [...(highPriorityNudges || []), ...(checklistAdditions || [])]
      .slice(0, 3); // Show max 3 nudges in morning content
  }, [highPriorityNudges, checklistAdditions]);

  // Time context for past race detection
  const timeContext = getTimeContext(race.date, race.startTime);

  // Race preparation data (for historical view)
  const { intentions, isLoading: isPreparationLoading } = useRacePreparation({
    regattaId: race.id,
  });

  // Handle opening the appropriate tool for an item
  const handleOpenTool = useCallback((item: ChecklistItemWithState) => {
    if (item.toolType === 'full_wizard') {
      // Open the full wizard in a modal
      setActiveWizard(item.toolId || null);
      setSelectedItem(item);
    } else {
      // Show quick tips panel
      setSelectedItem(item);
    }
  }, []);

  // Handle wizard completion
  const handleWizardComplete = useCallback(() => {
    if (selectedItem) {
      toggleItem(selectedItem.id);
    }
    setActiveWizard(null);
    setSelectedItem(null);
  }, [selectedItem, toggleItem]);

  // Handle wizard cancel
  const handleWizardCancel = useCallback(() => {
    setActiveWizard(null);
    setSelectedItem(null);
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>
      <View style={styles.container}>
        {/* Weather Section - Tappable to open Conditions detail */}
        {(windData || tideData) && (
          <Pressable
            style={({ pressed }) => [
              styles.section,
              styles.tappableSection,
              pressed && styles.tappableSectionPressed,
            ]}
            onPress={() => onOpenDetail?.('conditions')}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>CONDITIONS</Text>
              {onOpenDetail && (
                <ChevronRight size={16} color={IOS_COLORS.gray} />
              )}
            </View>
            <View style={styles.conditionsGrid}>
              {windData && (
                <View style={styles.conditionRow}>
                  <Wind size={16} color={IOS_COLORS.secondaryLabel} />
                  <Text style={styles.conditionValue}>
                    {windData.direction} {windData.speedMin}–{windData.speedMax}kt
                  </Text>
                  {forecastData?.windForecast && forecastData.windForecast.length >= 2 && (
                    <TinySparkline
                      data={forecastData.windForecast}
                      width={60}
                      height={16}
                      color={IOS_COLORS.secondaryLabel}
                      nowIndex={forecastData.forecastNowIndex}
                    />
                  )}
                </View>
              )}
              {tideData && (
                <View style={styles.conditionRow}>
                  <Waves size={16} color={IOS_COLORS.secondaryLabel} />
                  <Text style={styles.conditionValue}>
                    {formatTideState(tideData.state)}
                    {tideData.height ? ` ${tideData.height.toFixed(1)}m` : ''}
                  </Text>
                  {forecastData?.tideForecast && forecastData.tideForecast.length >= 2 && (
                    <TinySparkline
                      data={forecastData.tideForecast}
                      width={60}
                      height={16}
                      color={IOS_COLORS.secondaryLabel}
                      nowIndex={forecastData.forecastNowIndex}
                      variant="area"
                    />
                  )}
                </View>
              )}
            </View>
          </Pressable>
        )}

        {/* Rig Tune Section - Tappable to open Rig detail */}
        {rigSettings && rigSettings.length > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.section,
              styles.tappableSection,
              pressed && styles.tappableSectionPressed,
            ]}
            onPress={() => onOpenDetail?.('rig')}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>RIG TUNE</Text>
              {onOpenDetail && (
                <ChevronRight size={16} color={IOS_COLORS.gray} />
              )}
            </View>
            <View style={styles.rigGrid}>
              {rigSettings.slice(0, isExpanded ? 4 : 2).map((setting, idx) => (
                <View key={idx} style={styles.rigItem}>
                  <Text style={styles.rigLabel}>{simplifyLabel(setting.label)}</Text>
                  <Text style={styles.rigValue}>{simplifyValue(setting.value)}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        )}

        {/* Strategy Brief Section */}
        {/* Note: We don't pass onOpenStrategyDetail so StrategyBrief uses its built-in Tufte modal */}
        <StrategyBrief
          race={race}
          isExpanded={isExpanded}
        />

        {/* Personalized Nudges from Past Races */}
        {morningNudges.length > 0 && (
          <View style={styles.section}>
            <NudgeList
              nudges={morningNudges}
              title="From Your Past Races"
              channel="checklist"
              maxVisible={3}
              isLoading={isLoadingNudges}
              onRecordDelivery={recordDelivery}
              compact
            />
          </View>
        )}

        {/* Morning Checklist Section - Data-driven by race type */}
        {checklistItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                {raceType === 'team' ? 'TEAM MORNING PREP' :
                  raceType === 'match' ? 'MATCH MORNING PREP' :
                    raceType === 'distance' ? 'PASSAGE PREP' :
                      'MORNING CHECKLIST'}
              </Text>
              <Text style={styles.progressText}>
                {completedCount}/{totalCount}
              </Text>
            </View>
            <View style={styles.checklistContainer}>
              {checklistItems.slice(0, isExpanded ? undefined : 4).map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem(item.id)}
                  onOpenTool={() => handleOpenTool(item)}
                  showQuickTips={userSettings.showQuickTips}
                />
              ))}
            </View>
            {!isExpanded && checklistItems.length > 4 && (
              <Text style={styles.moreItemsText}>
                +{checklistItems.length - 4} more items
              </Text>
            )}
          </View>
        )}

        {/* Share with Team Section */}
        <ShareWithTeamSection race={race} />

      </View>

      {/* QuickTipsPanel for non-wizard items - rendered OUTSIDE container for proper overlay */}
      {selectedItem && selectedItem.toolType !== 'full_wizard' && (
        <QuickTipsPanel
          item={selectedItem}
          visible={!!selectedItem && !activeWizard}
          onComplete={() => {
            if (selectedItem) {
              toggleItem(selectedItem.id);
            }
            setSelectedItem(null);
          }}
          onCancel={() => setSelectedItem(null)}
        />
      )}

      {/* Full Wizard Modal for rig tuning */}
      <Modal
        visible={activeWizard === 'rig_tuning_wizard'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'rig_tuning_wizard' && (
          <RigTuningWizard
            item={selectedItem}
            raceEventId={race.id}
            boatId={(race as any).boat_id}
            boatClass={boatClassName}
            classId={(race as any).class_id}
            wind={windData}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        )}
      </Modal>

      {/* Full Wizard Modal for sail selection */}
      <Modal
        visible={activeWizard === 'sail_selection_wizard'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'sail_selection_wizard' && (
          <SailSelectionWizard
            item={selectedItem}
            raceEventId={race.id}
            boatId={(race as any).boat_id}
            boatClass={boatClassName}
            boatClassId={boatClassId}
            venueId={venueId}
            wind={windData}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        )}
      </Modal>

      {/* Full Wizard Modal for tactics review */}
      <Modal
        visible={activeWizard === 'tactics_review_wizard'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'tactics_review_wizard' && (
          <TacticsReviewWizard
            item={selectedItem}
            raceEventId={race.id}
            venueId={venueId}
            venueName={venueName}
            wind={windData}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        )}
      </Modal>

      {/* Full Wizard Modal for forecast check */}
      <Modal
        visible={activeWizard === 'forecast_check'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'forecast_check' && (
          <ForecastCheckWizard
            item={selectedItem}
            raceEventId={race.id}
            boatId={(race as any).boat_id}
            venue={venueForForecast}
            raceDate={race.date}
            raceName={race.name}
            raceStartTime={race.startTime}
            raceDurationHours={race.time_limit_hours ? Number(race.time_limit_hours) : undefined}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        )}
      </Modal>

      {/* Full Wizard Modal for route briefing */}
      <Modal
        visible={activeWizard === 'route_briefing'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'route_briefing' && (
          <RouteBriefingWizard
            item={selectedItem}
            raceEventId={race.id}
            boatId={(race as any).boat_id}
            raceName={race.name}
            raceDate={race.date}
            venue={venueForForecast}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        )}
      </Modal>

      {/* Full Wizard Modal for wind shift strategy */}
      <Modal
        visible={activeWizard === 'wind_shift_strategy'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'wind_shift_strategy' && (
          <WindShiftStrategyWizard
            item={selectedItem}
            raceEventId={race.id}
            boatId={(race as any).boat_id}
            venue={venueForForecast}
            raceDate={race.date}
            raceName={race.name}
            raceStartTime={race.startTime}
            raceDurationHours={race.time_limit_hours ? Number(race.time_limit_hours) : undefined}
            onCancel={handleWizardCancel}
            onComplete={handleWizardComplete}
          />
        )}
      </Modal>

      {/* Full Wizard Modal for start planner */}
      <Modal
        visible={activeWizard === 'start_planner'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'start_planner' && (
          <StartPlannerWizard
            item={selectedItem}
            raceEventId={race.id}
            boatId={(race as any).boat_id}
            venue={venueForForecast}
            raceDate={race.date}
            raceName={race.name}
            raceStartTime={race.startTime}
            raceDurationHours={race.time_limit_hours ? Number(race.time_limit_hours) : undefined}
            onCancel={handleWizardCancel}
            onComplete={handleWizardComplete}
          />
        )}
      </Modal>

      {/* Full Wizard Modal for first beat strategy */}
      <Modal
        visible={activeWizard === 'first_beat_strategy'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'first_beat_strategy' && (
          <FirstBeatStrategyWizard
            item={selectedItem}
            raceEventId={race.id}
            boatId={(race as any).boat_id}
            venue={venueForForecast}
            raceDate={race.date}
            raceName={race.name}
            raceStartTime={race.startTime}
            raceDurationHours={race.time_limit_hours ? Number(race.time_limit_hours) : undefined}
            onCancel={handleWizardCancel}
            onComplete={handleWizardComplete}
          />
        )}
      </Modal>

      {/* Full Wizard Modal for tide strategy */}
      <Modal
        visible={activeWizard === 'tide_strategy'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'tide_strategy' && (
          <TideStrategyWizard
            item={selectedItem}
            raceEventId={race.id}
            boatId={(race as any).boat_id}
            venue={venueForForecast}
            raceDate={race.date}
            raceName={race.name}
            raceStartTime={race.startTime}
            raceDurationHours={race.time_limit_hours ? Number(race.time_limit_hours) : undefined}
            onCancel={handleWizardCancel}
            onComplete={handleWizardComplete}
          />
        )}
      </Modal>

      {/* Full Wizard Modal for weather routing */}
      <Modal
        visible={activeWizard === 'weather_routing_wizard'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'weather_routing_wizard' && (
          <WeatherRoutingWizard
            item={selectedItem}
            raceEventId={race.id}
            boatId={(race as any).boat_id}
            venue={venueForForecast}
            raceDate={race.date}
            raceName={race.name}
            raceStartTime={race.startTime}
            raceDurationHours={race.time_limit_hours ? Number(race.time_limit_hours) : undefined}
            routeWaypoints={(race as any).route_waypoints}
            onCancel={handleWizardCancel}
            onComplete={handleWizardComplete}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Past Race Notice (legacy)
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
  historicalIntentionText: {
    fontSize: 14,
    color: IOS_COLORS.label,
    fontStyle: 'italic',
    flex: 1,
  },
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
  conditionsHistoricalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  conditionHistoricalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionHistoricalText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  rigSettingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  rigSettingItem: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: '45%',
  },
  rigSettingLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginBottom: 1,
  },
  rigSettingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  raceMetadataColumn: {
    gap: 6,
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

  // Section
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },

  // Tappable section styles
  tappableSection: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: -12,
    marginVertical: -4,
    backgroundColor: 'transparent',
  },
  tappableSectionPressed: {
    backgroundColor: IOS_COLORS.gray6,
  },

  // Conditions
  conditionsGrid: {
    gap: 8,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  conditionValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },

  // Rig
  rigGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rigItem: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: '45%',
  },
  rigLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginBottom: 2,
  },
  rigValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Checklist
  checklistContainer: {
    gap: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  toolIndicator: {
    padding: 4,
  },
  toolIndicatorWizard: {
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderRadius: 6,
    padding: 6,
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
  progressText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.blue,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default RaceMorningContent;
