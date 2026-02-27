/**
 * usePracticeConfig Hook
 *
 * Interest-aware wrapper for practice/drill configuration.
 * Provides drill category metadata, skill area labels, and practice phase labels
 * derived from the current interest's InterestEventConfig.
 *
 * For sailing, this returns the same data as the hardcoded DRILL_CATEGORY_META,
 * SKILL_AREA_LABELS, and SKILL_AREA_CONFIG constants in types/practice.ts.
 * For other interests, it returns interest-specific categories and skills.
 */

import { useMemo } from 'react';
import { useInterestEventConfig } from '@/hooks/useInterestEventConfig';
import {
  buildDrillCategoryMap,
  buildSkillAreaLabelMap,
  buildSkillAreaConfigMap,
  PRACTICE_PHASE_LABELS,
  PRACTICE_PHASE_TIMING,
} from '@/types/practice';
import type { DrillCategoryMeta, SkillAreaConfig } from '@/types/interestEventConfig';
import type { PracticePhase } from '@/types/practice';

export interface UsePracticeConfigReturn {
  /** Interest slug */
  interestSlug: string;

  /** Drill categories for this interest (array form) */
  drillCategories: DrillCategoryMeta[];

  /** Drill category lookup map: id → { label, icon } */
  drillCategoryMap: Record<string, { label: string; icon: string }>;

  /** Skill areas for this interest (array form) */
  skillAreas: SkillAreaConfig[];

  /** Skill area label map: id → label string */
  skillAreaLabels: Record<string, string>;

  /** Skill area config map: id → { label } (same shape as SKILL_AREA_CONFIG) */
  skillAreaConfig: Record<string, { label: string }>;

  /** Practice phase labels (currently same for all interests) */
  phaseLabels: Record<PracticePhase, string>;

  /** Practice phase timing descriptions */
  phaseTiming: Record<PracticePhase, string>;

  /** Event noun for display (e.g., "Race", "Shift") */
  eventNoun: string;
}

export function usePracticeConfig(): UsePracticeConfigReturn {
  const eventConfig = useInterestEventConfig();

  const drillCategoryMap = useMemo(
    () => buildDrillCategoryMap(eventConfig.drillCategories),
    [eventConfig.drillCategories]
  );

  const skillAreaLabels = useMemo(
    () => buildSkillAreaLabelMap(eventConfig.skillAreas),
    [eventConfig.skillAreas]
  );

  const skillAreaConfig = useMemo(
    () => buildSkillAreaConfigMap(eventConfig.skillAreas),
    [eventConfig.skillAreas]
  );

  return {
    interestSlug: eventConfig.interestSlug,
    drillCategories: eventConfig.drillCategories,
    drillCategoryMap,
    skillAreas: eventConfig.skillAreas,
    skillAreaLabels,
    skillAreaConfig,
    phaseLabels: PRACTICE_PHASE_LABELS,
    phaseTiming: PRACTICE_PHASE_TIMING,
    eventNoun: eventConfig.eventNoun,
  };
}

export default usePracticeConfig;
