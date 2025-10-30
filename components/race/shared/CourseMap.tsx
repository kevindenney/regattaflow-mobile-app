import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { RaceCourse, Mark } from '../RaceBuilder';
import { createLogger } from '@/lib/utils/logger';

// MapLibre GL JS for web, placeholder for native
let maplibregl: any = null;
if (Platform.OS === 'web') {
  maplibregl = require('maplibre-gl');
  require('maplibre-gl/dist/maplibre-gl.css');
}

export interface CourseMapProps {
  course: RaceCourse | null;
  onMarkMove?: (markId: string, coordinates: [number, number]) => void;
  isEditable?: boolean;
  layers?: {
    wind?: boolean;
    current?: boolean;
    depth?: boolean;
    tactical?: boolean;
  };
  venueCoordinates?: [number, number];
}

const logger = createLogger('CourseMap');
export function CourseMap({
  course,
  onMarkMove,
  isEditable = false,
  layers = {},
  venueCoordinates = [114.19, 22.285] // Default: Hong Kong waters
}: CourseMapProps) {
  const mapContainer = useRef<any>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !maplibregl || map.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          },
          // Add nautical chart source when available
          'nautical': {
            type: 'raster',
            tiles: [
              // Placeholder for nautical chart tiles
            ],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: venueCoordinates,
      zoom: 13,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add scale control
    map.current.addControl(new maplibregl.ScaleControl({
      maxWidth: 200,
      unit: 'nautical'
    }), 'bottom-left');

    map.current.on('load', () => {
      setMapLoaded(true);

      // Add wind layer if enabled
      if (layers.wind) {
        addWindLayer();
      }

      // Add current layer if enabled
      if (layers.current) {
        addCurrentLayer();
      }

      // Add depth layer if enabled
      if (layers.depth) {
        addDepthLayer();
      }

      // Add tactical layer if enabled
      if (layers.tactical) {
        addTacticalLayer();
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update marks on the map
  useEffect(() => {
    if (!mapLoaded || !map.current || !course) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add new markers
    course.marks.forEach((mark) => {
      const el = createMarkElement(mark);

      const marker = new maplibregl.Marker({
        element: el,
        draggable: isEditable
      })
        .setLngLat(mark.coordinates)
        .addTo(map.current);

      if (isEditable) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onMarkMove?.(mark.id, [lngLat.lng, lngLat.lat]);
        });
      }

      markersRef.current.set(mark.id, marker);
    });

    // Draw course lines
    drawCourseLines();

  }, [course, mapLoaded, isEditable]);

  const createMarkElement = (mark: Mark) => {
    const el = document.createElement('div');
    el.className = 'course-mark';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid white';
    el.style.cursor = isEditable ? 'move' : 'pointer';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontWeight = 'bold';
    el.style.fontSize = '16px';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

    // Set color and icon based on mark type
    switch (mark.type) {
      case 'start':
        el.style.backgroundColor = '#22C55E';
        el.innerHTML = '🚦';
        break;
      case 'windward':
        el.style.backgroundColor = '#EF4444';
        el.innerHTML = '⬆️';
        break;
      case 'leeward':
        el.style.backgroundColor = '#3B82F6';
        el.innerHTML = '⬇️';
        break;
      case 'gate':
        el.style.backgroundColor = '#EC4899';
        el.innerHTML = '🚪';
        break;
      case 'finish':
        el.style.backgroundColor = '#8B5CF6';
        el.innerHTML = '🏁';
        break;
      case 'reaching':
        el.style.backgroundColor = '#F59E0B';
        el.innerHTML = '➡️';
        break;
      default:
        el.style.backgroundColor = '#6B7280';
        el.innerHTML = '📍';
    }

    // Add label
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.bottom = '-20px';
    label.style.left = '50%';
    label.style.transform = 'translateX(-50%)';
    label.style.backgroundColor = 'rgba(0,0,0,0.7)';
    label.style.color = 'white';
    label.style.padding = '2px 6px';
    label.style.borderRadius = '4px';
    label.style.fontSize = '11px';
    label.style.whiteSpace = 'nowrap';
    label.textContent = mark.name;
    el.appendChild(label);

    return el;
  };

  const drawCourseLines = () => {
    if (!course || !map.current) return;

    // Remove existing course lines
    if (map.current.getSource('course-lines')) {
      map.current.removeLayer('course-lines');
      map.current.removeSource('course-lines');
    }

    if (course.sequence.length < 2) return;

    // Create line coordinates from sequence
    const coordinates: [number, number][] = [];
    course.sequence.forEach(markRef => {
      const mark = course.marks.find(m =>
        m.id === markRef ||
        m.name.toLowerCase().includes(markRef.toLowerCase())
      );
      if (mark) {
        coordinates.push(mark.coordinates);
      }
    });

    if (coordinates.length < 2) return;

    // Add course line
    map.current.addSource('course-lines', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    });

    map.current.addLayer({
      id: 'course-lines',
      type: 'line',
      source: 'course-lines',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#0066CC',
        'line-width': 3,
        'line-dasharray': [2, 1]
      }
    });
  };

  const addWindLayer = () => {
    // Placeholder for wind visualization
    // In production, this would fetch real wind data
    logger.debug('Wind layer would be added here');
  };

  const addCurrentLayer = () => {
    // Placeholder for current visualization
    logger.debug('Current layer would be added here');
  };

  const addDepthLayer = () => {
    // Placeholder for depth contours
    logger.debug('Depth layer would be added here');
  };

  const addTacticalLayer = () => {
    // Placeholder for tactical zones (laylines, favored sides)
    logger.debug('Tactical layer would be added here');
  };

  // Native placeholder
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.nativePlaceholder}>
        {/* Native map implementation would go here */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  nativePlaceholder: {
    flex: 1,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
});