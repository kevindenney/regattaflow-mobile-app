/**
 * RaceSummaryCard - Position 0 (Default View)
 *
 * Tufte-inspired race summary:
 * - Typography IS the interface (no colored badges)
 * - Maximum data density with sparklines
 * - Single encoding per concept (no icon + label)
 * - Every pixel shows data, not decoration
 */

import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, LayoutAnimation } from 'react-native';
import {
  Navigation,
  Trophy,
  Users,
  Flag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

import { CardContentProps } from '../types';
import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import { detectRaceType } from '@/lib/races/raceDataUtils';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { TinySparkline } from '@/components/shared/charts';
import { useRaceWeatherForecast } from '@/hooks/useRaceWeatherForecast';
import type { ArrivalTimeIntention } from '@/types/raceIntentions';

// =============================================================================
// iOS SYSTEM COLORS (Apple HIG)
// =============================================================================

const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
};

// Distance racing purple theme
const DISTANCE_COLORS = {
  primary: '#7C3AED',
  accent: '#8B5CF6',
  badgeBg: '#EDE9FE',
  badgeText: '#7C3AED',
  routeBg: '#F5F3FF',
} as const;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calculate countdown to race start
 */
function calculateCountdown(date: string, startTime?: string): {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
  isToday: boolean;
  isTomorrow: boolean;
} {
  const now = new Date();
  const raceDate = new Date(date);

  // Set start time if provided
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    raceDate.setHours(hours || 0, minutes || 0, 0, 0);
  }

  const diffMs = raceDate.getTime() - now.getTime();
  const isPast = diffMs < 0;

  const absDiffMs = Math.abs(diffMs);
  const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));

  // Check if today or tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const raceDayStart = new Date(raceDate);
  raceDayStart.setHours(0, 0, 0, 0);

  const isToday = raceDayStart.getTime() === today.getTime();
  const isTomorrow = raceDayStart.getTime() === tomorrow.getTime();

  return { days, hours, minutes, isPast, isToday, isTomorrow };
}

/**
 * Format date for display
 */
function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
function formatTime(time?: string): string {
  if (!time) return 'TBD';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

/**
 * Get urgency color based on countdown (iOS system colors)
 */
function getUrgencyColor(days: number, hours: number, isPast: boolean): {
  bg: string;
  text: string;
  label: string;
} {
  if (isPast) {
    return { bg: IOS_COLORS.gray6, text: IOS_COLORS.gray, label: 'Completed' };
  }
  if (days === 0 && hours < 2) {
    return { bg: '#FFEBE9', text: IOS_COLORS.red, label: 'Starting Soon' };
  }
  if (days === 0) {
    return { bg: '#FFF4E5', text: IOS_COLORS.orange, label: 'Today' };
  }
  if (days <= 1) {
    return { bg: '#FFF8E5', text: '#CC7A00', label: 'Tomorrow' };
  }
  if (days <= 7) {
    return { bg: '#E8FAE9', text: IOS_COLORS.green, label: 'This Week' };
  }
  return { bg: '#E5F1FF', text: IOS_COLORS.blue, label: 'Upcoming' };
}

/**
 * Get race type badge styling (iOS system colors)
 */
function getRaceTypeBadge(raceType: 'fleet' | 'distance' | 'match' | 'team'): {
  bg: string;
  text: string;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
} {
  switch (raceType) {
    case 'distance':
      return {
        bg: '#F3E8FF',
        text: IOS_COLORS.purple,
        label: 'DISTANCE',
        icon: Navigation,
      };
    case 'match':
      return {
        bg: '#FFF4E5',
        text: IOS_COLORS.orange,
        label: 'MATCH',
        icon: Trophy,
      };
    case 'team':
      return {
        bg: '#E5F1FF',
        text: IOS_COLORS.blue,
        label: 'TEAM',
        icon: Users,
      };
    case 'fleet':
    default:
      return {
        bg: '#E8FAE9',
        text: IOS_COLORS.green,
        label: 'FLEET',
        icon: Flag,
      };
  }
}

/**
 * Format tide state for display
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
 * Arrival time options in minutes before the start
 */
const ARRIVAL_TIME_OPTIONS = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 45, label: '45 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 90, label: '1.5 hrs' },
  { minutes: 120, label: '2 hrs' },
];

/**
 * Calculate planned arrival time from race start and minutes before
 */
function calculateArrivalTime(raceDate: string, startTime: string | undefined, minutesBefore: number): string {
  const d = new Date(raceDate);
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    d.setHours(hours || 0, minutes || 0, 0, 0);
  }
  d.setMinutes(d.getMinutes() - minutesBefore);
  return d.toISOString();
}

/**
 * Format arrival time for display
 */
function formatArrivalTimeDisplay(plannedArrival: string, minutesBefore?: number): string {
  if (minutesBefore) {
    if (minutesBefore >= 60) {
      const hours = Math.floor(minutesBefore / 60);
      const mins = minutesBefore % 60;
      return mins > 0 ? `${hours}h ${mins}m before` : `${hours}h before`;
    }
    return `${minutesBefore}m before`;
  }
  const d = new Date(plannedArrival);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RaceSummaryCard({
  race,
  cardType,
  isActive,
  isExpanded,
  onToggleExpand,
  dimensions,
  canManage,
  onEdit,
  onDelete,
  onRaceComplete,
}: CardContentProps) {
  // Arrival plan section state
  const [arrivalExpanded, setArrivalExpanded] = useState(false);
  const [arrivalNotes, setArrivalNotes] = useState('');

  // Hook for race preparation data (includes arrival intentions)
  const { intentions, updateArrivalIntention, isSaving } = useRacePreparation({
    raceEventId: race.id,
    autoSave: true,
    debounceMs: 1000,
  });

  // Get current arrival intention
  const arrivalIntention = intentions.arrivalTime;

  // Sync local notes with saved intention
  React.useEffect(() => {
    if (arrivalIntention?.notes !== undefined && arrivalIntention.notes !== arrivalNotes) {
      setArrivalNotes(arrivalIntention.notes);
    }
  }, [arrivalIntention?.notes]);

  // Handle selecting an arrival time option
  const handleSelectArrivalTime = useCallback((minutesBefore: number) => {
    const plannedArrival = calculateArrivalTime(race.date, race.startTime, minutesBefore);
    updateArrivalIntention({
      plannedArrival,
      minutesBefore,
      notes: arrivalNotes,
    });
  }, [race.date, race.startTime, arrivalNotes, updateArrivalIntention]);

  // Handle notes change (on blur)
  const handleArrivalNotesBlur = useCallback(() => {
    if (arrivalIntention) {
      updateArrivalIntention({
        ...arrivalIntention,
        notes: arrivalNotes,
      });
    }
  }, [arrivalIntention, arrivalNotes, updateArrivalIntention]);

  // Toggle arrival section
  const toggleArrivalSection = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setArrivalExpanded(prev => !prev);
  }, []);

  // Detect race type from name or explicit setting
  const detectedRaceType = useMemo(() => {
    const explicit = race.race_type as 'fleet' | 'distance' | 'match' | 'team' | undefined;
    const distance = (race as any).total_distance_nm;
    return detectRaceType(race.name, explicit, distance) as 'fleet' | 'distance' | 'match' | 'team';
  }, [race.name, race.race_type, (race as any).total_distance_nm]);

  const isDistanceRace = detectedRaceType === 'distance';

  // Get race type badge styling
  const raceTypeBadge = useMemo(
    () => getRaceTypeBadge(detectedRaceType),
    [detectedRaceType]
  );

  // Calculate countdown
  const countdown = useMemo(
    () => calculateCountdown(race.date, race.startTime),
    [race.date, race.startTime]
  );

  // Get urgency colors
  const urgency = useMemo(
    () => getUrgencyColor(countdown.days, countdown.hours, countdown.isPast),
    [countdown.days, countdown.hours, countdown.isPast]
  );

  // Extract distance race fields
  const totalDistanceNm = (race as any).total_distance_nm;
  const timeLimitHours = race.time_limit_hours || (race as any).time_limit_hours;
  const routeWaypoints = (race as any).route_waypoints || [];
  const numberOfLegs = (race as any).number_of_legs || routeWaypoints.length || 0;

  // Extract conditions data
  const windData = race.wind;
  const tideData = race.tide;
  const vhfChannel = race.vhf_channel;

  // Check if we have any conditions to show
  const hasConditions = windData || tideData || vhfChannel;

  // Fetch weather forecast for sparklines
  const venue = (race as any).venue_data || (race as any).venue_info;
  const { data: forecastData } = useRaceWeatherForecast(venue, race.date, !!venue);

  // Extract additional data for Tufte density
  const fleetSize = (race as any).fleet_size || (race as any).entry_count || (race as any).competitors?.length;
  const courseType = (race as any).course_type || (race as any).course?.type;
  const courseDistance = (race as any).course_distance_nm || (race as any).total_distance_nm;

  // Build menu items for card management
  const menuItems = useMemo((): CardMenuItem[] => {
    const items: CardMenuItem[] = [];
    if (onEdit) {
      items.push({ label: 'Edit Race', icon: 'create-outline', onPress: onEdit });
    }
    if (onDelete) {
      items.push({ label: 'Delete Race', icon: 'trash-outline', onPress: onDelete, variant: 'destructive' });
    }
    return items;
  }, [onEdit, onDelete]);

  // Render race type badge component
  const RaceTypeBadgeIcon = raceTypeBadge.icon;

  // ==========================================================================
  // COLLAPSED VIEW - Aggressive Tufte Design
  // Typography hierarchy, no badges, maximum data density
  // ==========================================================================
  if (!isExpanded) {
    return (
      <View style={styles.container}>
        {/* Typographic Header - Race type + status as text, not badges */}
        <Text style={styles.tufteTypeLabel}>
          {raceTypeBadge.label} RACE
          {!countdown.isPast && ` · ${urgency.label}`}
        </Text>

        {/* Race Name - Primary visual element */}
        <Text style={styles.tufteRaceName} numberOfLines={2}>
          {race.name}
        </Text>

        {/* Venue - No icon, just typography */}
        {race.venue && (
          <Text style={styles.tufteVenue} numberOfLines={1}>{race.venue}</Text>
        )}

        {/* Time Block - Countdown + Date/Time inline */}
        <View style={styles.tufteTimeBlock}>
          {countdown.isPast ? (
            <Text style={styles.tufteCountdownPast}>Race Completed</Text>
          ) : (
            <Text style={styles.tufteCountdownInline}>
              <Text style={styles.tufteCountdownValue}>
                {countdown.days > 0
                  ? `${countdown.days}d ${countdown.hours}h`
                  : countdown.hours > 0
                    ? `${countdown.hours}h ${countdown.minutes}m`
                    : `${countdown.minutes}m`}
              </Text>
              {' to start · '}
              {formatDate(race.date)} {formatTime(race.startTime)}
            </Text>
          )}
        </View>

        {/* Conditions Grid - Flat typography with sparklines */}
        {hasConditions && (
          <View style={styles.tufteConditionsGrid}>
            {windData && (
              <View style={styles.tufteConditionRow}>
                <Text style={styles.tufteConditionLabel}>Wind</Text>
                <Text style={styles.tufteConditionValue}>
                  {windData.direction} {windData.speedMin}–{windData.speedMax}kt
                </Text>
                {forecastData?.windForecast && forecastData.windForecast.length >= 2 && (
                  <TinySparkline
                    data={forecastData.windForecast}
                    width={50}
                    height={14}
                    color={IOS_COLORS.secondaryLabel}
                    nowIndex={forecastData.forecastNowIndex}
                  />
                )}
              </View>
            )}
            {tideData && (
              <View style={styles.tufteConditionRow}>
                <Text style={styles.tufteConditionLabel}>Tide</Text>
                <Text style={styles.tufteConditionValue}>
                  {formatTideState(tideData.state)}
                  {tideData.height ? ` ${tideData.height.toFixed(1)}m` : ''}
                </Text>
                {forecastData?.tideForecast && forecastData.tideForecast.length >= 2 && (
                  <TinySparkline
                    data={forecastData.tideForecast}
                    width={50}
                    height={14}
                    color={IOS_COLORS.secondaryLabel}
                    nowIndex={forecastData.forecastNowIndex}
                    variant="area"
                  />
                )}
              </View>
            )}
            {vhfChannel && (
              <View style={styles.tufteConditionRow}>
                <Text style={styles.tufteConditionLabel}>VHF</Text>
                <Text style={styles.tufteConditionValue}>Ch {vhfChannel}</Text>
              </View>
            )}
          </View>
        )}

        {/* Data Density Row - Fleet size, course info */}
        {(fleetSize || courseType || courseDistance || numberOfLegs > 0) && (
          <Text style={styles.tufteDataDensity}>
            {[
              fleetSize && `${fleetSize} boats`,
              courseType && courseType,
              courseDistance && `${courseDistance}nm`,
              numberOfLegs > 0 && `${numberOfLegs} legs`,
            ].filter(Boolean).join(' · ')}
          </Text>
        )}

        {/* Swipe indicator */}
        <View style={styles.swipeHintBottom}>
          <View style={styles.swipeIndicator} />
        </View>
      </View>
    );
  }

  // ==========================================================================
  // EXPANDED VIEW - Tufte Design with Interactive Elements
  // ==========================================================================
  return (
    <View style={styles.container}>
      {/* Typographic Header with Menu */}
      <View style={styles.tufteExpandedHeader}>
        <Text style={styles.tufteTypeLabel}>
          {raceTypeBadge.label} RACE
          {numberOfLegs > 0 && ` · ${numberOfLegs} legs`}
        </Text>
        {canManage && menuItems.length > 0 && (
          <CardMenu items={menuItems} />
        )}
      </View>

      {/* Race Name */}
      <Text style={styles.tufteRaceName}>
        {race.name}
      </Text>

      {/* Venue */}
      {race.venue && (
        <Text style={styles.tufteVenue}>{race.venue}</Text>
      )}

      {/* Tufte Time Block - Inline countdown with date, start action below */}
      <View style={styles.tufteTimeBlockExpanded}>
        {countdown.isPast ? (
          <Text style={styles.tufteCountdownPast}>Race Completed</Text>
        ) : (
          <>
            <Text style={styles.tufteCountdownLineExpanded}>
              <Text style={styles.tufteCountdownValueExpanded}>
                {countdown.days > 0
                  ? `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`
                  : countdown.hours > 0
                    ? `${countdown.hours}h ${countdown.minutes}m`
                    : `${countdown.minutes}m`}
              </Text>
              {' to start · '}
              {formatDate(race.date)} {formatTime(race.startTime)}
            </Text>
            {/* Distance race extras inline */}
            {isDistanceRace && (timeLimitHours || totalDistanceNm) && (
              <Text style={styles.tufteDistanceInfo}>
                {[
                  timeLimitHours && `${timeLimitHours}h time limit`,
                  totalDistanceNm && `${totalDistanceNm}nm`,
                ].filter(Boolean).join(' · ')}
              </Text>
            )}
            {/* Start timer action - minimal */}
            <Pressable
              style={styles.tufteStartAction}
              onPress={() => {
                // This would trigger the race timer - keeping RaceCountdownTimer logic
              }}
            >
              <Text style={styles.tufteStartActionText}>▶ Tap when ready to start</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Conditions - Tufte flat grid, no label needed */}
      {hasConditions && (
        <View style={styles.tufteConditionsExpanded}>
          <View style={styles.tufteConditionsGrid}>
            {windData && (
              <View style={styles.tufteConditionRowExpanded}>
                <Text style={styles.tufteConditionLabelExpanded}>Wind</Text>
                <Text style={styles.tufteConditionValueExpanded}>
                  {windData.direction} {windData.speedMin}–{windData.speedMax}kt
                </Text>
                {forecastData?.windForecast && forecastData.windForecast.length >= 2 && (
                  <TinySparkline
                    data={forecastData.windForecast}
                    width={70}
                    height={18}
                    color={IOS_COLORS.secondaryLabel}
                    nowIndex={forecastData.forecastNowIndex}
                  />
                )}
                {forecastData?.windTrend && (
                  <Text style={styles.tufteTrendText}>{forecastData.windTrend}</Text>
                )}
              </View>
            )}
            {tideData && (
              <View style={styles.tufteConditionRowExpanded}>
                <Text style={styles.tufteConditionLabelExpanded}>Tide</Text>
                <Text style={styles.tufteConditionValueExpanded}>
                  {formatTideState(tideData.state)}
                  {tideData.height ? ` ${tideData.height.toFixed(1)}m` : ''}
                </Text>
                {forecastData?.tideForecast && forecastData.tideForecast.length >= 2 && (
                  <TinySparkline
                    data={forecastData.tideForecast}
                    width={70}
                    height={18}
                    color={IOS_COLORS.secondaryLabel}
                    nowIndex={forecastData.forecastNowIndex}
                    variant="area"
                  />
                )}
                {forecastData?.tidePeakTime && (
                  <Text style={styles.tufteTrendText}>peak {forecastData.tidePeakTime}</Text>
                )}
              </View>
            )}
            {vhfChannel && (
              <View style={styles.tufteConditionRowExpanded}>
                <Text style={styles.tufteConditionLabelExpanded}>VHF</Text>
                <Text style={styles.tufteConditionValueExpanded}>Channel {vhfChannel}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Arrival Plan - Tufte flat row */}
      {!countdown.isPast && (
        <Pressable onPress={toggleArrivalSection} style={styles.tufteArrivalRow}>
          <Text style={styles.tufteArrivalLabel}>Arrival</Text>
          <Text style={styles.tufteArrivalValue}>
            {arrivalIntention
              ? formatArrivalTimeDisplay(arrivalIntention.plannedArrival, arrivalIntention.minutesBefore)
              : 'Set arrival time →'}
          </Text>
        </Pressable>
      )}

      {/* Arrival Options - Only when expanded */}
      {!countdown.isPast && arrivalExpanded && (
        <View style={styles.tufteArrivalExpanded}>
          <View style={styles.tufteArrivalOptions}>
            {ARRIVAL_TIME_OPTIONS.map((option) => {
              const isSelected = arrivalIntention?.minutesBefore === option.minutes;
              return (
                <Pressable
                  key={option.minutes}
                  style={[
                    styles.tufteArrivalOption,
                    isSelected && styles.tufteArrivalOptionSelected,
                  ]}
                  onPress={() => handleSelectArrivalTime(option.minutes)}
                >
                  <Text style={[
                    styles.tufteArrivalOptionText,
                    isSelected && styles.tufteArrivalOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.tufteArrivalNotes}
            placeholder="Approach notes..."
            placeholderTextColor={IOS_COLORS.gray3}
            value={arrivalNotes}
            onChangeText={setArrivalNotes}
            onBlur={handleArrivalNotesBlur}
            multiline
          />
        </View>
      )}

      {/* Swipe indicator */}
      <View style={styles.swipeHintBottom}>
        <View style={styles.swipeIndicator} />
      </View>
    </View>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // Badges Row (top of card)
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Expanded header (with menu)
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  // Race Name (Apple typography)
  raceName: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    lineHeight: 28,
    marginBottom: 6,
    letterSpacing: -0.3,
  },

  // Venue
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  venueText: {
    fontSize: 15,
    color: IOS_COLORS.gray,
    flex: 1,
  },

  // Countdown Section
  countdownSection: {
    marginBottom: 16,
  },
  countdownPastContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
  },
  countdownPast: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },

  // Collapsed countdown (iOS blue styling)
  collapsedCountdown: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 16,
  },
  countdownPastCompact: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
  countdownCompactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.gray6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 6,
  },
  countdownCompactUnit: {
    alignItems: 'center',
    minWidth: 48,
  },
  countdownCompactValue: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  countdownCompactLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  countdownCompactSeparator: {
    fontSize: 24,
    fontWeight: '300',
    color: IOS_COLORS.gray3,
    paddingBottom: 10,
  },

  // Tufte compact countdown (single line, maximizes data-ink ratio)
  countdownTufteRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.gray6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  countdownTufteValue: {
    fontSize: 32,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  countdownTufteLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Conditions Preview (collapsed)
  conditionsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Conditions Preview (expanded - more detail)
  conditionsPreviewExpanded: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  conditionItemExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  conditionValueExpanded: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Distance Race Info Row
  distanceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  distanceInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceInfoText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Date & Time Row
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
  },

  // Arrival Plan Section
  arrivalSection: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
  },
  arrivalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  arrivalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  arrivalHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  arrivalSetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8FAE9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  arrivalSetBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  arrivalAddBadge: {
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  arrivalAddBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  arrivalContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  arrivalSubLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  arrivalOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  arrivalOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
    minWidth: 80,
  },
  arrivalOptionSelected: {
    backgroundColor: IOS_COLORS.blue,
    borderColor: IOS_COLORS.blue,
  },
  arrivalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  arrivalOptionTextSelected: {
    color: '#FFFFFF',
  },
  arrivalOptionSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  arrivalOptionSubtextSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  arrivalNotesContainer: {
    marginTop: 4,
  },
  arrivalNotesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: IOS_COLORS.label,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  savingText: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },

  // Swipe indicator (subtle, positioned at bottom)
  swipeHintBottom: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeIndicator: {
    width: 36,
    height: 4,
    backgroundColor: IOS_COLORS.gray4,
    borderRadius: 2,
  },

  // ==========================================================================
  // TUFTE STYLES - Typography IS the interface
  // Maximum data-ink ratio, no decorative elements
  // ==========================================================================

  // Typographic header - race type as small caps text, not a badge
  tufteTypeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  // Expanded header with menu
  tufteExpandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  // Race name - primary visual element, large and bold
  tufteRaceName: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.label,
    lineHeight: 30,
    letterSpacing: -0.5,
    marginBottom: 4,
  },

  // Venue - secondary text, no icon
  tufteVenue: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 16,
  },

  // Time block - contains countdown inline with date
  tufteTimeBlock: {
    marginBottom: 14,
  },

  // Countdown inline - single line format: "2h 47m to start · Wed, Jan 7 10:25 AM"
  tufteCountdownInline: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },

  // Countdown value - the actual time, emphasized
  tufteCountdownValue: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },

  // Past race text
  tufteCountdownPast: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },

  // Conditions grid - flat layout, no icons
  tufteConditionsGrid: {
    gap: 8,
    marginBottom: 12,
  },

  // Condition row - label, value, sparkline
  tufteConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Condition label - fixed width for alignment
  tufteConditionLabel: {
    width: 36,
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Condition value - the data
  tufteConditionValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },

  // Data density row - additional info in one line
  tufteDataDensity: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    marginBottom: 16,
  },

  // Section label - small caps header for sections
  tufteSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Expanded conditions container
  tufteConditionsExpanded: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },

  // Expanded condition row - more space
  tufteConditionRowExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },

  // Expanded condition label
  tufteConditionLabelExpanded: {
    width: 44,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Expanded condition value
  tufteConditionValueExpanded: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },

  // Trend annotation text
  tufteTrendText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },

  // ==========================================================================
  // TUFTE EXPANDED VIEW STYLES
  // ==========================================================================

  // Time block - inline countdown with date
  tufteTimeBlockExpanded: {
    marginBottom: 16,
    gap: 8,
  },
  tufteCountdownLineExpanded: {
    fontSize: 16,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteCountdownValueExpanded: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    fontVariant: ['tabular-nums'],
  },
  tufteDistanceInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteStartAction: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    marginTop: 8,
  },
  tufteStartActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    textAlign: 'center',
  },

  // Arrival row - flat inline
  tufteArrivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  tufteArrivalLabel: {
    width: 60,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteArrivalValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Arrival expanded options
  tufteArrivalExpanded: {
    paddingBottom: 16,
    gap: 12,
  },
  tufteArrivalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tufteArrivalOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
    backgroundColor: '#FFFFFF',
  },
  tufteArrivalOptionSelected: {
    borderColor: IOS_COLORS.blue,
    backgroundColor: `${IOS_COLORS.blue}10`,
  },
  tufteArrivalOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tufteArrivalOptionTextSelected: {
    color: IOS_COLORS.blue,
    fontWeight: '600',
  },
  tufteArrivalNotes: {
    fontSize: 14,
    color: IOS_COLORS.label,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray4,
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
  },
});

export default RaceSummaryCard;
