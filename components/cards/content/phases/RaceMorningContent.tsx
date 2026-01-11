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

import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import {
  Wind,
  Waves,
  ChevronRight,
  Wrench,
  Users,
  CloudSun,
  Shield,
  Compass,
  Target,
  BookOpen,
  Info,
} from 'lucide-react-native';
import { QuickTipsPanel } from '@/components/checklist-tools/QuickTipsPanel';
import { NudgeList } from '@/components/checklist-tools/NudgeBanner';
import { RigTuningWizard } from '@/components/checklist-tools/wizards/RigTuningWizard';
import { SailSelectionWizard } from '@/components/checklist-tools/wizards/SailSelectionWizard';
import { TacticsReviewWizard } from '@/components/checklist-tools/wizards/TacticsReviewWizard';
import { ForecastCheckWizard } from '@/components/checklist-tools/wizards/ForecastCheckWizard';
import { usePersonalizedNudges } from '@/hooks/useAdaptiveLearning';
import { useUserSettings } from '@/hooks/useUserSettings';
import type { DetailCardType } from '@/constants/navigationAnimations';

import { CardRaceData, getTimeContext } from '../../types';
import { TinySparkline } from '@/components/shared/charts';
import { useRaceWeatherForecast } from '@/hooks/useRaceWeatherForecast';
import { useRaceTuningRecommendation } from '@/hooks/useRaceTuningRecommendation';
import { useRaceChecklist, ChecklistItemWithState } from '@/hooks/useRaceChecklist';
import { CATEGORY_CONFIG, ChecklistCategory } from '@/types/checklists';
import type { RaceType } from '@/types/raceEvents';
import { StrategyBrief } from './StrategyBrief';
import { ShareWithTeamSection } from './ShareWithTeamSection';

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
  logistics: CloudSun,
  safety: Shield,
  navigation: Compass,
  tactics: Target,
  team_coordination: Users,
  rules: BookOpen,
  weather: CloudSun,
  morning: CloudSun,
  on_water: Compass,
};

interface RaceMorningContentProps {
  race: CardRaceData;
  /** Callback to open detail bottom sheet for a specific type */
  onOpenDetail?: (type: DetailCardType) => void;
  isExpanded?: boolean;
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

export function RaceMorningContent({
  race,
  onOpenDetail,
  isExpanded = true,
}: RaceMorningContentProps) {
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

  // Debug: Log venue data to help diagnose forecast issues
  if (__DEV__ && !coords) {
    console.log('🔴 [RaceMorningContent] No coordinates on race:', {
      raceId: race.id,
      raceName: race.name,
      venueString: race.venue,
      venueId: (race as any).venue_id,
      metadata,
    });
  }

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
    raceEventId: race.id,
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

  // For past races, show a different view
  if (timeContext.isPast) {
    return (
      <View style={styles.container}>
        <View style={styles.pastRaceNotice}>
          <Text style={styles.pastRaceValue}>{timeContext.value}</Text>
          <Text style={styles.pastRaceLabel}>This phase has passed</Text>
        </View>
      </View>
    );
  }

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
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
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

  // Past Race Notice
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
