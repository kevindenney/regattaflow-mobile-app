/**
 * AddVenueMapWeb - Web implementation
 *
 * Leaflet/OpenStreetMap-based venue picker for web platform.
 * Shows existing venues and allows clicking to place a new venue marker.
 * Uses free OpenStreetMap tiles - no API key required.
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/services/supabase';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

// Import Leaflet CSS and library
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';

// Fix Leaflet default marker icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore - Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Venue {
  id: string;
  name: string;
  coordinates_lat: number;
  coordinates_lng: number;
  venue_type: string;
}

interface AddVenueMapWebProps {
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  searchQuery?: string;
}

// Custom venue marker icons
function createVenueIcon(color: string): L.DivIcon {
  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2" opacity="0.8"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    `,
    className: 'venue-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const newVenueIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="16" fill="#007AFF" stroke="white" stroke-width="3"/>
      <path d="M20 10v20M10 20h20" stroke="white" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `,
  className: 'new-venue-marker-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to handle search/geocoding and pan map
function MapController({ searchQuery, selectedLocation }: { searchQuery?: string; selectedLocation: { lat: number; lng: number } | null }) {
  const map = useMap();
  const lastSearchRef = useRef<string>('');

  // Geocode search query
  useEffect(() => {
    if (!searchQuery) return;

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 3 || trimmedQuery === lastSearchRef.current) return;

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
            map.flyTo([parseFloat(lat), parseFloat(lon)], 10, { duration: 0.5 });
          }
        }
      } catch (error) {
        console.warn('Geocoding failed:', error);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, map]);

  // Pan to selected location
  useEffect(() => {
    if (selectedLocation) {
      const currentZoom = map.getZoom();
      if (currentZoom < 8) {
        map.flyTo([selectedLocation.lat, selectedLocation.lng], 10, { duration: 0.3 });
      } else {
        map.panTo([selectedLocation.lat, selectedLocation.lng]);
      }
    }
  }, [selectedLocation, map]);

  return null;
}

// Main map component
function LeafletMap({
  venues,
  selectedLocation,
  onLocationSelect,
  searchQuery,
}: {
  venues: Venue[];
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  searchQuery?: string;
}) {
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
    <MapContainer
      center={[40, -95]}
      zoom={3}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onLocationSelect={onLocationSelect} />
      <MapController searchQuery={searchQuery} selectedLocation={selectedLocation} />

      {/* Existing venue markers */}
      {venues.map((venue) => (
        venue.coordinates_lat && venue.coordinates_lng && (
          <Marker
            key={venue.id}
            position={[venue.coordinates_lat, venue.coordinates_lng]}
            icon={createVenueIcon(getMarkerColor(venue.venue_type))}
            title={venue.name}
          />
        )
      ))}

      {/* New venue location marker */}
      {selectedLocation && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={newVenueIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onLocationSelect(position.lat, position.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}

export function AddVenueMapWeb({
  selectedLocation,
  onLocationSelect,
  searchQuery,
}: AddVenueMapWebProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
      </View>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <style>{`
        .venue-marker-icon, .new-venue-marker-icon {
          background: transparent;
          border: none;
        }
      `}</style>
      <LeafletMap
        venues={venues}
        selectedLocation={selectedLocation}
        onLocationSelect={onLocationSelect}
        searchQuery={searchQuery}
      />
    </div>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});

export default AddVenueMapWeb;
