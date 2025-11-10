import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CoachStrategyService');

export interface SharedStrategy {
  id: string;
  race_event_id: string;
  sailor_id: string;
  sailor_name: string;
  sailor_email: string;
  race_name: string;
  race_date: string;
  venue_name?: string;

  // Strategy fields
  rig_tuning_strategy?: string;
  prestart_strategy?: string;
  start_strategy?: string;
  upwind_strategy?: string;
  windward_mark_strategy?: string;
  downwind_strategy?: string;
  leeward_mark_strategy?: string;
  finish_strategy?: string;

  // Sharing metadata
  shared_with_coach: boolean;
  coach_id: string;
  shared_at: string;

  // Coach feedback
  coach_feedback?: string;
  coach_reviewed_at?: string;
}

class CoachStrategyService {
  /**
   * Get all strategies shared with a specific coach
   */
  async getSharedStrategies(coachId: string): Promise<SharedStrategy[]> {
    try {
      logger.info('Fetching shared strategies for coach:', coachId);

      const { data, error } = await supabase
        .from('sailor_race_preparation')
        .select(`
          *,
          sailor:sailor_profiles!sailor_id (
            id,
            user_id,
            user:users!user_id (
              email
            )
          ),
          race:race_events!race_event_id (
            id,
            name,
            start_date,
            metadata
          )
        `)
        .eq('coach_id', coachId)
        .eq('shared_with_coach', true)
        .order('shared_at', { ascending: false });

      if (error) {
        logger.error('Error fetching shared strategies:', error);
        throw error;
      }

      // Transform the data
      const strategies: SharedStrategy[] = (data || []).map((item: any) => ({
        id: item.id,
        race_event_id: item.race_event_id,
        sailor_id: item.sailor_id,
        sailor_name: item.sailor?.user?.email?.split('@')[0] || 'Sailor',
        sailor_email: item.sailor?.user?.email || '',
        race_name: item.race?.name || 'Race',
        race_date: item.race?.start_date || '',
        venue_name: item.race?.metadata?.venue_name,

        rig_tuning_strategy: item.rig_tuning_strategy,
        prestart_strategy: item.prestart_strategy,
        start_strategy: item.start_strategy,
        upwind_strategy: item.upwind_strategy,
        windward_mark_strategy: item.windward_mark_strategy,
        downwind_strategy: item.downwind_strategy,
        leeward_mark_strategy: item.leeward_mark_strategy,
        finish_strategy: item.finish_strategy,

        shared_with_coach: item.shared_with_coach,
        coach_id: item.coach_id,
        shared_at: item.shared_at,

        coach_feedback: item.coach_feedback,
        coach_reviewed_at: item.coach_reviewed_at,
      }));

      logger.info(`Found ${strategies.length} shared strategies`);
      return strategies;
    } catch (error) {
      logger.error('Failed to fetch shared strategies:', error);
      return [];
    }
  }

  /**
   * Add coach feedback to a strategy
   */
  async addCoachFeedback(
    strategyId: string,
    coachId: string,
    feedback: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sailor_race_preparation')
        .update({
          coach_feedback: feedback,
          coach_reviewed_at: new Date().toISOString(),
        })
        .eq('id', strategyId)
        .eq('coach_id', coachId); // Ensure only the assigned coach can add feedback

      if (error) {
        logger.error('Error adding coach feedback:', error);
        throw error;
      }

      logger.info('Coach feedback added successfully');
      return true;
    } catch (error) {
      logger.error('Failed to add coach feedback:', error);
      return false;
    }
  }

  /**
   * Mark strategy as reviewed
   */
  async markAsReviewed(
    strategyId: string,
    coachId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sailor_race_preparation')
        .update({
          coach_reviewed_at: new Date().toISOString(),
        })
        .eq('id', strategyId)
        .eq('coach_id', coachId);

      if (error) {
        logger.error('Error marking strategy as reviewed:', error);
        throw error;
      }

      logger.info('Strategy marked as reviewed');
      return true;
    } catch (error) {
      logger.error('Failed to mark strategy as reviewed:', error);
      return false;
    }
  }

  /**
   * Get coach profile by user ID
   */
  async getCoachProfileByUserId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Error fetching coach profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch coach profile:', error);
      return null;
    }
  }
}

export const coachStrategyService = new CoachStrategyService();
