/**
 * FocusIntentService
 *
 * Service for managing sailor focus intents - the deliberate practice loop
 * where sailors commit to one specific focus for their next race.
 */

import { supabase } from './supabase';
import { logger } from '@/lib/utils/logger';
import { ExcellenceMetricsService } from './ExcellenceMetricsService';
import type {
  FocusIntent,
  FocusIntentRow,
  CreateFocusIntentInput,
  EvaluateFocusIntentInput,
  FocusSuggestion,
} from '@/types/focusIntent';
import { mapRowToFocusIntent } from '@/types/focusIntent';

export class FocusIntentService {
  // ============================================
  // Read Operations
  // ============================================

  /**
   * Get the active (unevaluated) focus intent for a sailor.
   * Returns the most recent intent with status 'active'.
   */
  static async getActiveIntent(sailorId: string): Promise<FocusIntent | null> {
    try {
      const { data, error } = await supabase
        .from('sailor_focus_intents')
        .select('*')
        .eq('sailor_id', sailorId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching active focus intent', { error, sailorId });
        throw error;
      }

      return data ? mapRowToFocusIntent(data as FocusIntentRow) : null;
    } catch (error) {
      logger.error('Exception in getActiveIntent', { error, sailorId });
      throw error;
    }
  }

  /**
   * Get the focus intent set for a specific race (as source).
   * Returns the intent that was set after reviewing the given race.
   */
  static async getIntentFromRace(sailorId: string, sourceRaceId: string): Promise<FocusIntent | null> {
    try {
      const { data, error } = await supabase
        .from('sailor_focus_intents')
        .select('*')
        .eq('sailor_id', sailorId)
        .eq('source_race_id', sourceRaceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching focus intent from race', { error, sailorId, sourceRaceId });
        throw error;
      }

      return data ? mapRowToFocusIntent(data as FocusIntentRow) : null;
    } catch (error) {
      logger.error('Exception in getIntentFromRace', { error, sailorId, sourceRaceId });
      throw error;
    }
  }

  /**
   * Get the focus intent that applies to a specific race (as target).
   * Also checks for intents with null target_race_id (applies to "next" race).
   */
  static async getIntentForRace(sailorId: string, targetRaceId: string): Promise<FocusIntent | null> {
    try {
      // First check for explicitly targeted intents
      const { data: targeted, error: targetedError } = await supabase
        .from('sailor_focus_intents')
        .select('*')
        .eq('sailor_id', sailorId)
        .eq('target_race_id', targetRaceId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (targetedError) {
        logger.error('Error fetching targeted focus intent', { error: targetedError, sailorId, targetRaceId });
        throw targetedError;
      }

      if (targeted) {
        return mapRowToFocusIntent(targeted as FocusIntentRow);
      }

      // Fall back to the most recent active intent with null target
      const { data: general, error: generalError } = await supabase
        .from('sailor_focus_intents')
        .select('*')
        .eq('sailor_id', sailorId)
        .is('target_race_id', null)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (generalError) {
        logger.error('Error fetching general focus intent', { error: generalError, sailorId });
        throw generalError;
      }

      return general ? mapRowToFocusIntent(general as FocusIntentRow) : null;
    } catch (error) {
      logger.error('Exception in getIntentForRace', { error, sailorId, targetRaceId });
      throw error;
    }
  }

  /**
   * Get recent evaluated intents for progress tracking.
   */
  static async getRecentEvaluations(sailorId: string, limit = 10): Promise<FocusIntent[]> {
    try {
      const { data, error } = await supabase
        .from('sailor_focus_intents')
        .select('*')
        .eq('sailor_id', sailorId)
        .eq('status', 'evaluated')
        .order('evaluated_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching recent evaluations', { error, sailorId });
        throw error;
      }

      return (data || []).map((row) => mapRowToFocusIntent(row as FocusIntentRow));
    } catch (error) {
      logger.error('Exception in getRecentEvaluations', { error, sailorId });
      throw error;
    }
  }

  // ============================================
  // Write Operations
  // ============================================

  /**
   * Create a new focus intent.
   * Marks any existing active intent as 'skipped' first.
   */
  static async createIntent(sailorId: string, input: CreateFocusIntentInput): Promise<FocusIntent> {
    try {
      // Mark existing active intents as skipped
      await supabase
        .from('sailor_focus_intents')
        .update({ status: 'skipped', updated_at: new Date().toISOString() })
        .eq('sailor_id', sailorId)
        .eq('status', 'active');

      // Calculate streak: if the previous intent was evaluated, increment streak
      let streakCount = 1;
      const { data: lastEvaluated } = await supabase
        .from('sailor_focus_intents')
        .select('streak_count')
        .eq('sailor_id', sailorId)
        .eq('status', 'evaluated')
        .order('evaluated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastEvaluated) {
        streakCount = (lastEvaluated.streak_count || 0) + 1;
      }

      const row = {
        sailor_id: sailorId,
        source_race_id: input.sourceRaceId,
        target_race_id: input.targetRaceId || null,
        focus_text: input.focusText,
        phase: input.phase || null,
        source: input.source,
        status: 'active',
        streak_count: streakCount,
      };

      const { data, error } = await supabase
        .from('sailor_focus_intents')
        .insert(row)
        .select()
        .single();

      if (error) {
        logger.error('Error creating focus intent', { error, sailorId, input });
        throw error;
      }

      return mapRowToFocusIntent(data as FocusIntentRow);
    } catch (error) {
      logger.error('Exception in createIntent', { error, sailorId, input });
      throw error;
    }
  }

  /**
   * Evaluate a focus intent (rate how the focus went).
   */
  static async evaluateIntent(input: EvaluateFocusIntentInput): Promise<FocusIntent> {
    try {
      const { data, error } = await supabase
        .from('sailor_focus_intents')
        .update({
          evaluation_rating: input.rating,
          evaluation_notes: input.notes || null,
          evaluated_at: new Date().toISOString(),
          status: 'evaluated',
        })
        .eq('id', input.intentId)
        .select()
        .single();

      if (error) {
        logger.error('Error evaluating focus intent', { error, input });
        throw error;
      }

      return mapRowToFocusIntent(data as FocusIntentRow);
    } catch (error) {
      logger.error('Exception in evaluateIntent', { error, input });
      throw error;
    }
  }

  // ============================================
  // Suggestion Generation
  // ============================================

  /**
   * Generate 2-3 AI-suggested focus areas based on the sailor's weakest phases
   * and excellence metrics. Uses ExcellenceMetricsService focus recommendations.
   */
  static async generateSuggestions(sailorId: string, _raceId: string): Promise<FocusSuggestion[]> {
    try {
      const metrics = await ExcellenceMetricsService.getExcellenceMetrics(sailorId);

      const suggestions: FocusSuggestion[] = [];

      // Use existing focus recommendations from excellence metrics
      const focusRecs = metrics.focusRecommendations || [];

      // Convert FocusRecommendation to FocusSuggestion with actionable text
      for (const rec of focusRecs.slice(0, 3)) {
        const actionText = this.generateActionableFocusText(rec.phase, rec.title);
        suggestions.push({
          text: actionText,
          phase: typeof rec.phase === 'string' ? rec.phase : rec.phase,
          reason: rec.reason,
          priority: rec.priority,
        });
      }

      // If no recommendations exist, provide generic high-value suggestions
      if (suggestions.length === 0) {
        suggestions.push(
          {
            text: 'Nail the first 30 seconds off the start line',
            phase: 'start',
            reason: 'Starting well consistently leads to better race results.',
            priority: 'high',
          },
          {
            text: 'Hold the boat flat through every tack',
            phase: 'upwind',
            reason: 'Boat handling through tacks is a key differentiator.',
            priority: 'medium',
          },
        );
      }

      return suggestions.slice(0, 3);
    } catch (error) {
      logger.error('Error generating focus suggestions', { error, sailorId });
      // Return safe defaults on error
      return [
        {
          text: 'Focus on clean boat handling through maneuvers',
          phase: 'race',
          reason: 'Good boat handling is the foundation of fast racing.',
          priority: 'medium',
        },
        {
          text: 'Commit to the first beat strategy without second-guessing',
          phase: 'upwind',
          reason: 'Decisive sailing leads to fewer costly mistakes.',
          priority: 'medium',
        },
      ];
    }
  }

  // ============================================
  // Progress Summary
  // ============================================

  /**
   * Get a summary of focus intent progress for display.
   */
  static async getProgressSummary(sailorId: string): Promise<{
    totalEvaluated: number;
    averageRating: number;
    trend: 'improving' | 'stable' | 'declining';
    currentStreak: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('sailor_focus_intents')
        .select('evaluation_rating, streak_count')
        .eq('sailor_id', sailorId)
        .eq('status', 'evaluated')
        .order('evaluated_at', { ascending: false })
        .limit(20);

      if (error) {
        logger.error('Error fetching focus progress', { error, sailorId });
        throw error;
      }

      const evaluations = data || [];
      const totalEvaluated = evaluations.length;

      if (totalEvaluated === 0) {
        return { totalEvaluated: 0, averageRating: 0, trend: 'stable', currentStreak: 0 };
      }

      const ratings = evaluations.map((e) => e.evaluation_rating).filter(Boolean) as number[];
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

      // Calculate trend from recent vs older ratings
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (ratings.length >= 4) {
        const recentAvg = ratings.slice(0, Math.ceil(ratings.length / 2)).reduce((s, r) => s + r, 0) / Math.ceil(ratings.length / 2);
        const olderAvg = ratings.slice(Math.ceil(ratings.length / 2)).reduce((s, r) => s + r, 0) / Math.floor(ratings.length / 2);
        if (recentAvg > olderAvg + 0.3) trend = 'improving';
        else if (recentAvg < olderAvg - 0.3) trend = 'declining';
      }

      const currentStreak = evaluations[0]?.streak_count || 0;

      return { totalEvaluated, averageRating, trend, currentStreak };
    } catch (error) {
      logger.error('Exception in getProgressSummary', { error, sailorId });
      return { totalEvaluated: 0, averageRating: 0, trend: 'stable', currentStreak: 0 };
    }
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Convert a generic recommendation into actionable focus text
   */
  private static generateActionableFocusText(phase: string, title: string): string {
    const phaseActions: Record<string, string[]> = {
      prep: [
        'Study the forecast and write down wind shifts before launch',
        'Complete the full pre-race checklist without rushing',
      ],
      launch: [
        'Arrive at the start area 15 minutes early and sail the beats',
        'Do 3 practice tacks before the start sequence',
      ],
      start: [
        'Nail the first 30 seconds off the start line',
        'Hold your position on the line without being forced out',
      ],
      upwind: [
        'Hold the boat flat through every tack',
        'Commit to hiking harder upwind in every puff',
      ],
      downwind: [
        'Keep weight forward and sail by the lee when possible',
        'Look back at every wave and ride it down',
      ],
      markRounding: [
        'Plan the mark rounding 5 boat lengths early',
        'Execute smooth, wide-in tight-out mark roundings',
      ],
      finish: [
        'Sail to the favored end of the finish line',
        'Stay focused until 10 seconds after crossing',
      ],
      review: [
        'Write down 3 specific observations within 10 minutes of finishing',
        'Rate each leg of the race honestly',
      ],
    };

    const actions = phaseActions[phase];
    if (actions && actions.length > 0) {
      return actions[Math.floor(Math.random() * actions.length)];
    }

    // Fallback: use the title directly
    return title;
  }
}
