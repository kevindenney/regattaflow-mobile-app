/**
 * 3D Race Course Visualization Component
 * Renders AI-extracted race courses in 3D using MapLibre GL JS
 * Part of the "OnX Maps for Sailing" experience
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createLogger } from '@/lib/utils/logger';
import type {
  RaceCourseExtraction,
  RaceStrategy,
  RaceConditions
} from '@/services/ai/RaceStrategyEngine';

// Web-compatible MapLibre GL JS import for Expo

const logger = createLogger('RaceCourseVisualization3D');
const isWeb = typeof window !== 'undefined';

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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const RaceCourseVisualization3D: React.FC<RaceCourseVisualization3DProps> = ({
  courseExtraction,
  strategy,
  conditions,
  venue = 'unknown',
  onMarkSelected,
  onTacticalLayerToggle
}) => {
  const mapRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
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
    if (isWeb && courseExtraction) {
      initializeMap();
    }
  }, [courseExtraction]);

  const initializeMap = async () => {
    try {
      // Dynamic import for web-only MapLibre GL JS
      const maplibregl = await import('maplibre-gl');

      if (!mapRef.current) return;

      const map = new maplibregl.Map({
        container: mapRef.current,
        style: {
          version: 8,
          sources: {
            'raster-tiles': {
              type: 'raster',
              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: 'background',
              type: 'background',
              paint: {
                'background-color': '#1e3a5f'
              }
            },
            {
              id: 'raster-layer',
              type: 'raster',
              source: 'raster-tiles',
              paint: {
                'raster-opacity': 0.7
              }
            }
          ]
        },
        center: getCourseCenter(),
        zoom: 12,
        pitch: 45, // 3D perspective
        bearing: 0
      });

      map.on('load', () => {
        setIsMapLoaded(true);
        addRaceMarks(map);
        addEnvironmentalLayers(map);
        addTacticalLayers(map);

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

    }
  };

  const getCourseCenter = (): [number, number] => {
    // Calculate center point from course marks
    if (courseExtraction.marks.length === 0) {
      return [-122.4, 37.8]; // Default to San Francisco Bay
    }

    // For now, return a default center - in production this would calculate from mark positions
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

    map.addSource('race-marks', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: markFeatures
      }
    });

    // Add 3D mark symbols
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
        'text-color': getMarkColor,
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

  };

  const getMarkCoordinates = (mark: any, index: number): [number, number] => {
    // In a real implementation, this would use the extracted GPS coordinates
    // For now, generate a sample course layout
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

  const getMarkColor = (markType: string): string => {
    const colors: Record<string, string> = {
      'start': '#00FF00',
      'windward': '#FF0000',
      'leeward': '#0000FF',
      'finish': '#FFD700',
      'wing': '#FF8000',
      'gate': '#8000FF'
    };
    return colors[markType] || '#FFFFFF';
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

    map.addSource('wind-vectors', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: vectors
      }
    });

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
  };

  const addCurrentFlow = (map: any, current: any) => {
    // Current flow visualization would be implemented here

  };

  const addWavePatterns = (map: any, waves: any) => {
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

  const addLaylines = (map: any, wind: any) => {
    // Layline calculation and visualization
  };

  const addStartStrategy = (map: any, startStrategy: any) => {
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
    if (mapRef.current && isMapLoaded) {
      const layer = updatedLayers.find(l => l.id === layerId);
      if (layer) {
        // Toggle layer visibility on map
        try {
          mapRef.current.setLayoutProperty(
            `${layerId}-layer`,
            'visibility',
            layer.enabled ? 'visible' : 'none'
          );
        } catch (error) {
          logger.debug(`Layer ${layerId} not found on map`);
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
            <Text style={styles.fallbackText}>
              3D Course Visualization
            </Text>
            <Text style={styles.fallbackSubtext}>
              Available on web platform
            </Text>
          </View>
        )}

        {!isMapLoaded && isWeb && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Loading 3D Course...</Text>
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