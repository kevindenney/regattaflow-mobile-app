/**
 * Venue Intelligence - Apple Maps-Style Interface
 * Full-screen map with collapsible sidebar and floating controls
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import { useVenueIntelligence } from '@/src/hooks/useVenueIntelligence';
import { useSavedVenues } from '@/src/hooks/useSavedVenues';
import { venueDetectionService } from '@/src/services/location/VenueDetectionService';
import { VenueMapView } from '@/src/components/venue/VenueMapView';
import { VenueSidebar } from '@/src/components/venue/VenueSidebar';
import { MapControls, MapLayers } from '@/src/components/venue/MapControls';
import { VenueDetailsSheet } from '@/src/components/venue/VenueDetailsSheet';

interface Venue {
  id: string;
  name: string;
  country: string;
  region: string;
  venue_type: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

export default function VenueIntelligenceScreen() {
  const { currentVenue, isDetecting, initializeDetection, setVenueManually } = useVenueIntelligence();
  const { savedVenueIds, isLoading: savedVenuesLoading } = useSavedVenues();


  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedVenueForSheet, setSelectedVenueForSheet] = useState<Venue | null>(null);
  const [is3DEnabled, setIs3DEnabled] = useState(false);
  const [areLayersVisible, setAreLayersVisible] = useState(true);
  const [showOnlySavedVenues, setShowOnlySavedVenues] = useState(false);
  const [mapLayers, setMapLayers] = useState<MapLayers>({
    yachtClubs: true,
    sailmakers: false,
    riggers: false,
    coaches: false,
    chandlery: false,
    clothing: false,
    marinas: false,
    repair: false,
    engines: false,
  });

  // Initialize venue detection
  useEffect(() => {
    const initVenue = async () => {
      try {
        await initializeDetection();
      } catch (error) {
        // Silent fail, user can select venue manually
      }

      // Auto-select default venue if no venue was detected
      setTimeout(async () => {
        const currentVenueCheck = venueDetectionService.getCurrentVenue();

        if (!currentVenueCheck) {
          try {
            const success = await setVenueManually('hong-kong-victoria-harbor');
            if (!success) {
              await setVenueManually('newport-rhode-island');
            }
          } catch (error) {
            // Silent fail, user can select venue manually
          }
        }
      }, 500);
    };

    initVenue();
  }, [initializeDetection, setVenueManually]);

  // Handle venue selection from sidebar
  const handleVenueSelect = async (venue: Venue) => {
    await setVenueManually(venue.id);
    setSelectedVenueForSheet(venue); // Show details sheet for selected venue
  };

  // Handle marker press on map
  const handleMarkerPress = (venue: Venue) => {
    setSelectedVenueForSheet(venue);
  };

  // Handle closing details sheet
  const handleCloseSheet = () => {
    setSelectedVenueForSheet(null);
  };

  if (isDetecting) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>🌍 Detecting your sailing venue...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Full-Screen Map Background */}
      <View style={styles.mapContainer}>
        <VenueMapView
          currentVenue={currentVenue}
          onVenueSelect={handleVenueSelect}
          onMarkerPress={handleMarkerPress}
          showAllVenues={true}
          selectedVenue={selectedVenueForSheet}
          showOnlySavedVenues={showOnlySavedVenues}
          savedVenueIds={savedVenueIds}
          is3DEnabled={is3DEnabled}
          mapLayers={mapLayers}
        />
      </View>

      {/* Left Sidebar - Collapsible Venue List */}
      <VenueSidebar
        currentVenue={currentVenue}
        onSelectVenue={handleVenueSelect}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        showOnlySavedVenues={showOnlySavedVenues}
        savedVenueIds={savedVenueIds}
      />

      {/* Upper Right Map Controls */}
      <MapControls
        onToggle3D={() => setIs3DEnabled(!is3DEnabled)}
        onToggleLayers={() => setAreLayersVisible(!areLayersVisible)}
        onToggleSavedVenues={() => setShowOnlySavedVenues(!showOnlySavedVenues)}
        onSearchNearby={initializeDetection}
        is3DEnabled={is3DEnabled}
        areLayersVisible={areLayersVisible}
        showOnlySavedVenues={showOnlySavedVenues}
        savedVenuesCount={savedVenueIds.size}
        layers={mapLayers}
        onLayersChange={setMapLayers}
      />

      {/* Bottom Sheet - Venue Details */}
      <VenueDetailsSheet
        venue={selectedVenueForSheet}
        onClose={handleCloseSheet}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
