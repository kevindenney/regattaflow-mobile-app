/**
 * Time-Based Environmental Map
 *
 * MapLibre GL map with animated environmental layers:
 * - 💨 Wind particles (white, flowing with wind direction)
 * - 🌊 Current arrows (blue, showing current direction)
 * - 🎨 Depth overlays (color gradient for bathymetry)
 * - ⚫ Wind shadow zones (darker areas)
 *
 * All layers animate as you scrub the time slider.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { TimeSlider } from '@/components/map/controls/TimeSlider';
import type { EnvironmentalLayers } from '@/services/EnvironmentalVisualizationService';

interface TimeBasedEnvironmentalMapProps {
  /** Sailing venue */
  venue: {
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
    region: 'north-america' | 'europe' | 'asia-pacific' | 'oceania' | 'caribbean';
    country: string;
  };

  /** Racing area polygon */
  racingArea: GeoJSON.Polygon;

  /** Race start time */
  startTime: Date;

  /** Forecast duration (hours) */
  forecastDuration?: number;

  /** Callback when layers update */
  onLayersUpdate?: (layers: EnvironmentalLayers) => void;
}

export function TimeBasedEnvironmentalMap({
  venue,
  racingArea,
  startTime,
  forecastDuration = 24,
  onLayersUpdate,
}: TimeBasedEnvironmentalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const windParticlesRef = useRef<WindParticleSystem | null>(null);
  const currentParticlesRef = useRef<CurrentParticleSystem | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState<any>(null);

  // Initialize MapLibre GL map
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainerRef.current) return;

    // Only run on web
    if (typeof window === 'undefined') return;

    try {
      console.log('🗺️ Initializing TimeBasedEnvironmentalMap...');

      // Import MapLibre GL synchronously (Metro compatible)
      const maplibregl = require('maplibre-gl');
      require('maplibre-gl/dist/maplibre-gl.css');

      // Calculate racing area center
      const coords = racingArea.coordinates[0];
      const centerLng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      const centerLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;

      // Create map with nautical style
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: createNauticalStyle(),
        center: [centerLng, centerLat],
        zoom: 13,
        pitch: 0, // Top-down view for environmental layers
        bearing: 0,
        attributionControl: true,
      });

      mapRef.current = map;

      map.on('load', () => {
        console.log('✅ Environmental map loaded');
        setMapLoaded(true);

        // Add racing area outline
        addRacingAreaOutline(map, racingArea);

        // Initialize particle systems
        initializeParticleSystems(map);

        // Load initial environmental data
        updateEnvironmentalLayers(currentTime);

        console.log('✅ Particle systems initialized and environmental data loaded');
      });

      map.on('error', (e) => {
        console.error('❌ Map error:', e);
      });

      // Add navigation controls
      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
        }),
        'top-right'
      );
    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Initialize particle systems
  const initializeParticleSystems = (map: any) => {
    console.log('🎨 Initializing particle systems...');

    const container = map.getContainer();
    console.log('📍 Map container:', container);

    // Create canvas overlay for wind particles
    const windCanvas = document.createElement('canvas');
    windCanvas.style.position = 'absolute';
    windCanvas.style.top = '0';
    windCanvas.style.left = '0';
    windCanvas.style.width = '100%';
    windCanvas.style.height = '100%';
    windCanvas.style.pointerEvents = 'none';
    windCanvas.style.zIndex = '1000';
    container.appendChild(windCanvas);
    console.log('✅ Wind canvas added to map container');

    // Create canvas overlay for current particles
    const currentCanvas = document.createElement('canvas');
    currentCanvas.style.position = 'absolute';
    currentCanvas.style.top = '0';
    currentCanvas.style.left = '0';
    currentCanvas.style.width = '100%';
    currentCanvas.style.height = '100%';
    currentCanvas.style.pointerEvents = 'none';
    currentCanvas.style.zIndex = '999'; // Below wind particles
    container.appendChild(currentCanvas);
    console.log('✅ Current canvas added to map container');

    // Initialize wind particle system
    windParticlesRef.current = new WindParticleSystem(windCanvas, map);

    // Initialize current particle system
    currentParticlesRef.current = new CurrentParticleSystem(currentCanvas, map);

    console.log('✅ Particle systems ready');
  };

  // Handle time change from slider
  const handleTimeChange = useCallback((newTime: Date) => {
    setCurrentTime(newTime);
    updateEnvironmentalLayers(newTime);
  }, []);

  // Update environmental layers for new time
  const updateEnvironmentalLayers = async (time: Date) => {
    if (!mapRef.current || !mapLoaded) return;

    try {
      // Generate mock environmental data for this time
      const environment = generateMockEnvironment(time, venue, racingArea);
      setCurrentEnvironment(environment);

      // Update wind particles
      if (windParticlesRef.current) {
        windParticlesRef.current.updateWind(
          environment.wind.speed,
          environment.wind.direction
        );
      }

      // Update current particles
      if (currentParticlesRef.current) {
        currentParticlesRef.current.updateCurrent(
          environment.current.speed,
          environment.current.direction
        );
      }

      // Update depth overlay
      updateDepthOverlay(mapRef.current, environment.depth);

      // Update wind shadow zones
      updateWindShadowZones(mapRef.current, environment.windShadows);

      // Notify parent of layer update
      if (onLayersUpdate) {
        onLayersUpdate({
          windParticles: windParticlesRef.current?.getParticles() || [],
          currentParticles: currentParticlesRef.current?.getParticles() || [],
          windShadowZones: environment.windShadows,
          currentAccelerationZones: [],
          depthContours: [],
        });
      }

      console.log(`🌊 Environmental layers updated for ${time.toLocaleTimeString()}`);
    } catch (error) {
      console.error('❌ Failed to update environmental layers:', error);
    }
  };

  // Play/pause animation
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Continuous particle animation (always running)
  useEffect(() => {
    if (!mapLoaded || !windParticlesRef.current || !currentParticlesRef.current) return;

    const animateParticles = () => {
      // Animate wind particles
      if (windParticlesRef.current) {
        windParticlesRef.current.animate();
      }

      // Animate current particles
      if (currentParticlesRef.current) {
        currentParticlesRef.current.animate();
      }

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animateParticles);
    };

    // Start particle animation
    console.log('🎬 Starting particle animation loop (wind + current)');
    animationFrameRef.current = requestAnimationFrame(animateParticles);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mapLoaded]);

  // Time advancement when playing
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = Date.now();
    const advanceTime = () => {
      const now = Date.now();
      const delta = now - lastTime;

      // Advance time by 1 hour every second (60x speed)
      if (delta >= 1000) {
        const newTime = new Date(currentTime.getTime() + 60 * 60 * 1000);

        // Check if we've reached the end
        const endTime = new Date(startTime.getTime() + forecastDuration * 60 * 60 * 1000);
        if (newTime > endTime) {
          setIsPlaying(false);
          return;
        }

        setCurrentTime(newTime);
        updateEnvironmentalLayers(newTime);
        lastTime = now;
      }

      // Continue time advancement
      if (isPlaying) {
        setTimeout(advanceTime, 100);
      }
    };

    advanceTime();
  }, [isPlaying, currentTime]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.mobileMessage}>
          Environmental map visualization is currently web-only.
          Mobile support coming soon!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      />

      {/* Loading indicator */}
      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>🗺️ Loading environmental map...</Text>
          <Text style={styles.loadingSubtext}>Initializing particle systems</Text>
        </View>
      )}

      {/* Time slider overlay */}
      {mapLoaded && (
        <View style={styles.timeSliderContainer}>
          <TimeSlider
            startTime={startTime}
            endTime={new Date(startTime.getTime() + forecastDuration * 60 * 60 * 1000)}
            currentTime={currentTime}
            onTimeChange={handleTimeChange}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
          />
        </View>
      )}

      {/* Current conditions overlay */}
      {mapLoaded && currentEnvironment && (
        <View style={styles.conditionsOverlay}>
          <Text style={styles.conditionsTitle}>Current Conditions</Text>
          <Text style={styles.conditionsText}>
            💨 Wind: {currentEnvironment.wind.speed.toFixed(1)}kt @ {currentEnvironment.wind.direction.toFixed(0)}°
          </Text>
          <Text style={styles.conditionsText}>
            🌊 Current: {currentEnvironment.current.speed.toFixed(2)}kt @ {currentEnvironment.current.direction.toFixed(0)}°
          </Text>
          <Text style={styles.conditionsText}>
            📊 Depth: {currentEnvironment.depth.average.toFixed(0)}m
          </Text>
        </View>
      )}

      {/* Legend overlay */}
      {mapLoaded && (
        <View style={styles.legendOverlay}>
          <Text style={styles.legendTitle}>Environmental Layers</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFC800' }]} />
            <Text style={styles.legendText}>Wind Particles (flowing)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0080ff' }]} />
            <Text style={styles.legendText}>Current (blue circles)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            <Text style={styles.legendText}>Wind Shadows</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ==================== Helper Functions ====================

/** Create nautical map style */
function createNauticalStyle(): any {
  return {
    version: 8,
    name: 'Nautical Chart',
    sources: {
      'osm': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap Contributors',
        maxzoom: 19,
      },
      'openseamap': {
        type: 'raster',
        tiles: ['https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenSeaMap contributors',
        maxzoom: 18,
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#A5D5F0', // Water blue
        },
      },
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
        paint: {
          'raster-opacity': 0.7,
        },
      },
      {
        id: 'openseamap',
        type: 'raster',
        source: 'openseamap',
        paint: {
          'raster-opacity': 1.0,
        },
      },
    ],
  };
}

/** Add racing area outline to map */
function addRacingAreaOutline(map: any, racingArea: GeoJSON.Polygon) {
  map.addSource('racing-area', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: racingArea,
    },
  });

  // Add fill
  map.addLayer({
    id: 'racing-area-fill',
    type: 'fill',
    source: 'racing-area',
    paint: {
      'fill-color': '#ff6b00',
      'fill-opacity': 0.1,
    },
  });

  // Add border
  map.addLayer({
    id: 'racing-area-border',
    type: 'line',
    source: 'racing-area',
    paint: {
      'line-color': '#ff6b00',
      'line-width': 3,
      'line-dasharray': [4, 2],
    },
  });

  console.log('✅ Racing area outline added');
}

/** Update depth overlay */
function updateDepthOverlay(map: any, depth: { average: number; min: number; max: number }) {
  // Remove existing depth overlay
  if (map.getLayer('depth-overlay')) {
    map.removeLayer('depth-overlay');
  }
  if (map.getSource('depth-overlay')) {
    map.removeSource('depth-overlay');
  }

  // For now, just log depth data
  // TODO: Add actual depth overlay using graduated colors
  console.log('📊 Depth overlay updated:', depth);
}

/** Update wind shadow zones */
function updateWindShadowZones(map: any, shadows: any[]) {
  // Remove existing wind shadows
  if (map.getLayer('wind-shadows')) {
    map.removeLayer('wind-shadows');
  }
  if (map.getSource('wind-shadows')) {
    map.removeSource('wind-shadows');
  }

  if (shadows.length === 0) return;

  // Add wind shadow overlays
  map.addSource('wind-shadows', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: shadows,
    },
  });

  map.addLayer({
    id: 'wind-shadows',
    type: 'fill',
    source: 'wind-shadows',
    paint: {
      'fill-color': '#000000',
      'fill-opacity': 0.3,
    },
  });

  console.log(`⚫ Wind shadow zones updated (${shadows.length} zones)`);
}

/** Generate mock environmental data for a specific time */
function generateMockEnvironment(time: Date, venue: any, racingArea: GeoJSON.Polygon) {
  const hourOffset = (time.getTime() - new Date().getTime()) / (1000 * 60 * 60);

  // Generate realistic wind data (varies with time)
  const baseWindSpeed = 12;
  const baseWindDirection = 315; // NW

  // More dramatic wind changes over time
  const windSpeed = baseWindSpeed + Math.sin(hourOffset * 0.3) * 5 + Math.random() * 3; // 7-20kt range
  const windDirection = (baseWindDirection + Math.sin(hourOffset * 0.15) * 45 + Math.cos(hourOffset * 0.1) * 30) % 360; // ±75° shift

  // Generate realistic current data (varies with tide)
  const baseCurrent = 0.5;
  const currentSpeed = baseCurrent + Math.sin(hourOffset * 0.25) * 0.3;
  const currentDirection = (windDirection + 180 + Math.random() * 20) % 360;

  // Depth data
  const depth = {
    average: 15,
    min: 8,
    max: 25,
  };

  // Wind shadow zones (empty for now)
  const windShadows: any[] = [];

  return {
    wind: { speed: windSpeed, direction: windDirection },
    current: { speed: currentSpeed, direction: currentDirection },
    depth,
    windShadows,
  };
}

// ==================== Particle Systems ====================

/** Wind particle system (white particles flowing with wind) */
class WindParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private map: any;
  private particles: Array<{ x: number; y: number; age: number }> = [];
  private windSpeed = 10;
  private windDirection = 0;
  private maxParticles = 1000;

  constructor(canvas: HTMLCanvasElement, map: any) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = map;

    console.log('💨 WindParticleSystem created');

    // Resize canvas to match map
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Initialize particles
    this.initializeParticles();

    console.log(`✅ Initialized ${this.maxParticles} wind particles`);
  }

  private resizeCanvas() {
    const container = this.map.getContainer();
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    console.log(`📐 Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
  }

  private initializeParticles() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        age: Math.random() * 100,
      });
    }
  }

  updateWind(speed: number, direction: number) {
    this.windSpeed = speed;
    this.windDirection = direction;
    console.log(`💨 Wind updated: ${speed.toFixed(1)}kt @ ${direction.toFixed(0)}°`);
  }

  animate() {
    if (!this.ctx) {
      console.error('❌ Canvas context not available');
      return;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    const windRadians = (this.windDirection * Math.PI) / 180;
    const speedFactor = this.windSpeed / 10; // Normalize to typical wind

    this.particles.forEach((particle) => {
      // Move particle
      particle.x += Math.sin(windRadians) * speedFactor * 2;
      particle.y -= Math.cos(windRadians) * speedFactor * 2;
      particle.age += 1;

      // Reset particle if out of bounds or too old
      if (
        particle.x < 0 ||
        particle.x > this.canvas.width ||
        particle.y < 0 ||
        particle.y > this.canvas.height ||
        particle.age > 100
      ) {
        particle.x = Math.random() * this.canvas.width;
        particle.y = Math.random() * this.canvas.height;
        particle.age = 0;
      }

      // Draw particle with glow effect for visibility
      const opacity = Math.max(0, 1 - particle.age / 100);

      // Draw glow (larger, semi-transparent)
      this.ctx!.fillStyle = `rgba(255, 255, 0, ${opacity * 0.3})`; // Yellow glow
      this.ctx!.fillRect(particle.x - 2, particle.y - 2, 6, 6);

      // Draw core particle (smaller, more opaque)
      this.ctx!.fillStyle = `rgba(255, 200, 0, ${opacity * 0.9})`; // Bright yellow/orange
      this.ctx!.fillRect(particle.x, particle.y, 3, 3);
    });
  }

  getParticles() {
    return this.particles;
  }
}

/** Current particle system (blue particles flowing with current) */
class CurrentParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private map: any;
  private particles: Array<{ x: number; y: number; age: number }> = [];
  private currentSpeed = 0.5;
  private currentDirection = 0;
  private maxParticles = 500; // Fewer particles than wind for performance

  constructor(canvas: HTMLCanvasElement, map: any) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = map;

    console.log('🌊 CurrentParticleSystem created');

    // Resize canvas to match map
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Initialize particles
    this.initializeParticles();

    console.log(`✅ Initialized ${this.maxParticles} current particles`);
  }

  private resizeCanvas() {
    const container = this.map.getContainer();
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    console.log(`📐 Current canvas resized to ${this.canvas.width}x${this.canvas.height}`);
  }

  private initializeParticles() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        age: Math.random() * 150, // Longer lifetime than wind
      });
    }
  }

  updateCurrent(speed: number, direction: number) {
    this.currentSpeed = speed;
    this.currentDirection = direction;
    console.log(`🌊 Current updated: ${speed.toFixed(2)}kt @ ${direction.toFixed(0)}°`);
  }

  animate() {
    if (!this.ctx) {
      console.error('❌ Canvas context not available');
      return;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    const currentRadians = (this.currentDirection * Math.PI) / 180;
    const speedFactor = this.currentSpeed * 2; // Current is slower, so multiply to make visible

    this.particles.forEach((particle) => {
      // Move particle with current
      particle.x += Math.sin(currentRadians) * speedFactor * 1.5;
      particle.y -= Math.cos(currentRadians) * speedFactor * 1.5;
      particle.age += 0.5; // Age slower than wind particles

      // Reset particle if out of bounds or too old
      if (
        particle.x < 0 ||
        particle.x > this.canvas.width ||
        particle.y < 0 ||
        particle.y > this.canvas.height ||
        particle.age > 150
      ) {
        particle.x = Math.random() * this.canvas.width;
        particle.y = Math.random() * this.canvas.height;
        particle.age = 0;
      }

      // Draw particle with glow effect (blue)
      const opacity = Math.max(0, 1 - particle.age / 150);

      // Draw glow (larger, semi-transparent blue)
      this.ctx!.fillStyle = `rgba(0, 128, 255, ${opacity * 0.3})`; // Blue glow
      this.ctx!.fillRect(particle.x - 3, particle.y - 3, 8, 8);

      // Draw core particle (smaller, more opaque blue)
      this.ctx!.fillStyle = `rgba(0, 160, 255, ${opacity * 0.8})`; // Bright blue
      this.ctx!.fillRect(particle.x - 1, particle.y - 1, 4, 4);
    });
  }

  getParticles() {
    return this.particles;
  }
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#64748B',
  },
  timeSliderContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  conditionsOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 100,
  },
  conditionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  conditionsText: {
    fontSize: 12,
    color: '#475569',
    marginVertical: 2,
  },
  legendOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 100,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#475569',
  },
  mobileMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    padding: 40,
  },
});
