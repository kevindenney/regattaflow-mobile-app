/**
 * useStrategyRecommendations
 *
 * Fetches learning-based recommendations for each strategy section
 * using PostRaceLearningService.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { postRaceLearningService } from '@/services/PostRaceLearningService';
import type { PerformancePattern, PerformanceTrend } from '@/types/raceLearning';
import type {
  StrategySectionNote,
  StrategySectionId,
  StrategyPhase,
  STRATEGY_SECTIONS,
  RaceStrategyNotes,
  SectionPerformance,
} from '@/types/raceStrategy';

type PhaseInsightKey = 'rigTuning' | 'prestart' | 'start' | 'upwind' | 'windwardMark' | 'downwind' | 'leewardMark' | 'finish';

interface PhaseInsight {
  pattern: PerformancePattern | null;
  aiSuggestion: string | null;
}

interface UseStrategyRecommendationsOptions {
  venueName?: string;
  windSpeed?: number;
  windDirection?: number;
  enabled?: boolean;
}

interface UseStrategyRecommendationsResult {
  /** Section-specific recommendations keyed by section ID */
  sectionData: Partial<Record<StrategySectionId, StrategySectionNote>>;

  /** Phase-level performance patterns */
  phasePatterns: Partial<Record<StrategyPhase, PerformancePattern | null>>;

  /** Venue-specific insights if venueName provided */
  venueInsights: {
    raceCount: number;
    insights: string[];
    averagePerformance: number | null;
    keyLearnings: string[];
  } | null;

  /** Conditions-specific insights if windSpeed provided */
  conditionsInsights: {
    raceCount: number;
    insights: string[];
    averagePerformance: number | null;
    keyLearnings: string[];
    conditionLabel: string;
  } | null;

  /** Loading state */
  isLoading: boolean;

  /** Error message if any */
  error: string | null;

  /** Refresh recommendations */
  refresh: () => Promise<void>;
}

/**
 * Maps PostRaceLearningService phase keys to our strategy phases
 */
const PHASE_TO_SERVICE_KEY: Record<StrategyPhase, PhaseInsightKey> = {
  start: 'start',
  upwind: 'upwind',
  downwind: 'downwind',
  markRounding: 'windwardMark', // Use windward mark as primary
  finish: 'finish',
};

/**
 * Maps strategy sections to the service phase that provides their data
 */
const SECTION_TO_PHASE_KEY: Record<StrategySectionId, PhaseInsightKey> = {
  // Start sections - all use 'start' phase
  'start.lineBias': 'start',
  'start.favoredEnd': 'start',
  'start.timingApproach': 'prestart',
  // Upwind sections - all use 'upwind' phase
  'upwind.favoredTack': 'upwind',
  'upwind.shiftStrategy': 'upwind',
  'upwind.laylineApproach': 'upwind',
  // Downwind sections - all use 'downwind' phase
  'downwind.favoredGybe': 'downwind',
  'downwind.pressureStrategy': 'downwind',
  'downwind.vmgApproach': 'downwind',
  // Mark rounding - use windward mark
  'markRounding.approach': 'windwardMark',
  'markRounding.exitStrategy': 'leewardMark',
  'markRounding.tacticalPosition': 'windwardMark',
  // Finish
  'finish.lineBias': 'finish',
  'finish.finalApproach': 'finish',
};

/**
 * Converts a PerformancePattern to our SectionPerformance type
 */
function patternToSectionPerformance(pattern: PerformancePattern | null): SectionPerformance | undefined {
  if (!pattern) return undefined;

  // Get the most recent note from supporting samples
  const lastSample = pattern.supportingSamples[pattern.supportingSamples.length - 1];

  return {
    avgRating: pattern.average,
    trend: pattern.trend,
    sampleCount: pattern.sampleCount,
    lastRaceNote: lastSample?.notes ?? undefined,
  };
}

/**
 * Generate section-specific AI recommendation text
 *
 * Note: We intentionally use section-specific advice instead of the shared
 * phase AI suggestion to avoid showing identical text for different sections
 * that happen to share the same phase (e.g., Line Bias and Favored End both
 * map to 'start' phase).
 */
function generateSectionRecommendation(
  sectionId: StrategySectionId,
  pattern: PerformancePattern | null,
  _phaseAiSuggestion: string | null // Kept for future use but not used to avoid duplicates
): string | undefined {
  if (!pattern) return undefined;

  // Generate section-specific advice based on pattern data
  const isStrength = pattern.average >= 4.0;
  const isFocusArea = pattern.average <= 3.0;

  // Section-specific recommendations
  const sectionSpecificAdvice: Partial<Record<StrategySectionId, { strength: string; focus: string; neutral: string }>> = {
    'start.lineBias': {
      strength: 'Your line bias assessment is solid. Trust your instincts on the favored end.',
      focus: 'Practice checking line bias more systematically. Sail down the line before each start.',
      neutral: 'Continue refining your line bias reads. Look for clues in the puffs and shifts.',
    },
    'start.favoredEnd': {
      strength: 'You consistently pick the right end. Consider your options earlier in the sequence.',
      focus: 'Focus on committing to your end choice earlier. Avoid last-minute changes.',
      neutral: 'Balance line bias with your preferred side of the first beat when choosing ends.',
    },
    'start.timingApproach': {
      strength: 'Your timing and acceleration are strengths. Use them to start in more crowded areas.',
      focus: 'Work on your final minute timing. Practice time-distance runs before the start.',
      neutral: 'Keep practicing your acceleration timing to build consistency.',
    },
    'upwind.favoredTack': {
      strength: 'You read the favored tack well. Stay disciplined and avoid over-tacking.',
      focus: 'Track your compass headings more carefully to identify the lifted tack.',
      neutral: 'Continue developing your sense for which tack is lifted.',
    },
    'upwind.shiftStrategy': {
      strength: 'Your shift awareness is a strength. Use it to gain more on the fleet.',
      focus: 'Practice identifying shifts earlier. Use compass readings and visual cues.',
      neutral: 'Focus on tacking on headers and sailing the lifts.',
    },
    'upwind.laylineApproach': {
      strength: 'Your layline judgment is solid. Use it to round inside the fleet.',
      focus: 'Avoid early laylines in shifty conditions. Stay in the middle longer.',
      neutral: 'Balance early layline arrival with keeping your options open.',
    },
    'downwind.favoredGybe': {
      strength: 'You read downwind favors well. Use this to extend or close gaps.',
      focus: 'Watch your apparent wind angle - gybe when it moves aft without getting stronger.',
      neutral: 'Continue developing your feel for the lifted gybe.',
    },
    'downwind.pressureStrategy': {
      strength: 'You sail in pressure well. Keep hunting for the darker water.',
      focus: 'Look upwind more often for pressure bands. Sail towards the puffs.',
      neutral: 'Balance sailing towards pressure with your strategic course.',
    },
    'downwind.vmgApproach': {
      strength: 'Your VMG angles are dialed. Trust your boat speed.',
      focus: 'Experiment with hotter angles in light air and deeper in breeze.',
      neutral: 'Continue refining your downwind target angles for different conditions.',
    },
    'markRounding.approach': {
      strength: 'Your mark approaches set up well. Use this to gain inside position.',
      focus: 'Focus on approaching wide to round tight. Control your entry angle.',
      neutral: 'Continue working on consistent wide-tight-exit roundings.',
    },
    'markRounding.exitStrategy': {
      strength: 'Your exits are efficient. Use the momentum into the next leg.',
      focus: 'Focus on your exit angle - close to the mark for shortest distance.',
      neutral: 'Plan your exit strategy before entering the zone.',
    },
    'markRounding.tacticalPosition': {
      strength: 'You handle mark crowding well. Use this confidence in big fleets.',
      focus: 'Practice anticipating overlaps earlier. Know your rights and obligations.',
      neutral: 'Continue developing your tactical awareness at the marks.',
    },
    'finish.lineBias': {
      strength: 'You read the finish line well. This saves precious seconds.',
      focus: 'Check finish line bias as you approach - sail towards the closer end.',
      neutral: 'Remember to assess finish line bias in the final 100 meters.',
    },
    'finish.finalApproach': {
      strength: 'Your final approaches are smart. Protect your position effectively.',
      focus: 'Avoid risky maneuvers in the final 50 meters. A safe finish beats a gamble.',
      neutral: 'Balance protecting position with opportunities for late gains.',
    },
  };

  const advice = sectionSpecificAdvice[sectionId];
  if (advice) {
    if (isStrength) return advice.strength;
    if (isFocusArea) return advice.focus;
    return advice.neutral;
  }

  // Generic fallback
  if (isStrength) {
    return `This is a strength for you (${pattern.average.toFixed(1)} avg). Leverage it confidently.`;
  }
  if (isFocusArea) {
    return `Focus area (${pattern.average.toFixed(1)} avg). Break it down into specific skills to improve.`;
  }
  return `Your performance here: ${pattern.average.toFixed(1)} avg across ${pattern.sampleCount} races.`;
}

export function useStrategyRecommendations(
  userId: string | undefined,
  options: UseStrategyRecommendationsOptions = {}
): UseStrategyRecommendationsResult {
  const { venueName, windSpeed, windDirection, enabled = true } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase insights from service
  const [phaseInsights, setPhaseInsights] = useState<Partial<Record<PhaseInsightKey, PhaseInsight>>>({});

  // Optional contextual insights
  const [venueInsights, setVenueInsights] = useState<UseStrategyRecommendationsResult['venueInsights']>(null);
  const [conditionsInsights, setConditionsInsights] = useState<UseStrategyRecommendationsResult['conditionsInsights']>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!userId || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch insights for all phases in parallel
      const phaseKeys: PhaseInsightKey[] = ['start', 'prestart', 'upwind', 'windwardMark', 'downwind', 'leewardMark', 'finish'];

      const phasePromises = phaseKeys.map(async (phase) => {
        const result = await postRaceLearningService.getPhaseSpecificInsights(userId, phase);
        return { phase, result };
      });

      // Also fetch venue and conditions insights if parameters provided
      const venuePromise = venueName
        ? postRaceLearningService.getVenueSpecificInsights(userId, venueName)
        : Promise.resolve(null);

      const conditionsPromise = typeof windSpeed === 'number'
        ? postRaceLearningService.getConditionsSpecificInsights(userId, windSpeed, windDirection)
        : Promise.resolve(null);

      const [phaseResults, venueResult, conditionsResult] = await Promise.all([
        Promise.all(phasePromises),
        venuePromise,
        conditionsPromise,
      ]);

      // Build phase insights map
      const newPhaseInsights: Partial<Record<PhaseInsightKey, PhaseInsight>> = {};
      for (const { phase, result } of phaseResults) {
        newPhaseInsights[phase] = result;
      }
      setPhaseInsights(newPhaseInsights);

      // Set contextual insights
      if (venueResult && venueResult.raceCount > 0) {
        setVenueInsights(venueResult);
      } else {
        setVenueInsights(null);
      }

      if (conditionsResult && conditionsResult.raceCount > 0) {
        setConditionsInsights(conditionsResult);
      } else {
        setConditionsInsights(null);
      }

    } catch (err) {
      console.error('useStrategyRecommendations: Failed to fetch recommendations', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [userId, enabled, venueName, windSpeed, windDirection]);

  // Initial fetch
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Build section data from phase insights
  const sectionData = useMemo(() => {
    const data: Partial<Record<StrategySectionId, StrategySectionNote>> = {};

    const sectionIds = Object.keys(SECTION_TO_PHASE_KEY) as StrategySectionId[];

    for (const sectionId of sectionIds) {
      const phaseKey = SECTION_TO_PHASE_KEY[sectionId];
      const insight = phaseInsights[phaseKey];

      if (insight) {
        data[sectionId] = {
          aiRecommendation: generateSectionRecommendation(sectionId, insight.pattern, insight.aiSuggestion),
          pastPerformance: patternToSectionPerformance(insight.pattern),
        };
      }
    }

    return data;
  }, [phaseInsights]);

  // Build phase patterns map
  const phasePatterns = useMemo(() => {
    const patterns: Partial<Record<StrategyPhase, PerformancePattern | null>> = {};

    for (const [phase, serviceKey] of Object.entries(PHASE_TO_SERVICE_KEY) as [StrategyPhase, PhaseInsightKey][]) {
      const insight = phaseInsights[serviceKey];
      patterns[phase] = insight?.pattern ?? null;
    }

    return patterns;
  }, [phaseInsights]);

  return {
    sectionData,
    phasePatterns,
    venueInsights,
    conditionsInsights,
    isLoading,
    error,
    refresh: fetchRecommendations,
  };
}
