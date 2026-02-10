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
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Navigation,
  RotateCcw,
  Save,
  Target,
  X,
  Anchor,
  Flag,
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

// Safely import react-native-maps
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
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
    if (startLineCenter && !existingCourse) {
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

  // Save course
  const handleSave = async () => {
    if (!startLineCenter || !startLine || marks.length === 0) {
      Alert.alert('Error', 'Please position the course before saving.');
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
      Alert.alert('Error', error.message || 'Failed to save course position.');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onCancel },
        ]
      );
    } else {
      onCancel();
    }
  }, [hasChanges, onCancel]);

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
            <Pressable onPress={onCancel} style={styles.fallbackButton}>
              <Text style={styles.fallbackButtonText}>Close</Text>
            </Pressable>
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
                <View style={styles.markContainer}>
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

            {/* Start Line Endpoints */}
            {startLine && (
              <>
                <Marker
                  coordinate={{ latitude: startLine.pin.lat, longitude: startLine.pin.lng }}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={[styles.startLineEndpoint, { backgroundColor: '#f97316' }]}>
                    <Text style={styles.startLineLabel}>P</Text>
                  </View>
                </Marker>
                <Marker
                  coordinate={{ latitude: startLine.committee.lat, longitude: startLine.committee.lng }}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={[styles.startLineEndpoint, { backgroundColor: '#3b82f6' }]}>
                    <Text style={styles.startLineLabel}>C</Text>
                  </View>
                </Marker>
              </>
            )}
          </MapView>

          {/* Placement Instructions */}
          {isPlacingStartLine && (
            <View style={styles.instructionOverlay}>
              <Target size={20} color="#f97316" />
              <Text style={styles.instructionText}>Tap on map to place start line center</Text>
            </View>
          )}

          {/* Course Info Badge */}
          {startLineCenter && !isPlacingStartLine && (
            <View style={styles.courseInfoBadge}>
              <View style={styles.courseInfoItem}>
                <Wind size={14} color="#6366f1" />
                <Text style={styles.courseInfoText}>{windDirection}°</Text>
              </View>
              <View style={styles.courseInfoItem}>
                <Anchor size={14} color="#22c55e" />
                <Text style={styles.courseInfoText}>{legLengthNm}nm</Text>
              </View>
              <View style={styles.courseInfoItem}>
                <Flag size={14} color="#f97316" />
                <Text style={styles.courseInfoText}>{marks.length} marks</Text>
              </View>
            </View>
          )}

          {/* Toggle Controls Button */}
          <Pressable
            style={styles.toggleControlsButton}
            onPress={() => setShowControls(!showControls)}
          >
            {showControls ? <ChevronDown size={24} color="#64748b" /> : <ChevronUp size={24} color="#64748b" />}
          </Pressable>
        </View>

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
                    <RotateCcw size={16} color="#64748b" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleWindDirectionChange((windDirection - 1 + 360) % 360)}
                    style={styles.adjustButton}
                  >
                    <Minus size={16} color="#64748b" />
                  </Pressable>
                  <View style={styles.adjustSpacer} />
                  <Pressable
                    onPress={() => handleWindDirectionChange((windDirection + 1) % 360)}
                    style={styles.adjustButton}
                  >
                    <Plus size={16} color="#64748b" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleWindDirectionChange((windDirection + 10) % 360)}
                    style={styles.adjustButton}
                  >
                    <ChevronUp size={16} color="#64748b" />
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
  courseInfoBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseInfoText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.label,
  },
  toggleControlsButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 16,
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
  adjustSpacer: {
    flex: 1,
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
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 10,
  },
  fallbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
  },
});

export default CoursePositionEditor;
