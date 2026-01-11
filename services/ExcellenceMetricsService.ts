/**
 * ExcellenceMetricsService
 *
 * Service for calculating, storing, and retrieving excellence metrics.
 * Tracks phase mastery, framework adoption, and outcome trends for sailors.
 */

import { supabase } from './supabase';
import { logger } from '@/lib/utils/logger';
import { RaceChecklistService } from './RaceChecklistService';
import type {
  ExcellenceMetrics,
  ExcellenceMetricsRow,
  PhaseMasteryScores,
  FrameworkScores,
  OutcomeMetrics,
  RaceResult,
  FocusRecommendation,
  RacePhase,
  mapRowToExcellenceMetrics,
} from '@/types/excellenceFramework';

// Default framework scores structure
const DEFAULT_FRAMEWORK_SCORES: FrameworkScores = {
  puffResponse: 0,
  delayedTack: 0,
  windShiftAwareness: 0,
  gettingInPhase: 0,
  tacticalPositioning: 0,
  boatHandling: 0,
};

// Default phase mastery scores
const DEFAULT_PHASE_MASTERY: PhaseMasteryScores = {
  prep: 0,
  launch: 0,
  start: 0,
  upwind: 0,
  downwind: 0,
  markRounding: 0,
  finish: 0,
  review: 0,
};

export class ExcellenceMetricsService {
  // ============================================
  // Get/Create Metrics
  // ============================================

  /**
   * Get excellence metrics for a sailor
   * Creates default metrics if none exist
   */
  static async getExcellenceMetrics(
    sailorId: string,
    seasonId?: string | null
  ): Promise<ExcellenceMetrics> {
    try {
      let query = supabase
        .from('excellence_metrics')
        .select('*')
        .eq('sailor_id', sailorId);

      if (seasonId) {
        query = query.eq('season_id', seasonId);
      } else {
        query = query.is('season_id', null);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No metrics found, create default
          return this.createDefaultMetrics(sailorId, seasonId || undefined);
        }
        throw error;
      }

      return this.mapRowToMetrics(data);
    } catch (error) {
      logger.error('Error in getExcellenceMetrics', { error, sailorId });
      throw error;
    }
  }

  /**
   * Create default metrics record for a sailor
   */
  static async createDefaultMetrics(
    sailorId: string,
    seasonId?: string
  ): Promise<ExcellenceMetrics> {
    try {
      const row: Partial<ExcellenceMetricsRow> = {
        sailor_id: sailorId,
        season_id: seasonId || null,
        prep_mastery: 0,
        launch_mastery: 0,
        start_mastery: 0,
        upwind_mastery: 0,
        downwind_mastery: 0,
        mark_rounding_mastery: 0,
        finish_mastery: 0,
        review_mastery: 0,
        framework_scores: DEFAULT_FRAMEWORK_SCORES,
        races_completed: 0,
        average_position: null,
        position_trend: null,
        best_finish: null,
        best_finish_race_id: null,
        recent_results: [],
        focus_recommendations: [],
        events_last_30_days: 0,
        improvement_trend: null,
        calculated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('excellence_metrics')
        .insert(row)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create default metrics', { error, sailorId });
        throw error;
      }

      return this.mapRowToMetrics(data);
    } catch (error) {
      logger.error('Error in createDefaultMetrics', { error });
      throw error;
    }
  }

  // ============================================
  // Phase Mastery Calculation
  // ============================================

  /**
   * Calculate phase mastery scores based on checklist completion and ratings
   */
  static async calculatePhaseMastery(
    sailorId: string,
    seasonId?: string
  ): Promise<PhaseMasteryScores> {
    try {
      // Get completion stats from checklist service
      const stats = await RaceChecklistService.getCompletionStats(sailorId, {
        seasonId,
        limit: 20, // Last 20 races
      });

      // Map checklist categories to mastery phases
      // Base score from completion rate (0-60) + rating bonus (0-40)
      const calculateScore = (completionRate: number, averageRating: number): number => {
        const completionScore = completionRate * 60;
        const ratingScore = averageRating > 0 ? (averageRating / 5) * 40 : 0;
        return Math.min(100, completionScore + ratingScore);
      };

      // For phases that map directly to checklist categories
      const prepScore = calculateScore(
        stats.phaseStats.prep?.completionRate || 0,
        stats.phaseStats.prep?.averageRating || 0
      );

      const launchScore = calculateScore(
        stats.phaseStats.launch?.completionRate || 0,
        stats.phaseStats.launch?.averageRating || 0
      );

      const raceScore = calculateScore(
        stats.phaseStats.race?.completionRate || 0,
        stats.phaseStats.race?.averageRating || 0
      );

      const reviewScore = calculateScore(
        stats.phaseStats.review?.completionRate || 0,
        stats.phaseStats.review?.averageRating || 0
      );

      // For detailed race sub-phases, we'll get more granular data
      // This requires category-level analysis
      const categoryStats = await this.getCategoryStats(sailorId, seasonId);

      return {
        prep: prepScore,
        launch: launchScore,
        start: calculateScore(
          categoryStats.start?.completionRate || raceScore / 100,
          categoryStats.start?.averageRating || 0
        ),
        upwind: calculateScore(
          categoryStats.upwind?.completionRate || raceScore / 100,
          categoryStats.upwind?.averageRating || 0
        ),
        downwind: calculateScore(
          categoryStats.downwind?.completionRate || raceScore / 100,
          categoryStats.downwind?.averageRating || 0
        ),
        markRounding: calculateScore(
          categoryStats.marks?.completionRate || raceScore / 100,
          categoryStats.marks?.averageRating || 0
        ),
        finish: calculateScore(
          categoryStats.finish?.completionRate || raceScore / 100,
          categoryStats.finish?.averageRating || 0
        ),
        review: reviewScore,
      };
    } catch (error) {
      logger.error('Error in calculatePhaseMastery', { error });
      return DEFAULT_PHASE_MASTERY;
    }
  }

  /**
   * Get category-level stats for detailed phase scoring
   * Incorporates both checklist items and structured debrief phase ratings
   */
  private static async getCategoryStats(
    sailorId: string,
    seasonId?: string
  ): Promise<
    Record<string, { completionRate: number; averageRating: number }>
  > {
    try {
      // Query checklist items grouped by category
      const { data, error } = await supabase
        .from('race_checklist_items')
        .select('category, status, outcome_rating')
        .eq('sailor_id', sailorId);

      if (error) throw error;

      const items = data || [];
      const categoryGroups: Record<string, typeof items> = {};

      // Group by category
      for (const item of items) {
        const category = item.category || 'other';
        if (!categoryGroups[category]) {
          categoryGroups[category] = [];
        }
        categoryGroups[category].push(item);
      }

      // Calculate stats per category
      const stats: Record<string, { completionRate: number; averageRating: number }> = {};

      for (const [category, categoryItems] of Object.entries(categoryGroups)) {
        const completed = categoryItems.filter((i) => i.status === 'completed');
        const rated = categoryItems.filter((i) => i.outcome_rating !== null);

        stats[category] = {
          completionRate:
            categoryItems.length > 0 ? completed.length / categoryItems.length : 0,
          averageRating:
            rated.length > 0
              ? rated.reduce((sum, i) => sum + (i.outcome_rating || 0), 0) / rated.length
              : 0,
        };
      }

      // =====================================================================
      // STRUCTURED DEBRIEF PHASE RATINGS
      // Incorporate phase_ratings from race_timer_sessions
      // =====================================================================
      const phaseRatingsStats = await this.getPhaseRatingsStats(sailorId);

      // Merge phase ratings into stats, prioritizing phase ratings for on-water phases
      // Phase ratings mapping: prestart->start, start->start, upwind->upwind,
      // windwardMark->marks, downwind->downwind, leewardMark->marks
      if (phaseRatingsStats.start && phaseRatingsStats.start.count > 0) {
        stats.start = this.mergeStats(stats.start, phaseRatingsStats.start);
      }
      if (phaseRatingsStats.upwind && phaseRatingsStats.upwind.count > 0) {
        stats.upwind = this.mergeStats(stats.upwind, phaseRatingsStats.upwind);
      }
      if (phaseRatingsStats.downwind && phaseRatingsStats.downwind.count > 0) {
        stats.downwind = this.mergeStats(stats.downwind, phaseRatingsStats.downwind);
      }
      if (phaseRatingsStats.marks && phaseRatingsStats.marks.count > 0) {
        stats.marks = this.mergeStats(stats.marks, phaseRatingsStats.marks);
      }

      return stats;
    } catch (error) {
      logger.error('Error in getCategoryStats', { error });
      return {};
    }
  }

  /**
   * Get phase ratings stats from race_timer_sessions
   */
  private static async getPhaseRatingsStats(
    sailorId: string
  ): Promise<
    Record<string, { averageRating: number; count: number }>
  > {
    try {
      const { data: sessions, error } = await supabase
        .from('race_timer_sessions')
        .select('phase_ratings')
        .eq('sailor_id', sailorId)
        .not('phase_ratings', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Initialize accumulators
      const phaseData: Record<string, { sum: number; count: number }> = {
        start: { sum: 0, count: 0 },
        upwind: { sum: 0, count: 0 },
        downwind: { sum: 0, count: 0 },
        marks: { sum: 0, count: 0 }, // windwardMark + leewardMark
      };

      // Process each session's phase ratings
      for (const session of sessions || []) {
        const ratings = session.phase_ratings as Record<string, { rating?: number; note?: string }> | null;
        if (!ratings) continue;

        // Start phase (prestart + start combined)
        if (ratings.prestart?.rating) {
          phaseData.start.sum += ratings.prestart.rating;
          phaseData.start.count += 1;
        }
        if (ratings.start?.rating) {
          phaseData.start.sum += ratings.start.rating;
          phaseData.start.count += 1;
        }

        // Upwind phase
        if (ratings.upwind?.rating) {
          phaseData.upwind.sum += ratings.upwind.rating;
          phaseData.upwind.count += 1;
        }

        // Downwind phase
        if (ratings.downwind?.rating) {
          phaseData.downwind.sum += ratings.downwind.rating;
          phaseData.downwind.count += 1;
        }

        // Mark roundings (windward + leeward)
        if (ratings.windwardMark?.rating) {
          phaseData.marks.sum += ratings.windwardMark.rating;
          phaseData.marks.count += 1;
        }
        if (ratings.leewardMark?.rating) {
          phaseData.marks.sum += ratings.leewardMark.rating;
          phaseData.marks.count += 1;
        }
      }

      // Calculate averages
      const result: Record<string, { averageRating: number; count: number }> = {};
      for (const [phase, data] of Object.entries(phaseData)) {
        if (data.count > 0) {
          result[phase] = {
            averageRating: data.sum / data.count,
            count: data.count,
          };
        }
      }

      return result;
    } catch (error) {
      logger.error('Error in getPhaseRatingsStats', { error });
      return {};
    }
  }

  /**
   * Merge checklist stats with phase ratings stats
   * Phase ratings are weighted more heavily as they're direct self-assessment
   */
  private static mergeStats(
    checklistStats: { completionRate: number; averageRating: number } | undefined,
    phaseRatingsStats: { averageRating: number; count: number }
  ): { completionRate: number; averageRating: number } {
    if (!checklistStats) {
      // If no checklist stats, use phase ratings only
      return {
        completionRate: phaseRatingsStats.count > 0 ? 1 : 0, // Having ratings counts as completion
        averageRating: phaseRatingsStats.averageRating,
      };
    }

    // Weighted average: phase ratings 60%, checklist 40%
    // (Phase ratings are more direct self-assessment)
    const weightedRating =
      checklistStats.averageRating > 0
        ? checklistStats.averageRating * 0.4 + phaseRatingsStats.averageRating * 0.6
        : phaseRatingsStats.averageRating;

    return {
      completionRate: Math.max(checklistStats.completionRate, phaseRatingsStats.count > 0 ? 0.8 : 0),
      averageRating: weightedRating,
    };
  }

  // ============================================
  // Framework Scores Calculation
  // ============================================

  /**
   * Calculate framework adoption scores
   * This is based on learnable events and checklist items that match framework categories
   */
  static async calculateFrameworkScores(
    sailorId: string,
    seasonId?: string
  ): Promise<FrameworkScores> {
    try {
      // Query learnable events that relate to framework techniques
      const { data: events, error } = await supabase
        .from('learnable_events')
        .select('*')
        .eq('sailor_id', sailorId)
        .eq('nudge_eligible', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const allEvents = events || [];

      // Map event types and categories to framework scores
      const frameworkMapping: Record<string, keyof FrameworkScores> = {
        weather_adaptation: 'puffResponse',
        equipment_issue: 'boatHandling',
        successful_strategy: 'tacticalPositioning',
        venue_learning: 'windShiftAwareness',
        timing_issue: 'gettingInPhase',
        crew_coordination: 'boatHandling',
      };

      // Calculate scores based on positive vs negative events
      const frameworkCounts: Record<string, { positive: number; total: number }> = {};

      for (const event of allEvents) {
        const framework = frameworkMapping[event.event_type];
        if (framework) {
          if (!frameworkCounts[framework]) {
            frameworkCounts[framework] = { positive: 0, total: 0 };
          }
          frameworkCounts[framework].total++;
          if (event.outcome === 'positive') {
            frameworkCounts[framework].positive++;
          }
        }
      }

      // Convert to scores (0-100)
      const scores: FrameworkScores = { ...DEFAULT_FRAMEWORK_SCORES };

      for (const [framework, counts] of Object.entries(frameworkCounts)) {
        if (counts.total >= 2) {
          // Require at least 2 events to score
          scores[framework as keyof FrameworkScores] = Math.round(
            (counts.positive / counts.total) * 100
          );
        }
      }

      return scores;
    } catch (error) {
      logger.error('Error in calculateFrameworkScores', { error });
      return DEFAULT_FRAMEWORK_SCORES;
    }
  }

  // ============================================
  // Outcome Metrics Calculation
  // ============================================

  /**
   * Calculate outcome metrics from race results
   */
  static async calculateOutcomeMetrics(
    sailorId: string,
    seasonId?: string
  ): Promise<OutcomeMetrics> {
    try {
      // Query race results for this sailor
      let query = supabase
        .from('race_results')
        .select(
          `
          id,
          position,
          fleet_size,
          race_event_id,
          created_at,
          race_events!inner (
            id,
            name,
            event_date,
            venues (name)
          )
        `
        )
        .eq('sailor_id', sailorId)
        .order('created_at', { ascending: false })
        .limit(20);

      // If season specified, filter by date range
      // (would need to join with seasons table for exact dates)

      const { data: results, error } = await query;

      if (error) {
        logger.warn('Failed to get race results for outcome metrics', { error });
        return {
          racesCompleted: 0,
          averagePosition: 0,
          positionTrend: 'stable',
          bestFinish: 0,
          recentResults: [],
        };
      }

      const allResults = results || [];

      if (allResults.length === 0) {
        return {
          racesCompleted: 0,
          averagePosition: 0,
          positionTrend: 'stable',
          bestFinish: 0,
          recentResults: [],
        };
      }

      // Calculate metrics
      const positions = allResults.map((r) => r.position);
      const averagePosition =
        positions.reduce((sum, p) => sum + p, 0) / positions.length;

      const bestFinish = Math.min(...positions);
      const bestFinishResult = allResults.find((r) => r.position === bestFinish);

      // Calculate trend (compare first half to second half)
      const halfLength = Math.floor(positions.length / 2);
      let positionTrend: 'improving' | 'stable' | 'declining' = 'stable';

      if (halfLength >= 2) {
        const recentAvg =
          positions.slice(0, halfLength).reduce((sum, p) => sum + p, 0) / halfLength;
        const olderAvg =
          positions.slice(halfLength).reduce((sum, p) => sum + p, 0) /
          (positions.length - halfLength);

        if (recentAvg < olderAvg - 1) {
          positionTrend = 'improving'; // Lower position = better
        } else if (recentAvg > olderAvg + 1) {
          positionTrend = 'declining';
        }
      }

      // Format recent results
      const recentResults: RaceResult[] = allResults.slice(0, 10).map((r) => ({
        raceId: r.race_event_id,
        position: r.position,
        fleetSize: r.fleet_size || undefined,
        date: r.race_events?.event_date || r.created_at,
        venueName: r.race_events?.venues?.name || undefined,
      }));

      return {
        racesCompleted: allResults.length,
        averagePosition: Math.round(averagePosition * 10) / 10,
        positionTrend,
        bestFinish,
        bestFinishRaceId: bestFinishResult?.race_event_id || undefined,
        recentResults,
      };
    } catch (error) {
      logger.error('Error in calculateOutcomeMetrics', { error });
      return {
        racesCompleted: 0,
        averagePosition: 0,
        positionTrend: 'stable',
        bestFinish: 0,
        recentResults: [],
      };
    }
  }

  // ============================================
  // Focus Recommendations
  // ============================================

  /**
   * Generate AI-powered focus recommendations based on metrics
   */
  static generateFocusRecommendations(
    phaseMastery: PhaseMasteryScores,
    frameworkScores: FrameworkScores,
    outcomes: OutcomeMetrics
  ): FocusRecommendation[] {
    const recommendations: FocusRecommendation[] = [];

    // Find lowest phase mastery scores
    const phaseEntries = Object.entries(phaseMastery) as [RacePhase | string, number][];
    phaseEntries.sort((a, b) => a[1] - b[1]);

    // Recommend focus on lowest phase (if below 60%)
    if (phaseEntries[0][1] < 60) {
      const lowestPhase = phaseEntries[0][0];
      recommendations.push({
        phase: lowestPhase,
        title: `Improve ${this.formatPhaseName(lowestPhase)}`,
        reason: `Your ${this.formatPhaseName(lowestPhase)} score is ${Math.round(phaseEntries[0][1])}%, which is your weakest area.`,
        suggestedDrills: this.getDrillsForPhase(lowestPhase),
        priority: phaseEntries[0][1] < 40 ? 'high' : 'medium',
      });
    }

    // Second lowest phase if significantly behind
    if (phaseEntries[1][1] < 50 && phaseEntries[1][1] < phaseEntries[0][1] + 15) {
      const secondLowest = phaseEntries[1][0];
      recommendations.push({
        phase: secondLowest,
        title: `Work on ${this.formatPhaseName(secondLowest)}`,
        reason: `At ${Math.round(phaseEntries[1][1])}%, this is another area for improvement.`,
        suggestedDrills: this.getDrillsForPhase(secondLowest),
        priority: 'medium',
      });
    }

    // Find lowest framework scores
    const frameworkEntries = Object.entries(frameworkScores);
    frameworkEntries.sort((a, b) => a[1] - b[1]);

    if (frameworkEntries[0][1] < 50 && frameworkEntries[0][1] > 0) {
      const lowestFramework = frameworkEntries[0][0];
      recommendations.push({
        phase: lowestFramework,
        title: `Practice ${this.formatFrameworkName(lowestFramework)}`,
        reason: `Your ${this.formatFrameworkName(lowestFramework)} technique is at ${frameworkEntries[0][1]}%.`,
        suggestedDrills: this.getDrillsForFramework(lowestFramework),
        priority: frameworkEntries[0][1] < 30 ? 'high' : 'low',
      });
    }

    // Position trend based recommendation
    if (outcomes.positionTrend === 'declining' && outcomes.racesCompleted >= 5) {
      recommendations.push({
        phase: 'race',
        title: 'Address declining trend',
        reason: `Your position trend is declining over recent races. Review what changed.`,
        priority: 'high',
      });
    }

    return recommendations.slice(0, 4); // Max 4 recommendations
  }

  /**
   * Format phase name for display
   */
  private static formatPhaseName(phase: string): string {
    const names: Record<string, string> = {
      prep: 'Preparation',
      launch: 'Launch',
      start: 'Starting',
      upwind: 'Upwind',
      downwind: 'Downwind',
      markRounding: 'Mark Rounding',
      finish: 'Finishing',
      review: 'Review',
    };
    return names[phase] || phase;
  }

  /**
   * Format framework name for display
   */
  private static formatFrameworkName(framework: string): string {
    const names: Record<string, string> = {
      puffResponse: 'Puff Response',
      delayedTack: 'Delayed Tacking',
      windShiftAwareness: 'Wind Shift Awareness',
      gettingInPhase: 'Getting In Phase',
      tacticalPositioning: 'Tactical Positioning',
      boatHandling: 'Boat Handling',
    };
    return names[framework] || framework;
  }

  /**
   * Get suggested drills for a phase
   */
  private static getDrillsForPhase(phase: string): string[] {
    const drills: Record<string, string[]> = {
      prep: ['Weather briefing practice', 'Course study routine', 'Equipment checklist review'],
      launch: ['Quick rigging drill', 'Safety check routine', 'Pre-race warm-up sequence'],
      start: ['Line sight practice', 'Timed runs', 'Port/starboard approach drill'],
      upwind: ['VMG optimization', 'Tacking efficiency', 'Pointing exercises'],
      downwind: ['Gybe practice', 'Wave riding', 'Pressure tracking'],
      markRounding: ['Buoy work drill', 'Approach angle practice', 'Exit speed optimization'],
      finish: ['Line approach timing', 'Final leg strategy review'],
      review: ['Race debrief template', 'Key moment journaling'],
    };
    return drills[phase] || [];
  }

  /**
   * Get suggested drills for a framework technique
   */
  private static getDrillsForFramework(framework: string): string[] {
    const drills: Record<string, string[]> = {
      puffResponse: ['Puff recognition drill', 'Acceleration practice', 'Pressure lane awareness'],
      delayedTack: ['Hold the tack exercise', 'Header/lift recognition', 'Tack timing practice'],
      windShiftAwareness: ['Compass work', 'Cloud watching', 'Shore reference practice'],
      gettingInPhase: ['Oscillation tracking', 'Shift prediction', 'Phase timing drill'],
      tacticalPositioning: ['Fleet awareness drill', 'Cover practice', 'Loose cover exercise'],
      boatHandling: ['Roll tacks', 'Roll gybes', 'Acceleration drills'],
    };
    return drills[framework] || [];
  }

  // ============================================
  // Full Metrics Refresh
  // ============================================

  /**
   * Refresh all excellence metrics for a sailor
   */
  static async refreshMetrics(
    sailorId: string,
    seasonId?: string
  ): Promise<ExcellenceMetrics> {
    try {
      // Calculate all metrics
      const [phaseMastery, frameworkScores, outcomes] = await Promise.all([
        this.calculatePhaseMastery(sailorId, seasonId),
        this.calculateFrameworkScores(sailorId, seasonId),
        this.calculateOutcomeMetrics(sailorId, seasonId),
      ]);

      // Generate recommendations
      const focusRecommendations = this.generateFocusRecommendations(
        phaseMastery,
        frameworkScores,
        outcomes
      );

      // Count learnable events in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: eventsCount } = await supabase
        .from('learnable_events')
        .select('*', { count: 'exact', head: true })
        .eq('sailor_id', sailorId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Determine improvement trend
      let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (outcomes.positionTrend === 'improving') {
        improvementTrend = 'improving';
      } else if (outcomes.positionTrend === 'declining') {
        improvementTrend = 'declining';
      }

      // Upsert metrics
      const row: Partial<ExcellenceMetricsRow> = {
        sailor_id: sailorId,
        season_id: seasonId || null,
        prep_mastery: phaseMastery.prep,
        launch_mastery: phaseMastery.launch,
        start_mastery: phaseMastery.start,
        upwind_mastery: phaseMastery.upwind,
        downwind_mastery: phaseMastery.downwind,
        mark_rounding_mastery: phaseMastery.markRounding,
        finish_mastery: phaseMastery.finish,
        review_mastery: phaseMastery.review,
        framework_scores: frameworkScores,
        races_completed: outcomes.racesCompleted,
        average_position: outcomes.averagePosition || null,
        position_trend: outcomes.positionTrend,
        best_finish: outcomes.bestFinish || null,
        best_finish_race_id: outcomes.bestFinishRaceId || null,
        recent_results: outcomes.recentResults,
        focus_recommendations: focusRecommendations,
        events_last_30_days: eventsCount || 0,
        improvement_trend: improvementTrend,
        calculated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('excellence_metrics')
        .upsert(row, { onConflict: 'sailor_id,season_id' })
        .select()
        .single();

      if (error) {
        logger.error('Failed to refresh metrics', { error, sailorId });
        throw error;
      }

      return this.mapRowToMetrics(data);
    } catch (error) {
      logger.error('Error in refreshMetrics', { error });
      throw error;
    }
  }

  // ============================================
  // Comparison & Insights
  // ============================================

  /**
   * Compare metrics between two time periods
   */
  static async compareMetrics(
    sailorId: string,
    currentSeasonId: string,
    previousSeasonId: string
  ): Promise<{
    phaseMasteryChange: Partial<PhaseMasteryScores>;
    frameworkChange: Partial<FrameworkScores>;
    outcomesChange: {
      racesChange: number;
      positionChange: number;
    };
  }> {
    try {
      const [current, previous] = await Promise.all([
        this.getExcellenceMetrics(sailorId, currentSeasonId),
        this.getExcellenceMetrics(sailorId, previousSeasonId),
      ]);

      const phaseMasteryChange: Partial<PhaseMasteryScores> = {};
      for (const phase of Object.keys(current.phaseMastery) as (keyof PhaseMasteryScores)[]) {
        phaseMasteryChange[phase] =
          current.phaseMastery[phase] - previous.phaseMastery[phase];
      }

      const frameworkChange: Partial<FrameworkScores> = {};
      for (const fw of Object.keys(current.frameworkScores) as (keyof FrameworkScores)[]) {
        frameworkChange[fw] = current.frameworkScores[fw] - previous.frameworkScores[fw];
      }

      return {
        phaseMasteryChange,
        frameworkChange,
        outcomesChange: {
          racesChange: current.outcomes.racesCompleted - previous.outcomes.racesCompleted,
          positionChange: previous.outcomes.averagePosition - current.outcomes.averagePosition, // Lower is better
        },
      };
    } catch (error) {
      logger.error('Error in compareMetrics', { error });
      throw error;
    }
  }

  /**
   * Get leaderboard position for a sailor (optional gamification)
   */
  static async getLeaderboardPosition(
    sailorId: string,
    seasonId?: string
  ): Promise<{
    position: number;
    totalSailors: number;
    percentile: number;
  } | null> {
    try {
      // This would require a more complex query with window functions
      // For now, return null to indicate feature not implemented
      return null;
    } catch (error) {
      logger.error('Error in getLeaderboardPosition', { error });
      return null;
    }
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Map database row to ExcellenceMetrics type
   */
  private static mapRowToMetrics(row: ExcellenceMetricsRow): ExcellenceMetrics {
    return {
      id: row.id,
      sailorId: row.sailor_id,
      seasonId: row.season_id || undefined,
      phaseMastery: {
        prep: row.prep_mastery,
        launch: row.launch_mastery,
        start: row.start_mastery,
        upwind: row.upwind_mastery,
        downwind: row.downwind_mastery,
        markRounding: row.mark_rounding_mastery,
        finish: row.finish_mastery,
        review: row.review_mastery,
      },
      frameworkScores: row.framework_scores || DEFAULT_FRAMEWORK_SCORES,
      outcomes: {
        racesCompleted: row.races_completed,
        averagePosition: row.average_position || 0,
        positionTrend: row.position_trend || 'stable',
        bestFinish: row.best_finish || 0,
        bestFinishRaceId: row.best_finish_race_id || undefined,
        recentResults: row.recent_results || [],
      },
      focusRecommendations: row.focus_recommendations || [],
      eventsLast30Days: row.events_last_30_days,
      improvementTrend: row.improvement_trend || 'stable',
      calculatedAt: row.calculated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default ExcellenceMetricsService;
