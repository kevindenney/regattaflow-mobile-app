/**
 * PositionedCourseLayer - Renders a positioned course overlay on MapLibre
 *
 * Displays:
 * - Course line connecting marks (dashed orange)
 * - Start line (solid green)
 * - Mark icons with colors by type
 * - Wind direction indicator
 * - Rounding direction arrows
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import type { PositionedCourse, PositionedMark, StartLinePosition } from '@/types/courses';
import { CoursePositioningService } from '@/services/CoursePositioningService';

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

interface PositionedCourseLayerProps {
  map: any; // MapLibre map instance
  maplibre: any; // MapLibre module reference
  course: PositionedCourse;
  isEditable?: boolean;
  onMarkDrag?: (markId: string, newPosition: { lat: number; lng: number }) => void;
  showWindIndicator?: boolean;
  showLabels?: boolean;
}

export function PositionedCourseLayer({
  map,
  maplibre,
  course,
  isEditable = false,
  onMarkDrag,
  showWindIndicator = true,
  showLabels = true,
}: PositionedCourseLayerProps) {
  const markersRef = useRef<any[]>([]);
  const startLineMarkersRef = useRef<any[]>([]);
  const windIndicatorRef = useRef<any>(null);
  const sourcesAddedRef = useRef(false);

  // Initialize sources and layers
  useEffect(() => {
    if (!map || !isWeb || sourcesAddedRef.current) return;

    // Add course line source and layer
    if (!map.getSource('positioned-course-line')) {
      map.addSource('positioned-course-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        },
      });

      map.addLayer({
        id: 'positioned-course-line-layer',
        type: 'line',
        source: 'positioned-course-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#f97316',
          'line-width': 2,
          'line-dasharray': [3, 2],
          'line-opacity': 0.8,
        },
      });
    }

    // Add start line source and layer
    if (!map.getSource('positioned-start-line')) {
      map.addSource('positioned-start-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        },
      });

      map.addLayer({
        id: 'positioned-start-line-layer',
        type: 'line',
        source: 'positioned-start-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#22c55e',
          'line-width': 4,
          'line-opacity': 0.9,
        },
      });
    }

    sourcesAddedRef.current = true;

    return () => {
      // Cleanup on unmount
      try {
        if (map.getLayer('positioned-course-line-layer')) {
          map.removeLayer('positioned-course-line-layer');
        }
        if (map.getSource('positioned-course-line')) {
          map.removeSource('positioned-course-line');
        }
        if (map.getLayer('positioned-start-line-layer')) {
          map.removeLayer('positioned-start-line-layer');
        }
        if (map.getSource('positioned-start-line')) {
          map.removeSource('positioned-start-line');
        }
      } catch {
        // Layers/sources already removed
      }
      sourcesAddedRef.current = false;
    };
  }, [map]);

  // Update course line
  useEffect(() => {
    if (!map || !course.marks.length) return;

    const source = map.getSource('positioned-course-line');
    if (source) {
      const coordinates = course.marks
        .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
        .map((m) => [m.longitude, m.latitude]);

      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      });
    }
  }, [map, course.marks]);

  // Update start line
  useEffect(() => {
    if (!map || !course.startLine) return;

    const source = map.getSource('positioned-start-line');
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [course.startLine.pin.lng, course.startLine.pin.lat],
            [course.startLine.committee.lng, course.startLine.committee.lat],
          ],
        },
      });
    }
  }, [map, course.startLine]);

  // Create mark markers
  useEffect(() => {
    if (!map || !maplibre || !course.marks.length) return;

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
    course.marks.forEach((mark, index) => {
      const color = MARK_COLORS[mark.type] || '#64748b';

      const el = document.createElement('div');
      el.className = 'positioned-course-mark';
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 9px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: ${isEditable ? 'move' : 'pointer'};
        z-index: 1000;
      `;

      // Mark label
      const label = getMarkLabel(mark, index);
      el.textContent = label;
      el.title = buildMarkTooltip(mark);

      const marker = new maplibre.Marker({
        element: el,
        draggable: isEditable,
        offset: [-12, -12],
      })
        .setLngLat([mark.longitude, mark.latitude])
        .addTo(map);

      // Handle drag events
      if (isEditable && onMarkDrag) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onMarkDrag(mark.id, { lat: lngLat.lat, lng: lngLat.lng });
        });
      }

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => {
        try {
          marker.remove();
        } catch {
          // Already removed
        }
      });
      markersRef.current = [];
    };
  }, [map, maplibre, course.marks, isEditable, onMarkDrag]);

  // Create start line endpoint markers
  useEffect(() => {
    if (!map || !maplibre || !course.startLine) return;

    // Clear existing markers
    startLineMarkersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch {
        // Already removed
      }
    });
    startLineMarkersRef.current = [];

    // Pin end marker
    const pinEl = document.createElement('div');
    pinEl.style.cssText = `
      width: 16px;
      height: 16px;
      background: #f97316;
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: bold;
      color: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    `;
    pinEl.textContent = 'P';
    pinEl.title = 'Pin End';

    const pinMarker = new maplibre.Marker({
      element: pinEl,
      offset: [-8, -8],
    })
      .setLngLat([course.startLine.pin.lng, course.startLine.pin.lat])
      .addTo(map);
    startLineMarkersRef.current.push(pinMarker);

    // Committee boat marker
    const cbEl = document.createElement('div');
    cbEl.style.cssText = `
      width: 16px;
      height: 16px;
      background: #3b82f6;
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: bold;
      color: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    `;
    cbEl.textContent = 'C';
    cbEl.title = 'Committee Boat';

    const cbMarker = new maplibre.Marker({
      element: cbEl,
      offset: [-8, -8],
    })
      .setLngLat([course.startLine.committee.lng, course.startLine.committee.lat])
      .addTo(map);
    startLineMarkersRef.current.push(cbMarker);

    return () => {
      startLineMarkersRef.current.forEach((marker) => {
        try {
          marker.remove();
        } catch {
          // Already removed
        }
      });
      startLineMarkersRef.current = [];
    };
  }, [map, maplibre, course.startLine]);

  // Create wind direction indicator
  useEffect(() => {
    if (!map || !maplibre || !showWindIndicator || !course.startLine) return;

    // Remove existing indicator
    if (windIndicatorRef.current) {
      try {
        windIndicatorRef.current.remove();
      } catch {
        // Already removed
      }
      windIndicatorRef.current = null;
    }

    // Calculate position for wind indicator (near start line)
    const centerLat = (course.startLine.pin.lat + course.startLine.committee.lat) / 2;
    const centerLng = (course.startLine.pin.lng + course.startLine.committee.lng) / 2;

    const el = document.createElement('div');
    el.style.cssText = `
      width: 40px;
      height: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    `;
    el.innerHTML = `
      <div style="
        transform: rotate(${course.windDirection}deg);
        font-size: 24px;
        line-height: 1;
      ">↑</div>
      <div style="
        font-size: 8px;
        font-weight: bold;
        color: #6366f1;
        background: white;
        padding: 1px 3px;
        border-radius: 2px;
        margin-top: 2px;
      ">${course.windDirection}°</div>
    `;

    const marker = new maplibre.Marker({
      element: el,
      offset: [0, -40],
    })
      .setLngLat([centerLng, centerLat])
      .addTo(map);

    windIndicatorRef.current = marker;

    return () => {
      if (windIndicatorRef.current) {
        try {
          windIndicatorRef.current.remove();
        } catch {
          // Already removed
        }
        windIndicatorRef.current = null;
      }
    };
  }, [map, maplibre, course.windDirection, course.startLine, showWindIndicator]);

  return null; // This component only manipulates the map, no React UI
}

// Helper function to get mark label
function getMarkLabel(mark: PositionedMark, index: number): string {
  switch (mark.type) {
    case 'windward':
      return 'W';
    case 'leeward':
      return 'L';
    case 'gate':
      return 'G';
    case 'wing':
      return 'R';
    case 'offset':
      return 'O';
    case 'start':
      return 'S';
    case 'finish':
      return 'F';
    default:
      return (index + 1).toString();
  }
}

// Helper function to build mark tooltip
function buildMarkTooltip(mark: PositionedMark): string {
  let tooltip = mark.name;
  tooltip += `\nRounding: ${mark.rounding === 'port' ? 'Port (leave to port)' : 'Starboard (leave to starboard)'}`;
  if (mark.isUserAdjusted) {
    tooltip += '\n(Position manually adjusted)';
  }
  return tooltip;
}

export default PositionedCourseLayer;
