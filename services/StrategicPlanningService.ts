import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('StrategicPlanningService');

/**
 * Strategic plan for each phase of the race
 */
export interface RaceStrategyPlan {
  rigTuningStrategy?: string;
  prestartStrategy?: string;
  startStrategy?: string;
  upwindStrategy?: string;
  windwardMarkStrategy?: string;
  downwindStrategy?: string;
  leewardMarkStrategy?: string;
  finishStrategy?: string;
}

/**
 * AI-generated strategy suggestions based on conditions and learning profile
 */
export interface AIStrategySuggestions {
  rigTuning?: string;
  prestart?: string;
  start?: string;
  upwind?: string;
  windwardMark?: string;
  downwind?: string;
  leewardMark?: string;
  finish?: string;
  contextualInsights?: string[];
  learningBasedTips?: string[];
  generatedAt?: string;
}

/**
 * Complete race preparation including strategic planning
 */
export interface RacePreparationWithStrategy {
  id?: string;
  race_event_id: string;
  sailor_id: string;

  // Existing fields
  rig_notes?: string;
  selected_rig_preset_id?: string;
  regulatory_acknowledgements?: any;
  race_brief_data?: any;

  // Strategic planning fields
  rig_tuning_strategy?: string;
  prestart_strategy?: string;
  start_strategy?: string;
  upwind_strategy?: string;
  windward_mark_strategy?: string;
  downwind_strategy?: string;
  leeward_mark_strategy?: string;
  finish_strategy?: string;

  // AI suggestions
  ai_strategy_suggestions?: AIStrategySuggestions;

  // Coach sharing
  shared_with_coach?: boolean;
  coach_id?: string;
  shared_at?: string;

  created_at?: string;
  updated_at?: string;
}

class StrategicPlanningService {
  /**
   * Get race preparation with strategic plan
   */
  async getPreparationWithStrategy(
    raceEventId: string,
    sailorId: string
  ): Promise<RacePreparationWithStrategy | null> {
    try {
      const { data, error } = await supabase
        .from('sailor_race_preparation')
        .select('*')
        .eq('race_event_id', raceEventId)
        .eq('sailor_id', sailorId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching preparation with strategy:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get preparation with strategy:', error);
      return null;
    }
  }

  /**
   * Get race preparation by its ID (used when post-race analysis links directly to preparation)
   */
  async getPreparationById(preparationId: string): Promise<RacePreparationWithStrategy | null> {
    try {
      const { data, error } = await supabase
        .from('sailor_race_preparation')
        .select('*')
        .eq('id', preparationId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching preparation by id:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get preparation by id:', error);
      return null;
    }
  }

  /**
   * Update strategic plan for a specific race phase
   */
  async updatePhaseStrategy(
    raceEventId: string,
    sailorId: string,
    phase: keyof RaceStrategyPlan,
    strategy: string
  ): Promise<boolean> {
    try {
      // Map phase to database column name
      const columnMap: Record<keyof RaceStrategyPlan, string> = {
        rigTuningStrategy: 'rig_tuning_strategy',
        prestartStrategy: 'prestart_strategy',
        startStrategy: 'start_strategy',
        upwindStrategy: 'upwind_strategy',
        windwardMarkStrategy: 'windward_mark_strategy',
        downwindStrategy: 'downwind_strategy',
        leewardMarkStrategy: 'leeward_mark_strategy',
        finishStrategy: 'finish_strategy',
      };

      const columnName = columnMap[phase];

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            race_event_id: raceEventId,
            sailor_id: sailorId,
            [columnName]: strategy,
          },
          {
            onConflict: 'race_event_id,sailor_id',
          }
        );

      if (error) {
        logger.error(`Error updating ${phase} strategy:`, error);
        throw error;
      }

      logger.info(`Updated ${phase} strategy successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to update ${phase} strategy:`, error);
      return false;
    }
  }

  /**
   * Update complete strategic plan at once
   */
  async updateCompleteStrategy(
    raceEventId: string,
    sailorId: string,
    plan: RaceStrategyPlan
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            race_event_id: raceEventId,
            sailor_id: sailorId,
            rig_tuning_strategy: plan.rigTuningStrategy,
            prestart_strategy: plan.prestartStrategy,
            start_strategy: plan.startStrategy,
            upwind_strategy: plan.upwindStrategy,
            windward_mark_strategy: plan.windwardMarkStrategy,
            downwind_strategy: plan.downwindStrategy,
            leeward_mark_strategy: plan.leewardMarkStrategy,
            finish_strategy: plan.finishStrategy,
          },
          {
            onConflict: 'race_event_id,sailor_id',
          }
        );

      if (error) {
        logger.error('Error updating complete strategy:', error);
        throw error;
      }

      logger.info('Complete strategy updated successfully');
      return true;
    } catch (error) {
      logger.error('Failed to update complete strategy:', error);
      return false;
    }
  }

  /**
   * Store AI-generated strategy suggestions
   */
  async storeAISuggestions(
    raceEventId: string,
    sailorId: string,
    suggestions: AIStrategySuggestions
  ): Promise<boolean> {
    try {
      const suggestionsWithTimestamp = {
        ...suggestions,
        generatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            race_event_id: raceEventId,
            sailor_id: sailorId,
            ai_strategy_suggestions: suggestionsWithTimestamp,
          },
          {
            onConflict: 'race_event_id,sailor_id',
          }
        );

      if (error) {
        logger.error('Error storing AI suggestions:', error);
        throw error;
      }

      logger.info('AI suggestions stored successfully');
      return true;
    } catch (error) {
      logger.error('Failed to store AI suggestions:', error);
      return false;
    }
  }

  /**
   * Get AI-generated strategy suggestions
   */
  async getAISuggestions(
    raceEventId: string,
    sailorId: string
  ): Promise<AIStrategySuggestions | null> {
    try {
      const { data, error } = await supabase
        .from('sailor_race_preparation')
        .select('ai_strategy_suggestions')
        .eq('race_event_id', raceEventId)
        .eq('sailor_id', sailorId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching AI suggestions:', error);
        throw error;
      }

      return data?.ai_strategy_suggestions || null;
    } catch (error) {
      logger.error('Failed to get AI suggestions:', error);
      return null;
    }
  }

  /**
   * Share strategic plan with coach
   */
  async shareWithCoach(
    raceEventId: string,
    sailorId: string,
    coachId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sailor_race_preparation')
        .update({
          shared_with_coach: true,
          coach_id: coachId,
          shared_at: new Date().toISOString(),
        })
        .eq('race_event_id', raceEventId)
        .eq('sailor_id', sailorId);

      if (error) {
        logger.error('Error sharing with coach:', error);
        throw error;
      }

      logger.info('Strategy shared with coach successfully');
      return true;
    } catch (error) {
      logger.error('Failed to share with coach:', error);
      return false;
    }
  }

  /**
   * Unshare strategic plan from coach
   */
  async unshareFromCoach(
    raceEventId: string,
    sailorId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sailor_race_preparation')
        .update({
          shared_with_coach: false,
          coach_id: null,
          shared_at: null,
        })
        .eq('race_event_id', raceEventId)
        .eq('sailor_id', sailorId);

      if (error) {
        logger.error('Error unsharing from coach:', error);
        throw error;
      }

      logger.info('Strategy unshared from coach successfully');
      return true;
    } catch (error) {
      logger.error('Failed to unshare from coach:', error);
      return false;
    }
  }

  /**
   * Get all strategic plans shared with a specific coach
   */
  async getSharedPlansForCoach(coachId: string): Promise<RacePreparationWithStrategy[]> {
    try {
      const { data, error } = await supabase
        .from('sailor_race_preparation')
        .select(`
          *,
          race_events!inner (
            id,
            name,
            event_date,
            venue_location
          ),
          sailor_profiles!inner (
            id,
            user_id,
            sailing_number
          )
        `)
        .eq('coach_id', coachId)
        .eq('shared_with_coach', true)
        .order('shared_at', { ascending: false });

      if (error) {
        logger.error('Error fetching shared plans:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get shared plans:', error);
      return [];
    }
  }

  /**
   * Check if strategic plan is complete (all phases documented)
   */
  isPlanComplete(plan: RacePreparationWithStrategy): boolean {
    return !!(
      plan.rig_tuning_strategy &&
      plan.prestart_strategy &&
      plan.start_strategy &&
      plan.upwind_strategy &&
      plan.windward_mark_strategy &&
      plan.downwind_strategy &&
      plan.leeward_mark_strategy &&
      plan.finish_strategy
    );
  }

  /**
   * Get completion percentage of strategic plan
   */
  getPlanCompletionPercentage(plan: RacePreparationWithStrategy): number {
    const phases = [
      plan.rig_tuning_strategy,
      plan.prestart_strategy,
      plan.start_strategy,
      plan.upwind_strategy,
      plan.windward_mark_strategy,
      plan.downwind_strategy,
      plan.leeward_mark_strategy,
      plan.finish_strategy,
    ];

    const completedPhases = phases.filter((phase) => phase && phase.trim().length > 0).length;
    return Math.round((completedPhases / phases.length) * 100);
  }

  /**
   * Get list of incomplete phases
   */
  getIncompletePhases(plan: RacePreparationWithStrategy): string[] {
    const phaseChecks = [
      { name: 'Rig Tuning', value: plan.rig_tuning_strategy },
      { name: 'Pre-Start', value: plan.prestart_strategy },
      { name: 'Start', value: plan.start_strategy },
      { name: 'Upwind', value: plan.upwind_strategy },
      { name: 'Windward Mark', value: plan.windward_mark_strategy },
      { name: 'Downwind', value: plan.downwind_strategy },
      { name: 'Leeward Mark', value: plan.leeward_mark_strategy },
      { name: 'Finish', value: plan.finish_strategy },
    ];

    return phaseChecks
      .filter((phase) => !phase.value || phase.value.trim().length === 0)
      .map((phase) => phase.name);
  }
}

export const strategicPlanningService = new StrategicPlanningService();
