/**
 * useStrategyBrief Hook
 *
 * Manages strategy brief checklist with all 14 strategy sections across 5 phases.
 * Integrates with useStrategyRecommendations for AI tips + past performance,
 * and useRaceStrategyNotes for user plans.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRacePreparation } from './useRacePreparation';
import { useStrategyRecommendations } from './useStrategyRecommendations';
import { useRaceStrategyNotes } from './useRaceStrategyNotes';
import {
  STRATEGY_SECTIONS,
  getSectionsForPhase,
  type StrategySectionId,
  type StrategyPhase,
  type StrategySectionMeta,
  type StrategySectionNote,
  type SectionPerformance,
} from '@/types/raceStrategy';
import type { CardRaceData } from '@/components/cards/types';
import type { ChecklistCompletion } from '@/types/checklists';

/**
 * Strategy section with full state (completion, AI recommendation, past performance, user plan)
 */
export interface StrategyBriefSectionWithState extends StrategySectionMeta {
  isCompleted: boolean;
  completion?: ChecklistCompletion;
  aiRecommendation?: string;
  pastPerformance?: SectionPerformance;
  userPlan?: string;
}

/**
 * Phase with its sections and completion stats
 */
export interface StrategyBriefPhase {
  key: StrategyPhase;
  label: string;
  sections: StrategyBriefSectionWithState[];
  completedCount: number;
  totalCount: number;
}

interface UseStrategyBriefOptions {
  raceEventId: string;
  race: CardRaceData;
}

interface UseStrategyBriefReturn {
  // Overall intention
  intention: string;
  setIntention: (value: string) => void;
  isIntentionSaving: boolean;

  // Phases with sections
  phases: StrategyBriefPhase[];

  // All sections flat (for progress calculation)
  allSections: StrategyBriefSectionWithState[];

  // Progress
  completedCount: number;
  totalCount: number;
  progress: number;

  // Actions
  toggleSectionCompletion: (sectionId: StrategySectionId) => void;
  updateSectionPlan: (sectionId: StrategySectionId, plan: string) => void;

  // State
  isLoading: boolean;
  hasUnsavedChanges: boolean;
}

const PHASE_LABELS: Record<StrategyPhase, string> = {
  start: 'START',
  upwind: 'UPWIND',
  downwind: 'DOWNWIND',
  markRounding: 'MARK ROUNDING',
  finish: 'FINISH',
};

const PHASE_ORDER: StrategyPhase[] = ['start', 'upwind', 'downwind', 'markRounding', 'finish'];

/**
 * Hook to manage strategy brief checklist with all phases and sections
 */
export function useStrategyBrief({
  raceEventId,
  race,
}: UseStrategyBriefOptions): UseStrategyBriefReturn {
  const { user } = useAuth();

  // Get race preparation for intention and completion tracking
  const { intentions, updateIntentions, isLoading: isLoadingPrep, isSaving } = useRacePreparation({
    raceEventId,
    autoSave: true,
    debounceMs: 800,
  });

  // Get AI recommendations and past performance
  const { sectionData, isLoading: isLoadingRecs } = useStrategyRecommendations(
    user?.id,
    {
      venueName: race.venue,
      windSpeed: race.wind?.speedMin,
      enabled: true,
    }
  );

  // Get user plans
  const { plans, updatePlan, isLoading: isLoadingPlans, hasUnsavedChanges } = useRaceStrategyNotes(raceEventId);

  // Get completions from intentions
  const completions = intentions?.checklistCompletions || {};

  // Build sections with full state
  const allSections: StrategyBriefSectionWithState[] = useMemo(() => {
    return STRATEGY_SECTIONS.map((section) => {
      const recommendation = sectionData[section.id];
      const completion = completions[section.id];

      return {
        ...section,
        isCompleted: !!completion,
        completion,
        aiRecommendation: recommendation?.aiRecommendation || section.defaultTip,
        pastPerformance: recommendation?.pastPerformance,
        userPlan: plans[section.id],
      };
    });
  }, [sectionData, completions, plans]);

  // Build phases with their sections
  const phases: StrategyBriefPhase[] = useMemo(() => {
    return PHASE_ORDER.map((phaseKey) => {
      const phaseSections = allSections.filter((s) => s.phase === phaseKey);
      const completedCount = phaseSections.filter((s) => s.isCompleted).length;

      return {
        key: phaseKey,
        label: PHASE_LABELS[phaseKey],
        sections: phaseSections,
        completedCount,
        totalCount: phaseSections.length,
      };
    });
  }, [allSections]);

  // Calculate overall progress
  const completedCount = allSections.filter((s) => s.isCompleted).length;
  const totalCount = allSections.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  // Get overall intention
  const intention = intentions?.strategyBrief?.raceIntention || '';

  // Update overall intention
  const setIntention = useCallback(
    (value: string) => {
      console.log('[useStrategyBrief] setIntention called', {
        value,
        raceEventId,
        currentIntention: intentions?.strategyBrief?.raceIntention
      });
      updateIntentions({
        strategyBrief: {
          ...intentions?.strategyBrief,
          raceIntention: value,
          intentionUpdatedAt: new Date().toISOString(),
        },
      });
    },
    [intentions?.strategyBrief, updateIntentions, raceEventId]
  );

  // Toggle section completion
  const toggleSectionCompletion = useCallback(
    (sectionId: StrategySectionId) => {
      const currentCompletions = intentions?.checklistCompletions || {};
      const isCurrentlyCompleted = !!currentCompletions[sectionId];

      if (isCurrentlyCompleted) {
        // Remove completion
        const { [sectionId]: _, ...rest } = currentCompletions;
        updateIntentions({
          checklistCompletions: rest,
        });
      } else {
        // Add completion
        const newCompletion: ChecklistCompletion = {
          itemId: sectionId,
          completedAt: new Date().toISOString(),
          completedBy: user?.id || 'unknown',
        };
        updateIntentions({
          checklistCompletions: {
            ...currentCompletions,
            [sectionId]: newCompletion,
          },
        });
      }
    },
    [intentions?.checklistCompletions, updateIntentions, user?.id]
  );

  // Update section plan (delegates to useRaceStrategyNotes)
  const updateSectionPlan = useCallback(
    (sectionId: StrategySectionId, plan: string) => {
      updatePlan(sectionId, plan);
    },
    [updatePlan]
  );

  const isLoading = isLoadingPrep || isLoadingRecs || isLoadingPlans;

  return {
    intention,
    setIntention,
    isIntentionSaving: isSaving,
    phases,
    allSections,
    completedCount,
    totalCount,
    progress,
    toggleSectionCompletion,
    updateSectionPlan,
    isLoading,
    hasUnsavedChanges,
  };
}
