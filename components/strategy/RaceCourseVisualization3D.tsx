/**
 * 3D Race Course Visualization Component
 * Renders AI-extracted race courses in 3D using MapLibre GL JS
 * Part of the "OnX Maps for Sailing" experience
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createLogger } from '@/lib/utils/logger';
import { ensureMapLibreCss, ensureMapLibreScript } from '@/lib/maplibreWeb';
import type {
  RaceCourseExtraction,
  RaceStrategy,
  RaceConditions
} from '@/services/ai/RaceStrategyEngine';

// Web-compatible MapLibre GL JS import for Expo

const logger = createLogger('RaceCourseVisualization3D');
const isWeb = typeof window !== 'undefined';
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
        paint: { 'background-color': '#1e3a5f' },
      },
      {
        id: 'raster-layer',
        type: 'raster',
        source: 'raster-tiles',
        paint: { 'raster-opacity': 0.7 },
      },
    ],
  },
  'https://demotiles.maplibre.org/style.json',
] as const;
const MARK_TEXT_COLOR_EXPRESSION = [
  'match',
  ['get', 'type'],
  'start', '#00FF00',
  'windward', '#FF0000',
  'leeward', '#0000FF',
  'finish', '#FFD700',
  'wing', '#FF8000',
  'gate', '#8000FF',
  '#FFFFFF',
] as const;

interface RaceCourseVisualization3DProps {
  courseExtraction: RaceCourseExtraction;
  strategy?: RaceStrategy;
  conditions?: RaceConditions;
  venue?: string;
  onMarkSelected?: (markName: string) => void;
  onTacticalLayerToggle?: (layer: string, enabled: boolean) => void;
}

interface LayerControl {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  type: 'base' | 'environmental' | 'tactical';
}

export const RaceCourseVisualization3D: React.FC<RaceCourseVisualization3DProps> = ({
  courseExtraction,
  strategy,
  conditions,
  venue = 'unknown',
  onMarkSelected,
  onTacticalLayerToggle
}) => {
  const mapContainerRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const initRunIdRef = useRef(0);
  const styleIndexRef = useRef(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [layerControls, setLayerControls] = useState<LayerControl[]>([
    {
      id: 'nautical-chart',
      name: 'Nautical Chart',
      icon: 'map-outline',
      enabled: true,
      type: 'base'
    },
    {
      id: 'bathymetry',
      name: 'Bathymetry',
      icon: 'water-outline',
      enabled: true,
      type: 'base'
    },
    {
      id: 'wind-vectors',
      name: 'Wind Vectors',
      icon: 'arrow-forward-outline',
      enabled: true,
      type: 'environmental'
    },
    {
      id: 'current-flow',
      name: 'Current Flow',
      icon: 'git-merge-outline',
      enabled: true,
      type: 'environmental'
    },
    {
      id: 'laylines',
      name: 'Laylines',
      icon: 'trending-up-outline',
      enabled: false,
      type: 'tactical'
    },
    {
      id: 'start-strategy',
      name: 'Start Strategy',
      icon: 'flag-outline',
      enabled: false,
      type: 'tactical'
    }
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      initRunIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!isWeb || !courseExtraction) return;

    let cancelled = false;
    const runId = ++initRunIdRef.current;
    styleIndexRef.current = 0;
    setIsMapLoaded(false);
    setMapError(null);
    void initializeMap(() => cancelled || !isMountedRef.current || initRunIdRef.current !== runId);

    return () => {
      cancelled = true;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          logger.debug('Failed to remove map instance cleanly during cleanup');
        } finally {
          mapInstanceRef.current = null;
        }
      }
    };
    // initializeMap depends on many local helpers in this file and is intentionally scoped here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseExtraction, venue]);

  const initializeMap = async (isCancelled: () => boolean) => {
    try {
      // Dynamic import for web-only MapLibre GL JS
      let maplibregl: any = null;
      try {
        const maplibreModule = await import('maplibre-gl');
        maplibregl = (maplibreModule as any).default || maplibreModule;
      } catch (_moduleError) {
        ensureMapLibreCss('maplibre-gl-css-race-course-3d');
        await ensureMapLibreScript('maplibre-gl-script-race-course-3d');
        maplibregl = typeof window !== 'undefined' ? (window as any).maplibregl : null;
      }
      const MapConstructor = maplibregl?.Map;
      if (!MapConstructor) {
        throw new Error('MapLibre Map constructor is unavailable');
      }

      if (!mapContainerRef.current || isCancelled()) return;

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          logger.debug('Failed to remove previous map instance');
        } finally {
          mapInstanceRef.current = null;
        }
      }

      const map = new MapConstructor({
        container: mapContainerRef.current,
        style: MAP_STYLE_CANDIDATES[styleIndexRef.current],
        center: getCourseCenter(),
        zoom: 12,
        pitch: 45, // 3D perspective
        bearing: 0
      });

      mapInstanceRef.current = map;
      let didLoad = false;
      loadTimeoutRef.current = setTimeout(() => {
        if (didLoad || isCancelled()) return;
        setMapError('Map unavailable right now.');
        setIsMapLoaded(false);
      }, 8000);

      map.on('load', () => {
        didLoad = true;
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        if (isCancelled()) return;
        setIsMapLoaded(true);
        setMapError(null);
        addRaceMarks(map);
        addEnvironmentalLayers(map);
        addTacticalLayers(map);

      });

      map.on('error', (event: any) => {
        logger.warn('RaceCourseVisualization3D map error', {
          message: event?.error?.message
        });
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        if (isCancelled()) return;
        if (!didLoad && styleIndexRef.current + 1 < MAP_STYLE_CANDIDATES.length) {
          styleIndexRef.current += 1;
          try {
            map.setStyle(MAP_STYLE_CANDIDATES[styleIndexRef.current] as any);
            return;
          } catch (styleError) {
            logger.warn('RaceCourseVisualization3D fallback style failed', styleError);
          }
        }
        if (didLoad) {
          // Ignore non-fatal source/tile errors after first successful load.
          return;
        }
        setMapError('Unable to load map data.');
        setIsMapLoaded(false);
      });

      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['race-marks-layer']
        });

        if (features.length > 0) {
          const markName = features[0].properties?.name;
          if (markName) {
            setSelectedMark(markName);
            onMarkSelected?.(markName);
          }
        }
      });

    } catch (error) {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      logger.warn('RaceCourseVisualization3D map initialization failed', error);
      if (isCancelled()) return;
      setMapError('Map initialization failed.');
      setIsMapLoaded(false);
    }
  };

  const getExplicitMarkCoordinates = (mark: any): [number, number] | null => {
    const positionLat = mark?.position?.latitude ?? mark?.position?.lat;
    const positionLng = mark?.position?.longitude ?? mark?.position?.lng;
    if (typeof positionLat === 'number' && typeof positionLng === 'number') {
      return [positionLng, positionLat];
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

    return null;
  };

  const getCourseCenter = (): [number, number] => {
    const markCoords = courseExtraction.marks
      .map((mark) => getExplicitMarkCoordinates(mark))
      .filter(Boolean) as [number, number][];

    if (markCoords.length > 0) {
      const lngs = markCoords.map((coord) => coord[0]);
      const lats = markCoords.map((coord) => coord[1]);
      return [
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ];
    }

    if (courseExtraction.marks.length === 0) {
      return [-122.4, 37.8];
    }

    const venueCoordinates: Record<string, [number, number]> = {
      'hong-kong': [114.1694, 22.3193],
      'san-francisco': [-122.4194, 37.7749],
      'cowes': [-1.3005, 50.7645],
      'sydney': [151.2093, -33.8688]
    };

    return venueCoordinates[venue] || [-122.4, 37.8];
  };

  const addRaceMarks = (map: any) => {
    if (!courseExtraction.marks.length) return;

    // Generate mark features from course extraction
    const markFeatures = courseExtraction.marks.map((mark, index) => ({
      type: 'Feature',
      properties: {
        name: mark.name,
        type: mark.type,
        description: mark.position?.description || 'Race mark'
      },
      geometry: {
        type: 'Point',
        coordinates: getMarkCoordinates(mark, index)
      }
    }));

    const marksGeojson = {
      type: 'FeatureCollection',
      features: markFeatures
    };
    if (map.getSource('race-marks')) {
      map.getSource('race-marks').setData(marksGeojson);
    } else {
      map.addSource('race-marks', {
        type: 'geojson',
        data: marksGeojson
      });
    }

    // Add 3D mark symbols
    if (!map.getLayer('race-marks-layer')) {
      map.addLayer({
        id: 'race-marks-layer',
        type: 'symbol',
        source: 'race-marks',
        layout: {
          'icon-image': 'custom-marker', // Custom marker would be loaded
          'icon-size': 1.5,
          'icon-allow-overlap': true,
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-transform': 'uppercase',
          'text-offset': [0, 2],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': MARK_TEXT_COLOR_EXPRESSION as any,
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }

  };

  const getMarkCoordinates = (mark: any, index: number): [number, number] => {
    const explicitCoords = getExplicitMarkCoordinates(mark);
    if (explicitCoords) return explicitCoords;

    // Fallback to synthetic course layout when extraction lacks coordinates
    const center = getCourseCenter();
    const offsets: Record<string, [number, number]> = {
      'start': [0, 0],
      'windward': [0, 0.01],
      'leeward': [0, -0.01],
      'finish': [0.005, 0]
    };

    const offset = offsets[mark.type] || [index * 0.005, index * 0.005];
    return [center[0] + offset[0], center[1] + offset[1]];
  };

  const addEnvironmentalLayers = (map: any) => {
    if (!conditions) return;

    // Add wind vectors
    if (conditions.wind) {
      addWindVectors(map, conditions.wind);
    }

    // Add current flow
    if (conditions.current) {
      addCurrentFlow(map, conditions.current);
    }

    // Add wave patterns
    if (conditions.waves) {
      addWavePatterns(map, conditions.waves);
    }
  };

  const addWindVectors = (map: any, wind: any) => {
    // Sample wind vector implementation
    const center = getCourseCenter();
    const vectors = [];

    // Generate grid of wind vectors
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        vectors.push({
          type: 'Feature',
          properties: {
            speed: wind.speed,
            direction: wind.direction
          },
          geometry: {
            type: 'Point',
            coordinates: [center[0] + i * 0.005, center[1] + j * 0.005]
          }
        });
      }
    }

    const windGeojson = {
      type: 'FeatureCollection',
      features: vectors
    };
    if (map.getSource('wind-vectors')) {
      map.getSource('wind-vectors').setData(windGeojson);
    } else {
      map.addSource('wind-vectors', {
        type: 'geojson',
        data: windGeojson
      });
    }

    if (!map.getLayer('wind-arrows')) {
      map.addLayer({
        id: 'wind-arrows',
        type: 'symbol',
        source: 'wind-vectors',
        layout: {
          'icon-image': 'wind-arrow',
          'icon-size': 0.8,
          'icon-rotate': ['get', 'direction'],
          'icon-allow-overlap': true
        },
        paint: {
          'icon-opacity': 0.7
        }
      });
    }
  };

  const addCurrentFlow = (_map: any, _current: any) => {
    // Current flow visualization would be implemented here

  };

  const addWavePatterns = (_map: any, _waves: any) => {
    // Wave pattern visualization would be implemented here
  };

  const addTacticalLayers = (map: any) => {
    if (!strategy) return;

    // Add laylines based on wind conditions
    if (conditions?.wind && layerControls.find(l => l.id === 'laylines')?.enabled) {
      addLaylines(map, conditions.wind);
    }

    // Add start strategy visualization
    if (strategy.strategy.startStrategy && layerControls.find(l => l.id === 'start-strategy')?.enabled) {
      addStartStrategy(map, strategy.strategy.startStrategy);
    }
  };

  const addLaylines = (_map: any, _wind: any) => {
    // Layline calculation and visualization
  };

  const addStartStrategy = (_map: any, _startStrategy: any) => {
    // Start strategy visualization

  };

  const toggleLayer = (layerId: string) => {
    const updatedLayers = layerControls.map(layer => {
      if (layer.id === layerId) {
        const newEnabled = !layer.enabled;
        onTacticalLayerToggle?.(layerId, newEnabled);
        return { ...layer, enabled: newEnabled };
      }
      return layer;
    });
    setLayerControls(updatedLayers);

    // Update map layers
    if (mapInstanceRef.current && isMapLoaded) {
      const layer = updatedLayers.find(l => l.id === layerId);
      if (layer) {
        // Toggle layer visibility on map
        try {
          mapInstanceRef.current.setLayoutProperty(
            `${layerId}-layer`,
            'visibility',
            layer.enabled ? 'visible' : 'none'
          );
        } catch (error) {
          logger.debug(`Layer ${layerId} not found on map`, error);
        }
      }
    }
  };

  const getLayerColor = (type: string): string => {
    switch (type) {
      case 'base': return '#0066CC';
      case 'environmental': return '#00CC44';
      case 'tactical': return '#FF4444';
      default: return '#666666';
    }
  };

  return (
    <View style={styles.container}>
      {/* 3D Map Container */}
      <View style={styles.mapContainer}>
        {isWeb ? (
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 12
            }}
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <Ionicons name="map-outline" size={64} color="#0066CC" />
            <Text style={styles.fallbackText}>
              3D Course Visualization
            </Text>
            <Text style={styles.fallbackSubtext}>
              Available on web platform
            </Text>
          </View>
        )}

        {!isMapLoaded && !mapError && isWeb && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Loading 3D Course...</Text>
          </View>
        )}
        {mapError && isWeb && (
          <View style={styles.errorOverlay}>
            <Ionicons name="warning-outline" size={24} color="#a35f00" />
            <Text style={styles.errorText}>Map unavailable</Text>
            <Text style={styles.errorSubtext}>{mapError}</Text>
          </View>
        )}
      </View>

      {/* Layer Controls */}
      <View style={styles.layerControls}>
        <Text style={styles.layerTitle}>Map Layers</Text>
        <View style={styles.layerGrid}>
          {layerControls.map(layer => (
            <TouchableOpacity
              key={layer.id}
              style={[
                styles.layerButton,
                layer.enabled && styles.layerButtonActive,
                { borderColor: getLayerColor(layer.type) }
              ]}
              onPress={() => toggleLayer(layer.id)}
            >
              <Ionicons
                name={layer.icon as any}
                size={16}
                color={layer.enabled ? getLayerColor(layer.type) : '#666'}
              />
              <Text style={[
                styles.layerButtonText,
                layer.enabled && { color: getLayerColor(layer.type) }
              ]}>
                {layer.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Course Information Panel */}
      <View style={styles.courseInfo}>
        <Text style={styles.courseInfoTitle}>Course: {courseExtraction.courseLayout.type}</Text>
        <Text style={styles.courseInfoText}>
          {courseExtraction.marks.length} marks • {courseExtraction.courseLayout.description}
        </Text>
        {selectedMark && (
          <Text style={styles.selectedMarkText}>
            Selected: {selectedMark}
          </Text>
        )}
      </View>

      {/* Strategy Confidence Indicator */}
      {strategy && (
        <View style={styles.confidenceIndicator}>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                { width: `${strategy.confidence * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.confidenceText}>
            Strategy Confidence: {Math.round(strategy.confidence * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e3a5f',
    position: 'relative',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
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
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 248, 235, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    paddingHorizontal: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#804600',
  },
  errorSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9a6f2f',
    textAlign: 'center',
  },
  layerControls: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px',
    elevation: 3,
  },
  layerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
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
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    gap: 6,
  },
  layerButtonActive: {
    backgroundColor: '#F0F8FF',
  },
  layerButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  courseInfo: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px',
    elevation: 3,
  },
  courseInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  courseInfoText: {
    fontSize: 14,
    color: '#666',
  },
  selectedMarkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginTop: 8,
  },
  confidenceIndicator: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px',
    elevation: 3,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#00CC44',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});

export default RaceCourseVisualization3D;
