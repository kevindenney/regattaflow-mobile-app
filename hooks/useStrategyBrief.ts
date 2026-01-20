/**
 * useStrategyBrief Hook
 *
 * Manages strategy brief checklist with race-type-specific sections.
 * Supports fleet, distance, match, and team racing with appropriate phases.
 * Integrates with useStrategyRecommendations for AI tips + past performance,
 * and useRaceStrategyNotes for user plans.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRacePreparation } from './useRacePreparation';
import { useStrategyRecommendations } from './useStrategyRecommendations';
import { useRaceStrategyNotes } from './useRaceStrategyNotes';
import { useRaceTypeStrategy } from './useRaceTypeStrategy';
import {
  type StrategySectionId,
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
 * Uses string key to support dynamic phases (legs, peaks, etc.)
 */
export interface StrategyBriefPhase {
  key: string;
  label: string;
  sections: StrategyBriefSectionWithState[];
  completedCount: number;
  totalCount: number;
}

interface UseStrategyBriefOptions {
  regattaId: string;
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


/**
 * Hook to manage strategy brief checklist with race-type-specific phases and sections
 */
export function useStrategyBrief({
  regattaId,
  race,
}: UseStrategyBriefOptions): UseStrategyBriefReturn {
  const { user } = useAuth();

  // Get race-type-specific phases and sections
  const {
    phases: racePhases,
    sections: raceSections,
    isLoading: isLoadingRaceType,
  } = useRaceTypeStrategy(regattaId, race.name);

  // Get race preparation for intention and completion tracking
  const { intentions, updateIntentions, isLoading: isLoadingPrep, isSaving } = useRacePreparation({
    regattaId,
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
  const { plans, updatePlan, isLoading: isLoadingPlans, hasUnsavedChanges } = useRaceStrategyNotes(regattaId);

  // Get completions from intentions
  const completions = intentions?.checklistCompletions || {};

  // Build sections with full state using dynamic race-type sections
  const allSections: StrategyBriefSectionWithState[] = useMemo(() => {
    return raceSections.map((section) => {
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
  }, [raceSections, sectionData, completions, plans]);

  // Build phases with their sections using dynamic race-type phases
  const phases: StrategyBriefPhase[] = useMemo(() => {
    return racePhases.map((phase) => {
      const phaseKey = phase.key as string;
      const phaseSections = allSections.filter((s) => s.phase === phaseKey);
      const completedCount = phaseSections.filter((s) => s.isCompleted).length;

      return {
        key: phaseKey,
        label: phase.label,
        sections: phaseSections,
        completedCount,
        totalCount: phaseSections.length,
      };
    });
  }, [racePhases, allSections]);

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
        regattaId,
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
    [intentions?.strategyBrief, updateIntentions, regattaId]
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

  const isLoading = isLoadingRaceType || isLoadingPrep || isLoadingRecs || isLoadingPlans;

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
