/**
 * Venue Intelligence Map View
 * Combines professional mapping with comprehensive venue intelligence
 * Map-first interface for "OnX Maps for Sailing" experience
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ProfessionalMap3DView } from '@/src/components/map/ProfessionalMap3DView';
import { useVenueIntelligence } from '@/src/hooks/useVenueIntelligence';
import { YachtClubService } from '@/src/services/venues/YachtClubService';
import { RaceCourseService } from '@/src/services/venues/RaceCourseService';
import yachtClubsData from '@/src/data/yacht-clubs.json';
import raceCoursesData from '@/src/data/race-courses.json';
import sailingLocations from '@/src/data/sailing-locations.json';
import type { GeoLocation, RaceMark } from '@/src/lib/types/advanced-map';
import type { YachtClubData, RaceCourseLibrary } from '@/src/lib/types/venues';

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

export function VenueIntelligenceMapView({ style }: VenueIntelligenceMapViewProps) {
  // Venue intelligence hook
  const {
    currentVenue,
    isDetecting,
    intelligence,
    isLoadingIntelligence,
    setVenueManually,
    initializeDetection,
  } = useVenueIntelligence();

  // Debug logging for hook state
  useEffect(() => {
    console.log('🌍 HOOK STATE DEBUG:');
    console.log('  currentVenue:', currentVenue);
    console.log('  isDetecting:', isDetecting);
    console.log('  intelligence:', intelligence);
    console.log('  isLoadingIntelligence:', isLoadingIntelligence);
  }, [currentVenue, isDetecting, intelligence, isLoadingIntelligence]);

  // Map and venue state
  const [selectedClub, setSelectedClub] = useState<YachtClubData | null>(null);
  const [visibleCourses, setVisibleCourses] = useState<RaceCourseOverlay[]>([]);
  const [showLogistics, setShowLogistics] = useState(false);
  const [mapMarks, setMapMarks] = useState<RaceMark[]>([]);
  const [clubMarkers, setClubMarkers] = useState<YachtClubMarker[]>([]);
  const [layerPanelVisible, setLayerPanelVisible] = useState(true);

  // Services
  const [yachtClubService] = useState(() => new YachtClubService());
  const [raceCourseService] = useState(() => new RaceCourseService());

  // Initialize detection system and auto-select Hong Kong as default venue
  useEffect(() => {
    console.log('🌍 DEBUG: Auto-selection effect triggered');
    console.log('🌍 DEBUG: currentVenue:', currentVenue);
    console.log('🌍 DEBUG: isDetecting:', isDetecting);

    const initializeAndSelectVenue = async () => {
      if (!currentVenue && !isDetecting) {
        console.log('🌍 DEBUG: Initializing detection system first...');

        try {
          // Initialize detection system (registers callbacks)
          const initialized = await initializeDetection();
          console.log('🌍 DEBUG: Detection system initialized:', initialized);

          if (initialized) {
            console.log('🌍 Auto-selecting Hong Kong as default venue');
            await setVenueManually('hong-kong');
            console.log('🌍 DEBUG: setVenueManually completed for hong-kong');
          }
        } catch (error) {
          console.error('🌍 DEBUG: Initialization/selection failed:', error);
        }
      } else {
        console.log('🌍 DEBUG: Auto-selection skipped - currentVenue exists or still detecting');
      }
    };

    initializeAndSelectVenue();
  }, []); // Empty dependency array - only run once on mount

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
        console.log(`🏆 Loaded ${markers.length} club markers for ${currentVenue.name}`);
        console.log('🏆 DEBUG: Club markers:', markers.slice(0, 3));
      } catch (error) {
        console.error('❌ Failed to load club markers:', error);
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
          console.log('🗺️ DEBUG: Initial race course marks set:', activeCourse.marks.length, 'marks');
          console.log('🗺️ DEBUG: First few marks:', activeCourse.marks.slice(0, 3));
        }

        console.log(`⛵ Loaded ${courseOverlays.length} race courses for ${currentVenue.name}`);
      } catch (error) {
        console.error('❌ Failed to load race courses:', error);
      }
    };

    loadRaceCourses();
  }, [currentVenue, raceCourseService]);

  // Handle map interactions
  const handleMapPress = (coordinates: GeoLocation) => {
    console.log('🗺️ Map pressed at:', coordinates);
    // Could show contextual information about the location
  };

  const handleMarkPress = (mark: RaceMark) => {
    console.log('🎯 Mark pressed:', mark.name);
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
    console.log('🗺️ DEBUG: Course toggle - Updated mapMarks with', allActiveMarks.length, 'marks');
  };

  // Handle yacht club marker selection
  const handleClubMarkerPress = (marker: YachtClubMarker) => {
    const clubData = yachtClubsData.clubs[marker.clubId as keyof typeof yachtClubsData.clubs];
    setSelectedClub(clubData as YachtClubData);
    console.log('🏆 Selected club:', marker.name);
  };

  // Render venue selector
  const renderVenueSelector = () => (
    <View style={[styles.venueSelector, isTablet && styles.venueSelectorTablet]}>
      <ThemedText style={styles.venueSelectorTitle}>🌍 Venue</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['hong-kong', 'san-francisco-bay', 'newport-rhode-island'].map((venueId) => (
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
              {venueId === 'hong-kong' && '🇭🇰 Hong Kong'}
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
          onPress={() => console.log('Visit website:', selectedClub.website)}
        >
          <ThemedText style={styles.visitWebsiteText}>🌐 Visit Website</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

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
  console.log('🗺️ DEBUG: Rendering map with:');
  console.log('  venue:', currentVenue.id);
  console.log('  mapMarks:', mapMarks.length, 'race course marks');
  console.log('  clubMarkers:', clubMarkers.length, 'club markers');

  return (
    <View style={[styles.container, style]}>
      {/* Primary Map Interface */}
      <ProfessionalMap3DView
        venue={currentVenue.id}
        marks={mapMarks}
        clubMarkers={clubMarkers}
        onMarkPress={handleMarkPress}
        onMapPress={handleMapPress}
        apiKeys={{
          'weatherapi': process.env.EXPO_PUBLIC_WEATHER_API_KEY || 'demo',
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

      {/* Venue Selector Overlay */}
      {renderVenueSelector()}

      {/* Layer Control Panel */}
      {renderLayerPanel()}

      {/* Selected Club Information */}
      {renderClubInfoPanel()}

      {/* Intelligence Summary Overlay */}
      {intelligence && (
        <View style={[styles.intelligenceSummary, isTablet && styles.intelligenceSummaryTablet]}>
          <ThemedText style={styles.summaryTitle}>📊 Current Conditions</ThemedText>
          <ThemedText style={styles.summaryText}>
            {intelligence.weatherIntelligence?.currentConditions?.windSpeed}kt @ {intelligence.weatherIntelligence?.currentConditions?.windDirection}°
          </ThemedText>
          <ThemedText style={styles.summaryText}>
            {intelligence.weatherIntelligence?.currentConditions?.temperature}°C •
            {intelligence.weatherIntelligence?.racingRecommendations?.[0]}
          </ThemedText>
        </View>
      )}

      {/* Map Legend */}
      <View style={styles.mapLegend}>
        <ThemedText style={styles.legendTitle}>Legend</ThemedText>
        <View style={styles.legendRow}>
          <View style={[styles.legendIcon, { backgroundColor: '#FF4444' }]} />
          <ThemedText style={styles.legendText}>Headquarters</ThemedText>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendIcon, { backgroundColor: '#4444FF' }]} />
          <ThemedText style={styles.legendText}>Racing Station</ThemedText>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendIcon, { backgroundColor: '#44FF44' }]} />
          <ThemedText style={styles.legendText}>Marina</ThemedText>
        </View>
      </View>
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
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  venueSelectorTablet: {
    right: 300, // Leave space for layer panel on tablets
  },
  venueSelectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  venueButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  activeVenueButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  venueButtonText: {
    fontSize: 12,
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