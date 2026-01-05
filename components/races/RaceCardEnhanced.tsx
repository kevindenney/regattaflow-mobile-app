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

import { TufteTokens, createTufteCardStyle } from '@/constants/designSystem';
import { calculateCountdown } from '@/constants/mockData';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import React, { useMemo, useState, useEffect } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkline, WindArrow } from '@/components/shared/charts';

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
  /** Conditions timeline data from useEnrichedRaces */
  conditionsTimeline?: RaceConditionsTimeline[];
  /** Fleet name */
  fleetName?: string;
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
            color="#3B82F6"
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
            color="#10B981"
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
            color="#0EA5E9"
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
  conditionsTimeline,
  fleetName,
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

  // Countdown urgency color
  const getCountdownStyle = () => {
    if (raceStatus === 'past') return { bg: '#F3F4F6', text: '#6B7280' };
    if (countdown.days > 7) return { bg: '#ECFDF5', text: '#065F46' };
    if (countdown.days >= 2) return { bg: '#FEF9C3', text: '#854D0E' };
    if (countdown.days >= 1) return { bg: '#FFEDD5', text: '#C2410C' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  };
  const countdownStyle = getCountdownStyle();

  // Format date
  const formattedDate = useMemo(() => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [date]);

  return (
    <View
      style={{
        width: cardWidth,
        flexShrink: 0,
        flexGrow: 0,
      }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { width: '100%' },
          isSelected && styles.cardSelected,
          pressed && styles.cardPressed,
        ]}
        onPress={handlePress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`View details for ${name}`}
      >
      {/* Header Zone */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Fleet badge */}
          {fleetName && (
            <View style={styles.fleetBadge}>
              <Text style={styles.fleetBadgeText}>{fleetName}</Text>
            </View>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.venueRow}>
            <MapPin size={12} color="#64748B" />
            <Text style={styles.venue} numberOfLines={1}>
              {venue}
            </Text>
          </View>
        </View>

        {/* Countdown */}
        <View
          style={[styles.countdown, { backgroundColor: countdownStyle.bg }]}
        >
          <Text style={[styles.countdownValue, { color: countdownStyle.text }]}>
            {countdownDisplay}
          </Text>
          <Text style={styles.countdownLabel}>
            {raceStatus === 'past' ? '' : 'until start'}
          </Text>
        </View>
      </View>

      {/* Date + Time Row */}
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.dateSeparator}>|</Text>
        <Text style={styles.dateText}>Start: {startTime}</Text>
        {vhf_channel && (
          <>
            <Text style={styles.dateSeparator}>|</Text>
            <Text style={styles.dateText}>VHF {vhf_channel}</Text>
          </>
        )}
      </View>

      {/* Summary Section with Sparklines */}
      <SummarySection timeline={effectiveTimeline} wind={wind} />

      {/* Full Timeline Table */}
      <FullTimelineTable timeline={effectiveTimeline} />

      {/* Units Footer */}
      <View style={styles.unitsFooter}>
        <Text style={styles.unitsFooterText}>
          Wind: knots • Current: knots • Waves: meters
        </Text>
      </View>

      {/* Action hint */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap for full race details</Text>
      </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...createTufteCardStyle('medium'),
    // Note: margins removed - parent ScrollView handles gap via `gap` prop
    marginVertical: 8,
    overflow: 'hidden', // Prevent content from bleeding outside card bounds
    ...Platform.select({
      web: TufteTokens.shadows.subtleWeb,
      default: {},
    }),
  },
  cardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.95,
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
  fleetBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  fleetBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369A1',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  title: {
    ...TufteTokens.typography.primary,
    fontSize: 17,
    marginBottom: 4,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venue: {
    ...TufteTokens.typography.tertiary,
    flex: 1,
  },
  countdown: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: TufteTokens.borderRadius.subtle,
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    ...TufteTokens.typography.micro,
    marginTop: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: TufteTokens.spacing.standard,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.color,
    marginBottom: TufteTokens.spacing.standard,
  },
  dateText: {
    ...TufteTokens.typography.secondary,
    fontVariant: ['tabular-nums'],
  },
  dateSeparator: {
    ...TufteTokens.typography.tertiary,
    marginHorizontal: 8,
  },
  unitsFooter: {
    paddingTop: TufteTokens.spacing.tight,
    alignItems: 'center',
  },
  unitsFooterText: {
    fontSize: 10,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  footer: {
    paddingTop: TufteTokens.spacing.standard,
    borderTopWidth: TufteTokens.borders.hairline,
    borderTopColor: TufteTokens.borders.color,
    alignItems: 'center',
  },
  footerText: {
    ...TufteTokens.typography.secondary,
    color: '#475569',
  },
});

// Summary section styles - vertical stacked sparklines matching RaceConditionsCard
const summaryStyles = StyleSheet.create({
  container: {
    gap: 8,
    paddingBottom: 12,
    marginBottom: TufteTokens.spacing.standard,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    color: '#64748B',
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
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  valueUnit: {
    fontSize: 11,
    color: '#94A3B8',
  },
  directionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 56,
  },
  directionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  directionArrow: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  phaseText: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  periodText: {
    fontSize: 11,
    color: '#64748B',
  },
});

// Table styles - 5-column layout matching RaceConditionsCard
const tableStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
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
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dataRowHighlight: {
    backgroundColor: '#FFFBEB',
  },
  dataRowLast: {
    borderBottomWidth: 0,
  },
  dataCell: {
    fontSize: 12,
    color: '#334155',
  },
  timeText: {
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
    color: '#64748B',
  },
  eventText: {
    fontSize: 11,
    color: '#64748B',
  },
  eventTextBold: {
    fontWeight: '600',
    color: '#0F172A',
  },
  dataCellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
    minWidth: 22,
  },
  dataValueStrong: {
    color: '#F59E0B', // Amber for high current
  },
  dataLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
});

export default RaceCardEnhanced;
