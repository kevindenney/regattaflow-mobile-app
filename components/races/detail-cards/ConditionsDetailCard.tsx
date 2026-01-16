/**
 * Conditions Detail Card
 *
 * Apple Human Interface Guidelines (HIG) compliant design:
 * - iOS system colors from shared constants
 * - Expandable card showing wind, tide, and wave conditions
 * - Collapsed: Header + key metrics (wind, tide, temp)
 * - Expanded: Full conditions details with Tufte-style data density
 *
 * Tufte design principles:
 * - Maximum data-ink ratio
 * - Small multiples (sparklines)
 * - Layered information
 * - Numbers in sentence context
 */

import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { CARD_EXPAND_DURATION, CARD_COLLAPSE_DURATION } from '@/constants/navigationAnimations';
import { IOS_COLORS } from '@/components/cards/constants';
import { useSailInventory } from '@/hooks/useSailInventory';
import { SailSelector } from '@/components/races/intentions';
import {
  TinySparkline,
  AnnotatedSparkline,
  WindArrow,
  HourlyForecastTable,
  TideTimesDisplay,
} from '@/components/shared/charts';
import { useRaceWeatherForecast } from '@/hooks/useRaceWeatherForecast';
import { useRaceTuningRecommendation } from '@/hooks/useRaceTuningRecommendation';
import type { SailSelectionIntention, SailInventoryItem } from '@/types/raceIntentions';
import type { SailingVenue } from '@/types/venue';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Douglas Sea State Scale descriptions (0-9)
const SEA_STATE_DESCRIPTIONS: Record<number, { name: string; description: string }> = {
  0: { name: 'Calm', description: 'Glassy, mirror-like' },
  1: { name: 'Calm', description: 'Ripples without crests' },
  2: { name: 'Smooth', description: 'Small wavelets, glassy crests' },
  3: { name: 'Slight', description: 'Large wavelets, scattered whitecaps' },
  4: { name: 'Moderate', description: 'Small waves, frequent whitecaps' },
  5: { name: 'Rough', description: 'Moderate waves, many whitecaps, spray' },
  6: { name: 'Very rough', description: 'Large waves, extensive whitecaps' },
  7: { name: 'High', description: 'Sea heaps up, foam blown in streaks' },
  8: { name: 'Very high', description: 'Very high waves, dense foam' },
  9: { name: 'Phenomenal', description: 'Exceptionally high waves' },
};

// Cardinal direction from degrees
function getCardinalDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
  return directions[index];
}

// Beaufort scale from knots
function getBeaufortScale(knots: number): { force: number; description: string } {
  if (knots < 1) return { force: 0, description: 'Calm' };
  if (knots < 4) return { force: 1, description: 'Light air' };
  if (knots < 7) return { force: 2, description: 'Light breeze' };
  if (knots < 11) return { force: 3, description: 'Gentle breeze' };
  if (knots < 17) return { force: 4, description: 'Moderate breeze' };
  if (knots < 22) return { force: 5, description: 'Fresh breeze' };
  if (knots < 28) return { force: 6, description: 'Strong breeze' };
  if (knots < 34) return { force: 7, description: 'Near gale' };
  if (knots < 41) return { force: 8, description: 'Gale' };
  return { force: 9, description: 'Strong gale' };
}

// Pressure trend icon
function getPressureTrendIcon(trend: 'rising' | 'falling' | 'steady'): string {
  switch (trend) {
    case 'rising': return '↑';
    case 'falling': return '↓';
    default: return '→';
  }
}

// Sail recommendation based on wind
function getSailRecommendation(speedMin: number, speedMax: number): string {
  const avg = (speedMin + speedMax) / 2;
  if (avg < 6) return 'Light air sails recommended';
  if (avg < 12) return 'Standard working sails';
  if (avg < 18) return 'Consider first reef';
  if (avg < 25) return 'Reef main, reduce headsail';
  return 'Storm sails or stay ashore';
}

// Wave impact on racing
function getWaveImpact(height: number, period?: number): string {
  if (height < 0.3) return 'Minimal wave impact';
  if (height < 0.6) return 'Light chop, adjust trim';
  if (height < 1.0) return 'Moderate chop, wave sailing';
  if (height < 1.5) return 'Significant waves, tactical sailing';
  return 'Heavy conditions, survival mode';
}

// ============================================================================
// TUFTE HELPER FUNCTIONS - Start-focused conditions display
// ============================================================================

// Format race duration humanely for Tufte header
function formatRaceDuration(minutes: number): string {
  const hours = Math.round(minutes / 60);
  if (hours < 2) return `${minutes}min race`;
  return `${hours}h race`;
}

// Get setup header based on wind range (class-specific or generic)
function getSetupHeader(windRange?: string, speedMin?: number): string {
  if (windRange) {
    const range = windRange.toLowerCase();
    if (range.includes('light')) return 'LIGHT AIR SETUP';
    if (range.includes('medium') || range.includes('moderate')) return 'MODERATE BREEZE';
    if (range.includes('heavy') || range.includes('strong')) return 'HEAVY AIR SETUP';
  }
  // Fallback to speed-based
  const speed = speedMin || 8;
  if (speed < 8) return 'LIGHT AIR SETUP';
  if (speed < 16) return 'MODERATE BREEZE';
  return 'HEAVY AIR SETUP';
}

// Format key rig settings for compact Tufte display
function formatRigSummary(settings?: Array<{ key: string; value: string }>): string {
  if (!settings || settings.length === 0) return '';
  const priorityKeys = ['upper_shrouds', 'shrouds', 'forestay', 'mast_rake', 'backstay'];
  const formatted: string[] = [];

  for (const key of priorityKeys) {
    if (formatted.length >= 2) break;
    const setting = settings.find(s => s.key.includes(key));
    if (setting?.value) {
      const label = setting.key
        .replace(/_/g, ' ')
        .replace('upper ', 'U/')
        .replace('lower ', 'L/');
      formatted.push(`${label}: ${setting.value}`);
    }
  }
  return formatted.join(' · ');
}

// Generic rig recommendation when no class-specific data
function getGenericRigAdvice(speedMin?: number): string {
  const speed = speedMin || 8;
  if (speed < 8) return 'Ease shrouds, rake forward';
  if (speed < 16) return 'Base settings';
  return 'Tighten shrouds, rake aft';
}

interface ConditionsDetailCardProps {
  raceId: string;
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
    gusts?: number;
    directionDegrees?: number;
  } | null;
  tide?: {
    state: string;
    height?: number;
    direction?: string;
    directionDegrees?: number;
    turnTime?: string; // e.g., "14:30"
    range?: number; // meters
  } | null;
  current?: {
    speed?: number; // knots
    direction?: string;
    directionDegrees?: number;
  } | null;
  waves?: {
    height: number;
    period?: number;
    direction?: number;
  } | null;
  swell?: {
    height?: number;
    period?: number;
    direction?: number;
  } | null;
  seaState?: number; // 0-9 Douglas scale
  temperature?: number;
  waterTemperature?: number;
  pressure?: number; // hPa
  pressureTrend?: 'rising' | 'falling' | 'steady';
  visibility?: number; // km
  humidity?: number; // percentage
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  // Distance race support
  isDistanceRace?: boolean;
  customTitle?: string;
  // Sail selection props
  boatId?: string;
  classId?: string | null; // For rig tuning lookup
  className?: string | null; // Boat class name for tuning lookup
  sailSelection?: SailSelectionIntention;
  onSailSelectionChange?: (selection: SailSelectionIntention) => void;
  // Venue and date for forecast fetching
  venue?: SailingVenue | null;
  raceDate?: string | null;
  // Race-window props for Tufte display
  raceStartTime?: string | null; // ISO date string
  expectedDurationMinutes?: number; // default 90
}

export function ConditionsDetailCard({
  raceId,
  wind,
  tide,
  current,
  waves,
  swell,
  seaState,
  temperature,
  waterTemperature,
  pressure,
  pressureTrend,
  visibility,
  humidity,
  isExpanded = false,
  onToggle,
  onPress,
  isDistanceRace = false,
  customTitle,
  boatId,
  classId,
  className,
  sailSelection,
  onSailSelectionChange,
  venue,
  raceDate,
  raceStartTime,
  expectedDurationMinutes = 90,
}: ConditionsDetailCardProps) {
  const hasData = wind || tide || waves;
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  // Fetch weather forecast for sparklines (Tufte-style inline trends)
  // Use raceStartTime if provided, otherwise fall back to raceDate
  const effectiveRaceDate = raceStartTime || raceDate;
  const { data: forecastData, loading: forecastLoading, error: forecastError } = useRaceWeatherForecast(
    venue,
    effectiveRaceDate,
    !!venue,
    expectedDurationMinutes
  );

  const windForecast = forecastData?.windForecast;
  const tideForecast = forecastData?.tideForecast;
  const forecastNowIndex = forecastData?.forecastNowIndex ?? 0;
  const raceStartIndex = forecastData?.raceStartIndex ?? 0;
  const raceEndIndex = forecastData?.raceEndIndex ?? (forecastData?.windForecast?.length ?? 1) - 1;
  const windTrend = forecastData?.windTrend;
  const tidePeakTime = forecastData?.tidePeakTime;
  // Detailed time-series data for Tufte tables
  const hourlyWind = forecastData?.hourlyWind;
  const hourlyTide = forecastData?.hourlyTide;
  const highTide = forecastData?.highTide;
  const lowTide = forecastData?.lowTide;
  const tideRange = forecastData?.tideRange;
  const turnTime = forecastData?.turnTime;
  // Race-window specific data for Tufte display
  const raceWindow = forecastData?.raceWindow;

  // Fetch class-specific rig tuning recommendations for Tufte setup section
  const { recommendation: rigRecommendation, settings: rigSettings, loading: rigLoading } = useRaceTuningRecommendation({
    classId: classId,
    className: className,
    boatId: boatId,
    windMin: wind?.speedMin,
    windMax: wind?.speedMax,
    enabled: !!(classId || className || boatId),
  });

  // Fetch sail inventory if boatId is provided
  const { sails, isLoading: sailsLoading } = useSailInventory({
    boatId: boatId || '',
    activeOnly: true,
    enabled: !!boatId,
  });

  // Helper to get sail name from selection ID
  const getSailName = useCallback(
    (category: keyof SailSelectionIntention, id?: string): string | null => {
      if (!id) return null;
      const allSails = [
        ...sails.mainsail,
        ...sails.jib,
        ...sails.genoa,
        ...sails.spinnaker,
      ];
      const sail = allSails.find((s) => s.id === id);
      return sail?.name || null;
    },
    [sails]
  );

  // Build sail summary for collapsed view
  const sailSummary = React.useMemo(() => {
    if (!boatId || !sailSelection) return null;
    const parts: string[] = [];
    const mainName = getSailName('mainsail', sailSelection.mainsail);
    const headsailName =
      getSailName('jib', sailSelection.jib) ||
      getSailName('genoa', sailSelection.genoa);
    const spinName = getSailName('spinnaker', sailSelection.spinnaker);
    if (mainName) parts.push(mainName);
    if (headsailName) parts.push(headsailName);
    if (spinName) parts.push(spinName);
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [boatId, sailSelection, getSailName]);

  // Handle sail selection changes
  const handleSailSelect = useCallback(
    (category: keyof SailSelectionIntention, sail: SailInventoryItem | null) => {
      if (!onSailSelectionChange) return;

      const newSelection: SailSelectionIntention = {
        ...sailSelection,
        [category]: sail?.id || undefined,
      };
      onSailSelectionChange(newSelection);
    },
    [sailSelection, onSailSelectionChange]
  );

  // Update rotation when isExpanded changes
  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? CARD_EXPAND_DURATION : CARD_COLLAPSE_DURATION,
    });
  }, [isExpanded, rotation]);

  // Animated chevron rotation
  const chevronStyle = useAnimatedStyle(() => {
    'worklet';
    const rotationValue = rotation.value ?? 0;
    return {
      transform: [{ rotate: `${interpolate(rotationValue, [0, 1], [0, 90])}deg` }],
    };
  });

  const handlePress = useCallback(() => {
    // Configure layout animation
    LayoutAnimation.configureNext({
      duration: isExpanded ? CARD_COLLAPSE_DURATION : CARD_EXPAND_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });

    if (onToggle) {
      onToggle();
    } else if (onPress) {
      onPress();
    }
  }, [isExpanded, onToggle, onPress]);

  // Key metrics for collapsed view
  const keyMetrics = [];
  if (wind) {
    keyMetrics.push({
      icon: 'weather-windy' as const,
      value: `${wind.direction} ${wind.speedMin}-${wind.speedMax}kts`,
    });
  }
  if (tide) {
    keyMetrics.push({
      icon: 'waves' as const,
      value: tide.state.charAt(0).toUpperCase() + tide.state.slice(1),
    });
  }
  if (temperature !== undefined) {
    keyMetrics.push({
      icon: 'thermometer' as const,
      value: `${temperature}°C`,
    });
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Tufte Design: Data-first grid, no redundant labels */}
      {hasData ? (
        <>
          {/* Collapsed: Tufte start-focused conditions display */}
          {!isExpanded && (
            <View style={styles.startConditionsCard}>
              {/* Header: START CONDITIONS + race duration */}
              <View style={styles.startHeader}>
                <Text style={styles.startLabel}>START CONDITIONS</Text>
                <Text style={styles.raceDuration}>
                  {formatRaceDuration(expectedDurationMinutes)}
                </Text>
              </View>

              {/* Wind: Integrated horizontal strip with sparkline */}
              {wind && (
                <View style={styles.windStrip}>
                  <Text style={styles.windStart}>
                    {raceWindow?.windDirectionAtStart || wind.direction} {raceWindow?.windAtStart || wind.speedMin}
                  </Text>
                  {windForecast && windForecast.length >= 2 ? (
                    <View style={styles.windSparklineStrip}>
                      <TinySparkline
                        data={windForecast}
                        width={100}
                        height={20}
                        color={IOS_COLORS.blue}
                        nowIndex={raceStartIndex}
                        showNowDot
                        variant="line"
                      />
                    </View>
                  ) : (
                    <View style={styles.windSparklineStrip}>
                      <Text style={styles.windTrendText}>{windTrend || '→'}</Text>
                    </View>
                  )}
                  <Text style={styles.windEnd}>
                    {raceWindow?.windAtEnd || wind.speedMax}kt
                  </Text>
                  <View style={styles.beaufortBadge}>
                    <Text style={styles.beaufortBadgeText}>
                      F{raceWindow?.beaufortAtStart || getBeaufortScale((wind.speedMin + wind.speedMax) / 2).force}
                      {raceWindow && raceWindow.beaufortAtEnd !== raceWindow.beaufortAtStart ? `→${raceWindow.beaufortAtEnd}` : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* Tide: Compact single line with HW time */}
              {tide && (
                <View style={styles.tideStrip}>
                  <MaterialCommunityIcons
                    name={tide.state === 'rising' ? 'arrow-up' : tide.state === 'falling' ? 'arrow-down' : 'minus'}
                    size={14}
                    color={tide.state === 'rising' ? IOS_COLORS.green : tide.state === 'falling' ? IOS_COLORS.orange : IOS_COLORS.gray}
                  />
                  <Text style={styles.tideState}>
                    {tide.state.charAt(0).toUpperCase() + tide.state.slice(1)}
                  </Text>
                  {raceWindow ? (
                    <Text style={styles.tideValue}>
                      {raceWindow.tideAtStart.toFixed(1)}→{raceWindow.tideAtEnd.toFixed(1)}m
                    </Text>
                  ) : tide.height !== undefined ? (
                    <Text style={styles.tideValue}>{tide.height.toFixed(1)}m</Text>
                  ) : null}
                  {(raceWindow?.tidePeakDuringRace || highTide) && (
                    <Text style={styles.hwTime}>
                      HW {raceWindow?.tidePeakDuringRace?.time || highTide?.time}
                    </Text>
                  )}
                </View>
              )}

              {/* Setup Section: Class-specific rig advice with sail recommendation */}
              {wind && (
                <View style={styles.setupSection}>
                  <Text style={styles.setupHeader}>
                    {getSetupHeader(rigRecommendation?.conditionSummary, wind.speedMin)}
                  </Text>
                  <Text style={styles.setupSails}>
                    {getSailRecommendation(wind.speedMin, wind.speedMax)}
                  </Text>
                  {rigSettings && rigSettings.length > 0 ? (
                    <Text style={styles.setupRig}>
                      {formatRigSummary(rigSettings)}
                    </Text>
                  ) : (
                    <Text style={styles.setupRigGeneric}>
                      {getGenericRigAdvice(wind.speedMin)}
                    </Text>
                  )}
                  {rigRecommendation?.guideSource && (
                    <Text style={styles.setupSource}>
                      via {rigRecommendation.guideSource}
                    </Text>
                  )}
                </View>
              )}

              {/* Sail selection summary if available */}
              {boatId && sailSummary && (
                <View style={styles.tufteSailRow}>
                  <Text style={[styles.tufteValue, styles.tufteSailValue]}>{sailSummary}</Text>
                </View>
              )}

              {/* Expand chevron */}
              <View style={styles.chevronRow}>
                <Animated.View style={chevronStyle}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={18}
                    color={IOS_COLORS.gray3}
                  />
                </Animated.View>
              </View>
            </View>
          )}

          {/* Expanded: Detailed Tufte-style racing conditions */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* ============================================== */}
              {/* WIND ANALYSIS SECTION - Race Window Focused */}
              {/* ============================================== */}
              {wind && (
                <View style={styles.tufteSection}>
                  <Text style={styles.tufteSectionLabel}>WIND</Text>

                  {/* Wind direction with race-window progression */}
                  <View style={styles.windPrimaryRow}>
                    <View style={styles.windCompassContainer}>
                      {wind.directionDegrees !== undefined && (
                        <WindArrow
                          direction={wind.directionDegrees}
                          size={24}
                          color={IOS_COLORS.blue}
                        />
                      )}
                      <Text style={styles.windDirection}>{raceWindow?.windDirectionAtStart || wind.direction}</Text>
                    </View>
                    <View style={styles.windSpeedContainer}>
                      <Text style={styles.windSpeedValue}>
                        {raceWindow
                          ? `${raceWindow.windAtStart}→${raceWindow.windAtEnd}`
                          : `${wind.speedMin}–${wind.speedMax}`}
                      </Text>
                      <Text style={styles.windSpeedUnit}>kt</Text>
                    </View>
                    <View style={styles.windBeaufortContainer}>
                      <Text style={styles.windBeaufortValue}>
                        {raceWindow
                          ? `F${raceWindow.beaufortAtStart}${raceWindow.beaufortAtEnd !== raceWindow.beaufortAtStart ? ` → F${raceWindow.beaufortAtEnd}` : ''}`
                          : `F${getBeaufortScale((wind.speedMin + wind.speedMax) / 2).force}`}
                      </Text>
                      <Text style={styles.windBeaufortDescription}>
                        {windTrend || getBeaufortScale((wind.speedMin + wind.speedMax) / 2).description}
                      </Text>
                    </View>
                  </View>

                  {/* Race-window time labels */}
                  {raceWindow && (
                    <View style={styles.raceWindowLabels}>
                      <Text style={styles.raceWindowLabel}>start {raceWindow.raceStartTime}</Text>
                      <Text style={styles.raceWindowLabel}>finish {raceWindow.raceEndTime}</Text>
                    </View>
                  )}

                  {/* Tufte time-series: sparkline + hourly values */}
                  {hourlyWind && hourlyWind.length >= 2 ? (
                    <View style={styles.hourlyForecastContainer}>
                      <HourlyForecastTable
                        data={hourlyWind}
                        unit="kt"
                        nowIndex={raceStartIndex}
                        variant="line"
                        color={IOS_COLORS.blue}
                        trendText={windTrend}
                        maxColumns={8}
                      />
                    </View>
                  ) : !forecastLoading && !venue ? null : (
                    forecastLoading ? (
                      <Text style={styles.forecastUnavailable}>Loading forecast...</Text>
                    ) : null
                  )}

                  {/* Secondary wind data - gusts if present */}
                  {wind.gusts && wind.gusts > wind.speedMax && (
                    <View style={styles.windSecondaryGrid}>
                      <View style={styles.windDataItem}>
                        <Text style={styles.windDataLabel}>Gusts</Text>
                        <Text style={styles.windDataValue}>{wind.gusts}kt</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* ============================================== */}
              {/* CURRENT & TIDE SECTION - Race Window Focused */}
              {/* ============================================== */}
              {(tide || current) && (
                <View style={styles.tufteSection}>
                  <Text style={styles.tufteSectionLabel}>TIDE</Text>

                  {/* Tide state with race-window progression */}
                  {tide && (
                    <View style={styles.tidePrimaryRow}>
                      <View style={styles.tideStateContainer}>
                        <MaterialCommunityIcons
                          name={tide.state === 'rising' ? 'arrow-up' : tide.state === 'falling' ? 'arrow-down' : 'minus'}
                          size={20}
                          color={tide.state === 'rising' ? IOS_COLORS.green : tide.state === 'falling' ? IOS_COLORS.orange : IOS_COLORS.gray}
                        />
                        <Text style={styles.tideStateText}>
                          {tide.state.charAt(0).toUpperCase() + tide.state.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.tideHeightContainer}>
                        <Text style={styles.tideHeightValue}>
                          {raceWindow
                            ? `${raceWindow.tideAtStart.toFixed(1)} → ${raceWindow.tidePeakDuringRace?.height.toFixed(1) || raceWindow.tideAtEnd.toFixed(1)} → ${raceWindow.tideAtEnd.toFixed(1)}`
                            : tide.height !== undefined ? tide.height.toFixed(1) : '—'}
                        </Text>
                        <Text style={styles.tideHeightUnit}>m</Text>
                      </View>
                    </View>
                  )}

                  {/* Race-window time labels for tide */}
                  {raceWindow && (
                    <View style={styles.raceWindowLabels}>
                      <Text style={styles.raceWindowLabel}>start</Text>
                      {raceWindow.tidePeakDuringRace && (
                        <Text style={styles.raceWindowLabel}>HW {raceWindow.tidePeakDuringRace.time}</Text>
                      )}
                      <Text style={styles.raceWindowLabel}>finish</Text>
                    </View>
                  )}

                  {/* Tufte time-series: sparkline + hourly tide heights */}
                  {hourlyTide && hourlyTide.length >= 2 ? (
                    <View style={styles.hourlyForecastContainer}>
                      <HourlyForecastTable
                        data={hourlyTide}
                        unit="m"
                        nowIndex={raceStartIndex}
                        variant="area"
                        color={IOS_COLORS.teal}
                        maxColumns={8}
                        decimals={1}
                      />
                    </View>
                  ) : !forecastLoading && !venue ? null : (
                    forecastLoading ? (
                      <Text style={styles.forecastUnavailable}>Loading forecast...</Text>
                    ) : null
                  )}

                  {/* HW/LW times display */}
                  {(highTide || lowTide || turnTime || tideRange) && (
                    <View style={styles.tideTimesContainer}>
                      <TideTimesDisplay
                        highTide={highTide}
                        lowTide={lowTide}
                        turnTime={raceWindow?.turnTimeDuringRace || turnTime}
                        range={tideRange}
                        currentSpeed={current?.speed}
                        currentDirection={current?.direction}
                      />
                    </View>
                  )}

                  {/* Current section if present but no tide times */}
                  {current?.speed && !highTide && !lowTide && (
                    <View style={styles.tufteSection}>
                      <Text style={styles.tufteSectionLabel}>CURRENT</Text>
                      <View style={styles.tideSecondaryGrid}>
                        <View style={styles.tideDataItem}>
                          <Text style={styles.tideDataLabel}>Speed</Text>
                          <Text style={styles.tideDataValue}>
                            {current.speed.toFixed(1)}kt {current.direction || ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* ============================================== */}
              {/* SEA STATE SECTION */}
              {/* ============================================== */}
              {(waves || swell || seaState !== undefined) && (
                <View style={styles.tufteSection}>
                  <Text style={styles.tufteSectionLabel}>SEA STATE</Text>

                  {/* Sea state description */}
                  {seaState !== undefined && SEA_STATE_DESCRIPTIONS[seaState] && (
                    <View style={styles.seaStateHeader}>
                      <Text style={styles.seaStateValue}>
                        {seaState} – {SEA_STATE_DESCRIPTIONS[seaState].name}
                      </Text>
                      <Text style={styles.seaStateDescription}>
                        {SEA_STATE_DESCRIPTIONS[seaState].description}
                      </Text>
                    </View>
                  )}

                  {/* Waves and swell data */}
                  <View style={styles.seaDataGrid}>
                    {waves && (
                      <>
                        <View style={styles.seaDataItem}>
                          <Text style={styles.seaDataLabel}>Waves</Text>
                          <Text style={styles.seaDataValue}>{waves.height.toFixed(1)}m</Text>
                        </View>
                        {waves.period && (
                          <View style={styles.seaDataItem}>
                            <Text style={styles.seaDataLabel}>Period</Text>
                            <Text style={styles.seaDataValue}>{waves.period}s</Text>
                          </View>
                        )}
                        {waves.direction !== undefined && (
                          <View style={styles.seaDataItem}>
                            <Text style={styles.seaDataLabel}>Dir</Text>
                            <Text style={styles.seaDataValue}>{getCardinalDirection(waves.direction)}</Text>
                          </View>
                        )}
                      </>
                    )}
                    {swell && (
                      <>
                        {swell.height && (
                          <View style={styles.seaDataItem}>
                            <Text style={styles.seaDataLabel}>Swell</Text>
                            <Text style={styles.seaDataValue}>{swell.height.toFixed(1)}m</Text>
                          </View>
                        )}
                        {swell.period && (
                          <View style={styles.seaDataItem}>
                            <Text style={styles.seaDataLabel}>Period</Text>
                            <Text style={styles.seaDataValue}>{swell.period}s</Text>
                          </View>
                        )}
                        {swell.direction !== undefined && (
                          <View style={styles.seaDataItem}>
                            <Text style={styles.seaDataLabel}>Dir</Text>
                            <Text style={styles.seaDataValue}>{getCardinalDirection(swell.direction)}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  {/* Wave impact note */}
                  {waves && (
                    <Text style={styles.seaImpactNote}>
                      {getWaveImpact(waves.height, waves.period)}
                    </Text>
                  )}
                </View>
              )}

              {/* ============================================== */}
              {/* ATMOSPHERE SECTION */}
              {/* ============================================== */}
              {(temperature !== undefined || pressure !== undefined || visibility !== undefined) && (
                <View style={styles.tufteSection}>
                  <Text style={styles.tufteSectionLabel}>ATMOSPHERE</Text>

                  <View style={styles.atmosphereGrid}>
                    {temperature !== undefined && (
                      <View style={styles.atmosphereItem}>
                        <Text style={styles.atmosphereLabel}>Air</Text>
                        <Text style={styles.atmosphereValue}>{temperature}°C</Text>
                      </View>
                    )}
                    {waterTemperature !== undefined && (
                      <View style={styles.atmosphereItem}>
                        <Text style={styles.atmosphereLabel}>Water</Text>
                        <Text style={styles.atmosphereValue}>{waterTemperature}°C</Text>
                      </View>
                    )}
                    {pressure !== undefined && (
                      <View style={styles.atmosphereItem}>
                        <Text style={styles.atmosphereLabel}>Pressure</Text>
                        <Text style={styles.atmosphereValue}>
                          {pressure}hPa {pressureTrend && getPressureTrendIcon(pressureTrend)}
                        </Text>
                      </View>
                    )}
                    {visibility !== undefined && (
                      <View style={styles.atmosphereItem}>
                        <Text style={styles.atmosphereLabel}>Visibility</Text>
                        <Text style={styles.atmosphereValue}>{visibility}km</Text>
                      </View>
                    )}
                    {humidity !== undefined && (
                      <View style={styles.atmosphereItem}>
                        <Text style={styles.atmosphereLabel}>Humidity</Text>
                        <Text style={styles.atmosphereValue}>{humidity}%</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* ============================================== */}
              {/* RACING INSIGHT - Plain italic annotation, no box */}
              {/* ============================================== */}
              {wind && (
                <Text style={styles.tufteInsightTextExpanded}>
                  {getSailRecommendation(wind.speedMin, wind.speedMax)}
                </Text>
              )}

              {/* ============================================== */}
              {/* SAIL SELECTION (if available) */}
              {/* ============================================== */}
              {boatId && onSailSelectionChange && (
                <View style={styles.sailSelectionSection}>
                  <Text style={styles.tufteSectionLabel}>SAIL SELECTION</Text>
                  {wind && (
                    <Text style={styles.sailSelectionHint}>
                      For {wind.speedMin}–{wind.speedMax}kt conditions
                    </Text>
                  )}

                  <View style={styles.sailSelectors}>
                    <SailSelector
                      label="Mainsail"
                      category="mainsail"
                      sails={sails.mainsail}
                      selectedId={sailSelection?.mainsail}
                      onSelect={(sail) => handleSailSelect('mainsail', sail)}
                      disabled={sailsLoading}
                    />

                    {(sails.jib.length > 0 || sails.genoa.length > 0) && (
                      <SailSelector
                        label="Headsail"
                        category={sails.jib.length > 0 ? 'jib' : 'genoa'}
                        sails={[...sails.jib, ...sails.genoa]}
                        selectedId={sailSelection?.jib || sailSelection?.genoa}
                        onSelect={(sail) => {
                          if (sail?.category === 'genoa') {
                            handleSailSelect('genoa', sail);
                            handleSailSelect('jib', null);
                          } else {
                            handleSailSelect('jib', sail);
                            handleSailSelect('genoa', null);
                          }
                        }}
                        disabled={sailsLoading}
                      />
                    )}

                    {sails.spinnaker.length > 0 && (
                      <SailSelector
                        label="Spinnaker"
                        category="spinnaker"
                        sails={sails.spinnaker}
                        selectedId={sailSelection?.spinnaker}
                        onSelect={(sail) => handleSailSelect('spinnaker', sail)}
                        disabled={sailsLoading}
                      />
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        </>
      ) : (
        /* Empty state */
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="weather-partly-cloudy" size={32} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyTitle}>No Conditions Data</Text>
          <Text style={styles.emptySubtext}>
            Weather and tide data will appear here when available
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconDistance: {
    backgroundColor: `${IOS_COLORS.purple}15`,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },

  // Collapsed content
  collapsedContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
  },
  collapsedMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  collapsedValue: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },

  // Expanded content
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 16,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDetails: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // ==========================================================================
  // TUFTE STYLES - Data-first, maximum ink-to-data ratio
  // ==========================================================================

  // ==========================================================================
  // NEW: Start-focused Tufte redesign (collapsed view)
  // ==========================================================================
  startConditionsCard: {
    gap: 8,
  },
  startHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  startLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: IOS_COLORS.secondaryLabel,
  },
  raceDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  windStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  windStart: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
    minWidth: 55,
  },
  windSparklineStrip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  windTrendText: {
    fontSize: 16,
    color: IOS_COLORS.gray,
  },
  windEnd: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
  },
  beaufortBadge: {
    backgroundColor: `${IOS_COLORS.blue}10`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  beaufortBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.blue,
  },
  tideStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  tideState: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  tideValue: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.teal,
    fontVariant: ['tabular-nums'],
  },
  hwTime: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginLeft: 'auto',
  },
  setupSection: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    gap: 2,
  },
  setupHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: 0.5,
  },
  setupSails: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  setupRig: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  setupRigGeneric: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
  },
  setupSource: {
    fontSize: 10,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  chevronRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
  },

  // ==========================================================================
  // Legacy Tufte styles (kept for expanded view)
  // ==========================================================================

  // Main grid container for collapsed view
  tufteGrid: {
    gap: 0,
  },

  // Row layout: Label | Value | Sparkline | Trend
  tufteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  tufteLastRow: {
    borderBottomWidth: 0,
  },
  tufteLabel: {
    width: 44,
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },

  // Inline sparkline (word-sized graphic)
  tufteSparklineInline: {
    marginLeft: 8,
  },

  // Trend annotation text
  tufteTrend: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginLeft: 6,
    minWidth: 48,
    textAlign: 'right',
  },

  // Race-window specific styles (Tufte redesign)
  tufteDirectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
    width: 32,
  },
  tufteRaceWindowValue: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
    marginLeft: 4,
  },
  tufteUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteBeaufort: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    marginLeft: 8,
    minWidth: 32,
    textAlign: 'right',
  },
  tufteTideAnnotation: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginLeft: 4,
    minWidth: 60,
    textAlign: 'right',
  },
  tufteInsightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  tufteInsightText: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  tufteInsightTextExpanded: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  // Race window time labels (start/finish markers)
  raceWindowLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  raceWindowLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'lowercase',
  },

  // Standalone chevron row (when no temperature)
  tufteChevronRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
  },

  // Sail selection summary row
  tufteSailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  tufteSailValue: {
    color: IOS_COLORS.blue,
  },

  // Section label for expanded content
  tufteSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  // Expanded view grid
  tufteExpandedGrid: {
    gap: 12,
  },
  tufteExpandedSparkline: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },

  // Legacy styles (kept for compatibility)
  tufteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tufteHeaderTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tufteHeaderSubtitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tufteCollapsedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  tufteCollapsedData: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tufteSailSummary: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
    marginTop: 8,
  },
  tufteSparkline: {
    marginLeft: 'auto',
  },

  // Empty state
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },

  // Sail selection section - Tufte clean
  sailSelectionSection: {
    gap: 8,
  },
  sailSelectionHint: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 8,
  },
  sailSelectors: {
    gap: 12,
  },

  // ==========================================================================
  // EXPANDED TUFTE SECTIONS - Racing conditions detail
  // ==========================================================================

  // Generic section container
  tufteSection: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },

  // Trend label (building, easing, etc.)
  trendLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 2,
  },

  // ==========================================================================
  // WIND SECTION STYLES
  // ==========================================================================

  windPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  windCompassContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 60,
  },
  windDirection: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  windSpeedContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  windSpeedValue: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },
  windSpeedUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  windSparklineContainer: {
    marginLeft: 'auto',
    alignItems: 'center',
  },
  windBeaufortContainer: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  windBeaufortValue: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.blue,
  },
  windBeaufortDescription: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
  },
  // Container for HourlyForecastTable
  hourlyForecastContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  // Container for TideTimesDisplay
  tideTimesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  // Fallback text when forecast unavailable
  forecastUnavailable: {
    fontSize: 12,
    fontStyle: 'italic',
    color: IOS_COLORS.gray,
    marginTop: 4,
  },
  windSecondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 4,
  },
  windDataItem: {
    gap: 2,
  },
  windDataItemWide: {
    flex: 1,
    minWidth: 100,
  },
  windDataLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  windDataValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  windDataDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
  },

  // ==========================================================================
  // TIDE & CURRENT SECTION STYLES
  // ==========================================================================

  tidePrimaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  tideStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
  },
  tideStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tideHeightContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  tideHeightValue: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.teal,
    fontVariant: ['tabular-nums'],
  },
  tideHeightUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tideSparklineContainer: {
    marginLeft: 'auto',
    alignItems: 'center',
  },
  tideSecondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 4,
  },
  tideDataItem: {
    gap: 2,
  },
  tideDataLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tideDataValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },

  // ==========================================================================
  // SEA STATE SECTION STYLES
  // ==========================================================================

  seaStateHeader: {
    gap: 2,
    paddingVertical: 4,
  },
  seaStateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  seaStateDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
  },
  seaDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 4,
  },
  seaDataItem: {
    gap: 2,
  },
  seaDataLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seaDataValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  seaImpactNote: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // ==========================================================================
  // ATMOSPHERE SECTION STYLES
  // ==========================================================================

  atmosphereGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  atmosphereItem: {
    gap: 2,
    minWidth: 70,
  },
  atmosphereLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  atmosphereValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },

  // ==========================================================================
  // RACING INSIGHT SECTION STYLES
  // ==========================================================================

  insightSection: {
    backgroundColor: `${IOS_COLORS.blue}08`,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
});
