/**
 * Tactical Map View
 *
 * Functional map for racing tactics during pre-start using NATIVE MapLibre GL
 * (no react-map-gl wrapper to avoid ES6 module issues)
 */

import React, { useRef, useEffect, useState } from 'react';
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

// Declare global maplibregl type
declare global {
  interface Window {
    maplibregl: any;
  }
}

let maplibregl: any = null;

interface TacticalMapViewProps {
  startLineHeading?: number;
  startLineLength?: number;
  timeToStart?: number;
}

export function TacticalMapView({
  startLineHeading = 0,
  startLineLength = 100,
  timeToStart = 10
}: TacticalMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
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


  // Load MapLibre GL from CDN
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Inject CSS
    if (typeof document !== 'undefined' && !document.getElementById('maplibre-css')) {
      const link = document.createElement('link');
      link.id = 'maplibre-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }

    // Check if already loaded
    if (typeof window !== 'undefined' && window.maplibregl) {
      maplibregl = window.maplibregl;
      setMapLibLoaded(true);
      return;
    }

    // Load MapLibre GL script
    if (typeof document !== 'undefined' && !document.getElementById('maplibre-script')) {
      const script = document.createElement('script');
      script.id = 'maplibre-script';
      script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
      script.async = true;
      script.onload = () => {
        maplibregl = window.maplibregl;
        setMapLibLoaded(true);
      };
      script.onerror = () => {
        setError('Failed to load MapLibre GL from CDN');
        console.error('[TacticalMapView] ❌ Failed to load MapLibre GL');
      };
      document.head.appendChild(script);
    }
  }, []);

  // Initialize map once MapLibre is loaded
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapLibLoaded || !maplibregl || !mapContainerRef.current || mapRef.current) {
      return;
    }

    try {
      // Calculate initial center
      const initialCenter = course?.startLine?.centerLon && course?.startLine?.centerLat
        ? [course.startLine.centerLon, course.startLine.centerLat]
        : position?.longitude && position?.latitude
        ? [position.longitude, position.latitude]
        : [114.15, 22.28];

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: initialCenter as [number, number],
        zoom: 14,
        pitch: 0,
        bearing: 0
      });

      map.on('load', () => {
        setMapLoaded(true);
      });

      map.on('error', (e: any) => {
        console.error('[TacticalMapView] ❌ Map error:', e);
        setError(`Map error: ${e.error?.message || 'Unknown'}`);
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (e: any) {
      console.error('[TacticalMapView] ❌ Exception creating map:', e);
      setError(`Exception: ${e.message}`);
    }
  }, [mapLibLoaded]);

  // Update map layers when data changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = mapRef.current;

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

          new maplibregl.Marker({ element: el })
            .setLngLat([mark.position.lng, mark.position.lat])
            .addTo(map);
        });
      }

      // Add position marker
      if (position) {
        const positionEl = document.createElement('div');
        positionEl.style.width = '16px';
        positionEl.style.height = '16px';
        positionEl.style.borderRadius = '50%';
        positionEl.style.backgroundColor = Colors.primary.blue;
        positionEl.style.border = '3px solid white';
        positionEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        new maplibregl.Marker({ element: positionEl })
          .setLngLat([position.longitude, position.latitude])
          .addTo(map);
      }
    } catch (e) {
      console.error('[TacticalMapView] ❌ Error updating layers:', e);
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
