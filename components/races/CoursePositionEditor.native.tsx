/**
 * CoursePositionEditor - Native Implementation
 *
 * Full course positioning editor for mobile using react-native-maps.
 * Features:
 * - Tap to place start line center
 * - Draggable markers for course marks
 * - Wind direction and leg length controls
 * - Course type selection
 */

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TurboModuleRegistry,
  Dimensions,
  Linking,
} from 'react-native';
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  RotateCcw,
  Save,
  Target,
  X,
  Anchor,
  Wind,
  Minus,
  Plus,
} from 'lucide-react-native';
import type {
  CourseType,
  PositionedCourse,
  PositionedMark,
  StartLinePosition,
} from '@/types/courses';
import {
  CoursePositioningService,
  COURSE_TEMPLATES,
} from '@/services/CoursePositioningService';
import { triggerHaptic } from '@/lib/haptics';
import { WindOverlay } from '@/components/race-detail/map/WindOverlay';
import { CurrentOverlay } from '@/components/race-detail/map/CurrentOverlay';

// Safely import react-native-maps
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let Polygon: any = null;
let PROVIDER_GOOGLE: any = null;
let mapsAvailable = false;

try {
  const nativeModule = TurboModuleRegistry.get('RNMapsAirModule');
  if (nativeModule) {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
    Polygon = maps.Polygon;
    mapsAvailable = true;
  }
} catch (_e) {
  // react-native-maps not available
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
  secondaryBackground: '#F2F2F7',
};

// Mark colors by type
const MARK_COLORS: Record<string, string> = {
  windward: '#eab308',
  leeward: '#ef4444',
  gate: '#f97316',
  wing: '#22c55e',
  offset: '#3b82f6',
  start: '#22c55e',
  finish: '#ef4444',
};

// Wind direction presets
const WIND_PRESETS: { label: string; degrees: number }[] = [
  { label: 'N', degrees: 0 },
  { label: 'NE', degrees: 45 },
  { label: 'E', degrees: 90 },
  { label: 'SE', degrees: 135 },
  { label: 'S', degrees: 180 },
  { label: 'SW', degrees: 225 },
  { label: 'W', degrees: 270 },
  { label: 'NW', degrees: 315 },
];

// Leg length options
const LEG_LENGTH_OPTIONS = [0.25, 0.35, 0.5, 0.75, 1.0, 1.5];

/** Format degrees as 16-point compass bearing (e.g. "NE", "SSW") */
const formatCompassDirection = (degrees: number): string => {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
};

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

  if (mode === 'upwind') {
    if (hasCurrent) {
      const rel = ((currentDir! - windDir) % 360 + 360) % 360;
      const currentPushesRight = rel > 0 && rel < 180;
      // Favored side is UPSTREAM — opposite to current push direction
      const favoredSide = currentPushesRight ? 'LEFT' : 'RIGHT';
      const startEnd = currentPushesRight ? 'boat end' : 'pin end';
      const startTack = currentPushesRight ? 'starboard' : 'port';
      const extendLayline = currentPushesRight ? 'Port LL' : 'Stbd LL';
      const currentCompass = formatCompassDirection(currentDir!);
      lines.push(`Play the ${favoredSide} side — upstream into ${currentSpd!.toFixed(1)}kt ${currentCompass} current`);
      lines.push(`Start at ${startEnd}, ${startTack} tack toward ${extendLayline}`);
      lines.push(`Extend into Upper 1/3 before tacking — avoid overstanding`);
      if (ws > 0 && ws < 10 && currentSpd! > 0.3) {
        lines.push(`Current is ${Math.round((currentSpd! / ws) * 100)}% of wind — big factor in light air`);
      }
    } else {
      lines.push('No significant current — sail the lifted tack, play the shifts');
      lines.push('Work the Middle 1/3, keep options open both sides');
    }
    if (ws < 8) {
      lines.push('Light air: stay in pressure bands, avoid shore shadows');
    } else if (ws < 15) {
      lines.push('Moderate breeze: sail the shifts, stay in Middle 1/3');
    } else {
      lines.push('Strong breeze: favor flatter water, minimize tacks');
    }
  } else {
    if (hasCurrent) {
      const rel = ((currentDir! - windDir) % 360 + 360) % 360;
      const currentPushesRightDownwind = rel > 180;
      const favoredSide = currentPushesRightDownwind ? 'LEFT' : 'RIGHT';
      const startGybe = currentPushesRightDownwind ? 'starboard' : 'port';
      const currentCompass = formatCompassDirection(currentDir!);
      lines.push(`Play the ${favoredSide} side — sail upstream into ${currentSpd!.toFixed(1)}kt ${currentCompass} current`);
      lines.push(`Round on ${startGybe} gybe, work toward the ${favoredSide} side`);
      lines.push(`Set up in Bottom 1/3 for gate approach`);
      if (ws > 0 && ws < 10 && currentSpd! > 0.3) {
        lines.push('Light air: current carry is critical — stay in the flow');
      }
    } else {
      lines.push('No significant current — sail deep in lulls, heat up in puffs');
      lines.push('Work the Middle 1/3, gybe on the shifts');
    }
    if (ws < 8) {
      lines.push('Light air: higher angles for VMG, soak in puffs');
    } else if (ws < 15) {
      lines.push('Moderate breeze: gybe on the shifts, stay in pressure');
    } else {
      lines.push('Strong breeze: ride waves, minimize gybes');
    }
  }
  return lines;
}

/** Forecast data point for sparklines */
export interface ForecastDataPoint {
  time: string;
  value: number;
  direction?: number;
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
  currentDirection?: number;
  currentSpeed?: number;
  windForecast?: ForecastDataPoint[];
  currentForecast?: ForecastDataPoint[];
  numberOfBoats?: number;
  boatLengthM?: number;
  onSave: (course: Omit<PositionedCourse, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function CoursePositionEditor({
  visible,
  regattaId,
  initialCourseType = 'windward_leeward',
  initialLocation,
  initialWindDirection = 180,
  initialWindSpeed,
  initialLegLength,
  existingCourse,
  currentDirection,
  currentSpeed,
  numberOfBoats,
  boatLengthM,
  onSave,
  onCancel,
}: CoursePositionEditorProps) {
  const mapRef = useRef<any>(null);
  const insets = useSafeAreaInsets();

  // State
  const [saving, setSaving] = useState(false);
  const [courseType, setCourseType] = useState<CourseType>(
    existingCourse?.courseType || initialCourseType
  );
  const [windDirection, setWindDirection] = useState(
    existingCourse?.windDirection ?? initialWindDirection
  );
  const [legLengthNm, setLegLengthNm] = useState(
    existingCourse?.legLengthNm ??
    initialLegLength ??
    COURSE_TEMPLATES[initialCourseType].defaultLegLengthNm
  );
  const [startLineCenter, setStartLineCenter] = useState<{ lat: number; lng: number } | null>(
    existingCourse ? {
      lat: (existingCourse.startLine.pin.lat + existingCourse.startLine.committee.lat) / 2,
      lng: (existingCourse.startLine.pin.lng + existingCourse.startLine.committee.lng) / 2,
    } : initialLocation || null
  );
  const [marks, setMarks] = useState<PositionedMark[]>(existingCourse?.marks || []);
  const [startLine, setStartLine] = useState<StartLinePosition | null>(existingCourse?.startLine || null);
  const [isPlacingStartLine, setIsPlacingStartLine] = useState(!initialLocation && !existingCourse);
  const [hasChanges, setHasChanges] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mapRegion, setMapRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [strategyMode, setStrategyMode] = useState<'upwind' | 'downwind'>('upwind');

  // ── Zoom-dependent scaling ──
  // When zoomed out (large latitudeDelta), shrink marks and labels to reduce clutter.
  const zoomScale = useMemo(() => {
    if (!mapRegion) return 1;
    const baseDelta = 0.008;
    const ratio = baseDelta / mapRegion.latitudeDelta;
    return Math.max(0.55, Math.min(1.0, ratio));
  }, [mapRegion?.latitudeDelta]);

  const markerTransform = useMemo(
    () => ({ transform: [{ scale: zoomScale }] as any }),
    [zoomScale],
  );

  const showDetailLabels = zoomScale > 0.65;

  // Calculate course positions when parameters change
  const calculateCourse = useCallback(() => {
    if (!startLineCenter) return;

    const result = CoursePositioningService.calculatePositionedCourse({
      startLineCenter,
      windDirection,
      legLengthNm,
      courseType,
      numberOfBoats,
      boatLengthM,
    });

    setMarks(result.marks);
    setStartLine(result.startLine);
    setHasChanges(true);
  }, [startLineCenter, windDirection, legLengthNm, courseType, numberOfBoats, boatLengthM]);

  // Recalculate when parameters change
  useEffect(() => {
    if (!existingCourse) {
      calculateCourse();
    }
  }, [calculateCourse, existingCourse]);

  // Initial region for map
  const initialRegion = useMemo(() => {
    if (existingCourse) {
      const allLats = [
        ...existingCourse.marks.map(m => m.latitude),
        existingCourse.startLine.pin.lat,
        existingCourse.startLine.committee.lat,
      ];
      const allLngs = [
        ...existingCourse.marks.map(m => m.longitude),
        existingCourse.startLine.pin.lng,
        existingCourse.startLine.committee.lng,
      ];
      return {
        latitude: (Math.min(...allLats) + Math.max(...allLats)) / 2,
        longitude: (Math.min(...allLngs) + Math.max(...allLngs)) / 2,
        latitudeDelta: Math.max((Math.max(...allLats) - Math.min(...allLats)) * 1.5, 0.02),
        longitudeDelta: Math.max((Math.max(...allLngs) - Math.min(...allLngs)) * 1.5, 0.02),
      };
    }
    const center = startLineCenter || initialLocation || { lat: 22.28, lng: 114.16 };
    return {
      latitude: center.lat,
      longitude: center.lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [startLineCenter, initialLocation, existingCourse]);

  // Handle map press for placing start line
  const handleMapPress = useCallback(
    (event: any) => {
      if (isPlacingStartLine) {
        const { coordinate } = event.nativeEvent;
        triggerHaptic('impactMedium');
        setStartLineCenter({
          lat: coordinate.latitude,
          lng: coordinate.longitude,
        });
        setIsPlacingStartLine(false);

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        }
      }
    },
    [isPlacingStartLine]
  );

  // Handle mark drag
  const handleMarkDrag = useCallback((markId: string, coordinate: { latitude: number; longitude: number }) => {
    setMarks((current) =>
      CoursePositioningService.updateMarkPosition(current, markId, {
        lat: coordinate.latitude,
        lng: coordinate.longitude,
      })
    );
    setHasChanges(true);
    triggerHaptic('impactLight');
  }, []);

  // Handle course type change
  const handleCourseTypeChange = useCallback((type: CourseType) => {
    setCourseType(type);
    setLegLengthNm(COURSE_TEMPLATES[type].defaultLegLengthNm);
    triggerHaptic('selectionChanged');
  }, []);

  // Handle wind direction change
  const handleWindDirectionChange = useCallback(
    (direction: number) => {
      if (startLineCenter && marks.length > 0) {
        const newMarks = CoursePositioningService.recalculateForWindChange(
          marks,
          startLineCenter,
          windDirection,
          direction,
          legLengthNm,
          courseType
        );
        setMarks(newMarks);

        const newStartLine = CoursePositioningService.calculateStartLine(
          startLineCenter,
          direction,
          numberOfBoats,
          boatLengthM
        );
        setStartLine(newStartLine);
      }
      setWindDirection(direction);
      setHasChanges(true);
      triggerHaptic('selectionChanged');
    },
    [startLineCenter, marks, windDirection, legLengthNm, courseType, numberOfBoats, boatLengthM]
  );

  // Handle leg length change
  const handleLegLengthChange = useCallback(
    (length: number) => {
      if (startLineCenter && marks.length > 0) {
        const newMarks = CoursePositioningService.recalculateForLegLengthChange(
          marks,
          startLineCenter,
          windDirection,
          legLengthNm,
          length,
          courseType
        );
        setMarks(newMarks);
      }
      setLegLengthNm(length);
      setHasChanges(true);
      triggerHaptic('selectionChanged');
    },
    [startLineCenter, marks, windDirection, legLengthNm, courseType]
  );

  // Reset course
  const handleReset = useCallback(() => {
    if (startLineCenter) {
      const template = COURSE_TEMPLATES[courseType];
      setLegLengthNm(template.defaultLegLengthNm);
      calculateCourse();
      triggerHaptic('impactMedium');
    }
  }, [startLineCenter, courseType, calculateCourse]);

  // Re-place start line
  const handleReplaceStartLine = useCallback(() => {
    setIsPlacingStartLine(true);
    setMarks([]);
    setStartLine(null);
    setStartLineCenter(null);
    triggerHaptic('impactMedium');
  }, []);

  // Center map on course
  const handleCenterOnCourse = useCallback(() => {
    if (!mapRef.current || marks.length === 0) return;
    const allCoords = marks.map(m => ({ latitude: m.latitude, longitude: m.longitude }));
    if (startLine) {
      allCoords.push(
        { latitude: startLine.pin.lat, longitude: startLine.pin.lng },
        { latitude: startLine.committee.lat, longitude: startLine.committee.lng },
      );
    }
    mapRef.current.fitToCoordinates(allCoords, {
      edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
      animated: true,
    });
    triggerHaptic('selectionChanged');
  }, [marks, startLine]);

  // Save course
  const handleSave = async () => {
    if (!startLineCenter || !startLine || marks.length === 0) {
      showAlert('Error', 'Please position the course before saving.');
      return;
    }

    try {
      setSaving(true);
      triggerHaptic('impactMedium');

      const hasManualAdjustments = marks.some((m) => m.isUserAdjusted);

      const courseData: Omit<PositionedCourse, 'id' | 'createdAt' | 'updatedAt'> = {
        regattaId,
        userId: '', // Will be set by parent
        courseType,
        marks,
        startLine,
        windDirection,
        legLengthNm,
        hasManualAdjustments,
      };

      onSave(courseData);
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to save course position.');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      showConfirm(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        onCancel,
        { destructive: true },
      );
    } else {
      onCancel();
    }
  }, [hasChanges, onCancel]);

  const handleContactSupport = useCallback(() => {
    const subject = encodeURIComponent('Course Positioning Map Unavailable');
    const body = encodeURIComponent(
      `Course positioning map is unavailable on this build.\n\n` +
      `Regatta ID: ${regattaId}\n` +
      `Platform: ${Platform.OS}\n` +
      `Maps module available: ${mapsAvailable ? 'yes' : 'no'}`
    );
    const mailtoUrl = `mailto:support@regattaflow.com?subject=${subject}&body=${body}`;
    Linking.openURL(mailtoUrl).catch(() => {});
  }, [regattaId]);

  // Get wind direction label
  const getWindLabel = (degrees: number): string => {
    const index = Math.round(degrees / 45) % 8;
    return WIND_PRESETS[index].label;
  };

  // Get mark label
  const getMarkLabel = (mark: PositionedMark, index: number): string => {
    if (mark.type === 'windward') return 'W';
    if (mark.type === 'leeward') return 'L';
    if (mark.type === 'gate') return 'G';
    if (mark.type === 'wing') return 'R';
    if (mark.type === 'offset') return 'O';
    return (index + 1).toString();
  };

  // Start line coordinates
  const startLineCoordinates = useMemo(() => {
    if (!startLine) return [];
    return [
      { latitude: startLine.pin.lat, longitude: startLine.pin.lng },
      { latitude: startLine.committee.lat, longitude: startLine.committee.lng },
    ];
  }, [startLine]);

  // Course overlay: full race box (diamond) with laylines, start line inside
  const courseOverlay = useMemo(() => {
    if (marks.length === 0) return null;
    const windwardMark = marks.find((m) => m.type === 'windward');
    // Leeward position: leeward mark, or midpoint of gate marks, or start line midpoint
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

    // Diamond corners at widest point (midpoint between W and L)
    // These may be replaced by start-box/layline intersections when a start line exists
    let portCorner = offsetCoordinate(M.latitude, M.longitude, rightBearing, halfWidth);
    let stbdCorner = offsetCoordinate(M.latitude, M.longitude, leftBearing, halfWidth);

    // ── Third dividers (1/3 and 2/3 from L to W) ──
    const oneThird = lerpCoord(L, W, 1 / 3);
    const twoThirds = lerpCoord(L, W, 2 / 3);
    // Diamond width at each third (linear taper: 0 at ends, max at middle)
    const oneThirdHW = halfWidth * (2 / 3);   // 1/3 from L in bottom half
    const twoThirdsHW = halfWidth * (2 / 3);  // 2/3 from L in top half
    const oneThirdLeft = offsetCoordinate(oneThird.latitude, oneThird.longitude, leftBearing, oneThirdHW);
    const oneThirdRight = offsetCoordinate(oneThird.latitude, oneThird.longitude, rightBearing, oneThirdHW);
    const twoThirdsLeft = offsetCoordinate(twoThirds.latitude, twoThirds.longitude, leftBearing, twoThirdsHW);
    const twoThirdsRight = offsetCoordinate(twoThirds.latitude, twoThirds.longitude, rightBearing, twoThirdsHW);

    // Third labels
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

    // Side labels (offset into each half at midpoint height)
    const sideOffset = halfWidth * 0.5;
    const leftLabel = offsetCoordinate(M.latitude, M.longitude, leftBearing, sideOffset);
    const rightLabel = offsetCoordinate(M.latitude, M.longitude, rightBearing, sideOffset);

    // Layline labels (upper laylines) — recomputed after corners may change
    let portLLLabel = lerpCoord(W, portCorner, 0.5);
    let stbdLLLabel = lerpCoord(W, stbdCorner, 0.5);

    // ── Start line: flatten diamond bottom to P & C, add start box ──
    let P = L; // default bottom to leeward mark
    let C = L;
    let startMid = L;
    let startBox = null;
    let startLabels = null;

    if (startLine) {
      P = { latitude: startLine.pin.lat, longitude: startLine.pin.lng };
      C = { latitude: startLine.committee.lat, longitude: startLine.committee.lng };
      startMid = lerpCoord(P, C, 0.5);

      // Start box: parallelogram extending downwind from start line
      // Short sides angled 45° to the start line, toward committee end
      const boxDepth = legDistanceM * 0.15;

      // Bearing from P toward C along the start line
      const dLat = C.latitude - P.latitude;
      const dLng = (C.longitude - P.longitude) * Math.cos((P.latitude * Math.PI) / 180);
      const lineBearingPtoC = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

      // 45° to the start line, angling downwind + toward committee end
      // Pick whichever of ±45° from the line has a downwind component
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

      // Labels offset along the short-side bearing
      const labelDownOffset = boxDepth * 0.5;
      const pinEndLabel = offsetCoordinate(
        lerpCoord(P, startOneThird, 0.5).latitude,
        lerpCoord(P, startOneThird, 0.5).longitude,
        shortSideBearing, labelDownOffset
      );
      const startMidLabel = offsetCoordinate(startMid.latitude, startMid.longitude, shortSideBearing, labelDownOffset);
      const boatEndLabel = offsetCoordinate(
        lerpCoord(startTwoThirds, C, 0.5).latitude,
        lerpCoord(startTwoThirds, C, 0.5).longitude,
        shortSideBearing, labelDownOffset
      );

      startBox = {
        outline: [P, C, committeeDown, pinDown],
        dividers: [
          [startOneThird, oneThirdDown],
          [startTwoThirds, twoThirdsDown],
        ],
      };
      startLabels = { pinEnd: pinEndLabel, middle: startMidLabel, boatEnd: boatEndLabel };

      // Extend lower laylines from P and C into the course to meet upper laylines from W
      // Laylines are 45° to the WIND (not to the start line)
      // P is on left/stbd side → layline goes upwind + left (windDir - 45°)
      // C is on right/port side → layline goes upwind + right (windDir + 45°)
      const laylineBearingFromP = (windDirection - 45 + 360) % 360;
      const laylineBearingFromC = (windDirection + 45) % 360;
      const bearingWtoPort = flatBearing(W, portCorner);
      const bearingWtoStbd = flatBearing(W, stbdCorner);

      // P (stbd/left side) → extend to meet stbd upper layline (W→stbdCorner)
      const newStbd = rayIntersection(P, laylineBearingFromP, W, bearingWtoStbd);
      // C (port/right side) → extend to meet port upper layline (W→portCorner)
      const newPort = rayIntersection(C, laylineBearingFromC, W, bearingWtoPort);

      if (newStbd) stbdCorner = newStbd;
      if (newPort) portCorner = newPort;

      // Recompute layline labels with the new corner positions
      portLLLabel = lerpCoord(W, portCorner, 0.5);
      stbdLLLabel = lerpCoord(W, stbdCorner, 0.5);
    }

    return {
      W, L, M, P, C, startMid, portCorner, stbdCorner,
      // Pentagon: W → portCorner → C → P → stbdCorner (flat base at start line)
      leftPoly: [W, stbdCorner, P, startMid],
      rightPoly: [W, portCorner, C, startMid],
      thirdDividers: [
        [oneThirdLeft, oneThirdRight],
        [twoThirdsLeft, twoThirdsRight],
      ],
      thirdLabels: { bottom: bottomThirdLabel, middle: middleThirdLabel, upper: upperThirdLabel },
      favoredSide,
      leftLabel,
      rightLabel,
      laylineLabels: { port: portLLLabel, stbd: stbdLLLabel },
      startBox,
      startLabels,
    };
  }, [marks, windDirection, currentDirection, currentSpeed, startLine]);

  // Fallback when maps not available
  if (!mapsAvailable || !MapView) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={onCancel} style={styles.closeButton}>
              <X size={24} color={COLORS.label} />
            </Pressable>
            <Text style={styles.headerTitle}>Position Course</Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.fallbackContainer}>
            <MapPin size={48} color={COLORS.gray} />
            <Text style={styles.fallbackTitle}>Map Unavailable</Text>
            <Text style={styles.fallbackText}>
              Course positioning requires a development build with native maps support.
            </Text>
            <View style={styles.fallbackActions}>
              <Pressable onPress={onCancel} style={styles.fallbackButton}>
                <Text style={styles.fallbackButtonText}>Close</Text>
              </Pressable>
              <Pressable onPress={handleContactSupport} style={styles.fallbackButtonSecondary}>
                <Text style={styles.fallbackButtonText}>Contact Support</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleCancel} style={styles.closeButton}>
            <X size={24} color={COLORS.label} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Position Course</Text>
            <Text style={styles.headerSubtitle}>
              {isPlacingStartLine ? 'Tap to place start line' : 'Drag marks to adjust'}
            </Text>
          </View>
          <Pressable
            onPress={handleSave}
            disabled={saving || !startLineCenter || marks.length === 0}
            style={[
              styles.saveButton,
              (saving || !startLineCenter || marks.length === 0) && styles.saveButtonDisabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Save size={20} color={!startLineCenter || marks.length === 0 ? COLORS.gray : '#fff'} />
            )}
          </Pressable>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            onRegionChangeComplete={(region: any) => setMapRegion(region)}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass
            mapType="standard"
          >
            {/* Start Line */}
            {startLineCoordinates.length === 2 && (
              <Polyline
                coordinates={startLineCoordinates}
                strokeColor="#22c55e"
                strokeWidth={4}
              />
            )}

            {/* Course Marks */}
            {marks.map((mark, index) => (
              <Marker
                key={mark.id}
                coordinate={{
                  latitude: mark.latitude,
                  longitude: mark.longitude,
                }}
                draggable
                onDragEnd={(e: any) => handleMarkDrag(mark.id, e.nativeEvent.coordinate)}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[styles.markContainer, markerTransform]}>
                  <View
                    style={[
                      styles.markCircle,
                      { backgroundColor: MARK_COLORS[mark.type] || '#64748b' },
                      mark.isUserAdjusted && styles.markCircleEdited,
                    ]}
                  >
                    <Text style={styles.markLabel}>{getMarkLabel(mark, index)}</Text>
                  </View>
                </View>
              </Marker>
            ))}

            {/* Wind Direction Arrows */}
            {mapRegion && initialWindSpeed != null && (
              <WindOverlay
                conditions={{ speed: initialWindSpeed, direction: windDirection }}
                region={mapRegion}
              />
            )}

            {/* Current Flow Arrows */}
            {mapRegion && currentDirection != null && currentSpeed != null && currentSpeed > 0.05 && (
              <CurrentOverlay
                conditions={{
                  speed: currentSpeed,
                  direction: currentDirection,
                  strength: currentSpeed > 1 ? 'strong' : currentSpeed > 0.3 ? 'moderate' : 'slack',
                }}
                region={mapRegion}
              />
            )}

            {/* ═══ Course Box: full diamond with laylines ═══ */}
            {courseOverlay && Polygon && (
              <>
                {/* ── Race area: left/right halves ── */}
                <Polygon
                  coordinates={courseOverlay.leftPoly}
                  fillColor={courseOverlay.favoredSide === 'left' ? 'rgba(34, 197, 94, 0.13)' : 'rgba(148, 163, 184, 0.06)'}
                  strokeColor="transparent"
                />
                <Polygon
                  coordinates={courseOverlay.rightPoly}
                  fillColor={courseOverlay.favoredSide === 'right' ? 'rgba(34, 197, 94, 0.13)' : 'rgba(148, 163, 184, 0.06)'}
                  strokeColor="transparent"
                />

                {/* ── Laylines (dashed yellow diamond outline) ── */}
                <Polyline coordinates={[courseOverlay.W, courseOverlay.portCorner]} strokeColor={`rgba(234, 179, 8, ${zoomScale < 0.8 ? 0.4 : 0.8})`} strokeWidth={zoomScale < 0.8 ? 1 : 1.5} lineDashPattern={[8, 5]} />
                <Polyline coordinates={[courseOverlay.C, courseOverlay.portCorner]} strokeColor={`rgba(234, 179, 8, ${zoomScale < 0.8 ? 0.4 : 0.8})`} strokeWidth={zoomScale < 0.8 ? 1 : 1.5} lineDashPattern={[8, 5]} />
                <Polyline coordinates={[courseOverlay.W, courseOverlay.stbdCorner]} strokeColor={`rgba(234, 179, 8, ${zoomScale < 0.8 ? 0.4 : 0.8})`} strokeWidth={zoomScale < 0.8 ? 1 : 1.5} lineDashPattern={[8, 5]} />
                <Polyline coordinates={[courseOverlay.P, courseOverlay.stbdCorner]} strokeColor={`rgba(234, 179, 8, ${zoomScale < 0.8 ? 0.4 : 0.8})`} strokeWidth={zoomScale < 0.8 ? 1 : 1.5} lineDashPattern={[8, 5]} />

                {/* ── Rhumbline: W to start line midpoint (or leeward mark) ── */}
                <Polyline
                  coordinates={[courseOverlay.W, courseOverlay.startMid]}
                  strokeColor="rgba(255, 255, 255, 0.5)"
                  strokeWidth={1.5}
                  lineDashPattern={[8, 4]}
                />

                {/* ── Third divider lines ── */}
                {courseOverlay.thirdDividers.map((coords, i) => (
                  <Polyline key={`third-${i}`} coordinates={coords} strokeColor="rgba(148, 163, 184, 0.35)" strokeWidth={1} lineDashPattern={[4, 4]} />
                ))}

                {/* ── Third zone labels — hidden when zoomed out ── */}
                {showDetailLabels && (
                  <>
                    <Marker coordinate={courseOverlay.thirdLabels.bottom} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                      <View style={[courseOverlayStyles.thirdPill, markerTransform]}><Text style={courseOverlayStyles.thirdText}>Bottom 1/3</Text></View>
                    </Marker>
                    <Marker coordinate={courseOverlay.thirdLabels.middle} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                      <View style={[courseOverlayStyles.thirdPill, markerTransform]}><Text style={courseOverlayStyles.thirdText}>Middle 1/3</Text></View>
                    </Marker>
                    <Marker coordinate={courseOverlay.thirdLabels.upper} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                      <View style={[courseOverlayStyles.thirdPill, markerTransform]}><Text style={courseOverlayStyles.thirdText}>Upper 1/3</Text></View>
                    </Marker>
                  </>
                )}

                {/* ── Rhumbline label — hidden when zoomed out ── */}
                {showDetailLabels && (
                  <Marker coordinate={lerpCoord(courseOverlay.startMid, courseOverlay.W, 0.35)} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                    <View style={[courseOverlayStyles.rhumblinePill, markerTransform]}><Text style={courseOverlayStyles.rhumblineText}>Rhumbline</Text></View>
                  </Marker>
                )}

                {/* ── LEFT / RIGHT side labels ── */}
                <Marker coordinate={courseOverlay.leftLabel} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                  <View style={[courseOverlayStyles.sidePill, courseOverlay.favoredSide === 'left' && courseOverlayStyles.sidePillFavored, markerTransform]}>
                    <Text style={[courseOverlayStyles.sideText, courseOverlay.favoredSide === 'left' && courseOverlayStyles.sideTextFavored]}>LEFT</Text>
                  </View>
                </Marker>
                <Marker coordinate={courseOverlay.rightLabel} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                  <View style={[courseOverlayStyles.sidePill, courseOverlay.favoredSide === 'right' && courseOverlayStyles.sidePillFavored, markerTransform]}>
                    <Text style={[courseOverlayStyles.sideText, courseOverlay.favoredSide === 'right' && courseOverlayStyles.sideTextFavored]}>RIGHT</Text>
                  </View>
                </Marker>

                {/* ── Layline labels — hidden when zoomed out ── */}
                {showDetailLabels && (
                  <>
                    <Marker coordinate={courseOverlay.laylineLabels.port} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                      <View style={[courseOverlayStyles.laylinePill, markerTransform]}><Text style={courseOverlayStyles.laylineText}>Stbd LL</Text></View>
                    </Marker>
                    <Marker coordinate={courseOverlay.laylineLabels.stbd} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                      <View style={[courseOverlayStyles.laylinePill, markerTransform]}><Text style={courseOverlayStyles.laylineText}>Port LL</Text></View>
                    </Marker>
                  </>
                )}

                {/* ── Start box (rectangle extending downwind from start line) ── */}
                {courseOverlay.startBox && (
                  <>
                    <Polyline
                      coordinates={[...courseOverlay.startBox.outline, courseOverlay.startBox.outline[0]]}
                      strokeColor={`rgba(249, 115, 22, ${zoomScale < 0.8 ? 0.35 : 0.6})`}
                      strokeWidth={zoomScale < 0.8 ? 1 : 1.5}
                      lineDashPattern={[6, 4]}
                    />
                    {courseOverlay.startBox.dividers.map((coords, i) => (
                      <Polyline
                        key={`start-div-${i}`}
                        coordinates={coords}
                        strokeColor="rgba(249, 115, 22, 0.35)"
                        strokeWidth={1}
                        lineDashPattern={[4, 4]}
                      />
                    ))}
                  </>
                )}

                {/* ── Start line labels (if available) ── */}
                {courseOverlay.startLabels && (
                  <>
                    <Marker coordinate={courseOverlay.startLabels.pinEnd} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                      <View style={[courseOverlayStyles.startPill, markerTransform]}><Text style={courseOverlayStyles.startText}>Pin End</Text></View>
                    </Marker>
                    {showDetailLabels && (
                      <Marker coordinate={courseOverlay.startLabels.middle} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                        <View style={[courseOverlayStyles.startPill, markerTransform]}><Text style={courseOverlayStyles.startText}>Middle</Text></View>
                      </Marker>
                    )}
                    <Marker coordinate={courseOverlay.startLabels.boatEnd} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                      <View style={[courseOverlayStyles.startPill, markerTransform]}><Text style={courseOverlayStyles.startText}>Boat End</Text></View>
                    </Marker>
                  </>
                )}
              </>
            )}

            {/* Start Line Endpoints */}
            {startLine && (
              <>
                <Marker
                  coordinate={{ latitude: startLine.pin.lat, longitude: startLine.pin.lng }}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={[styles.startLineEndpoint, { backgroundColor: '#f97316' }, markerTransform]}>
                    <Text style={styles.startLineLabel}>P</Text>
                  </View>
                </Marker>
                <Marker
                  coordinate={{ latitude: startLine.committee.lat, longitude: startLine.committee.lng }}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={[styles.startLineEndpoint, { backgroundColor: '#3b82f6' }, markerTransform]}>
                    <Text style={styles.startLineLabel}>C</Text>
                  </View>
                </Marker>
              </>
            )}
          </MapView>

          {/* Wind Indicator — top left */}
          {startLineCenter && !isPlacingStartLine && initialWindSpeed != null && (
            <View style={overlayStyles.windBadge}>
              <Wind size={12} color="#6366f1" />
              <Text style={overlayStyles.badgeText}>
                Wind {initialWindSpeed}kt {formatCompassDirection(windDirection)}
              </Text>
            </View>
          )}

          {/* Current Indicator — top right */}
          {startLineCenter && !isPlacingStartLine && currentSpeed != null && currentSpeed > 0.05 && currentDirection != null && (
            <View style={overlayStyles.currentBadge}>
              <Anchor size={12} color="#06b6d4" />
              <Text style={overlayStyles.badgeText}>
                Current {currentSpeed.toFixed(1)}kt {formatCompassDirection(currentDirection)}
              </Text>
            </View>
          )}

          {/* Recenter Button — top right below current badge */}
          {startLineCenter && !isPlacingStartLine && marks.length > 0 && (
            <Pressable style={overlayStyles.recenterBtn} onPress={handleCenterOnCourse}>
              <Target size={18} color="#007AFF" />
            </Pressable>
          )}

          {/* Placement Instructions */}
          {isPlacingStartLine && (
            <View style={styles.instructionOverlay}>
              <Target size={20} color="#f97316" />
              <Text style={styles.instructionText}>Tap on map to place start line center</Text>
            </View>
          )}

          {/* Toggle Controls Button */}
          <Pressable
            style={styles.toggleControlsButton}
            onPress={() => setShowControls(!showControls)}
          >
            {showControls ? <ChevronDown size={20} color="#64748b" /> : <ChevronUp size={20} color="#64748b" />}
            <Text style={styles.toggleControlsLabel}>{showControls ? 'Map' : 'Settings'}</Text>
          </Pressable>
        </View>

        {/* Strategy Section — segmented toggle, one leg at a time */}
        {startLineCenter && !isPlacingStartLine && (
          <View style={strategyStyles.container}>
            {/* Segmented Control */}
            <View style={strategyStyles.segmentRow}>
              <Pressable
                style={[strategyStyles.segmentBtn, strategyMode === 'upwind' && strategyStyles.segmentBtnActiveUpwind]}
                onPress={() => setStrategyMode('upwind')}
              >
                <Text style={[strategyStyles.segmentText, strategyMode === 'upwind' && strategyStyles.segmentTextActiveUpwind]}>
                  {'\u2191'} Upwind
                </Text>
              </Pressable>
              <Pressable
                style={[strategyStyles.segmentBtn, strategyMode === 'downwind' && strategyStyles.segmentBtnActiveDownwind]}
                onPress={() => setStrategyMode('downwind')}
              >
                <Text style={[strategyStyles.segmentText, strategyMode === 'downwind' && strategyStyles.segmentTextActiveDownwind]}>
                  {'\u2193'} Downwind
                </Text>
              </Pressable>
            </View>
            {/* Strategy Content */}
            <View style={strategyStyles.contentCard}>
              {generateStrategy(windDirection, initialWindSpeed, currentDirection, currentSpeed, strategyMode).map((line, i) => (
                <Text key={i} style={i === 0 ? strategyStyles.primaryBullet : strategyStyles.bulletText}>
                  {i === 0 ? '' : '\u2022 '}{line}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Controls Panel */}
        {showControls && (
          <View style={[styles.controlsPanel, { paddingBottom: insets.bottom + 8 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Course Type */}
              <View style={styles.controlSection}>
                <Text style={styles.controlLabel}>COURSE TYPE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionRow}>
                    {Object.values(COURSE_TEMPLATES)
                      .filter((t) => t.type !== 'custom')
                      .map((template) => {
                        const isSelected = courseType === template.type;
                        return (
                          <Pressable
                            key={template.type}
                            onPress={() => handleCourseTypeChange(template.type)}
                            style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                          >
                            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                              {template.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                  </View>
                </ScrollView>
              </View>

              {/* Wind Direction */}
              <View style={styles.controlSection}>
                <View style={styles.controlHeader}>
                  <View style={styles.controlLabelRow}>
                    <Wind size={14} color="#6366f1" />
                    <Text style={styles.controlLabel}>WIND DIRECTION</Text>
                  </View>
                  <Text style={styles.controlValue}>
                    {windDirection}° ({getWindLabel(windDirection)})
                  </Text>
                </View>
                <View style={styles.optionRow}>
                  {WIND_PRESETS.map((preset) => {
                    const isSelected = Math.abs(windDirection - preset.degrees) < 23;
                    return (
                      <Pressable
                        key={preset.label}
                        onPress={() => handleWindDirectionChange(preset.degrees)}
                        style={[styles.compassButton, isSelected && styles.compassButtonSelected]}
                      >
                        <Text style={[styles.compassText, isSelected && styles.compassTextSelected]}>
                          {preset.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.adjustRow}>
                  <Pressable
                    onPress={() => handleWindDirectionChange((windDirection - 10 + 360) % 360)}
                    style={styles.adjustButton}
                  >
                    <Text style={styles.adjustLabel}>-10°</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleWindDirectionChange((windDirection - 1 + 360) % 360)}
                    style={styles.adjustButton}
                  >
                    <Text style={styles.adjustLabel}>-1°</Text>
                  </Pressable>
                  <View style={styles.adjustSpacer}>
                    <Text style={styles.adjustDegrees}>{windDirection}°</Text>
                  </View>
                  <Pressable
                    onPress={() => handleWindDirectionChange((windDirection + 1) % 360)}
                    style={styles.adjustButton}
                  >
                    <Text style={styles.adjustLabel}>+1°</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleWindDirectionChange((windDirection + 10) % 360)}
                    style={styles.adjustButton}
                  >
                    <Text style={styles.adjustLabel}>+10°</Text>
                  </Pressable>
                </View>
              </View>

              {/* Leg Length */}
              <View style={styles.controlSection}>
                <View style={styles.controlHeader}>
                  <View style={styles.controlLabelRow}>
                    <Anchor size={14} color="#22c55e" />
                    <Text style={styles.controlLabel}>LEG LENGTH</Text>
                  </View>
                  <Text style={[styles.controlValue, { color: '#22c55e' }]}>{legLengthNm} nm</Text>
                </View>
                <View style={styles.optionRow}>
                  {LEG_LENGTH_OPTIONS.map((length) => {
                    const isSelected = Math.abs(legLengthNm - length) < 0.05;
                    return (
                      <Pressable
                        key={length}
                        onPress={() => handleLegLengthChange(length)}
                        style={[styles.lengthButton, isSelected && styles.lengthButtonSelected]}
                      >
                        <Text style={[styles.lengthText, isSelected && styles.lengthTextSelected]}>
                          {length}nm
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {startLineCenter && (
                  <Pressable onPress={handleReplaceStartLine} style={styles.actionButton}>
                    <Target size={16} color="#f97316" />
                    <Text style={styles.actionButtonText}>Re-place Start</Text>
                  </Pressable>
                )}
                <Pressable onPress={handleReset} style={styles.actionButton}>
                  <RotateCcw size={16} color="#64748b" />
                  <Text style={styles.actionButtonText}>Reset</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const courseOverlayStyles = StyleSheet.create({
  sidePill: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  sidePillFavored: {
    backgroundColor: 'rgba(22, 101, 52, 0.85)',
    borderColor: 'rgba(34, 197, 94, 0.6)',
  },
  sideText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  sideTextFavored: {
    color: '#86efac',
  },
  laylinePill: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  laylineText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#eab308',
  },
  thirdPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thirdText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(203, 213, 225, 0.8)',
    letterSpacing: 0.5,
  },
  rhumblinePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  rhumblineText: {
    fontSize: 8,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  startPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  startText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#86efac',
  },
});

const overlayStyles = StyleSheet.create({
  windBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  currentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
  },
  recenterBtn: {
    position: 'absolute',
    top: 40,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
});

const strategyStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  segmentBtnActiveUpwind: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  segmentBtnActiveDownwind: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  segmentTextActiveUpwind: {
    color: '#22c55e',
  },
  segmentTextActiveDownwind: {
    color: '#3b82f6',
  },
  contentCard: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  primaryBullet: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f0fdf4',
    lineHeight: 18,
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
    marginTop: 2,
  },
});

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
    borderBottomColor: COLORS.gray5,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray5,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  instructionOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#c2410c',
  },
  toggleControlsButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleControlsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  markContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markCircleEdited: {
    borderColor: '#f97316',
  },
  markLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  startLineEndpoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  startLineLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  controlsPanel: {
    backgroundColor: COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray5,
    paddingTop: 12,
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  controlSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  controlValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.secondaryBackground,
    borderWidth: 1,
    borderColor: COLORS.gray5,
  },
  optionButtonSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.label,
  },
  optionTextSelected: {
    color: '#1d4ed8',
  },
  compassButton: {
    width: 36,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.secondaryBackground,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassButtonSelected: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
  },
  compassText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  compassTextSelected: {
    color: '#4338ca',
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  adjustButton: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  adjustDegrees: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
    textAlign: 'center',
  },
  adjustSpacer: {
    flex: 1,
    alignItems: 'center',
  },
  lengthButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.secondaryBackground,
    borderWidth: 1,
    borderColor: COLORS.gray5,
  },
  lengthButtonSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  lengthText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  lengthTextSelected: {
    color: '#15803d',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.secondaryBackground,
    borderWidth: 1,
    borderColor: COLORS.gray5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.label,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
    marginTop: 16,
  },
  fallbackText: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  fallbackButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 10,
  },
  fallbackActions: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  fallbackButtonSecondary: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.gray3,
  },
  fallbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
  },
});

export default CoursePositionEditor;
