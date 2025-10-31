// @ts-nocheck

import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Animated, Platform, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { Map3DConfig, RaceMark, WeatherConditions } from '@/lib/types/map';
import { createLogger } from '@/lib/utils/logger';

interface Map3DViewProps {
  config?: Partial<Map3DConfig>
  marks?: RaceMark[]
  weather?: WeatherConditions
  onMarkPress?: (mark: RaceMark) => void
  onMapPress?: (coordinates: { latitude: number; longitude: number }) => void
}

const logger = createLogger('Map3DView');
const defaultConfig: Map3DConfig = {
  elevation: {
    exaggeration: 1.5,
    seaFloorRendering: true,
    contourLines: {
      depths: [2, 5, 10, 20, 50, 100],
      colors: ['#E3F2FD', '#90CAF9', '#42A5F5', '#1E88E5', '#1565C0', '#0D47A1']
    }
  },
  camera: {
    pitch: 45,
    bearing: 0,
    zoom: 15,
    animation: 'smooth',
    followMode: 'off'
  },
  layers: {
    nauticalChart: true,
    satellite: false,
    bathymetry: true,
    currentFlow: true,
    windField: true,
    hazards: true
  }
};

export function Map3DView({ config, marks = [], weather, onMarkPress, onMapPress }: Map3DViewProps) {
  const [viewConfig, setViewConfig] = useState<Map3DConfig>({
    ...defaultConfig,
    ...config,
  });

  // Add map interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{x: number, y: number} | null>(null);

  // Add tile loading state
  const [tilesLoaded, setTilesLoaded] = useState(0);
  const [totalTiles, setTotalTiles] = useState(12); // 3x2 grid = 6 tiles, each has base + nautical overlay = 12 total

  // Map center and zoom state for real interactivity
  const [mapCenter, setMapCenter] = useState({ lat: 37.8, lon: -122.4 });
  const [mapZoom, setMapZoom] = useState(10);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });

  // Enhanced wind visualization state
  const [windParticles, setWindParticles] = useState<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    intensity: number;
  }[]>([]);

  // Advanced weather layers state
  const [weatherLayers, setWeatherLayers] = useState({
    windField: true,
    pressure: false,
    temperature: false,
    precipitation: false,
    windGusts: true,
    thermalLayer: false
  });

  // Measurement tools state - OnX Maps inspired
  const [measurementMode, setMeasurementMode] = useState<'off' | 'distance' | 'area'>('off');
  const [measurementPoints, setMeasurementPoints] = useState<{x: number, y: number, lat?: number, lon?: number}[]>([]);
  const [measurements, setMeasurements] = useState<{
    distance?: string;
    bearing?: string;
    area?: string;
  }>({});

  // Debug logging

  const { width, height } = Dimensions.get('window');

  // Enhanced wind particle system
  React.useEffect(() => {
    if (!weather || !weatherLayers.windField) return;

    const generateWindParticles = () => {
      const particles = [];
      const windSpeed = weather.wind.speed;
      const windDirection = weather.wind.direction;
      const particleCount = Math.min(50, Math.max(10, windSpeed * 2));

      for (let i = 0; i < particleCount; i++) {
        const angle = (windDirection + (Math.random() - 0.5) * 30) * Math.PI / 180;
        particles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: Math.cos(angle) * (windSpeed * 0.3 + Math.random() * 0.2),
          vy: Math.sin(angle) * (windSpeed * 0.3 + Math.random() * 0.2),
          life: 1.0,
          intensity: Math.min(1.0, windSpeed / 25)
        });
      }
      setWindParticles(particles);
    };

    generateWindParticles();

    // DISABLED: Animation causing infinite render loop
    // Static particles - no animation to prevent re-renders
  }, [weather, weatherLayers.windField]);

  // Toggle weather layers
  const toggleWeatherLayer = (layer: keyof typeof weatherLayers) => {
    setWeatherLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  // Measurement calculation functions
  const calculateDistance = (point1: {x: number, y: number}, point2: {x: number, y: number}) => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    // Convert to approximate nautical miles (rough conversion for demo)
    const nauticalMiles = (pixelDistance * 0.01 * viewConfig.camera.zoom).toFixed(2);
    return `${nauticalMiles} nm`;
  };

  const calculateBearing = (point1: {x: number, y: number}, point2: {x: number, y: number}) => {
    const dx = point2.x - point1.x;
    const dy = point1.y - point2.y; // Inverted for screen coordinates
    let bearing = Math.atan2(dx, dy) * 180 / Math.PI;
    if (bearing < 0) bearing += 360;
    return `${Math.round(bearing)}°`;
  };

  const handleMeasurementClick = (x: number, y: number) => {
    if (measurementMode === 'off') return;

    const newPoint = { x, y };
    setMeasurementPoints(prev => {
      const updated = [...prev, newPoint];

      if (updated.length >= 2) {
        const distance = calculateDistance(updated[0], updated[1]);
        const bearing = calculateBearing(updated[0], updated[1]);
        setMeasurements({ distance, bearing });
      }

      return updated;
    });
  };

  const clearMeasurements = () => {
    setMeasurementPoints([]);
    setMeasurements({});
  };

  const toggleMeasurementMode = (mode: 'distance' | 'area') => {
    if (measurementMode === mode) {
      setMeasurementMode('off');
      clearMeasurements();
    } else {
      setMeasurementMode(mode);
      clearMeasurements();
    }
  };

  const toggleLayer = (layer: keyof Map3DConfig['layers']) => {
    const oldState = viewConfig.layers[layer];
    setViewConfig(prev => {
      const newConfig = {
        ...prev,
        layers: {
          ...prev.layers,
          [layer]: !prev.layers[layer]
        }
      };

      return newConfig;
    });
  };

  const toggle3D = () => {
    logger.debug('Toggling 3D mode from pitch:', viewConfig.camera.pitch);
    setViewConfig(prev => ({
      ...prev,
      camera: {
        ...prev.camera,
        pitch: prev.camera.pitch > 0 ? 0 : 45
      }
    }));
  };

  const is3DMode = viewConfig.camera.pitch > 0;

  const handleCompass = () => {
    logger.debug('Current bearing:', viewConfig.camera.bearing);

    // Reset map offset to center
    setMapOffset({ x: 0, y: 0 });

    setViewConfig(prev => {
      const newConfig = {
        ...prev,
        camera: {
          ...prev.camera,
          bearing: 0
        }
      };
      return newConfig;
    });
  };

  const handleGPS = () => {

    logger.debug('Current map state:', { mapCenter, mapZoom, mapOffset });

    // Reset map to default San Francisco Bay location
    setMapCenter({ lat: 37.8, lon: -122.4 });
    setMapZoom(15);
    setMapOffset({ x: 0, y: 0 });

    // Also update viewConfig for UI consistency
    setViewConfig(prev => {
      const newConfig = {
        ...prev,
        camera: {
          ...prev.camera,
          zoom: 15,
          bearing: 0,
          pitch: prev.camera.pitch
        }
      };

      return newConfig;
    });
  };

  const handleRaceMarkPress = (mark: RaceMark) => {
    logger.debug('Race mark pressed:', mark.name);
    onMarkPress?.(mark);
  };

  return (
    <View style={[styles.container, { width, height: height * 0.8 }]}>
      {/* Map Container - Enhanced nautical chart visualization */}
      <View style={[styles.mapPlaceholder, {
        backgroundColor: viewConfig.layers.nauticalChart
          ? '#E8F4FD'
          : '#E3F2FD',
        transform: is3DMode ? [{ perspective: 1000 }, { rotateX: '15deg' }] : []
      }]}
      onTouchStart={(e) => {

      }}
      onTouchMove={(e) => {

      }}
      onMouseDown={(e) => {
        const clientX = e.nativeEvent.clientX;
        const clientY = e.nativeEvent.clientY;

        // Handle measurement clicks
        if (measurementMode !== 'off') {
          const rect = e.currentTarget.getBoundingClientRect();
          const relativeX = ((clientX - rect.left) / rect.width) * 100;
          const relativeY = ((clientY - rect.top) / rect.height) * 100;
          handleMeasurementClick(relativeX, relativeY);
        } else {
          setIsDragging(true);
          setLastMousePosition({ x: clientX, y: clientY });
        }
      }}
      onMouseMove={(e) => {
        if (isDragging && lastMousePosition) {
          const clientX = e.nativeEvent.clientX;
          const clientY = e.nativeEvent.clientY;
          const deltaX = clientX - lastMousePosition.x;
          const deltaY = clientY - lastMousePosition.y;

          // Pan the map by updating the offset
          setMapOffset(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY
          }));

          setLastMousePosition({ x: clientX, y: clientY });
        }
      }}
      onMouseUp={() => {

        setIsDragging(false);
        setLastMousePosition(null);
      }}
      onWheel={(e) => {
        const delta = e.nativeEvent.deltaY;
        const zoomChange = delta > 0 ? -1 : 1;

        // Update the actual map zoom state (affects tile generation)
        setMapZoom(prev => Math.max(5, Math.min(18, prev + zoomChange)));

        // Also update the viewConfig zoom for UI consistency
        setViewConfig(prev => ({
          ...prev,
          camera: {
            ...prev.camera,
            zoom: Math.max(5, Math.min(18, prev.camera.zoom + zoomChange))
          }
        }));
      }}
      >
        <View style={[styles.waterLayer, { transform: is3DMode ? [{ scaleY: 0.8 }] : [] }]}>
          {/* Real Nautical Chart Base Layer */}
          <View style={styles.nauticalChartBase}>
            {/* OpenSeaMap Chart Tiles */}
            <View style={styles.chartTileLayer}>
              {/* Base Map Tiles (OpenStreetMap for base layer) */}
              {(() => {
                // Use dynamic map state instead of hardcoded values
                const zoom = mapZoom;
                const centerLat = mapCenter.lat;
                const centerLon = mapCenter.lon;

                // Convert lat/lon to tile coordinates
                const centerX = Math.floor((centerLon + 180) / 360 * Math.pow(2, zoom));
                const centerY = Math.floor((1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

                const tiles = [];

                // Generate a 3x2 grid of tiles
                for (let dx = -1; dx <= 1; dx++) {
                  for (let dy = -1; dy <= 0; dy++) {
                    const tileX = centerX + dx;
                    const tileY = centerY + dy;

                    tiles.push({
                      x: tileX,
                      y: tileY,
                      z: zoom,
                      left: (dx + 1) * 256 + mapOffset.x,
                      top: (dy + 1) * 256 + mapOffset.y,
                    });
                  }
                }

                return tiles;
              })().map((tile, index) => (
                <View key={`tile-container-${tile.x}-${tile.y}`} style={{ position: 'absolute', left: tile.left, top: tile.top }}>
                  {/* Base map layer */}
                  <Image
                    key={`base-${tile.x}-${tile.y}-${tile.z}`}
                    source={{
                      uri: `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`
                    }}
                    style={[styles.chartTile, {
                      width: 256,
                      height: 256,
                      zIndex: 1,
                    }]}
                    onLoad={() => {

                      setTilesLoaded(prev => prev + 1);
                    }}
                  />

                  {/* Nautical overlay layer */}
                  <Image
                    key={`nautical-${tile.x}-${tile.y}-${tile.z}`}
                    source={{
                      uri: `https://tiles.openseamap.org/seamark/${tile.z}/${tile.x}/${tile.y}.png`
                    }}
                    style={[styles.chartTile, {
                      width: 256,
                      height: 256,
                      zIndex: 2,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }]}
                    onLoad={() => {

                      setTilesLoaded(prev => prev + 1);
                    }}
                    onError={(error) => {
                    }}
                  />
                </View>
              ))}

              {/* Fallback base map when tiles are loading */}
              {tilesLoaded < totalTiles && (
                <View style={styles.fallbackMap}>
                  <ThemedText style={styles.fallbackText}>
                    🌊 Loading San Francisco Bay Nautical Chart... ({tilesLoaded}/{totalTiles})
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Basic depth soundings overlay - always visible */}
              <View>
                <ThemedText style={[styles.fixedDepthSounding, { top: '25%', left: '30%' }]}>42m</ThemedText>
                <ThemedText style={[styles.fixedDepthSounding, { top: '45%', left: '60%' }]}>38m</ThemedText>
                <ThemedText style={[styles.fixedDepthSounding, { top: '65%', left: '40%' }]}>51m</ThemedText>
                <ThemedText style={[styles.fixedDepthSounding, { top: '20%', left: '70%' }]}>35m</ThemedText>
                <ThemedText style={[styles.fixedDepthSounding, { top: '80%', left: '20%' }]}>47m</ThemedText>
                <ThemedText style={[styles.fixedDepthSounding, { top: '55%', left: '15%' }]}>29m</ThemedText>
                <ThemedText style={[styles.fixedDepthSounding, { top: '30%', left: '85%' }]}>33m</ThemedText>
                <ThemedText style={[styles.fixedDepthSounding, { top: '75%', left: '65%' }]}>44m</ThemedText>
                <ThemedText style={[styles.fixedDepthSounding, { top: '35%', left: '50%' }]}>36m</ThemedText>
                <ThemedText style={[styles.fixedDepthSounding, { top: '60%', left: '25%' }]}>49m</ThemedText>

                {/* Show key navigation features */}
                <View style={styles.navigationFeature}>
                  <ThemedText style={styles.featureLabel}>⚓ San Francisco Bay</ThemedText>
                </View>
              </View>

              {/* Chart information overlay */}
              <View style={styles.chartInfo}>
                <ThemedText style={styles.chartInfoText}>San Francisco Bay</ThemedText>
                <ThemedText style={styles.chartInfoText}>Chart: 18649</ThemedText>
                <ThemedText style={styles.chartInfoText}>Depths in Meters</ThemedText>
              </View>
            </View>
          </View>

          <ThemedText style={styles.mapLabel}>
            🌊 {is3DMode ? '3D' : '2D'} Nautical Chart
          </ThemedText>

          {/* Enhanced Debug Info Overlay */}
          <View style={styles.debugOverlay}>
            <ThemedText style={[styles.debugText, { fontSize: 14, fontWeight: '800' }]}>
              ⚡ REGATTAFLOW DEBUG
            </ThemedText>
            <ThemedText style={styles.debugText}>
              🗺️ Active Layers: {viewConfig.layers.windField ? '💨Wind ' : ''}
              {viewConfig.layers.currentFlow ? '🌊Current ' : ''}
              {viewConfig.layers.bathymetry ? '🏔️Depth ' : ''}
              {weatherLayers.pressure ? '🌐Pressure ' : ''}
              {weatherLayers.thermalLayer ? '🔥Thermal' : ''}
            </ThemedText>
            <ThemedText style={styles.debugText}>
              ⚡ Weather: {weather ? `${weather.wind.speed}kts @ ${weather.wind.direction}°` : 'No Data'}
            </ThemedText>
            <ThemedText style={styles.debugText}>
              📐 View Mode: {is3DMode ? '🔬 3D Enhanced' : '📱 2D Standard'} | 🧭 {viewConfig.camera.bearing}°
            </ThemedText>
            <ThemedText style={styles.debugText}>
              📏 Measurement Tools: {measurementMode !== 'off' ? `✅ ACTIVE (${measurementMode})` : '❌ STANDBY'}
            </ThemedText>
            <ThemedText style={styles.debugText}>
              🌬️ Wind Particles: {windParticles.length} active
            </ThemedText>
          </View>

          {/* Measurement Overlay */}
          {measurementMode !== 'off' && (
            <View style={styles.measurementOverlay}>
              {measurementPoints.map((point, index) => (
                <View
                  key={index}
                  style={[
                    styles.measurementPoint,
                    {
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                    }
                  ]}
                />
              ))}

              {measurementPoints.length === 2 && (
                <>
                  <View
                    style={[
                      styles.measurementLine,
                      {
                        left: `${measurementPoints[0].x}%`,
                        top: `${measurementPoints[0].y}%`,
                        width: Math.sqrt(
                          Math.pow(measurementPoints[1].x - measurementPoints[0].x, 2) +
                          Math.pow(measurementPoints[1].y - measurementPoints[0].y, 2)
                        ) + '%',
                        transform: [{
                          rotate: Math.atan2(
                            measurementPoints[1].y - measurementPoints[0].y,
                            measurementPoints[1].x - measurementPoints[0].x
                          ) + 'rad'
                        }]
                      }
                    ]}
                  />

                  {measurements.distance && (
                    <View style={styles.measurementDisplay}>
                      <ThemedText style={styles.measurementText}>
                        📏 {measurements.distance}
                      </ThemedText>
                      <ThemedText style={styles.measurementText}>
                        🧭 {measurements.bearing}
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Enhanced nautical chart elements */}
          <View style={styles.nauticalElements}>
            {/* Navigation lines - Enhanced visibility */}
            <View style={[styles.navigationLines, { borderWidth: 2, borderColor: 'rgba(0, 102, 204, 0.6)' }]} />
            {/* Compass rose - Enhanced */}
            <View style={[styles.compassRose, { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderWidth: 2, borderColor: '#0066CC' }]}>
              <ThemedText style={styles.compassText}>⊕</ThemedText>
            </View>

            {/* Enhanced 3D Bathymetry Contours - OnX Inspired */}
            {viewConfig.layers.bathymetry && (
              <View style={styles.bathymetryLayer}>
                {[2, 5, 10, 20, 50].map((depth, index) => (
                  <View
                    key={depth}
                    style={[
                      styles.depthContour,
                      {
                        opacity: 0.4 + (index * 0.1),
                        borderColor: `hsla(${200 + index * 15}, 70%, ${70 - index * 10}%, 0.8)`,
                        borderWidth: Math.max(1, 3 - index * 0.5),
                        width: `${90 - index * 15}%`,
                        height: `${90 - index * 15}%`,
                        top: `${5 + index * 7.5}%`,
                        left: `${5 + index * 7.5}%`,
                      }
                    ]}
                  >
                    <ThemedText style={[styles.depthLabel, {
                      fontSize: Math.max(8, 12 - index),
                      color: `hsla(${200 + index * 15}, 70%, ${30 - index * 5}%, 1)`
                    }]}>
                      {depth}m
                    </ThemedText>
                  </View>
                ))}

                {/* Shallow water warning areas */}
                <View style={[styles.shallowWaterZone, {
                  backgroundColor: 'rgba(255, 200, 0, 0.2)',
                  borderColor: 'rgba(255, 200, 0, 0.8)'
                }]}>
                  <ThemedText style={styles.warningText}>⚠️ Shallow</ThemedText>
                </View>
              </View>
            )}
            {/* Depth soundings - Enhanced visibility */}
            <ThemedText style={[styles.depthSounding, { top: '25%', left: '30%', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderWidth: 1, borderColor: '#0066CC' }]}>12m</ThemedText>
            <ThemedText style={[styles.depthSounding, { top: '45%', left: '60%', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderWidth: 1, borderColor: '#0066CC' }]}>8m</ThemedText>
            <ThemedText style={[styles.depthSounding, { top: '65%', left: '40%', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderWidth: 1, borderColor: '#0066CC' }]}>15m</ThemedText>
          </View>

          {/* Enhanced depth contours */}
          {viewConfig.layers.bathymetry && (
            <View style={[styles.depthContours, {
              backgroundColor: 'rgba(0, 0, 255, 0.3)' // More visible debug background
            }]}>
              {viewConfig.elevation.contourLines.depths.map((depth, index) => (
                <View
                  key={depth}
                  style={[
                    styles.contourLine,
                    {
                      backgroundColor: viewConfig.elevation.contourLines.colors[index],
                      opacity: 0.6, // Increased visibility
                      borderWidth: 1,
                      borderColor: viewConfig.elevation.contourLines.colors[index],
                      transform: is3DMode
                        ? [{ scale: 1 - (index * 0.08) }, { translateZ: index * -5 }]
                        : [{ scale: 1 - (index * 0.1) }]
                    }
                  ]}
                />
              ))}
            </View>
          )}

          {/* Wind visualization */}
          {viewConfig.layers.windField && weather && (
            <View style={[styles.windLayer, {
              opacity: 1,
              zIndex: 60, // Above nautical chart and boundaries
              backgroundColor: 'transparent' // Let chart show through
            }]}>
              <View style={styles.windInfoContainer}>
                <ThemedText style={styles.windInfo}>
                  🌬️ Wind: {weather.wind.speed}kts @ {weather.wind.direction}°
                </ThemedText>
              </View>
              {/* Enhanced 3D Wind Particle System */}
              <View style={styles.windParticles}>
                {windParticles.map((particle) => (
                  <View
                    key={particle.id}
                    style={[
                      styles.windParticle,
                      {
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        opacity: Math.max(0.6, particle.life * particle.intensity), // More visible
                        backgroundColor: `hsla(${15 + particle.intensity * 20}, 90%, ${60 + particle.intensity * 15}%, 1)`,
                        width: 8 + particle.intensity * 6, // Larger particles
                        height: 8 + particle.intensity * 6,
                        borderRadius: (8 + particle.intensity * 6) / 2,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.8)', // White border for contrast
                        transform: [
                          {
                            translateX: particle.vx * 3
                          },
                          {
                            translateY: particle.vy * 3
                          }
                        ]
                      }
                    ]}
                  />
                ))}
              </View>

              {/* Wind Strength Indicator */}
              {weatherLayers.windGusts && (
                <View style={[styles.windStrengthIndicator, {
                  opacity: Math.min(1, weather.wind.speed / 30)
                }]}>
                  <ThemedText style={styles.windStrengthText}>
                    {weather.wind.speed > 15 ? '💨💨' : weather.wind.speed > 8 ? '💨' : '🍃'}
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          {/* Enhanced Tidal Current Stream Visualization */}
          {viewConfig.layers.currentFlow && weather && (
            <View style={[styles.currentLayer, {
              opacity: 1,
              zIndex: 55, // Above nautical chart
            }]}>
              {/* Tidal Current Flow Arrows - OnX Style */}
              <View style={styles.currentFlowArrows}>
                {[
                  { x: 20, y: 30, strength: 0.8 },
                  { x: 45, y: 25, strength: 1.2 },
                  { x: 70, y: 35, strength: 0.6 },
                  { x: 30, y: 55, strength: 1.0 },
                  { x: 60, y: 65, strength: 0.9 },
                  { x: 80, y: 70, strength: 0.7 }
                ].map((current, index) => (
                  <View
                    key={index}
                    style={[
                      styles.currentArrow,
                      {
                        left: `${current.x}%`,
                        top: `${current.y}%`,
                        opacity: current.strength,
                        transform: [
                          { rotate: `${(weather.tide.direction === 'flood' ? 90 : 270) + (Math.random() - 0.5) * 20}deg` },
                          { scale: 0.8 + current.strength * 0.4 }
                        ]
                      }
                    ]}
                  >
                    <ThemedText style={styles.arrowText}>➤</ThemedText>
                  </View>
                ))}
              </View>
              <View style={styles.currentInfoContainer}>
                <ThemedText style={styles.currentInfo}>
                  🌊 Tide: {weather.tide.speed}kts {weather.tide.direction}
                </ThemedText>
              </View>
              {/* Enhanced current arrows */}
              <View style={styles.currentArrows}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ThemedText
                    key={i}
                    style={[
                      styles.currentArrow,
                      {
                        left: `${20 + i * 12}%`,
                        top: `${50 + (i % 2) * 20}%`,
                        fontSize: 16 + (weather.tide.speed * 2), // Larger arrows
                        opacity: 0.7 + (i % 2) * 0.3,
                        color: weather.tide.direction === 'flood' ? '#00AA44' : '#AA4400'
                      }
                    ]}
                  >
                    {weather.tide.direction === 'flood' ? '⬆️' : '⬇️'}
                  </ThemedText>
                ))}
              </View>
            </View>
          )}

          {/* Course Boundaries and Restricted Zones */}
          <View style={styles.courseBoundaries}>
            {/* Start Line */}
            <View style={[styles.startLine, {
              borderColor: '#00FF00',
              borderWidth: 3,
              left: '25%',
              top: '20%',
              width: '35%',
              height: 2,
              backgroundColor: '#00FF00',
            }]}>
              <ThemedText style={[styles.boundaryLabel, { color: '#00FF00' }]}>START LINE</ThemedText>
            </View>

            {/* Course Boundary */}
            <View style={[styles.courseBoundary, {
              borderColor: '#0066FF',
              borderWidth: 2,
              borderStyle: 'dashed',
              left: '15%',
              top: '15%',
              width: '70%',
              height: '60%',
            }]}>
              <ThemedText style={[styles.boundaryLabel, {
                position: 'absolute',
                top: -15,
                left: 5,
                color: '#0066FF',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                paddingHorizontal: 4,
              }]}>RACE AREA</ThemedText>
            </View>

            {/* Restricted Zone */}
            <View style={[styles.restrictedZone, {
              backgroundColor: 'rgba(255, 0, 0, 0.2)',
              borderColor: '#FF0000',
              borderWidth: 2,
              left: '65%',
              top: '35%',
              width: '25%',
              height: '25%',
            }]}>
              <ThemedText style={[styles.boundaryLabel, {
                color: '#FF0000',
                textAlign: 'center',
                marginTop: 10,
                fontWeight: '800',
              }]}>⚠️ NO SAIL ZONE</ThemedText>
            </View>

            {/* Finish Line */}
            <View style={[styles.finishLine, {
              borderColor: '#FFD700',
              borderWidth: 3,
              left: '30%',
              top: '70%',
              width: '25%',
              height: 2,
              backgroundColor: '#FFD700',
            }]}>
              <ThemedText style={[styles.boundaryLabel, { color: '#FFD700' }]}>FINISH LINE</ThemedText>
            </View>
          </View>

          {/* Race marks */}
          {marks.map((mark, index) => (
            <TouchableOpacity
              key={mark.id}
              style={[styles.raceMark, {
                left: `${35 + index * 15}%`,
                top: `${45 + index * 8}%`
              }]}
              onPress={() => handleRaceMarkPress(mark)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.markLabel}>
                {mark.type === 'start' ? '🚩' :
                 mark.type === 'finish' ? '🏁' :
                 mark.type === 'windward' ? '⬆️' :
                 mark.type === 'leeward' ? '⬇️' : '⚪'}
              </ThemedText>
              <ThemedText style={styles.markName}>{mark.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.controls}>
        <View style={styles.controlGroup}>
          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => {
                const newZoom = Math.min(18, mapZoom + 1);
                setMapZoom(newZoom);
                setViewConfig(prev => ({
                  ...prev,
                  camera: { ...prev.camera, zoom: newZoom }
                }));
              }}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.zoomText}>+</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => {
                const newZoom = Math.max(5, mapZoom - 1);
                setMapZoom(newZoom);
                setViewConfig(prev => ({
                  ...prev,
                  camera: { ...prev.camera, zoom: newZoom }
                }));
              }}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.zoomText}>-</ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.controlButton, {
              backgroundColor: is3DMode ? '#0066CC' : '#E0E0E0',
              transform: is3DMode ? [{ scale: 1.1 }] : [{ scale: 1 }]
            }]}
            onPress={toggle3D}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.controlText, { color: is3DMode ? '#FFFFFF' : '#333333' }]}>3D</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, {
              transform: [{ rotate: `${360 - viewConfig.camera.bearing}deg` }]
            }]}
            onPress={handleCompass}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.controlText}>🧭</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleGPS}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.controlText, { fontSize: 14 }]}>📍</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.layerControls}>
          <TouchableOpacity
            style={[styles.layerButton, {
              opacity: viewConfig.layers.windField ? 1 : 0.5,
              backgroundColor: viewConfig.layers.windField ? '#0066CC' : '#FFFFFF'
            }]}
            onPress={() => toggleLayer('windField')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.layerText, { color: viewConfig.layers.windField ? '#FFFFFF' : '#333333' }]}>Wind</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.layerButton, {
              opacity: viewConfig.layers.currentFlow ? 1 : 0.5,
              backgroundColor: viewConfig.layers.currentFlow ? '#0066CC' : '#FFFFFF'
            }]}
            onPress={() => toggleLayer('currentFlow')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.layerText, { color: viewConfig.layers.currentFlow ? '#FFFFFF' : '#333333' }]}>Current</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.layerButton, {
              opacity: viewConfig.layers.bathymetry ? 1 : 0.5,
              backgroundColor: viewConfig.layers.bathymetry ? '#0066CC' : '#FFFFFF'
            }]}
            onPress={() => toggleLayer('bathymetry')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.layerText, { color: viewConfig.layers.bathymetry ? '#FFFFFF' : '#333333' }]}>Depth</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Enhanced Weather Layer Controls - OnX Maps Style */}
        <View style={styles.weatherLayerControls}>
          <TouchableOpacity
            style={[styles.layerButton, {
              opacity: weatherLayers.pressure ? 1 : 0.5,
              backgroundColor: weatherLayers.pressure ? '#FF6B35' : '#FFFFFF'
            }]}
            onPress={() => toggleWeatherLayer('pressure')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.layerText, { color: weatherLayers.pressure ? '#FFFFFF' : '#333333' }]}>🌐 Pressure</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.layerButton, {
              opacity: weatherLayers.temperature ? 1 : 0.5,
              backgroundColor: weatherLayers.temperature ? '#FF6B35' : '#FFFFFF'
            }]}
            onPress={() => toggleWeatherLayer('temperature')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.layerText, { color: weatherLayers.temperature ? '#FFFFFF' : '#333333' }]}>🌡️ Temp</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.layerButton, {
              opacity: weatherLayers.windGusts ? 1 : 0.5,
              backgroundColor: weatherLayers.windGusts ? '#FF6B35' : '#FFFFFF'
            }]}
            onPress={() => toggleWeatherLayer('windGusts')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.layerText, { color: weatherLayers.windGusts ? '#FFFFFF' : '#333333' }]}>💨 Gusts</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.layerButton, {
              opacity: weatherLayers.thermalLayer ? 1 : 0.5,
              backgroundColor: weatherLayers.thermalLayer ? '#FF6B35' : '#FFFFFF'
            }]}
            onPress={() => toggleWeatherLayer('thermalLayer')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.layerText, { color: weatherLayers.thermalLayer ? '#FFFFFF' : '#333333' }]}>🔥 Thermal</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Measurement Tools - OnX Maps Style */}
        <View style={styles.measurementTools}>
          <TouchableOpacity
            style={[styles.measurementButton, {
              backgroundColor: measurementMode === 'distance' ? '#00CC44' : '#FFFFFF'
            }]}
            onPress={() => toggleMeasurementMode('distance')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.layerText, {
              color: measurementMode === 'distance' ? '#FFFFFF' : '#333333'
            }]}>📏 Distance</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.measurementButton, {
              backgroundColor: measurementMode === 'area' ? '#00CC44' : '#FFFFFF'
            }]}
            onPress={() => toggleMeasurementMode('area')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.layerText, {
              color: measurementMode === 'area' ? '#FFFFFF' : '#333333'
            }]}>🔲 Area</ThemedText>
          </TouchableOpacity>

          {(measurementPoints.length > 0) && (
            <TouchableOpacity
              style={styles.clearMeasurementButton}
              onPress={clearMeasurements}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.clearButtonText}>❌ Clear</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status info */}
      <View style={styles.statusBar}>
        <ThemedText style={styles.statusText}>
          Zoom: {viewConfig.camera.zoom} | Pitch: {viewConfig.camera.pitch}° | Bearing: {viewConfig.camera.bearing}° |
          {is3DMode ? ' 3D Mode' : ' 2D Mode'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  waterLayer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent', // Let nautical chart show through
  },
  mapLabel: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 6,
    zIndex: 20,
  },
  nauticalElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  navigationLines: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '20%',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.3)',
    borderStyle: 'dashed',
  },
  compassRose: {
    position: 'absolute',
    top: '15%',
    right: '15%',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
  compassText: {
    fontSize: 20,
    color: '#0066CC',
    fontWeight: 'bold',
  },
  depthSounding: {
    position: 'absolute',
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  depthContours: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contourLine: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  windLayer: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 15,
    minWidth: 150,
    minHeight: 50,
  },
  windInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 6,
    padding: 10,
    borderWidth: 2,
    borderColor: '#FF6B35',
    boxShadow: '0px 2px',
    elevation: 5,
  },
  windInfo: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  windParticles: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: { pointerEvents: 'none' },
      default: {}
    }),
  },
  windParticle: {
    position: 'absolute',
    backgroundColor: '#FF6B35',
    boxShadow: '1px 1px',
  },
  windStrengthIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  windStrengthText: {
    fontSize: 16,
    textAlign: 'center',
  },
  measurementTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  measurementButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00CC44',
  },
  clearMeasurementButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    marginLeft: 4,
  },
  clearButtonText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  measurementOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({
      web: { pointerEvents: 'none' },
      default: {}
    }),
    zIndex: 20,
  },
  measurementPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00CC44',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginLeft: -6,
    marginTop: -6,
  },
  measurementLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#00CC44',
    transformOrigin: 'left center',
  },
  measurementDisplay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 204, 68, 0.95)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00CC44',
  },
  measurementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bathymetryLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  depthContour: {
    position: 'absolute',
    borderRadius: 100,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  depthLabel: {
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  shallowWaterZone: {
    position: 'absolute',
    top: '60%',
    right: '15%',
    width: '25%',
    height: '20%',
    borderRadius: 15,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF8800',
  },
  currentFlowArrows: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({
      web: { pointerEvents: 'none' },
      default: {}
    }),
  },
  currentArrow: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    marginTop: -10,
  },
  arrowText: {
    fontSize: 18,
    color: '#00CCFF',
    fontWeight: 'bold',
    textShadow: '1px 1px',
  },
  currentLayer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    zIndex: 30,
    minWidth: 180,
    minHeight: 50,
  },
  currentInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 6,
    padding: 10,
    borderWidth: 2,
    borderColor: '#00AA44',
    boxShadow: '0px 2px',
    elevation: 5,
  },
  currentInfo: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  currentArrows: {
    position: 'absolute',
    top: 30,
    left: -20,
    width: 120,
    height: 80,
  },
  raceMark: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 70, // Above all other layers
  },
  markLabel: {
    fontSize: 20,
    marginBottom: 2,
  },
  markName: {
    fontSize: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  controls: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 8,
    zIndex: 25,
  },
  controlGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  zoomControls: {
    flexDirection: 'column',
    gap: 2,
  },
  zoomButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0066CC',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
      },
      default: {
        boxShadow: '0px 2px',
        elevation: 4,
      },
    }),
  },
  zoomText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0066CC',
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
      },
      default: {
        boxShadow: '0px 2px',
        elevation: 4,
      },
    }),
  },
  controlText: {
    fontSize: 12,
    fontWeight: '600',
  },
  layerControls: {
    gap: 4,
  },
  weatherLayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  layerButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
      },
      default: {
        boxShadow: '0px 1px',
        elevation: 2,
      },
    }),
  },
  layerText: {
    fontSize: 10,
    fontWeight: '500',
  },
  statusBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 6,
    zIndex: 30,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  debugOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 12,
    borderRadius: 8,
    zIndex: 100, // Above all nautical chart layers
    borderWidth: 3,
    borderColor: '#00FF88',
    minWidth: 220,
    boxShadow: '0px 0px',
    elevation: 10,
  },
  debugText: {
    fontSize: 13,
    color: '#00FF88',
    fontWeight: '700',
    marginBottom: 3,
    textShadow: '0px 0px',
  },
  // Course Boundary Styles
  courseBoundaries: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50, // Above nautical chart
    ...Platform.select({
      web: { pointerEvents: 'none' },
      default: {}
    }),
  },
  startLine: {
    position: 'absolute',
    boxShadow: '0px 0px',
    elevation: 5,
  },
  finishLine: {
    position: 'absolute',
    boxShadow: '0px 0px',
    elevation: 5,
  },
  courseBoundary: {
    position: 'absolute',
    backgroundColor: 'transparent',
    boxShadow: '0px 0px',
    elevation: 3,
  },
  restrictedZone: {
    position: 'absolute',
    borderRadius: 8,
    boxShadow: '0px 2px',
    elevation: 6,
  },
  boundaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    textShadow: '1px 1px',
  },
  // Nautical Chart Base Layer Styles
  nauticalChartBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: '#E8F4FD', // Light nautical blue
  },
  nauticalPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navigationGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navGridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
  },
  navGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  coastlineLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  landMass: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#654321',
    boxShadow: '2px 2px',
    elevation: 3,
  },
  landLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#2F1B14',
    textAlign: 'center',
  },
  // Fixed Chart Elements to prevent render loop
  chartPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  fixedDepthSounding: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    textAlign: 'center',
    minWidth: 30,
    minHeight: 24,
    zIndex: 100, // Above all elements
    ...Platform.select({
      web: { pointerEvents: 'none' },
      default: {}
    }),
    boxShadow: '1px 1px',
    elevation: 5,
  },
  // Fixed Land Mass Positions
  marinLand: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    width: '25%',
    height: '15%',
    backgroundColor: '#8B7355',
    borderRadius: 8,
  },
  sanFranciscoLand: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
    width: '30%',
    height: '25%',
    backgroundColor: '#8B7355',
    borderRadius: 12,
  },
  peninsulaLand: {
    position: 'absolute',
    bottom: '15%',
    left: '15%',
    width: '20%',
    height: '20%',
    backgroundColor: '#8B7355',
    borderRadius: 6,
  },
  // Real Map Tile Styles
  chartTileLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  mapTile: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    overflow: 'hidden',
    boxShadow: '0px 1px',
    elevation: 2,
  },
  chartInfo: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    zIndex: 90,
  },
  chartInfoText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#1E40AF',
    lineHeight: 12,
  },
  // Chart Grid and Features
  chartGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    borderLeftWidth: 2,
    borderLeftColor: '#3B82F6',
    opacity: 0.8,
    zIndex: 10,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
    opacity: 0.8,
    zIndex: 10,
  },
  coastlineFeatures: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  landFeature: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#654321',
    boxShadow: '2px 2px',
    elevation: 8,
    zIndex: 20,
  },
  landFeatureLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#2F1B14',
    textAlign: 'center',
  },
  // Real Chart Tile Styles
  chartTile: {
    position: 'absolute',
    opacity: 1,
    backgroundColor: 'transparent',
  },
  fallbackMap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  navigationFeature: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    textAlign: 'center',
  },
});
