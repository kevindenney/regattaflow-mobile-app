import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { RaceCourse, Mark } from '../RaceBuilder';
import { createLogger } from '@/lib/utils/logger';
import { ensureMapLibreCss, ensureMapLibreScript } from '@/lib/maplibreWeb';

const MAP_STYLE_CANDIDATES = [
  {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
  'https://demotiles.maplibre.org/style.json',
] as const;

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
  const windLayerEnabled = Boolean(layers.wind);
  const currentLayerEnabled = Boolean(layers.current);
  const depthLayerEnabled = Boolean(layers.depth);
  const tacticalLayerEnabled = Boolean(layers.tactical);
  const maplibreRef = useRef<any>(null);
  const mapContainer = useRef<any>(null);
  const map = useRef<any>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRunIdRef = useRef(0);
  const styleIndexRef = useRef(0);
  const mapHasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      initRunIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || map.current || !mapContainer.current) return;
    const runId = ++initRunIdRef.current;
    styleIndexRef.current = 0;
    const isCancelled = () => !isMountedRef.current || initRunIdRef.current !== runId;

    const initialize = async () => {
      try {
        try {
          const maplibreModule = await import('maplibre-gl');
          maplibreRef.current = (maplibreModule as any).default || maplibreModule;
        } catch (_moduleError) {
          ensureMapLibreCss('maplibre-gl-css-course-map');
          await ensureMapLibreScript('maplibre-gl-script-course-map');
          maplibreRef.current = typeof window !== 'undefined' ? (window as any).maplibregl : null;
        }

        try {
          await import('maplibre-gl/dist/maplibre-gl.css');
        } catch {
          ensureMapLibreCss('maplibre-gl-css-course-map');
        }

        const MapConstructor = maplibreRef.current?.Map;
        const NavigationControl = maplibreRef.current?.NavigationControl;
        const ScaleControl = maplibreRef.current?.ScaleControl;
        if (!MapConstructor || !NavigationControl || !ScaleControl) {
          logger.error('MapLibre constructors are unavailable for CourseMap');
          return;
        }

        map.current = new MapConstructor({
          container: mapContainer.current,
          style: MAP_STYLE_CANDIDATES[styleIndexRef.current],
          center: venueCoordinates,
          zoom: 13,
          pitch: 0,
          bearing: 0
        });

        map.current.addControl(new NavigationControl(), 'top-right');
        map.current.addControl(new ScaleControl({
          maxWidth: 200,
          unit: 'nautical'
        }), 'bottom-left');

        loadTimeoutRef.current = setTimeout(() => {
          if (isCancelled()) return;
          setMapLoaded(false);
        }, 10000);

        map.current.on('load', () => {
          if (isCancelled()) return;
          mapHasLoadedRef.current = true;
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
          setMapLoaded(true);
        });

        map.current.on('error', (_e: any) => {
          if (isCancelled()) return;
          const nextStyleIndex = styleIndexRef.current + 1;
          if (!mapHasLoadedRef.current && nextStyleIndex < MAP_STYLE_CANDIDATES.length) {
            styleIndexRef.current = nextStyleIndex;
            try {
              map.current?.setStyle(MAP_STYLE_CANDIDATES[nextStyleIndex] as any);
              return;
            } catch (err) {
              logger.warn('Failed to switch fallback map style in CourseMap', err);
            }
          }
        });
      } catch (err) {
        logger.error('CourseMap initialization failed', err);
      }
    };

    void initialize();

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      mapHasLoadedRef.current = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [venueCoordinates]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    if (windLayerEnabled) addWindLayer();
    if (currentLayerEnabled) addCurrentLayer();
    if (depthLayerEnabled) addDepthLayer();
    if (tacticalLayerEnabled) addTacticalLayer();
  }, [currentLayerEnabled, depthLayerEnabled, mapLoaded, tacticalLayerEnabled, windLayerEnabled]);

  const createMarkElement = useCallback((mark: Mark) => {
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
  }, [isEditable]);

  const drawCourseLines = useCallback(() => {
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
  }, [course]);

  // Update marks on the map
  useEffect(() => {
    if (!mapLoaded || !map.current || !course) return;
    const MarkerConstructor = maplibreRef.current?.Marker;
    if (!MarkerConstructor) {
      logger.error('MapLibre Marker constructor is unavailable for CourseMap');
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add new markers
    course.marks.forEach((mark) => {
      const el = createMarkElement(mark);

      const marker = new MarkerConstructor({
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

  }, [course, createMarkElement, drawCourseLines, isEditable, mapLoaded, onMarkMove]);

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
        <Text style={styles.nativePlaceholderTitle}>Course Map Preview</Text>
        <Text style={styles.nativePlaceholderBody}>
          {course
            ? `${course.marks.length} marks loaded. Use web map editing for drag/drop placement.`
            : 'Add marks to preview course details.'}
        </Text>
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
    paddingHorizontal: 20,
  },
  nativePlaceholderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  nativePlaceholderBody: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
});
