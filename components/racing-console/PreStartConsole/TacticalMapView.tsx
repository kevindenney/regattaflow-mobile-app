/**
 * Tactical Map View
 *
 * Functional map for racing tactics during pre-start using NATIVE MapLibre GL
 * (no react-map-gl wrapper to avoid ES6 module issues)
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useRaceConditions,
  selectPosition,
  selectWind,
  selectCurrent,
  selectTacticalZones,
  selectCourse,
  selectDepth
} from '@/stores/raceConditionsStore';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius
} from '@/constants/RacingDesignSystem';
import { ensureMapLibreCss, ensureMapLibreScript } from '@/lib/maplibreWeb';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('TacticalMapView');

// Declare global maplibregl type
declare global {
  interface Window {
    maplibregl: any;
  }
}

let maplibregl: any = null;
const MAP_STYLE_CANDIDATES = [
  {
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
        paint: { 'background-color': '#0b1f33' },
      },
      {
        id: 'raster-layer',
        type: 'raster',
        source: 'raster-tiles',
        paint: { 'raster-opacity': 0.82 },
      },
    ],
  },
  'https://tiles.openfreemap.org/styles/liberty',
  'https://demotiles.maplibre.org/style.json',
];

type MarkerRef = {
  markMarkers: any[];
  positionMarker: any | null;
};

interface TacticalMapViewProps {
  startLineHeading?: number;
  startLineLength?: number;
  timeToStart?: number;
}

export function TacticalMapView({
  startLineHeading: _startLineHeading = 0,
  startLineLength: _startLineLength = 100,
  timeToStart: _timeToStart = 10
}: TacticalMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<MarkerRef>({ markMarkers: [], positionMarker: null });
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapStyleIndexRef = useRef(0);
  const mapHasLoadedRef = useRef(false);
  const mapInitRunIdRef = useRef(0);
  const mapInstanceRunIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLibLoaded, setMapLibLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Race conditions from store
  const position = useRaceConditions(selectPosition);
  const wind = useRaceConditions(selectWind);
  const current = useRaceConditions(selectCurrent);
  const tacticalZones = useRaceConditions(selectTacticalZones);
  const course = useRaceConditions(selectCourse);
  const depth = useRaceConditions(selectDepth);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      mapInitRunIdRef.current += 1;
      mapInstanceRunIdRef.current += 1;
    };
  }, []);

  // Load MapLibre GL via module first, then CDN fallback.
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let cancelled = false;
    const runId = ++mapInitRunIdRef.current;
    const canCommit = () =>
      !cancelled &&
      isMountedRef.current &&
      runId === mapInitRunIdRef.current;

    const loadFromCDN = async (): Promise<boolean> => {
      if (typeof document === 'undefined') return false;

      ensureMapLibreCss('maplibre-css');

      if (typeof window !== 'undefined' && window.maplibregl) {
        maplibregl = window.maplibregl;
        return true;
      }

      await ensureMapLibreScript('maplibre-script');

      if (typeof window !== 'undefined' && window.maplibregl) {
        maplibregl = window.maplibregl;
        return true;
      }
      return false;
    };

    const loadMapLibre = async () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      initTimeoutRef.current = setTimeout(() => {
        if (!canCommit()) return;
        setError('Map library timed out. Tactical cards remain available.');
      }, 8000);

      try {
        const maplibreModule = await import('maplibre-gl');
        maplibregl = (maplibreModule as any).default || maplibreModule;
        try {
          await import('maplibre-gl/dist/maplibre-gl.css');
        } catch (cssError) {
          // Expo web can fail CSS module import; inject CDN stylesheet instead.
          ensureMapLibreCss('maplibre-css');
          logger.warn('MapLibre CSS module import failed, using injected stylesheet fallback', cssError);
        }
        if (canCommit()) {
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
          setMapLibLoaded(true);
          setError(null);
        }
        return;
      } catch (moduleError) {
        logger.warn('Module import failed, trying CDN fallback', moduleError);
      }

      try {
        const loaded = await loadFromCDN();
        if (!loaded) {
          throw new Error('MapLibre not available after CDN load');
        }
        if (canCommit()) {
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
          setMapLibLoaded(true);
          setError(null);
        }
      } catch (cdnError) {
        if (canCommit()) {
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
          setMapLibLoaded(false);
          setError('Interactive map unavailable. Please continue with tactical data cards.');
        }
        logger.error('Failed to load MapLibre GL', cdnError);
      }
    };

    void loadMapLibre();

    return () => {
      cancelled = true;
      if (mapInitRunIdRef.current === runId) {
        mapInitRunIdRef.current += 1;
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, []);

  const initialCenter = useMemo<[number, number]>(() => {
    if (course?.startLine?.centerLon && course?.startLine?.centerLat) {
      return [course.startLine.centerLon, course.startLine.centerLat];
    }
    if (position?.longitude && position?.latitude) {
      return [position.longitude, position.latitude];
    }
    return [114.15, 22.28];
  }, [
    course?.startLine?.centerLat,
    course?.startLine?.centerLon,
    position?.latitude,
    position?.longitude,
  ]);

  // Initialize map once MapLibre is loaded
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapLibLoaded || !maplibregl || !mapContainerRef.current || mapRef.current) {
      return;
    }
    const runId = ++mapInstanceRunIdRef.current;
    const canCommit = () =>
      isMountedRef.current && runId === mapInstanceRunIdRef.current;

    try {
      const MapConstructor = maplibregl?.Map;
      if (!MapConstructor) {
        setError('Map rendering issue detected. Tactical cards remain available.');
        return;
      }
      const map = new MapConstructor({
        container: mapContainerRef.current,
        style: MAP_STYLE_CANDIDATES[mapStyleIndexRef.current],
        center: initialCenter as [number, number],
        zoom: 14,
        pitch: 0,
        bearing: 0
      });

      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      loadTimeoutRef.current = setTimeout(() => {
        if (!canCommit()) return;
        setError('Map failed to load in time. Tactical cards remain available.');
        setMapLoaded(false);
      }, 8000);

      map.on('load', () => {
        if (!canCommit()) return;
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        mapHasLoadedRef.current = true;
        setMapLoaded(true);
        setError(null);
      });

      map.on('error', (e: any) => {
        logger.error('Map error:', e);
        if (!canCommit()) return;
        const nextStyleIndex = mapStyleIndexRef.current + 1;
        if (!mapHasLoadedRef.current && nextStyleIndex < MAP_STYLE_CANDIDATES.length) {
          mapStyleIndexRef.current = nextStyleIndex;
          try {
            map.setStyle(MAP_STYLE_CANDIDATES[nextStyleIndex]);
          } catch (styleError) {
            logger.error('Failed to apply fallback map style', styleError);
          }
          return;
        }
        // After initial load, MapLibre may emit non-fatal source/tile errors.
        // Keep the map visible instead of collapsing to a full error state.
        if (mapHasLoadedRef.current) {
          return;
        }
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        setMapLoaded(false);
        setError('Map rendering issue detected. Tactical cards remain available.');
      });

      mapRef.current = map;
      const markerState = markerRef.current;

      return () => {
        if (mapInstanceRunIdRef.current === runId) {
          mapInstanceRunIdRef.current += 1;
        }
        mapHasLoadedRef.current = false;
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        markerState.markMarkers.forEach((marker) => marker.remove());
        markerState.markMarkers = [];
        if (markerState.positionMarker) {
          markerState.positionMarker.remove();
          markerState.positionMarker = null;
        }
        map.remove();
        mapRef.current = null;
      };
    } catch (e: any) {
      logger.error('Exception creating map:', e);
      if (!canCommit()) return;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setMapLoaded(false);
      setError(`Exception: ${e.message}`);
    }
  }, [initialCenter, mapLibLoaded]);

  // Update map layers when data changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    if (typeof document === 'undefined') return;

    const map = mapRef.current;
    if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) {
      return;
    }

    try {
      // Add/update start line
      if (course?.startLine) {
        const startLineGeoJSON = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [course.startLine.port.longitude, course.startLine.port.latitude],
              [course.startLine.starboard.longitude, course.startLine.starboard.latitude]
            ]
          }
        };

        if (map.getSource('start-line')) {
          map.getSource('start-line').setData(startLineGeoJSON);
        } else {
          map.addSource('start-line', {
            type: 'geojson',
            data: startLineGeoJSON
          });

          map.addLayer({
            id: 'start-line-layer',
            type: 'line',
            source: 'start-line',
            paint: {
              'line-color': Colors.status.safe,
              'line-width': 4,
              'line-dasharray': [2, 2]
            }
          });
        }
      }

      // Add/update tactical zones
      if (tacticalZones && tacticalZones.length > 0) {
        const zonesGeoJSON = {
          type: 'FeatureCollection',
          features: tacticalZones.map(zone => ({
            type: 'Feature',
            geometry: zone.geometry,
            properties: {
              id: zone.id,
              type: zone.type,
              name: zone.properties.name
            }
          }))
        };

        if (map.getSource('tactical-zones')) {
          map.getSource('tactical-zones').setData(zonesGeoJSON);
        } else {
          map.addSource('tactical-zones', {
            type: 'geojson',
            data: zonesGeoJSON
          });

          map.addLayer({
            id: 'tactical-zones-fill',
            type: 'fill',
            source: 'tactical-zones',
            paint: {
              'fill-color': [
                'match',
                ['get', 'type'],
                'relief', Colors.zones?.relief || '#4CAF50',
                'acceleration', Colors.zones?.acceleration || '#2196F3',
                'shear', Colors.zones?.shear || '#FF9800',
                'lee-bow', Colors.zones?.leeBow || '#9C27B0',
                'anchoring', Colors.zones?.anchoring || '#757575',
                'eddy', Colors.zones?.eddy || '#00BCD4',
                '#888888'
              ],
              'fill-opacity': 0.35
            }
          });

          map.addLayer({
            id: 'tactical-zones-border',
            type: 'line',
            source: 'tactical-zones',
            paint: {
              'line-color': [
                'match',
                ['get', 'type'],
                'relief', Colors.zones?.reliefBorder || '#4CAF50',
                'acceleration', Colors.zones?.accelerationBorder || '#2196F3',
                'shear', Colors.zones?.shearBorder || '#FF9800',
                'lee-bow', Colors.zones?.leeBowBorder || '#9C27B0',
                'anchoring', Colors.zones?.anchoringBorder || '#757575',
                'eddy', Colors.zones?.eddyBorder || '#00BCD4',
                '#888888'
              ],
              'line-width': 2,
              'line-dasharray': [2, 1]
            }
          });
        }
      }

      // Add course marks
      if (course?.marks) {
        markerRef.current.markMarkers.forEach((marker) => marker.remove());
        markerRef.current.markMarkers = [];

        course.marks.forEach((mark, index) => {
          const markerId = `mark-${index}`;

          // Remove existing marker if any
          const existingMarker = document.getElementById(markerId);
          if (existingMarker) {
            existingMarker.remove();
          }

          const el = document.createElement('div');
          el.id = markerId;
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = Colors.status.caution; // Orange/yellow for marks
          el.style.border = '2px solid white';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.fontSize = '10px';
          el.style.fontWeight = 'bold';
          el.style.color = 'white';
          el.textContent = mark.type === 'windward' ? 'W' : 'L';

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([mark.position.lng, mark.position.lat])
            .addTo(map);
          markerRef.current.markMarkers.push(marker);
        });
      }

      // Add position marker
      if (position) {
        if (markerRef.current.positionMarker) {
          markerRef.current.positionMarker.remove();
          markerRef.current.positionMarker = null;
        }
        const positionEl = document.createElement('div');
        positionEl.style.width = '16px';
        positionEl.style.height = '16px';
        positionEl.style.borderRadius = '50%';
        positionEl.style.backgroundColor = Colors.primary.blue;
        positionEl.style.border = '3px solid white';
        positionEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        markerRef.current.positionMarker = new maplibregl.Marker({ element: positionEl })
          .setLngLat([position.longitude, position.latitude])
          .addTo(map);
      }
    } catch (e) {
      logger.error('Error updating layers:', e);
    }
  }, [mapLoaded, course, tacticalZones, position]);

  // Web-only map rendering
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={48}
            color={Colors.text.secondary}
          />
          <Text style={styles.placeholderText}>
            Map view available on web only
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color={Colors.status.danger}
          />
          <Text style={styles.placeholderText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!mapLibLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <MaterialCommunityIcons
            name="map-legend"
            size={48}
            color={Colors.text.secondary}
          />
          <Text style={styles.placeholderText}>
            Loading tactical map...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Container */}
      <div
        ref={mapContainerRef as any}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      />

      {/* Compass */}
      <View style={styles.compassOverlay}>
        <View style={styles.compass}>
          <MaterialCommunityIcons
            name="compass-outline"
            size={24}
            color={Colors.primary.blue}
          />
          <Text style={styles.compassText}>N</Text>
        </View>
      </View>

      {/* Status Overlay */}
      <View style={styles.statusOverlay}>
        {/* Wind */}
        {wind && (wind.speed !== undefined || wind.trueSpeed !== undefined) && (
          <View style={styles.statusCard}>
            <MaterialCommunityIcons
              name="weather-windy"
              size={16}
              color={Colors.primary.blue}
            />
            <Text style={styles.statusText}>
              {/* 🐛 Support both speed and trueSpeed properties */}
              {((wind as any).speed ?? wind.trueSpeed ?? 0).toFixed(1)} kt @ {Math.round((wind as any).direction ?? wind.trueDirection ?? 0)}°
            </Text>
          </View>
        )}

        {/* Current */}
        {current && current.speed !== undefined && (
          <View style={styles.statusCard}>
            <MaterialCommunityIcons
              name="waves"
              size={16}
              color={Colors.primary.cyan}
            />
            <Text style={styles.statusText}>
              {current.speed.toFixed(1)} kt @ {Math.round(current.direction ?? 0)}°
            </Text>
          </View>
        )}

        {/* Depth */}
        {depth && depth.current !== undefined && (
          <View style={styles.statusCard}>
            <MaterialCommunityIcons
              name="chart-bell-curve"
              size={16}
              color={depth.current < 5 ? Colors.status.danger : Colors.status.safe}
            />
            <Text style={styles.statusText}>
              {depth.current.toFixed(1)}m
            </Text>
          </View>
        )}
      </View>

      {/* Zone Legend */}
      {tacticalZones && tacticalZones.length > 0 && (
        <View style={styles.legendOverlay}>
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Tactical Zones</Text>
            {tacticalZones.slice(0, 5).map((zone) => (
              <View key={zone.id} style={styles.legendItem}>
                <View style={[
                  styles.legendColor,
                  { backgroundColor: getZoneColor(zone.type) }
                ]} />
                <Text style={styles.legendText} numberOfLines={1}>
                  {zone.properties.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function getZoneColor(type: string): string {
  switch (type) {
    case 'relief': return Colors.zones?.reliefBorder || '#4CAF50';
    case 'acceleration': return Colors.zones?.accelerationBorder || '#2196F3';
    case 'shear': return Colors.zones?.shearBorder || '#FF9800';
    case 'lee-bow': return Colors.zones?.leeBowBorder || '#9C27B0';
    case 'anchoring': return Colors.zones?.anchoringBorder || '#757575';
    case 'eddy': return Colors.zones?.eddyBorder || '#00BCD4';
    default: return '#888888';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.ui.surface
  },

  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md
  },

  placeholderText: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center'
  },

  compassOverlay: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10
  },

  compass: {
    width: 48,
    height: 48,
    backgroundColor: Colors.ui.background,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }
    })
  },

  compassText: {
    position: 'absolute',
    top: 2,
    fontSize: Typography.fontSize.micro,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.blue
  },

  statusOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    zIndex: 10
  },

  statusCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.ui.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    })
  },

  statusText: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.mono
  },

  legendOverlay: {
    position: 'absolute',
    top: 80,
    right: Spacing.md,
    zIndex: 10
  },

  legend: {
    backgroundColor: Colors.ui.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    maxWidth: 200,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }
    })
  },

  legendTitle: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs
  },

  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2
  },

  legendText: {
    flex: 1,
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary
  }
});
