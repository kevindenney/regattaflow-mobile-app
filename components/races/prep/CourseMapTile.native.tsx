/**
 * CourseMapTile - Native Implementation
 *
 * Shows the race venue location and course using react-native-maps.
 * On native: Renders an interactive map with course visualization
 *
 * Features:
 * - Large square format (~aspectRatio 1) for better map visibility
 * - Green completion badge when course is configured
 * - "COURSE" label overlay at bottom
 * - Tap to open CourseMapWizard
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  TurboModuleRegistry,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Check, MapPin, Map, Wind, Waves } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { PositionedCourse } from '@/types/courses';
import { COURSE_TEMPLATES } from '@/services/CoursePositioningService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Safely import react-native-maps
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = null;
let mapsAvailable = false;

try {
  const nativeModule = TurboModuleRegistry.get('RNMapsAirModule');
  if (nativeModule) {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
    mapsAvailable = true;
  }
} catch (_e) {
  // react-native-maps not available
}

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
  /** Wind direction in degrees (0-360) for overlay */
  windDirection?: number;
  /** Wind speed in knots */
  windSpeed?: number;
  /** Current direction in degrees (0-360) */
  currentDirection?: number;
  /** Current speed in knots */
  currentSpeed?: number;
  /** Wave height in meters */
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
}: CourseMapTileProps) {
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

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

  const courseTypeName = positionedCourse
    ? COURSE_TEMPLATES[positionedCourse.courseType]?.name || 'Custom Course'
    : null;

  // Calculate initial region
  const initialRegion = useMemo(() => {
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
      const centerLat = (Math.min(...allLats) + Math.max(...allLats)) / 2;
      const centerLng = (Math.min(...allLngs) + Math.max(...allLngs)) / 2;
      const latDelta = (Math.max(...allLats) - Math.min(...allLats)) * 1.5 || 0.02;
      const lngDelta = (Math.max(...allLngs) - Math.min(...allLngs)) * 1.5 || 0.02;

      return {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      };
    } else if (coords) {
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    return null;
  }, [coords, positionedCourse]);

  // Course line coordinates
  const courseCoordinates = useMemo(() => {
    if (!positionedCourse) return [];
    return positionedCourse.marks
      .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
      .map((m) => ({
        latitude: m.latitude,
        longitude: m.longitude,
      }));
  }, [positionedCourse]);

  // Start line coordinates
  const startLineCoordinates = useMemo(() => {
    if (!positionedCourse?.startLine) return [];
    return [
      { latitude: positionedCourse.startLine.pin.lat, longitude: positionedCourse.startLine.pin.lng },
      { latitude: positionedCourse.startLine.committee.lat, longitude: positionedCourse.startLine.committee.lng },
    ];
  }, [positionedCourse]);

  // Get mark label
  const getMarkLabel = (mark: { type: string }, index: number): string => {
    if (mark.type === 'windward') return 'W';
    if (mark.type === 'leeward') return 'L';
    if (mark.type === 'gate') return 'G';
    if (mark.type === 'wing') return 'R';
    if (mark.type === 'offset') return 'O';
    return (index + 1).toString();
  };

  // Fallback when maps not available or no coordinates
  if (!mapsAvailable || !MapView || !initialRegion) {
    return (
      <AnimatedPressable
        style={[
          styles.tile,
          isComplete && styles.tileComplete,
          animatedStyle,
          IOS_SHADOWS.card,
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
        <View style={styles.placeholderContent}>
          {!initialRegion ? (
            <>
              <MapPin size={32} color={COLORS.gray} />
              <Text style={styles.placeholderText}>Set race location</Text>
            </>
          ) : (
            <>
              <Map size={32} color={COLORS.purple} />
              <Text style={styles.placeholderText}>
                {positionedCourse ? courseTypeName : 'Set course'}
              </Text>
              {venueName && <Text style={styles.venueText}>{venueName}</Text>}
              <Text style={styles.hintText}>
                Maps require a development build
              </Text>
            </>
          )}
        </View>
        <View style={styles.labelBar}>
          <Text style={styles.labelText}>COURSE</Text>
        </View>
      </AnimatedPressable>
    );
  }

  // Native map implementation
  return (
    <AnimatedPressable
      style={[
        styles.tile,
        isComplete && styles.tileComplete,
        animatedStyle,
        IOS_SHADOWS.card,
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
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onMapReady={() => setMapReady(true)}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          mapType="standard"
          liteMode={Platform.OS === 'android'} // Better performance on Android for preview tiles
        >
          {/* Course Line */}
          {courseCoordinates.length > 1 && (
            <Polyline
              coordinates={courseCoordinates}
              strokeColor="#f97316"
              strokeWidth={2}
              lineDashPattern={[6, 4]}
            />
          )}

          {/* Start Line */}
          {startLineCoordinates.length === 2 && (
            <Polyline
              coordinates={startLineCoordinates}
              strokeColor="#22c55e"
              strokeWidth={3}
            />
          )}

          {/* Course Marks */}
          {positionedCourse?.marks.map((mark, index) => (
            <Marker
              key={mark.id}
              coordinate={{
                latitude: mark.latitude,
                longitude: mark.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={[
                  styles.markCircle,
                  { backgroundColor: MARK_COLORS[mark.type] || '#64748b' },
                ]}
              >
                <Text style={styles.markLabel}>{getMarkLabel(mark, index)}</Text>
              </View>
            </Marker>
          ))}

          {/* Start Line Endpoints */}
          {positionedCourse?.startLine && (
            <>
              <Marker
                coordinate={{
                  latitude: positionedCourse.startLine.pin.lat,
                  longitude: positionedCourse.startLine.pin.lng,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[styles.startLineEndpoint, { backgroundColor: '#f97316' }]}>
                  <Text style={styles.startLineLabel}>P</Text>
                </View>
              </Marker>
              <Marker
                coordinate={{
                  latitude: positionedCourse.startLine.committee.lat,
                  longitude: positionedCourse.startLine.committee.lng,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[styles.startLineEndpoint, { backgroundColor: '#3b82f6' }]}>
                  <Text style={styles.startLineLabel}>C</Text>
                </View>
              </Marker>
            </>
          )}

          {/* Simple location marker when no course */}
          {!positionedCourse && coords && (
            <Marker
              coordinate={{
                latitude: coords.lat,
                longitude: coords.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.locationMarker} />
            </Marker>
          )}
        </MapView>

        {/* Loading overlay */}
        {!mapReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.purple} />
          </View>
        )}

        {/* Wind/Current indicator badge */}
        {mapReady && (windDirection !== undefined || currentDirection !== undefined) && (
          <View style={styles.conditionsBadge}>
            {windDirection !== undefined && (
              <View style={styles.conditionItem}>
                <Wind size={12} color="#22c55e" />
                <Text style={styles.conditionText}>{windDirection}°</Text>
              </View>
            )}
            {currentDirection !== undefined && currentSpeed !== undefined && currentSpeed > 0.1 && (
              <View style={styles.conditionItem}>
                <Waves size={12} color="#0ea5e9" />
                <Text style={styles.conditionText}>{currentSpeed.toFixed(1)}kt</Text>
              </View>
            )}
          </View>
        )}
      </View>

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
    width: 322,
    height: 322,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    overflow: 'hidden',
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray6,
    margin: 4,
    borderRadius: 12,
    gap: 6,
  },
  placeholderText: {
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
  hintText: {
    fontSize: 11,
    color: COLORS.gray3,
    textAlign: 'center',
    marginTop: 4,
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
  markCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  markLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
  },
  startLineEndpoint: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  startLineLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'white',
  },
  locationMarker: {
    width: 20,
    height: 20,
    backgroundColor: COLORS.purple,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  conditionsBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
});

export default CourseMapTile;
