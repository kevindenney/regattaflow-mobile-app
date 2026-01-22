/**
 * usePostRaceReviewData
 *
 * Hook for fetching and managing post-race review data including:
 * - Current race analysis data
 * - Past race trends for comparison
 * - AI analysis insights
 * - Saved review responses
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import type { PostRaceReviewType } from '@/components/checklist-tools/wizards/PostRaceReviewWizard/reviewConfigs';

/**
 * Single race analysis record
 */
export interface RaceAnalysisRecord {
  id: string;
  raceId: string;
  sailorId: string;
  raceDate?: string;
  raceName?: string;
  // Ratings (1-5)
  startExecutionRating?: number;
  upwindExecutionRating?: number;
  downwindExecutionRating?: number;
  windwardMarkExecutionRating?: number;
  leewardMarkExecutionRating?: number;
  finishExecutionRating?: number;
  // Notes
  startExecutionNotes?: string;
  upwindExecutionNotes?: string;
  downwindExecutionNotes?: string;
  windwardMarkExecutionNotes?: string;
  leewardMarkExecutionNotes?: string;
  finishExecutionNotes?: string;
  // Learning
  keyLearnings?: string[];
  frameworkScores?: Record<string, number>;
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Trend data point for visualization
 */
export interface TrendDataPoint {
  raceId: string;
  raceName?: string;
  raceDate: string;
  rating?: number;
  notes?: string;
}

/**
 * Review data for a specific type
 */
export interface ReviewTypeData {
  currentRating?: number;
  currentNotes?: string;
  currentResponses?: Record<string, string>;
  pastTrends: TrendDataPoint[];
  averageRating?: number;
  trend?: 'improving' | 'declining' | 'stable';
}

/**
 * AI insights for the review
 */
export interface AIInsights {
  summary?: string;
  strengths?: string[];
  areasForImprovement?: string[];
  recommendations?: string[];
}

/**
 * Hook return type
 */
export interface UsePostRaceReviewDataResult {
  isLoading: boolean;
  error: string | null;
  currentAnalysis: RaceAnalysisRecord | null;
  getReviewData: (reviewType: PostRaceReviewType) => ReviewTypeData;
  aiInsights: AIInsights | null;
  saveReviewData: (
    reviewType: PostRaceReviewType,
    rating?: number,
    notes?: string,
    responses?: Record<string, string>
  ) => Promise<boolean>;
  refetch: () => void;
}

/**
 * Map review type to database fields
 */
const REVIEW_TYPE_FIELDS: Record<PostRaceReviewType, { ratingField?: string; notesField?: string }> = {
  start: {
    ratingField: 'start_execution_rating',
    notesField: 'start_execution_notes',
  },
  upwind: {
    ratingField: 'upwind_execution_rating',
    notesField: 'upwind_execution_notes',
  },
  downwind: {
    ratingField: 'downwind_execution_rating',
    notesField: 'downwind_execution_notes',
  },
  marks: {
    ratingField: 'windward_mark_execution_rating',
    notesField: 'windward_mark_execution_notes',
  },
  decisions: {
    ratingField: 'prestart_execution_rating', // Using prestart for tactical decisions
    notesField: 'prestart_execution_notes',
  },
  key_learning: {
    notesField: 'key_learnings',
  },
  what_worked: {
    notesField: 'finish_execution_notes', // Repurposing for strengths
  },
  improvement: {
    notesField: 'leeward_mark_execution_notes', // Repurposing for improvement plan
  },
  coach_feedback: {
    notesField: 'rig_tuning_execution_notes', // Repurposing for coach feedback request
  },
};

/**
 * Transform database record to typed object
 */
function transformRaceAnalysis(record: Record<string, unknown>): RaceAnalysisRecord {
  return {
    id: record.id as string,
    raceId: record.race_id as string,
    sailorId: record.sailor_id as string,
    raceDate: record.race_date as string | undefined,
    raceName: record.race_name as string | undefined,
    startExecutionRating: record.start_execution_rating as number | undefined,
    upwindExecutionRating: record.upwind_execution_rating as number | undefined,
    downwindExecutionRating: record.downwind_execution_rating as number | undefined,
    windwardMarkExecutionRating: record.windward_mark_execution_rating as number | undefined,
    leewardMarkExecutionRating: record.leeward_mark_execution_rating as number | undefined,
    finishExecutionRating: record.finish_execution_rating as number | undefined,
    startExecutionNotes: record.start_execution_notes as string | undefined,
    upwindExecutionNotes: record.upwind_execution_notes as string | undefined,
    downwindExecutionNotes: record.downwind_execution_notes as string | undefined,
    windwardMarkExecutionNotes: record.windward_mark_execution_notes as string | undefined,
    leewardMarkExecutionNotes: record.leeward_mark_execution_notes as string | undefined,
    finishExecutionNotes: record.finish_execution_notes as string | undefined,
    keyLearnings: record.key_learnings as string[] | undefined,
    frameworkScores: record.framework_scores as Record<string, number> | undefined,
    createdAt: record.created_at as string | undefined,
    updatedAt: record.updated_at as string | undefined,
  };
}

/**
 * Calculate trend direction from data points
 */
function calculateTrend(dataPoints: TrendDataPoint[]): 'improving' | 'declining' | 'stable' | undefined {
  if (dataPoints.length < 2) return undefined;

  const ratingsWithValues = dataPoints.filter(d => d.rating !== undefined);
  if (ratingsWithValues.length < 2) return undefined;

  // Simple linear trend based on first vs last half averages
  const midpoint = Math.floor(ratingsWithValues.length / 2);
  const firstHalf = ratingsWithValues.slice(0, midpoint);
  const secondHalf = ratingsWithValues.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, d) => sum + (d.rating ?? 0), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + (d.rating ?? 0), 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;
  if (diff > 0.3) return 'improving';
  if (diff < -0.3) return 'declining';
  return 'stable';
}

/**
 * Hook for post-race review data
 */
export function usePostRaceReviewData(
  raceId: string,
  userId?: string
): UsePostRaceReviewDataResult {
  const { user } = useAuth();
  const effectiveUserId = userId ?? user?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<RaceAnalysisRecord | null>(null);
  const [pastAnalyses, setPastAnalyses] = useState<RaceAnalysisRecord[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);

  /**
   * Fetch all data
   */
  const fetchData = useCallback(async () => {
    if (!effectiveUserId || !raceId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch current race analysis
      const { data: currentData, error: currentError } = await supabase
        .from('race_analysis')
        .select(`
          *,
          races:race_id (
            name,
            date
          )
        `)
        .eq('sailor_id', effectiveUserId)
        .eq('race_id', raceId)
        .single();

      if (currentError && currentError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        console.warn('[usePostRaceReviewData] Error fetching current analysis:', currentError);
      }

      if (currentData) {
        const transformed = transformRaceAnalysis(currentData);
        if (currentData.races) {
          transformed.raceName = (currentData.races as { name?: string }).name;
          transformed.raceDate = (currentData.races as { date?: string }).date;
        }
        setCurrentAnalysis(transformed);
      } else {
        setCurrentAnalysis(null);
      }

      // Fetch past 5 race analyses for trend comparison
      const { data: pastData, error: pastError } = await supabase
        .from('race_analysis')
        .select(`
          *,
          races:race_id (
            name,
            date
          )
        `)
        .eq('sailor_id', effectiveUserId)
        .neq('race_id', raceId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (pastError) {
        console.warn('[usePostRaceReviewData] Error fetching past analyses:', pastError);
      } else if (pastData) {
        const transformed = pastData.map(record => {
          const analysis = transformRaceAnalysis(record);
          if (record.races) {
            analysis.raceName = (record.races as { name?: string }).name;
            analysis.raceDate = (record.races as { date?: string }).date;
          }
          return analysis;
        });
        setPastAnalyses(transformed);
      }

      // Fetch AI insights if available
      const { data: aiData, error: aiError } = await supabase
        .from('ai_coach_analysis')
        .select('summary, recommendations, phase_breakdowns')
        .eq('race_id', raceId)
        .eq('sailor_id', effectiveUserId)
        .single();

      if (aiError && aiError.code !== 'PGRST116') {
        console.warn('[usePostRaceReviewData] Error fetching AI insights:', aiError);
      }

      if (aiData) {
        const phaseBreakdowns = aiData.phase_breakdowns as Record<string, { strengths?: string[]; areas_for_improvement?: string[] }> | undefined;
        setAiInsights({
          summary: aiData.summary as string | undefined,
          recommendations: aiData.recommendations as string[] | undefined,
          strengths: phaseBreakdowns?.overall?.strengths,
          areasForImprovement: phaseBreakdowns?.overall?.areas_for_improvement,
        });
      }
    } catch (err) {
      console.error('[usePostRaceReviewData] Error:', err);
      setError('Failed to load review data');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, raceId]);

  // Fetch on mount and dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Get review data for a specific type
   */
  const getReviewData = useCallback(
    (reviewType: PostRaceReviewType): ReviewTypeData => {
      const fields = REVIEW_TYPE_FIELDS[reviewType];
      if (!fields) {
        return { pastTrends: [] };
      }

      // Get current rating and notes
      let currentRating: number | undefined;
      let currentNotes: string | undefined;

      if (currentAnalysis) {
        if (fields.ratingField) {
          const ratingKey = fields.ratingField.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof RaceAnalysisRecord;
          currentRating = currentAnalysis[ratingKey] as number | undefined;
        }
        if (fields.notesField) {
          const notesKey = fields.notesField.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof RaceAnalysisRecord;
          const notesValue = currentAnalysis[notesKey];
          if (Array.isArray(notesValue)) {
            currentNotes = notesValue.join('\n');
          } else {
            currentNotes = notesValue as string | undefined;
          }
        }
      }

      // Build past trends
      const pastTrends: TrendDataPoint[] = pastAnalyses.map(analysis => {
        let rating: number | undefined;
        let notes: string | undefined;

        if (fields.ratingField) {
          const ratingKey = fields.ratingField.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof RaceAnalysisRecord;
          rating = analysis[ratingKey] as number | undefined;
        }
        if (fields.notesField) {
          const notesKey = fields.notesField.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof RaceAnalysisRecord;
          const notesValue = analysis[notesKey];
          if (Array.isArray(notesValue)) {
            notes = notesValue.join('\n');
          } else {
            notes = notesValue as string | undefined;
          }
        }

        return {
          raceId: analysis.raceId,
          raceName: analysis.raceName,
          raceDate: analysis.raceDate || analysis.createdAt || '',
          rating,
          notes,
        };
      });

      // Calculate average and trend
      const ratingsWithValues = pastTrends.filter(t => t.rating !== undefined);
      const averageRating = ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, t) => sum + (t.rating ?? 0), 0) / ratingsWithValues.length
        : undefined;
      const trend = calculateTrend(pastTrends);

      return {
        currentRating,
        currentNotes,
        pastTrends,
        averageRating,
        trend,
      };
    },
    [currentAnalysis, pastAnalyses]
  );

  /**
   * Save review data
   */
  const saveReviewData = useCallback(
    async (
      reviewType: PostRaceReviewType,
      rating?: number,
      notes?: string,
      responses?: Record<string, string>
    ): Promise<boolean> => {
      if (!effectiveUserId || !raceId) {
        setError('Missing user or race ID');
        return false;
      }

      const fields = REVIEW_TYPE_FIELDS[reviewType];
      if (!fields) {
        setError('Unknown review type');
        return false;
      }

      try {
        // Build update payload
        const updates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (rating !== undefined && fields.ratingField) {
          updates[fields.ratingField] = rating;
        }

        if (notes !== undefined && fields.notesField) {
          // For key_learnings, store as array
          if (fields.notesField === 'key_learnings') {
            updates[fields.notesField] = notes.split('\n').filter(Boolean);
          } else {
            updates[fields.notesField] = notes;
          }
        }

        // Store responses in notes field as JSON if complex
        if (responses && Object.keys(responses).length > 0 && fields.notesField) {
          // Combine responses into formatted notes
          const formattedNotes = Object.entries(responses)
            .map(([key, value]) => `[${key}]: ${value}`)
            .join('\n\n');
          updates[fields.notesField] = formattedNotes;
        }

        // Upsert the record
        const { error: upsertError } = await supabase
          .from('race_analysis')
          .upsert(
            {
              sailor_id: effectiveUserId,
              race_id: raceId,
              ...updates,
            },
            {
              onConflict: 'sailor_id,race_id',
            }
          );

        if (upsertError) {
          console.error('[usePostRaceReviewData] Save error:', upsertError);
          setError('Failed to save review data');
          return false;
        }

        // Refetch to get updated data
        await fetchData();
        return true;
      } catch (err) {
        console.error('[usePostRaceReviewData] Save error:', err);
        setError('Failed to save review data');
        return false;
      }
    },
    [effectiveUserId, raceId, fetchData]
  );

  return {
    isLoading,
    error,
    currentAnalysis,
    getReviewData,
    aiInsights,
    saveReviewData,
    refetch: fetchData,
  };
}

export default usePostRaceReviewData;
