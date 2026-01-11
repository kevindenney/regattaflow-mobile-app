/**
 * usePracticeCreationWizard Hook
 *
 * Manages state for the 4-step practice creation wizard.
 * Steps: WHAT → WHO → WHY → HOW
 */

import { useState, useCallback, useMemo } from 'react';
import {
  WhatStepData,
  WhoStepData,
  WhyStepData,
  HowStepData,
  CreatePracticeSessionWithFramework,
  PracticeTemplate,
  Drill,
  SkillArea,
  PracticeMemberRole,
  WhatStepDrill,
  WhoStepMember,
  DrillTaskAssignment,
  DrillInstructions,
  PracticeSessionType,
} from '@/types/practice';
import { PracticeTemplateService } from '@/services/PracticeTemplateService';
import { PracticeSessionService } from '@/services/PracticeSessionService';

export type WizardStep = 'what' | 'who' | 'why' | 'how';

export interface WizardState {
  currentStep: WizardStep;
  what: WhatStepData;
  who: WhoStepData;
  why: WhyStepData;
  how: HowStepData;
  // Meta
  sessionType: PracticeSessionType;
  scheduledDate?: string;
  scheduledStartTime?: string;
  venueId?: string;
  venueName?: string;
  title?: string;
  // Loaded data
  selectedTemplate?: PracticeTemplate;
  availableDrills: Drill[];
  // State
  isSubmitting: boolean;
  error?: string;
}

const INITIAL_WHAT: WhatStepData = {
  focusAreas: [],
  drills: [],
  estimatedDurationMinutes: 0,
};

const INITIAL_WHO: WhoStepData = {
  members: [],
  drillTaskAssignments: [],
};

const INITIAL_WHY: WhyStepData = {};

const INITIAL_HOW: HowStepData = {
  drillInstructions: [],
};

const STEPS: WizardStep[] = ['what', 'who', 'why', 'how'];

export interface UsePracticeCreationWizardReturn {
  // State
  state: WizardState;
  currentStep: WizardStep;
  stepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;

  // Navigation
  goToStep: (step: WizardStep) => void;
  goNext: () => void;
  goBack: () => void;

  // WHAT step actions
  setFocusAreas: (areas: SkillArea[]) => void;
  selectTemplate: (template: PracticeTemplate) => Promise<void>;
  clearTemplate: () => void;
  addDrill: (drill: Drill, orderIndex?: number) => void;
  removeDrill: (drillId: string) => void;
  reorderDrills: (drills: WhatStepDrill[]) => void;
  setDrillDuration: (drillId: string, minutes: number) => void;

  // WHO step actions
  addMember: (member: WhoStepMember) => void;
  removeMember: (memberIndex: number) => void;
  updateMember: (memberIndex: number, updates: Partial<WhoStepMember>) => void;
  setDrillTask: (drillId: string, memberIndex: number, task: string, isPrimary?: boolean) => void;
  removeDrillTask: (drillId: string, memberIndex: number) => void;
  applyDefaultTasks: () => void;

  // WHY step actions
  setAIReasoning: (reasoning: string) => void;
  setUserRationale: (rationale: string) => void;
  linkRaces: (raceIds: string[]) => void;

  // HOW step actions
  setDrillInstructions: (drillId: string, instructions: string) => void;
  setDrillSuccessCriteria: (drillId: string, criteria: string) => void;
  setSessionNotes: (notes: string) => void;

  // Meta actions
  setSessionType: (type: PracticeSessionType) => void;
  setSchedule: (date: string, time?: string) => void;
  setVenue: (venueId: string, venueName: string) => void;
  setTitle: (title: string) => void;

  // Submit
  createSession: () => Promise<string>;
  reset: () => void;
}

export function usePracticeCreationWizard(): UsePracticeCreationWizardReturn {
  const [state, setState] = useState<WizardState>({
    currentStep: 'what',
    what: INITIAL_WHAT,
    who: INITIAL_WHO,
    why: INITIAL_WHY,
    how: INITIAL_HOW,
    sessionType: 'scheduled',
    availableDrills: [],
    isSubmitting: false,
  });

  const stepIndex = STEPS.indexOf(state.currentStep);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;

  // Validation for each step
  const canProceed = useMemo(() => {
    switch (state.currentStep) {
      case 'what':
        return state.what.focusAreas.length > 0 && state.what.drills.length > 0;
      case 'who':
        // At minimum, need at least one member (could be just the creator)
        return true;
      case 'why':
        // WHY is optional - AI reasoning or user rationale
        return true;
      case 'how':
        // HOW is optional - instructions can use defaults
        return true;
      default:
        return false;
    }
  }, [state.currentStep, state.what, state.who, state.why, state.how]);

  // Navigation
  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step, error: undefined }));
  }, []);

  const goNext = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setState((prev) => ({ ...prev, currentStep: STEPS[nextIndex], error: undefined }));
    }
  }, [stepIndex]);

  const goBack = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setState((prev) => ({ ...prev, currentStep: STEPS[prevIndex], error: undefined }));
    }
  }, [stepIndex]);

  // =========================================================================
  // WHAT step actions
  // =========================================================================

  const setFocusAreas = useCallback((areas: SkillArea[]) => {
    setState((prev) => ({
      ...prev,
      what: { ...prev.what, focusAreas: areas },
    }));
  }, []);

  const selectTemplate = useCallback(async (template: PracticeTemplate) => {
    try {
      const fullTemplate = await PracticeTemplateService.getTemplateWithDrills(template.id);
      if (!fullTemplate || !fullTemplate.drills) {
        throw new Error('Failed to load template drills');
      }

      const drills: WhatStepDrill[] = fullTemplate.drills.map((td) => ({
        drillId: td.drillId,
        orderIndex: td.orderIndex,
        durationMinutes: td.durationMinutes || td.drill?.durationMinutes,
        repetitions: td.repetitions,
      }));

      // Calculate total duration
      const totalDuration = drills.reduce((sum, d) => sum + (d.durationMinutes || 0), 0);

      // Extract default crew tasks for WHO step
      const drillTaskAssignments: DrillTaskAssignment[] = fullTemplate.drills
        .filter((td) => td.defaultCrewTasks && td.defaultCrewTasks.length > 0)
        .map((td) => ({
          drillId: td.drillId,
          orderIndex: td.orderIndex,
          tasks: td.defaultCrewTasks.map((task, idx) => ({
            memberIndex: idx, // Will need to be remapped when members are added
            taskDescription: task.task,
            isPrimary: idx === 0,
          })),
        }));

      // Extract drill instructions for HOW step
      const drillInstructions: DrillInstructions[] = fullTemplate.drills
        .filter((td) => td.customInstructions || td.successCriteria)
        .map((td) => ({
          drillId: td.drillId,
          orderIndex: td.orderIndex,
          customInstructions: td.customInstructions,
          successCriteria: td.successCriteria,
        }));

      setState((prev) => ({
        ...prev,
        selectedTemplate: fullTemplate,
        availableDrills: fullTemplate.drills.map((td) => td.drill!).filter(Boolean),
        what: {
          ...prev.what,
          templateId: template.id,
          drills,
          estimatedDurationMinutes: totalDuration,
        },
        who: {
          ...prev.who,
          drillTaskAssignments,
        },
        how: {
          ...prev.how,
          drillInstructions,
        },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to load template',
      }));
    }
  }, []);

  const clearTemplate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedTemplate: undefined,
      what: {
        ...prev.what,
        templateId: undefined,
        drills: [],
        estimatedDurationMinutes: 0,
      },
    }));
  }, []);

  const addDrill = useCallback((drill: Drill, orderIndex?: number) => {
    setState((prev) => {
      const index = orderIndex ?? prev.what.drills.length;
      const newDrill: WhatStepDrill = {
        drillId: drill.id,
        orderIndex: index,
        durationMinutes: drill.durationMinutes,
      };

      const drills = [...prev.what.drills, newDrill].map((d, i) => ({
        ...d,
        orderIndex: i,
      }));

      const totalDuration = drills.reduce((sum, d) => sum + (d.durationMinutes || 0), 0);

      return {
        ...prev,
        availableDrills: [...prev.availableDrills, drill],
        what: {
          ...prev.what,
          drills,
          estimatedDurationMinutes: totalDuration,
        },
      };
    });
  }, []);

  const removeDrill = useCallback((drillId: string) => {
    setState((prev) => {
      const drills = prev.what.drills
        .filter((d) => d.drillId !== drillId)
        .map((d, i) => ({ ...d, orderIndex: i }));

      const totalDuration = drills.reduce((sum, d) => sum + (d.durationMinutes || 0), 0);

      return {
        ...prev,
        what: {
          ...prev.what,
          drills,
          estimatedDurationMinutes: totalDuration,
        },
      };
    });
  }, []);

  const reorderDrills = useCallback((drills: WhatStepDrill[]) => {
    setState((prev) => ({
      ...prev,
      what: {
        ...prev.what,
        drills: drills.map((d, i) => ({ ...d, orderIndex: i })),
      },
    }));
  }, []);

  const setDrillDuration = useCallback((drillId: string, minutes: number) => {
    setState((prev) => {
      const drills = prev.what.drills.map((d) =>
        d.drillId === drillId ? { ...d, durationMinutes: minutes } : d
      );
      const totalDuration = drills.reduce((sum, d) => sum + (d.durationMinutes || 0), 0);

      return {
        ...prev,
        what: {
          ...prev.what,
          drills,
          estimatedDurationMinutes: totalDuration,
        },
      };
    });
  }, []);

  // =========================================================================
  // WHO step actions
  // =========================================================================

  const addMember = useCallback((member: WhoStepMember) => {
    setState((prev) => ({
      ...prev,
      who: {
        ...prev.who,
        members: [...prev.who.members, member],
      },
    }));
  }, []);

  const removeMember = useCallback((memberIndex: number) => {
    setState((prev) => ({
      ...prev,
      who: {
        ...prev.who,
        members: prev.who.members.filter((_, i) => i !== memberIndex),
        // Also remove tasks for this member
        drillTaskAssignments: prev.who.drillTaskAssignments.map((assignment) => ({
          ...assignment,
          tasks: assignment.tasks
            .filter((t) => t.memberIndex !== memberIndex)
            .map((t) => ({
              ...t,
              memberIndex: t.memberIndex > memberIndex ? t.memberIndex - 1 : t.memberIndex,
            })),
        })),
      },
    }));
  }, []);

  const updateMember = useCallback((memberIndex: number, updates: Partial<WhoStepMember>) => {
    setState((prev) => ({
      ...prev,
      who: {
        ...prev.who,
        members: prev.who.members.map((m, i) =>
          i === memberIndex ? { ...m, ...updates } : m
        ),
      },
    }));
  }, []);

  const setDrillTask = useCallback(
    (drillId: string, memberIndex: number, task: string, isPrimary = false) => {
      setState((prev) => {
        const drill = prev.what.drills.find((d) => d.drillId === drillId);
        if (!drill) return prev;

        const existingAssignment = prev.who.drillTaskAssignments.find(
          (a) => a.drillId === drillId
        );

        if (existingAssignment) {
          // Update existing assignment
          const updatedAssignments = prev.who.drillTaskAssignments.map((a) => {
            if (a.drillId !== drillId) return a;

            const existingTask = a.tasks.find((t) => t.memberIndex === memberIndex);
            if (existingTask) {
              return {
                ...a,
                tasks: a.tasks.map((t) =>
                  t.memberIndex === memberIndex
                    ? { ...t, taskDescription: task, isPrimary }
                    : t
                ),
              };
            } else {
              return {
                ...a,
                tasks: [...a.tasks, { memberIndex, taskDescription: task, isPrimary }],
              };
            }
          });

          return {
            ...prev,
            who: { ...prev.who, drillTaskAssignments: updatedAssignments },
          };
        } else {
          // Create new assignment
          return {
            ...prev,
            who: {
              ...prev.who,
              drillTaskAssignments: [
                ...prev.who.drillTaskAssignments,
                {
                  drillId,
                  orderIndex: drill.orderIndex,
                  tasks: [{ memberIndex, taskDescription: task, isPrimary }],
                },
              ],
            },
          };
        }
      });
    },
    []
  );

  const removeDrillTask = useCallback((drillId: string, memberIndex: number) => {
    setState((prev) => ({
      ...prev,
      who: {
        ...prev.who,
        drillTaskAssignments: prev.who.drillTaskAssignments.map((a) =>
          a.drillId === drillId
            ? { ...a, tasks: a.tasks.filter((t) => t.memberIndex !== memberIndex) }
            : a
        ),
      },
    }));
  }, []);

  const applyDefaultTasks = useCallback(() => {
    if (!state.selectedTemplate?.drills) return;

    setState((prev) => {
      const drillTaskAssignments: DrillTaskAssignment[] = [];

      for (const templateDrill of state.selectedTemplate!.drills || []) {
        if (!templateDrill.defaultCrewTasks?.length) continue;

        const tasks = templateDrill.defaultCrewTasks.map((defaultTask, idx) => {
          // Map role to member index (skipper = 0, crew = 1, etc.)
          const roleOrder: Record<string, number> = {
            skipper: 0,
            organizer: 0,
            crew: 1,
            coach: 2,
            observer: 3,
          };
          const memberIndex = roleOrder[defaultTask.role.toLowerCase()] ?? idx;

          return {
            memberIndex: Math.min(memberIndex, prev.who.members.length - 1),
            taskDescription: defaultTask.task,
            isPrimary: idx === 0,
          };
        });

        drillTaskAssignments.push({
          drillId: templateDrill.drillId,
          orderIndex: templateDrill.orderIndex,
          tasks,
        });
      }

      return {
        ...prev,
        who: { ...prev.who, drillTaskAssignments },
      };
    });
  }, [state.selectedTemplate]);

  // =========================================================================
  // WHY step actions
  // =========================================================================

  const setAIReasoning = useCallback((reasoning: string) => {
    setState((prev) => ({
      ...prev,
      why: { ...prev.why, aiReasoning: reasoning },
    }));
  }, []);

  const setUserRationale = useCallback((rationale: string) => {
    setState((prev) => ({
      ...prev,
      why: { ...prev.why, userRationale: rationale },
    }));
  }, []);

  const linkRaces = useCallback((raceIds: string[]) => {
    setState((prev) => ({
      ...prev,
      why: { ...prev.why, linkedRaceIds: raceIds },
    }));
  }, []);

  // =========================================================================
  // HOW step actions
  // =========================================================================

  const setDrillInstructions = useCallback((drillId: string, instructions: string) => {
    setState((prev) => {
      const drill = prev.what.drills.find((d) => d.drillId === drillId);
      if (!drill) return prev;

      const existingInstruction = prev.how.drillInstructions.find(
        (i) => i.drillId === drillId
      );

      if (existingInstruction) {
        return {
          ...prev,
          how: {
            ...prev.how,
            drillInstructions: prev.how.drillInstructions.map((i) =>
              i.drillId === drillId ? { ...i, customInstructions: instructions } : i
            ),
          },
        };
      } else {
        return {
          ...prev,
          how: {
            ...prev.how,
            drillInstructions: [
              ...prev.how.drillInstructions,
              {
                drillId,
                orderIndex: drill.orderIndex,
                customInstructions: instructions,
              },
            ],
          },
        };
      }
    });
  }, []);

  const setDrillSuccessCriteria = useCallback((drillId: string, criteria: string) => {
    setState((prev) => {
      const drill = prev.what.drills.find((d) => d.drillId === drillId);
      if (!drill) return prev;

      const existingInstruction = prev.how.drillInstructions.find(
        (i) => i.drillId === drillId
      );

      if (existingInstruction) {
        return {
          ...prev,
          how: {
            ...prev.how,
            drillInstructions: prev.how.drillInstructions.map((i) =>
              i.drillId === drillId ? { ...i, successCriteria: criteria } : i
            ),
          },
        };
      } else {
        return {
          ...prev,
          how: {
            ...prev.how,
            drillInstructions: [
              ...prev.how.drillInstructions,
              {
                drillId,
                orderIndex: drill.orderIndex,
                successCriteria: criteria,
              },
            ],
          },
        };
      }
    });
  }, []);

  const setSessionNotes = useCallback((notes: string) => {
    setState((prev) => ({
      ...prev,
      how: { ...prev.how, sessionNotes: notes },
    }));
  }, []);

  // =========================================================================
  // Meta actions
  // =========================================================================

  const setSessionType = useCallback((type: PracticeSessionType) => {
    setState((prev) => ({ ...prev, sessionType: type }));
  }, []);

  const setSchedule = useCallback((date: string, time?: string) => {
    setState((prev) => ({
      ...prev,
      scheduledDate: date,
      scheduledStartTime: time,
    }));
  }, []);

  const setVenue = useCallback((venueId: string, venueName: string) => {
    setState((prev) => ({
      ...prev,
      venueId,
      venueName,
    }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  // =========================================================================
  // Submit
  // =========================================================================

  const createSession = useCallback(async (): Promise<string> => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: undefined }));

    try {
      const input: CreatePracticeSessionWithFramework = {
        sessionType: state.sessionType,
        scheduledDate: state.scheduledDate,
        scheduledStartTime: state.scheduledStartTime,
        venueId: state.venueId,
        venueName: state.venueName,
        title: state.title,
        what: state.what,
        who: state.who,
        why: state.why,
        how: state.how,
      };

      // Use the existing service method or create a new one for 4Q framework
      // For now, we'll use the existing createSession and add the extras separately
      const session = await PracticeSessionService.createSession({
        sessionType: input.sessionType,
        scheduledDate: input.scheduledDate,
        scheduledStartTime: input.scheduledStartTime,
        venueId: input.venueId,
        venueName: input.venueName,
        title: input.title,
        durationMinutes: input.what.estimatedDurationMinutes,
        focusAreaIds: input.what.focusAreas,
        drillIds: input.what.drills.map((d) => d.drillId),
        aiSuggested: !!input.why.aiReasoning,
        aiSuggestionContext: input.why.aiReasoning
          ? {
              reasoning: input.why.aiReasoning,
              linkedRaceIds: input.why.linkedRaceIds,
            }
          : undefined,
      });

      setState((prev) => ({ ...prev, isSubmitting: false }));
      return session.id;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to create session',
      }));
      throw error;
    }
  }, [state]);

  const reset = useCallback(() => {
    setState({
      currentStep: 'what',
      what: INITIAL_WHAT,
      who: INITIAL_WHO,
      why: INITIAL_WHY,
      how: INITIAL_HOW,
      sessionType: 'scheduled',
      availableDrills: [],
      isSubmitting: false,
    });
  }, []);

  return {
    state,
    currentStep: state.currentStep,
    stepIndex,
    isFirstStep,
    isLastStep,
    canProceed,

    goToStep,
    goNext,
    goBack,

    setFocusAreas,
    selectTemplate,
    clearTemplate,
    addDrill,
    removeDrill,
    reorderDrills,
    setDrillDuration,

    addMember,
    removeMember,
    updateMember,
    setDrillTask,
    removeDrillTask,
    applyDefaultTasks,

    setAIReasoning,
    setUserRationale,
    linkRaces,

    setDrillInstructions,
    setDrillSuccessCriteria,
    setSessionNotes,

    setSessionType,
    setSchedule,
    setVenue,
    setTitle,

    createSession,
    reset,
  };
}

export default usePracticeCreationWizard;
