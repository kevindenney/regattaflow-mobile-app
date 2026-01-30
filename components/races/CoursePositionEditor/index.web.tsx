/**
 * CoursePositionEditor - Main component for positioning race courses on a map
 *
 * Workflow:
 * 1. User places start line center on the map
 * 2. Sets wind direction (from forecast or manual)
 * 3. Marks auto-position based on course type template
 * 4. User can drag marks to fine-tune positions
 * 5. Save to persist to database
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Check,
  MapPin,
  Navigation,
  RotateCcw,
  Save,
  Target,
  X,
  Anchor,
  Flag,
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
import { EditorControls } from './EditorControls';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CoursePositionEditor');
const isWeb = Platform.OS === 'web';

// Mark colors by type
const MARK_COLORS: Record<string, string> = {
  windward: '#eab308', // yellow
  leeward: '#ef4444', // red
  gate: '#f97316', // orange
  wing: '#22c55e', // green
  offset: '#3b82f6', // blue
  start: '#22c55e', // green
  finish: '#ef4444', // red
};

interface CoursePositionEditorProps {
  visible: boolean;
  regattaId: string;
  sourceDocumentId?: string;
  initialCourseType?: CourseType;
  initialLocation?: { lat: number; lng: number };
  initialWindDirection?: number;
  onSave: (positionedCourse: PositionedCourse) => void;
  onCancel: () => void;
}

export function CoursePositionEditor({
  visible,
  regattaId,
  sourceDocumentId,
  initialCourseType = 'windward_leeward',
  initialLocation,
  initialWindDirection = 180,
  onSave,
  onCancel,
}: CoursePositionEditorProps) {
  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const maplibreRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const startLineRef = useRef<any>(null);
  const isMapInitializingRef = useRef(false);

  // State
  const [mapContainerReady, setMapContainerReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [courseType, setCourseType] = useState<CourseType>(initialCourseType);
  const [windDirection, setWindDirection] = useState(initialWindDirection);
  const [legLengthNm, setLegLengthNm] = useState(
    COURSE_TEMPLATES[initialCourseType].defaultLegLengthNm
  );
  const [startLineCenter, setStartLineCenter] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [marks, setMarks] = useState<PositionedMark[]>([]);
  const [startLine, setStartLine] = useState<StartLinePosition | null>(null);
  const [isPlacingStartLine, setIsPlacingStartLine] = useState(!initialLocation);
  const [hasChanges, setHasChanges] = useState(false);

  // Refs for event handlers
  const windDirectionRef = useRef(windDirection);
  const legLengthNmRef = useRef(legLengthNm);
  const courseTypeRef = useRef(courseType);
  const startLineCenterRef = useRef(startLineCenter);
  const isPlacingStartLineRef = useRef(isPlacingStartLine);

  // Keep refs in sync
  useEffect(() => {
    windDirectionRef.current = windDirection;
  }, [windDirection]);
  useEffect(() => {
    legLengthNmRef.current = legLengthNm;
  }, [legLengthNm]);
  useEffect(() => {
    courseTypeRef.current = courseType;
  }, [courseType]);
  useEffect(() => {
    startLineCenterRef.current = startLineCenter;
  }, [startLineCenter]);
  useEffect(() => {
    isPlacingStartLineRef.current = isPlacingStartLine;
  }, [isPlacingStartLine]);

  // Calculate course positions when parameters change
  const calculateCourse = useCallback(() => {
    if (!startLineCenter) return;

    const result = CoursePositioningService.calculatePositionedCourse({
      startLineCenter,
      windDirection,
      legLengthNm,
      courseType,
    });

    setMarks(result.marks);
    setStartLine(result.startLine);
    setHasChanges(true);
  }, [startLineCenter, windDirection, legLengthNm, courseType]);

  // Recalculate when parameters change
  useEffect(() => {
    if (startLineCenter) {
      calculateCourse();
    }
  }, [calculateCourse]);

  // Callback ref to track when map container is mounted
  const mapContainerCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      (mapContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      setMapContainerReady(true);
    } else {
      setMapContainerReady(false);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isWeb || !visible || !mapContainerReady || !mapContainerRef.current || mapRef.current || isMapInitializingRef.current) {
      return;
    }

    // Set flag BEFORE calling async function to prevent race condition
    isMapInitializingRef.current = true;

    const initMap = async () => {
      try {
        const maplibregl = await import('maplibre-gl');
        await import('maplibre-gl/dist/maplibre-gl.css');

        maplibreRef.current = maplibregl.default;

        const center = startLineCenter || initialLocation || { lng: 114.16, lat: 22.28 };

        const map = new maplibregl.default.Map({
          container: mapContainerRef.current!,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: [center.lng, center.lat],
          zoom: 13,
        });

        // Set mapRef immediately to prevent duplicate initialization attempts
        mapRef.current = map;

        map.addControl(new maplibregl.default.NavigationControl(), 'top-left');

        // Error handler for tile loading issues
        map.on('error', (e: any) => {
          const errorMsg = e.error?.message || e.message || 'Unknown error';
          logger.warn('Map error event:', errorMsg);
          // Set error state for critical style/source errors
          if (errorMsg.includes('style') || errorMsg.includes('404')) {
            setMapError('Failed to load map tiles. Please check your connection.');
          }
        });

        // Handle source data errors (tile loading failures)
        map.on('sourcedataloading', (e: any) => {
          if (e.isSourceLoaded === false && e.source?.type === 'raster') {
            logger.debug('Loading raster tiles...');
          }
        });

        // Idle event confirms all tiles are loaded
        map.once('idle', () => {
          logger.info('Map idle - all tiles loaded successfully');
          setMapError(null); // Clear any previous errors on successful load
        });

        // Click handler for placing start line
        map.on('click', (e: any) => {
          if (isPlacingStartLineRef.current) {
            const { lng, lat } = e.lngLat;
            setStartLineCenter({ lat, lng });
            setIsPlacingStartLine(false);

            // Center on the clicked location
            map.flyTo({
              center: [lng, lat],
              zoom: 14,
              duration: 500,
            });
          }
        });

        map.on('load', () => {
          isMapInitializingRef.current = false;
          setMapLoaded(true);

          // Course line removed per user feedback - only show start line and marks

          // Add start line source
          map.addSource('start-line', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [],
              },
            },
          });

          map.addLayer({
            id: 'start-line-layer',
            type: 'line',
            source: 'start-line',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#22c55e',
              'line-width': 4,
            },
          });

          // Set cursor for placing start line
          if (!startLineCenter) {
            const canvas = map.getCanvasContainer();
            if (canvas) {
              canvas.style.cursor = 'crosshair';
            }
          }
        });
      } catch (error) {
        logger.error('Failed to initialize map:', error);
        isMapInitializingRef.current = false;
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      isMapInitializingRef.current = false;
      setMapLoaded(false);
    };
  }, [visible, initialLocation, mapContainerReady]);

  // Update markers when marks change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !maplibreRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch {
        // Marker already removed
      }
    });
    markersRef.current = [];

    // Add markers for each mark
    marks.forEach((mark, index) => {
      const color = MARK_COLORS[mark.type] || '#64748b';

      const el = document.createElement('div');
      el.className = 'course-mark-marker';
      el.style.cssText = `
        width: 28px;
        height: 28px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: move;
        z-index: 1000;
      `;

      // Mark label
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
                  : (index + 1).toString();
      el.textContent = label;
      el.title = `${mark.name}${mark.isUserAdjusted ? ' (adjusted)' : ''}`;

      const marker = new maplibreRef.current.Marker({
        element: el,
        draggable: true,
        offset: [-14, -14],
      })
        .setLngLat([mark.longitude, mark.latitude])
        .addTo(mapRef.current);

      // Handle drag to update mark position
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setMarks((current) =>
          CoursePositioningService.updateMarkPosition(current, mark.id, {
            lat: lngLat.lat,
            lng: lngLat.lng,
          })
        );
        setHasChanges(true);
      });

      markersRef.current.push(marker);
    });

    // Course line removed per user feedback - only show start line
  }, [marks, mapLoaded]);

  // Update start line on map
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !startLine) return;

    const startLineSource = mapRef.current.getSource('start-line');
    if (startLineSource) {
      startLineSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [startLine.pin.lng, startLine.pin.lat],
            [startLine.committee.lng, startLine.committee.lat],
          ],
        },
      });
    }

    // Add/update start line endpoint markers
    if (startLineRef.current) {
      startLineRef.current.forEach((m: any) => m.remove());
    }
    startLineRef.current = [];

    // Pin end marker
    const pinEl = document.createElement('div');
    pinEl.style.cssText = `
      width: 20px;
      height: 20px;
      background: #f97316;
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    pinEl.textContent = 'P';
    pinEl.title = 'Pin End';

    const pinMarker = new maplibreRef.current.Marker({
      element: pinEl,
      offset: [-10, -10],
    })
      .setLngLat([startLine.pin.lng, startLine.pin.lat])
      .addTo(mapRef.current);
    startLineRef.current.push(pinMarker);

    // Committee boat marker
    const cbEl = document.createElement('div');
    cbEl.style.cssText = `
      width: 20px;
      height: 20px;
      background: #3b82f6;
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    cbEl.textContent = 'C';
    cbEl.title = 'Committee Boat';

    const cbMarker = new maplibreRef.current.Marker({
      element: cbEl,
      offset: [-10, -10],
    })
      .setLngLat([startLine.committee.lng, startLine.committee.lat])
      .addTo(mapRef.current);
    startLineRef.current.push(cbMarker);
  }, [startLine, mapLoaded]);

  // Update cursor when placing mode changes
  useEffect(() => {
    if (!mapRef.current) return;
    const canvas = mapRef.current.getCanvasContainer();
    if (canvas) {
      canvas.style.cursor = isPlacingStartLine ? 'crosshair' : 'grab';
    }
  }, [isPlacingStartLine]);

  // Handle course type change
  const handleCourseTypeChange = useCallback((type: CourseType) => {
    setCourseType(type);
    setLegLengthNm(COURSE_TEMPLATES[type].defaultLegLengthNm);
  }, []);

  // Handle wind direction change with recalculation
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

        // Recalculate start line
        const newStartLine = CoursePositioningService.calculateStartLine(
          startLineCenter,
          direction
        );
        setStartLine(newStartLine);
      }
      setWindDirection(direction);
      setHasChanges(true);
    },
    [startLineCenter, marks, windDirection, legLengthNm, courseType]
  );

  // Handle leg length change with recalculation
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
    },
    [startLineCenter, marks, windDirection, legLengthNm, courseType]
  );

  // Reset to template defaults
  const handleReset = useCallback(() => {
    if (startLineCenter) {
      const template = COURSE_TEMPLATES[courseType];
      setLegLengthNm(template.defaultLegLengthNm);
      calculateCourse();
    }
  }, [startLineCenter, courseType, calculateCourse]);

  // Re-place start line
  const handleReplaceStartLine = useCallback(() => {
    setIsPlacingStartLine(true);
    setMarks([]);
    setStartLine(null);
    setStartLineCenter(null);
    if (mapRef.current) {
      const canvas = mapRef.current.getCanvasContainer();
      if (canvas) {
        canvas.style.cursor = 'crosshair';
      }
    }
  }, []);

  // Save positioned course
  const handleSave = async () => {
    if (!startLineCenter || !startLine || marks.length === 0) {
      Alert.alert('Error', 'Please position the course before saving.');
      return;
    }

    try {
      setSaving(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save.');
        return;
      }

      const hasManualAdjustments = marks.some((m) => m.isUserAdjusted);

      const courseData = {
        regatta_id: regattaId,
        source_document_id: sourceDocumentId || null,
        user_id: user.id,
        course_type: courseType,
        wind_direction: windDirection,
        leg_length_nm: legLengthNm,
        start_pin_lat: startLine.pin.lat,
        start_pin_lng: startLine.pin.lng,
        start_committee_lat: startLine.committee.lat,
        start_committee_lng: startLine.committee.lng,
        marks: marks,
        has_manual_adjustments: hasManualAdjustments,
      };

      const { data, error } = await supabase
        .from('race_positioned_courses')
        .insert(courseData)
        .select()
        .single();

      if (error) throw error;

      const positionedCourse: PositionedCourse = {
        id: data.id,
        regattaId,
        sourceDocumentId,
        userId: user.id,
        courseType,
        marks,
        startLine,
        windDirection,
        legLengthNm,
        hasManualAdjustments,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      onSave(positionedCourse);
    } catch (error: any) {
      logger.error('Failed to save positioned course:', error);
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

  if (!isWeb) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={handleCancel}>
        <View className="flex-1 bg-white items-center justify-center p-6">
          <MapPin size={48} color="#9333ea" />
          <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
            Course Position Editor
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            Course positioning is available on web only.
          </Text>
          <Pressable
            onPress={onCancel}
            className="mt-6 px-6 py-3 bg-gray-100 rounded-lg"
          >
            <Text className="text-gray-700 font-medium">Close</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleCancel}>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={handleCancel} className="p-2 -ml-2">
              <X size={24} color="#64748b" />
            </Pressable>
            <View>
              <Text className="text-lg font-bold text-gray-900">
                Position Course on Map
              </Text>
              <Text className="text-xs text-gray-500">
                {isPlacingStartLine
                  ? 'Click on map to place start line'
                  : 'Adjust wind, leg length, and drag marks'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving || !startLineCenter || marks.length === 0}
            className={`flex-row items-center gap-2 px-4 py-2 rounded-lg ${
              saving || !startLineCenter || marks.length === 0
                ? 'bg-gray-200'
                : 'bg-blue-600'
            }`}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Save size={18} color={!startLineCenter || marks.length === 0 ? '#9ca3af' : '#fff'} />
                <Text
                  className={`font-semibold ${
                    !startLineCenter || marks.length === 0 ? 'text-gray-400' : 'text-white'
                  }`}
                >
                  Save Course
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Main Content */}
        <View className="flex-1 flex-row">
          {/* Map */}
          <View className="flex-1">
            <div
              ref={mapContainerCallbackRef}
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            />

            {/* Map Error Overlay */}
            {mapError && (
              <View
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  right: 16,
                }}
                className="bg-red-50 rounded-lg p-3 shadow-lg border border-red-200"
              >
                <View className="flex-row items-center gap-2">
                  <X size={20} color="#dc2626" />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-red-700">
                      Map Loading Error
                    </Text>
                    <Text className="text-xs text-red-600">
                      {mapError}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Placement Instructions Overlay */}
            {isPlacingStartLine && !mapError && (
              <View
                style={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  transform: [{ translateX: -150 }],
                  width: 300,
                }}
                className="bg-white/95 rounded-lg p-3 shadow-lg border border-orange-200"
              >
                <View className="flex-row items-center gap-2">
                  <Target size={20} color="#f97316" />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-orange-700">
                      Click to Place Start Line
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Click on the map where the start line center should be
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Course Info Overlay */}
            {startLineCenter && !isPlacingStartLine && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                }}
                className="bg-white/95 rounded-lg p-3 shadow-lg border border-gray-200"
              >
                <Text className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Course Summary
                </Text>
                <View className="flex-row gap-4">
                  <View className="flex-row items-center gap-1">
                    <Navigation size={14} color="#6366f1" />
                    <Text className="text-sm text-gray-700">
                      Wind: {windDirection}°
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Anchor size={14} color="#22c55e" />
                    <Text className="text-sm text-gray-700">
                      Leg: {legLengthNm}nm
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Flag size={14} color="#f97316" />
                    <Text className="text-sm text-gray-700">
                      {marks.length} marks
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Controls Panel */}
          <ScrollView
            className="w-80 bg-white border-l border-gray-200"
            showsVerticalScrollIndicator={false}
          >
            <View className="p-4">
              {/* Editor Controls */}
              <EditorControls
                windDirection={windDirection}
                onWindDirectionChange={handleWindDirectionChange}
                legLengthNm={legLengthNm}
                onLegLengthChange={handleLegLengthChange}
                courseType={courseType}
                onCourseTypeChange={handleCourseTypeChange}
                onReset={handleReset}
              />

              {/* Re-place Start Line Button */}
              {startLineCenter && (
                <Pressable
                  onPress={handleReplaceStartLine}
                  className="mt-4 flex-row items-center justify-center gap-2 py-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <Target size={16} color="#f97316" />
                  <Text className="text-sm font-medium text-orange-700">
                    Re-place Start Line
                  </Text>
                </Pressable>
              )}

              {/* Mark Legend */}
              {marks.length > 0 && (
                <View className="mt-4 bg-gray-50 rounded-lg p-3">
                  <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Course Marks
                  </Text>
                  {marks.map((mark, index) => (
                    <View
                      key={mark.id}
                      className="flex-row items-center gap-2 py-1"
                    >
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: MARK_COLORS[mark.type] || '#64748b',
                        }}
                      />
                      <Text className="text-sm text-gray-700 flex-1">
                        {mark.name}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {mark.rounding === 'port' ? '←' : '→'}
                      </Text>
                      {mark.isUserAdjusted && (
                        <Text className="text-xs text-orange-500">edited</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Start Line Info */}
              {startLine && (
                <View className="mt-4 bg-green-50 rounded-lg p-3">
                  <Text className="text-xs font-semibold text-green-700 uppercase mb-2">
                    Start Line
                  </Text>
                  <View className="flex-row items-center gap-2 py-1">
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: '#f97316',
                      }}
                    />
                    <Text className="text-sm text-gray-700">
                      Pin End: {startLine.pin.lat.toFixed(5)}, {startLine.pin.lng.toFixed(5)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2 py-1">
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: '#3b82f6',
                      }}
                    />
                    <Text className="text-sm text-gray-700">
                      Committee: {startLine.committee.lat.toFixed(5)}, {startLine.committee.lng.toFixed(5)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Instructions */}
              <View className="mt-4 bg-blue-50 rounded-lg p-3">
                <Text className="text-xs font-semibold text-blue-700 uppercase mb-1">
                  Instructions
                </Text>
                <Text className="text-xs text-blue-600 leading-relaxed">
                  1. Place start line center on map{'\n'}
                  2. Adjust wind direction and leg length{'\n'}
                  3. Drag marks to fine-tune positions{'\n'}
                  4. Save when satisfied
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default CoursePositionEditor;
