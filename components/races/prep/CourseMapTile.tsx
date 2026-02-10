/**
 * CourseMapTile - Large square tile with embedded mini-map preview
 *
 * Shows the race venue location and course if set.
 * On web: Renders an interactive MapLibre GL map with course visualization
 * On native: Shows a static placeholder (MapLibre performance issues in compact tiles)
 *
 * Features:
 * - Large square format (~aspectRatio 1) for better map visibility
 * - Green completion badge when course is configured
 * - "COURSE" label overlay at bottom
 * - Tap to open CourseMapWizard
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Check, MapPin, Map } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { PositionedCourse } from '@/types/courses';
import { COURSE_TEMPLATES } from '@/services/CoursePositioningService';
import { WindDirectionIndicator } from '@/components/race-detail/map/WindDirectionIndicator';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const isWeb = Platform.OS === 'web';

// Mark colors by type
const MARK_COLORS: Record<string, string> = {
  windward: '#eab308',
  leeward: '#ef4444',
  gate: '#f97316',
  wing: '#22c55e',
  offset: '#3b82f6',
};

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
  purple: '#5856D6',
};

export interface CourseMapTileProps {
  /** Race venue coordinates */
  coords?: { lat: number; lng: number } | null;
  /** Positioned course data (if set) */
  positionedCourse?: PositionedCourse | null;
  /** Whether the course has been configured */
  isComplete?: boolean;
  /** Callback when tile is pressed */
  onPress: () => void;
  /** Optional venue name for display */
  venueName?: string;
  /** Disable the tile */
  disabled?: boolean;
  /** Wind direction in degrees (0-360) for animated overlay */
  windDirection?: number;
  /** Wind speed in knots */
  windSpeed?: number;
  /** Current direction in degrees (0-360) for animated overlay */
  currentDirection?: number;
  /** Current speed in knots for animation speed */
  currentSpeed?: number;
  /** Wave height in meters for visualization */
  waveHeight?: number;
  /** Wave direction in degrees (0-360) */
  waveDirection?: number;
}

export function CourseMapTile({
  coords,
  positionedCourse,
  isComplete = false,
  onPress,
  venueName,
  disabled,
  windDirection,
  windSpeed,
  currentDirection,
  currentSpeed,
  waveHeight,
  waveDirection,
}: CourseMapTileProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlayContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animation
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePress = () => {
    if (disabled) return;
    triggerHaptic('impactLight');
    onPress();
  };

  // Initialize map on web
  useEffect(() => {
    if (!isWeb || !mapContainerRef.current) return;
    if (!coords && !positionedCourse) {
      setLoading(false);
      return;
    }

    // Clean up existing map before creating a new one
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      setMapLoaded(false);
    }

    const initMap = async () => {
      try {
        setLoading(true);
        const maplibregl = await import('maplibre-gl');
        await import('maplibre-gl/dist/maplibre-gl.css');

        // Calculate center from course marks or coords
        let centerLat: number;
        let centerLng: number;

        if (positionedCourse) {
          const allLats = [
            ...positionedCourse.marks.map((m) => m.latitude),
            positionedCourse.startLine.pin.lat,
            positionedCourse.startLine.committee.lat,
          ];
          const allLngs = [
            ...positionedCourse.marks.map((m) => m.longitude),
            positionedCourse.startLine.pin.lng,
            positionedCourse.startLine.committee.lng,
          ];
          centerLat = (Math.min(...allLats) + Math.max(...allLats)) / 2;
          centerLng = (Math.min(...allLngs) + Math.max(...allLngs)) / 2;
        } else if (coords) {
          centerLat = coords.lat;
          centerLng = coords.lng;
        } else {
          setLoading(false);
          return;
        }

        const map = new maplibregl.default.Map({
          container: mapContainerRef.current!,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: [centerLng, centerLat],
          zoom: positionedCourse ? 13 : 12,
          interactive: false, // Disable interaction for tile preview
          attributionControl: false,
        });

        map.on('load', () => {
          mapRef.current = map;
          setMapLoaded(true);
          setLoading(false);

          if (positionedCourse) {
            // Add course line
            map.addSource('tile-course-line', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: positionedCourse.marks
                    .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
                    .map((m) => [m.longitude, m.latitude]),
                },
              },
            });

            map.addLayer({
              id: 'tile-course-line-layer',
              type: 'line',
              source: 'tile-course-line',
              paint: {
                'line-color': '#f97316',
                'line-width': 2,
                'line-dasharray': [3, 2],
              },
            });

            // Add start line
            map.addSource('tile-start-line', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [positionedCourse.startLine.pin.lng, positionedCourse.startLine.pin.lat],
                    [positionedCourse.startLine.committee.lng, positionedCourse.startLine.committee.lat],
                  ],
                },
              },
            });

            map.addLayer({
              id: 'tile-start-line-layer',
              type: 'line',
              source: 'tile-start-line',
              paint: {
                'line-color': '#22c55e',
                'line-width': 3,
              },
            });

            // Add mark markers
            positionedCourse.marks.forEach((mark, index) => {
              const color = MARK_COLORS[mark.type] || '#64748b';
              const size = 16;

              const el = document.createElement('div');
              el.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border: 2px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              `;

              const label =
                mark.type === 'windward'
                  ? 'W'
                  : mark.type === 'leeward'
                    ? 'L'
                    : mark.type === 'gate'
                      ? 'G'
                      : mark.type === 'wing'
                        ? 'R'
                        : (index + 1).toString();
              el.textContent = label;

              new maplibregl.default.Marker({
                element: el,
                offset: [-(size / 2), -(size / 2)],
              })
                .setLngLat([mark.longitude, mark.latitude])
                .addTo(map);
            });

            // Fit bounds to show entire course
            const bounds = new maplibregl.default.LngLatBounds();
            positionedCourse.marks.forEach((m) => bounds.extend([m.longitude, m.latitude]));
            bounds.extend([positionedCourse.startLine.pin.lng, positionedCourse.startLine.pin.lat]);
            bounds.extend([positionedCourse.startLine.committee.lng, positionedCourse.startLine.committee.lat]);

            map.fitBounds(bounds, {
              padding: 30,
              maxZoom: 15,
            });
          } else if (coords) {
            // Add a simple location marker
            const el = document.createElement('div');
            el.style.cssText = `
              width: 24px;
              height: 24px;
              background: ${COLORS.purple};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            `;

            new maplibregl.default.Marker({ element: el })
              .setLngLat([coords.lng, coords.lat])
              .addTo(map);
          }
        });
      } catch (error) {
        console.error('[CourseMapTile] Failed to initialize map:', error);
        setLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapLoaded(false);
    };
  }, [coords?.lat, coords?.lng, positionedCourse]);

  // Add marine overlays when map is loaded
  useEffect(() => {
    if (!isWeb || !mapLoaded || !overlayContainerRef.current) return;

    const container = overlayContainerRef.current;

    // Clear any existing overlays
    container.innerHTML = '';

    // Helper to create wind arrow element
    const createWindArrow = (
      direction: number,
      x: number,
      y: number,
      size: number = 20
    ): HTMLDivElement => {
      const arrow = document.createElement('div');
      // Guard against NaN
      const safeDirection = Number.isFinite(direction) ? direction : 0;

      arrow.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        transform: translate(-50%, -50%) rotate(${safeDirection}deg);
        opacity: 0.4;
        pointer-events: none;
        transition: opacity 0.3s ease;
      `;

      // SVG arrow (green for wind)
      arrow.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L12 20M12 4L6 10M12 4L18 10"
                stroke="rgba(34, 197, 94, 0.85)"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"/>
        </svg>
      `;

      return arrow;
    };

    // Helper to create current indicator (wavy lines, not arrows)
    const createCurrentIndicator = (
      direction: number,
      x: number,
      y: number,
      size: number = 18
    ): HTMLDivElement => {
      const indicator = document.createElement('div');
      // Guard against NaN
      const safeDirection = Number.isFinite(direction) ? direction : 0;

      indicator.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        transform: translate(-50%, -50%) rotate(${safeDirection}deg);
        opacity: 0.5;
        pointer-events: none;
        transition: opacity 0.3s ease;
      `;

      // SVG wavy lines with small arrow tip (blue for current)
      indicator.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4C14 6 10 8 12 10C14 12 10 14 12 16C14 18 10 20 12 22"
                stroke="rgba(14, 165, 233, 0.85)"
                stroke-width="2"
                stroke-linecap="round"/>
          <path d="M12 4L9 7M12 4L15 7"
                stroke="rgba(14, 165, 233, 0.85)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"/>
        </svg>
      `;

      return indicator;
    };

    // Add wind arrows (3x3 grid)
    // Wind direction is where wind is FROM, but arrows should point where wind is GOING
    const windArrows: HTMLDivElement[] = [];
    if (windDirection !== undefined && Number.isFinite(windDirection)) {
      const windFlowDirection = (windDirection + 180) % 360; // Direction wind is GOING
      const gridPositions = [
        [20, 25], [50, 20], [80, 25],
        [25, 50], [50, 50], [75, 50],
        [20, 75], [50, 80], [80, 75],
      ];

      gridPositions.forEach(([x, y], index) => {
        const arrow = createWindArrow(windFlowDirection, x, y, 18);
        arrow.dataset.index = String(index);
        arrow.dataset.type = 'wind';
        windArrows.push(arrow);
        container.appendChild(arrow);
      });
    }

    // Add current indicators (wavy lines, 2x2 grid, offset from wind)
    const currentIndicators: HTMLDivElement[] = [];
    if (currentDirection !== undefined && Number.isFinite(currentDirection) && currentSpeed !== undefined && currentSpeed > 0.1) {
      const currentPositions = [
        [35, 35], [65, 35],
        [35, 65], [65, 65],
      ];

      currentPositions.forEach(([x, y], index) => {
        const indicator = createCurrentIndicator(currentDirection, x, y, 16);
        indicator.dataset.index = String(index);
        indicator.dataset.type = 'current';
        currentIndicators.push(indicator);
        container.appendChild(indicator);
      });
    }

    // Add wave lines (subtle parallel lines)
    if (waveHeight !== undefined && waveHeight > 0.2 && waveDirection !== undefined) {
      const waveContainer = document.createElement('div');
      waveContainer.style.cssText = `
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        opacity: 0.15;
      `;

      // Create parallel wave lines
      const lineCount = 5;
      const spacing = 100 / (lineCount + 1);

      for (let i = 1; i <= lineCount; i++) {
        const line = document.createElement('div');
        line.style.cssText = `
          position: absolute;
          left: 50%;
          top: ${i * spacing}%;
          width: 120%;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(96, 165, 250, 0.6) 30%, rgba(96, 165, 250, 0.6) 70%, transparent 100%);
          transform: translateX(-50%) rotate(${(waveDirection + 90) % 360}deg);
          transform-origin: center;
        `;
        line.dataset.waveIndex = String(i);
        waveContainer.appendChild(line);
      }

      container.appendChild(waveContainer);
    }

    // Animation loop for flow effect
    let frame = 0;
    const animate = () => {
      // Animate wind arrows with staggered opacity
      windArrows.forEach((arrow, i) => {
        const phase = (frame + i * 15) % 80;
        const opacity = 0.45 + Math.sin((phase / 80) * Math.PI) * 0.35;
        arrow.style.opacity = String(opacity);
      });

      // Animate current indicators with flowing motion
      if (currentSpeed !== undefined) {
        const speedFactor = Math.max(0.5, Math.min(currentSpeed, 2));
        currentIndicators.forEach((indicator, i) => {
          const phase = ((frame * speedFactor) + i * 25) % 100;
          const opacity = 0.25 + Math.sin((phase / 100) * Math.PI) * 0.45;
          indicator.style.opacity = String(opacity);
        });
      }

      frame++;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (windArrows.length > 0 || currentIndicators.length > 0) {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mapLoaded, windDirection, currentDirection, currentSpeed, waveHeight, waveDirection]);

  const courseTypeName = positionedCourse
    ? COURSE_TEMPLATES[positionedCourse.courseType]?.name || 'Custom Course'
    : null;

  // Native fallback
  if (!isWeb) {
    return (
      <AnimatedPressable
        style={[
          styles.tile,
          isComplete && styles.tileComplete,
          animatedStyle,
          Platform.OS !== 'web' && IOS_SHADOWS.card,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Course Map: ${isComplete ? 'Complete' : 'Not set'}`}
      >
        {isComplete && (
          <View style={styles.completeBadge}>
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}
        <View style={styles.nativePlaceholder}>
          <Map size={32} color={COLORS.purple} />
          <Text style={styles.nativeText}>
            {positionedCourse ? courseTypeName : coords ? 'Set course' : 'Set location'}
          </Text>
          {venueName && <Text style={styles.venueText}>{venueName}</Text>}
        </View>
        <View style={styles.labelBar}>
          <Text style={styles.labelText}>COURSE</Text>
        </View>
      </AnimatedPressable>
    );
  }

  // Web with map
  return (
    <AnimatedPressable
      style={[
        styles.tile,
        isComplete && styles.tileComplete,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Course Map: ${isComplete ? 'Complete' : 'Not set'}`}
    >
      {/* Completion badge */}
      {isComplete && (
        <View style={styles.completeBadge}>
          <Check size={12} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      {/* Map container */}
      {(coords || positionedCourse) ? (
        <View style={styles.mapWrapper}>
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 12,
            }}
          />

          {/* Marine overlay container (wind, current, wave arrows) */}
          <div
            ref={overlayContainerRef}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 12,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          />

          {/* Loading overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={COLORS.purple} />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}

          {/* Wind direction indicator */}
          {windDirection !== undefined && !loading && (
            <WindDirectionIndicator
              direction={windDirection}
              speed={windSpeed ?? 10}
              position="top-right"
              size={56}
            />
          )}

          {/* Legend for wind/current arrows */}
          {!loading && (windDirection !== undefined || currentDirection !== undefined) && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 6,
                padding: '4px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                zIndex: 10,
              }}
            >
              {windDirection !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24">
                    <path d="M12 4L12 20M12 4L6 10M12 4L18 10" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 500 }}>Wind</span>
                </div>
              )}
              {currentDirection !== undefined && currentSpeed !== undefined && currentSpeed > 0.1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24">
                    <path d="M12 4C14 7 10 10 12 13C14 16 10 19 12 22" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                  <span style={{ fontSize: 9, color: '#0ea5e9', fontWeight: 500 }}>Current</span>
                </div>
              )}
            </div>
          )}
        </View>
      ) : (
        <View style={styles.emptyPlaceholder}>
          <MapPin size={28} color={COLORS.gray} />
          <Text style={styles.emptyText}>Set race location</Text>
        </View>
      )}

      {/* Label bar at bottom */}
      <View style={styles.labelBar}>
        <Text style={styles.labelText}>COURSE</Text>
        {courseTypeName && (
          <Text style={styles.courseTypeText}>{courseTypeName}</Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 322,  // Match 2x2 tile grid: (155 * 2) + 12
    height: 322,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
      },
      default: {},
    }),
  },
  tileComplete: {
    borderColor: `${COLORS.green}60`,
  },
  completeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  emptyPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray6,
    margin: 4,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 8,
  },
  nativePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray6,
    margin: 4,
    borderRadius: 12,
    gap: 6,
  },
  nativeText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.label,
    textAlign: 'center',
  },
  venueText: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  labelBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 0.8,
  },
  courseTypeText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.blue,
  },
});

export default CourseMapTile;
