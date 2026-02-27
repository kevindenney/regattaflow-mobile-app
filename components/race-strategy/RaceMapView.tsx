// @ts-nocheck

/**
 * RaceMapView - 3D Nautical Map with Course Visualization
 * OnX Maps-inspired interface for race strategy planning
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { RaceCourseExtraction } from '@/lib/types/ai-knowledge';
import { ensureMapLibreCss, ensureMapLibreScript } from '@/lib/maplibreWeb';
import { createLogger } from '@/lib/utils/logger';

interface RaceMapViewProps {
  courseExtraction: RaceCourseExtraction;
  activeLayer: 'course' | 'weather' | 'tide' | 'tactical' | 'bathymetry' | 'satellite';
  showLaylines: boolean;
  onMapLoad?: () => void;
}

let maplibreNamespace: any = null;
const logger = createLogger('RaceMapView');

export function RaceMapView({
  courseExtraction,
  activeLayer,
  showLaylines,
  onMapLoad
}: RaceMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const latestPropsRef = useRef({
    activeLayer,
    courseExtraction,
    onMapLoad,
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    latestPropsRef.current = { activeLayer, courseExtraction, onMapLoad };
  }, [activeLayer, courseExtraction, onMapLoad]);

  const ensureBathymetryLayer = (map: any) => {
    if (!map.getSource('terrain')) {
      map.addSource('terrain', {
        type: 'raster-dem',
        url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
        tileSize: 256,
      });
    }

    if (!map.getLayer('bathymetry')) {
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
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // For mobile, we'll use React Native Mapbox GL later
      return;
    }

    // Web-only MapLibre GL implementation
    const initializeMap = async () => {
      let loadTimeout: ReturnType<typeof setTimeout> | null = null;
      let didLoad = false;
      try {

        let maplibregl: any = null;
        try {
          const maplibreModule = await import('maplibre-gl');
          maplibregl = (maplibreModule as any).default || maplibreModule;
        } catch (_moduleError) {
          await ensureMapLibreScript('maplibre-gl-script-race-map-view');
          maplibregl = typeof window !== 'undefined' ? (window as any).maplibregl : null;
        }
        maplibreNamespace = maplibregl;

        // Import CSS dynamically. Fall back to link injection when bundler CSS import is unavailable.
        try {
          await import('maplibre-gl/dist/maplibre-gl.css');
        } catch (_cssError) {
          ensureMapLibreCss('maplibre-gl-css');
        }

        const MapConstructor = maplibregl?.Map;
        const NavigationControl = maplibregl?.NavigationControl;
        if (!MapConstructor) {
          throw new Error('MapLibre Map constructor is unavailable');
        }

        if (!mapContainerRef.current) {

          return;
        }

        // Extract coordinates from first mark for centering
        // Default to Hong Kong coordinates if no marks
        const defaultCenter: [number, number] = [114.1675, 22.2840]; // Hong Kong

        // Initialize map with nautical style
        // Using a simple style to avoid font loading issues
        const map = new MapConstructor({
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
        loadTimeout = setTimeout(() => {
          if (!didLoad) {
            setMapError('Map timed out while loading. Course data is still available.');
          }
        }, 8000);

        map.on('load', () => {
          didLoad = true;

          setMapLoaded(true);
          setMapError(null);
          if (loadTimeout) {
            clearTimeout(loadTimeout);
            loadTimeout = null;
          }

          // Ensure terrain/bathymetry layers exist regardless of active layer.
          ensureBathymetryLayer(map);
          map.setLayoutProperty(
            'bathymetry',
            'visibility',
            latestPropsRef.current.activeLayer === 'bathymetry' ? 'visible' : 'none'
          );

          // Add course marks
          addCourseMarks(map, latestPropsRef.current.courseExtraction);

          // Add start line
          addStartLine(map, latestPropsRef.current.courseExtraction);

          // Fit viewport to extracted course geometry when available.
          fitMapToCourse(map, latestPropsRef.current.courseExtraction);
          latestPropsRef.current.onMapLoad?.();
        });

        map.on('error', (e: any) => {
          // MapLibre emits recoverable runtime errors (tile/source/network). Don't collapse
          // the map after successful load unless style is no longer available.
          const mapInstance = mapRef.current;
          const styleLoaded = typeof mapInstance?.isStyleLoaded === 'function'
            ? mapInstance.isStyleLoaded()
            : false;
          if (didLoad && styleLoaded) {
            return;
          }
          const detail = e?.error?.message || e?.message || 'Unknown map error';
          setMapError(`Interactive map unavailable on web. ${detail}`);
        });

        // Add navigation controls
        if (NavigationControl) {
          map.addControl(new NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true,
          }), 'top-right');
        }

      } catch (error) {

        // Set loaded to true anyway to hide the placeholder and show error state
        setMapLoaded(true);
        setMapError(
          `Map failed to initialize: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        maplibreNamespace = null;
      } finally {
        if (loadTimeout && didLoad) {
          clearTimeout(loadTimeout);
        }
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
    ensureBathymetryLayer(map);

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
  }, [showLaylines, mapLoaded, courseExtraction]);

  // Refresh course overlays when extraction updates after initial load
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    addCourseMarks(map, courseExtraction);
    addStartLine(map, courseExtraction);
    fitMapToCourse(map, courseExtraction);

    if (showLaylines) {
      addLaylines(map, courseExtraction);
    }
  }, [courseExtraction, mapLoaded, showLaylines]);

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
      {!!mapError && (
        <View style={styles.mapErrorOverlay}>
          <Text style={styles.mapErrorTitle}>Map unavailable</Text>
          <Text style={styles.mapErrorMessage}>{mapError}</Text>
          <Text style={styles.mapErrorDetail}>
            Marks extracted: {courseExtraction?.marks?.length || 0}
          </Text>
        </View>
      )}
    </View>
  );
}

function getMarkLngLat(mark: any): [number, number] | null {
  const latFromPosition = mark?.position?.latitude ?? mark?.position?.lat;
  const lngFromPosition = mark?.position?.longitude ?? mark?.position?.lng;
  if (typeof latFromPosition === 'number' && typeof lngFromPosition === 'number') {
    return [lngFromPosition, latFromPosition];
  }

  if (typeof mark?.latitude === 'number' && typeof mark?.longitude === 'number') {
    return [mark.longitude, mark.latitude];
  }

  if (Array.isArray(mark?.coordinates) && mark.coordinates.length >= 2) {
    const [lng, lat] = mark.coordinates;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return [lng, lat];
    }
  }

  return extractCoordinates(mark?.position?.description || mark?.description || '');
}

function getMarkType(mark: any): string {
  return (mark?.type || mark?.mark_type || '').toString().toLowerCase();
}

function getCourseLngLats(courseExtraction: RaceCourseExtraction): [number, number][] {
  return (courseExtraction?.marks || [])
    .map((mark: any) => getMarkLngLat(mark))
    .filter((coord): coord is [number, number] => Array.isArray(coord));
}

// Helper function to add course marks to map
function addCourseMarks(map: any, courseExtraction: RaceCourseExtraction) {
  const marks = courseExtraction.marks;
  const existingMarkers = (map as any).__courseMarkers as any[] | undefined;
  if (existingMarkers && existingMarkers.length > 0) {
    existingMarkers.forEach((marker) => {
      try {
        marker.remove();
      } catch (_error) {
        // no-op
      }
    });
  }
  (map as any).__courseMarkers = [];

  marks.forEach((mark, index) => {
    const coords = getMarkLngLat(mark);
    if (!coords) return;
    const markType = getMarkType(mark) || 'unknown';

    // Create marker element
    const el = document.createElement('div');
    el.className = 'race-mark';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = getMarkColor(markType);
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    el.title = mark.name || mark.mark_name || `Mark ${index + 1}`;

    // Add marker to map
    try {
      const Marker = maplibreNamespace?.Marker;
      const Popup = maplibreNamespace?.Popup;
      if (!Marker || !Popup) return;

      const marker = new Marker({ element: el })
        .setLngLat(coords)
        .setPopup(
          new Popup({ offset: 25 })
            .setHTML(
              `<strong>${mark.name || mark.mark_name || `Mark ${index + 1}`}</strong><br/>${markType || 'mark'}`
            )
        )
        .addTo(map);
      (map as any).__courseMarkers.push(marker);
    } catch (error) {
      logger.error('Error adding marker', error);
    }
  });
}

function fitMapToCourse(map: any, courseExtraction: RaceCourseExtraction) {
  const coords = getCourseLngLats(courseExtraction);
  if (coords.length === 0) return;

  try {
    const LngLatBounds = maplibreNamespace?.LngLatBounds;
    if (!LngLatBounds) return;

    const bounds = new LngLatBounds(coords[0], coords[0]);
    coords.slice(1).forEach((coord) => bounds.extend(coord));

    map.fitBounds(bounds, {
      padding: 48,
      maxZoom: 15,
      duration: 0,
    });
  } catch (error) {
    logger.error('Error fitting map to course bounds', error);
  }
}

// Helper function to add start line
function addStartLine(map: any, courseExtraction: RaceCourseExtraction) {
  const startMarks = courseExtraction.marks.filter((m: any) => {
    const markType = getMarkType(m);
    return markType === 'start' || markType === 'pin' || markType === 'committee_boat';
  });
  if (startMarks.length < 2) return;

  const coords = startMarks.map((m) => getMarkLngLat(m)).filter(Boolean);
  if (coords.length < 2) return;

  if (map.getLayer('start-line')) {
    map.removeLayer('start-line');
  }
  if (map.getSource('start-line')) {
    map.removeSource('start-line');
  }

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
  const windwardMark = courseExtraction.marks.find((m: any) => getMarkType(m) === 'windward');
  if (!windwardMark) return;

  const windwardCoords = getMarkLngLat(windwardMark);
  if (!windwardCoords) return;

  if (map.getLayer('laylines')) {
    map.removeLayer('laylines');
  }
  if (map.getSource('laylines')) {
    map.removeSource('laylines');
  }

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
  if (!description) return null;
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
  mapErrorOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.96)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    gap: 4,
  },
  mapErrorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  mapErrorMessage: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  mapErrorDetail: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
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
