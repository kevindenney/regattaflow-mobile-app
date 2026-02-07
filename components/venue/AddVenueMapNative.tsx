/**
 * AddVenueMapNative - Native implementation
 *
 * React Native Maps-based venue picker for iOS/Android.
 * Shows existing venues and allows tapping to place a new venue marker.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TurboModuleRegistry } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

// Safely import react-native-maps
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
let mapsAvailable = false;

try {
  const nativeModule = TurboModuleRegistry.get('RNMapsAirModule');
  if (nativeModule) {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
    mapsAvailable = true;
  }
} catch (e) {
  console.warn('[AddVenueMapNative] react-native-maps not available');
}

interface Venue {
  id: string;
  name: string;
  coordinates_lat: number;
  coordinates_lng: number;
  venue_type: string;
}

interface AddVenueMapNativeProps {
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  searchQuery?: string;
}

export function AddVenueMapNative({
  selectedLocation,
  onLocationSelect,
  searchQuery,
}: AddVenueMapNativeProps) {
  const mapRef = useRef<any>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const lastSearchRef = useRef<string>('');

  // Fetch existing venues
  useEffect(() => {
    async function fetchVenues() {
      try {
        const { data, error } = await supabase
          .from('sailing_venues')
          .select('id, name, coordinates_lat, coordinates_lng, venue_type')
          .not('coordinates_lat', 'is', null)
          .not('coordinates_lng', 'is', null);

        if (!error && data) {
          setVenues(data);
        }
      } catch {
        // Silent error
      } finally {
        setLoading(false);
      }
    }

    fetchVenues();
  }, []);

  // Handle map press
  const handleMapPress = useCallback(
    (event: any) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      onLocationSelect(latitude, longitude);
    },
    [onLocationSelect]
  );

  // Animate to selected location
  useEffect(() => {
    if (mapRef.current && selectedLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        },
        300
      );
    }
  }, [selectedLocation]);

  // Geocode search query to find location
  useEffect(() => {
    if (!mapRef.current || !searchQuery) return;

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 3 || trimmedQuery === lastSearchRef.current) return;

    // Debounce - only search after user stops typing
    const timeoutId = setTimeout(async () => {
      lastSearchRef.current = trimmedQuery;

      try {
        // Use Nominatim for geocoding (free, no API key needed)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedQuery)}&limit=1`,
          {
            headers: {
              'User-Agent': 'RegattaFlow/1.0 (https://regattaflow.com)',
            },
          }
        );

        if (response.ok) {
          const results = await response.json();
          if (results && results.length > 0) {
            const { lat, lon } = results[0];
            mapRef.current?.animateToRegion(
              {
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
                latitudeDelta: 2,
                longitudeDelta: 2,
              },
              500
            );
          }
        }
      } catch (error) {
        // Silent fail - just don't move the map
        console.warn('Geocoding failed:', error);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle marker drag
  const handleMarkerDragEnd = useCallback(
    (event: any) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      onLocationSelect(latitude, longitude);
    },
    [onLocationSelect]
  );

  // Fallback UI when maps not available
  if (!mapsAvailable) {
    return (
      <View style={styles.fallbackContainer}>
        <Ionicons name="map-outline" size={48} color={IOS_COLORS.systemGray3} />
        <Text style={styles.fallbackTitle}>Map Unavailable</Text>
        <Text style={styles.fallbackText}>
          Native maps require a development build.{'\n'}
          Use web version or run with EAS Build.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
      </View>
    );
  }

  const getMarkerColor = (venueType: string) => {
    switch (venueType) {
      case 'championship':
        return '#ffc107';
      case 'premier':
        return '#007AFF';
      default:
        return '#8e8e93';
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 40,
          longitude: -95,
          latitudeDelta: 30,
          longitudeDelta: 30,
        }}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton
        mapType="standard"
      >
        {/* Existing venue markers */}
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{
              latitude: venue.coordinates_lat,
              longitude: venue.coordinates_lng,
            }}
            title={venue.name}
            pinColor={getMarkerColor(venue.venue_type)}
            opacity={0.7}
          />
        ))}

        {/* New venue location marker */}
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.lat,
              longitude: selectedLocation.lng,
            }}
            draggable
            onDragEnd={handleMarkerDragEnd}
            pinColor="#007AFF"
            title="New venue"
          >
            <View style={styles.newVenueMarker}>
              <Ionicons name="add" size={24} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  fallbackTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  fallbackText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  newVenueMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 6,
  },
});

export default AddVenueMapNative;
