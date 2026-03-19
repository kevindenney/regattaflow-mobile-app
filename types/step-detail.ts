/**
 * Step Detail types — Plan/Act/Review metadata stored in timeline_steps.metadata
 */

export interface SubStep {
  id: string;
  text: string;
  sort_order: number;
  completed: boolean;
}

export interface MediaUpload {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  caption?: string;
}

export type MediaLinkPlatform =
  | 'google_photos'
  | 'apple_photos'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'other';

export interface MediaLink {
  id: string;
  url: string;
  caption?: string;
  platform: MediaLinkPlatform;
  added_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface StepCollaborator {
  id: string;
  type: 'platform' | 'external';
  user_id?: string;
  display_name: string;
  avatar_url?: string;
  avatar_emoji?: string;
  avatar_color?: string;
  connection_space?: string;
}

export interface StepPlanData {
  what_will_you_do?: string;
  what_chat_history?: ChatMessage[];
  how_sub_steps?: SubStep[];
  why_reasoning?: string;
  who_collaborators?: string[];           // legacy plain-text names
  collaborators?: StepCollaborator[];     // structured collaborators
  connection_space?: string;              // where they connect (Discord, Zoom, etc.)
  capability_goals?: string[];
  linked_resource_ids?: string[];
}

export interface StepActData {
  started_at?: string;
  notes?: string;
  media_uploads?: MediaUpload[];
  media_links?: MediaLink[];
  sub_step_progress?: Record<string, boolean>;
}

export interface StepReviewData {
  overall_rating?: number;
  worked_to_plan?: boolean;
  deviation_reason?: string;
  what_learned?: string;
  capability_progress?: Record<string, number>;
  next_step_notes?: string;
}

export interface CrossInterestSuggestion {
  id: string;
  sourceInterestSlug: string;
  sourceInterestName: string;
  sourceInterestColor: string;
  sourceInterestIcon: string | null;
  suggestion: string;
  relevance: string;
}

export interface StepMetadata {
  plan?: StepPlanData;
  act?: StepActData;
  review?: StepReviewData;
  [key: string]: unknown;
}
