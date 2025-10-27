/**
 * Race Detail Screen - Scrollable Apple Weather-Inspired Design
 * Map-first design with scrollable strategy cards
 * Phase 1: Core structure with map hero
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  RaceDetailMapHero,
  StrategyCard,
  StartStrategyCard,
  WindWeatherCard,
  CurrentTideCard,
  TacticalPlanCard,
  PostRaceAnalysisCard,
  CourseSelector
} from '@/components/race-detail';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useRaceWeather } from '@/hooks/useRaceWeather';
import type { Mark } from '@/types/courses';
import { autoCourseGenerator } from '@/services/AutoCourseGeneratorService';

interface RaceEvent {
  id: string;
  race_name: string;
  start_time?: string;
  venue?: {
    id?: string;
    name?: string;
    coordinates_lat?: number;
    coordinates_lng?: number;
  };
  racing_area_polygon?: any;
  boat_class?: {
    name?: string;
  };
}

interface CourseMark {
  id: string;
  mark_name: string;
  mark_type: string;
  latitude?: number;
  longitude?: number;
  sequence_order?: number;
}

export default function RaceDetailScrollable() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [race, setRace] = useState<RaceEvent | null>(null);
  const [marks, setMarks] = useState<CourseMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [drawingPolygon, setDrawingPolygon] = useState<Array<{lat: number, lng: number}>>([]);

  // Get real weather for course filtering
  const venueForWeather = race?.venue ? {
    id: `venue-${race.venue.coordinates_lat}-${race.venue.coordinates_lng}`,
    name: race.venue.name || 'Race Venue',
    coordinates: {
      latitude: race.venue.coordinates_lat || 0,
      longitude: race.venue.coordinates_lng || 0
    },
    region: 'asia_pacific',
    country: 'HK'
  } : null;

  const { weather } = useRaceWeather(venueForWeather as any, race?.start_time);

  // DEBUG: Log whenever drawingPolygon changes
  useEffect(() => {
    console.log('🟢 [RaceDetailScrollable] drawingPolygon state changed:', drawingPolygon);
    console.log('🟢 [RaceDetailScrollable] drawingPolygon length:', drawingPolygon.length);
  }, [drawingPolygon]);

  // Scroll animation for map resize
  const scrollY = useRef(new Animated.Value(0)).current;
  const [mapCompact, setMapCompact] = useState(false);

  useEffect(() => {
    loadRaceData();
  }, [id]);

  // Track scroll position for map resize
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      setMapCompact(value > 100);
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, []);

  const loadRaceData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      console.log('[RaceDetailScrollable] Loading race:', id);

      // Load race details from regattas table (same as original race detail)
      const { data: raceData, error: raceError } = await supabase
        .from('regattas')
        .select('*')
        .eq('id', id)
        .single();

      if (raceError) {
        console.error('[RaceDetailScrollable] Error loading race:', raceError);
        return;
      }

      if (!raceData) {
        console.error('[RaceDetailScrollable] Race not found');
        return;
      }

      // Transform regatta data to RaceEvent format
      const transformedRace: RaceEvent = {
        id: raceData.id,
        race_name: raceData.name || 'Unnamed Race',
        start_time: raceData.start_date,
        racing_area_polygon: raceData.racing_area_polygon,
        venue: raceData.metadata?.venue_name ? {
          name: raceData.metadata.venue_name,
          coordinates_lat: raceData.metadata?.venue_lat || 22.2650,
          coordinates_lng: raceData.metadata?.venue_lng || 114.2620,
        } : undefined,
        boat_class: raceData.metadata?.class_name ? {
          name: raceData.metadata.class_name
        } : undefined,
      };

      // Look up actual venue ID from sailing_venues if we have a venue name
      if (transformedRace.venue?.name) {
        const { data: venueData } = await supabase
          .from('sailing_venues')
          .select('id')
          .ilike('name', `%${transformedRace.venue.name}%`)
          .limit(1)
          .maybeSingle();

        if (venueData) {
          transformedRace.venue.id = venueData.id;
          console.log('[RaceDetailScrollable] Found venue ID:', venueData.id);
        }
      }

      setRace(transformedRace);
      console.log('[RaceDetailScrollable] Race loaded:', transformedRace);

      // Try to find associated race_event for marks
      const { data: raceEvent } = await supabase
        .from('race_events')
        .select('id')
        .eq('regatta_id', id)
        .maybeSingle();

      if (raceEvent) {
        // Load race marks
        const { data: marksData, error: marksError} = await supabase
          .from('race_marks')
          .select('*')
          .eq('race_id', raceEvent.id)
          .order('name', { ascending: true });

        if (!marksError && marksData) {
          // Convert race_marks format to CourseMark format
          const convertedMarks: CourseMark[] = marksData.map((mark: any) => ({
            id: mark.id,
            mark_name: mark.name,
            mark_type: mark.mark_type,
            latitude: mark.latitude,
            longitude: mark.longitude,
            sequence_order: 0, // Will be set by order in array
          }));
          setMarks(convertedMarks);
          console.log('[RaceDetailScrollable] Marks loaded:', convertedMarks.length);
        }
      }
    } catch (error) {
      console.error('[RaceDetailScrollable] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleRacingAreaChange = (polygon: Array<{lat: number, lng: number}>) => {
    console.log('🔵 [RaceDetailScrollable] handleRacingAreaChange called');
    console.log('🔵 [RaceDetailScrollable] Current drawingPolygon BEFORE update:', drawingPolygon);
    console.log('🔵 [RaceDetailScrollable] New polygon to set:', polygon);
    setDrawingPolygon(polygon);
    console.log('🔵 [RaceDetailScrollable] setDrawingPolygon called with:', polygon);
  };

  const handleSaveRacingArea = async () => {
    if (drawingPolygon.length < 3) {
      alert('Please draw at least 3 points for the racing area');
      return;
    }

    try {
      console.log('[RaceDetailScrollable] Saving racing area:', drawingPolygon);
      console.log('[RaceDetailScrollable] Race ID:', id);

      // First, check if race_event exists
      let raceEventId = null;
      const { data: raceEvent } = await supabase
        .from('race_events')
        .select('id')
        .eq('regatta_id', id)
        .maybeSingle();

      if (!raceEvent) {
        // Create a race_event if it doesn't exist
        const { data: newRaceEvent, error: createError } = await supabase
          .from('race_events')
          .insert({
            regatta_id: id,
            name: race?.race_name || 'Race',
            event_date: race?.start_time ? new Date(race.start_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            start_time: race?.start_time ? new Date(race.start_time).toTimeString().split(' ')[0] : '10:00:00',
          })
          .select('id')
          .single();

        if (createError) throw createError;
        raceEventId = newRaceEvent.id;
      } else {
        raceEventId = raceEvent.id;
      }

      // Convert to GeoJSON Polygon format for bounding box calculation
      const coordinates = drawingPolygon.map(point => [point.lng, point.lat]);

      // Calculate bounding box
      const lats = drawingPolygon.map(p => p.lat);
      const lngs = drawingPolygon.map(p => p.lng);
      const bounds = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs),
      };

      console.log('[RaceDetailScrollable] Bounds:', bounds);

      // Check if racing area already exists for this race
      const { data: existingArea } = await supabase
        .from('racing_areas')
        .select('id')
        .eq('race_id', raceEventId)
        .eq('area_type', 'racing')
        .maybeSingle();

      let saveResult;
      if (existingArea) {
        // Update existing racing area
        console.log('[RaceDetailScrollable] Updating existing racing area:', existingArea.id);
        const { data, error } = await supabase
          .from('racing_areas')
          .update({
            bounds_north: bounds.north,
            bounds_south: bounds.south,
            bounds_east: bounds.east,
            bounds_west: bounds.west,
            description: 'Main racing area',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingArea.id)
          .select();

        if (error) {
          console.error('[RaceDetailScrollable] Update error:', error);
          throw error;
        }
        saveResult = data;
      } else {
        // Insert new racing area
        console.log('[RaceDetailScrollable] Inserting new racing area');
        const { data, error } = await supabase
          .from('racing_areas')
          .insert({
            race_id: raceEventId,
            area_type: 'racing',
            bounds_north: bounds.north,
            bounds_south: bounds.south,
            bounds_east: bounds.east,
            bounds_west: bounds.west,
            description: 'Main racing area',
          })
          .select();

        if (error) {
          console.error('[RaceDetailScrollable] Insert error:', error);
          throw error;
        }
        saveResult = data;
      }

      console.log('[RaceDetailScrollable] Racing area saved to racing_areas table:', saveResult);

      // ALSO save to regattas table for display
      const polygonGeoJSON = {
        type: 'Polygon',
        coordinates: [[...coordinates, coordinates[0]]] // Close the polygon
      };

      const { error: regattaUpdateError } = await supabase
        .from('regattas')
        .update({
          racing_area_polygon: polygonGeoJSON
        })
        .eq('id', id);

      if (regattaUpdateError) {
        console.error('[RaceDetailScrollable] Error updating regatta:', regattaUpdateError);
        throw regattaUpdateError;
      }

      console.log('[RaceDetailScrollable] Racing area saved to regattas table successfully');

      // AUTO-GENERATE RACING MARKS
      try {
        console.log('🏁 [RaceDetailScrollable] Auto-generating course marks');

        // Get wind data from weather hook
        const windDirection = weather?.wind?.direction || 'SE'; // Default SE if no weather
        const windSpeed = weather?.wind
          ? (weather.wind.speedMin + weather.wind.speedMax) / 2
          : 12; // Default 12kt

        // Calculate racing area metadata
        const center = autoCourseGenerator.calculateCenter(drawingPolygon);
        const racingArea = {
          polygon: drawingPolygon,
          center,
          bounds,
        };

        // Generate standard course marks
        const generatedMarks = autoCourseGenerator.generateStandardCourse(
          racingArea,
          windDirection,
          windSpeed,
          race?.boat_class?.name
        );

        // Save marks to database
        const marksToInsert = generatedMarks.map(mark => ({
          race_id: raceEventId,
          name: mark.name,
          mark_type: mark.mark_type,
          latitude: mark.latitude,
          longitude: mark.longitude,
          color: mark.color,
          shape: mark.shape,
          description: mark.description,
        }));

        const { data: insertedMarks, error: marksError } = await supabase
          .from('race_marks')
          .insert(marksToInsert)
          .select();

        if (marksError) {
          console.error('[RaceDetailScrollable] Error saving marks:', marksError);
          throw marksError;
        }

        console.log('✅ [RaceDetailScrollable] Saved', insertedMarks?.length, 'course marks to database');

        // Convert to local mark format and update state
        const convertedMarks: CourseMark[] = generatedMarks.map((mark, index) => ({
          id: mark.id,
          mark_name: mark.name,
          mark_type: mark.mark_type,
          latitude: mark.latitude,
          longitude: mark.longitude,
          sequence_order: index + 1,
        }));

        setMarks(convertedMarks);
        console.log('✅ [RaceDetailScrollable] Updated map with', convertedMarks.length, 'marks');

        alert(`Racing area saved with ${generatedMarks.length} auto-generated course marks!`);
      } catch (markError: any) {
        console.error('[RaceDetailScrollable] Error generating marks:', markError);
        alert(`Racing area saved, but failed to generate marks: ${markError.message}`);
      }

      setDrawingPolygon([]);
      // Note: No need to reload race data - marks are already set in state above
    } catch (error: any) {
      console.error('[RaceDetailScrollable] Error saving racing area:', error);
      alert(`Failed to save racing area: ${error.message || 'Unknown error'}`);
    }
  };

  const handleFullscreen = () => {
    console.log('[RaceDetailScrollable] Fullscreen map');
    // TODO: Implement fullscreen map modal
  };

  const handleCourseSelected = (courseMarks: Mark[]) => {
    console.log('📍 [RaceDetailScrollable] Course selected with', courseMarks.length, 'marks');
    console.log('📍 [RaceDetailScrollable] Raw course marks:', JSON.stringify(courseMarks, null, 2));

    // Convert Mark[] to CourseMark[] format
    const convertedMarks: CourseMark[] = courseMarks.map((mark, index) => ({
      id: mark.id || `mark-${index}`,
      mark_name: mark.name,
      mark_type: mark.type,
      latitude: mark.latitude,
      longitude: mark.longitude,
      sequence_order: index + 1,
    }));

    console.log('📍 [RaceDetailScrollable] Converted marks:', JSON.stringify(convertedMarks, null, 2));
    setMarks(convertedMarks);
    console.log('✅ [RaceDetailScrollable] Marks updated:', convertedMarks.length);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading race...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!race) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Race not found</Text>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            {race.race_name}
          </Text>
          {race.venue?.name && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {race.venue.name}
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={handleMenu} style={styles.headerButton}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Map Hero Section */}
        {(() => {
          const polygonToPass = drawingPolygon.length > 0 ? drawingPolygon : undefined;
          console.log('🔴 [RaceDetailScrollable] RENDERING RaceDetailMapHero');
          console.log('🔴 [RaceDetailScrollable] drawingPolygon:', drawingPolygon);
          console.log('🔴 [RaceDetailScrollable] Passing racingAreaPolygon:', polygonToPass);
          return null;
        })()}
        <RaceDetailMapHero
          race={race}
          racingAreaPolygon={drawingPolygon.length > 0 ? drawingPolygon : undefined}
          marks={marks}
          compact={mapCompact}
          onFullscreen={handleFullscreen}
          onRacingAreaChange={handleRacingAreaChange}
          onSaveRacingArea={handleSaveRacingArea}
        />

        {/* Strategy Cards Section */}
        <View style={styles.cardsContainer}>
          {/* Course Selection */}
          {race.venue && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.sectionLabel}>Course Setup</Text>
              <CourseSelector
                venueId={race.venue.id}
                venueName={race.venue.name}
                onCourseSelected={handleCourseSelected}
                currentWindDirection={weather?.wind ?
                  (['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'].indexOf(weather.wind.direction) * 22.5) :
                  undefined
                }
                currentWindSpeed={weather?.wind ? (weather.wind.speedMin + weather.wind.speedMax) / 2 : undefined}
              />
            </View>
          )}

          {/* Phase 2: Real Strategy Cards */}

          <StartStrategyCard
            raceId={race.id}
            raceName={race.race_name}
          />

          <WindWeatherCard
            raceId={race.id}
            raceTime={race.start_time}
            venueCoordinates={race.venue ? {
              lat: race.venue.coordinates_lat || 0,
              lng: race.venue.coordinates_lng || 0
            } : undefined}
            venue={race.venue?.id ? {
              id: race.venue.id,
              name: race.venue.name || 'Race Venue',
              coordinates: {
                latitude: race.venue.coordinates_lat || 0,
                longitude: race.venue.coordinates_lng || 0
              },
              region: 'asia_pacific',
              country: 'HK'
            } : undefined}
          />

          <CurrentTideCard
            raceId={race.id}
            raceTime={race.start_time}
            venueCoordinates={race.venue ? {
              lat: race.venue.coordinates_lat || 0,
              lng: race.venue.coordinates_lng || 0
            } : undefined}
            venue={race.venue?.id ? {
              id: race.venue.id,
              name: race.venue.name || 'Race Venue',
              coordinates: {
                latitude: race.venue.coordinates_lat || 0,
                longitude: race.venue.coordinates_lng || 0
              },
              region: 'asia_pacific',
              country: 'HK'
            } : undefined}
          />

          <TacticalPlanCard
            raceId={race.id}
            raceName={race.race_name}
          />

          <PostRaceAnalysisCard
            raceId={race.id}
            raceName={race.race_name}
            raceStartTime={race.start_time}
          />

          <StrategyCard
            icon="file-document-multiple"
            title="Documents"
            expandable={true}
            defaultExpanded={false}
          >
            <Text style={styles.cardPlaceholder}>
              Upload sailing instructions, NOR, or course diagrams.
            </Text>
          </StrategyCard>

          <StrategyCard
            icon="account-group"
            title="Crew & Equipment"
            expandable={true}
            defaultExpanded={false}
          >
            <Text style={styles.cardPlaceholder}>
              Manage crew assignments and boat setup.
            </Text>
          </StrategyCard>

          {/* Spacer for bottom */}
          <View style={styles.bottomSpacer} />
        </View>
      </Animated.ScrollView>

      {/* Action Menu (if shown) */}
      {showMenu && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={styles.menuBackdrop}
            onPress={() => setShowMenu(false)}
            activeOpacity={1}
          />
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem}>
              <MaterialCommunityIcons name="pencil" size={20} color="#0F172A" />
              <Text style={styles.menuItemText}>Edit Race Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#0F172A" />
              <Text style={styles.menuItemText}>Share Race</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <MaterialCommunityIcons name="download" size={20} color="#0F172A" />
              <Text style={styles.menuItemText}>Export Strategy</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]}>
              <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                Delete Race
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 16,
  },
  cardPlaceholder: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  menuItemDanger: {
    // Danger item styling
  },
  menuItemTextDanger: {
    color: '#EF4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  quickDrawContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  quickDrawHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  quickDrawTitleContainer: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  quickDrawTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  quickDrawSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  saveButton: {
    // Additional styling for save button
  },
  quickDrawInstructions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  saveRacingAreaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveRacingAreaButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
