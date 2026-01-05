/**
 * DistanceRaceCard Component
 *
 * Tufte-inspired distance race card matching RaceCardEnhanced design
 * Features:
 * - Vertical stacked sparklines for wind, current, waves
 * - Full 5-row timeline table
 * - Route preview section showing waypoint progression
 * - Purple theme for visual differentiation from fleet racing
 */

import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import { Sparkline, WindArrow } from '@/components/shared/charts';
import { TufteTokens } from '@/constants/designSystem';
import { calculateCountdown } from '@/constants/mockData';
import { useRouter } from 'expo-router';
import { Clock, Navigation, Route } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Distance racing purple theme
const DISTANCE_COLORS = {
  primary: '#7C3AED',
  accent: '#8B5CF6',
  badgeBg: '#EDE9FE',
  badgeText: '#7C3AED',
  routeBg: '#F5F3FF',
} as const;

// Timeline interface matching RaceCardEnhanced
interface DistanceRaceTimeline {
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

// Route waypoint type
interface RouteWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'waypoint' | 'gate' | 'finish';
  required: boolean;
  passingSide?: 'port' | 'starboard' | 'either';
  notes?: string;
}

export interface DistanceRaceCardProps {
  id: string;
  name: string;
  date: string;
  startTime: string;

  // Distance race specific
  startVenue: string;
  finishVenue?: string;
  totalDistanceNm?: number;
  timeLimitHours?: number;
  routeWaypoints?: RouteWaypoint[];
  courseName?: string | null;
  numberOfLegs?: number;

  // Weather
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  } | null;

  // Tide
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack';
    height?: number;
  } | null;

  // Communications
  vhf_channel?: string | null;

  // UI state
  isPrimary?: boolean;
  isMock?: boolean;
  raceStatus?: 'past' | 'next' | 'future';
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  isDimmed?: boolean;
  cardWidth?: number;
  cardHeight?: number;

  /** Conditions timeline data */
  conditionsTimeline?: DistanceRaceTimeline[];
}

/**
 * Generate synthetic timeline for distance races
 * Creates 5 points: -30m, Warn, Start, Mid, Finish
 */
function generateSyntheticTimeline(
  date: string,
  startTime: string,
  wind?: { direction: string; speedMin: number; speedMax: number } | null,
  tide?: { state: string; height?: number } | null,
  timeLimitHours?: number
): DistanceRaceTimeline[] {
  const raceDate = new Date(date);
  const [hours, minutes] = startTime.split(':').map(Number);
  if (!isNaN(hours) && !isNaN(minutes)) {
    raceDate.setHours(hours, minutes, 0, 0);
  }

  const warningTime = new Date(raceDate.getTime() - 5 * 60 * 1000);
  const beforeTime = new Date(warningTime.getTime() - 30 * 60 * 1000);
  // For distance races, mid and finish times depend on time limit
  const raceDurationMs = (timeLimitHours || 3) * 60 * 60 * 1000;
  const midRaceTime = new Date(raceDate.getTime() + raceDurationMs * 0.4);
  const finishTime = new Date(raceDate.getTime() + raceDurationMs * 0.8);

  const cardinalToDegrees = (dir: string): number => {
    const cardinals: Record<string, number> = {
      N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
      S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
    };
    return cardinals[dir.toUpperCase()] ?? 180;
  };

  const windMin = wind?.speedMin ?? 10;
  const windMax = wind?.speedMax ?? 15;
  const windDirection = wind ? cardinalToDegrees(wind.direction) : 180;
  const tidePhase = (tide?.state as any) || 'slack';

  const createWindSpeed = (position: number) => {
    const waveValue = Math.sin(position * Math.PI);
    return Math.round(windMin + (windMax - windMin) * waveValue);
  };

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
 * Summary Section with Sparklines - Vertical stacked rows
 */
function SummarySection({
  timeline,
  wind,
}: {
  timeline?: DistanceRaceTimeline[];
  wind?: { direction: string; speedMin: number; speedMax: number } | null;
}) {
  const windData = useMemo(() => {
    if (timeline && timeline.length >= 2) {
      return timeline.map((t) => t.windSpeed);
    }
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

  const first = timeline?.[0];
  const last = timeline?.[timeline?.length - 1];

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

/**
 * Full Timeline Table - 5 columns
 */
function FullTimelineTable({ timeline }: { timeline: DistanceRaceTimeline[] }) {
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
      <View style={tableStyles.headerRow}>
        <Text style={[tableStyles.headerCell, tableStyles.timeCol]}>Time</Text>
        <Text style={[tableStyles.headerCell, tableStyles.eventCol]}>Event</Text>
        <Text style={[tableStyles.headerCell, tableStyles.dataCol]}>Wind</Text>
        <Text style={[tableStyles.headerCell, tableStyles.dataCol]}>Current</Text>
        <Text style={[tableStyles.headerCell, tableStyles.dataCol]}>Waves</Text>
      </View>

      {timeline.map((point, index) => (
        <View
          key={index}
          style={[
            tableStyles.dataRow,
            isRaceEvent(point.shortLabel) && tableStyles.dataRowHighlight,
            index === timeline.length - 1 && tableStyles.dataRowLast,
          ]}
        >
          <Text style={[tableStyles.dataCell, tableStyles.timeCol, tableStyles.timeText]}>
            {formatTime(point.time)}
          </Text>
          <View style={tableStyles.eventCol}>
            <Text
              style={[
                tableStyles.dataCell,
                tableStyles.eventText,
                isRaceEvent(point.shortLabel) && tableStyles.eventTextBold,
              ]}
            >
              {point.shortLabel}
            </Text>
          </View>
          <View style={[tableStyles.dataCol, tableStyles.dataCellRow]}>
            <Text style={tableStyles.dataValue}>{point.windSpeed}</Text>
            <WindArrow direction={point.windDirection} size={10} />
            <Text style={tableStyles.dataLabel}>{getWindDir(point.windDirection)}</Text>
          </View>
          <View style={[tableStyles.dataCol, tableStyles.dataCellRow]}>
            <Text
              style={[
                tableStyles.dataValue,
                point.currentSpeed && point.currentSpeed > 0.3 && tableStyles.dataValueStrong,
              ]}
            >
              {point.currentSpeed?.toFixed(1) ?? '–'}
            </Text>
            <Text style={tableStyles.dataLabel}>{point.tidePhase.slice(0, 3)}</Text>
          </View>
          <View style={[tableStyles.dataCol, tableStyles.dataCellRow]}>
            <Text style={tableStyles.dataValue}>{point.waveHeight?.toFixed(1) ?? '–'}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Route Preview - Visual route with start/waypoints/finish
 */
function RoutePreview({
  waypointCount,
  totalDistanceNm,
  finishVenue,
  startVenue,
}: {
  waypointCount: number;
  totalDistanceNm?: number;
  finishVenue?: string;
  startVenue: string;
}) {
  return (
    <View style={routeStyles.container}>
      <Text style={routeStyles.title}>ROUTE PREVIEW</Text>
      <View style={routeStyles.visualization}>
        <View style={routeStyles.routeLine}>
          {/* Start */}
          <View style={routeStyles.pointContainer}>
            <View style={[routeStyles.point, routeStyles.pointStart]} />
            <Text style={routeStyles.pointLabel}>Start</Text>
          </View>

          {/* Waypoints */}
          {waypointCount > 2 && (
            <View style={routeStyles.waypointsContainer}>
              <View style={routeStyles.lineSegment} />
              {Array.from({ length: Math.min(waypointCount - 2, 4) }).map((_, i) => (
                <View key={i} style={routeStyles.pointSmall} />
              ))}
              {waypointCount > 6 && <Text style={routeStyles.moreText}>+{waypointCount - 6}</Text>}
              <View style={routeStyles.lineSegment} />
            </View>
          )}
          {waypointCount <= 2 && <View style={routeStyles.lineSegmentLong} />}

          {/* Finish */}
          <View style={routeStyles.pointContainer}>
            <View style={[routeStyles.point, routeStyles.pointFinish]} />
            <Text style={routeStyles.pointLabel}>
              {finishVenue && finishVenue !== startVenue ? finishVenue : 'Finish'}
            </Text>
          </View>
        </View>

        {/* Distance overlay */}
        {totalDistanceNm && (
          <View style={routeStyles.distanceOverlay}>
            <Text style={routeStyles.distanceValue}>{totalDistanceNm}nm</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function DistanceRaceCard({
  id,
  name,
  date,
  startTime,
  startVenue,
  finishVenue,
  totalDistanceNm,
  timeLimitHours,
  routeWaypoints = [],
  courseName,
  numberOfLegs,
  wind,
  tide,
  vhf_channel,
  isPrimary = false,
  isMock = false,
  raceStatus = 'future',
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onHide,
  isDimmed = false,
  cardWidth: propCardWidth,
  conditionsTimeline,
}: DistanceRaceCardProps) {
  const router = useRouter();

  // Countdown with live updates
  const currentMinute = useMemo(() => Math.floor(Date.now() / 60000), []);
  const [minuteTick, setMinuteTick] = useState(currentMinute);

  const countdown = useMemo(() => {
    return calculateCountdown(date, startTime);
  }, [date, startTime, minuteTick]);

  useEffect(() => {
    if (raceStatus === 'past') return;
    const interval = setInterval(() => {
      setMinuteTick(Math.floor(Date.now() / 60000));
    }, 60000);
    return () => clearInterval(interval);
  }, [raceStatus]);

  // Menu items
  const menuItems = useMemo<CardMenuItem[]>(() => {
    const items: CardMenuItem[] = [];
    if (onEdit) items.push({ label: 'Edit Race', icon: 'create-outline', onPress: onEdit });
    if (onHide) items.push({ label: 'Hide from Timeline', icon: 'eye-off-outline', onPress: onHide });
    if (onDelete) items.push({ label: 'Delete Race', icon: 'trash-outline', onPress: onDelete, variant: 'destructive' });
    return items;
  }, [onEdit, onDelete, onHide]);

  const handlePress = () => {
    if (onSelect) {
      onSelect();
      return;
    }
    router.push(`/(tabs)/race/scrollable/${id}` as any);
  };

  const cardWidth = propCardWidth ?? Math.min(SCREEN_WIDTH - 32, 375);

  // Generate timeline
  const effectiveTimeline = useMemo(() => {
    if (conditionsTimeline && conditionsTimeline.length >= 3) {
      return conditionsTimeline;
    }
    return generateSyntheticTimeline(date, startTime, wind, tide, timeLimitHours);
  }, [conditionsTimeline, date, startTime, wind, tide, timeLimitHours]);

  // Countdown display
  const countdownDisplay = useMemo(() => {
    if (raceStatus === 'past') return 'Completed';
    if (countdown.days > 0) return `${countdown.days}d ${countdown.hours}h`;
    if (countdown.hours > 0) return `${countdown.hours}h ${countdown.minutes}m`;
    return `${countdown.minutes}m`;
  }, [countdown, raceStatus]);

  // Countdown style
  const getCountdownStyle = () => {
    if (raceStatus === 'past') return { text: '#6B7280' };
    if (countdown.days > 7) return { text: '#7C3AED' };
    if (countdown.days >= 2) return { text: '#854D0E' };
    if (countdown.days >= 1) return { text: '#C2410C' };
    return { text: '#DC2626' };
  };
  const countdownStyle = getCountdownStyle();

  // Accent color
  const getAccentColor = () => {
    if (raceStatus === 'past') return '#9CA3AF';
    if (countdown.days <= 1) return '#EF4444';
    if (countdown.days <= 3) return '#F59E0B';
    return DISTANCE_COLORS.primary;
  };
  const accentColor = getAccentColor();

  // Format date
  const formattedDate = useMemo(() => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [date]);

  const waypointCount = numberOfLegs || routeWaypoints.length;

  return (
    <View style={{ width: cardWidth, flexShrink: 0, flexGrow: 0 }}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          styles.cardApple,
          { width: '100%' },
          isSelected && styles.cardSelected,
          pressed && styles.cardPressed,
          isDimmed && styles.cardDimmed,
        ]}
        onPress={handlePress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`View details for ${name}`}
      >
        {/* Accent Line */}
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

        {/* Menu */}
        {menuItems.length > 0 && (
          <View style={styles.menuContainer}>
            <CardMenu items={menuItems} />
          </View>
        )}

        {/* Header Zone */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Badges */}
            <View style={styles.badgeRow}>
              <View style={styles.distanceBadge}>
                <Navigation size={10} color={DISTANCE_COLORS.badgeText} />
                <Text style={styles.distanceBadgeText}>DISTANCE</Text>
              </View>
              {waypointCount > 0 && (
                <View style={styles.legBadge}>
                  <Text style={styles.legBadgeText}>{waypointCount} legs</Text>
                </View>
              )}
              {isMock && (
                <View style={styles.mockBadge}>
                  <Text style={styles.mockBadgeText}>DEMO</Text>
                </View>
              )}
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.infoLine} numberOfLines={1}>
              {startVenue} · {formattedDate} · {startTime}
            </Text>
          </View>

          {/* Countdown */}
          <Text style={[styles.countdownValue, { color: countdownStyle.text }]}>{countdownDisplay}</Text>
        </View>

        {/* Summary Section with Sparklines */}
        <SummarySection timeline={effectiveTimeline} wind={wind} />

        {/* Route Preview */}
        <RoutePreview
          waypointCount={waypointCount}
          totalDistanceNm={totalDistanceNm}
          finishVenue={finishVenue}
          startVenue={startVenue}
        />

        {/* Time Limit Badge */}
        {timeLimitHours && raceStatus !== 'past' && (
          <View style={styles.timeLimitRow}>
            <Clock size={14} color={DISTANCE_COLORS.primary} />
            <Text style={styles.timeLimitText}>Time Limit: {timeLimitHours}h</Text>
            {totalDistanceNm && (
              <>
                <View style={styles.timeLimitDivider} />
                <Route size={14} color={DISTANCE_COLORS.primary} />
                <Text style={styles.timeLimitText}>{totalDistanceNm}nm</Text>
              </>
            )}
          </View>
        )}

        {/* Full Timeline Table */}
        <FullTimelineTable timeline={effectiveTimeline} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 8,
    overflow: 'visible',
    ...Platform.select({
      web: {
        boxShadow:
          '0 1px 3px rgba(124, 58, 237, 0.06), 0 6px 16px rgba(124, 58, 237, 0.1), 0 12px 32px rgba(0, 0, 0, 0.06)',
      },
      default: {
        // Apple-style card lift: border + shadow work together
        borderWidth: 1,
        borderColor: '#E5E7EB', // gray-200 - subtle but visible
        // Shadow provides depth perception (stronger to match web)
        shadowColor: DISTANCE_COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
  },
  cardApple: {},
  cardSelected: {
    backgroundColor: '#F5F3FF',
    ...Platform.select({
      web: {
        boxShadow:
          '0 2px 4px rgba(124, 58, 237, 0.1), 0 8px 20px rgba(124, 58, 237, 0.15), 0 16px 40px rgba(0, 0, 0, 0.08)',
      },
      default: {
        borderWidth: 1.5,
        borderColor: '#C4B5FD',
        shadowColor: DISTANCE_COLORS.primary,
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
  cardDimmed: {
    opacity: 0.45,
  },
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
  menuContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 20,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: DISTANCE_COLORS.badgeBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  distanceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: DISTANCE_COLORS.badgeText,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  legBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  legBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  mockBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
  },
  mockBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    ...TufteTokens.typography.primary,
    fontSize: 17,
    marginBottom: 4,
  },
  infoLine: {
    ...TufteTokens.typography.tertiary,
    marginTop: 2,
  },
  countdownValue: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: DISTANCE_COLORS.primary,
  },
  timeLimitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DISTANCE_COLORS.routeBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: TufteTokens.spacing.standard,
  },
  timeLimitText: {
    fontSize: 12,
    fontWeight: '600',
    color: DISTANCE_COLORS.primary,
  },
  timeLimitDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#DDD6FE',
    marginHorizontal: 4,
  },
});

// Summary section styles
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

// Route preview styles
const routeStyles = StyleSheet.create({
  container: {
    backgroundColor: DISTANCE_COLORS.routeBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: TufteTokens.spacing.standard,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: DISTANCE_COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  visualization: {
    position: 'relative',
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pointContainer: {
    alignItems: 'center',
    width: 50,
  },
  point: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    marginBottom: 4,
  },
  pointStart: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  pointFinish: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  pointSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C4B5FD',
    borderWidth: 1,
    borderColor: '#A78BFA',
    marginHorizontal: 3,
  },
  pointLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  waypointsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  lineSegment: {
    flex: 1,
    height: 2,
    backgroundColor: '#C4B5FD',
    maxWidth: 30,
  },
  lineSegmentLong: {
    flex: 1,
    height: 2,
    backgroundColor: '#C4B5FD',
    marginHorizontal: 6,
  },
  moreText: {
    fontSize: 9,
    fontWeight: '600',
    color: DISTANCE_COLORS.primary,
    marginHorizontal: 3,
  },
  distanceOverlay: {
    position: 'absolute',
    bottom: -2,
    right: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  distanceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: DISTANCE_COLORS.primary,
  },
});

// Table styles
const tableStyles = StyleSheet.create({
  container: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
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
  },
  dataRowHighlight: {
    backgroundColor: '#F5F3FF', // Purple tint for distance races
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
    color: '#F59E0B',
  },
  dataLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
});

export default DistanceRaceCard;
