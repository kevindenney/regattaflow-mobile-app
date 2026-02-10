/**
 * RaceCardEnhanced Component
 *
 * Tufte-inspired race card matching RaceConditionsCard design
 * Features vertical stacked sparklines and full timeline table
 *
 * Features:
 * - Countdown timer
 * - Vertical stacked sparklines for wind, current, waves
 * - Full 5-row timeline table (TIME, EVENT, WIND, CURRENT, WAVES)
 * - Color-coded current values
 * - High data density in minimal space
 */

import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import { IOS_COLORS } from '@/components/cards/constants';
import { TufteTokens, createTufteCardStyle, getRaceStatus, getRaceStatusColors, type RaceStatusType } from '@/constants/designSystem';
import { calculateCountdown } from '@/constants/mockData';
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkline, WindArrow } from '@/components/shared/charts';
import { RaceTypeBadge, type RaceType } from './RaceTypeSelector';
import { TruncatedText } from '@/components/ui/TruncatedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface RaceConditionsTimeline {
  time: Date;
  label: string;
  shortLabel: string;
  windSpeed: number;
  windDirection: number;
  windGusts?: number;
  tidePhase: 'flood' | 'ebb' | 'slack' | 'high' | 'low';
  currentSpeed?: number;
  waveHeight?: number;
}

export interface RaceCardEnhancedProps {
  id: string;
  name: string;
  venue: string;
  date: string;
  startTime: string;
  courseName?: string | null;
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  } | null;
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack';
    height: number;
    direction?: string;
  } | null;
  vhf_channel?: string | null;
  raceStatus?: 'past' | 'next' | 'future';
  isSelected?: boolean;
  onSelect?: () => void;
  cardWidth?: number;
  cardHeight?: number;
  /** Conditions timeline data from useEnrichedRaces */
  conditionsTimeline?: RaceConditionsTimeline[];
  /** Fleet name */
  fleetName?: string;
  /** Callback when edit is requested */
  onEdit?: () => void;
  /** Callback when delete is requested */
  onDelete?: () => void;
  /** Callback when duplicate is requested */
  onDuplicate?: () => void;
  /** Whether to show management actions (only for race owner) */
  canManage?: boolean;
  /** Race type: fleet, distance, match, or team */
  raceType?: RaceType;
  /** Whether this is a demo race */
  isDemo?: boolean;
}

/**
 * Generate synthetic timeline from wind/tide data
 * Creates 5 points to match RaceConditionsCard: -30m, Warn, Start, Mid, Finish
 */
function generateSyntheticTimeline(
  date: string,
  startTime: string,
  wind?: { direction: string; speedMin: number; speedMax: number } | null,
  tide?: { state: string; height: number } | null
): RaceConditionsTimeline[] {
  // Parse date and time
  const raceDate = new Date(date);
  const [hours, minutes] = startTime.split(':').map(Number);
  if (!isNaN(hours) && !isNaN(minutes)) {
    raceDate.setHours(hours, minutes, 0, 0);
  }

  // Key timepoints
  const warningTime = new Date(raceDate.getTime() - 5 * 60 * 1000);
  const beforeTime = new Date(warningTime.getTime() - 30 * 60 * 1000); // -30m before warning
  const midRaceTime = new Date(raceDate.getTime() + 45 * 60 * 1000); // Mid-race
  const finishTime = new Date(raceDate.getTime() + 90 * 60 * 1000); // ~90 min after start

  // Convert cardinal to degrees
  const cardinalToDegrees = (dir: string): number => {
    const cardinals: Record<string, number> = {
      N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
      S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5
    };
    return cardinals[dir.toUpperCase()] ?? 180;
  };

  const windMin = wind?.speedMin ?? 10;
  const windMax = wind?.speedMax ?? 15;
  const windDirection = wind ? cardinalToDegrees(wind.direction) : 180;
  const tidePhase = (tide?.state as any) || 'slack';

  // Create variation pattern that spans the full wind range
  const createWindSpeed = (position: number) => {
    // Wave pattern: starts lower, builds to peak mid-race, drops toward end
    const waveValue = Math.sin(position * Math.PI);
    return Math.round(windMin + (windMax - windMin) * waveValue);
  };

  // Current speed pattern (builds toward mid-race)
  const createCurrentSpeed = (position: number) => {
    const base = 0.3;
    const peak = 0.8;
    const waveValue = Math.sin(position * Math.PI);
    return Math.round((base + (peak - base) * waveValue) * 10) / 10;
  };

  return [
    {
      time: beforeTime,
      label: '30 min before',
      shortLabel: '-30m',
      windSpeed: createWindSpeed(0),
      windDirection,
      tidePhase,
      currentSpeed: createCurrentSpeed(0),
      waveHeight: 0.4,
    },
    {
      time: warningTime,
      label: 'Warning Signal',
      shortLabel: 'Warn',
      windSpeed: createWindSpeed(0.25),
      windDirection,
      tidePhase,
      currentSpeed: createCurrentSpeed(0.25),
      waveHeight: 0.5,
    },
    {
      time: raceDate,
      label: 'Race Start',
      shortLabel: 'Start',
      windSpeed: createWindSpeed(0.4),
      windDirection,
      tidePhase,
      currentSpeed: createCurrentSpeed(0.4),
      waveHeight: 0.6,
    },
    {
      time: midRaceTime,
      label: 'Mid-race',
      shortLabel: 'Mid',
      windSpeed: createWindSpeed(0.7),
      windDirection: windDirection + 5,
      tidePhase,
      currentSpeed: createCurrentSpeed(0.7),
      waveHeight: 0.7,
    },
    {
      time: finishTime,
      label: 'Expected Finish',
      shortLabel: 'Finish',
      windSpeed: createWindSpeed(1.0),
      windDirection: windDirection + 10,
      tidePhase: tidePhase === 'flooding' ? 'ebb' : tidePhase === 'ebbing' ? 'flood' : tidePhase,
      currentSpeed: createCurrentSpeed(1.0),
      waveHeight: 0.6,
    },
  ];
}

/**
 * Full Timeline Table - 5 columns matching RaceConditionsCard
 * Columns: TIME, EVENT, WIND, CURRENT, WAVES
 */
function FullTimelineTable({
  timeline,
}: {
  timeline: RaceConditionsTimeline[];
}) {
  if (!timeline || timeline.length < 2) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getWindDir = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const isRaceEvent = (label: string) => {
    return ['Warn', 'Start', 'Finish'].includes(label);
  };

  return (
    <View style={tableStyles.container}>
      {/* Header - 5 columns */}
      <View style={tableStyles.headerRow}>
        <Text style={[tableStyles.headerCell, tableStyles.timeCol]}>Time</Text>
        <Text style={[tableStyles.headerCell, tableStyles.eventCol]}>Event</Text>
        <Text style={[tableStyles.headerCell, tableStyles.dataCol]}>Wind</Text>
        <Text style={[tableStyles.headerCell, tableStyles.dataCol]}>Current</Text>
        <Text style={[tableStyles.headerCell, tableStyles.dataCol]}>Waves</Text>
      </View>

      {/* Data rows - all timeline points */}
      {timeline.map((point, index) => (
        <View
          key={index}
          style={[
            tableStyles.dataRow,
            isRaceEvent(point.shortLabel) && tableStyles.dataRowHighlight,
            index === timeline.length - 1 && tableStyles.dataRowLast,
          ]}
        >
          {/* Time */}
          <Text style={[tableStyles.dataCell, tableStyles.timeCol, tableStyles.timeText]}>
            {formatTime(point.time)}
          </Text>

          {/* Event */}
          <View style={tableStyles.eventCol}>
            <Text style={[
              tableStyles.dataCell,
              tableStyles.eventText,
              isRaceEvent(point.shortLabel) && tableStyles.eventTextBold
            ]}>
              {point.shortLabel}
            </Text>
          </View>

          {/* Wind */}
          <View style={[tableStyles.dataCol, tableStyles.dataCellRow]}>
            <Text style={tableStyles.dataValue}>{point.windSpeed}</Text>
            <WindArrow direction={point.windDirection} size={10} />
            <Text style={tableStyles.dataLabel}>{getWindDir(point.windDirection)}</Text>
          </View>

          {/* Current - amber color when > 0.3 */}
          <View style={[tableStyles.dataCol, tableStyles.dataCellRow]}>
            <Text style={[
              tableStyles.dataValue,
              point.currentSpeed && point.currentSpeed > 0.3 && tableStyles.dataValueStrong
            ]}>
              {point.currentSpeed?.toFixed(1) ?? '–'}
            </Text>
            <Text style={tableStyles.dataLabel}>
              {point.tidePhase.slice(0, 3)}
            </Text>
          </View>

          {/* Waves */}
          <View style={[tableStyles.dataCol, tableStyles.dataCellRow]}>
            <Text style={tableStyles.dataValue}>
              {point.waveHeight?.toFixed(1) ?? '–'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Summary Section with Sparklines - Vertical stacked rows matching RaceConditionsCard
 * Layout: LABEL | SPARKLINE | RANGE | DIRECTION
 */
function SummarySection({
  timeline,
  wind,
}: {
  timeline?: RaceConditionsTimeline[];
  wind?: { direction: string; speedMin: number; speedMax: number } | null;
}) {
  // Extract data series from timeline
  const windData = useMemo(() => {
    if (timeline && timeline.length >= 2) {
      return timeline.map((t) => t.windSpeed);
    }
    // Fallback: generate synthetic data from wind range
    if (wind) {
      const mid = (wind.speedMin + wind.speedMax) / 2;
      return [wind.speedMin, mid, wind.speedMax, mid, wind.speedMin];
    }
    return [];
  }, [timeline, wind]);

  const currentData = useMemo(() => {
    if (timeline && timeline.length >= 2) {
      return timeline.map((t) => t.currentSpeed ?? 0);
    }
    return [0.3, 0.5, 0.8, 0.6, 0.3];
  }, [timeline]);

  const waveData = useMemo(() => {
    if (timeline && timeline.length >= 2) {
      return timeline.map((t) => t.waveHeight ?? 0.5);
    }
    return [0.4, 0.6, 0.8, 0.7, 0.5];
  }, [timeline]);

  // First and last points for direction changes
  const first = timeline?.[0];
  const last = timeline?.[timeline.length - 1];

  // Calculate ranges for display
  const windMin = wind?.speedMin ?? (windData.length >= 2 ? Math.min(...windData) : 0);
  const windMax = wind?.speedMax ?? (windData.length >= 2 ? Math.max(...windData) : 0);
  const windRange = `${windMin}–${windMax}`;

  const currentMin = currentData.length >= 2 ? Math.min(...currentData) : 0;
  const currentMax = currentData.length >= 2 ? Math.max(...currentData) : 0;
  const currentRange = `${currentMin.toFixed(1)}–${currentMax.toFixed(1)}`;

  const waveMin = waveData.length >= 2 ? Math.min(...waveData) : 0;
  const waveMax = waveData.length >= 2 ? Math.max(...waveData) : 0;
  const waveRange = `${waveMin.toFixed(1)}–${waveMax.toFixed(1)}`;

  const getWindDir = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <View style={summaryStyles.container}>
      {/* Wind Summary */}
      <View style={summaryStyles.row}>
        <View style={summaryStyles.labelContainer}>
          <Text style={summaryStyles.labelText}>Wind</Text>
        </View>
        <View style={summaryStyles.sparklineContainer}>
          <Sparkline
            data={windData}
            width={80}
            height={20}
            color={IOS_COLORS.blue}
            strokeWidth={1.5}
            highlightMax
          />
        </View>
        <View style={summaryStyles.valuesContainer}>
          <Text style={summaryStyles.valueMain}>{windRange}</Text>
          <Text style={summaryStyles.valueUnit}>kts</Text>
        </View>
        <View style={summaryStyles.directionContainer}>
          {first && <WindArrow direction={first.windDirection} size={12} />}
          <Text style={summaryStyles.directionText}>
            {wind?.direction ?? (first ? getWindDir(first.windDirection) : '--')}
          </Text>
        </View>
      </View>

      {/* Current Summary */}
      <View style={summaryStyles.row}>
        <View style={summaryStyles.labelContainer}>
          <Text style={summaryStyles.labelText}>Current</Text>
        </View>
        <View style={summaryStyles.sparklineContainer}>
          <Sparkline
            data={currentData}
            width={80}
            height={20}
            color={IOS_COLORS.green}
            strokeWidth={1.5}
            highlightMax
          />
        </View>
        <View style={summaryStyles.valuesContainer}>
          <Text style={summaryStyles.valueMain}>{currentRange}</Text>
          <Text style={summaryStyles.valueUnit}>kts</Text>
        </View>
        <View style={summaryStyles.directionContainer}>
          <Text style={summaryStyles.phaseText}>{first?.tidePhase ?? '--'}</Text>
          {first?.tidePhase !== last?.tidePhase && last?.tidePhase && (
            <>
              <Text style={summaryStyles.directionArrow}>→</Text>
              <Text style={summaryStyles.phaseText}>{last.tidePhase}</Text>
            </>
          )}
        </View>
      </View>

      {/* Waves Summary */}
      <View style={summaryStyles.row}>
        <View style={summaryStyles.labelContainer}>
          <Text style={summaryStyles.labelText}>Waves</Text>
        </View>
        <View style={summaryStyles.sparklineContainer}>
          <Sparkline
            data={waveData}
            width={80}
            height={20}
            color={IOS_COLORS.cyan}
            strokeWidth={1.5}
            highlightMax
          />
        </View>
        <View style={summaryStyles.valuesContainer}>
          <Text style={summaryStyles.valueMain}>{waveRange}</Text>
          <Text style={summaryStyles.valueUnit}>m</Text>
        </View>
        <View style={summaryStyles.directionContainer}>
          <Text style={summaryStyles.periodText}>~5s</Text>
        </View>
      </View>
    </View>
  );
}

export function RaceCardEnhanced({
  id,
  name,
  venue,
  date,
  startTime,
  courseName,
  wind,
  tide,
  vhf_channel,
  raceStatus = 'future',
  isSelected = false,
  onSelect,
  cardWidth: propCardWidth,
  cardHeight: propCardHeight,
  conditionsTimeline,
  fleetName,
  onEdit,
  onDelete,
  onDuplicate,
  canManage = false,
  raceType = 'fleet',
  isDemo = false,
}: RaceCardEnhancedProps) {
  const router = useRouter();

  // Calculate countdown
  const currentMinute = useMemo(() => Math.floor(Date.now() / 60000), []);
  const [minuteTick, setMinuteTick] = useState(currentMinute);

  const countdown = useMemo(() => {
    return calculateCountdown(date, startTime);
  }, [date, startTime, minuteTick]);

  // Update countdown every minute
  useEffect(() => {
    if (raceStatus === 'past') return;

    const interval = setInterval(() => {
      setMinuteTick(Math.floor(Date.now() / 60000));
    }, 60000);

    return () => clearInterval(interval);
  }, [raceStatus]);

  const handlePress = () => {
    if (onSelect) {
      onSelect();
      return;
    }
    router.push(`/(tabs)/race/scrollable/${id}`);
  };

  const cardWidth = propCardWidth ?? Math.min(SCREEN_WIDTH - 32, 375);

  // Generate synthetic timeline if not provided
  const effectiveTimeline = useMemo(() => {
    if (conditionsTimeline && conditionsTimeline.length >= 3) {
      return conditionsTimeline;
    }
    // Generate synthetic timeline from wind/tide data
    return generateSyntheticTimeline(date, startTime, wind, tide);
  }, [conditionsTimeline, date, startTime, wind, tide]);

  // Format countdown display
  const countdownDisplay = useMemo(() => {
    if (raceStatus === 'past') return 'Completed';

    if (countdown.days > 0) {
      return `${countdown.days}d ${countdown.hours}h`;
    }
    if (countdown.hours > 0) {
      return `${countdown.hours}h ${countdown.minutes}m`;
    }
    return `${countdown.minutes}m`;
  }, [countdown, raceStatus]);

  // Race status using centralized design system
  // Converts legacy raceStatus prop and countdown to new status type
  const computedStatus: RaceStatusType = useMemo(() => {
    if (raceStatus === 'past') return 'completed';

    // Parse start time for status calculation
    const raceDate = new Date(date);
    const [hours, minutes] = startTime.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      raceDate.setHours(hours, minutes, 0, 0);
    }

    return getRaceStatus(raceDate, false, raceStatus === 'past');
  }, [date, startTime, raceStatus]);

  // Get status colors from design system
  const statusColors = useMemo(() => getRaceStatusColors(computedStatus), [computedStatus]);
  const accentColor = statusColors.accent;

  // Countdown style uses the same status colors for consistency
  const countdownStyle = useMemo(() => ({
    bg: statusColors.badge,
    text: statusColors.text,
  }), [statusColors]);

  // Format date
  const formattedDate = useMemo(() => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [date]);

  // Build menu items for card management
  const menuItems = useMemo((): CardMenuItem[] => {
    const items: CardMenuItem[] = [];
    if (onEdit) {
      items.push({ label: 'Edit Race', icon: 'create-outline', onPress: onEdit });
    }
    if (onDuplicate) {
      items.push({ label: 'Duplicate', icon: 'copy-outline', onPress: onDuplicate });
    }
    if (onDelete) {
      items.push({ label: 'Delete Race', icon: 'trash-outline', onPress: onDelete, variant: 'destructive' });
    }
    return items;
  }, [onEdit, onDuplicate, onDelete]);

  return (
    <View
      style={{
        width: cardWidth,
        ...(propCardHeight ? { height: propCardHeight } : {}),
        flexShrink: 0,
        flexGrow: 0,
      }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          styles.cardApple,
          { width: '100%', ...(propCardHeight ? { height: '100%' } : {}) },
          isSelected && styles.cardSelected,
          pressed && styles.cardPressed,
        ]}
        onPress={handlePress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`View details for ${name}`}
      >
        {/* Status Accent Line - Apple-style top indicator */}
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

        {/* Header Zone */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Race Type, Fleet, and Demo badges */}
          <View style={styles.badgesRow}>
            {isDemo && (
              <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>DEMO</Text>
              </View>
            )}
            <RaceTypeBadge type={raceType} size="small" />
            {fleetName && (
              <View style={styles.fleetBadge}>
                <Text style={styles.fleetBadgeText}>{fleetName}</Text>
              </View>
            )}
          </View>
          <TruncatedText
            text={name}
            numberOfLines={1}
            style={styles.title}
          />
          {/* Consolidated info line: venue · date · time */}
          <Text style={styles.infoLine} numberOfLines={1}>
            {venue} · {formattedDate} · {startTime}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Countdown - simplified, no box */}
          <Text style={[styles.countdownValue, { color: countdownStyle.text }]}>
            {countdownDisplay}
          </Text>

          {/* Management Menu - pointerEvents="box-none" prevents click from bubbling to card */}
          {canManage && menuItems.length > 0 && (
            <View pointerEvents="box-none">
              <CardMenu items={menuItems} iconSize={18} iconColor={IOS_COLORS.gray} />
            </View>
          )}
        </View>
      </View>

      {/* Summary Section with Sparklines */}
      <SummarySection timeline={effectiveTimeline} wind={wind} />

      {/* Full Timeline Table */}
      <FullTimelineTable timeline={effectiveTimeline} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 8,
    overflow: 'visible', // Allow shadow to show
    // Apple-style multi-layer shadow + subtle border for mobile distinction
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.1), 0 12px 32px rgba(0, 0, 0, 0.06)',
      },
      default: {
        // Apple-style card lift: border + shadow work together
        // Border provides crisp edge definition
        borderWidth: 1,
        borderColor: IOS_COLORS.gray5,
        // Shadow provides depth perception (stronger than before to match web)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
  },
  // Status accent line at top of card
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10,
  },
  cardSelected: {
    backgroundColor: `${IOS_COLORS.blue}10`,
    ...Platform.select({
      web: {
        boxShadow: `0 2px 4px ${IOS_COLORS.blue}1A, 0 8px 20px ${IOS_COLORS.blue}26, 0 16px 40px rgba(0, 0, 0, 0.08)`,
      },
      default: {
        borderWidth: 1.5,
        borderColor: `${IOS_COLORS.blue}40`,
        shadowColor: IOS_COLORS.blue,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  cardPressed: {
    opacity: 0.98,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: TufteTokens.spacing.standard,
  },
  headerLeft: {
    flex: 1,
    marginRight: TufteTokens.spacing.standard,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fleetBadge: {
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  fleetBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  demoBadge: {
    backgroundColor: `${IOS_COLORS.purple}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.purple}30`,
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: IOS_COLORS.purple,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    ...TufteTokens.typography.primary,
    fontSize: 17,
    marginBottom: 4,
  },
  // Consolidated info line: venue · date · time (Tufte: single line, no icons)
  infoLine: {
    ...TufteTokens.typography.tertiary,
    marginTop: 2,
  },
  // Simplified countdown (no box, just typography)
  countdownValue: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: IOS_COLORS.secondaryLabel,
  },
});

// Summary section styles - vertical stacked sparklines matching RaceConditionsCard
const summaryStyles = StyleSheet.create({
  container: {
    gap: 8,
    paddingBottom: 12,
    marginBottom: TufteTokens.spacing.standard,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelContainer: {
    width: 48,
  },
  labelText: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    fontWeight: '500',
  },
  sparklineContainer: {
    flex: 1,
    maxWidth: 80,
  },
  valuesContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    minWidth: 52,
  },
  valueMain: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  valueUnit: {
    fontSize: 11,
    color: IOS_COLORS.gray2,
  },
  directionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 56,
  },
  directionText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    fontWeight: '500',
  },
  directionArrow: {
    fontSize: 10,
    color: IOS_COLORS.gray3,
  },
  phaseText: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    textTransform: 'capitalize',
  },
  periodText: {
    fontSize: 11,
    color: IOS_COLORS.gray,
  },
});

// Table styles - 5-column layout matching RaceConditionsCard (Tufte: minimal borders)
const tableStyles = StyleSheet.create({
  container: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.gray6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeCol: {
    width: 42,
  },
  eventCol: {
    width: 44,
  },
  dataCol: {
    flex: 1,
    minWidth: 48,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  dataRowHighlight: {
    backgroundColor: `${IOS_COLORS.yellow}15`,
  },
  dataRowLast: {
    borderBottomWidth: 0,
  },
  dataCell: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  timeText: {
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  eventText: {
    fontSize: 11,
    color: IOS_COLORS.gray,
  },
  eventTextBold: {
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  dataCellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
    minWidth: 22,
  },
  dataValueStrong: {
    color: IOS_COLORS.orange,
  },
  dataLabel: {
    fontSize: 10,
    color: IOS_COLORS.gray2,
  },
});

export default RaceCardEnhanced;
