/**
 * VenueHeroMap
 *
 * Apple Maps-inspired hero map component for venue screens.
 * Racing areas displayed as first-class citizens with tappable circles.
 * Supports both native (react-native-maps) and web (MapLibre) implementations.
 */

import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Pressable, Platform, TurboModuleRegistry } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TufteTokens } from '@/constants/designSystem';
import { RacingAreaCircleOverlay } from './RacingAreaCircleOverlay';
import { UnknownAreaBanner } from './UnknownAreaPrompt';
import { VenuePreviewCard } from './VenuePreviewCard';
import { MapPostMarkers } from './map/MapPostMarkers';
import type { VenueRacingArea } from '@/services/venue/CommunityVenueCreationService';
import type { FeedPost } from '@/types/community-feed';

// Safely import react-native-maps
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
let mapsAvailable = false;

// Check if native module is registered BEFORE requiring react-native-maps
// This prevents TurboModuleRegistry.getEnforcing from throwing
if (Platform.OS !== 'web') {
  try {
    const nativeModule = TurboModuleRegistry.get('RNMapsAirModule');
    if (nativeModule) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const maps = require('react-native-maps');
      MapView = maps.default;
      Marker = maps.Marker;
      PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
      mapsAvailable = true;
    } else {
      console.warn('[VenueHeroMap] RNMapsAirModule not registered - using fallback UI');
    }
  } catch (e) {
    console.warn('[VenueHeroMap] react-native-maps not available:', e);
  }
}

export interface VenueHeroMapProps {
  // Venue info (for preview card fallback)
  venueName?: string;
  venueCountry?: string;
  // Venue center
  center?: {
    latitude: number;
    longitude: number;
  };
  // Racing areas to display
  racingAreas: VenueRacingArea[];
  // Currently selected area
  selectedAreaId?: string | null;
  // Callbacks
  onAreaSelect?: (area: VenueRacingArea) => void;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  onMapLongPress?: (coords: { latitude: number; longitude: number }) => void;
  // Unknown area detection
  isInUnknownArea?: boolean;
  onCreateAreaPress?: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
  // Manual pin placement
  manualPinLocation?: { latitude: number; longitude: number } | null;
  onClearManualPin?: () => void;
  // Display options
  height?: number | string;
  showUserLocation?: boolean;
  showCompass?: boolean;
  showConditionsOverlay?: boolean;
  // Loading state
  isLoading?: boolean;
  // Weather data (for preview card fallback)
  windSpeed?: number;
  windDirection?: string;
  windData?: number[];
  tideHeight?: number;
  tideState?: 'rising' | 'falling' | 'high' | 'low';
  tideData?: number[];
  currentSpeed?: number;
  currentData?: number[];
  discussionCount?: number;
  // Community feed map pins
  mapPinnedPosts?: FeedPost[];
  onPostMarkerPress?: (post: FeedPost) => void;
}

export function VenueHeroMap({
  venueName,
  venueCountry,
  center,
  racingAreas,
  selectedAreaId,
  onAreaSelect,
  onMapPress,
  onMapLongPress,
  isInUnknownArea = false,
  onCreateAreaPress,
  userLocation,
  manualPinLocation,
  onClearManualPin,
  height = 280,
  showUserLocation = true,
  showCompass = true,
  showConditionsOverlay: _showConditionsOverlay = false,
  isLoading = false,
  // Weather data for preview card
  windSpeed,
  windDirection,
  windData,
  tideHeight,
  tideState,
  tideData,
  currentSpeed,
  currentData,
  discussionCount,
  mapPinnedPosts,
  onPostMarkerPress,
}: VenueHeroMapProps) {
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Calculate initial region based on center or first area
  const initialRegion = useMemo(() => {
    if (center) {
      return {
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    if (racingAreas.length > 0) {
      const firstArea = racingAreas.find((a) => a.center_lat && a.center_lng);
      if (firstArea) {
        return {
          latitude: firstArea.center_lat!,
          longitude: firstArea.center_lng!,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
      }
    }

    // Default to a sensible location
    return {
      latitude: 22.3,
      longitude: 114.17,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }, [center, racingAreas]);

  // Animate to selected area
  useEffect(() => {
    if (!mapRef.current || !mapReady || !selectedAreaId) return;

    const selectedArea = racingAreas.find((a) => a.id === selectedAreaId);
    if (selectedArea?.center_lat && selectedArea?.center_lng) {
      mapRef.current.animateToRegion(
        {
          latitude: selectedArea.center_lat,
          longitude: selectedArea.center_lng,
          // Zoom in to show the area based on its radius
          latitudeDelta: (selectedArea.radius_meters || 2000) / 50000,
          longitudeDelta: (selectedArea.radius_meters || 2000) / 50000,
        },
        300
      );
    }
  }, [selectedAreaId, racingAreas, mapReady]);

  // Fit all areas in view when areas change
  const fitAllAreas = useCallback(() => {
    if (!mapRef.current || !mapReady || racingAreas.length === 0) return;

    const validAreas = racingAreas.filter((a) => a.center_lat && a.center_lng);
    if (validAreas.length === 0) return;

    const coordinates = validAreas.map((a) => ({
      latitude: a.center_lat!,
      longitude: a.center_lng!,
    }));

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 100, left: 50 },
      animated: true,
    });
  }, [racingAreas, mapReady]);

  const handleMapPress = useCallback(
    (event: any) => {
      const { coordinate } = event.nativeEvent;
      onMapPress?.(coordinate);
    },
    [onMapPress]
  );

  const handleMapLongPress = useCallback(
    (event: any) => {
      const { coordinate } = event.nativeEvent;
      onMapLongPress?.(coordinate);
    },
    [onMapLongPress]
  );

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  // Fallback: use data-rich VenuePreviewCard when maps aren't available
  if (!mapsAvailable) {
    return (
      <VenuePreviewCard
        venueName={venueName || 'Venue'}
        country={venueCountry}
        windSpeed={windSpeed}
        windDirection={windDirection}
        windData={windData}
        tideHeight={tideHeight}
        tideState={tideState}
        tideData={tideData}
        currentSpeed={currentSpeed}
        currentData={currentData}
        racingAreaCount={racingAreas.length}
        discussionCount={discussionCount}
        racingAreas={racingAreas}
        onAreaSelect={onAreaSelect}
        height={height}
      />
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation={showUserLocation}
        showsCompass={showCompass}
        showsScale
        showsMyLocationButton={false}
        onPress={handleMapPress}
        onLongPress={handleMapLongPress}
        onMapReady={handleMapReady}
        mapType="standard"
        // Tufte-inspired: minimal UI
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
      >
        {/* Racing area circles */}
        <RacingAreaCircleOverlay
          areas={racingAreas}
          selectedAreaId={selectedAreaId}
          onAreaPress={onAreaSelect}
          showLabels
        />

        {/* Community feed post markers */}
        {mapPinnedPosts && mapPinnedPosts.length > 0 && (
          <MapPostMarkers
            posts={mapPinnedPosts}
            onPostPress={onPostMarkerPress}
          />
        )}

        {/* Manual pin for area creation */}
        {manualPinLocation && Marker && (
          <Marker
            coordinate={manualPinLocation}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <View style={styles.manualPinContainer}>
              <View style={styles.manualPin}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.manualPinShadow} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#2563EB" />
        </View>
      )}

      {/* Unknown area banner */}
      {isInUnknownArea && userLocation && onCreateAreaPress && !manualPinLocation && (
        <View style={styles.unknownAreaBanner}>
          <UnknownAreaBanner
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            onPress={onCreateAreaPress}
          />
        </View>
      )}

      {/* Manual pin action banner */}
      {manualPinLocation && onCreateAreaPress && (
        <View style={styles.manualPinBanner}>
          <Pressable style={styles.manualPinAction} onPress={onCreateAreaPress}>
            <View style={styles.manualPinActionIcon}>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.manualPinActionText}>
              <Text style={styles.manualPinActionTitle}>Create Racing Area Here</Text>
              <Text style={styles.manualPinActionSubtitle}>
                {manualPinLocation.latitude.toFixed(4)}°, {manualPinLocation.longitude.toFixed(4)}°
              </Text>
            </View>
          </Pressable>
          {onClearManualPin && (
            <Pressable style={styles.manualPinClear} onPress={onClearManualPin}>
              <Ionicons name="close" size={18} color="#6B7280" />
            </Pressable>
          )}
        </View>
      )}

      {/* Map controls */}
      <View style={styles.controls}>
        {/* Fit all button */}
        <Pressable style={styles.controlButton} onPress={fitAllAreas}>
          <Ionicons name="scan-outline" size={18} color="#374151" />
        </Pressable>

        {/* My location button */}
        {showUserLocation && userLocation && (
          <Pressable
            style={styles.controlButton}
            onPress={() => {
              mapRef.current?.animateToRegion(
                {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                300
              );
            }}
          >
            <Ionicons name="navigate" size={18} color="#2563EB" />
          </Pressable>
        )}
      </View>

      {/* Area count badge */}
      {racingAreas.length > 0 && (
        <View style={styles.areaBadge}>
          <Text style={styles.areaBadgeText}>
            {racingAreas.length} area{racingAreas.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Long-press hint (shown when no areas and no pin) */}
      {racingAreas.length === 0 && !manualPinLocation && !isLoading && (
        <View style={styles.hintBadge}>
          <Ionicons name="hand-left-outline" size={12} color="#6B7280" />
          <Text style={styles.hintText}>Long-press to define an area</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Compact version for inline use
 */
export function VenueHeroMapCompact(props: VenueHeroMapProps) {
  return <VenueHeroMap {...props} height={180} showCompass={false} />;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: TufteTokens.backgrounds.subtle,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Controls
  controls: {
    position: 'absolute',
    right: TufteTokens.spacing.standard,
    bottom: TufteTokens.spacing.standard,
    gap: TufteTokens.spacing.compact,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...TufteTokens.shadows.subtle,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Area badge
  areaBadge: {
    position: 'absolute',
    left: TufteTokens.spacing.standard,
    bottom: TufteTokens.spacing.standard,
    paddingHorizontal: TufteTokens.spacing.compact,
    paddingVertical: TufteTokens.spacing.tight,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: TufteTokens.borderRadius.subtle,
    ...TufteTokens.shadows.subtle,
  },
  areaBadgeText: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Hint badge
  hintBadge: {
    position: 'absolute',
    left: TufteTokens.spacing.standard,
    bottom: TufteTokens.spacing.standard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: TufteTokens.spacing.compact,
    paddingVertical: TufteTokens.spacing.tight,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: TufteTokens.borderRadius.subtle,
    ...TufteTokens.shadows.subtle,
  },
  hintText: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
  },

  // Unknown area banner
  unknownAreaBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TufteTokens.spacing.section + 40, // Above controls
  },

  // Manual pin
  manualPinContainer: {
    alignItems: 'center',
  },
  manualPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...TufteTokens.shadows.subtle,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  manualPinShadow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginTop: -4,
  },

  // Manual pin action banner
  manualPinBanner: {
    position: 'absolute',
    left: TufteTokens.spacing.standard,
    right: TufteTokens.spacing.standard,
    bottom: TufteTokens.spacing.section + 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: TufteTokens.borderRadius.subtle,
    ...TufteTokens.shadows.subtle,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  manualPinAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: TufteTokens.spacing.standard,
    gap: TufteTokens.spacing.standard,
  },
  manualPinActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualPinActionText: {
    flex: 1,
    gap: 2,
  },
  manualPinActionTitle: {
    ...TufteTokens.typography.secondary,
    fontWeight: '600',
    color: '#111827',
  },
  manualPinActionSubtitle: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  manualPinClear: {
    padding: TufteTokens.spacing.standard,
    borderLeftWidth: TufteTokens.borders.hairline,
    borderLeftColor: TufteTokens.borders.colorSubtle,
  },

});

export default VenueHeroMap;
