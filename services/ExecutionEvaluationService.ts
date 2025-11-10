import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ExecutionEvaluationService');

/**
 * Execution ratings (1-5) for how well the plan was executed
 */
export interface ExecutionRatings {
  rigTuningExecutionRating?: number;
  prestartExecutionRating?: number;
  startExecutionRating?: number;
  upwindExecutionRating?: number;
  windwardMarkExecutionRating?: number;
  downwindExecutionRating?: number;
  leewardMarkExecutionRating?: number;
  finishExecutionRating?: number;
}

/**
 * Execution notes describing what actually happened
 */
export interface ExecutionNotes {
  rigTuningExecutionNotes?: string;
  prestartExecutionNotes?: string;
  startExecutionNotes?: string;
  upwindExecutionNotes?: string;
  windwardMarkExecutionNotes?: string;
  downwindExecutionNotes?: string;
  leewardMarkExecutionNotes?: string;
  finishExecutionNotes?: string;
}

/**
 * AI-generated execution coaching comparing plan vs actual
 */
export interface AIExecutionCoaching {
  planVsExecution?: {
    phase: string;
    planned: string;
    actual: string;
    rating: number;
    gap: string;
    coaching: string;
  }[];
  overallExecution?: string;
  strengthAreas?: string[];
  improvementAreas?: string[];
  nextRaceFocus?: string[];
  generatedAt?: string;
}

/**
 * Complete race analysis with execution evaluation
 */
export interface RaceAnalysisWithExecution {
  id?: string;
  race_id: string;
  sailor_id: string;
  preparation_id?: string;

  // Existing analysis fields
  equipment_rating?: number;
  planning_rating?: number;
  crew_rating?: number;
  prestart_rating?: number;
  start_rating?: number;
  upwind_rating?: number;
  upwind_shift_awareness?: number;
  windward_mark_rating?: number;
  downwind_rating?: number;
  leeward_mark_rating?: number;
  finish_rating?: number;
  overall_satisfaction?: number;

  // Execution ratings (1-5)
  rig_tuning_execution_rating?: number;
  prestart_execution_rating?: number;
  start_execution_rating?: number;
  upwind_execution_rating?: number;
  windward_mark_execution_rating?: number;
  downwind_execution_rating?: number;
  leeward_mark_execution_rating?: number;
  finish_execution_rating?: number;

  // Execution notes
  rig_tuning_execution_notes?: string;
  prestart_execution_notes?: string;
  start_execution_notes?: string;
  upwind_execution_notes?: string;
  windward_mark_execution_notes?: string;
  downwind_execution_notes?: string;
  leeward_mark_execution_notes?: string;
  finish_execution_notes?: string;

  // AI coaching
  ai_execution_coaching?: AIExecutionCoaching;

  // Coach sharing
  execution_shared_with_coach?: boolean;
  execution_coach_id?: string;
  execution_shared_at?: string;

  created_at?: string;
  updated_at?: string;
}

class ExecutionEvaluationService {
  /**
   * Get race analysis with execution evaluation
   */
  async getAnalysisWithExecution(
    raceId: string,
    sailorId: string
  ): Promise<RaceAnalysisWithExecution | null> {
    try {
      const { data, error } = await supabase
        .from('race_analysis')
        .select('*')
        .eq('race_id', raceId)
        .eq('sailor_id', sailorId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching analysis with execution:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get analysis with execution:', error);
      return null;
    }
  }

  /**
   * Update execution rating for a specific phase
   */
  async updatePhaseExecutionRating(
    raceId: string,
    sailorId: string,
    phase: keyof ExecutionRatings,
    rating: number
  ): Promise<boolean> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Map phase to database column name
      const columnMap: Record<keyof ExecutionRatings, string> = {
        rigTuningExecutionRating: 'rig_tuning_execution_rating',
        prestartExecutionRating: 'prestart_execution_rating',
        startExecutionRating: 'start_execution_rating',
        upwindExecutionRating: 'upwind_execution_rating',
        windwardMarkExecutionRating: 'windward_mark_execution_rating',
        downwindExecutionRating: 'downwind_execution_rating',
        leewardMarkExecutionRating: 'leeward_mark_execution_rating',
        finishExecutionRating: 'finish_execution_rating',
      };

      const columnName = columnMap[phase];

      const { error } = await supabase
        .from('race_analysis')
        .upsert(
          {
            race_id: raceId,
            sailor_id: sailorId,
            [columnName]: rating,
          },
          {
            onConflict: 'race_id,sailor_id',
          }
        );

      if (error) {
        logger.error(`Error updating ${phase} execution rating:`, error);
        throw error;
      }

      logger.info(`Updated ${phase} execution rating successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to update ${phase} execution rating:`, error);
      return false;
    }
  }

  /**
   * Update execution notes for a specific phase
   */
  async updatePhaseExecutionNotes(
    raceId: string,
    sailorId: string,
    phase: keyof ExecutionNotes,
    notes: string
  ): Promise<boolean> {
    try {
      // Map phase to database column name
      const columnMap: Record<keyof ExecutionNotes, string> = {
        rigTuningExecutionNotes: 'rig_tuning_execution_notes',
        prestartExecutionNotes: 'prestart_execution_notes',
        startExecutionNotes: 'start_execution_notes',
        upwindExecutionNotes: 'upwind_execution_notes',
        windwardMarkExecutionNotes: 'windward_mark_execution_notes',
        downwindExecutionNotes: 'downwind_execution_notes',
        leewardMarkExecutionNotes: 'leeward_mark_execution_notes',
        finishExecutionNotes: 'finish_execution_notes',
      };

      const columnName = columnMap[phase];

      const { error } = await supabase
        .from('race_analysis')
        .upsert(
          {
            race_id: raceId,
            sailor_id: sailorId,
            [columnName]: notes,
          },
          {
            onConflict: 'race_id,sailor_id',
          }
        );

      if (error) {
        logger.error(`Error updating ${phase} execution notes:`, error);
        throw error;
      }

      logger.info(`Updated ${phase} execution notes successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to update ${phase} execution notes:`, error);
      return false;
    }
  }

  /**
   * Update complete execution evaluation at once
   */
  async updateCompleteExecution(
    raceId: string,
    sailorId: string,
    ratings: ExecutionRatings,
    notes: ExecutionNotes
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('race_analysis')
        .upsert(
          {
            race_id: raceId,
            sailor_id: sailorId,
            rig_tuning_execution_rating: ratings.rigTuningExecutionRating,
            prestart_execution_rating: ratings.prestartExecutionRating,
            start_execution_rating: ratings.startExecutionRating,
            upwind_execution_rating: ratings.upwindExecutionRating,
            windward_mark_execution_rating: ratings.windwardMarkExecutionRating,
            downwind_execution_rating: ratings.downwindExecutionRating,
            leeward_mark_execution_rating: ratings.leewardMarkExecutionRating,
            finish_execution_rating: ratings.finishExecutionRating,
            rig_tuning_execution_notes: notes.rigTuningExecutionNotes,
            prestart_execution_notes: notes.prestartExecutionNotes,
            start_execution_notes: notes.startExecutionNotes,
            upwind_execution_notes: notes.upwindExecutionNotes,
            windward_mark_execution_notes: notes.windwardMarkExecutionNotes,
            downwind_execution_notes: notes.downwindExecutionNotes,
            leeward_mark_execution_notes: notes.leewardMarkExecutionNotes,
            finish_execution_notes: notes.finishExecutionNotes,
          },
          {
            onConflict: 'race_id,sailor_id',
          }
        );

      if (error) {
        logger.error('Error updating complete execution:', error);
        throw error;
      }

      logger.info('Complete execution updated successfully');
      return true;
    } catch (error) {
      logger.error('Failed to update complete execution:', error);
      return false;
    }
  }

  /**
   * Link race analysis to preparation (for plan-vs-execution comparison)
   */
  async linkToPreparation(
    raceId: string,
    sailorId: string,
    preparationId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('race_analysis')
        .update({
          preparation_id: preparationId,
        })
        .eq('race_id', raceId)
        .eq('sailor_id', sailorId);

      if (error) {
        logger.error('Error linking to preparation:', error);
        throw error;
      }

      logger.info('Linked analysis to preparation successfully');
      return true;
    } catch (error) {
      logger.error('Failed to link to preparation:', error);
      return false;
    }
  }

  /**
   * Store AI-generated execution coaching
   */
  async storeAICoaching(
    raceId: string,
    sailorId: string,
    coaching: AIExecutionCoaching
  ): Promise<boolean> {
    try {
      const coachingWithTimestamp = {
        ...coaching,
        generatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('race_analysis')
        .update({
          ai_execution_coaching: coachingWithTimestamp,
        })
        .eq('race_id', raceId)
        .eq('sailor_id', sailorId);

      if (error) {
        logger.error('Error storing AI coaching:', error);
        throw error;
      }

      logger.info('AI coaching stored successfully');
      return true;
    } catch (error) {
      logger.error('Failed to store AI coaching:', error);
      return false;
    }
  }

  /**
   * Get AI-generated execution coaching
   */
  async getAICoaching(
    raceId: string,
    sailorId: string
  ): Promise<AIExecutionCoaching | null> {
    try {
      const { data, error } = await supabase
        .from('race_analysis')
        .select('ai_execution_coaching')
        .eq('race_id', raceId)
        .eq('sailor_id', sailorId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching AI coaching:', error);
        throw error;
      }

      return data?.ai_execution_coaching || null;
    } catch (error) {
      logger.error('Failed to get AI coaching:', error);
      return null;
    }
  }

  /**
   * Share execution analysis with coach
   */
  async shareWithCoach(
    raceId: string,
    sailorId: string,
    coachId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('race_analysis')
        .update({
          execution_shared_with_coach: true,
          execution_coach_id: coachId,
          execution_shared_at: new Date().toISOString(),
        })
        .eq('race_id', raceId)
        .eq('sailor_id', sailorId);

      if (error) {
        logger.error('Error sharing with coach:', error);
        throw error;
      }

      logger.info('Execution analysis shared with coach successfully');
      return true;
    } catch (error) {
      logger.error('Failed to share with coach:', error);
      return false;
    }
  }

  /**
   * Unshare execution analysis from coach
   */
  async unshareFromCoach(
    raceId: string,
    sailorId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('race_analysis')
        .update({
          execution_shared_with_coach: false,
          execution_coach_id: null,
          execution_shared_at: null,
        })
        .eq('race_id', raceId)
        .eq('sailor_id', sailorId);

      if (error) {
        logger.error('Error unsharing from coach:', error);
        throw error;
      }

      logger.info('Execution analysis unshared from coach successfully');
      return true;
    } catch (error) {
      logger.error('Failed to unshare from coach:', error);
      return false;
    }
  }

  /**
   * Get execution completion percentage
   */
  getExecutionCompletionPercentage(analysis: RaceAnalysisWithExecution): number {
    const ratings = [
      analysis.rig_tuning_execution_rating,
      analysis.prestart_execution_rating,
      analysis.start_execution_rating,
      analysis.upwind_execution_rating,
      analysis.windward_mark_execution_rating,
      analysis.downwind_execution_rating,
      analysis.leeward_mark_execution_rating,
      analysis.finish_execution_rating,
    ];

    const completedRatings = ratings.filter((r) => r !== null && r !== undefined).length;
    return Math.round((completedRatings / ratings.length) * 100);
  }

  /**
   * Get average execution rating
   */
  getAverageExecutionRating(analysis: RaceAnalysisWithExecution): number | null {
    const ratings = [
      analysis.rig_tuning_execution_rating,
      analysis.prestart_execution_rating,
      analysis.start_execution_rating,
      analysis.upwind_execution_rating,
      analysis.windward_mark_execution_rating,
      analysis.downwind_execution_rating,
      analysis.leeward_mark_execution_rating,
      analysis.finish_execution_rating,
    ].filter((r) => r !== null && r !== undefined) as number[];

    if (ratings.length === 0) return null;

    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Get incomplete execution phases
   */
  getIncompletePhases(analysis: RaceAnalysisWithExecution): string[] {
    const phaseChecks = [
      { name: 'Rig Tuning', rating: analysis.rig_tuning_execution_rating },
      { name: 'Pre-Start', rating: analysis.prestart_execution_rating },
      { name: 'Start', rating: analysis.start_execution_rating },
      { name: 'Upwind', rating: analysis.upwind_execution_rating },
      { name: 'Windward Mark', rating: analysis.windward_mark_execution_rating },
      { name: 'Downwind', rating: analysis.downwind_execution_rating },
      { name: 'Leeward Mark', rating: analysis.leeward_mark_execution_rating },
      { name: 'Finish', rating: analysis.finish_execution_rating },
    ];

    return phaseChecks
      .filter((phase) => phase.rating === null || phase.rating === undefined)
      .map((phase) => phase.name);
  }
}

export const executionEvaluationService = new ExecutionEvaluationService();
