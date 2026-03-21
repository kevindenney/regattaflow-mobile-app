import type { CardRaceData } from '@/components/cards';
import type { TimelineStepRecord, TimelineStepStatus } from '@/types/timeline-steps';

const STATUS_MAP: Record<TimelineStepStatus, string> = {
  pending: 'scheduled',
  in_progress: 'in_progress',
  completed: 'completed',
  skipped: 'abandoned',
};

export function timelineStepToCardRaceData(step: TimelineStepRecord): CardRaceData {
  return {
    id: step.id,
    name: step.title,
    interest_id: step.interest_id,
    venue: step.location_name ?? '',
    date: step.starts_at || step.created_at,
    status: STATUS_MAP[step.status] ?? 'scheduled',
    created_by: step.user_id,
    user_id: step.user_id,
    collaborator_user_ids: step.collaborator_user_ids ?? [],
    isTimelineStep: true,
    stepStatus: step.status,
    sort_order: step.sort_order,
    category: step.category,
    description: step.description,
    metadata: {
      ...(step.metadata ?? {}),
      timeline_step_id: step.id,
    },
  };
}

export function timelineStepsToCardRaceData(steps: TimelineStepRecord[]): CardRaceData[] {
  return steps.map(timelineStepToCardRaceData);
}
