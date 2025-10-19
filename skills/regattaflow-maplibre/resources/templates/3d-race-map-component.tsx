/**
 * 3D Race Map Component Template
 * Use this as a starting point for MapLibre GL JS race visualizations
 *
 * This template demonstrates:
 * - Web-only MapLibre initialization with dynamic import
 * - 3D race course rendering with marks and lines
 * - Environmental and tactical layers
 * - Layer controls and interactivity
 *
 * To use: Copy this file to your component location and modify for your use case
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Utility imports from sailing-document-parser skill
import {
  generateCourseGeoJSON,
  calculateCourseBounds,
  calculateDistance
} from '@/skills/sailing-document-parser/utils/course-generation';

const isWeb = Platform.OS === 'web';

// ============================================================================
// TYPES
// ============================================================================

interface RaceMark {
  id: string;
  name: string;
  type: 'start' | 'windward' | 'leeward' | 'gate' | 'finish';
  lat: number;
  lng: number;
  description?: string;
}

interface RaceCourse {
  id: string;
  name: string;
  marks: RaceMark[];
  courseType: 'windward_leeward' | 'triangle' | 'olympic' | 'custom';
}

interface ThreeDRaceMapProps {
  course: RaceCourse;
  venueCenter?: [number, number];  // [lng, lat]
  showWind?: boolean;
  showCurrent?: boolean;
  showLaylines?: boolean;
  onMarkSelected?: (mark: RaceMark) => void;
}

interface LayerControl {
  id: string;
  name: string;
  icon: any;
  enabled: boolean;
  type: 'environmental' | 'tactical';
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ThreeDRaceMap({
  course,
  venueCenter,
  showWind = true,
  showCurrent = true,
  showLaylines = false,
  onMarkSelected
}: ThreeDRaceMapProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [layerControls, setLayerControls] = useState<LayerControl[]>([
    { id: 'wind-vectors', name: 'Wind', icon: 'arrow-forward-outline', enabled: showWind, type: 'environmental' },
    { id: 'current-flow', name: 'Current', icon: 'water-outline', enabled: showCurrent, type: 'environmental' },
    { id: 'laylines', name: 'Laylines', icon: 'trending-up-outline', enabled: showLaylines, type: 'tactical' }
  ]);

  useEffect(() => {
    if (isWeb && course) {
      initializeMap();
    }

    return () => {
      // Cleanup map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [course]);

  // ============================================================================
  // MAP INITIALIZATION
  // ============================================================================

  const initializeMap = async () => {
    try {
      // Dynamic import for web-only MapLibre GL JS
      const maplibregl = await import('maplibre-gl');

      if (!mapRef.current) return;

      // Calculate course center
      const center = venueCenter || getCourseCenter(course.marks);

      // Initialize map with 3D perspective
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: createMapStyle(),  // Custom nautical style
        center,
        zoom: 13,
        pitch: 45,   // 3D perspective
        bearing: 0,
        antialias: true
      });

      mapInstanceRef.current = map;

      // Add navigation controls
      map.addControl(new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
      }), 'top-right');

      // Add scale control (nautical miles)
      map.addControl(new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: 'nautical'
      }), 'bottom-left');

      // Wait for map to load
      map.on('load', async () => {
        console.log('🗺️ Map loaded successfully');
        setIsMapLoaded(true);

        // Add race course layers
        await addRaceCourse(map);

        // Add environmental layers if enabled
        if (showWind) await addWindVectors(map);
        if (showCurrent) await addCurrentFlow(map);
        if (showLaylines) await addLaylines(map);

        // Setup interactivity
        setupMarkInteraction(map);

        // Fit map to course
        fitMapToCourse(map);
      });

    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
    }
  };

  // ============================================================================
  // MAP STYLE
  // ============================================================================

  const createMapStyle = () => {
    return {
      version: 8,
      name: 'Nautical Racing Chart',
      sources: {
        'osm-base': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap'
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#E8F4FD' }  // Water blue
        },
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-base',
          paint: { 'raster-opacity': 0.7 }
        }
      ]
    };
  };

  // ============================================================================
  // RACE COURSE RENDERING
  // ============================================================================

  const addRaceCourse = async (map: any) => {
    // Generate GeoJSON using utility function
    const courseGeoJSON = generateCourseGeoJSON(course.marks, true);

    // Add race marks as 3D extrusions
    map.addSource('race-marks', {
      type: 'geojson',
      data: courseGeoJSON
    });

    // 3D mark extrusions
    map.addLayer({
      id: 'race-marks-3d',
      type: 'fill-extrusion',
      source: 'race-marks',
      paint: {
        'fill-extrusion-color': getMarkColor,
        'fill-extrusion-height': 50,  // 50 meters tall
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
      }
    });

    // Mark labels
    map.addLayer({
      id: 'race-marks-labels',
      type: 'symbol',
      source: 'race-marks',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-offset': [0, -3],
        'text-anchor': 'bottom'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 2
      }
    });

    // Course lines
    if (course.marks.length >= 2) {
      const courseLineCoords = course.marks.map(m => [m.lng, m.lat]);

      map.addSource('course-lines', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: courseLineCoords
          },
          properties: {}
        }
      });

      map.addLayer({
        id: 'course-lines',
        type: 'line',
        source: 'course-lines',
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 3,
          'line-opacity': 0.8,
          'line-dasharray': [2, 2]
        }
      });
    }

    console.log('✅ Race course rendered:', course.marks.length, 'marks');
  };

  const getMarkColor = [
    'case',
    ['==', ['get', 'type'], 'start'], '#22c55e',      // Green
    ['==', ['get', 'type'], 'finish'], '#ef4444',     // Red
    ['==', ['get', 'type'], 'windward'], '#0ea5e9',   // Blue
    ['==', ['get', 'type'], 'leeward'], '#f59e0b',    // Orange
    '#8b5cf6'  // Purple for gates
  ];

  // ============================================================================
  // ENVIRONMENTAL LAYERS
  // ============================================================================

  const addWindVectors = async (map: any) => {
    const center = getCourseCenter(course.marks);

    // Create grid of wind vectors
    const vectors = [];
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        vectors.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [center[0] + i * 0.005, center[1] + j * 0.005]
          },
          properties: {
            direction: 135,  // Wind from SE (would be dynamic in production)
            speed: 12
          }
        });
      }
    }

    map.addSource('wind-vectors', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: vectors
      }
    });

    // Note: You'd load a custom wind arrow image here
    // For now, use text arrows
    map.addLayer({
      id: 'wind-arrows',
      type: 'symbol',
      source: 'wind-vectors',
      layout: {
        'text-field': '→',
        'text-size': 20,
        'text-rotate': ['get', 'direction'],
        'text-allow-overlap': true
      },
      paint: {
        'text-color': '#3b82f6',
        'text-opacity': 0.6
      }
    });
  };

  const addCurrentFlow = async (map: any) => {
    // Current flow visualization
    console.log('🌊 Adding current flow (simplified for template)');
  };

  const addLaylines = async (map: any) => {
    // Tactical layline visualization
    console.log('📐 Adding laylines (simplified for template)');
  };

  // ============================================================================
  // INTERACTIVITY
  // ============================================================================

  const setupMarkInteraction = (map: any) => {
    // Click on mark
    map.on('click', 'race-marks-3d', (e: any) => {
      const feature = e.features[0];
      const mark = {
        id: feature.properties.id,
        name: feature.properties.name,
        type: feature.properties.type,
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0]
      } as RaceMark;

      setSelectedMark(mark.id);
      onMarkSelected?.(mark);

      // Fly to mark
      map.flyTo({
        center: [mark.lng, mark.lat],
        zoom: 15,
        pitch: 60,
        duration: 1500
      });
    });

    // Hover cursor
    map.on('mouseenter', 'race-marks-3d', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'race-marks-3d', () => {
      map.getCanvas().style.cursor = '';
    });
  };

  // ============================================================================
  // CAMERA CONTROLS
  // ============================================================================

  const getCourseCenter = (marks: RaceMark[]): [number, number] => {
    if (marks.length === 0) return [-122.4, 37.8];

    const avgLat = marks.reduce((sum, m) => sum + m.lat, 0) / marks.length;
    const avgLng = marks.reduce((sum, m) => sum + m.lng, 0) / marks.length;

    return [avgLng, avgLat];
  };

  const fitMapToCourse = (map: any) => {
    const bounds = calculateCourseBounds(course.marks, 100);  // Use utility

    const maplibregl = require('maplibre-gl');
    const lngLatBounds = new maplibregl.LngLatBounds(
      [bounds[0], bounds[1]],  // SW corner
      [bounds[2], bounds[3]]   // NE corner
    );

    map.fitBounds(lngLatBounds, {
      padding: 100,
      duration: 1000,
      pitch: 45
    });
  };

  // ============================================================================
  // LAYER CONTROLS
  // ============================================================================

  const toggleLayer = (layerId: string) => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    const updatedControls = layerControls.map(layer => {
      if (layer.id === layerId) {
        const newEnabled = !layer.enabled;

        // Toggle layer visibility on map
        try {
          mapInstanceRef.current.setLayoutProperty(
            layerId,
            'visibility',
            newEnabled ? 'visible' : 'none'
          );
        } catch (error) {
          console.log(`Layer ${layerId} not found`);
        }

        return { ...layer, enabled: newEnabled };
      }
      return layer;
    });

    setLayerControls(updatedControls);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      {/* Map Container */}
      <View style={styles.mapContainer}>
        {isWeb ? (
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 12
            }}
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <Ionicons name="map-outline" size={64} color="#0066CC" />
            <Text style={styles.fallbackText}>3D Race Course</Text>
            <Text style={styles.fallbackSubtext}>Available on web platform</Text>
          </View>
        )}

        {/* Loading Overlay */}
        {isWeb && !isMapLoaded && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Loading 3D course...</Text>
          </View>
        )}
      </View>

      {/* Layer Controls */}
      {isWeb && isMapLoaded && (
        <View style={styles.layerControls}>
          <Text style={styles.layerTitle}>Map Layers</Text>
          <View style={styles.layerGrid}>
            {layerControls.map(layer => (
              <TouchableOpacity
                key={layer.id}
                style={[
                  styles.layerButton,
                  layer.enabled && styles.layerButtonActive
                ]}
                onPress={() => toggleLayer(layer.id)}
              >
                <Ionicons
                  name={layer.icon}
                  size={16}
                  color={layer.enabled ? '#0066CC' : '#666'}
                />
                <Text style={[
                  styles.layerButtonText,
                  layer.enabled && styles.layerButtonTextActive
                ]}>
                  {layer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Course Info */}
      {isWeb && isMapLoaded && (
        <View style={styles.courseInfo}>
          <Text style={styles.courseInfoTitle}>{course.name}</Text>
          <Text style={styles.courseInfoText}>
            {course.marks.length} marks • {course.courseType.replace('_', '/')}
          </Text>
          {selectedMark && (
            <Text style={styles.selectedMarkText}>
              Selected: {course.marks.find(m => m.id === selectedMark)?.name}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E8F4FD',
    position: 'relative',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066CC',
    marginTop: 16,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  layerControls: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  layerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  layerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  layerButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0066CC',
  },
  layerButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  layerButtonTextActive: {
    color: '#0066CC',
  },
  courseInfo: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  courseInfoText: {
    fontSize: 14,
    color: '#64748B',
  },
  selectedMarkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginTop: 8,
  },
});
