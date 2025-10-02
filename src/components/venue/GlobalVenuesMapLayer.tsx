/**
 * Global Venues Map Layer
 * Displays all 126+ sailing venues as markers on the map
 * Color-coded by venue type (championship, premier, regional)
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/src/components/themed-text';
import { useGlobalVenues, type GlobalVenue } from '@/src/hooks/useGlobalVenues';

export interface VenueMarker {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  type: 'championship' | 'premier' | 'regional' | 'local' | 'club';
  color: string;
  size: number;
  country: string;
  region: string;
}

interface GlobalVenuesMapLayerProps {
  onVenueSelect?: (venue: GlobalVenue) => void;
  filterRegion?: string;
  filterType?: 'championship' | 'premier' | 'regional' | 'all';
  showLabels?: boolean;
}

/**
 * Map marker colors by venue type
 */
const VENUE_COLORS = {
  championship: '#FF0000',  // Red - World Championship venues
  premier: '#FF6B00',       // Orange - Premier racing centers
  regional: '#FFD700',      // Gold - Regional hubs
  local: '#90EE90',         // Light green - Local venues
  club: '#87CEEB',          // Sky blue - Club venues
};

/**
 * Map marker sizes by venue type
 */
const VENUE_SIZES = {
  championship: 12,
  premier: 10,
  regional: 8,
  local: 6,
  club: 5,
};

export function GlobalVenuesMapLayer({
  onVenueSelect,
  filterRegion,
  filterType = 'all',
  showLabels = false,
}: GlobalVenuesMapLayerProps) {
  const {
    venues,
    isLoading,
    error,
    championshipVenues,
    premierVenues,
  } = useGlobalVenues();

  /**
   * Filter and transform venues into map markers
   */
  const venueMarkers: VenueMarker[] = useMemo(() => {
    let filteredVenues = venues;

    // Filter by region if specified
    if (filterRegion) {
      filteredVenues = filteredVenues.filter(v => v.region === filterRegion);
    }

    // Filter by type if specified
    if (filterType !== 'all') {
      filteredVenues = filteredVenues.filter(v => v.venueType === filterType);
    }

    // Transform to markers
    return filteredVenues.map(venue => ({
      id: venue.id,
      name: venue.name,
      coordinates: venue.coordinates,
      type: venue.venueType,
      color: VENUE_COLORS[venue.venueType],
      size: VENUE_SIZES[venue.venueType],
      country: venue.country,
      region: venue.region,
    }));
  }, [venues, filterRegion, filterType]);

  /**
   * Get venue statistics for display
   */
  const stats = useMemo(() => ({
    total: venues.length,
    championship: championshipVenues.length,
    premier: premierVenues.length,
    byRegion: venues.reduce((acc, v) => {
      acc[v.region] = (acc[v.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  }), [venues, championshipVenues, premierVenues]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Loading global venues...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>❌ {error}</ThemedText>
      </View>
    );
  }

  console.log(`🗺️ GlobalVenuesMapLayer: Rendering ${venueMarkers.length} venue markers`);

  // Return venue markers data that can be consumed by the map component
  // The actual rendering of markers on the map will be done by the parent map component
  return (
    <View style={styles.container}>
      <View style={styles.stats}>
        <ThemedText style={styles.statsText}>
          🌍 {stats.total} Global Venues
        </ThemedText>
        <ThemedText style={styles.statsDetail}>
          {stats.championship} Championship • {stats.premier} Premier
        </ThemedText>
      </View>
    </View>
  );
}

/**
 * Export venue markers for direct use by map components
 */
export function useVenueMarkers(
  filterRegion?: string,
  filterType?: 'championship' | 'premier' | 'regional' | 'all'
): {
  markers: VenueMarker[];
  isLoading: boolean;
  error: string | null;
} {
  const { venues, isLoading, error } = useGlobalVenues();

  const markers = useMemo(() => {
    let filteredVenues = venues;

    if (filterRegion) {
      filteredVenues = filteredVenues.filter(v => v.region === filterRegion);
    }

    if (filterType && filterType !== 'all') {
      filteredVenues = filteredVenues.filter(v => v.venueType === filterType);
    }

    return filteredVenues.map(venue => ({
      id: venue.id,
      name: venue.name,
      coordinates: venue.coordinates,
      type: venue.venueType,
      color: VENUE_COLORS[venue.venueType],
      size: VENUE_SIZES[venue.venueType],
      country: venue.country,
      region: venue.region,
    }));
  }, [venues, filterRegion, filterType]);

  return { markers, isLoading, error };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  stats: {
    gap: 4,
  },
  statsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsDetail: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  loadingContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  errorContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(139, 0, 0, 0.9)',
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
