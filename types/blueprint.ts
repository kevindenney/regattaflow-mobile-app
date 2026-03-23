/**
 * Blueprint Types
 *
 * A blueprint is a published, subscribable version of a user's timeline
 * for a specific interest. Subscribers receive living updates as the
 * blueprint author adds new steps.
 */

export type BlueprintAccessLevel = 'public' | 'org_members' | 'paid';

export interface BlueprintRecord {
  id: string;
  user_id: string;
  interest_id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  subscriber_count: number;
  organization_id: string | null;
  access_level: BlueprintAccessLevel;
  created_at: string;
  updated_at: string;
}

export interface CreateBlueprintInput {
  user_id: string;
  interest_id: string;
  slug: string;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  is_published?: boolean;
  organization_id?: string | null;
  access_level?: BlueprintAccessLevel;
}

export interface UpdateBlueprintInput {
  title?: string;
  description?: string | null;
  cover_image_url?: string | null;
  is_published?: boolean;
  slug?: string;
  access_level?: BlueprintAccessLevel;
}

export interface BlueprintSubscriptionRecord {
  id: string;
  blueprint_id: string;
  subscriber_id: string;
  subscribed_at: string;
  last_synced_at: string;
  auto_adopt: boolean;
}

export interface BlueprintStepActionRecord {
  id: string;
  subscription_id: string;
  source_step_id: string;
  action: 'adopted' | 'dismissed' | 'seen';
  acted_at: string;
  adopted_step_id: string | null;
}

/** Blueprint with joined author profile info (for display) */
export interface BlueprintWithAuthor extends BlueprintRecord {
  author_name?: string;
  author_avatar_emoji?: string;
  author_avatar_color?: string;
  organization_name?: string;
  organization_slug?: string;
}

/** A new step from a subscribed blueprint that hasn't been acted on */
export interface BlueprintNewStep {
  step_id: string;
  step_title: string;
  step_description: string | null;
  step_status: string;
  step_created_at: string;
  blueprint_id: string;
  blueprint_title: string;
  blueprint_slug: string;
  author_id: string;
  author_name?: string;
  subscription_id: string;
}
