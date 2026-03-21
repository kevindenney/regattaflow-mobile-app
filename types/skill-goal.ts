/**
 * User-defined skill goals — self-directed learners track their own capabilities.
 * Parallel to org-scoped betterat_competencies but user-owned.
 */

export type SkillGoalSourceType = 'manual' | 'ai_generated' | 'from_resource' | 'from_brain_dump';
export type SkillGoalStatus = 'active' | 'archived';

export interface UserSkillGoal {
  id: string;
  user_id: string;
  interest_id: string;
  title: string;
  description: string | null;
  category: string | null;
  source_type: SkillGoalSourceType;
  source_resource_id: string | null;
  source_url: string | null;
  current_rating: number;         // 0-5
  rating_count: number;
  last_rated_at: string | null;
  sort_order: number;
  status: SkillGoalStatus;
  coach_rating: number | null;
  coach_id: string | null;
  coach_rated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSkillGoalInput {
  title: string;
  description?: string;
  category?: string;
  source_type?: SkillGoalSourceType;
  source_resource_id?: string;
  source_url?: string;
}

export interface SkillGoalWithProgress extends UserSkillGoal {
  /** Latest rating from most recent step review (transient, not persisted here) */
  latest_step_rating?: number;
}
