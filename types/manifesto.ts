/**
 * Types for Interest Manifesto + AI Memory system
 */

// ---------------------------------------------------------------------------
// Manifesto
// ---------------------------------------------------------------------------

export interface TrainingMax {
  value: number;
  unit: 'lbs' | 'kg';
  date_achieved: string; // ISO timestamp
  rep_max: number; // e.g. 1 for 1RM, 5 for 5RM
}

export interface ManifestoGoal {
  id: string;
  description: string; // "Bench 225 by June"
  target_metric?: string; // e.g. "bench_press"
  target_value?: number;
  target_unit?: string;
  target_date?: string; // ISO date
  status: 'active' | 'achieved' | 'abandoned';
}

export interface UserInterestManifesto {
  id: string;
  user_id: string;
  interest_id: string;
  content: string;
  philosophies: string[];
  role_models: string[];
  weekly_cadence: WeeklyCadence;
  training_maxes?: Record<string, TrainingMax>;
  structured_goals?: ManifestoGoal[];
  workout_split?: Record<string, string[]>; // e.g. { "monday": ["chest", "triceps"] }
  updated_at: string;
  created_at: string;
}

export interface WeeklyCadence {
  [key: string]: number | string | undefined;
}

export interface ManifestoCreateInput {
  user_id: string;
  interest_id: string;
  content: string;
}

export interface ManifestoUpdateInput {
  content?: string;
  philosophies?: string[];
  role_models?: string[];
  weekly_cadence?: WeeklyCadence;
  training_maxes?: Record<string, TrainingMax>;
  structured_goals?: ManifestoGoal[];
  workout_split?: Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// AI Interest Insights
// ---------------------------------------------------------------------------

export type InsightType =
  | 'strength'
  | 'weakness'
  | 'pattern'
  | 'recommendation'
  | 'preference'
  | 'deviation_pattern'
  | 'personal_record'
  | 'plateau'
  | 'progressive_overload'
  | 'recovery_pattern';

export interface AIInterestInsight {
  id: string;
  user_id: string;
  interest_id: string;
  insight_type: InsightType;
  content: string;
  confidence: number;
  evidence_step_ids: string[];
  superseded_by: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// AI Conversations
// ---------------------------------------------------------------------------

export type ConversationContextType = 'capture' | 'train' | 'review' | 'manifesto' | 'nutrition';
export type ConversationStatus = 'active' | 'completed' | 'archived';

export interface AIConversation {
  id: string;
  user_id: string;
  interest_id: string;
  context_type: ConversationContextType;
  context_id: string | null;
  messages: ConversationMessage[];
  summary: string | null;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface CreateConversationInput {
  user_id: string;
  interest_id: string;
  context_type: ConversationContextType;
  context_id?: string;
}
