/**
 * CoursePositionEditor Component
 *
 * Full-featured modal for positioning race course marks on a map.
 * Allows editing course type, wind direction, leg length, and mark positions.
 *
 * Web: Interactive MapLibre GL map with draggable marks
 * Native: Placeholder (MapLibre not stable in modals on native)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';
import { X, RotateCcw, Navigation2, Anchor, ChevronDown, Info, Move, Compass, Ship, Minus, Plus, Waves } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import {
  CoursePositioningService,
  COURSE_TEMPLATES,
} from '@/services/CoursePositioningService';
import type {
  CourseType,
  PositionedCourse,
  PositionedMark,
  StartLinePosition,
} from '@/types/courses';
import { BathymetryCurrentLayer } from '@/components/map/layers/BathymetryCurrentLayer.web';
import { createLogger } from '@/lib/utils/logger';
import { ensureMapLibreCss, ensureMapLibreScript } from '@/lib/maplibreWeb';

const isWeb = Platform.OS === 'web';
const logger = createLogger('CoursePositionEditor');

// iOS-style colors
const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  yellow: '#FFCC00',
  purple: '#5856D6',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
  background: '#FFFFFF',
  groupedBackground: '#F2F2F7',
  separator: 'rgba(60, 60, 67, 0.36)',
  teal: '#0D9488',
};

// Mark colors by type
const MARK_COLORS: Record<string, string> = {
  windward: '#eab308',
  leeward: '#ef4444',
  gate: '#f97316',
  wing: '#22c55e',
  offset: '#3b82f6',
};

const WEB_MAP_STYLE = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f8fafc' },
    },
    {
      id: 'raster-layer',
      type: 'raster',
      source: 'raster-tiles',
      paint: { 'raster-opacity': 0.9 },
    },
  ],
} as const;

/** Offset a lat/lng coordinate by a compass bearing and distance (meters) */
function offsetCoordinate(lat: number, lng: number, bearingDeg: number, distanceM: number) {
  const R = 6371000;
  const bearing = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const d = distanceM / R;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing)
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );
  return { latitude: (lat2 * 180) / Math.PI, longitude: (lng2 * 180) / Math.PI };
}

/** Flat-earth bearing from one coordinate to another (degrees, 0=N clockwise) */
function flatBearing(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number {
  const toRad = Math.PI / 180;
  const dlng = (to.longitude - from.longitude) * Math.cos(from.latitude * toRad);
  const dlat = to.latitude - from.latitude;
  return ((Math.atan2(dlng, dlat) * 180) / Math.PI + 360) % 360;
}

/** Find intersection of two rays defined by point + bearing. Returns null if parallel or behind. */
function rayIntersection(
  p1: { latitude: number; longitude: number }, b1: number,
  p2: { latitude: number; longitude: number }, b2: number
): { latitude: number; longitude: number } | null {
  const toRad = Math.PI / 180;
  const cosLat = Math.cos(p1.latitude * toRad);
  const dx1 = Math.sin(b1 * toRad), dy1 = Math.cos(b1 * toRad);
  const dx2 = Math.sin(b2 * toRad), dy2 = Math.cos(b2 * toRad);
  const det = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(det) < 1e-10) return null;
  const ex = (p2.longitude - p1.longitude) * cosLat;
  const ey = p2.latitude - p1.latitude;
  const t1 = (ex * dy2 - ey * dx2) / det;
  if (t1 < 0) return null;
  return {
    latitude: p1.latitude + t1 * dy1,
    longitude: p1.longitude + t1 * dx1 / cosLat,
  };
}

/** Haversine distance between two coordinates in meters */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Interpolate between two coordinates at fraction t (0=A, 1=B) */
function lerpCoord(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
  t: number
) {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

/** Format degrees as 16-point compass bearing (e.g. "NE", "SSW") */
const formatCompassDirection = (degrees: number): string => {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
};

/**
 * Generate upwind/downwind sailing strategy based on wind, current, and depth.
 * Uses sailing conventions: wind direction = FROM, current direction = TO.
 * Port tack = wind over port side, boat heads RIGHT of upwind course.
 * Starboard tack = wind over starboard side, boat heads LEFT of upwind course.
 */
function generateStrategy(
  windDir: number,
  windSpeed: number | undefined,
  currentDir: number | undefined,
  currentSpd: number | undefined,
  mode: 'upwind' | 'downwind'
): string[] {
  const lines: string[] = [];
  const ws = windSpeed ?? 0;
  const hasCurrent = currentDir !== undefined && currentSpd !== undefined && currentSpd > 0.05;

  // Compute compass labels for sides of the course (looking upwind toward wind source)
  // Right side (looking upwind) = 90° clockwise from wind direction
  // Left side (looking upwind) = 90° counter-clockwise from wind direction
  const rightSideDir = (windDir + 90) % 360;
  const leftSideDir = (windDir - 90 + 360) % 360;
  const rightSideLabel = formatCompassDirection(rightSideDir);
  const leftSideLabel = formatCompassDirection(leftSideDir);

  if (mode === 'upwind') {
    if (hasCurrent) {
      const rel = ((currentDir! - windDir) % 360 + 360) % 360;
      // rel 0-180 = current pushes toward the right side (looking upwind)
      const currentPushesRight = rel > 0 && rel < 180;
      // Favored side is UPSTREAM — opposite to current push direction.
      // Sail into the current first to avoid overstanding the downstream layline.
      const favoredSide = currentPushesRight ? 'left' : 'right';
      // Start on the tack that takes you upstream (toward current source)
      const startTack = currentPushesRight ? 'starboard' : 'port';
      const extendLayline = currentPushesRight ? 'port' : 'starboard';
      const currentCompass = formatCompassDirection(currentDir!);

      lines.push(`Favored side: play the ${favoredSide} — sail upstream into current (${currentSpd!.toFixed(1)}kt ${currentCompass}), avoid overstanding`);
      lines.push(`Start on ${startTack} tack, extend toward the ${extendLayline} layline`);

      if (ws > 0 && ws < 10 && currentSpd! > 0.3) {
        lines.push(`Current is ${Math.round((currentSpd! / ws) * 100)}% of wind speed — big factor in light air`);
      }
    } else {
      lines.push('No significant current — sail the lifted tack, play the shifts');
    }

    if (ws < 8) {
      lines.push('Light air: stay in pressure, avoid shore shadows');
    } else if (ws < 15) {
      lines.push('Moderate breeze: sail the shifts, keep options open');
    } else {
      lines.push('Strong breeze: favor flatter water, minimize tacks');
    }

    if (hasCurrent) {
      lines.push('Deeper water = more current; use shallows to reduce adverse flow');
    }
  } else {
    // Downwind: use the SAME "looking upwind" convention as upwind so sailors think
    // about a single fixed physical side of the course, not a flipped mirror image.
    // Port gybe and port tack both head to the right-looking-upwind side;
    // starboard gybe and starboard tack both head to the left-looking-upwind side.
    if (hasCurrent) {
      const rel = ((currentDir! - windDir) % 360 + 360) % 360;
      const currentPushesRight = rel > 0 && rel < 180;
      // Upstream = opposite of where current pushes (same side as upwind leg)
      const favoredSide = currentPushesRight ? 'left' : 'right';
      // Gybe that takes you toward the favored (upstream) side — same convention as tack
      const startGybe = currentPushesRight ? 'starboard' : 'port';
      const currentCompass = formatCompassDirection(currentDir!);

      lines.push(`Favored side: play the ${favoredSide} (same side as upwind) — sail upstream into current (${currentSpd!.toFixed(1)}kt ${currentCompass}), avoid overstanding`);
      lines.push(`Start on ${startGybe} gybe toward the upstream side`);

      if (ws > 0 && ws < 10 && currentSpd! > 0.3) {
        lines.push('Light air: current carry is critical — stay in the flow');
      }
    } else {
      lines.push('No significant current — sail deep in lulls, heat up in puffs');
    }

    if (ws < 8) {
      lines.push('Light air: higher angles for VMG, soak in puffs');
    } else if (ws < 15) {
      lines.push('Moderate breeze: gybe on the shifts, stay in pressure');
    } else {
      lines.push('Strong breeze: ride waves, minimize gybes');
    }

    if (hasCurrent) {
      lines.push('Deeper water = more current; use shallows to reduce adverse flow');
    }
  }

  return lines;
}

/** Forecast data point for sparklines */
export interface ForecastDataPoint {
  time: string;
  value: number;
  direction?: number; // degrees for wind/current direction
}

interface CoursePositionEditorProps {
  visible: boolean;
  regattaId: string;
  initialCourseType?: CourseType;
  initialLocation?: { lat: number; lng: number };
  initialWindDirection?: number;
  initialWindSpeed?: number;
  initialLegLength?: number;
  existingCourse?: PositionedCourse | null;
  /** Current direction in degrees (0-360, direction current flows TO) */
  currentDirection?: number;
  /** Current speed in knots */
  currentSpeed?: number;
  /** Wind forecast data for sparkline */
  windForecast?: ForecastDataPoint[];
  /** Current forecast data for sparkline */
  currentForecast?: ForecastDataPoint[];
  /** Number of boats expected at start (for start line calculation) */
  numberOfBoats?: number;
  /** Boat class LOA in meters (from boat_classes metadata) */
  boatLengthM?: number;
  onSave: (course: Omit<PositionedCourse, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

// Course type options
const COURSE_TYPE_OPTIONS: { value: CourseType; label: string; description: string }[] = [
  { value: 'windward_leeward', label: 'Windward/Leeward', description: 'Classic upwind/downwind' },
  { value: 'triangle', label: 'Triangle', description: 'With reaching leg' },
  { value: 'olympic', label: 'Olympic', description: 'Multiple legs' },
  { value: 'trapezoid', label: 'Trapezoid', description: 'Four-mark course' },
];

/**
 * Wind direction compass picker component
 */
export function WindDirectionPicker({
  direction,
  onChange,
}: {
  direction: number;
  onChange: (dir: number) => void;
}) {
  const [inputValue, setInputValue] = useState(String(Math.round(direction)));

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 0 && num <= 360) {
      onChange(num % 360);
    }
  };

  const adjustDirection = (delta: number) => {
    const newDir = ((direction + delta) % 360 + 360) % 360;
    onChange(newDir);
    setInputValue(String(Math.round(newDir)));
  };

  // Update input when direction changes externally
  useEffect(() => {
    setInputValue(String(Math.round(direction)));
  }, [direction]);

  const cardinalLabel = useMemo(() => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(direction / 45) % 8;
    return dirs[index];
  }, [direction]);

  return (
    <View style={pickerStyles.container}>
      <View style={pickerStyles.labelRow}>
        <Navigation2
          size={16}
          color={COLORS.blue}
          style={{ transform: [{ rotate: `${direction}deg` }] }}
        />
        <Text style={pickerStyles.label}>Wind Direction</Text>
      </View>
      <View style={pickerStyles.controls}>
        <TouchableOpacity
          style={pickerStyles.adjustButton}
          onPress={() => adjustDirection(-5)}
        >
          <Text style={pickerStyles.adjustButtonText}>-5°</Text>
        </TouchableOpacity>
        <View style={pickerStyles.inputContainer}>
          <TextInput
            style={pickerStyles.input}
            value={inputValue}
            onChangeText={handleInputChange}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
          />
          <Text style={pickerStyles.unit}>° {cardinalLabel}</Text>
        </View>
        <TouchableOpacity
          style={pickerStyles.adjustButton}
          onPress={() => adjustDirection(5)}
        >
          <Text style={pickerStyles.adjustButtonText}>+5°</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustButton: {
    width: 44,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.blue,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray6,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.label,
    textAlign: 'center',
  },
  unit: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 4,
  },
});

/**
 * Leg length slider component
 */
function LegLengthSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const min = 0.2;
  const max = 1.5;

  // Handle slider change from web input
  const handleWebSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(event.target.value));
  };

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.labelRow}>
        <Anchor size={16} color={COLORS.teal} />
        <Text style={sliderStyles.label}>Leg Length</Text>
        <Text style={sliderStyles.value}>{value.toFixed(2)} nm</Text>
      </View>
      {isWeb ? (
        <input
          type="range"
          min={min}
          max={max}
          step={0.05}
          value={value}
          onChange={handleWebSliderChange as any}
          style={{
            width: '100%',
            height: 36,
            accentColor: COLORS.teal,
          }}
        />
      ) : (
        <View style={sliderStyles.sliderTrack}>
          <View
            style={[
              sliderStyles.sliderFill,
              { width: `${((value - min) / (max - min)) * 100}%` },
            ]}
          />
        </View>
      )}
      <View style={sliderStyles.labels}>
        <Text style={sliderStyles.minMax}>{min} nm</Text>
        <Text style={sliderStyles.minMax}>{max} nm</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.teal,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gray5,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.teal,
    borderRadius: 3,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  minMax: {
    fontSize: 11,
    color: COLORS.gray,
  },
});

/**
 * Start Line Length control component
 * Calculates start line based on fleet size: 1.5 × LOA × numberOfBoats
 */
function StartLineLengthControl({
  numberOfBoats,
  boatLengthM,
  calculatedLength,
  onNumberOfBoatsChange,
  onBoatLengthChange,
}: {
  numberOfBoats: number;
  boatLengthM: number;
  calculatedLength: number;
  onNumberOfBoatsChange: (n: number) => void;
  onBoatLengthChange: (l: number) => void;
}) {
  const [boatInputValue, setBoatInputValue] = useState(String(numberOfBoats));
  const [loaInputValue, setLoaInputValue] = useState(String(boatLengthM));

  const handleBoatCountChange = (text: string) => {
    setBoatInputValue(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 1 && num <= 200) {
      onNumberOfBoatsChange(num);
    }
  };

  const handleLoaChange = (text: string) => {
    setLoaInputValue(text);
    const num = parseFloat(text);
    if (!isNaN(num) && num >= 2 && num <= 30) {
      onBoatLengthChange(num);
    }
  };

  const adjustBoatCount = (delta: number) => {
    const newCount = Math.max(1, Math.min(200, numberOfBoats + delta));
    onNumberOfBoatsChange(newCount);
    setBoatInputValue(String(newCount));
  };

  // Update inputs when values change externally
  useEffect(() => {
    setBoatInputValue(String(numberOfBoats));
  }, [numberOfBoats]);

  useEffect(() => {
    setLoaInputValue(String(boatLengthM));
  }, [boatLengthM]);

  return (
    <View style={startLineStyles.container}>
      <View style={startLineStyles.labelRow}>
        <Ship size={16} color={COLORS.green} />
        <Text style={startLineStyles.label}>Start Line</Text>
      </View>

      {/* Horizontal layout: Boats, LOA, Result */}
      <View style={startLineStyles.horizontalRow}>
        {/* Boat Count Input */}
        <View style={startLineStyles.inputGroup}>
          <Text style={startLineStyles.inputLabel}>Boats</Text>
          <View style={startLineStyles.inputWithButtons}>
            <TouchableOpacity
              style={startLineStyles.adjustButton}
              onPress={() => adjustBoatCount(-5)}
            >
              <Minus size={12} color={COLORS.blue} />
            </TouchableOpacity>
            <View style={startLineStyles.inputContainer}>
              <TextInput
                style={startLineStyles.input}
                value={boatInputValue}
                onChangeText={handleBoatCountChange}
                keyboardType="number-pad"
                maxLength={3}
                selectTextOnFocus
              />
            </View>
            <TouchableOpacity
              style={startLineStyles.adjustButton}
              onPress={() => adjustBoatCount(5)}
            >
              <Plus size={12} color={COLORS.blue} />
            </TouchableOpacity>
          </View>
        </View>

        {/* LOA Input */}
        <View style={startLineStyles.inputGroup}>
          <Text style={startLineStyles.inputLabel}>LOA</Text>
          <View style={startLineStyles.inputContainer}>
            <TextInput
              style={startLineStyles.input}
              value={loaInputValue}
              onChangeText={handleLoaChange}
              keyboardType="decimal-pad"
              maxLength={4}
              selectTextOnFocus
            />
            <Text style={startLineStyles.unit}>m</Text>
          </View>
        </View>

        {/* Calculated Length Display */}
        <View style={startLineStyles.resultGroup}>
          <Text style={startLineStyles.inputLabel}>Line Length</Text>
          <View style={startLineStyles.resultBadge}>
            <Text style={startLineStyles.resultValue}>{Math.round(calculatedLength)}m</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const startLineStyles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  horizontalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
  },
  inputWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adjustButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray6,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 28,
  },
  input: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.label,
    textAlign: 'center',
    minWidth: 36,
  },
  unit: {
    fontSize: 11,
    color: COLORS.gray,
    marginLeft: 2,
  },
  resultGroup: {
    gap: 4,
  },
  resultBadge: {
    backgroundColor: `${COLORS.green}15`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 28,
    justifyContent: 'center',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green,
  },
});

/**
 * Sparkline component for showing forecast trends
 */
function Sparkline({
  data,
  color,
  width = 60,
  height = 24,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  if (!isWeb) return null;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Wind and Current display with sparklines
 */
function ConditionsDisplay({
  windDirection,
  windSpeed,
  currentDirection,
  currentSpeed,
  windForecast,
  currentForecast,
  onWindDirectionChange,
}: {
  windDirection: number;
  windSpeed?: number;
  currentDirection?: number;
  currentSpeed?: number;
  windForecast?: ForecastDataPoint[];
  currentForecast?: ForecastDataPoint[];
  onWindDirectionChange: (dir: number) => void;
}) {
  const [inputValue, setInputValue] = useState(String(Math.round(windDirection)));

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 0 && num <= 360) {
      onWindDirectionChange(num % 360);
    }
  };

  const adjustDirection = (delta: number) => {
    const newDir = ((windDirection + delta) % 360 + 360) % 360;
    onWindDirectionChange(newDir);
    setInputValue(String(Math.round(newDir)));
  };

  // Update input when direction changes externally
  useEffect(() => {
    setInputValue(String(Math.round(windDirection)));
  }, [windDirection]);

  const windCardinal = useMemo(() => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(windDirection / 45) % 8;
    return dirs[index];
  }, [windDirection]);

  const currentCardinal = useMemo(() => {
    if (currentDirection === undefined) return '';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(currentDirection / 45) % 8;
    return dirs[index];
  }, [currentDirection]);

  const windForecastValues = windForecast?.map(d => d.value) || [];
  const currentForecastValues = currentForecast?.map(d => d.value) || [];

  return (
    <View style={conditionsStyles.container}>
      {/* Wind Direction — editable */}
      <View style={conditionsStyles.section}>
        <View style={conditionsStyles.sectionHeader}>
          <Navigation2
            size={14}
            color="#22c55e"
            style={{ transform: [{ rotate: `${windDirection}deg` }] }}
          />
          <Text style={conditionsStyles.sectionTitle}>Wind Direction</Text>
          {windSpeed !== undefined && (
            <Text style={[conditionsStyles.speedBadge, { backgroundColor: '#22c55e15', color: '#22c55e' }]}>{Math.round(windSpeed)} kts</Text>
          )}
        </View>
        <View style={conditionsStyles.row}>
          <TouchableOpacity
            style={conditionsStyles.adjustButton}
            onPress={() => adjustDirection(-5)}
            accessibilityLabel="Rotate wind 5 degrees counterclockwise"
          >
            <Text style={conditionsStyles.adjustText}>← 5°</Text>
          </TouchableOpacity>
          <View style={conditionsStyles.inputContainer}>
            <TextInput
              style={conditionsStyles.input}
              value={inputValue}
              onChangeText={handleInputChange}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
            />
            <Text style={conditionsStyles.unit}>° {windCardinal}</Text>
          </View>
          <TouchableOpacity
            style={conditionsStyles.adjustButton}
            onPress={() => adjustDirection(5)}
            accessibilityLabel="Rotate wind 5 degrees clockwise"
          >
            <Text style={conditionsStyles.adjustText}>5° →</Text>
          </TouchableOpacity>
        </View>
        {windForecastValues.length > 2 && (
          <View style={conditionsStyles.sparklineRow}>
            <Text style={conditionsStyles.sparklineLabel}>Forecast</Text>
            <Sparkline data={windForecastValues} color="#22c55e" width={80} height={20} />
          </View>
        )}
      </View>

      {/* Current — read-only from forecast */}
      <View style={[conditionsStyles.section, conditionsStyles.currentSection]}>
        <View style={conditionsStyles.sectionHeader}>
          <Waves size={14} color="#0EA5E9" />
          <Text style={conditionsStyles.sectionTitle}>Current</Text>
          {currentSpeed !== undefined && (
            <Text style={[conditionsStyles.speedBadge, { backgroundColor: '#0EA5E915', color: '#0EA5E9' }]}>
              {currentSpeed.toFixed(1)} kts
            </Text>
          )}
        </View>
        <View style={conditionsStyles.currentValueRow}>
          {currentDirection !== undefined ? (
            <View style={conditionsStyles.currentValue}>
              <Navigation2
                size={12}
                color="#0EA5E9"
                style={{ transform: [{ rotate: `${currentDirection}deg` }] }}
              />
              <Text style={conditionsStyles.currentText}>
                {Math.round(currentDirection)}° {currentCardinal}
              </Text>
            </View>
          ) : (
            <View style={conditionsStyles.noDataBadge}>
              <Text style={conditionsStyles.noDataText}>No data</Text>
            </View>
          )}
        </View>
        {currentForecastValues.length > 2 && (
          <View style={conditionsStyles.sparklineRow}>
            <Text style={conditionsStyles.sparklineLabel}>Forecast</Text>
            <Sparkline data={currentForecastValues} color="#0EA5E9" width={80} height={20} />
          </View>
        )}
      </View>
    </View>
  );
}

const conditionsStyles = StyleSheet.create({
  container: {
    gap: 14,
  },
  section: {
    gap: 6,
  },
  currentSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray5,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  speedBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
    backgroundColor: '#22c55e15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adjustButton: {
    width: 44,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.blue,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray6,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 32,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.label,
    textAlign: 'center',
  },
  unit: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  currentValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0EA5E910',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0EA5E9',
  },
  noDataBadge: {
    backgroundColor: COLORS.gray6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  sparklineLabel: {
    fontSize: 10,
    color: COLORS.gray,
  },
});

/**
 * Course type selector dropdown
 */
function CourseTypeSelector({
  value,
  onChange,
}: {
  value: CourseType;
  onChange: (type: CourseType) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = COURSE_TYPE_OPTIONS.find((o) => o.value === value);

  return (
    <View style={selectorStyles.container}>
      <Pressable
        style={selectorStyles.trigger}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={selectorStyles.triggerText}>
          {selectedOption?.label || 'Select course type'}
        </Text>
        <ChevronDown size={16} color={COLORS.gray} />
      </Pressable>
      {isOpen && (
        <View style={selectorStyles.dropdown}>
          {COURSE_TYPE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                selectorStyles.option,
                option.value === value && selectorStyles.optionSelected,
              ]}
              onPress={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <Text
                style={[
                  selectorStyles.optionLabel,
                  option.value === value && selectorStyles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text style={selectorStyles.optionDescription}>
                {option.description}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.label,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
    }),
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray5,
  },
  optionSelected: {
    backgroundColor: `${COLORS.blue}10`,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.label,
  },
  optionLabelSelected: {
    color: COLORS.blue,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
});

/**
 * Main CoursePositionEditor component
 */
export function CoursePositionEditor({
  visible,
  regattaId,
  initialCourseType = 'windward_leeward',
  initialLocation,
  initialWindDirection = 225,
  initialWindSpeed,
  initialLegLength,
  existingCourse,
  currentDirection,
  currentSpeed,
  windForecast,
  currentForecast,
  numberOfBoats: initialNumberOfBoats = 20,
  boatLengthM: initialBoatLengthM = 8,
  onSave,
  onCancel,
}: CoursePositionEditorProps) {
  // State
  const [courseType, setCourseType] = useState<CourseType>(
    existingCourse?.courseType || initialCourseType
  );
  // Prefer live forecast wind over saved course wind so the course auto-orients to current conditions
  const [windDirection, setWindDirection] = useState(
    initialWindDirection ?? existingCourse?.windDirection ?? 225
  );
  const [legLength, setLegLength] = useState(
    existingCourse?.legLengthNm ||
      initialLegLength ||
      COURSE_TEMPLATES[courseType]?.defaultLegLengthNm ||
      0.5
  );
  const [marks, setMarks] = useState<PositionedMark[]>(
    existingCourse?.marks || []
  );
  const [startLine, setStartLine] = useState<StartLinePosition | null>(
    existingCourse?.startLine || null
  );
  const [hasManualAdjustments, setHasManualAdjustments] = useState(
    existingCourse?.hasManualAdjustments || false
  );

  // Start line length state - derived from fleet size
  // Back-calculate numberOfBoats from saved startLineLengthM if reopening an existing course
  const [numberOfBoats, setNumberOfBoats] = useState(() => {
    if (existingCourse?.startLineLengthM && initialNumberOfBoats === 20) {
      // Default wasn't explicitly set — back-calculate from saved line length
      // Formula: lineLength = boats * LOA * 1.5 → boats = lineLength / (LOA * 1.5)
      return Math.round(existingCourse.startLineLengthM / (initialBoatLengthM * 1.5));
    }
    return initialNumberOfBoats;
  });
  const [boatLengthM, setBoatLengthM] = useState(initialBoatLengthM);
  const [startLineLengthM, setStartLineLengthM] = useState(
    existingCourse?.startLineLengthM ||
      CoursePositioningService.calculateStartLineLength(initialNumberOfBoats, initialBoatLengthM)
  );

  // Sync forecast wind when it arrives after mount and recalculate course
  const prevInitialWindRef = useRef(initialWindDirection);
  useEffect(() => {
    if (
      initialWindDirection != null &&
      initialWindDirection !== prevInitialWindRef.current &&
      !hasManualAdjustments
    ) {
      prevInitialWindRef.current = initialWindDirection;
      setWindDirection(initialWindDirection);
    }
  }, [initialWindDirection]);

  // Map refs and state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const maplibreNsRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  // Depth-modulated current visualization
  const [showDepthCurrent, setShowDepthCurrent] = useState(false);

  // Toggle for scattered wind/current arrows on map
  const [showWindArrows, setShowWindArrows] = useState(true);
  const [showCurrentArrowsOnMap, setShowCurrentArrowsOnMap] = useState(true);

  // Calculate or recalculate course
  const calculateCourse = useCallback(() => {
    if (!initialLocation) {
      logger.debug('[CoursePositionEditor] calculateCourse: no initialLocation');
      return;
    }

    logger.debug('[CoursePositionEditor] Calculating course:', {
      initialLocation,
      windDirection,
      legLength,
      courseType,
      startLineLengthM,
    });

    const result = CoursePositioningService.calculatePositionedCourse({
      startLineCenter: initialLocation,
      windDirection,
      legLengthNm: legLength,
      courseType,
    });

    // Calculate start line with the dynamic length
    const newStartLine = CoursePositioningService.calculateStartLine(
      initialLocation,
      windDirection,
      startLineLengthM
    );

    logger.debug('[CoursePositionEditor] Course result:', {
      marksCount: result.marks.length,
      startLine: newStartLine,
      startLineLengthM,
    });

    setMarks(result.marks);
    setStartLine(newStartLine);
    setHasManualAdjustments(false);
  }, [initialLocation, windDirection, legLength, courseType, startLineLengthM]);

  // Handle start line length changes (from fleet size)
  const handleNumberOfBoatsChange = useCallback((count: number) => {
    setNumberOfBoats(count);
    const newLength = CoursePositioningService.calculateStartLineLength(count, boatLengthM);
    setStartLineLengthM(newLength);

    // Recalculate start line with new length
    const center = startLine
      ? {
          lat: (startLine.pin.lat + startLine.committee.lat) / 2,
          lng: (startLine.pin.lng + startLine.committee.lng) / 2,
        }
      : initialLocation;

    if (center) {
      const newStartLine = CoursePositioningService.calculateStartLine(
        center,
        windDirection,
        newLength
      );
      setStartLine(newStartLine);
    }
  }, [boatLengthM, startLine, initialLocation, windDirection]);

  const handleBoatLengthChange = useCallback((length: number) => {
    setBoatLengthM(length);
    const newLength = CoursePositioningService.calculateStartLineLength(numberOfBoats, length);
    setStartLineLengthM(newLength);

    // Recalculate start line with new length
    const center = startLine
      ? {
          lat: (startLine.pin.lat + startLine.committee.lat) / 2,
          lng: (startLine.pin.lng + startLine.committee.lng) / 2,
        }
      : initialLocation;

    if (center) {
      const newStartLine = CoursePositioningService.calculateStartLine(
        center,
        windDirection,
        newLength
      );
      setStartLine(newStartLine);
    }
  }, [numberOfBoats, startLine, initialLocation, windDirection]);

  // Initialize course on first render or when wind direction changes from forecast
  const prevWindRef = useRef(windDirection);
  const hasReorientedRef = useRef(false);
  useEffect(() => {
    if (!visible || !initialLocation) return;

    if (marks.length === 0) {
      // No marks yet — calculate fresh
      calculateCourse();
    } else if (
      // Re-orient existing course to forecast wind on first open
      !hasReorientedRef.current &&
      existingCourse?.windDirection != null &&
      initialWindDirection != null &&
      Math.abs(existingCourse.windDirection - initialWindDirection) > 2
    ) {
      hasReorientedRef.current = true;
      calculateCourse();
    } else if (windDirection !== prevWindRef.current && !hasManualAdjustments) {
      // Wind direction changed interactively or from delayed forecast
      prevWindRef.current = windDirection;
      calculateCourse();
    }
    prevWindRef.current = windDirection;
  }, [visible, initialLocation, calculateCourse, marks.length, windDirection, hasManualAdjustments, existingCourse?.windDirection, initialWindDirection]);

  // Handle course type change
  const handleCourseTypeChange = useCallback(
    (type: CourseType) => {
      setCourseType(type);
      // Use current start line center if course has been moved, otherwise use initialLocation
      const center = startLine
        ? {
            lat: (startLine.pin.lat + startLine.committee.lat) / 2,
            lng: (startLine.pin.lng + startLine.committee.lng) / 2,
          }
        : initialLocation;

      if (center) {
        const result = CoursePositioningService.calculatePositionedCourse({
          startLineCenter: center,
          windDirection,
          legLengthNm: legLength,
          courseType: type,
        });
        // Calculate start line with the dynamic length
        const newStartLine = CoursePositioningService.calculateStartLine(
          center,
          windDirection,
          startLineLengthM
        );
        setMarks(result.marks);
        setStartLine(newStartLine);
        setHasManualAdjustments(false);
      }
    },
    [initialLocation, startLine, windDirection, legLength, startLineLengthM]
  );

  // Handle wind direction change
  const handleWindDirectionChange = useCallback(
    (dir: number) => {
      setWindDirection(dir);
      // Recalculate marks that aren't user-adjusted
      // Use current start line center if course has been moved, otherwise use initialLocation
      const center = startLine
        ? {
            lat: (startLine.pin.lat + startLine.committee.lat) / 2,
            lng: (startLine.pin.lng + startLine.committee.lng) / 2,
          }
        : initialLocation;

      if (center && marks.length > 0) {
        const newMarks = CoursePositioningService.recalculateForWindChange(
          marks,
          center,
          windDirection,
          dir,
          legLength,
          courseType
        );
        setMarks(newMarks);
        // Also recalculate start line with current length
        const newStartLine = CoursePositioningService.calculateStartLine(
          center,
          dir,
          startLineLengthM
        );
        setStartLine(newStartLine);
      }
    },
    [initialLocation, startLine, marks, windDirection, legLength, courseType, startLineLengthM]
  );

  // Handle leg length change
  const handleLegLengthChange = useCallback(
    (len: number) => {
      setLegLength(len);
      // Recalculate marks
      // Use current start line center if course has been moved, otherwise use initialLocation
      const center = startLine
        ? {
            lat: (startLine.pin.lat + startLine.committee.lat) / 2,
            lng: (startLine.pin.lng + startLine.committee.lng) / 2,
          }
        : initialLocation;

      if (center && marks.length > 0) {
        const newMarks = CoursePositioningService.recalculateForLegLengthChange(
          marks,
          center,
          windDirection,
          legLength,
          len,
          courseType
        );
        setMarks(newMarks);
      }
    },
    [initialLocation, startLine, marks, windDirection, legLength, courseType]
  );

  // Reset course to template
  const handleReset = useCallback(() => {
    triggerHaptic('impactMedium');
    calculateCourse();
  }, [calculateCourse]);

  // Move course to current map center
  const handleCenterCourseHere = useCallback(() => {
    if (!mapRef.current || !startLine) return;
    triggerHaptic('impactMedium');
    const mapCenter = mapRef.current.getCenter();
    const newCenter = { lat: mapCenter.lat, lng: mapCenter.lng };

    const result = CoursePositioningService.repositionCourse(marks, startLine, newCenter);
    setMarks(result.marks);
    setStartLine(result.startLine);
  }, [marks, startLine]);

  // Realign course to current wind direction
  const handleAlignToWind = useCallback(() => {
    if (!startLine) return;
    triggerHaptic('impactMedium');
    const center = {
      lat: (startLine.pin.lat + startLine.committee.lat) / 2,
      lng: (startLine.pin.lng + startLine.committee.lng) / 2,
    };

    const newMarks = CoursePositioningService.realignCourseToWind(
      marks,
      center,
      windDirection,
      legLength,
      courseType
    );
    const newStartLine = CoursePositioningService.calculateStartLine(center, windDirection, startLineLengthM);

    setMarks(newMarks);
    setStartLine(newStartLine);
    setHasManualAdjustments(false);
  }, [marks, startLine, windDirection, legLength, courseType, startLineLengthM]);

  // Save course
  const handleSave = useCallback(() => {
    triggerHaptic('notificationSuccess');
    onSave({
      regattaId,
      userId: '', // Will be filled by the parent
      courseType,
      marks,
      startLine: startLine!,
      windDirection,
      legLengthNm: legLength,
      startLineLengthM,
      hasManualAdjustments,
    });
  }, [
    regattaId,
    courseType,
    marks,
    startLine,
    windDirection,
    legLength,
    startLineLengthM,
    hasManualAdjustments,
    onSave,
  ]);

  // Course overlay: full race box (diamond) with laylines, start line inside
  const courseOverlay = useMemo(() => {
    if (marks.length === 0) return null;
    const windwardMark = marks.find((m) => m.type === 'windward');
    const leewardMark = marks.find((m) => m.type === 'leeward');
    const gateMarks = marks.filter((m) => m.type === 'gate');
    const leewardPos = leewardMark
      ? { latitude: leewardMark.latitude, longitude: leewardMark.longitude }
      : gateMarks.length >= 2
        ? { latitude: (gateMarks[0].latitude + gateMarks[1].latitude) / 2,
            longitude: (gateMarks[0].longitude + gateMarks[1].longitude) / 2 }
        : gateMarks.length === 1
          ? { latitude: gateMarks[0].latitude, longitude: gateMarks[0].longitude }
          : startLine
            ? { latitude: (startLine.pin.lat + startLine.committee.lat) / 2,
                longitude: (startLine.pin.lng + startLine.committee.lng) / 2 }
            : null;
    if (!windwardMark || !leewardPos) return null;

    const W = { latitude: windwardMark.latitude, longitude: windwardMark.longitude };
    const L = leewardPos;
    const M = lerpCoord(L, W, 0.5);

    const legDistanceM = haversineDistance(W.latitude, W.longitude, L.latitude, L.longitude);
    const laylineAngle = 45;
    const halfWidth = (legDistanceM / 2) * Math.tan((laylineAngle * Math.PI) / 180);

    const rightBearing = (windDirection + 90) % 360;
    const leftBearing = (windDirection - 90 + 360) % 360;
    const downwindBearing = (windDirection + 180) % 360;

    let portCorner = offsetCoordinate(M.latitude, M.longitude, rightBearing, halfWidth);
    let stbdCorner = offsetCoordinate(M.latitude, M.longitude, leftBearing, halfWidth);

    // ── Third dividers (1/3 and 2/3 from L to W) ──
    const oneThird = lerpCoord(L, W, 1 / 3);
    const twoThirds = lerpCoord(L, W, 2 / 3);
    const oneThirdHW = halfWidth * (2 / 3);
    const twoThirdsHW = halfWidth * (2 / 3);
    const oneThirdLeft = offsetCoordinate(oneThird.latitude, oneThird.longitude, leftBearing, oneThirdHW);
    const oneThirdRight = offsetCoordinate(oneThird.latitude, oneThird.longitude, rightBearing, oneThirdHW);
    const twoThirdsLeft = offsetCoordinate(twoThirds.latitude, twoThirds.longitude, leftBearing, twoThirdsHW);
    const twoThirdsRight = offsetCoordinate(twoThirds.latitude, twoThirds.longitude, rightBearing, twoThirdsHW);

    // Third zone label positions (along the rhumbline)
    const bottomThirdLabel = lerpCoord(L, W, 1 / 6);
    const middleThirdLabel = lerpCoord(L, W, 1 / 2);
    const upperThirdLabel = lerpCoord(L, W, 5 / 6);

    // ── Favored side ──
    const hasCurrent = currentDirection !== undefined && currentSpeed !== undefined && currentSpeed > 0.05;
    let favoredSide: 'left' | 'right' | null = null;
    if (hasCurrent) {
      const rel = ((currentDirection! - windDirection) % 360 + 360) % 360;
      favoredSide = (rel > 0 && rel < 180) ? 'left' : 'right';
    }

    // Side label positions (offset into each half at midpoint height)
    const sideOffset = halfWidth * 0.5;
    const leftLabel = offsetCoordinate(M.latitude, M.longitude, leftBearing, sideOffset);
    const rightLabel = offsetCoordinate(M.latitude, M.longitude, rightBearing, sideOffset);

    // ── Start line: flatten diamond bottom to P & C, add start box ──
    let P = L;
    let C = L;
    let startMid = L;
    let startBox: {
      outline: { latitude: number; longitude: number }[];
      dividers: [{ latitude: number; longitude: number }, { latitude: number; longitude: number }][];
    } | null = null;

    if (startLine) {
      P = { latitude: startLine.pin.lat, longitude: startLine.pin.lng };
      C = { latitude: startLine.committee.lat, longitude: startLine.committee.lng };
      startMid = lerpCoord(P, C, 0.5);

      const boxDepth = legDistanceM * 0.15;

      const dLat = C.latitude - P.latitude;
      const dLng = (C.longitude - P.longitude) * Math.cos((P.latitude * Math.PI) / 180);
      const lineBearingPtoC = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

      const candidateA = (lineBearingPtoC - 45 + 360) % 360;
      const candidateB = (lineBearingPtoC + 45) % 360;
      const diffA = Math.abs(((candidateA - downwindBearing + 540) % 360) - 180);
      const diffB = Math.abs(((candidateB - downwindBearing + 540) % 360) - 180);
      const shortSideBearing = diffA < diffB ? candidateA : candidateB;

      const pinDown = offsetCoordinate(P.latitude, P.longitude, shortSideBearing, boxDepth);
      const committeeDown = offsetCoordinate(C.latitude, C.longitude, shortSideBearing, boxDepth);
      const startOneThird = lerpCoord(P, C, 1 / 3);
      const startTwoThirds = lerpCoord(P, C, 2 / 3);
      const oneThirdDown = offsetCoordinate(startOneThird.latitude, startOneThird.longitude, shortSideBearing, boxDepth);
      const twoThirdsDown = offsetCoordinate(startTwoThirds.latitude, startTwoThirds.longitude, shortSideBearing, boxDepth);

      startBox = {
        outline: [P, C, committeeDown, pinDown],
        dividers: [
          [startOneThird, oneThirdDown],
          [startTwoThirds, twoThirdsDown],
        ],
      };

      // Extend lower laylines from P and C into the course to meet upper laylines from W
      const laylineBearingFromP = (windDirection - 45 + 360) % 360;
      const laylineBearingFromC = (windDirection + 45) % 360;
      const bearingWtoPort = flatBearing(W, portCorner);
      const bearingWtoStbd = flatBearing(W, stbdCorner);

      const newStbd = rayIntersection(P, laylineBearingFromP, W, bearingWtoStbd);
      const newPort = rayIntersection(C, laylineBearingFromC, W, bearingWtoPort);

      if (newStbd) stbdCorner = newStbd;
      if (newPort) portCorner = newPort;
    }

    return {
      W, L, M, P, C, startMid, portCorner, stbdCorner,
      leftPoly: [W, stbdCorner, P, startMid],
      rightPoly: [W, portCorner, C, startMid],
      thirdDividers: [
        [oneThirdLeft, oneThirdRight],
        [twoThirdsLeft, twoThirdsRight],
      ] as [{ latitude: number; longitude: number }, { latitude: number; longitude: number }][],
      thirdLabels: { bottom: bottomThirdLabel, middle: middleThirdLabel, upper: upperThirdLabel },
      favoredSide,
      leftLabel,
      rightLabel,
      startBox,
    };
  }, [marks, windDirection, currentDirection, currentSpeed, startLine]);

  // Initialize web map
  useEffect(() => {
    if (!isWeb || !visible || !mapContainerRef.current || !initialLocation) return;
    if (mapRef.current) return; // Already initialized

    const markers = markersRef.current;

    const initMap = async () => {
      try {
        let maplibregl: any = null;
        try {
          const maplibreModule = await import('maplibre-gl');
          maplibregl = (maplibreModule as any).default || maplibreModule;
          try {
            await import('maplibre-gl/dist/maplibre-gl.css');
          } catch (_cssError) {
            ensureMapLibreCss('maplibre-gl-css-course-position-editor');
          }
        } catch (_moduleError) {
          ensureMapLibreCss('maplibre-gl-css-course-position-editor');
          await ensureMapLibreScript('maplibre-gl-script-course-position-editor');
          maplibregl = typeof window !== 'undefined' ? (window as any).maplibregl : null;
        }
        maplibreNsRef.current = maplibregl;
        const MapConstructor = maplibregl?.Map;
        if (!MapConstructor) {
          throw new Error('MapLibre Map constructor is unavailable');
        }

        const map = new MapConstructor({
          container: mapContainerRef.current!,
          style: WEB_MAP_STYLE,
          center: [initialLocation.lng, initialLocation.lat],
          zoom: 14,
          attributionControl: false,
        });

        map.on('load', () => {
          logger.debug('[CoursePositionEditor] Map loaded');
          mapRef.current = map;
          setMapReady(true);
        });
      } catch (error) {
        logger.error('[CoursePositionEditor] Failed to initialize map:', error);
      }
    };

    initMap();

    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, [visible, initialLocation]);

  // Update map markers when marks change or map becomes ready
  useEffect(() => {
    logger.debug('[CoursePositionEditor] Marker effect:', {
      isWeb,
      mapReady,
      hasMapRef: !!mapRef.current,
      marksLength: marks.length,
    });
    if (!isWeb || !mapReady || !mapRef.current || !marks.length) return;

    logger.debug('[CoursePositionEditor] Adding markers to map');
    const updateMarkers = async () => {
      let maplibregl = maplibreNsRef.current;
      if (!maplibregl) {
        try {
          const maplibreModule = await import('maplibre-gl');
          maplibregl = (maplibreModule as any).default || maplibreModule;
          maplibreNsRef.current = maplibregl;
        } catch (_moduleError) {
          await ensureMapLibreScript('maplibre-gl-script-course-position-editor');
          maplibregl = typeof window !== 'undefined' ? (window as any).maplibregl : null;
          maplibreNsRef.current = maplibregl;
        }
      }
      const Marker = maplibregl?.Marker;
      const LngLatBounds = maplibregl?.LngLatBounds;
      if (!Marker || !LngLatBounds) return;
      const map = mapRef.current;

      // Guard against race condition where map becomes null after async import
      if (!map) return;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      // Helper to cleanly remove a layer+source pair
      const removeLayerAndSource = (layerId: string, sourceId: string) => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      };

      // ── Course overlay: race box, laylines, rhumbline, third dividers, start box ──
      // Remove previous overlay layers (order matters: layers before sources)
      removeLayerAndSource('race-left-fill', 'race-left');
      removeLayerAndSource('race-right-fill', 'race-right');
      removeLayerAndSource('race-left-outline', 'race-left-outline-src');
      removeLayerAndSource('race-right-outline', 'race-right-outline-src');
      removeLayerAndSource('rhumbline-layer', 'rhumbline');
      removeLayerAndSource('third-dividers-layer', 'third-dividers');
      removeLayerAndSource('laylines-layer', 'laylines');
      removeLayerAndSource('start-box-outline-layer', 'start-box-outline');
      removeLayerAndSource('start-box-dividers-layer', 'start-box-dividers');

      if (courseOverlay) {
        const coordPairs = (pts: { latitude: number; longitude: number }[]): [number, number][] =>
          pts.map((p) => [p.longitude, p.latitude]);

        const {
          W, L, portCorner, stbdCorner, P, C, startMid,
          leftPoly, rightPoly, thirdDividers, thirdLabels,
          favoredSide, leftLabel, rightLabel, startBox,
        } = courseOverlay;

        // Fill polygons (left/right halves of race box). Favored side gets a tint.
        const leftFavored = favoredSide === 'left';
        const rightFavored = favoredSide === 'right';

        map.addSource('race-left', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[...coordPairs(leftPoly), [leftPoly[0].longitude, leftPoly[0].latitude]]],
            },
          },
        });
        map.addLayer({
          id: 'race-left-fill',
          type: 'fill',
          source: 'race-left',
          paint: {
            'fill-color': leftFavored ? '#34C759' : '#3b82f6',
            'fill-opacity': leftFavored ? 0.18 : 0.06,
          },
        });

        map.addSource('race-right', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[...coordPairs(rightPoly), [rightPoly[0].longitude, rightPoly[0].latitude]]],
            },
          },
        });
        map.addLayer({
          id: 'race-right-fill',
          type: 'fill',
          source: 'race-right',
          paint: {
            'fill-color': rightFavored ? '#34C759' : '#3b82f6',
            'fill-opacity': rightFavored ? 0.18 : 0.06,
          },
        });

        // Rhumbline (center line from L/startMid to W)
        const rhumbFrom = startLine ? startMid : L;
        map.addSource('rhumbline', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [rhumbFrom.longitude, rhumbFrom.latitude],
                [W.longitude, W.latitude],
              ],
            },
          },
        });
        map.addLayer({
          id: 'rhumbline-layer',
          type: 'line',
          source: 'rhumbline',
          paint: {
            'line-color': '#64748b',
            'line-width': 1.5,
            'line-dasharray': [2, 3],
            'line-opacity': 0.7,
          },
        });

        // Third dividers (horizontal lines at 1/3 and 2/3 up the course)
        map.addSource('third-dividers', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: thirdDividers.map((seg) => ({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [seg[0].longitude, seg[0].latitude],
                  [seg[1].longitude, seg[1].latitude],
                ],
              },
            })),
          },
        });
        map.addLayer({
          id: 'third-dividers-layer',
          type: 'line',
          source: 'third-dividers',
          paint: {
            'line-color': '#94a3b8',
            'line-width': 1,
            'line-dasharray': [1, 3],
            'line-opacity': 0.6,
          },
        });

        // Laylines: W → portCorner and W → stbdCorner, and (if start line exists)
        // P → stbdCorner (left layline) and C → portCorner (right layline)
        const laylineFeatures: any[] = [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [W.longitude, W.latitude],
                [portCorner.longitude, portCorner.latitude],
              ],
            },
          },
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [W.longitude, W.latitude],
                [stbdCorner.longitude, stbdCorner.latitude],
              ],
            },
          },
        ];
        if (startLine) {
          laylineFeatures.push({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [P.longitude, P.latitude],
                [stbdCorner.longitude, stbdCorner.latitude],
              ],
            },
          });
          laylineFeatures.push({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [C.longitude, C.latitude],
                [portCorner.longitude, portCorner.latitude],
              ],
            },
          });
        }
        map.addSource('laylines', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: laylineFeatures },
        });
        map.addLayer({
          id: 'laylines-layer',
          type: 'line',
          source: 'laylines',
          paint: {
            'line-color': '#475569',
            'line-width': 2,
            'line-dasharray': [4, 3],
            'line-opacity': 0.75,
          },
        });

        // Start box (parallelogram extending downwind from start line)
        if (startBox) {
          const outlineCoords: [number, number][] = [
            ...coordPairs(startBox.outline),
            [startBox.outline[0].longitude, startBox.outline[0].latitude],
          ];
          map.addSource('start-box-outline', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: outlineCoords },
            },
          });
          map.addLayer({
            id: 'start-box-outline-layer',
            type: 'line',
            source: 'start-box-outline',
            paint: {
              'line-color': COLORS.green,
              'line-width': 2,
              'line-dasharray': [3, 3],
              'line-opacity': 0.8,
            },
          });

          map.addSource('start-box-dividers', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: startBox.dividers.map((seg) => ({
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [seg[0].longitude, seg[0].latitude],
                    [seg[1].longitude, seg[1].latitude],
                  ],
                },
              })),
            },
          });
          map.addLayer({
            id: 'start-box-dividers-layer',
            type: 'line',
            source: 'start-box-dividers',
            paint: {
              'line-color': COLORS.green,
              'line-width': 1,
              'line-dasharray': [1, 3],
              'line-opacity': 0.6,
            },
          });
        }

        // ── DOM label markers (LEFT/RIGHT side + Bottom/Middle/Upper 1/3) ──
        const makeLabel = (
          text: string,
          opts: { favored?: boolean; variant?: 'side' | 'third' } = {},
        ) => {
          const el = document.createElement('div');
          const isSide = opts.variant !== 'third';
          const isFavored = !!opts.favored;
          el.style.cssText = `
            padding: ${isSide ? '4px 10px' : '3px 8px'};
            background: ${isFavored ? 'rgba(52, 199, 89, 0.92)' : 'rgba(15, 23, 42, 0.75)'};
            border: 1px solid ${isFavored ? 'rgba(52, 199, 89, 1)' : 'rgba(148, 163, 184, 0.5)'};
            border-radius: 999px;
            color: ${isFavored ? '#ffffff' : '#e2e8f0'};
            font-size: ${isSide ? 11 : 9}px;
            font-weight: ${isSide ? 700 : 600};
            letter-spacing: ${isSide ? 0.8 : 0.4}px;
            text-transform: uppercase;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          `;
          el.textContent = text;
          return el;
        };

        const leftSideEl = makeLabel('Left', { favored: favoredSide === 'left', variant: 'side' });
        const leftSideMarker = new Marker({ element: leftSideEl })
          .setLngLat([leftLabel.longitude, leftLabel.latitude])
          .addTo(map);
        markersRef.current.set('label-left', leftSideMarker);

        const rightSideEl = makeLabel('Right', { favored: favoredSide === 'right', variant: 'side' });
        const rightSideMarker = new Marker({ element: rightSideEl })
          .setLngLat([rightLabel.longitude, rightLabel.latitude])
          .addTo(map);
        markersRef.current.set('label-right', rightSideMarker);

        const bottomEl = makeLabel('Bottom 1/3', { variant: 'third' });
        const bottomMarker = new Marker({ element: bottomEl })
          .setLngLat([thirdLabels.bottom.longitude, thirdLabels.bottom.latitude])
          .addTo(map);
        markersRef.current.set('label-bottom-third', bottomMarker);

        const middleEl = makeLabel('Middle 1/3', { variant: 'third' });
        const middleMarker = new Marker({ element: middleEl })
          .setLngLat([thirdLabels.middle.longitude, thirdLabels.middle.latitude])
          .addTo(map);
        markersRef.current.set('label-middle-third', middleMarker);

        const upperEl = makeLabel('Upper 1/3', { variant: 'third' });
        const upperMarker = new Marker({ element: upperEl })
          .setLngLat([thirdLabels.upper.longitude, thirdLabels.upper.latitude])
          .addTo(map);
        markersRef.current.set('label-upper-third', upperMarker);
      }

      // Add start line (with coordinate validation to prevent NaN errors)
      const hasValidStartLine = startLine &&
        !isNaN(startLine.pin.lat) && !isNaN(startLine.pin.lng) &&
        !isNaN(startLine.committee.lat) && !isNaN(startLine.committee.lng);

      if (hasValidStartLine) {
        // Remove existing start line layer if it exists
        if (map.getLayer('start-line-layer')) {
          map.removeLayer('start-line-layer');
        }
        if (map.getSource('start-line')) {
          map.removeSource('start-line');
        }

        map.addSource('start-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [startLine.pin.lng, startLine.pin.lat],
                [startLine.committee.lng, startLine.committee.lat],
              ],
            },
          },
        });

        map.addLayer({
          id: 'start-line-layer',
          type: 'line',
          source: 'start-line',
          paint: {
            'line-color': COLORS.green,
            'line-width': 4,
          },
        });

        // Add Pin marker
        const pinEl = document.createElement('div');
        pinEl.style.cssText = `
          width: 36px;
          height: 36px;
          background: ${COLORS.orange};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4);
        `;
        pinEl.textContent = 'P';
        const pinMarker = new Marker({ element: pinEl })
          .setLngLat([startLine.pin.lng, startLine.pin.lat])
          .addTo(map);
        markersRef.current.set('start-pin', pinMarker);

        // Add Committee Boat marker
        const cbEl = document.createElement('div');
        cbEl.style.cssText = `
          width: 36px;
          height: 36px;
          background: ${COLORS.blue};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4);
        `;
        cbEl.textContent = 'CB';
        const cbMarker = new Marker({ element: cbEl })
          .setLngLat([startLine.committee.lng, startLine.committee.lat])
          .addTo(map);
        markersRef.current.set('start-committee', cbMarker);

        // Add Finish marker (white, opposite pin from committee boat)
        const finishPos = CoursePositioningService.calculateFinishMark(startLine, windDirection);
        const finishEl = document.createElement('div');
        finishEl.style.cssText = `
          width: 32px;
          height: 32px;
          background: #ffffff;
          border: 3px solid #333;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4);
        `;
        finishEl.textContent = 'F';
        const finishMarker = new Marker({ element: finishEl })
          .setLngLat([finishPos.lng, finishPos.lat])
          .addTo(map);
        markersRef.current.set('finish', finishMarker);
      }

      // Add course line
      if (marks.length >= 2) {
        // Remove existing course line if it exists
        if (map.getLayer('course-line-layer')) {
          map.removeLayer('course-line-layer');
        }
        if (map.getSource('course-line')) {
          map.removeSource('course-line');
        }

        // Filter and sort marks with valid coordinates
        const sortedMarks = [...marks]
          .filter(m => !isNaN(m.longitude) && !isNaN(m.latitude))
          .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

        // Build course line coordinates, collapsing gate pairs to their midpoint
        const gateMarks = sortedMarks.filter(m => m.type === 'gate');
        const nonGateMarks = sortedMarks.filter(m => m.type !== 'gate');
        let lineCoords: [number, number][];
        if (gateMarks.length === 2) {
          // Replace two gate marks with their midpoint
          const gateMid: [number, number] = [
            (gateMarks[0].longitude + gateMarks[1].longitude) / 2,
            (gateMarks[0].latitude + gateMarks[1].latitude) / 2,
          ];
          // Build line: windward → gate midpoint (sorted by relY descending = top to bottom)
          const windwardMarks = nonGateMarks.filter(m => m.type === 'windward');
          const otherMarks = nonGateMarks.filter(m => m.type !== 'windward');
          // Order: windward marks first, then gate midpoint, then any others
          lineCoords = [
            ...windwardMarks.map((m): [number, number] => [m.longitude, m.latitude]),
            gateMid,
            ...otherMarks.map((m): [number, number] => [m.longitude, m.latitude]),
          ];
        } else {
          lineCoords = sortedMarks.map((m): [number, number] => [m.longitude, m.latitude]);
        }

        // Only add course line if we have at least 2 valid points
        if (lineCoords.length < 2) {
          logger.warn('[CoursePositionEditor] Not enough valid marks for course line');
        } else {
          map.addSource('course-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: lineCoords,
            },
          },
        });

        map.addLayer({
          id: 'course-line-layer',
          type: 'line',
          source: 'course-line',
          paint: {
            'line-color': '#f97316',
            'line-width': 3,
            'line-dasharray': [6, 3],
            'line-opacity': 0.9,
          },
        });
        }
      }

      // Add mark markers (draggable) - filter out marks with invalid coordinates
      const validMarks = marks.filter(m =>
        !isNaN(m.longitude) && !isNaN(m.latitude) &&
        m.longitude !== undefined && m.latitude !== undefined
      );
      validMarks.forEach((mark) => {
        const color = MARK_COLORS[mark.type] || '#64748b';
        const size = 32;

        const el = document.createElement('div');
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 13px;
          cursor: grab;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4);
          ${mark.isUserAdjusted ? 'box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.5), 0 4px 12px rgba(0,0,0,0.4);' : ''}
        `;

        const label =
          mark.type === 'windward'
            ? 'W'
            : mark.type === 'leeward'
              ? 'L'
              : mark.type === 'gate'
                ? 'G'
                : mark.type === 'wing'
                  ? 'R'
                  : mark.type === 'offset'
                    ? 'O'
                    : '•';
        el.textContent = label;

        const marker = new Marker({
          element: el,
          draggable: true,
        })
          .setLngLat([mark.longitude, mark.latitude])
          .addTo(map);

        // Handle drag end
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          setMarks((prev) =>
            CoursePositioningService.updateMarkPosition(prev, mark.id!, {
              lat: lngLat.lat,
              lng: lngLat.lng,
            })
          );
          setHasManualAdjustments(true);
        });

        markersRef.current.set(mark.id!, marker);
      });

      // Fit bounds to show all marks
      if (validMarks.length > 0 && hasValidStartLine) {
        const bounds = new LngLatBounds();
        validMarks.forEach((m) => bounds.extend([m.longitude, m.latitude]));
        bounds.extend([startLine!.pin.lng, startLine!.pin.lat]);
        bounds.extend([startLine!.committee.lng, startLine!.committee.lat]);

        map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
          duration: 500,
        });
      }
    };

    // Small delay to ensure map is ready
    const timeout = setTimeout(updateMarkers, 100);
    return () => clearTimeout(timeout);
  }, [marks, startLine, mapReady, windDirection, currentDirection, currentSpeed, courseOverlay]);

  if (!visible) return null;

  // Native placeholder
  if (!isWeb) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onCancel}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Course Position Editor</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <X size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.nativePlaceholder}>
            <Info size={48} color={COLORS.blue} />
            <Text style={styles.placeholderTitle}>Map Editor</Text>
            <Text style={styles.placeholderText}>
              Interactive course positioning is available on web. On mobile, courses are set
              from race documents or the web app.
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Web editor
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* Header - Apple Modal Style */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Position Course</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!marks.length || !startLine}
            style={styles.headerButton}
          >
            <Text style={[
              styles.headerButtonTextSave,
              (!marks.length || !startLine) && styles.headerButtonDisabled
            ]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {initialLocation ? (
            <>
              <div
                ref={mapContainerRef}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
              {/* Wind Direction Overlay - Top Left */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  pointerEvents: 'none',
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '2px solid rgba(34, 197, 94, 0.5)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 32 32"
                    style={{ transform: `rotate(${(windDirection + 180) % 360}deg)` }}
                  >
                    <path d="M16 4 L16 24" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                    <path d="M16 4 L10 12 M16 4 L22 12" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#22c55e',
                  }}
                >
                  Wind {initialWindSpeed != null ? `${Math.round(initialWindSpeed)}kt` : ''} {formatCompassDirection(windDirection)}
                </div>
              </div>

              {/* Current Direction Overlay - Top Right */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  pointerEvents: 'none',
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: `2px solid ${currentDirection !== undefined ? 'rgba(14, 165, 233, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    opacity: currentDirection !== undefined ? 1 : 0.6,
                  }}
                >
                  {currentDirection !== undefined ? (
                    <svg
                      width="36"
                      height="24"
                      viewBox="0 0 28 20"
                      fill="none"
                      style={{ transform: `rotate(${currentDirection - 90}deg)` }}
                    >
                      {/* Wavy arrow matching scattered current arrows */}
                      <path d="M4 10 Q7 6, 10 10 Q13 14, 16 10 Q19 6, 22 10"
                            stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                      <path d="M22 10 L18 6 M22 10 L18 14"
                            stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      {/* Waves icon for current with no direction */}
                      <path
                        d="M2 12c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"
                        stroke="#6b7280"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <path
                        d="M2 17c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"
                        stroke="#6b7280"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: currentDirection !== undefined ? '#0EA5E9' : '#6b7280',
                  }}
                >
                  {currentDirection !== undefined
                    ? `Current ${currentSpeed !== undefined ? `${currentSpeed.toFixed(1)}kt` : ''} ${formatCompassDirection(currentDirection)}`
                    : 'Current —'
                  }
                </div>
              </div>

              {/* Consolidated MAP LAYERS Toggle Panel */}
              <div
                style={{
                  position: 'absolute',
                  top: 115,
                  right: 16,
                  background: 'rgba(15, 23, 42, 0.95)',
                  borderRadius: 10,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                  zIndex: 100,
                  overflow: 'hidden',
                  minWidth: 160,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', letterSpacing: 0.5 }}>
                    MAP LAYERS
                  </span>
                </div>

                {/* Wind Toggle Row */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: 'rotate(180deg)' }}>
                      <path d="M12 4 L12 18" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M12 4 L7 10 M12 4 L17 10" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 500, color: showWindArrows ? '#22c55e' : '#94A3B8' }}>
                      Wind
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showWindArrows}
                    onChange={(e) => setShowWindArrows(e.target.checked)}
                    style={{ width: 36, height: 20, accentColor: '#22c55e', cursor: 'pointer' }}
                  />
                </div>

                {/* Current Toggle Row */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="10" viewBox="0 0 28 20" fill="none">
                      <path d="M4 10 Q7 6, 10 10 Q13 14, 16 10 Q19 6, 22 10"
                            stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      <path d="M22 10 L18 6 M22 10 L18 14"
                            stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 500, color: showCurrentArrowsOnMap ? '#0EA5E9' : '#94A3B8' }}>
                      Current
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showCurrentArrowsOnMap}
                    onChange={(e) => setShowCurrentArrowsOnMap(e.target.checked)}
                    style={{ width: 36, height: 20, accentColor: '#0EA5E9', cursor: 'pointer' }}
                  />
                </div>

                {/* Depth Toggle Row */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"
                        stroke="#64B5F6"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M2 17c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"
                        stroke="#64B5F6"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 500, color: showDepthCurrent ? '#64B5F6' : '#94A3B8' }}>
                      Depth
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDepthCurrent}
                    onChange={(e) => setShowDepthCurrent(e.target.checked)}
                    style={{ width: 36, height: 20, accentColor: '#64B5F6', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Scattered Wind Arrows across the map - reduced count and opacity for subtlety */}
              {showWindArrows && (() => {
                // Wind direction is where wind comes FROM, arrows point opposite (+180)
                const arrowDir = (windDirection + 180) % 360;
                const positions = [
                  { x: 18, y: 25 }, { x: 48, y: 22 }, { x: 78, y: 28 },
                  { x: 28, y: 45 }, { x: 58, y: 42 }, { x: 88, y: 48 },
                  { x: 15, y: 62 }, { x: 45, y: 58 }, { x: 75, y: 65 },
                  { x: 25, y: 78 }, { x: 55, y: 75 }, { x: 85, y: 80 },
                ];
                return positions.map((pos, i) => (
                  <div
                    key={`wind-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: `translate(-50%, -50%) rotate(${arrowDir}deg)`,
                      pointerEvents: 'none',
                      zIndex: 5,
                      opacity: 0.6,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4 L12 18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M12 4 L7 10 M12 4 L17 10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ));
              })()}

              {/* Scattered Current/Tide Arrows across the map - reduced count and opacity */}
              {showCurrentArrowsOnMap && currentDirection !== undefined && (() => {
                const arrowDir = currentDirection;
                const positions = [
                  { x: 22, y: 30 }, { x: 52, y: 28 }, { x: 82, y: 32 },
                  { x: 32, y: 48 }, { x: 62, y: 45 }, { x: 92, y: 50 },
                  { x: 20, y: 65 }, { x: 50, y: 62 }, { x: 80, y: 68 },
                  { x: 30, y: 82 }, { x: 60, y: 78 }, { x: 90, y: 84 },
                ];
                return positions.map((pos, i) => (
                  <div
                    key={`current-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: `translate(-50%, -50%) rotate(${arrowDir - 90}deg)`,
                      pointerEvents: 'none',
                      zIndex: 5,
                      opacity: 0.6,
                    }}
                  >
                    <svg width="18" height="12" viewBox="0 0 28 20" fill="none">
                      <path d="M4 10 Q7 6, 10 10 Q13 14, 16 10 Q19 6, 22 10"
                            stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      <path d="M22 10 L18 6 M22 10 L18 14"
                            stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ));
              })()}

              {/* Depth visualization layer (depth numbers + nautical overlay) */}
              {mapReady && showDepthCurrent && initialLocation && (
                <BathymetryCurrentLayer
                  map={mapRef.current}
                  center={initialLocation}
                  radiusKm={5}
                  targetTime={new Date()}
                  showContours={true}
                  showArrows={false}
                  opacity={0.85}
                  visible={showDepthCurrent}
                />
              )}

              {/* Upwind Strategy Box - Bottom Right */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  maxWidth: 220,
                  background: 'rgba(15, 23, 42, 0.92)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  pointerEvents: 'none',
                  zIndex: 100,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1 L5 9" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 1 L3 3.5 M5 1 L7 3.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Upwind Strategy
                </div>
                <div style={{ fontSize: 8, color: '#64748b', marginBottom: 4, fontStyle: 'italic' }}>
                  Left/right looking upwind from the start
                </div>
                {generateStrategy(windDirection, initialWindSpeed, currentDirection, currentSpeed, 'upwind').map((line, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#cbd5e1', lineHeight: '14px', marginTop: i > 0 ? 2 : 0 }}>
                    • {line}
                  </div>
                ))}
              </div>

              {/* Downwind Strategy Box - Bottom Left */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  maxWidth: 220,
                  background: 'rgba(15, 23, 42, 0.92)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  pointerEvents: 'none',
                  zIndex: 100,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1 L5 9" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 9 L3 6.5 M5 9 L7 6.5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Downwind Strategy
                </div>
                <div style={{ fontSize: 8, color: '#64748b', marginBottom: 4, fontStyle: 'italic' }}>
                  Left/right looking upwind (same side as upwind leg)
                </div>
                {generateStrategy(windDirection, initialWindSpeed, currentDirection, currentSpeed, 'downwind').map((line, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#cbd5e1', lineHeight: '14px', marginTop: i > 0 ? 2 : 0 }}>
                    • {line}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <View style={styles.noLocationMessage}>
              <Text style={styles.noLocationText}>
                No venue location available. Set a venue to position the course.
              </Text>
            </View>
          )}
        </View>

        {/* Controls Panel - Two Row Layout */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 16,
            backgroundColor: COLORS.background,
            borderTop: `1px solid ${COLORS.separator}`,
          }}
        >
          {/* Row 1: Primary Controls - Course Type, Wind & Current, Leg Length */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            {/* Course Type */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <Text style={styles.controlLabel}>Course Type</Text>
              <CourseTypeSelector
                value={courseType}
                onChange={handleCourseTypeChange}
              />
            </div>

            {/* Wind & Current Conditions */}
            <div style={{ flex: 1.5, minWidth: 240 }}>
              <ConditionsDisplay
                windDirection={windDirection}
                windSpeed={initialWindSpeed}
                currentDirection={currentDirection}
                currentSpeed={currentSpeed}
                windForecast={windForecast}
                currentForecast={currentForecast}
                onWindDirectionChange={handleWindDirectionChange}
              />
            </div>

            {/* Leg Length */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <LegLengthSlider value={legLength} onChange={handleLegLengthChange} />
            </div>
          </div>

          {/* Row 2: Secondary Controls - Start Line, Actions */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            {/* Start Line Length (Fleet Size) */}
            <div style={{ flex: 2, minWidth: 280 }}>
              <StartLineLengthControl
                numberOfBoats={numberOfBoats}
                boatLengthM={boatLengthM}
                calculatedLength={startLineLengthM}
                onNumberOfBoatsChange={handleNumberOfBoatsChange}
                onBoatLengthChange={handleBoatLengthChange}
              />
            </div>

            {/* Course Actions */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <Text style={styles.controlLabel}>Actions</Text>
              <View style={styles.actionButtonRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleCenterCourseHere}
                >
                  <Move size={16} color={COLORS.blue} />
                  <Text style={styles.actionButtonText}>Move</Text>
                </TouchableOpacity>
                {hasManualAdjustments && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleAlignToWind}
                  >
                    <Compass size={16} color={COLORS.blue} />
                    <Text style={styles.actionButtonText}>Align</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleReset}
                >
                  <RotateCcw size={16} color={COLORS.orange} />
                  <Text style={[styles.actionButtonText, { color: COLORS.orange }]}>Reset</Text>
                </TouchableOpacity>
              </View>
            </div>
          </div>
        </div>

        {/* Hint */}
        {hasManualAdjustments && (
          <View style={styles.hintBar}>
            <Info size={14} color={COLORS.orange} />
            <Text style={styles.hintText}>
              Marks have been manually adjusted. They won't move when wind changes.
            </Text>
          </View>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  closeButton: {
    padding: 8,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 17,
    color: COLORS.blue,
  },
  headerButtonTextSave: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.blue,
  },
  headerButtonDisabled: {
    color: COLORS.gray3,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: COLORS.gray6,
  },
  noLocationMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noLocationText: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
  },
  controlGroup: {
    minWidth: 160,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    marginBottom: 8,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gray6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.blue,
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: `${COLORS.orange}15`,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.orange,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray4,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nativePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
  },
  placeholderText: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CoursePositionEditor;
