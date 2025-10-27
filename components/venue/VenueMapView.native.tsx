/**
 * VenueMapView Component - Native Implementation with Clustering
 * Enhanced map view with custom markers and venue interactions
 * Universal support: iOS (Apple Maps), Android (Google Maps)
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import ClusteredMapView from 'react-native-maps-super-cluster';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';

interface Venue {
  id: string;
  name: string;
  country: string;
  region: string;
  venue_type: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

interface YachtClub {
  id: string;
  name: string;
  short_name?: string;
  coordinates_lat: number;
  coordinates_lng: number;
  prestige_level?: string;
  venue_id?: string;
}

interface VenueMapViewProps {
  currentVenue?: Venue | null;
  onVenueSelect?: (venue: Venue) => void;
  onMarkerPress?: (venue: Venue) => void;
  showAllVenues?: boolean;
  selectedVenue?: Venue | null;
  /** Filter to show only user's saved venues */
  showOnlySavedVenues?: boolean;
  /** Set of saved venue IDs for filtering */
  savedVenueIds?: Set<string>;
  /** Enable 3D mode (currently not implemented for react-native-maps) */
  is3DEnabled?: boolean;
  /** Map layer configuration */
  mapLayers?: {
    yachtClubs?: boolean;
    sailmakers?: boolean;
    riggers?: boolean;
    coaches?: boolean;
    chandlery?: boolean;
    clothing?: boolean;
    marinas?: boolean;
    repair?: boolean;
    engines?: boolean;
  };
}

export function VenueMapView({
  currentVenue,
  onVenueSelect,
  onMarkerPress,
  showAllVenues = false,
  selectedVenue,
  showOnlySavedVenues = false,
  savedVenueIds = new Set(),
  mapLayers = {},
}: VenueMapViewProps) {
  const mapRef = useRef<ClusteredMapView>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [yachtClubs, setYachtClubs] = useState<YachtClub[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch venues from database
  useEffect(() => {
    fetchVenues();
  }, []);

  // Fetch yacht clubs when layer is enabled
  useEffect(() => {
    if (mapLayers.yachtClubs) {
      fetchYachtClubs();
    }
  }, [mapLayers.yachtClubs]);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .select('id, name, country, region, venue_type, coordinates_lat, coordinates_lng')
        .order('name', { ascending: true });

      if (error) throw error;

      setVenues(data || []);
    } catch (error) {
      // Silent error - venues will be empty
    } finally {
      setLoading(false);
    }
  };

  const fetchYachtClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('yacht_clubs')
        .select('id, name, short_name, coordinates_lat, coordinates_lng, prestige_level, venue_id')
        .not('coordinates_lat', 'is', null)
        .not('coordinates_lng', 'is', null)
        .order('name', { ascending: true });

      if (error) throw error;

      setYachtClubs(data || []);
    } catch (error) {
      // Silent error - yacht clubs will be empty
    }
  };

  // Center map on current venue or all venues
  useEffect(() => {
    if (!mapRef.current) return;

    if (currentVenue) {
      // Center on current venue
      mapRef.current.animateToRegion({
        latitude: currentVenue.coordinates_lat,
        longitude: currentVenue.coordinates_lng,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }, 500);
    } else if (showAllVenues && venues.length > 0) {
      // Fit all venues in view
      const coordinates = venues.map(v => ({
        latitude: v.coordinates_lat,
        longitude: v.coordinates_lng,
      }));

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [currentVenue, venues, showAllVenues]);

  // Center map when a venue is selected (via marker press or sidebar click)
  useEffect(() => {
    if (!mapRef.current || !selectedVenue) return;

    // Center on selected venue
    mapRef.current.animateToRegion({
      latitude: selectedVenue.coordinates_lat,
      longitude: selectedVenue.coordinates_lng,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    }, 500);
  }, [selectedVenue]);

  const getMarkerColor = (venueType: string) => {
    switch (venueType) {
      case 'championship': return '#ffc107'; // Gold
      case 'premier': return '#007AFF'; // Blue
      case 'regional': return '#666'; // Gray
      default: return '#007AFF';
    }
  };

  const getMarkerIcon = (venueType: string) => {
    switch (venueType) {
      case 'championship': return 'trophy';
      case 'premier': return 'star';
      case 'regional': return 'location';
      default: return 'boat';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Loading venues...</ThemedText>
      </View>
    );
  }

  // Default region (centered on Hong Kong if no venue selected)
  const defaultRegion = {
    latitude: currentVenue?.coordinates_lat || 22.2793,
    longitude: currentVenue?.coordinates_lng || 114.1628,
    latitudeDelta: currentVenue ? 0.5 : 60,
    longitudeDelta: currentVenue ? 0.5 : 60,
  };

  // Venues to display - filter by saved venues if enabled
  let displayVenues: Venue[];

  if (showOnlySavedVenues && savedVenueIds.size > 0) {
    // Show only saved venues
    displayVenues = venues.filter(v => savedVenueIds.has(v.id));
  } else if (showAllVenues) {
    // Show all venues
    displayVenues = venues;
  } else if (currentVenue) {
    // Show only current venue
    displayVenues = [currentVenue];
  } else {
    // Show nothing
    displayVenues = [];
  }

  // Prepare clustered marker data
  const clusterData = useMemo(() => {
    const data: any[] = [];

    // Add venues
    displayVenues.forEach(venue => {
      data.push({
        id: `venue-${venue.id}`,
        location: {
          latitude: venue.coordinates_lat,
          longitude: venue.coordinates_lng,
        },
        type: 'venue',
        data: venue,
      });
    });

    // Add yacht clubs if enabled
    if (mapLayers.yachtClubs) {
      yachtClubs.forEach(club => {
        data.push({
          id: `club-${club.id}`,
          location: {
            latitude: club.coordinates_lat,
            longitude: club.coordinates_lng,
          },
          type: 'yachtClub',
          data: club,
        });
      });
    }

    return data;
  }, [displayVenues, yachtClubs, mapLayers.yachtClubs]);

  // Custom cluster marker renderer
  const renderCluster = (cluster: any, onPress: any) => {
    const pointCount = cluster.pointCount;
    const coordinate = cluster.coordinate;

    return (
      <Marker key={`cluster-${cluster.id}`} coordinate={coordinate} onPress={onPress}>
        <View style={styles.clusterMarker}>
          <ThemedText style={styles.clusterText}>{pointCount}</ThemedText>
        </View>
      </Marker>
    );
  };

  // Custom individual marker renderer
  const renderMarker = (data: any) => {
    const { type, data: markerData, location } = data;

    if (type === 'venue') {
      const venue: Venue = markerData;
      const isSelected = selectedVenue?.id === venue.id || currentVenue?.id === venue.id;
      const markerScale = isSelected ? 1.3 : 1;

      return (
        <Marker
          key={`venue-${venue.id}`}
          coordinate={location}
          title={venue.name}
          description={`${venue.country} - ${venue.venue_type}`}
          onPress={() => onMarkerPress?.(venue)}
        >
          <View
            style={[
              styles.customMarker,
              {
                backgroundColor: getMarkerColor(venue.venue_type),
                transform: [{ scale: markerScale }],
                borderWidth: isSelected ? 3 : 2,
                borderColor: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.8)',
              },
            ]}
          >
            <Ionicons
              name={getMarkerIcon(venue.venue_type) as any}
              size={isSelected ? 22 : 18}
              color="#fff"
            />
          </View>
        </Marker>
      );
    }

    if (type === 'yachtClub') {
      const club: YachtClub = markerData;

      return (
        <Marker
          key={`club-${club.id}`}
          coordinate={location}
          title={club.short_name || club.name}
          description={club.prestige_level ? `${club.prestige_level} yacht club` : 'Yacht Club'}
        >
          <View
            style={[
              styles.customMarker,
              {
                backgroundColor: '#34c759',
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.9)',
              },
            ]}
          >
            <Ionicons name="business" size={18} color="#fff" />
          </View>
        </Marker>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={defaultRegion}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        toolbarEnabled={false}
        data={clusterData}
        renderMarker={renderMarker}
        renderCluster={renderCluster}
        radius={100}
        maxZoom={15}
        minZoom={1}
        extent={512}
        nodeSize={64}
        preserveClusterPressBehavior={false}
        clusteringEnabled={clusterData.length > 50}
        animationEnabled={true}
      />

      {/* Venue counter overlay */}
      {showAllVenues && (
        <View style={styles.counterOverlay}>
          <ThemedText style={styles.counterText}>
            {showOnlySavedVenues
              ? `${displayVenues.length} saved venue${displayVenues.length !== 1 ? 's' : ''}`
              : `${venues.length} venues worldwide`}
          </ThemedText>
        </View>
      )}
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  customMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }
      : { elevation: 6 }),
  },
  clusterMarker: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0, 122, 255, 0.4)' }
      : { elevation: 8 }),
  },
  clusterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  counterOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    boxShadow: '0px 2px',
    elevation: 3,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
});
