/**
 * CourseMapPreview - Compact preview of a positioned course
 *
 * Shows a small map with the course overlay and basic info.
 * Used in race details, strategy screens, and course lists.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Anchor, Edit2, MapPin, Navigation, Wind } from 'lucide-react-native';
import type { PositionedCourse } from '@/types/courses';
import { COURSE_TEMPLATES } from '@/services/CoursePositioningService';

const isWeb = Platform.OS === 'web';

// Mark colors by type
const MARK_COLORS: Record<string, string> = {
  windward: '#eab308',
  leeward: '#ef4444',
  gate: '#f97316',
  wing: '#22c55e',
  offset: '#3b82f6',
};

interface CourseMapPreviewProps {
  course: PositionedCourse;
  onEdit?: () => void;
  height?: number;
  showControls?: boolean;
  compact?: boolean;
}

export function CourseMapPreview({
  course,
  onEdit,
  height = 200,
  showControls = true,
  compact = false,
}: CourseMapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!isWeb || !mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      try {
        setLoading(true);
        const maplibregl = await import('maplibre-gl');
        await import('maplibre-gl/dist/maplibre-gl.css');

        // Calculate center from marks and start line
        const allLats = [
          ...course.marks.map((m) => m.latitude),
          course.startLine.pin.lat,
          course.startLine.committee.lat,
        ];
        const allLngs = [
          ...course.marks.map((m) => m.longitude),
          course.startLine.pin.lng,
          course.startLine.committee.lng,
        ];

        const centerLat = (Math.min(...allLats) + Math.max(...allLats)) / 2;
        const centerLng = (Math.min(...allLngs) + Math.max(...allLngs)) / 2;

        const map = new maplibregl.default.Map({
          container: mapContainerRef.current!,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: [centerLng, centerLat],
          zoom: 13,
          interactive: !compact, // Disable interaction in compact mode
          attributionControl: false,
        });

        map.on('load', () => {
          mapRef.current = map;
          setMapLoaded(true);
          setLoading(false);

          // Add course line
          map.addSource('preview-course-line', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: course.marks
                  .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
                  .map((m) => [m.longitude, m.latitude]),
              },
            },
          });

          map.addLayer({
            id: 'preview-course-line-layer',
            type: 'line',
            source: 'preview-course-line',
            paint: {
              'line-color': '#f97316',
              'line-width': compact ? 1.5 : 2,
              'line-dasharray': [3, 2],
            },
          });

          // Add start line
          map.addSource('preview-start-line', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [course.startLine.pin.lng, course.startLine.pin.lat],
                  [course.startLine.committee.lng, course.startLine.committee.lat],
                ],
              },
            },
          });

          map.addLayer({
            id: 'preview-start-line-layer',
            type: 'line',
            source: 'preview-start-line',
            paint: {
              'line-color': '#22c55e',
              'line-width': compact ? 2 : 3,
            },
          });

          // Add mark markers
          course.marks.forEach((mark, index) => {
            const color = MARK_COLORS[mark.type] || '#64748b';
            const size = compact ? 14 : 20;

            const el = document.createElement('div');
            el.style.cssText = `
              width: ${size}px;
              height: ${size}px;
              background: ${color};
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${compact ? 7 : 9}px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
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
                      : (index + 1).toString();
            el.textContent = label;

            new maplibregl.default.Marker({
              element: el,
              offset: [-(size / 2), -(size / 2)],
            })
              .setLngLat([mark.longitude, mark.latitude])
              .addTo(map);
          });

          // Fit bounds to show entire course
          const bounds = new maplibregl.default.LngLatBounds();
          course.marks.forEach((m) => bounds.extend([m.longitude, m.latitude]));
          bounds.extend([course.startLine.pin.lng, course.startLine.pin.lat]);
          bounds.extend([course.startLine.committee.lng, course.startLine.committee.lat]);

          map.fitBounds(bounds, {
            padding: compact ? 20 : 40,
            maxZoom: 15,
          });
        });
      } catch (error) {
        console.error('Failed to initialize preview map:', error);
        setLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapLoaded(false);
    };
  }, [course, compact]);

  const template = COURSE_TEMPLATES[course.courseType];

  if (!isWeb) {
    return (
      <View
        className="bg-gray-100 rounded-lg items-center justify-center"
        style={{ height }}
      >
        <MapPin size={24} color="#9333ea" />
        <Text className="text-gray-500 text-sm mt-2">
          Course preview available on web
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-lg overflow-hidden border border-gray-200">
      {/* Map Container */}
      <View style={{ position: 'relative', height }}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        {/* Loading Overlay */}
        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(248, 250, 252, 0.9)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="small" color="#6366f1" />
            <Text className="text-xs text-gray-500 mt-2">Loading map...</Text>
          </View>
        )}

        {/* Edit Button Overlay */}
        {onEdit && !compact && (
          <Pressable
            onPress={onEdit}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
            }}
            className="bg-white/90 p-2 rounded-lg shadow-sm border border-gray-200 flex-row items-center gap-1"
          >
            <Edit2 size={14} color="#6366f1" />
            <Text className="text-xs font-medium text-indigo-600">Edit</Text>
          </Pressable>
        )}
      </View>

      {/* Info Bar */}
      {showControls && !compact && (
        <View className="bg-gray-50 px-3 py-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color="#6366f1" />
              <Text className="text-xs text-gray-600">{template?.name || course.courseType}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Wind size={12} color="#22c55e" />
              <Text className="text-xs text-gray-600">{course.windDirection}°</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Anchor size={12} color="#f97316" />
              <Text className="text-xs text-gray-600">{course.legLengthNm}nm</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1">
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: course.hasManualAdjustments ? '#f97316' : '#22c55e',
              }}
            />
            <Text className="text-xs text-gray-400">
              {course.hasManualAdjustments ? 'Adjusted' : 'Template'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default CourseMapPreview;
