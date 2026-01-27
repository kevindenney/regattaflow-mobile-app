/**
 * VenueMapSegment
 *
 * Apple Maps pattern: full-screen map with MapControlsFAB (top-right)
 * and VenueBottomSheet (bottom, gesture-driven, 3 snap points).
 *
 * All overlay cards, floating buttons, and QuickAccessPanel removed.
 * Progressive disclosure via the bottom sheet.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { VenueMapView } from '../VenueMapView';
import { MapControlsFAB } from '../map/MapControlsFAB';
import { VenueBottomSheet } from '../map/VenueBottomSheet';
import type { MapLayers } from '../IOSMapControls';
import type { LiveWeatherData } from '@/hooks/useVenueLiveWeather';

interface Venue {
  id: string;
  name: string;
  country: string;
  region: string;
  venue_type: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

interface VenueMapSegmentProps {
  currentVenue: Venue | null;
  liveWeather: LiveWeatherData | null;
  savedVenueIds: Set<string>;
  onSaveVenue: () => void;
  onAskAI: () => void;
  loadingAI: boolean;
  onCompare: () => void;
}

const DEFAULT_LAYERS: MapLayers = {
  racingAreas: false,
  courseMarks: false,
  prohibitedZones: false,
  currentArrows: false,
  yachtClubs: true,
  sailmakers: false,
  marinas: false,
};

export function VenueMapSegment({
  currentVenue,
  liveWeather,
  savedVenueIds,
  onSaveVenue,
  onAskAI,
  loadingAI,
  onCompare,
}: VenueMapSegmentProps) {
  const [mapLayers, setMapLayers] = useState<MapLayers>(DEFAULT_LAYERS);

  const handleCenterOnUser = useCallback(() => {
    // Location centering is handled natively by the map view
    // This triggers a re-center if the map supports it
  }, []);

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <VenueMapView
        currentVenue={currentVenue}
        showAllVenues={true}
        savedVenueIds={savedVenueIds}
        mapLayers={mapLayers}
      />

      {/* Floating map controls (top-right) */}
      <MapControlsFAB
        layers={mapLayers}
        onLayersChange={setMapLayers}
        onLocationPress={handleCenterOnUser}
      />

      {/* Bottom sheet (always visible, gesture-driven) */}
      <VenueBottomSheet
        venue={currentVenue}
        liveWeather={liveWeather}
        savedVenueIds={savedVenueIds}
        onSaveVenue={onSaveVenue}
        onAskAI={onAskAI}
        loadingAI={loadingAI}
        onCompare={onCompare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default VenueMapSegment;
