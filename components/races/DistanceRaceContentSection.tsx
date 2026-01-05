/**
 * Distance Race Content Section
 *
 * Renders the course setup, pre-race briefing, strategy, route map,
 * and weather along route cards for distance racing.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { CourseSelector } from '@/components/race-detail';
import { DistanceRacingStrategyCard, RouteMapCard, WeatherAlongRouteCard } from '@/components/race-detail';
import { PreRaceBriefingCard } from '@/components/races/PreRaceBriefingCard';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('DistanceRaceContentSection');

export interface DistanceRaceContentSectionProps {
  /** Selected race data */
  raceData: any;
  /** Whether the race is in the future */
  isRaceFuture: boolean;
  /** Current user ID for edit permissions */
  userId?: string;
  /** Enriched weather data */
  enrichedWeather?: {
    wind?: any;
    tide?: any;
  };
  /** Callback to update race data locally */
  onRaceDataUpdate: (updater: (prev: any) => any) => void;
  /** Callback to navigate to edit route */
  onEditRoute?: () => void;
}

/**
 * Distance Race Content Section Component
 */
export function DistanceRaceContentSection({
  raceData,
  isRaceFuture,
  userId,
  enrichedWeather,
  onRaceDataUpdate,
  onEditRoute,
}: DistanceRaceContentSectionProps) {
  /**
   * Handle course selection for distance racing
   */
  const handleCourseSelected = async (marks: any[], courseName?: string) => {
    // Convert marks to route waypoints format
    const waypoints = marks.map((mark) => {
      let waypointType: 'start' | 'waypoint' | 'gate' | 'finish' = 'waypoint';
      const markType = mark.type?.toLowerCase() || '';

      if (markType === 'committee_boat' || markType.includes('start')) {
        waypointType = 'start';
      } else if (markType === 'finish' || markType.includes('finish')) {
        waypointType = 'finish';
      } else if (markType.includes('gate')) {
        waypointType = 'gate';
      }

      return {
        name: mark.name,
        latitude: mark.latitude,
        longitude: mark.longitude,
        type: waypointType,
        required: true,
        passingSide: mark.passingSide,
        notes: mark.notes,
      };
    });

    // Update local state
    onRaceDataUpdate((prev: any) => ({
      ...prev,
      route_waypoints: waypoints,
      metadata: {
        ...prev?.metadata,
        selected_course_name: courseName,
      },
    }));

    // Persist to database
    if (raceData?.id) {
      try {
        const { error } = await supabase
          .from('regattas')
          .update({
            route_waypoints: waypoints,
            metadata: {
              ...raceData.metadata,
              selected_course_name: courseName,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', raceData.id);

        if (error) {
          logger.error('Error saving waypoints to database:', error);
        } else {
          logger.info('Waypoints saved for race:', raceData.id, courseName);
        }
      } catch (err) {
        logger.error('Exception saving waypoints:', err);
      }
    }

    logger.info('Course template selected:', marks.length, 'waypoints');
  };

  return (
    <>
      {/* Course Selection */}
      <View style={{ marginBottom: 16, marginHorizontal: 16 }}>
        <Text style={{
          fontSize: 13,
          fontWeight: '600',
          color: '#64748B',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          Course Setup
        </Text>
        <CourseSelector
          venueId={raceData.metadata?.venue_id}
          venueName={raceData.metadata?.venue_name}
          venueCoordinates={raceData.metadata?.venue_lat && raceData.metadata?.venue_lng ? {
            lat: raceData.metadata.venue_lat,
            lng: raceData.metadata.venue_lng,
          } : undefined}
          currentWindDirection={raceData.metadata?.expected_wind_direction}
          currentWindSpeed={raceData.metadata?.expected_wind_speed}
          onCourseSelected={handleCourseSelected}
          raceType="distance"
        />
      </View>

      {/* Pre-Race Briefing - only for future races */}
      {isRaceFuture && (
        <PreRaceBriefingCard
          raceId={raceData.id}
          raceName={raceData.name}
          raceDate={raceData.start_date}
          venueName={raceData.metadata?.venue_name}
          boatClassName={raceData.metadata?.class_name}
          routeWaypoints={raceData.route_waypoints}
          totalDistanceNm={raceData.total_distance_nm}
        />
      )}

      {/* Strategy with AI suggestions */}
      <DistanceRacingStrategyCard
        raceId={raceData.id}
        raceName={raceData.name}
        raceEventId={raceData.race_event_id}
        routeWaypoints={raceData.route_waypoints || []}
        totalDistanceNm={raceData.total_distance_nm}
        raceDate={raceData.start_date}
        venueId={raceData.metadata?.venue_id}
      />

      {/* Route Map with Waypoints */}
      <RouteMapCard
        waypoints={raceData.route_waypoints || []}
        totalDistanceNm={raceData.total_distance_nm}
        raceId={raceData.id}
        onEditRoute={raceData.created_by === userId ? onEditRoute : undefined}
      />

      {/* Weather Along Route */}
      <WeatherAlongRouteCard
        waypoints={raceData.route_waypoints || []}
        raceDate={raceData.start_date?.split('T')[0] || new Date().toISOString().split('T')[0]}
        startTime={raceData.start_date?.split('T')[1]?.slice(0, 5) || raceData.warning_signal_time || '10:00'}
        sharedWeather={{
          wind: enrichedWeather?.wind || raceData.metadata?.wind,
          tide: enrichedWeather?.tide || raceData.metadata?.tide,
        }}
      />
    </>
  );
}

export default DistanceRaceContentSection;
