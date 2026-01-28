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
import { View, StyleSheet, Alert } from 'react-native';
import { VenueMapView } from '../VenueMapView';
import { MapControlsFAB } from '../map/MapControlsFAB';
import { VenueBottomSheet } from '../map/VenueBottomSheet';
import type { MapLayers } from '../IOSMapControls';
import { useVenueLiveWeather } from '@/hooks/useVenueLiveWeather';

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
  savedVenueIds: Set<string>;
  onSaveVenue: () => void;
  onAskAI: () => void;
  loadingAI: boolean;
  onCompare: () => void;
  /** Commit a venue switch (Supabase lookup + intelligence reload) */
  onSwitchVenue?: (venueId: string) => Promise<boolean>;
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
  savedVenueIds,
  onSaveVenue,
  onAskAI,
  loadingAI,
  onCompare,
  onSwitchVenue,
}: VenueMapSegmentProps) {
  const [mapLayers, setMapLayers] = useState<MapLayers>(DEFAULT_LAYERS);
  const [previewedVenue, setPreviewedVenue] = useState<Venue | null>(null);

  // Fetch live weather for the current venue
  const { weather: currentWeather } = useVenueLiveWeather(
    currentVenue?.coordinates_lat,
    currentVenue?.coordinates_lng,
    currentVenue?.id,
    currentVenue?.name,
  );

  // Fetch live weather for the previewed venue (hook is a no-op when coords are undefined)
  const { weather: previewWeather } = useVenueLiveWeather(
    previewedVenue?.coordinates_lat,
    previewedVenue?.coordinates_lng,
    previewedVenue?.id,
    previewedVenue?.name,
  );

  // Display the previewed venue when active, otherwise the current venue
  const displayVenue = previewedVenue ?? currentVenue;
  const displayWeather = previewedVenue ? previewWeather : currentWeather;
  const isPreviewMode = previewedVenue !== null;

  const handleMarkerPress = useCallback(
    (venue: Venue) => {
      // Tapping the current venue while not previewing → no-op
      if (!previewedVenue && venue.id === currentVenue?.id) return;
      // Tapping the same preview venue → no-op
      if (previewedVenue && venue.id === previewedVenue.id) return;
      // Tapping the current venue while previewing → clear preview
      if (previewedVenue && venue.id === currentVenue?.id) {
        setPreviewedVenue(null);
        return;
      }
      // Otherwise → preview the tapped venue
      setPreviewedVenue(venue);
    },
    [currentVenue?.id, previewedVenue],
  );

  const handleSwitchVenue = useCallback(async () => {
    if (!previewedVenue || !onSwitchVenue) return;
    const venueId = previewedVenue.id;
    setPreviewedVenue(null);
    const success = await onSwitchVenue(venueId);
    if (!success) {
      Alert.alert('Switch Failed', 'Could not switch to the selected venue.');
    }
  }, [previewedVenue, onSwitchVenue]);

  const handleDismissPreview = useCallback(() => {
    setPreviewedVenue(null);
  }, []);

  const handleCenterOnUser = useCallback(() => {
    // Location centering is handled natively by the map view
    // This triggers a re-center if the map supports it
  }, []);

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <VenueMapView
        currentVenue={currentVenue}
        showAllVenues={false}
        savedVenueIds={savedVenueIds}
        mapLayers={mapLayers}
        onMarkerPress={handleMarkerPress}
      />

      {/* Floating map controls (top-right) */}
      <MapControlsFAB
        layers={mapLayers}
        onLayersChange={setMapLayers}
        onLocationPress={handleCenterOnUser}
      />

      {/* Bottom sheet (always visible, gesture-driven) */}
      <VenueBottomSheet
        venue={displayVenue}
        liveWeather={displayWeather}
        savedVenueIds={savedVenueIds}
        onSaveVenue={onSaveVenue}
        onAskAI={onAskAI}
        loadingAI={loadingAI}
        onCompare={onCompare}
        isPreviewMode={isPreviewMode}
        onSwitchVenue={handleSwitchVenue}
        onDismissPreview={handleDismissPreview}
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
