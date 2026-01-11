/**
 * TacticalRaceMapNative - Native iOS/Android Race Map
 *
 * Native counterpart to TacticalRaceMap (web version using MapLibre GL)
 * Uses react-native-maps with course overlays, wind/current visualization
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TurboModuleRegistry } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  CourseMark,
  EnvironmentalIntelligence,
  RaceEventWithDetails,
} from '@/types/raceEvents';
import { CourseOverlay, convertMarksToCoourse } from '@/components/race-detail/map/CourseOverlay';
import { WindOverlay } from '@/components/race-detail/map/WindOverlay';
import { CurrentOverlay } from '@/components/race-detail/map/CurrentOverlay';
import { LaylinesOverlay } from '@/components/race-detail/map/LaylinesOverlay';
import { WindDirectionIndicator } from '@/components/race-detail/map/WindDirectionIndicator';

// Conditional imports for native only (requires development build)
let MapView: any = null;
let PROVIDER_GOOGLE: any = null;
let mapsAvailable = false;

// Check if native module is registered BEFORE requiring react-native-maps
// This prevents TurboModuleRegistry.getEnforcing from throwing
if (Platform.OS !== 'web') {
  try {
    // Use 'get' instead of 'getEnforcing' to check without throwing
    const nativeModule = TurboModuleRegistry.get('RNMapsAirModule');
    if (nativeModule) {
      const maps = require('react-native-maps');
      MapView = maps.default;
      PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
      mapsAvailable = true;
    }
  } catch (_e) {
    // react-native-maps not available - will use fallback UI
  }
}

interface TacticalRaceMapNativeProps {
  raceEvent: RaceEventWithDetails;
  marks: CourseMark[];
  environmental?: EnvironmentalIntelligence;
  onMarkSelected?: (mark: CourseMark) => void;
  showControls?: boolean;
  externalLayers?: {
    wind?: boolean;
    current?: boolean;
    waves?: boolean;
    depth?: boolean;
    laylines?: boolean;
    strategy?: boolean;
  };
  onLayersChange?: (layers: { [key: string]: boolean }) => void;
}

interface LayerState {
  wind: boolean;
  current: boolean;
  laylines: boolean;
}

/**
 * Calculate map region from marks and venue
 */
const calculateRegion = (marks: CourseMark[], venue?: any) => {
  // Default to Hong Kong if no data
  const defaultRegion = {
    latitude: 22.265,
    longitude: 114.262,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // Try venue coordinates first
  if (venue?.coordinates_lat && venue?.coordinates_lng) {
    return {
      latitude: venue.coordinates_lat,
      longitude: venue.coordinates_lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }

  // Calculate from marks
  if (marks && marks.length > 0) {
    const lats = marks.map(m => m.latitude);
    const lngs = marks.map(m => m.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Add padding
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }

  return defaultRegion;
};

export default function TacticalRaceMapNative({
  raceEvent,
  marks,
  environmental,
  onMarkSelected,
  showControls = true,
  externalLayers,
  onLayersChange,
}: TacticalRaceMapNativeProps) {
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState(() => calculateRegion(marks, raceEvent?.venue));

  // Layer visibility state
  const [layers, setLayers] = useState<LayerState>({
    wind: externalLayers?.wind ?? true,
    current: externalLayers?.current ?? true,
    laylines: externalLayers?.laylines ?? true,
  });

  // Update layers from external control
  React.useEffect(() => {
    if (externalLayers) {
      setLayers(prev => ({
        wind: externalLayers.wind ?? prev.wind,
        current: externalLayers.current ?? prev.current,
        laylines: externalLayers.laylines ?? prev.laylines,
      }));
    }
  }, [externalLayers]);

  // Convert marks to course format
  const course = useMemo(() => {
    if (!marks || marks.length === 0) return null;
    return convertMarksToCoourse(marks);
  }, [marks]);

  // Extract environmental data
  const windData = useMemo(() => {
    if (!environmental?.current?.wind) return null;
    return {
      direction: environmental.current.wind.direction,
      speed: environmental.current.wind.speed,
      gusts: environmental.current.wind.gusts,
    };
  }, [environmental]);

  const currentData = useMemo(() => {
    if (!environmental?.current?.tide) return null;
    const tide = environmental.current.tide;
    return {
      direction: tide.current_direction ?? 0,
      speed: tide.current_speed ?? 0,
      strength: (tide.current_speed ?? 0) < 0.3 ? 'slack' :
                (tide.current_speed ?? 0) < 0.8 ? 'moderate' : 'strong',
    };
  }, [environmental]);

  // Handle mark press
  const handleMarkPress = useCallback((mark: any) => {
    // Find the corresponding CourseMark
    const courseMark = marks.find(m =>
      m.latitude === mark.coordinate.latitude &&
      m.longitude === mark.coordinate.longitude
    );
    if (courseMark) {
      onMarkSelected?.(courseMark);
    }
  }, [marks, onMarkSelected]);

  // Toggle layer visibility
  const toggleLayer = useCallback((layerId: keyof LayerState) => {
    setLayers(prev => {
      const newLayers = { ...prev, [layerId]: !prev[layerId] };
      onLayersChange?.(newLayers);
      return newLayers;
    });
  }, [onLayersChange]);

  // Center map on course
  const centerOnCourse = useCallback(() => {
    if (mapRef.current && marks.length > 0) {
      const newRegion = calculateRegion(marks, raceEvent?.venue);
      mapRef.current.animateToRegion(newRegion, 500);
    }
  }, [marks, raceEvent?.venue]);

  // Handle region change
  const handleRegionChange = useCallback((newRegion: any) => {
    setRegion(newRegion);
  }, []);

  // Platform check - requires development build with react-native-maps
  if (Platform.OS === 'web' || !mapsAvailable || !MapView) {
    return (
      <View style={styles.fallbackContainer}>
        <Ionicons name="map-outline" size={64} color="#0066CC" />
        <Text style={styles.fallbackText}>3D Tactical Race Map</Text>
        <Text style={styles.fallbackSubtext}>
          {Platform.OS === 'web'
            ? 'Use the web version for full map features'
            : 'Requires a development build with native maps.\nRun: npx expo prebuild && npx expo run:ios'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        mapType="hybrid"
        initialRegion={calculateRegion(marks, raceEvent?.venue)}
        onRegionChangeComplete={handleRegionChange}
        onMapReady={() => setMapReady(true)}
        showsUserLocation
        showsCompass={false}
        rotateEnabled
        pitchEnabled
      >
        {/* Course overlay (marks, lines) */}
        {mapReady && course && (
          <CourseOverlay
            course={course}
            onMarkPress={handleMarkPress}
            showLabels={true}
          />
        )}

        {/* Wind overlay */}
        {mapReady && layers.wind && windData && (
          <WindOverlay
            conditions={{
              direction: windData.direction,
              speed: windData.speed,
              gusts: windData.gusts,
            }}
            region={region}
          />
        )}

        {/* Current/Tide overlay */}
        {mapReady && layers.current && currentData && (
          <CurrentOverlay
            conditions={{
              direction: currentData.direction,
              speed: currentData.speed,
              strength: currentData.strength as 'slack' | 'moderate' | 'strong',
            }}
            region={region}
          />
        )}

        {/* Laylines overlay */}
        {mapReady && layers.laylines && windData && marks.length > 0 && (
          <LaylinesOverlay
            marks={marks}
            windDirection={windData.direction}
          />
        )}
      </MapView>

      {/* Wind direction indicator */}
      {mapReady && windData && (
        <WindDirectionIndicator
          direction={windData.direction}
          speed={windData.speed}
          gusts={windData.gusts}
          position="top-right"
        />
      )}

      {/* Map controls */}
      {showControls && mapReady && (
        <View style={styles.controlsContainer}>
          {/* Center button */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={centerOnCourse}
            activeOpacity={0.7}
          >
            <Ionicons name="locate-outline" size={20} color="#ffffff" />
          </TouchableOpacity>

          {/* Layer toggles */}
          <View style={styles.layerControls}>
            <TouchableOpacity
              style={[styles.layerButton, layers.wind && styles.layerButtonActive]}
              onPress={() => toggleLayer('wind')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="flag-outline"
                size={16}
                color={layers.wind ? '#3b82f6' : '#64748b'}
              />
              <Text style={[styles.layerButtonText, layers.wind && styles.layerButtonTextActive]}>
                Wind
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.layerButton, layers.current && styles.layerButtonActive]}
              onPress={() => toggleLayer('current')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="water-outline"
                size={16}
                color={layers.current ? '#3b82f6' : '#64748b'}
              />
              <Text style={[styles.layerButtonText, layers.current && styles.layerButtonTextActive]}>
                Tide
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.layerButton, layers.laylines && styles.layerButtonActive]}
              onPress={() => toggleLayer('laylines')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="git-branch-outline"
                size={16}
                color={layers.laylines ? '#3b82f6' : '#64748b'}
              />
              <Text style={[styles.layerButtonText, layers.laylines && styles.layerButtonTextActive]}>
                Laylines
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loading state */}
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  fallbackContainer: {
    flex: 1,
    minHeight: 300,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fallbackText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  fallbackSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  controlsContainer: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  layerControls: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 8,
    gap: 4,
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  layerButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  layerButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  layerButtonTextActive: {
    color: '#3b82f6',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
});
