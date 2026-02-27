/**
 * CourseMapPreview - Compact preview of a positioned course
 *
 * Shows a small map with the course overlay and basic info.
 * Used in race details, strategy screens, and course lists.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Anchor, Edit2, MapPin, Wind } from 'lucide-react-native';
import type { PositionedCourse } from '@/types/courses';
import { COURSE_TEMPLATES } from '@/services/CoursePositioningService';
import { createLogger } from '@/lib/utils/logger';
import { ensureMapLibreCss, ensureMapLibreScript } from '@/lib/maplibreWeb';

const isWeb = Platform.OS === 'web';
const logger = createLogger('CourseMapPreview');

// Mark colors by type
const MARK_COLORS: Record<string, string> = {
  windward: '#eab308',
  leeward: '#ef4444',
  gate: '#f97316',
  wing: '#22c55e',
  offset: '#3b82f6',
};

const MAP_STYLE = {
  version: 8,
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
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!isWeb || !mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      let didLoad = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        setLoading(true);
        setMapError(null);
        let maplibregl: any = null;
        try {
          const maplibreModule = await import('maplibre-gl');
          maplibregl = (maplibreModule as any).default || maplibreModule;
          try {
            await import('maplibre-gl/dist/maplibre-gl.css');
          } catch (_cssError) {
            ensureMapLibreCss('maplibre-gl-css-course-map-preview');
          }
        } catch (_moduleError) {
          ensureMapLibreCss('maplibre-gl-css-course-map-preview');
          await ensureMapLibreScript('maplibre-gl-script-course-map-preview');
          maplibregl = typeof window !== 'undefined' ? (window as any).maplibregl : null;
        }
        const MapConstructor = maplibregl?.Map;
        const Marker = maplibregl?.Marker;
        const LngLatBounds = maplibregl?.LngLatBounds;
        if (!MapConstructor || !Marker || !LngLatBounds) {
          throw new Error('MapLibre constructors are unavailable');
        }

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

        const map = new MapConstructor({
          container: mapContainerRef.current!,
          style: MAP_STYLE,
          center: [centerLng, centerLat],
          zoom: 13,
          interactive: !compact, // Disable interaction in compact mode
          attributionControl: false,
        });

        timeoutId = setTimeout(() => {
          if (!didLoad && !cancelled) {
            setMapError('Map timed out while loading. Course details remain available below.');
            setLoading(false);
          }
        }, 8000);

        map.on('load', () => {
          didLoad = true;
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          if (cancelled) return;
          mapRef.current = map;
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

            new Marker({
              element: el,
              offset: [-(size / 2), -(size / 2)],
            })
              .setLngLat([mark.longitude, mark.latitude])
              .addTo(map);
          });

          // Fit bounds to show entire course
          const bounds = new LngLatBounds();
          course.marks.forEach((m) => bounds.extend([m.longitude, m.latitude]));
          bounds.extend([course.startLine.pin.lng, course.startLine.pin.lat]);
          bounds.extend([course.startLine.committee.lng, course.startLine.committee.lat]);

          map.fitBounds(bounds, {
            padding: compact ? 20 : 40,
            maxZoom: 15,
          });
        });

        map.on('error', () => {
          if (cancelled) return;
          setMapError('Unable to render map in this browser. Course summary is still available.');
          setLoading(false);
        });
      } catch (error) {
        logger.error('Failed to initialize preview map', error);
        if (!cancelled) {
          setMapError(
            `Map failed to initialize: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
        setLoading(false);
      } finally {
        if (timeoutId && didLoad) {
          clearTimeout(timeoutId);
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
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

        {!!mapError && (
          <View
            style={{
              position: 'absolute',
              left: 8,
              right: 8,
              bottom: 8,
              backgroundColor: 'rgba(248, 250, 252, 0.95)',
              borderWidth: 1,
              borderColor: '#CBD5E1',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 10,
            }}
          >
            <Text className="text-xs font-semibold text-slate-800">Map unavailable</Text>
            <Text className="text-xs text-slate-600 mt-1">{mapError}</Text>
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
