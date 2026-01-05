/**
 * Fleet Race Content Section
 *
 * Renders the course setup and tactical race map for fleet racing.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { CourseSelector, RaceDetailMapHero } from '@/components/race-detail';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('FleetRaceContentSection');

interface Mark {
  name: string;
  type?: string;
  latitude: number;
  longitude: number;
  passingSide?: string;
  notes?: string;
}

interface RacingAreaPoint {
  lat: number;
  lng: number;
}

export interface FleetRaceContentSectionProps {
  /** Selected race data */
  raceData: any;
  /** Selected race marks */
  marks: Mark[];
  /** Racing area polygon being drawn */
  drawingRacingArea: RacingAreaPoint[];
  /** Callback to update marks */
  onMarksUpdate: (marks: Mark[]) => void;
  /** Callback to update race data locally */
  onRaceDataUpdate: (updater: (prev: any) => any) => void;
  /** Function to ensure race_event_id exists */
  ensureRaceEventId: () => Promise<string | null>;
  /** Racing area change handler */
  onRacingAreaChange: (polygon: RacingAreaPoint[]) => void;
  /** Save racing area handler */
  onSaveRacingArea: (polygon?: RacingAreaPoint[]) => Promise<void>;
  /** Mark added handler */
  onMarkAdded: (mark: any) => void;
  /** Mark updated handler */
  onMarkUpdated: (mark: any) => void;
  /** Mark deleted handler */
  onMarkDeleted: (markId: string) => void;
  /** Bulk marks update handler */
  onMarksBulkUpdate: (marks: any[]) => void;
}

/**
 * Fleet Race Content Section Component
 */
export function FleetRaceContentSection({
  raceData,
  marks,
  drawingRacingArea,
  onMarksUpdate,
  onRaceDataUpdate,
  ensureRaceEventId,
  onRacingAreaChange,
  onSaveRacingArea,
  onMarkAdded,
  onMarkUpdated,
  onMarkDeleted,
  onMarksBulkUpdate,
}: FleetRaceContentSectionProps) {
  /**
   * Handle course selection for fleet racing
   */
  const handleCourseSelected = async (newMarks: Mark[], courseName?: string) => {
    // Update marks state
    onMarksUpdate(newMarks);
    logger.info('Course template selected with marks:', newMarks.length, 'courseName:', courseName);

    // Update local state with course name
    if (courseName) {
      onRaceDataUpdate((prev: any) => ({
        ...prev,
        metadata: {
          ...prev?.metadata,
          selected_course_name: courseName,
        },
      }));
    }

    // Save marks to database
    if (raceData?.id && newMarks.length > 0) {
      try {
        const raceEventId = await ensureRaceEventId();
        if (!raceEventId) {
          logger.error('Could not get race_event_id for saving marks');
          return;
        }

        // Delete existing marks first
        const { error: deleteError } = await supabase
          .from('race_marks')
          .delete()
          .eq('race_event_id', raceEventId);

        if (deleteError) {
          logger.error('Error deleting old marks:', deleteError);
        }

        // Insert new marks
        const marksToInsert = newMarks.map((mark, index) => ({
          race_event_id: raceEventId,
          name: mark.name || `Mark ${index + 1}`,
          mark_type: mark.type || 'custom',
          latitude: mark.latitude,
          longitude: mark.longitude,
          sequence_order: index + 1,
        }));

        const { error: insertError } = await supabase
          .from('race_marks')
          .insert(marksToInsert);

        if (insertError) {
          logger.error('Error saving marks to database:', insertError);
        } else {
          logger.info('Marks saved to database for race:', raceData.id);
        }

        // Save course name to race metadata
        if (courseName) {
          const { error: metadataError } = await supabase
            .from('regattas')
            .update({
              metadata: {
                ...raceData.metadata,
                selected_course_name: courseName,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', raceData.id);

          if (metadataError) {
            logger.error('Error saving course name to metadata:', metadataError);
          } else {
            logger.info('Course name saved to metadata:', courseName);
          }
        }
      } catch (err) {
        logger.error('Exception saving marks:', err);
      }
    }
  };

  // Get racing area polygon for display
  const racingAreaPolygon = drawingRacingArea.length > 0
    ? drawingRacingArea
    : raceData.racing_area_polygon?.coordinates?.[0]?.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0]
      }));

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
          raceType="fleet"
        />
      </View>

      {/* Tactical Race Map */}
      <RaceDetailMapHero
        race={{
          id: raceData.id,
          race_name: raceData.name,
          start_time: raceData.start_date,
          venue: raceData.metadata?.venue_name ? {
            name: raceData.metadata.venue_name,
            coordinates_lat: raceData.metadata?.venue_lat || 22.2650,
            coordinates_lng: raceData.metadata?.venue_lng || 114.2620,
          } : undefined,
          racing_area_polygon: raceData.racing_area_polygon,
          boat_class: raceData.metadata?.class_name ? {
            name: raceData.metadata.class_name
          } : undefined,
        }}
        marks={marks}
        compact={false}
        racingAreaPolygon={racingAreaPolygon}
        onRacingAreaChange={onRacingAreaChange}
        onSaveRacingArea={onSaveRacingArea}
        onMarkAdded={onMarkAdded}
        onMarkUpdated={onMarkUpdated}
        onMarkDeleted={onMarkDeleted}
        onMarksBulkUpdate={onMarksBulkUpdate}
      />
    </>
  );
}

export default FleetRaceContentSection;
