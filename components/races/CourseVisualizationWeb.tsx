/**
 * CourseVisualizationWeb Component
 *
 * Web-specific implementation using MapLibre GL JS.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createLogger } from '@/lib/utils/logger';
import { ensureMapLibreCss, ensureMapLibreScript } from '@/lib/maplibreWeb';
import type { CourseGeoJSON, CourseFeature } from '../../types/raceEvents';

interface CourseVisualizationWebProps {
  geoJSON: CourseGeoJSON;
  bounds: any;
  interactive: boolean;
  onMarkPress?: (mark: any) => void;
}

const logger = createLogger('CourseVisualizationWeb');
const MAP_STYLE_CANDIDATES = [
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  'https://demotiles.maplibre.org/style.json',
] as const;

export default function CourseVisualizationWeb({
  geoJSON,
  bounds,
  interactive,
  onMarkPress,
}: CourseVisualizationWebProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const clickHandlerRef = useRef<((e: any) => void) | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const initRunIdRef = useRef(0);
  const styleIndexRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      initRunIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let cancelled = false;
    const runId = ++initRunIdRef.current;
    styleIndexRef.current = 0;
    const isCancelled = () => cancelled || !isMountedRef.current || initRunIdRef.current !== runId;

    const initMap = async () => {
      try {
        if (isCancelled()) return;
        setIsLoading(true);
        setError(null);

        let maplibregl: any = null;
        try {
          const maplibreModule = await import('maplibre-gl');
          maplibregl = (maplibreModule as any).default || maplibreModule;
          try {
            await import('maplibre-gl/dist/maplibre-gl.css');
          } catch (cssError) {
            ensureMapLibreCss('maplibre-gl-css-course-viz');
            logger.warn('MapLibre CSS module import failed; injected stylesheet fallback', cssError);
          }
        } catch (moduleError) {
          logger.warn('MapLibre module import failed; attempting CDN fallback', moduleError);
          ensureMapLibreCss('maplibre-gl-css-course-viz');
          await ensureMapLibreScript('maplibre-gl-script-course-viz');
          if (typeof window !== 'undefined') {
            maplibregl = (window as any).maplibregl || null;
          }
        }

        const MapConstructor = maplibregl?.Map;
        const LngLatBounds = maplibregl?.LngLatBounds;
        if (!MapConstructor || !LngLatBounds) {
          throw new Error('MapLibre constructors are unavailable');
        }

        const map = new MapConstructor({
          container: mapContainerRef.current,
          style: MAP_STYLE_CANDIDATES[styleIndexRef.current],
          center: [114.1694, 22.3193],
          zoom: 12,
          interactive,
          attributionControl: true,
        });

        mapRef.current = map;
        let didLoad = false;
        loadTimeoutRef.current = setTimeout(() => {
          if (didLoad || isCancelled()) return;
          setError('Map unavailable right now.');
          setIsLoading(false);
        }, 8000);

        map.on('load', () => {
          didLoad = true;
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
          if (isCancelled()) return;

          try {
            map.addSource('course-data', {
              type: 'geojson',
              data: geoJSON as any,
            });

            map.addLayer({
              id: 'course-racing-area-fill',
              type: 'fill',
              source: 'course-data',
              filter: [
                'all',
                ['==', ['geometry-type'], 'Polygon'],
                ['==', ['get', 'type'], 'racing_area'],
              ],
              paint: {
                'fill-color': '#0ea5e9',
                'fill-opacity': 0.1,
              },
            });

            map.addLayer({
              id: 'course-lines',
              type: 'line',
              source: 'course-data',
              filter: ['==', ['geometry-type'], 'LineString'],
              paint: {
                'line-color': '#f97316',
                'line-width': 3,
                'line-dasharray': [2, 1],
              },
            });

            map.addLayer({
              id: 'course-mark-circles',
              type: 'circle',
              source: 'course-data',
              filter: ['==', ['geometry-type'], 'Point'],
              paint: {
                'circle-color': '#2563eb',
                'circle-radius': 6,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
              },
            });

            map.addLayer({
              id: 'course-mark-labels',
              type: 'symbol',
              source: 'course-data',
              filter: ['==', ['geometry-type'], 'Point'],
              layout: {
                'text-field': ['coalesce', ['get', 'name'], 'Mark'],
                'text-offset': [0, 1.6],
                'text-size': 11,
                'text-anchor': 'top',
              },
              paint: {
                'text-color': '#0f172a',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1,
              },
            });

            if (interactive && onMarkPress) {
              const clickHandler = (event: any) => {
                const feature = event?.features?.[0];
                if (!feature?.properties) return;
                onMarkPress(feature.properties);
              };
              clickHandlerRef.current = clickHandler;
              map.on('click', 'course-mark-circles', clickHandler);
            }

            const fitted = fitMapBounds(map, LngLatBounds, geoJSON, bounds);
            if (!fitted && geoJSON.features.length > 0) {
              map.flyTo({ center: [114.1694, 22.3193], zoom: 12 });
            }
          } catch (mapErr) {
            logger.error('Failed to render course layers', mapErr);
            setError('Unable to render course map layers.');
          } finally {
            setIsLoading(false);
          }
        });

        map.on('error', (mapError: any) => {
          logger.error('MapLibre runtime error', mapError);
          if (isCancelled()) return;
          if (!didLoad && styleIndexRef.current + 1 < MAP_STYLE_CANDIDATES.length) {
            styleIndexRef.current += 1;
            try {
              map.setStyle(MAP_STYLE_CANDIDATES[styleIndexRef.current] as any);
              return;
            } catch (styleError) {
              logger.warn('Failed to set fallback map style', styleError);
            }
          }
          if (didLoad) {
            // Ignore recoverable runtime tile/source errors once map is visible.
            return;
          }
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
          if (!isCancelled()) {
            setError('Map failed to load in this browser.');
            setIsLoading(false);
          }
        });
      } catch (err) {
        logger.error('Failed to initialize web course map', err);
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        if (!isCancelled()) {
          setError('Map initialization failed.');
          setIsLoading(false);
        }
      }
    };

    void initMap();

    return () => {
      cancelled = true;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (mapRef.current && clickHandlerRef.current) {
        try {
          mapRef.current.off('click', 'course-mark-circles', clickHandlerRef.current);
        } catch (e) {
          logger.warn('Failed to detach click handler', e);
        }
      }
      clickHandlerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [geoJSON, bounds, interactive, onMarkPress]);

  return (
    <View style={styles.container}>
      <div ref={mapContainerRef} style={styles.mapContainer as any} />
      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="small" color="#0284c7" />
          <Text style={styles.overlayText}>Loading map...</Text>
        </View>
      )}
      {error && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

function fitMapBounds(
  map: any,
  LngLatBounds: any,
  geoJSON: CourseGeoJSON,
  bounds: any
): boolean {
  if (bounds && typeof bounds === 'object') {
    const hasNumericBounds =
      typeof bounds.north === 'number' &&
      typeof bounds.south === 'number' &&
      typeof bounds.east === 'number' &&
      typeof bounds.west === 'number';

    if (hasNumericBounds) {
      const explicitBounds = new LngLatBounds(
        [bounds.west, bounds.south],
        [bounds.east, bounds.north]
      );
      map.fitBounds(explicitBounds, { padding: 24, maxZoom: 16, duration: 0 });
      return true;
    }
  }

  const extentBounds = new LngLatBounds();
  let hasCoordinates = false;
  geoJSON.features.forEach((feature: CourseFeature) => {
    const geometry: any = feature.geometry;
    if (geometry?.type === 'Point' && Array.isArray(geometry.coordinates)) {
      extentBounds.extend(geometry.coordinates as [number, number]);
      hasCoordinates = true;
      return;
    }
    if (geometry?.type === 'LineString' && Array.isArray(geometry.coordinates)) {
      geometry.coordinates.forEach((coord: [number, number]) => {
        extentBounds.extend(coord);
        hasCoordinates = true;
      });
      return;
    }
    if (geometry?.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
      geometry.coordinates.forEach((ring: [number, number][]) => {
        ring.forEach((coord: [number, number]) => {
          extentBounds.extend(coord);
          hasCoordinates = true;
        });
      });
    }
  });

  if (hasCoordinates) {
    map.fitBounds(extentBounds, { padding: 24, maxZoom: 16, duration: 0 });
    return true;
  }

  return false;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: 220,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    minHeight: 220,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.72)',
    paddingHorizontal: 16,
  },
  overlayText: {
    marginTop: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  errorText: {
    fontSize: 13,
    color: '#991b1b',
    textAlign: 'center',
  },
});
