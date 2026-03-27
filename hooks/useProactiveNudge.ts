/**
 * useProactiveNudge — selects the single most relevant AI insight to show
 * proactively on a timeline card, based on current phase and recency.
 */

import { useMemo, useCallback, useState } from 'react';
import { useAIInsights } from '@/hooks/useAIInsights';
import type { AIInterestInsight, InsightType } from '@/types/manifesto';
import type { RacePhase } from '@/components/cards/types';

/** Which insight types are most relevant per step phase */
const PHASE_PRIORITIES: Record<string, InsightType[]> = {
  days_before: ['recommendation', 'pattern', 'weakness'],
  on_water: ['preference', 'recovery_pattern', 'progressive_overload'],
  after_race: ['strength', 'pattern', 'personal_record'],
};

function scoreInsight(insight: AIInterestInsight, phase?: RacePhase): number {
  let score = insight.confidence;

  // Recency bonus: insights from last 7 days score higher
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (new Date(insight.created_at).getTime() > weekAgo) {
    score += 0.3;
  }

  // Phase relevance bonus
  const priorities = phase ? PHASE_PRIORITIES[phase] : undefined;
  if (priorities) {
    const idx = priorities.indexOf(insight.insight_type);
    if (idx !== -1) {
      score += 0.5 - idx * 0.15; // first match +0.5, second +0.35, third +0.2
    }
  }

  return score;
}

export function useProactiveNudge(
  interestId: string | undefined,
  phase?: RacePhase,
) {
  const { insights, dismiss: dismissInsight } = useAIInsights(interestId);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const nudge = useMemo(() => {
    if (!insights.length) return null;

    const candidates = insights.filter(
      (i) => !dismissedIds.has(i.id) && i.confidence >= 0.3,
    );
    if (!candidates.length) return null;

    // Sort by score descending, pick best
    candidates.sort((a, b) => scoreInsight(b, phase) - scoreInsight(a, phase));
    return candidates[0];
  }, [insights, dismissedIds, phase]);

  const dismiss = useCallback(() => {
    if (!nudge) return;
    setDismissedIds((prev) => new Set(prev).add(nudge.id));
    dismissInsight(nudge.id);
  }, [nudge, dismissInsight]);

  return { nudge, dismiss };
}
