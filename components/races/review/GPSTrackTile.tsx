/**
 * GPSTrackTile - Apple Weather-inspired GPS track widget (large 2x2 tile)
 *
 * Large tile (full width of 2-column row) showing GPS track mini-map
 * with key stats. Falls back to a "No track" placeholder when no data.
 *
 * Enhanced with:
 * - VMG (Velocity Made Good) calculation when wind direction is available
 * - Tack/gybe detection from heading changes
 * - Speed-over-time SVG chart colored by leg phase
 * - Per-leg stats breakdown (distance, avg speed, avg VMG, time)
 *
 * Follows IOSWidgetCard animation (Reanimated scale 0.96 spring, haptics)
 * and IOSConditionsWidgets visual style.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { Navigation, Route, Check, Clock, Gauge, MapPin, Wind, Repeat, ArrowUpDown } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import { supabase } from '@/services/supabase';
import { LocationPreviewMap } from './LocationPreviewMap';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  teal: '#5AC8FA',
  red: '#FF3B30',
  indigo: '#5856D6',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#48484A',
  background: '#FFFFFF',
  upwind: '#34C759',
  downwind: '#007AFF',
};

// Tile dimensions: 2 small tiles wide + gap = 155 + 12 + 155 = 322
const TILE_WIDTH = 322;
const COMPACT_TILE_HEIGHT = 322;
const MAP_HEIGHT = 200;
const MAP_PADDING = 16;
const SPEED_CHART_HEIGHT = 60;
const SPEED_CHART_WIDTH = TILE_WIDTH - MAP_PADDING * 2 - 24; // padding from tile + internal

// --- Constants for analysis ---
const MS_TO_KNOTS = 1.94384;
const HEADING_CHANGE_THRESHOLD = 60; // degrees for tack/gybe detection
const MANEUVER_TIME_WINDOW_MS = 15000; // 15s window for detecting a single maneuver

interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

interface TrackData {
  id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  track_points: GPSPoint[];
  wind_direction: number | null;
}

export interface GPSTrackTileProps {
  raceId: string;
  userId?: string;
  timerSessionId?: string;
  /** Race location coordinates (shown on map when no track data) */
  raceLatitude?: number;
  raceLongitude?: number;
  /** Venue display name */
  raceVenue?: string;
  onPress: () => void;
}

// =============================================================================
// Pure computation functions
// =============================================================================

/** Haversine distance in nautical miles */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Format seconds as M:SS */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Normalize heading difference to [-180, 180] */
function headingDiff(a: number, b: number): number {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

/**
 * Calculate VMG: speed * cos(angle between heading and wind direction)
 * Positive VMG = making progress toward wind (upwind VMG)
 * For downwind, we compute VMG toward the downwind direction (wind + 180)
 */
function calcVMG(speedMs: number, heading: number, windDir: number): { upwind: number; downwind: number } {
  const toRad = Math.PI / 180;
  // Upwind VMG: component of boat speed directly into the wind
  // Wind comes FROM windDir, so upwind target bearing = windDir
  const upwindAngle = Math.abs(headingDiff(heading, windDir));
  const upwindVMG = speedMs * MS_TO_KNOTS * Math.cos(upwindAngle * toRad);

  // Downwind VMG: component of boat speed directly away from the wind
  const downwindDir = (windDir + 180) % 360;
  const downwindAngle = Math.abs(headingDiff(heading, downwindDir));
  const downwindVMG = speedMs * MS_TO_KNOTS * Math.cos(downwindAngle * toRad);

  return { upwind: upwindVMG, downwind: downwindVMG };
}

/** Determine if a heading relative to wind is upwind (<= 90 from wind) */
function isUpwindHeading(heading: number, windDir: number): boolean {
  const angle = Math.abs(headingDiff(heading, windDir));
  return angle <= 90;
}

interface Maneuver {
  index: number;
  type: 'tack' | 'gybe';
  headingChange: number;
  timestamp: string;
}

interface DetectedLeg {
  startIndex: number;
  endIndex: number;
  phase: 'upwind' | 'downwind' | 'unknown';
  distance: number; // nm
  avgSpeedKts: number;
  avgVMGKts: number | null; // null if no wind data
  durationSeconds: number;
}

interface TrackAnalysis {
  totalDistance: number;
  maxSpeedKts: number;
  duration: number;
  tacks: number;
  gybes: number;
  maneuvers: Maneuver[];
  avgUpwindVMG: number | null;
  avgDownwindVMG: number | null;
  legs: DetectedLeg[];
  speedTimeSeries: { elapsedSec: number; speedKts: number; phase: 'upwind' | 'downwind' | 'unknown' }[];
  hasGaps: boolean;
  windAvailable: boolean;
}

/**
 * Detect tacks and gybes from heading changes.
 * A maneuver is a heading change > HEADING_CHANGE_THRESHOLD within MANEUVER_TIME_WINDOW_MS.
 * Type depends on wind direction: heading change while upwind = tack, while downwind = gybe.
 * Without wind data, we classify by the magnitude: >90° = tack, else gybe.
 */
function detectManeuvers(points: GPSPoint[], windDir: number | null): Maneuver[] {
  const maneuvers: Maneuver[] = [];
  if (points.length < 3) return maneuvers;

  let i = 1;
  while (i < points.length) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev.heading == null || curr.heading == null) {
      i++;
      continue;
    }

    const change = Math.abs(headingDiff(prev.heading, curr.heading));
    if (change > HEADING_CHANGE_THRESHOLD) {
      // Check if this is within a reasonable time window
      const dt = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
      if (dt <= MANEUVER_TIME_WINDOW_MS && dt > 0) {
        let type: 'tack' | 'gybe';
        if (windDir != null) {
          type = isUpwindHeading(prev.heading, windDir) ? 'tack' : 'gybe';
        } else {
          type = change > 90 ? 'tack' : 'gybe';
        }
        maneuvers.push({ index: i, type, headingChange: change, timestamp: curr.timestamp });
        // Skip ahead a few points to avoid double-counting the same maneuver
        i += 2;
        continue;
      }
    }
    i++;
  }

  return maneuvers;
}

/**
 * Segment track into legs based on maneuver points.
 * Each leg runs between consecutive maneuvers.
 */
function segmentLegs(
  points: GPSPoint[],
  maneuvers: Maneuver[],
  windDir: number | null,
): DetectedLeg[] {
  if (points.length < 2) return [];

  const boundaries = [0, ...maneuvers.map((m) => m.index), points.length - 1];
  const legs: DetectedLeg[] = [];

  for (let b = 0; b < boundaries.length - 1; b++) {
    const startIdx = boundaries[b];
    const endIdx = boundaries[b + 1];
    if (endIdx <= startIdx) continue;

    let dist = 0;
    const speeds: number[] = [];
    const vmgValues: number[] = [];

    for (let i = startIdx + 1; i <= endIdx; i++) {
      dist += haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
      if (points[i].speed != null && points[i].speed! > 0) {
        speeds.push(points[i].speed! * MS_TO_KNOTS);
      }
      if (windDir != null && points[i].speed != null && points[i].heading != null) {
        const vmg = calcVMG(points[i].speed!, points[i].heading!, windDir);
        // Pick the VMG component that matches the leg phase
        const upwind = isUpwindHeading(points[i].heading!, windDir);
        vmgValues.push(upwind ? vmg.upwind : vmg.downwind);
      }
    }

    const startTime = new Date(points[startIdx].timestamp).getTime();
    const endTime = new Date(points[endIdx].timestamp).getTime();
    const durationSec = (endTime - startTime) / 1000;

    // Determine leg phase from the dominant heading direction
    let phase: 'upwind' | 'downwind' | 'unknown' = 'unknown';
    if (windDir != null) {
      let upwindCount = 0;
      let total = 0;
      for (let i = startIdx; i <= endIdx; i++) {
        if (points[i].heading != null) {
          total++;
          if (isUpwindHeading(points[i].heading!, windDir)) upwindCount++;
        }
      }
      if (total > 0) {
        phase = upwindCount / total > 0.5 ? 'upwind' : 'downwind';
      }
    }

    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const avgVMG = vmgValues.length > 0 ? vmgValues.reduce((a, b) => a + b, 0) / vmgValues.length : null;

    legs.push({
      startIndex: startIdx,
      endIndex: endIdx,
      phase,
      distance: dist,
      avgSpeedKts: avgSpeed,
      avgVMGKts: avgVMG,
      durationSeconds: Math.max(durationSec, 0),
    });
  }

  return legs;
}

/** Full track analysis computation — deterministic, pure function */
function analyzeTrack(points: GPSPoint[], windDir: number | null): TrackAnalysis | null {
  if (!points || points.length < 2) return null;

  // Check for GPS gaps (>30 seconds between consecutive points)
  let hasGaps = false;
  for (let i = 1; i < points.length; i++) {
    const dt = new Date(points[i].timestamp).getTime() - new Date(points[i - 1].timestamp).getTime();
    if (dt > 30000) {
      hasGaps = true;
      break;
    }
  }

  // Basic stats
  let totalDistance = 0;
  let maxSpeedMs = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
    if (points[i].speed != null && points[i].speed! > maxSpeedMs) maxSpeedMs = points[i].speed!;
  }

  const startMs = new Date(points[0].timestamp).getTime();
  const endMs = new Date(points[points.length - 1].timestamp).getTime();
  const duration = (endMs - startMs) / 1000;

  // Maneuvers
  const maneuvers = detectManeuvers(points, windDir);
  const tacks = maneuvers.filter((m) => m.type === 'tack').length;
  const gybes = maneuvers.filter((m) => m.type === 'gybe').length;

  // Legs
  const legs = segmentLegs(points, maneuvers, windDir);

  // VMG averages
  let avgUpwindVMG: number | null = null;
  let avgDownwindVMG: number | null = null;
  if (windDir != null) {
    const upwindVMGs: number[] = [];
    const downwindVMGs: number[] = [];

    for (const p of points) {
      if (p.speed != null && p.speed > 0 && p.heading != null) {
        const vmg = calcVMG(p.speed, p.heading, windDir);
        if (isUpwindHeading(p.heading, windDir)) {
          if (vmg.upwind > 0) upwindVMGs.push(vmg.upwind);
        } else {
          if (vmg.downwind > 0) downwindVMGs.push(vmg.downwind);
        }
      }
    }

    if (upwindVMGs.length > 0) {
      avgUpwindVMG = upwindVMGs.reduce((a, b) => a + b, 0) / upwindVMGs.length;
    }
    if (downwindVMGs.length > 0) {
      avgDownwindVMG = downwindVMGs.reduce((a, b) => a + b, 0) / downwindVMGs.length;
    }
  }

  // Speed time series (downsample to ~100 points for chart)
  const step = Math.max(1, Math.floor(points.length / 100));
  const speedTimeSeries: TrackAnalysis['speedTimeSeries'] = [];
  for (let i = 0; i < points.length; i += step) {
    const p = points[i];
    const elapsedSec = (new Date(p.timestamp).getTime() - startMs) / 1000;
    const speedKts = (p.speed || 0) * MS_TO_KNOTS;
    let phase: 'upwind' | 'downwind' | 'unknown' = 'unknown';
    if (windDir != null && p.heading != null) {
      phase = isUpwindHeading(p.heading, windDir) ? 'upwind' : 'downwind';
    }
    speedTimeSeries.push({ elapsedSec, speedKts, phase });
  }
  // Always include the last point
  const lastPt = points[points.length - 1];
  if (speedTimeSeries.length === 0 || speedTimeSeries[speedTimeSeries.length - 1].elapsedSec !== duration) {
    speedTimeSeries.push({
      elapsedSec: duration,
      speedKts: (lastPt.speed || 0) * MS_TO_KNOTS,
      phase: windDir != null && lastPt.heading != null
        ? (isUpwindHeading(lastPt.heading, windDir) ? 'upwind' : 'downwind')
        : 'unknown',
    });
  }

  return {
    totalDistance,
    maxSpeedKts: maxSpeedMs * MS_TO_KNOTS,
    duration,
    tacks,
    gybes,
    maneuvers,
    avgUpwindVMG,
    avgDownwindVMG,
    legs,
    speedTimeSeries,
    hasGaps,
    windAvailable: windDir != null,
  };
}

/** Convert GPS points to SVG polyline points string */
function pointsToSvg(
  points: GPSPoint[],
  width: number,
  height: number,
  padding: number = 16,
): {
  polylinePoints: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
} | null {
  if (points.length < 2) return null;

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const scaleX = innerW / lngRange;
  const scaleY = innerH / latRange;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (width - lngRange * scale) / 2;
  const offsetY = (height - latRange * scale) / 2;

  const svgPts = points.map((p) => ({
    x: (p.lng - minLng) * scale + offsetX,
    y: height - ((p.lat - minLat) * scale + offsetY),
  }));

  const polylinePoints = svgPts.map((p) => `${p.x},${p.y}`).join(' ');

  return {
    polylinePoints,
    startPoint: svgPts[0],
    endPoint: svgPts[svgPts.length - 1],
  };
}

/** Build SVG polyline segments for the speed chart, one per color phase */
function buildSpeedChartSegments(
  series: TrackAnalysis['speedTimeSeries'],
  chartW: number,
  chartH: number,
): { points: string; color: string }[] {
  if (series.length < 2) return [];

  const maxTime = series[series.length - 1].elapsedSec || 1;
  const maxSpeed = Math.max(...series.map((s) => s.speedKts), 1);

  const toX = (sec: number) => (sec / maxTime) * chartW;
  const toY = (kts: number) => chartH - (kts / maxSpeed) * (chartH - 4); // 4px top padding

  // Build contiguous segments by phase color
  const segments: { points: string; color: string }[] = [];
  let currentColor = phaseColor(series[0].phase);
  let currentPoints: string[] = [`${toX(series[0].elapsedSec)},${toY(series[0].speedKts)}`];

  for (let i = 1; i < series.length; i++) {
    const color = phaseColor(series[i].phase);
    const pt = `${toX(series[i].elapsedSec)},${toY(series[i].speedKts)}`;

    if (color !== currentColor) {
      // Close current segment with overlap point for continuity
      currentPoints.push(pt);
      segments.push({ points: currentPoints.join(' '), color: currentColor });
      // Start new segment from same point
      currentColor = color;
      currentPoints = [pt];
    } else {
      currentPoints.push(pt);
    }
  }

  if (currentPoints.length > 0) {
    segments.push({ points: currentPoints.join(' '), color: currentColor });
  }

  return segments;
}

function phaseColor(phase: 'upwind' | 'downwind' | 'unknown'): string {
  if (phase === 'upwind') return COLORS.upwind;
  if (phase === 'downwind') return COLORS.downwind;
  return COLORS.teal;
}

// =============================================================================
// Speed Chart Component
// =============================================================================

function SpeedChart({ analysis }: { analysis: TrackAnalysis }) {
  const segments = useMemo(
    () => buildSpeedChartSegments(analysis.speedTimeSeries, SPEED_CHART_WIDTH, SPEED_CHART_HEIGHT),
    [analysis.speedTimeSeries],
  );

  if (segments.length === 0) return null;

  const maxSpeed = Math.max(...analysis.speedTimeSeries.map((s) => s.speedKts), 1);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>SPEED</Text>
        <Text style={styles.chartSubtitle}>{maxSpeed.toFixed(1)} kts max</Text>
      </View>
      <View style={styles.chartArea}>
        {/* Y-axis label */}
        <View style={styles.chartYAxis}>
          <Text style={styles.chartAxisLabel}>{maxSpeed.toFixed(0)}</Text>
          <Text style={styles.chartAxisLabel}>0</Text>
        </View>
        <Svg width={SPEED_CHART_WIDTH} height={SPEED_CHART_HEIGHT}>
          {/* Grid lines */}
          <Line
            x1={0} y1={0} x2={SPEED_CHART_WIDTH} y2={0}
            stroke={COLORS.gray5} strokeWidth={0.5}
          />
          <Line
            x1={0} y1={SPEED_CHART_HEIGHT / 2} x2={SPEED_CHART_WIDTH} y2={SPEED_CHART_HEIGHT / 2}
            stroke={COLORS.gray5} strokeWidth={0.5} strokeDasharray="4,4"
          />
          <Line
            x1={0} y1={SPEED_CHART_HEIGHT} x2={SPEED_CHART_WIDTH} y2={SPEED_CHART_HEIGHT}
            stroke={COLORS.gray5} strokeWidth={0.5}
          />
          {/* Speed line segments colored by phase */}
          {segments.map((seg, idx) => (
            <Polyline
              key={idx}
              points={seg.points}
              fill="none"
              stroke={seg.color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </View>
      {/* Legend */}
      {analysis.windAvailable && (
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.upwind }]} />
            <Text style={styles.legendLabel}>Upwind</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.downwind }]} />
            <Text style={styles.legendLabel}>Downwind</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// Leg Stats Component
// =============================================================================

function LegStats({ legs, windAvailable }: { legs: DetectedLeg[]; windAvailable: boolean }) {
  if (legs.length === 0) return null;

  // Only show meaningful legs (> 5 seconds, > 0.001 nm)
  const meaningfulLegs = legs.filter((l) => l.durationSeconds > 5 && l.distance > 0.001);
  if (meaningfulLegs.length === 0) return null;

  // Cap at 8 legs for display
  const displayLegs = meaningfulLegs.slice(0, 8);

  return (
    <View style={styles.legsContainer}>
      <Text style={styles.legsTitle}>LEG BREAKDOWN</Text>
      {/* Column headers */}
      <View style={styles.legHeaderRow}>
        <Text style={[styles.legHeaderCell, styles.legNameCol]}>Leg</Text>
        <Text style={[styles.legHeaderCell, styles.legStatCol]}>Dist</Text>
        <Text style={[styles.legHeaderCell, styles.legStatCol]}>Avg Spd</Text>
        {windAvailable && <Text style={[styles.legHeaderCell, styles.legStatCol]}>VMG</Text>}
        <Text style={[styles.legHeaderCell, styles.legStatCol]}>Time</Text>
      </View>
      {displayLegs.map((leg, idx) => {
        const phaseLabel = leg.phase === 'upwind'
          ? `\u25B2 Up ${Math.ceil((idx + 1) / 2)}`
          : leg.phase === 'downwind'
            ? `\u25BC Dn ${Math.ceil((idx + 1) / 2)}`
            : `Leg ${idx + 1}`;
        const phaseTextColor = leg.phase === 'upwind'
          ? COLORS.upwind
          : leg.phase === 'downwind'
            ? COLORS.downwind
            : COLORS.tertiaryLabel;

        return (
          <View key={idx} style={[styles.legRow, idx % 2 === 0 && styles.legRowAlt]}>
            <Text style={[styles.legCell, styles.legNameCol, { color: phaseTextColor }]} numberOfLines={1}>
              {phaseLabel}
            </Text>
            <Text style={[styles.legCell, styles.legStatCol]}>
              {leg.distance < 0.01 ? '<.01' : leg.distance.toFixed(2)}
            </Text>
            <Text style={[styles.legCell, styles.legStatCol]}>
              {leg.avgSpeedKts.toFixed(1)}
            </Text>
            {windAvailable && (
              <Text style={[styles.legCell, styles.legStatCol]}>
                {leg.avgVMGKts != null ? leg.avgVMGKts.toFixed(1) : '—'}
              </Text>
            )}
            <Text style={[styles.legCell, styles.legStatCol]}>
              {formatDuration(leg.durationSeconds)}
            </Text>
          </View>
        );
      })}
      {meaningfulLegs.length > 8 && (
        <Text style={styles.legsOverflow}>+{meaningfulLegs.length - 8} more legs</Text>
      )}
    </View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function GPSTrackTile({
  raceId,
  userId,
  timerSessionId,
  raceLatitude,
  raceLongitude,
  raceVenue,
  onPress,
}: GPSTrackTileProps) {
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(!!timerSessionId);

  // Location state — use props first, then fetch from DB as fallback
  const [dbLocation, setDbLocation] = useState<{ lat: number; lng: number; venue?: string } | null>(null);

  // Fetch track data (now includes wind_direction)
  useEffect(() => {
    if (!timerSessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTrack() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('race_timer_sessions')
          .select('id, start_time, end_time, duration_seconds, track_points, wind_direction')
          .eq('id', timerSessionId!)
          .single();

        if (!cancelled && !error) {
          setTrackData(data);
        }
      } catch {
        // silently fail — tile will show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrack();
    return () => { cancelled = true; };
  }, [timerSessionId]);

  // Fetch race location from regattas table when not provided via props
  useEffect(() => {
    if (typeof raceLatitude === 'number' && typeof raceLongitude === 'number') return;
    if (!raceId) return;

    let cancelled = false;

    async function fetchLocation() {
      try {
        const { data } = await supabase
          .from('regattas')
          .select('latitude, longitude, metadata')
          .eq('id', raceId)
          .single();

        if (cancelled || !data) return;

        const meta = data.metadata as Record<string, any> | undefined;
        const venue = meta?.venue_name || meta?.venue;

        // 1. Try top-level columns (Supabase may return DECIMAL as string)
        const lat = parseFloat(String(data.latitude));
        const lng = parseFloat(String(data.longitude));
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          setDbLocation({ lat, lng, venue });
          return;
        }

        // 2. Try metadata coordinate fields
        if (meta) {
          if (meta.venue_lat && meta.venue_lng) {
            setDbLocation({ lat: Number(meta.venue_lat), lng: Number(meta.venue_lng), venue });
            return;
          }
          if (meta.venue_coordinates?.lat && meta.venue_coordinates?.lng) {
            setDbLocation({ lat: Number(meta.venue_coordinates.lat), lng: Number(meta.venue_coordinates.lng), venue });
            return;
          }
          if (meta.racing_area_coordinates?.lat && meta.racing_area_coordinates?.lng) {
            setDbLocation({ lat: Number(meta.racing_area_coordinates.lat), lng: Number(meta.racing_area_coordinates.lng), venue });
            return;
          }
          if (meta.start_coordinates?.lat && meta.start_coordinates?.lng) {
            setDbLocation({ lat: Number(meta.start_coordinates.lat), lng: Number(meta.start_coordinates.lng), venue });
            return;
          }

          // 3. Lookup via sailing_venues table using venue_id
          if (meta.venue_id) {
            const { data: venueData } = await supabase
              .from('sailing_venues')
              .select('coordinates_lat, coordinates_lng, name')
              .eq('id', meta.venue_id)
              .single();

            if (!cancelled && venueData?.coordinates_lat && venueData?.coordinates_lng) {
              setDbLocation({
                lat: Number(venueData.coordinates_lat),
                lng: Number(venueData.coordinates_lng),
                venue: venue || venueData.name,
              });
              return;
            }
          }

          // 4. Fallback: search sailing_venues by name when venue_name exists but no venue_id
          if (venue && !meta.venue_id) {
            const { data: venueRows } = await supabase
              .from('sailing_venues')
              .select('coordinates_lat, coordinates_lng, name')
              .ilike('name', `%${venue}%`)
              .limit(1);

            const match = venueRows?.[0];
            if (!cancelled && match?.coordinates_lat && match?.coordinates_lng) {
              setDbLocation({
                lat: Number(match.coordinates_lat),
                lng: Number(match.coordinates_lng),
                venue: venue || match.name,
              });
              return;
            }
          }
        }
      } catch {
        // silently fail
      }
    }

    fetchLocation();
    return () => { cancelled = true; };
  }, [raceId, raceLatitude, raceLongitude]);

  // Track analysis (VMG, tacks, gybes, legs, speed series)
  const analysis = useMemo(() => {
    if (!trackData?.track_points?.length) return null;
    return analyzeTrack(trackData.track_points, trackData.wind_direction);
  }, [trackData]);

  // SVG data
  const mapWidth = TILE_WIDTH - MAP_PADDING * 2;
  const svgData = useMemo(() => {
    if (!trackData?.track_points || trackData.track_points.length < 2) return null;
    return pointsToSvg(trackData.track_points, mapWidth, MAP_HEIGHT);
  }, [trackData, mapWidth]);

  const hasTrack = !!svgData;
  const hasAnalysis = !!analysis;

  // Animation
  const scaleVal = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
  }));

  const handlePressIn = () => {
    scaleVal.value = withSpring(0.96, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePressOut = () => {
    scaleVal.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress();
  };

  // Resolved location: props take priority, then DB fetch
  const resolvedLat = typeof raceLatitude === 'number' ? raceLatitude : dbLocation?.lat;
  const resolvedLng = typeof raceLongitude === 'number' ? raceLongitude : dbLocation?.lng;
  const resolvedVenue = raceVenue || dbLocation?.venue;
  const hasRaceLocation = typeof resolvedLat === 'number' && typeof resolvedLng === 'number';

  // Don't render if there's no timer session AND no race location
  if (!timerSessionId && !hasRaceLocation) return null;

  return (
    <AnimatedPressable
      style={[
        styles.tile,
        // Auto-height when we have analysis data, compact otherwise
        hasAnalysis ? styles.tileExpanded : styles.tileCompact,
        hasTrack && styles.tileComplete,
        animatedStyle,
        Platform.OS !== 'web' && IOS_SHADOWS.card,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={
        hasTrack
          ? `GPS Track: ${analysis ? `${formatDuration(analysis.duration)}, ${analysis.maxSpeedKts.toFixed(1)} knots max` : 'recorded'}`
          : 'GPS Track: loading'
      }
    >
      {/* Completion badge */}
      {hasTrack && (
        <View style={styles.completeBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <Navigation size={12} color={COLORS.teal} />
        <Text style={styles.headerLabel}>GPS TRACK</Text>
      </View>

      {/* Map area */}
      <View style={styles.mapContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.teal} />
        ) : svgData ? (
          <Svg width={mapWidth} height={MAP_HEIGHT}>
            <Polyline
              points={svgData.polylinePoints}
              fill="none"
              stroke={COLORS.teal}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx={svgData.startPoint.x}
              cy={svgData.startPoint.y}
              r={5}
              fill={COLORS.green}
            />
            <Circle
              cx={svgData.endPoint.x}
              cy={svgData.endPoint.y}
              r={5}
              fill={COLORS.red}
            />
          </Svg>
        ) : hasRaceLocation ? (
          <View style={styles.locationMapContainer}>
            <LocationPreviewMap
              latitude={resolvedLat!}
              longitude={resolvedLng!}
              width={mapWidth}
              height={MAP_HEIGHT}
            />
            <View style={styles.noTrackOverlay}>
              <View style={styles.noTrackBadge}>
                <Route size={12} color={COLORS.gray} />
                <Text style={styles.noTrackBadgeText}>No track data</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyMap}>
            <Route size={32} color={COLORS.gray3} />
            <Text style={styles.emptyMapText}>No track data</Text>
          </View>
        )}
      </View>

      {/* Primary stats row (Duration / Max Speed / Distance) */}
      {analysis ? (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Clock size={12} color={COLORS.blue} />
            <Text style={styles.statValue}>{formatDuration(analysis.duration)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Gauge size={12} color={COLORS.green} />
            <Text style={styles.statValue}>{analysis.maxSpeedKts.toFixed(1)} kts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MapPin size={12} color={COLORS.orange} />
            <Text style={styles.statValue}>{analysis.totalDistance.toFixed(2)} nm</Text>
          </View>
        </View>
      ) : !loading && hasRaceLocation && resolvedVenue ? (
        <View style={styles.statsRow}>
          <MapPin size={12} color={COLORS.teal} />
          <Text style={styles.statsPlaceholder} numberOfLines={1}>{resolvedVenue}</Text>
        </View>
      ) : !loading ? (
        <View style={styles.statsRow}>
          <Text style={styles.statsPlaceholder}>No stats available</Text>
        </View>
      ) : null}

      {/* Secondary stats row (VMG / Tacks / Gybes) — only when analysis exists */}
      {analysis && (
        <View style={styles.secondaryStatsRow}>
          {analysis.windAvailable && analysis.avgUpwindVMG != null ? (
            <>
              <View style={styles.statItem}>
                <Wind size={11} color={COLORS.upwind} />
                <Text style={styles.statValueSmall}>
                  {analysis.avgUpwindVMG.toFixed(1)}
                </Text>
                <Text style={styles.statLabelSmall}>VMG up</Text>
              </View>
              <View style={styles.statDividerSmall} />
              <View style={styles.statItem}>
                <Wind size={11} color={COLORS.downwind} />
                <Text style={styles.statValueSmall}>
                  {analysis.avgDownwindVMG != null ? analysis.avgDownwindVMG.toFixed(1) : '—'}
                </Text>
                <Text style={styles.statLabelSmall}>VMG dn</Text>
              </View>
              <View style={styles.statDividerSmall} />
            </>
          ) : (
            <View style={styles.noWindHint}>
              <Wind size={10} color={COLORS.gray3} />
              <Text style={styles.noWindText}>Add wind data for VMG</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Repeat size={11} color={COLORS.indigo} />
            <Text style={styles.statValueSmall}>{analysis.tacks}</Text>
            <Text style={styles.statLabelSmall}>Tacks</Text>
          </View>
          <View style={styles.statDividerSmall} />
          <View style={styles.statItem}>
            <ArrowUpDown size={11} color={COLORS.orange} />
            <Text style={styles.statValueSmall}>{analysis.gybes}</Text>
            <Text style={styles.statLabelSmall}>Gybes</Text>
          </View>
        </View>
      )}

      {/* Speed Chart */}
      {analysis && analysis.speedTimeSeries.length >= 2 && (
        <SpeedChart analysis={analysis} />
      )}

      {/* Leg Breakdown */}
      {analysis && (
        <LegStats legs={analysis.legs} windAvailable={analysis.windAvailable} />
      )}

      {/* GPS gap warning */}
      {analysis?.hasGaps && (
        <Text style={styles.gapWarning}>
          Incomplete GPS data — some track segments may be missing
        </Text>
      )}

      {/* Footer */}
      <Text style={styles.hint} numberOfLines={1}>
        {hasTrack ? 'View full analysis' : 'View session'}
      </Text>
    </AnimatedPressable>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  tile: {
    width: TILE_WIDTH,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    padding: 12,
    gap: 6,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
      },
      default: {},
    }),
  },
  tileCompact: {
    height: COMPACT_TILE_HEIGHT,
    justifyContent: 'space-between',
  },
  tileExpanded: {
    // Auto height — no fixed height
  },
  tileComplete: {
    borderColor: `${COLORS.green}60`,
    backgroundColor: `${COLORS.green}06`,
  },
  completeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  mapContainer: {
    height: MAP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  emptyMap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyMapText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray,
  },
  locationMapContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  noTrackOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  noTrackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  noTrackBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
  },

  // --- Stats rows ---
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.label,
  },
  statValueSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.label,
  },
  statLabelSmall: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.gray,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.gray5,
  },
  statDividerSmall: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.gray5,
  },
  statsPlaceholder: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray3,
  },
  noWindHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  noWindText: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.gray3,
  },

  // --- Speed Chart ---
  chartContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray5,
    paddingTop: 6,
    gap: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitle: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 0.6,
  },
  chartSubtitle: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.gray,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartYAxis: {
    justifyContent: 'space-between',
    height: SPEED_CHART_HEIGHT,
    width: 18,
  },
  chartAxisLabel: {
    fontSize: 8,
    fontWeight: '500',
    color: COLORS.gray3,
    textAlign: 'right',
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.gray,
  },

  // --- Leg Breakdown ---
  legsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray5,
    paddingTop: 6,
    gap: 2,
  },
  legsTitle: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  legHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray5,
  },
  legHeaderCell: {
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.gray,
    textTransform: 'uppercase',
  },
  legNameCol: {
    flex: 1.2,
  },
  legStatCol: {
    flex: 1,
    textAlign: 'right',
  },
  legRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  legRowAlt: {
    backgroundColor: `${COLORS.gray6}80`,
    borderRadius: 4,
  },
  legCell: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.tertiaryLabel,
  },
  legsOverflow: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.gray,
    textAlign: 'center',
    paddingTop: 2,
  },

  // --- Footer ---
  gapWarning: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.orange,
    textAlign: 'center',
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.blue,
  },
});

export default GPSTrackTile;
