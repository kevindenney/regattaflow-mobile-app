/**
 * useCoachingInsights
 *
 * Detects patterns in recent race analyses where a sailor has consistently
 * low ratings in a specific phase, and surfaces coaching insight cards
 * with one of three variants based on their coaching relationship.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import type { PerformanceInsight } from '@/hooks/useReflectProfile';
import {
  PHASE_MAPPINGS,
  WEAKNESS_THRESHOLD,
  MIN_WEAK_RACES,
  RECENT_RACE_WINDOW,
  type PhaseMapping,
} from '@/constants/coachingInsightMappings';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CoachingVariant =
  | 'no_coach'
  | 'has_coach_wrong_specialty'
  | 'has_coach_right_specialty';

export interface CoachingInsightData {
  insightId: string;
  phase: string;
  skillChipKey: string;
  weakRaceCount: number;
  totalRecentRaces: number;
  variant: CoachingVariant;
  coachId?: string;
  coachUserId?: string;
  coachName?: string;
}

interface ActiveCoach {
  id: string;
  coach_id: string;
  coach_profiles: {
    id: string;
    user_id: string;
    display_name: string | null;
    specializations: string[] | null;
  } | null;
}

interface DetectedWeakness {
  mapping: PhaseMapping;
  weakCount: number;
  totalRaces: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCoachingInsights(sailorId: string | undefined) {
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [coachingData, setCoachingData] = useState<CoachingInsightData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sailorId) {
      setInsights([]);
      setCoachingData([]);
      return;
    }

    let cancelled = false;

    async function detect() {
      setLoading(true);
      try {
        // 1. Fetch the sailor's most recent race analyses
        const ratingColumns = PHASE_MAPPINGS.map((m) => m.ratingColumn);
        const selectColumns = ['id', 'created_at', ...ratingColumns].join(', ');

        const { data: analyses, error: analysisError } = await supabase
          .from('race_analysis')
          .select(selectColumns)
          .eq('sailor_id', sailorId)
          .order('created_at', { ascending: false })
          .limit(RECENT_RACE_WINDOW);

        if (analysisError || !analyses || analyses.length === 0) {
          if (!cancelled) {
            setInsights([]);
            setCoachingData([]);
          }
          return;
        }

        // 2. For each phase, count how many ratings are at or below the threshold
        const weaknesses: DetectedWeakness[] = [];

        for (const mapping of PHASE_MAPPINGS) {
          let weakCount = 0;
          for (const analysis of analyses) {
            const rating = (analysis as Record<string, any>)[mapping.ratingColumn];
            if (typeof rating === 'number' && rating <= WEAKNESS_THRESHOLD) {
              weakCount++;
            }
          }
          if (weakCount >= MIN_WEAK_RACES) {
            weaknesses.push({
              mapping,
              weakCount,
              totalRaces: analyses.length,
            });
          }
        }

        if (weaknesses.length === 0) {
          if (!cancelled) {
            setInsights([]);
            setCoachingData([]);
          }
          return;
        }

        // 3. Query active coaching relationships with coach specializations
        const { data: relationships, error: relError } = await supabase
          .from('coaching_clients')
          .select(`
            id,
            coach_id,
            coach_profiles (
              id,
              user_id,
              display_name,
              specializations
            )
          `)
          .eq('sailor_id', sailorId)
          .eq('status', 'active');

        if (relError) {
          console.warn('[useCoachingInsights] Error fetching coaching relationships:', relError.message);
        }

        const activeCoaches: ActiveCoach[] = (relationships as ActiveCoach[] | null) ?? [];

        // 4. Build insights per weakness
        const newInsights: PerformanceInsight[] = [];
        const newCoachingData: CoachingInsightData[] = [];

        for (const weakness of weaknesses) {
          const { mapping, weakCount, totalRaces } = weakness;
          const insightId = `coaching-insight-${mapping.ratingColumn}`;

          // Determine variant
          const { variant, matchedCoach } = determineVariant(
            activeCoaches,
            mapping.specializations
          );

          const coachName = matchedCoach?.coach_profiles?.display_name || 'your coach';

          const insight = buildInsight(
            insightId,
            mapping,
            weakCount,
            totalRaces,
            variant,
            coachName
          );

          const data: CoachingInsightData = {
            insightId,
            phase: mapping.label,
            skillChipKey: mapping.skillChipKey,
            weakRaceCount: weakCount,
            totalRecentRaces: totalRaces,
            variant,
            coachId: matchedCoach?.coach_profiles?.id,
            coachUserId: matchedCoach?.coach_profiles?.user_id,
            coachName:
              matchedCoach?.coach_profiles?.display_name ?? undefined,
          };

          newInsights.push(insight);
          newCoachingData.push(data);
        }

        if (!cancelled) {
          setInsights(newInsights);
          setCoachingData(newCoachingData);
        }
      } catch (err) {
        console.error('[useCoachingInsights] Error detecting patterns:', err);
        if (!cancelled) {
          setInsights([]);
          setCoachingData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    detect();

    return () => {
      cancelled = true;
    };
  }, [sailorId]);

  return { insights, coachingData, loading };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function determineVariant(
  activeCoaches: ActiveCoach[],
  phaseSpecializations: string[]
): { variant: CoachingVariant; matchedCoach: ActiveCoach | undefined } {
  if (activeCoaches.length === 0) {
    return { variant: 'no_coach', matchedCoach: undefined };
  }

  // Check if any active coach covers this phase
  const lowerPhaseSpecs = phaseSpecializations.map((s) => s.toLowerCase());

  for (const coach of activeCoaches) {
    const coachSpecs = (coach.coach_profiles?.specializations ?? []).map((s) =>
      s.toLowerCase()
    );
    const hasMatch = lowerPhaseSpecs.some((ps) =>
      coachSpecs.some((cs) => cs.includes(ps) || ps.includes(cs))
    );
    if (hasMatch) {
      return { variant: 'has_coach_right_specialty', matchedCoach: coach };
    }
  }

  // Has coach(es) but none cover this specialty
  return { variant: 'has_coach_wrong_specialty', matchedCoach: activeCoaches[0] };
}

function buildInsight(
  insightId: string,
  mapping: PhaseMapping,
  weakCount: number,
  totalRaces: number,
  variant: CoachingVariant,
  coachName: string
): PerformanceInsight {
  const phaseLabel = mapping.label;
  const skill = mapping.skillChipKey;

  switch (variant) {
    case 'no_coach':
      return {
        id: insightId,
        type: 'recommendation',
        title: `${capitalize(phaseLabel)} Needs Work`,
        description: `You've scored low on the ${phaseLabel} phase in ${weakCount} of your last ${totalRaces} races. Find a coach who specializes in ${phaseLabel} tactics.`,
        sentiment: 'needs_attention',
        actionLabel: `Find a ${phaseLabel} coach`,
        actionRoute: `/coach/discover?skill=${skill}`,
        icon: mapping.icon,
        color: mapping.color,
        generatedAt: new Date().toISOString(),
      };

    case 'has_coach_wrong_specialty':
      return {
        id: insightId,
        type: 'recommendation',
        title: `${capitalize(phaseLabel)} Pattern Detected`,
        description: `You've scored low on ${phaseLabel} in ${weakCount} of your last ${totalRaces} races. ${coachName} may not cover this — consider a specialist?`,
        sentiment: 'needs_attention',
        actionLabel: 'Find a specialist',
        actionRoute: `/coach/discover?skill=${skill}`,
        icon: mapping.icon,
        color: mapping.color,
        generatedAt: new Date().toISOString(),
      };

    case 'has_coach_right_specialty':
      return {
        id: insightId,
        type: 'recommendation',
        title: `Share ${capitalize(phaseLabel)} Trend`,
        description: `You've scored low on ${phaseLabel} in ${weakCount} of your last ${totalRaces} races. Share this trend with ${coachName}?`,
        sentiment: 'needs_attention',
        actionLabel: `Share with ${coachName}`,
        actionRoute: undefined,
        icon: mapping.icon,
        color: mapping.color,
        generatedAt: new Date().toISOString(),
      };
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
