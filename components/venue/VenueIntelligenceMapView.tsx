/**
 * Venue Intelligence Map View
 * Combines professional mapping with comprehensive venue intelligence
 * Map-first interface for "OnX Maps for Sailing" experience
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ProfessionalMap3DView } from '@/components/map/ProfessionalMap3DView';
import { useVenueIntelligence } from '@/hooks/useVenueIntelligence';
import { GlobalVenuesMapLayer, useVenueMarkers } from '@/components/venue/GlobalVenuesMapLayer';
import { YachtClubService } from '@/services/venues/YachtClubService';
import { RaceCourseService } from '@/services/venues/RaceCourseService';
import yachtClubsData from '@/data/yacht-clubs.json';
import raceCoursesData from '@/data/race-courses.json';
import sailingLocations from '@/data/sailing-locations.json';
import type { GeoLocation, RaceMark } from '@/lib/types/advanced-map';
import type { YachtClubData, RaceCourseLibrary } from '@/lib/types/venues';
import { createLogger } from '@/lib/utils/logger';

interface VenueIntelligenceMapViewProps {
  style?: any;
}

interface YachtClubMarker {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat] for MapLibre
  type: 'headquarters' | 'racing-station' | 'marina-facility';
  clubId: string;
  venueData?: any;
}

interface RaceCourseOverlay {
  id: string;
  name: string;
  type: string;
  marks: RaceMark[];
  active: boolean;
  clubId?: string;
}

const logger = createLogger('VenueIntelligenceMapView');
export function VenueIntelligenceMapView({ style }: VenueIntelligenceMapViewProps) {

  // Venue intelligence hook
  const hookResult = useVenueIntelligence();
  const {
    currentVenue,
    isDetecting,
    intelligence,
    isLoadingIntelligence,
  } = hookResult;

  // Debug logging for hook state
  useEffect(() => {

    logger.debug('  currentVenue:', currentVenue?.name || 'null');
    logger.debug('  isDetecting:', isDetecting);
    logger.debug('  intelligence:', intelligence ? 'loaded' : 'null');
    logger.debug('  isLoadingIntelligence:', isLoadingIntelligence);
    logger.debug('  Timestamp:', new Date().toISOString());
  }, [currentVenue, isDetecting, intelligence, isLoadingIntelligence]);

  // Map and venue state
  const [selectedClub, setSelectedClub] = useState<YachtClubData | null>(null);
  const [visibleCourses, setVisibleCourses] = useState<RaceCourseOverlay[]>([]);
  const [showLogistics, setShowLogistics] = useState(false);
  const [mapMarks, setMapMarks] = useState<RaceMark[]>([]);
  const [clubMarkers, setClubMarkers] = useState<YachtClubMarker[]>([]);
  const [layerPanelVisible, setLayerPanelVisible] = useState(true);
  const [showGlobalVenues, setShowGlobalVenues] = useState(true);

  // Get global venue markers
  const { markers: globalVenueMarkers, isLoading: loadingVenues } = useVenueMarkers();

  // Services
  const [yachtClubService] = useState(() => new YachtClubService());
  const [raceCourseService] = useState(() => new RaceCourseService());

  // Note: Venue initialization is now handled by the parent venue screen
  // This component just receives currentVenue as a prop via the hook

  // Screen dimensions for responsive layout
  const { width, height } = Dimensions.get('window');
  const isTablet = width > 768;

  // Load yacht club markers for current venue
  useEffect(() => {
    if (!currentVenue) return;

    const loadClubMarkers = async () => {
      try {
        // Get venue-specific yacht clubs
        const venueData = (sailingLocations.venues as any)[currentVenue.id];
        if (!venueData?.yachtClubs) return;

        const markers: YachtClubMarker[] = [];

        // Process each club
        for (const club of venueData.yachtClubs) {
          if (club.multipleVenues && club.venues) {
            // Multi-venue club (like RHKYC)
            Object.entries(club.venues).forEach(([venueId, venueInfo]: [string, any]) => {
              markers.push({
                id: `${club.id}-${venueId}`,
                name: venueInfo.name,
                coordinates: [venueInfo.coordinates.longitude, venueInfo.coordinates.latitude],
                lat: venueInfo.coordinates.latitude,
                lng: venueInfo.coordinates.longitude,
                type: venueInfo.type,
                clubId: club.id,
                venueData: venueInfo
              });
            });
          } else {
            // Single venue club
            markers.push({
              id: club.id,
              name: club.name,
              coordinates: [club.coordinates.longitude, club.coordinates.latitude],
              lat: club.coordinates.latitude,
              lng: club.coordinates.longitude,
              type: 'headquarters',
              clubId: club.id
            });
          }
        }

        setClubMarkers(markers);
      } catch (error) {

      }
    };

    loadClubMarkers();
  }, [currentVenue]);

  // Load race courses for current venue
  useEffect(() => {
    if (!currentVenue) return;

    const loadRaceCourses = async () => {
      try {
        const courses = raceCourseService.getCoursesForVenue(currentVenue.id);
        const courseOverlays: RaceCourseOverlay[] = [];

        courses.forEach((course, index) => {
          const marks: RaceMark[] = [];

          // Convert course coordinates to map marks
          if (course.coordinates?.marks) {
            Object.entries(course.coordinates.marks).forEach(([markName, coords]: [string, any]) => {
              marks.push({
                id: `${course.id}-${markName}`,
                name: markName,
                location: {
                  latitude: coords[1],
                  longitude: coords[0]
                },
                type: markName.includes('start') ? 'start' :
                      markName.includes('finish') ? 'finish' : 'turning',
                color: markName.includes('start') ? '#00FF00' :
                       markName.includes('finish') ? '#FF0000' : '#FFA500',
                size: 'medium'
              });
            });
          }

          courseOverlays.push({
            id: course.id,
            name: course.name,
            type: course.type,
            marks,
            active: index === 0, // First course active by default
            clubId: course.clubs?.[0]
          });
        });

        setVisibleCourses(courseOverlays);

        // Set marks for the first active course
        const activeCourse = courseOverlays.find(c => c.active);
        if (activeCourse) {
          setMapMarks(activeCourse.marks);

        }

      } catch (error) {

      }
    };

    loadRaceCourses();
  }, [currentVenue, raceCourseService]);

  // Handle map interactions
  const handleMapPress = (coordinates: GeoLocation) => {

    // Could show contextual information about the location
  };

  const handleMarkPress = (mark: RaceMark) => {

    // Could show mark details or course information
  };

  // Toggle race course visibility
  const toggleCourseVisibility = (courseId: string) => {
    const updatedCourses = visibleCourses.map(course =>
      course.id === courseId ? { ...course, active: !course.active } : course
    );
    setVisibleCourses(updatedCourses);

    // Update map marks with all active courses
    const allActiveMarks: RaceMark[] = [];
    updatedCourses.forEach(course => {
      if (course.active) {
        allActiveMarks.push(...course.marks);
      }
    });
    setMapMarks(allActiveMarks);

  };

  // Handle yacht club marker selection
  const handleClubMarkerPress = (marker: YachtClubMarker) => {
    const clubData = yachtClubsData.clubs[marker.clubId as keyof typeof yachtClubsData.clubs];
    setSelectedClub(clubData as YachtClubData);
  };

  // Render venue selector
  const renderVenueSelector = () => (
    <View style={[styles.venueSelector, isTablet && styles.venueSelectorTablet]}>
      <ThemedText style={styles.venueSelectorTitle}>🌍 Venue</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['hong-kong-victoria-harbor', 'san-francisco-bay', 'newport-rhode-island'].map((venueId) => (
          <TouchableOpacity
            key={venueId}
            style={[
              styles.venueButton,
              currentVenue?.id === venueId && styles.activeVenueButton
            ]}
            onPress={() => setVenueManually(venueId)}
          >
            <ThemedText style={[
              styles.venueButtonText,
              currentVenue?.id === venueId && styles.activeVenueButtonText
            ]}>
              {venueId === 'hong-kong-victoria-harbor' && '🇭🇰 Hong Kong'}
              {venueId === 'san-francisco-bay' && '🇺🇸 SF Bay'}
              {venueId === 'newport-rhode-island' && '🇺🇸 Newport'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render layer control panel
  const renderLayerPanel = () => (
    <View style={[styles.layerPanel, isTablet && styles.layerPanelTablet]}>
      <View style={styles.layerHeader}>
        <ThemedText style={styles.layerTitle}>🗺️ Map Layers</ThemedText>
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={() => setLayerPanelVisible(!layerPanelVisible)}
        >
          <ThemedText style={styles.collapseText}>
            {layerPanelVisible ? '→' : '←'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {layerPanelVisible && (
        <>
          {/* Yacht Clubs Section */}
          <View style={styles.layerSection}>
            <ThemedText style={styles.layerSectionTitle}>🏆 Yacht Clubs ({clubMarkers.length})</ThemedText>
            {clubMarkers.slice(0, 3).map((marker) => (
              <TouchableOpacity
                key={marker.id}
                style={styles.layerItem}
                onPress={() => handleClubMarkerPress(marker)}
              >
                <View style={[styles.markerIcon, { backgroundColor: getClubMarkerColor(marker.type) }]} />
                <ThemedText style={styles.layerItemText}>{marker.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Race Courses Section */}
          <View style={styles.layerSection}>
            <ThemedText style={styles.layerSectionTitle}>⛵ Race Courses</ThemedText>
            {visibleCourses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.layerItem}
                onPress={() => toggleCourseVisibility(course.id)}
              >
                <View style={[
                  styles.courseToggle,
                  { backgroundColor: course.active ? '#00CC44' : '#666' }
                ]} />
                <ThemedText style={[
                  styles.layerItemText,
                  { opacity: course.active ? 1.0 : 0.6 }
                ]}>
                  {course.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logistics Toggle */}
          <View style={styles.layerSection}>
            <TouchableOpacity
              style={styles.layerItem}
              onPress={() => setShowLogistics(!showLogistics)}
            >
              <View style={[
                styles.courseToggle,
                { backgroundColor: showLogistics ? '#FF8800' : '#666' }
              ]} />
              <ThemedText style={styles.layerItemText}>📋 Logistics & Services</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Global Venues Toggle */}
          <View style={styles.layerSection}>
            <TouchableOpacity
              style={styles.layerItem}
              onPress={() => setShowGlobalVenues(!showGlobalVenues)}
            >
              <View style={[
                styles.courseToggle,
                { backgroundColor: showGlobalVenues ? '#00CC88' : '#666' }
              ]} />
              <ThemedText style={styles.layerItemText}>
                🌍 Global Venues ({globalVenueMarkers.length})
              </ThemedText>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  // Render selected club info panel
  const renderClubInfoPanel = () => {
    if (!selectedClub) return null;

    return (
      <View style={[styles.clubInfoPanel, isTablet && styles.clubInfoPanelTablet]}>
        <View style={styles.clubInfoHeader}>
          <ThemedText style={styles.clubInfoTitle}>{selectedClub.name}</ThemedText>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedClub(null)}
          >
            <ThemedText style={styles.closeButtonText}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.clubInfoSubtitle}>
          Founded {selectedClub.founded} • {selectedClub.country}
        </ThemedText>

        {selectedClub.multipleVenues && (
          <View style={styles.venuesSection}>
            <ThemedText style={styles.clubSectionTitle}>📍 Venues</ThemedText>
            {Object.entries(selectedClub.venues || {}).slice(0, 3).map(([venueId, venue]: [string, any]) => (
              <View key={venueId} style={styles.venueItem}>
                <ThemedText style={styles.venueName}>{venue.name}</ThemedText>
                <ThemedText style={styles.venueLocation}>{venue.location}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {selectedClub.racingProgram && (
          <View style={styles.racingSection}>
            <ThemedText style={styles.clubSectionTitle}>⛵ Racing</ThemedText>
            <ThemedText style={styles.racingText}>
              {selectedClub.classes?.slice(0, 4).join(', ')}
            </ThemedText>
          </View>
        )}

        <TouchableOpacity
          style={styles.visitWebsiteButton}
          onPress={() => logger.debug('Visit website:', selectedClub.website)}
        >
          <ThemedText style={styles.visitWebsiteText}>🌐 Visit Website</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  // DEBUG: Log the actual values causing the loading state

  if (isDetecting || !currentVenue) {

    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>
            {isDetecting ? '🌍 Detecting sailing venue...' : '🗺️ Select a venue to explore'}
          </ThemedText>
        </View>
      </View>
    );
  }

  // Debug logging before render

  return (
    <View style={[styles.container, style]}>
      {/* Primary Map Interface */}
      <ProfessionalMap3DView
        venue={currentVenue.id}
        marks={mapMarks}
        clubMarkers={clubMarkers}
        venueMarkers={showGlobalVenues ? globalVenueMarkers : []}
        onMarkPress={handleMarkPress}
        onMapPress={handleMapPress}
        apiKeys={{
          'stormglass': process.env.EXPO_PUBLIC_STORMGLASS_API_KEY || 'demo',
          'openweathermap': process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY || '',
          'aisstream-api': process.env.EXPO_PUBLIC_AIS_API_KEY || 'demo'
        }}
        professionalMode={true}
        config={{
          layers: {
            nauticalChart: true,
            bathymetry: true,
            windField: true,
            currentFlow: true,
            hazards: true
          },
          camera: {
            pitch: isTablet ? 45 : 30,
            zoom: 13
          }
        }}
      />

      {/* Global Venues Layer Overlay */}
      {showGlobalVenues && <GlobalVenuesMapLayer />}

      {/* Venue Selector Overlay - No other panels */}
    </View>
  );
}

// Helper function to get club marker colors
function getClubMarkerColor(type: string): string {
  switch (type) {
    case 'headquarters': return '#FF4444';
    case 'racing-station': return '#4444FF';
    case 'marina-facility': return '#44FF44';
    default: return '#666666';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },

  // Venue Selector
  venueSelector: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
    zIndex: 200,
    boxShadow: '0px 2px',
    elevation: 5,
    maxWidth: 300,
  },
  venueSelectorTablet: {
    maxWidth: 350,
  },
  venueSelectorTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    color: '#666',
  },
  venueButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  activeVenueButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  venueButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  activeVenueButtonText: {
    color: '#fff',
  },

  // Layer Panel
  layerPanel: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 260,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
    zIndex: 150,
    maxHeight: '60%',
  },
  layerPanelTablet: {
    width: 280,
  },
  layerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  layerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  collapseButton: {
    padding: 4,
  },
  collapseText: {
    fontSize: 18,
    color: '#fff',
  },
  layerSection: {
    marginBottom: 16,
  },
  layerSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 8,
  },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  layerItemText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 8,
  },
  markerIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  courseToggle: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },

  // Club Info Panel
  clubInfoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    zIndex: 200,
    maxHeight: '40%',
  },
  clubInfoPanelTablet: {
    right: 300,
    maxHeight: '50%',
  },
  clubInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clubInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  clubInfoSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  clubSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  venuesSection: {
    marginBottom: 16,
  },
  venueItem: {
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#007AFF',
  },
  venueName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  venueLocation: {
    fontSize: 12,
    color: '#666',
  },
  racingSection: {
    marginBottom: 16,
  },
  racingText: {
    fontSize: 12,
    color: '#666',
  },
  visitWebsiteButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  visitWebsiteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Intelligence Summary
  intelligenceSummary: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    padding: 12,
    zIndex: 180,
    minWidth: 200,
  },
  intelligenceSummaryTablet: {
    right: 300,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00CC44',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 11,
    color: '#fff',
    marginBottom: 2,
  },

  // Map Legend
  mapLegend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    zIndex: 180,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
});
