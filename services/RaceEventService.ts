// @ts-nocheck

/**
 * Race Event Service
 *
 * Core service for managing race events and course intelligence
 * Powers the race strategy data gathering UX
 *
 * See: plans/race-strategy-data-gathering-ux.md
 */

import { supabase } from './supabase';
import {
  RaceEvent,
  RaceEventInsert,
  RaceEventUpdate,
  RaceEventWithDetails,
  RaceEventSummary,
  CourseMark,
  CourseMarkInsert,
  CreateRaceEventParams,
  ProcessDocumentsParams,
  SourceDocument,
  ExtractionStatus,
  ExtractionMethod,
  CourseGeoJSON
} from '../types/raceEvents';

export class RaceEventService {
  /**
   * Create a new race event
   * This is typically called when user provides race details or uploads documents
   */
  static async createRaceEvent(params: CreateRaceEventParams): Promise<{ data: RaceEvent | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const eventData: RaceEventInsert = {
        user_id: user.id,
        name: params.race_name,
        race_series: params.race_series,
        boat_class: params.boat_class,
        start_time: params.start_time,
        venue_id: params.venue_id,
        racing_area_name: params.racing_area_name,
        source_documents: params.source_documents || [],
        extraction_method: params.source_url ? ExtractionMethod.AI_AUTO : ExtractionMethod.MANUAL,
        extraction_status: params.source_url ? ExtractionStatus.PENDING : ExtractionStatus.COMPLETED
      };

      const { data, error } = await supabase
        .from('race_events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error creating race event:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get race event by ID with all related data
   */
  static async getRaceEvent(raceEventId: string): Promise<{ data: RaceEventWithDetails | null; error: Error | null }> {
    try {
      // Get race event
      const { data: raceEvent, error: raceError } = await supabase
        .from('race_events')
        .select('*')
        .eq('id', raceEventId)
        .single();

      if (raceError) throw raceError;
      if (!raceEvent) throw new Error('Race event not found');

      // Get venue details
      let venue = null;
      if (raceEvent.venue_id) {
        const { data: venueData } = await supabase
          .from('sailing_venues')
          .select('id, name, coordinates_lat, coordinates_lng, country, region')
          .eq('id', raceEvent.venue_id)
          .single();
        venue = venueData;
      }

      // Get course marks from race_marks table
      const { data: marks } = await supabase
        .from('race_marks')
        .select('*')
        .eq('race_id', raceEventId)
        .order('created_at', { ascending: true });

      // Get environmental forecasts
      const { data: forecasts } = await supabase
        .from('environmental_forecasts')
        .select('*')
        .eq('race_event_id', raceEventId)
        .order('forecast_time', { ascending: true });

      // Get document processing jobs
      const { data: processing_jobs } = await supabase
        .from('document_processing_jobs')
        .select('*')
        .eq('race_event_id', raceEventId)
        .order('created_at', { ascending: false });

      const result: RaceEventWithDetails = {
        ...raceEvent,
        venue: venue || undefined,
        marks: marks || [],
        forecasts: forecasts || [],
        processing_jobs: processing_jobs || []
      };

      return { data: result, error: null };
    } catch (error) {
      console.error('Error fetching race event:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get upcoming races for current user
   */
  static async getUpcomingRaces(daysAhead: number = 30): Promise<{ data: RaceEventSummary[]; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('get_upcoming_races', {
        p_user_id: user.id,
        p_days_ahead: daysAhead
      });

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching upcoming races:', error);
      return { data: [], error: error as Error };
    }
  }

  /**
   * Get all races for current user (with filtering)
   */
  static async getUserRaces(filters?: {
    status?: string;
    venue_id?: string;
    boat_class?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<{ data: RaceEvent[]; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('race_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('race_status', filters.status);
      }
      if (filters?.venue_id) {
        query = query.eq('venue_id', filters.venue_id);
      }
      if (filters?.boat_class) {
        query = query.eq('boat_class', filters.boat_class);
      }
      if (filters?.from_date) {
        query = query.gte('start_time', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('start_time', filters.to_date);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching user races:', error);
      return { data: [], error: error as Error };
    }
  }

  /**
   * Update race event
   */
  static async updateRaceEvent(
    raceEventId: string,
    updates: RaceEventUpdate
  ): Promise<{ data: RaceEvent | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('race_events')
        .update(updates)
        .eq('id', raceEventId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error updating race event:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete race event (cascades to marks, forecasts, jobs)
   */
  static async deleteRaceEvent(raceEventId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('race_events')
        .delete()
        .eq('id', raceEventId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting race event:', error);
      return { error: error as Error };
    }
  }

  /**
   * Add course marks to race event
   */
  static async addCourseMarks(
    raceEventId: string,
    marks: CourseMarkInsert[]
  ): Promise<{ data: CourseMark[] | null; error: Error | null }> {
    try {
      const marksWithRaceId = marks.map(mark => ({
        ...mark,
        race_id: raceEventId
      }));

      const { data, error } = await supabase
        .from('race_marks')
        .insert(marksWithRaceId)
        .select();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error adding course marks:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update course marks
   */
  static async updateCourseMarks(
    raceEventId: string,
    marks: CourseMark[]
  ): Promise<{ data: CourseMark[] | null; error: Error | null }> {
    try {
      // Delete existing marks
      await supabase
        .from('race_marks')
        .delete()
        .eq('race_id', raceEventId);

      // Insert new marks
      const marksToInsert = marks.map(({ id, created_at, updated_at, ...mark }) => ({
        ...mark,
        race_id: raceEventId
      }));

      const { data, error } = await supabase
        .from('race_marks')
        .insert(marksToInsert)
        .select();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error updating course marks:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get course marks as GeoJSON (for MapLibre)
   */
  static async getCourseMarksGeoJSON(raceEventId: string): Promise<{ data: CourseGeoJSON | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.rpc('get_course_marks_geojson', {
        p_race_event_id: raceEventId
      });

      if (error) throw error;

      return { data: data as CourseGeoJSON, error: null };
    } catch (error) {
      console.error('Error fetching course marks GeoJSON:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Start document processing for race event
   * This triggers the DocumentProcessingAgent
   */
  static async processDocuments(params: ProcessDocumentsParams): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create document processing jobs
      const jobs = params.documents.map(doc => ({
        race_event_id: params.race_event_id,
        user_id: user.id,
        document_type: doc.type,
        document_url: doc.url,
        document_filename: doc.filename,
        document_content: doc.content,
        status: 'pending'
      }));

      const { error: jobsError } = await supabase
        .from('document_processing_jobs')
        .insert(jobs);

      if (jobsError) throw jobsError;

      // Update race event status
      await this.updateRaceEvent(params.race_event_id, {
        extraction_status: ExtractionStatus.PROCESSING
      });

      // TODO: Trigger DocumentProcessingAgent via Edge Function or background job
      // For now, return success - the agent will be triggered in the next phase

      return { success: true, error: null };
    } catch (error) {
      console.error('Error processing documents:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Get saved course template for venue
   * Returns previously used course configuration at this venue
   */
  static async getVenueCourseTemplate(venueId: string, racingAreaName?: string): Promise<{ data: CourseMark[] | null; error: Error | null }> {
    try {
      // Get the most recent race at this venue with completed extraction
      let query = supabase
        .from('race_events')
        .select('id, course_geojson')
        .eq('venue_id', venueId)
        .eq('extraction_status', ExtractionStatus.COMPLETED)
        .order('start_time', { ascending: false })
        .limit(1);

      if (racingAreaName) {
        query = query.eq('racing_area_name', racingAreaName);
      }

      const { data: recentRace, error: raceError } = await query.single();

      if (raceError || !recentRace) {
        return { data: null, error: raceError as Error };
      }

      // Get marks from that race
      const { data: marks, error: marksError } = await supabase
        .from('race_marks')
        .select('*')
        .eq('race_id', recentRace.id)
        .order('created_at', { ascending: true });

      if (marksError) throw marksError;

      return { data: marks, error: null };
    } catch (error) {
      console.error('Error fetching venue course template:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get races by series
   * Useful for series tracking (e.g., all Croucher Series races)
   */
  static async getRaceSeries(seriesName: string): Promise<{ data: RaceEvent[]; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('race_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('race_series', seriesName)
        .order('start_time', { ascending: true });

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching race series:', error);
      return { data: [], error: error as Error };
    }
  }

  /**
   * Update race status (scheduled → active → completed)
   */
  static async updateRaceStatus(
    raceEventId: string,
    status: string,
    actualStartTime?: string,
    actualFinishTime?: string
  ): Promise<{ error: Error | null }> {
    try {
      const updates: RaceEventUpdate = {
        race_status: status
      };

      if (actualStartTime) {
        updates.actual_start_time = actualStartTime;
      }

      if (actualFinishTime) {
        updates.actual_finish_time = actualFinishTime;
      }

      const { error } = await supabase
        .from('race_events')
        .update(updates)
        .eq('id', raceEventId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error updating race status:', error);
      return { error: error as Error };
    }
  }

  /**
   * Search races by name or series
   */
  static async searchRaces(searchTerm: string): Promise<{ data: RaceEvent[]; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('race_events')
        .select('*')
        .eq('user_id', user.id)
        .or(`name.ilike.%${searchTerm}%,race_series.ilike.%${searchTerm}%`)
        .order('start_time', { ascending: false })
        .limit(20);

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error searching races:', error);
      return { data: [], error: error as Error };
    }
  }
}

export default RaceEventService;
