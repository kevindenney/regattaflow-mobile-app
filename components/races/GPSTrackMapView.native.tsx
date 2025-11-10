/**
 * GPS Track Map View Component
 * Displays GPS track on a minimalist map with auto-follow capability
 *
 * Features:
 * - Clean breadcrumb trail showing GPS track
 * - Auto-follow mode for live tracking
 * - Full track mode for post-race review
 * - Support for multiple track overlays (fleet comparison)
 * - Minimalist map styling (light blue water, green land)
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Navigation } from 'lucide-react-native';
import type { GPSTrackMapViewProps } from './GPSTrackMapView.types';

export function GPSTrackMapView({
  trackPoints,
  autoFollow = false,
  fleetTracks = [],
  initialRegion,
  courseMarks = [],
}: GPSTrackMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Auto-follow current position
  useEffect(() => {
    if (!autoFollow || !mapReady || trackPoints.length === 0) return;

    const currentPosition = trackPoints[trackPoints.length - 1];

    mapRef.current?.animateCamera({
      center: {
        latitude: currentPosition.lat,
        longitude: currentPosition.lng,
      },
      zoom: 16, // Close zoom for live tracking
    }, { duration: 300 });
  }, [trackPoints, autoFollow, mapReady]);

  // Fit all track points when not auto-following
  useEffect(() => {
    if (autoFollow || !mapReady || trackPoints.length === 0) return;

    // Calculate bounds for all tracks
    const allPoints = [
      ...trackPoints,
      ...fleetTracks.flatMap(ft => ft.trackPoints),
    ];

    if (allPoints.length === 0) return;

    const coordinates = allPoints.map(point => ({
      latitude: point.lat,
      longitude: point.lng,
    }));

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  }, [trackPoints, fleetTracks, autoFollow, mapReady]);

  // Convert track points to coordinates for Polyline
  const trackCoordinates = trackPoints.map(point => ({
    latitude: point.lat,
    longitude: point.lng,
  }));

  // Current position marker (last point in track)
  const currentPosition = trackPoints.length > 0
    ? trackPoints[trackPoints.length - 1]
    : null;

  // Default region if no initial region provided
  const defaultRegion = initialRegion || {
    latitude: currentPosition?.lat || 22.3193,
    longitude: currentPosition?.lng || 114.1694,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={defaultRegion}
        onMapReady={() => setMapReady(true)}
        mapType="standard"
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        scrollEnabled={!autoFollow} // Disable scroll in auto-follow mode
        zoomEnabled={!autoFollow}
        rotateEnabled={false}
        pitchEnabled={false}
        customMapStyle={MINIMALIST_MAP_STYLE}
      >
        {/* Course marks */}
        {courseMarks.map((mark, index) => (
          <Marker
            key={`mark-${index}`}
            coordinate={{
              latitude: mark.latitude,
              longitude: mark.longitude,
            }}
            title={mark.name}
            pinColor="orange"
          />
        ))}

        {/* Fleet tracks */}
        {fleetTracks.map((fleetTrack, index) => (
          <Polyline
            key={`fleet-${index}`}
            coordinates={fleetTrack.trackPoints.map(p => ({
              latitude: p.lat,
              longitude: p.lng,
            }))}
            strokeColor={fleetTrack.color}
            strokeWidth={2}
            lineDashPattern={[5, 5]} // Dashed line for fleet tracks
          />
        ))}

        {/* Your track (primary) */}
        {trackCoordinates.length > 1 && (
          <Polyline
            coordinates={trackCoordinates}
            strokeColor="#2563EB" // Blue for your track
            strokeWidth={3}
          />
        )}

        {/* Current position marker */}
        {currentPosition && autoFollow && (
          <Marker
            coordinate={{
              latitude: currentPosition.lat,
              longitude: currentPosition.lng,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={currentPosition.heading || 0}
          >
            <View style={styles.boatMarker}>
              <Navigation size={24} color="#2563EB" fill="#2563EB" />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

// Minimalist map style matching the design in the screenshots
const MINIMALIST_MAP_STYLE = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#C6E5F5' }], // Light blue water
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#D4E8C4' }], // Light green land
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }], // Hide points of interest
  },
  {
    featureType: 'road',
    elementType: 'all',
    stylers: [{ visibility: 'off' }], // Hide roads
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'off' }], // Hide transit
  },
  {
    featureType: 'administrative',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }], // Hide admin labels
  },
  {
    featureType: 'landscape',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }], // Hide landscape labels
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  boatMarker: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
