/**
 * Track Overlay Component
 * 
 * Renders GPS tracks on a map using MapLibre GL.
 * Supports multiple tracks with different colors,
 * animated playback, and speed visualization.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Track, TrackPoint } from '@/services/tracking/types';

// MapLibre GL for web
let maplibregl: any = null;
if (Platform.OS === 'web') {
  maplibregl = require('maplibre-gl');
}

// ============================================================================
// Types
// ============================================================================

export interface TrackOverlayProps {
  /** Tracks to display */
  tracks: Track[];
  /** Map instance reference (from parent map component) */
  mapRef?: React.MutableRefObject<any>;
  /** Whether to show speed coloring */
  showSpeedGradient?: boolean;
  /** Whether to animate track playback */
  animated?: boolean;
  /** Playback speed multiplier */
  playbackSpeed?: number;
  /** Currently selected track ID */
  selectedTrackId?: string;
  /** Callback when track is selected */
  onTrackSelect?: (trackId: string) => void;
  /** Show boat markers at current position */
  showBoatMarkers?: boolean;
  /** Trail length for animated mode (number of points) */
  trailLength?: number;
}

interface TrackStyle {
  color: string;
  width: number;
  opacity: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const SPEED_GRADIENT = [
  { speed: 0, color: '#3B82F6' },   // Blue - slow
  { speed: 3, color: '#10B981' },   // Green
  { speed: 5, color: '#F59E0B' },   // Amber
  { speed: 7, color: '#EF4444' },   // Red - fast
  { speed: 10, color: '#7C3AED' },  // Purple - very fast
];

// ============================================================================
// Component
// ============================================================================

export function TrackOverlay({
  tracks,
  mapRef,
  showSpeedGradient = false,
  animated = false,
  playbackSpeed = 1,
  selectedTrackId,
  onTrackSelect,
  showBoatMarkers = true,
  trailLength = 50,
}: TrackOverlayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [currentPositions, setCurrentPositions] = useState<Map<string, TrackPoint>>(new Map());
  const animationRef = useRef<number | null>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const sourcesAdded = useRef<Set<string>>(new Set());

  // Calculate time bounds across all tracks
  const timeBounds = React.useMemo(() => {
    let minTime = Infinity;
    let maxTime = -Infinity;

    tracks.forEach(track => {
      if (track.startTime < minTime) minTime = track.startTime;
      if (track.endTime > maxTime) maxTime = track.endTime;
    });

    return { minTime, maxTime, duration: maxTime - minTime };
  }, [tracks]);

  // Add track layers to map
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapRef?.current || tracks.length === 0) return;

    const map = mapRef.current;
    if (!map.isStyleLoaded()) {
      map.on('load', () => addTrackLayers(map));
    } else {
      addTrackLayers(map);
    }

    return () => {
      // Cleanup
      tracks.forEach((track, index) => {
        const sourceId = `track-${track.id}`;
        if (map.getSource(sourceId)) {
          if (map.getLayer(`${sourceId}-line`)) {
            map.removeLayer(`${sourceId}-line`);
          }
          map.removeSource(sourceId);
        }
      });
      sourcesAdded.current.clear();
    };
  }, [tracks, mapRef, showSpeedGradient]);

  // Add track layers
  const addTrackLayers = useCallback((map: any) => {
    tracks.forEach((track, index) => {
      const sourceId = `track-${track.id}`;
      
      // Skip if already added
      if (sourcesAdded.current.has(sourceId)) return;

      const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      const isSelected = track.id === selectedTrackId;

      // Create GeoJSON from track points
      const geojson = createTrackGeoJSON(track, showSpeedGradient);

      // Add source
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
        });
      }

      // Add line layer
      if (!map.getLayer(`${sourceId}-line`)) {
        if (showSpeedGradient) {
          // Speed-based coloring
          map.addLayer({
            id: `${sourceId}-line`,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': ['get', 'color'],
              'line-width': isSelected ? 4 : 2,
              'line-opacity': isSelected ? 1 : 0.7,
            },
          });
        } else {
          // Solid color
          map.addLayer({
            id: `${sourceId}-line`,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': color,
              'line-width': isSelected ? 4 : 2,
              'line-opacity': isSelected ? 1 : 0.7,
            },
          });
        }

        // Add click handler
        map.on('click', `${sourceId}-line`, () => {
          onTrackSelect?.(track.id);
        });

        // Change cursor on hover
        map.on('mouseenter', `${sourceId}-line`, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', `${sourceId}-line`, () => {
          map.getCanvas().style.cursor = '';
        });
      }

      sourcesAdded.current.add(sourceId);
    });

    // Add boat markers if enabled
    if (showBoatMarkers) {
      addBoatMarkers(map);
    }

    // Fit map to tracks
    fitMapToTracks(map);
  }, [tracks, showSpeedGradient, selectedTrackId, onTrackSelect, showBoatMarkers]);

  // Create GeoJSON from track
  const createTrackGeoJSON = (track: Track, withSpeed: boolean): GeoJSON.FeatureCollection => {
    if (withSpeed) {
      // Create line segments with speed-based colors
      const features: GeoJSON.Feature[] = [];
      
      for (let i = 1; i < track.points.length; i++) {
        const p1 = track.points[i - 1];
        const p2 = track.points[i];
        const speed = p2.speed ?? 0;
        const color = getSpeedColor(speed);

        features.push({
          type: 'Feature',
          properties: { color, speed },
          geometry: {
            type: 'LineString',
            coordinates: [[p1.lng, p1.lat], [p2.lng, p2.lat]],
          },
        });
      }

      return { type: 'FeatureCollection', features };
    }

    // Single line for solid color
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: track.points.map(p => [p.lng, p.lat]),
        },
      }],
    };
  };

  // Get color for speed value
  const getSpeedColor = (speed: number): string => {
    for (let i = SPEED_GRADIENT.length - 1; i >= 0; i--) {
      if (speed >= SPEED_GRADIENT[i].speed) {
        return SPEED_GRADIENT[i].color;
      }
    }
    return SPEED_GRADIENT[0].color;
  };

  // Add boat markers
  const addBoatMarkers = useCallback((map: any) => {
    if (!maplibregl) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    tracks.forEach((track, index) => {
      const lastPoint = track.points[track.points.length - 1];
      if (!lastPoint) return;

      const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'boat-marker';
      el.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${lastPoint.heading ?? 0}deg);
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L4 20h16L12 2z"/>
          </svg>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lastPoint.lng, lastPoint.lat])
        .addTo(map);

      markersRef.current.set(track.id, marker);
    });
  }, [tracks]);

  // Fit map bounds to all tracks
  const fitMapToTracks = (map: any) => {
    if (!maplibregl || tracks.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    tracks.forEach(track => {
      track.points.forEach(p => {
        bounds.extend([p.lng, p.lat]);
      });
    });

    map.fitBounds(bounds, { padding: 50 });
  };

  // Animation playback
  useEffect(() => {
    if (!animated || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    let lastFrameTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastFrameTime) * playbackSpeed;
      lastFrameTime = currentTime;

      setPlaybackTime(prev => {
        const newTime = prev + deltaTime;
        if (newTime >= timeBounds.duration) {
          setIsPlaying(false);
          return 0;
        }
        return newTime;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animated, isPlaying, playbackSpeed, timeBounds.duration]);

  // Update boat positions during playback
  useEffect(() => {
    if (!animated || !mapRef?.current) return;

    const currentTime = timeBounds.minTime + playbackTime;
    const positions = new Map<string, TrackPoint>();

    tracks.forEach(track => {
      const point = getPointAtTime(track, currentTime);
      if (point) {
        positions.set(track.id, point);
        
        // Update marker position
        const marker = markersRef.current.get(track.id);
        if (marker) {
          marker.setLngLat([point.lng, point.lat]);
          // Update rotation
          const el = marker.getElement();
          if (el && point.heading !== undefined) {
            const inner = el.querySelector('div');
            if (inner) {
              inner.style.transform = `rotate(${point.heading}deg)`;
            }
          }
        }
      }
    });

    setCurrentPositions(positions);
  }, [playbackTime, tracks, timeBounds.minTime, animated, mapRef]);

  // Get track point at specific time
  const getPointAtTime = (track: Track, time: number): TrackPoint | null => {
    if (time < track.startTime || time > track.endTime) return null;

    // Binary search for closest point
    let left = 0;
    let right = track.points.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (track.points[mid].timestamp < time) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // Interpolate between points
    const idx = Math.max(0, left - 1);
    const p1 = track.points[idx];
    const p2 = track.points[Math.min(idx + 1, track.points.length - 1)];

    if (p1.timestamp === p2.timestamp) return p1;

    const t = (time - p1.timestamp) / (p2.timestamp - p1.timestamp);

    return {
      lat: p1.lat + (p2.lat - p1.lat) * t,
      lng: p1.lng + (p2.lng - p1.lng) * t,
      timestamp: time,
      speed: p1.speed !== undefined && p2.speed !== undefined
        ? p1.speed + (p2.speed - p1.speed) * t
        : undefined,
      heading: p1.heading !== undefined && p2.heading !== undefined
        ? interpolateAngle(p1.heading, p2.heading, t)
        : undefined,
    };
  };

  // Interpolate between angles (handle wrap-around)
  const interpolateAngle = (a1: number, a2: number, t: number): number => {
    let diff = a2 - a1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return (a1 + diff * t + 360) % 360;
  };

  // Playback controls (only shown when animated)
  if (!animated) return null;

  const progress = timeBounds.duration > 0 ? playbackTime / timeBounds.duration : 0;
  const formattedTime = formatDuration(playbackTime);
  const formattedDuration = formatDuration(timeBounds.duration);

  return (
    <View style={styles.controls}>
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => setIsPlaying(!isPlaying)}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={20}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.timeText}>
          {formattedTime} / {formattedDuration}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          setIsPlaying(false);
          setPlaybackTime(0);
        }}
      >
        <Ionicons name="refresh" size={18} color="#64748B" />
      </TouchableOpacity>
    </View>
  );
}

// Format duration in mm:ss
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    gap: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TrackOverlay;

