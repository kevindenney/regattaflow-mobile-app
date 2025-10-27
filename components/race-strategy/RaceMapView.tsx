/**
 * RaceMapView - 3D Nautical Map with Course Visualization
 * OnX Maps-inspired interface for race strategy planning
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { RaceCourseExtraction } from '@/lib/types/ai-knowledge';

interface RaceMapViewProps {
  courseExtraction: RaceCourseExtraction;
  activeLayer: 'course' | 'weather' | 'tide' | 'tactical' | 'bathymetry' | 'satellite';
  showLaylines: boolean;
  onMapLoad?: () => void;
}

export function RaceMapView({
  courseExtraction,
  activeLayer,
  showLaylines,
  onMapLoad
}: RaceMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // For mobile, we'll use React Native Mapbox GL later
      return;
    }

    // Enable MapLibre GL for web
    const ENABLE_MAP = true;

    // Web-only MapLibre GL implementation
    const initializeMap = async () => {
      try {
        console.log('🗺️ Starting MapLibre GL initialization...');
        const maplibregl = await import('maplibre-gl');
        console.log('✅ MapLibre GL library loaded');

        // Import CSS dynamically
        await import('maplibre-gl/dist/maplibre-gl.css');
        console.log('✅ MapLibre GL CSS loaded');

        if (!mapContainerRef.current) {
          console.error('❌ Map container ref is null');
          return;
        }

        // Extract coordinates from first mark for centering
        // Default to Hong Kong coordinates if no marks
        const defaultCenter: [number, number] = [114.1675, 22.2840]; // Hong Kong
        console.log('🎯 Map center:', defaultCenter);

        // Initialize map with nautical style
        // Using a simple style to avoid font loading issues
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: {
            version: 8,
            sources: {
              'osm': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap Contributors',
                maxzoom: 19
              }
            },
            layers: [
              {
                id: 'osm',
                type: 'raster',
                source: 'osm',
                minzoom: 0,
                maxzoom: 22
              }
            ]
          },
          center: defaultCenter,
          zoom: 13,
          pitch: 45, // 3D angle
          bearing: 0,
          attributionControl: true,
        });

        mapRef.current = map;
        console.log('✅ Map instance created');

        map.on('load', () => {
          console.log('🗺️ Map loaded successfully');
          setMapLoaded(true);
          onMapLoad?.();

          // Add 3D terrain
          map.addSource('terrain', {
            type: 'raster-dem',
            url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
            tileSize: 256,
          });

          // Add bathymetry layer (depth contours)
          if (activeLayer === 'bathymetry') {
            map.addLayer({
              id: 'bathymetry',
              type: 'line',
              source: 'terrain',
              paint: {
                'line-color': '#0066cc',
                'line-width': 1,
                'line-opacity': 0.6,
              },
            });
          }

          // Add course marks
          addCourseMarks(map, courseExtraction);

          // Add start line
          addStartLine(map, courseExtraction);
        });

        map.on('error', (e) => {
          console.error('❌ Map error:', e);
        });

        // Add navigation controls
        map.addControl(new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true,
        }), 'top-right');

      } catch (error) {
        console.error('❌ Error initializing map:', error);
        // Set loaded to true anyway to hide the placeholder and show error state
        setMapLoaded(true);
      }
    };

    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update layers when activeLayer changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    // Toggle layer visibility
    const layers = ['weather', 'tide', 'tactical', 'bathymetry'];
    layers.forEach(layer => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', activeLayer === layer ? 'visible' : 'none');
      }
    });

    // Switch base map style for satellite
    if (activeLayer === 'satellite') {
      // Would switch to satellite imagery here
      console.log('🛰️ Switching to satellite view');
    }
  }, [activeLayer, mapLoaded]);

  // Add laylines when toggled
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    if (showLaylines) {
      addLaylines(map, courseExtraction);
    } else {
      if (map.getLayer('laylines')) {
        map.removeLayer('laylines');
      }
      if (map.getSource('laylines')) {
        map.removeSource('laylines');
      }
    }
  }, [showLaylines, mapLoaded]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        {/* Mobile map implementation would go here */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 12,
          position: 'relative',
        }}
      />
      {/* Show loading indicator while map loads */}
      {!mapLoaded && (
        <View style={styles.mapPlaceholder}>
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderTitle}>🗺️ Loading Map...</Text>
            <Text style={styles.placeholderSubtitle}>
              Initializing 3D course visualization
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Helper function to add course marks to map
function addCourseMarks(map: any, courseExtraction: RaceCourseExtraction) {
  const marks = courseExtraction.marks;

  marks.forEach((mark, index) => {
    // Extract lat/lng from mark description (basic parsing)
    const coords = extractCoordinates(mark.position.description);
    if (!coords) return;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'race-mark';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = getMarkColor(mark.type);
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    el.title = mark.name;

    // Add marker to map
    try {
      const maplibregl = require('maplibre-gl');
      new maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(`<strong>${mark.name}</strong><br/>${mark.type}`)
        )
        .addTo(map);
    } catch (error) {
      console.error('Error adding marker:', error);
    }
  });
}

// Helper function to add start line
function addStartLine(map: any, courseExtraction: RaceCourseExtraction) {
  const startMarks = courseExtraction.marks.filter(m => m.type === 'start');
  if (startMarks.length < 2) return;

  const coords = startMarks.map(m => extractCoordinates(m.position.description)).filter(Boolean);
  if (coords.length < 2) return;

  map.addSource('start-line', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
    },
  });

  map.addLayer({
    id: 'start-line',
    type: 'line',
    source: 'start-line',
    paint: {
      'line-color': '#10B981',
      'line-width': 3,
      'line-dasharray': [2, 2],
    },
  });
}

// Helper function to add laylines
function addLaylines(map: any, courseExtraction: RaceCourseExtraction) {
  // Find windward mark
  const windwardMark = courseExtraction.marks.find(m => m.type === 'windward');
  if (!windwardMark) return;

  const windwardCoords = extractCoordinates(windwardMark.position.description);
  if (!windwardCoords) return;

  // Create layline angles (assuming 45-degree laylines)
  const laylineAngle = 45;
  const laylineLength = 0.01; // degrees

  const laylineLeft = [
    windwardCoords,
    [
      windwardCoords[0] - laylineLength * Math.cos((laylineAngle * Math.PI) / 180),
      windwardCoords[1] - laylineLength * Math.sin((laylineAngle * Math.PI) / 180),
    ],
  ];

  const laylineRight = [
    windwardCoords,
    [
      windwardCoords[0] + laylineLength * Math.cos((laylineAngle * Math.PI) / 180),
      windwardCoords[1] - laylineLength * Math.sin((laylineAngle * Math.PI) / 180),
    ],
  ];

  map.addSource('laylines', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: laylineLeft,
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: laylineRight,
          },
        },
      ],
    },
  });

  map.addLayer({
    id: 'laylines',
    type: 'line',
    source: 'laylines',
    paint: {
      'line-color': '#F59E0B',
      'line-width': 2,
      'line-dasharray': [4, 2],
      'line-opacity': 0.8,
    },
  });
}

// Helper to extract coordinates from description string
function extractCoordinates(description: string): [number, number] | null {
  // Look for patterns like "22.2847°N, 114.1676°E" or "22.2847, 114.1676"
  const match = description.match(/(-?\d+\.\d+)[°]?[NS]?,\s*(-?\d+\.\d+)[°]?[EW]?/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    return [lng, lat]; // MapLibre uses [lng, lat]
  }
  return null;
}

// Helper to get color for mark type
function getMarkColor(type: string): string {
  const colors: Record<string, string> = {
    start: '#10B981',
    windward: '#3B82F6',
    leeward: '#EF4444',
    offset: '#F59E0B',
    gate: '#8B5CF6',
  };
  return colors[type] || '#64748B';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  markersContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  marker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  courseLine: {
    width: 2,
    height: 20,
    backgroundColor: '#CBD5E1',
  },
  weatherOverlay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  overlayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginVertical: 4,
  },
  placeholderNote: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 16,
    fontStyle: 'italic',
  },
});