/**
 * BlueprintService
 *
 * Data-access layer for timeline blueprints: publishing, subscribing,
 * fetching new steps for subscribers, and tracking adopt/dismiss actions.
 *
 * Tables:
 *   timeline_blueprints      - published blueprint records
 *   blueprint_subscriptions  - subscriber tracking
 *   blueprint_step_actions   - per-step adopt/dismiss/seen tracking
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import type {
  BlueprintRecord,
  CreateBlueprintInput,
  UpdateBlueprintInput,
  BlueprintSubscriptionRecord,
  BlueprintStepActionRecord,
  BlueprintWithAuthor,
  BlueprintNewStep,
} from '@/types/blueprint';
import type { TimelineStepRecord } from '@/types/timeline-steps';

const logger = createLogger('BlueprintService');

// ---------------------------------------------------------------------------
// 1. Blueprint CRUD
// ---------------------------------------------------------------------------

export async function createBlueprint(
  input: CreateBlueprintInput,
): Promise<BlueprintRecord> {
  try {
    logger.debug('Creating blueprint', { slug: input.slug });
    const { data, error } = await supabase
      .from('timeline_blueprints')
      .insert({
        user_id: input.user_id,
        interest_id: input.interest_id,
        slug: input.slug,
        title: input.title,
        description: input.description ?? null,
        cover_image_url: input.cover_image_url ?? null,
        is_published: input.is_published ?? false,
        organization_id: input.organization_id ?? null,
        access_level: input.access_level ?? 'public',
      })
      .select()
      .single();

    if (error) throw error;
    return data as BlueprintRecord;
  } catch (err) {
    logger.error('Failed to create blueprint', err);
    throw err;
  }
}

export async function updateBlueprint(
  blueprintId: string,
  updates: UpdateBlueprintInput,
): Promise<BlueprintRecord> {
  try {
    const { data, error } = await supabase
      .from('timeline_blueprints')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', blueprintId)
      .select()
      .single();

    if (error) throw error;
    return data as BlueprintRecord;
  } catch (err) {
    logger.error('Failed to update blueprint', err);
    throw err;
  }
}

export async function deleteBlueprint(blueprintId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('timeline_blueprints')
      .delete()
      .eq('id', blueprintId);

    if (error) throw error;
  } catch (err) {
    logger.error('Failed to delete blueprint', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 2. Blueprint lookups
// ---------------------------------------------------------------------------

export async function getBlueprintBySlug(
  slug: string,
): Promise<BlueprintWithAuthor | null> {
  try {
    const { data, error } = await supabase
      .from('timeline_blueprints')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Fetch author profile
    const blueprint = data as BlueprintRecord;
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_emoji, avatar_color')
      .eq('id', blueprint.user_id)
      .maybeSingle();

    const result: BlueprintWithAuthor = {
      ...blueprint,
      author_name: (profile as any)?.display_name ?? undefined,
      author_avatar_emoji: (profile as any)?.avatar_emoji ?? undefined,
      author_avatar_color: (profile as any)?.avatar_color ?? undefined,
    };

    // Fetch org info if published under an organization
    if (blueprint.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, slug')
        .eq('id', blueprint.organization_id)
        .maybeSingle();
      result.organization_name = (org as any)?.name ?? undefined;
      result.organization_slug = (org as any)?.slug ?? undefined;
    }

    return result;
  } catch (err) {
    logger.error('Failed to get blueprint by slug', err);
    throw err;
  }
}

export async function getBlueprintById(
  blueprintId: string,
): Promise<BlueprintRecord | null> {
  try {
    const { data, error } = await supabase
      .from('timeline_blueprints')
      .select('*')
      .eq('id', blueprintId)
      .maybeSingle();

    if (error) throw error;
    return (data as BlueprintRecord) ?? null;
  } catch (err) {
    logger.error('Failed to get blueprint by id', err);
    throw err;
  }
}

export async function getUserBlueprints(
  userId: string,
): Promise<BlueprintRecord[]> {
  try {
    const { data, error } = await supabase
      .from('timeline_blueprints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as BlueprintRecord[]) ?? [];
  } catch (err) {
    logger.error('Failed to get user blueprints', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 3. Blueprint steps (author's non-private steps for the interest)
// ---------------------------------------------------------------------------

export async function getBlueprintSteps(
  blueprintId: string,
): Promise<TimelineStepRecord[]> {
  try {
    // First get the blueprint to know user_id and interest_id
    const blueprint = await getBlueprintById(blueprintId);
    if (!blueprint) throw new Error('Blueprint not found');

    const { data, error } = await supabase
      .from('timeline_steps')
      .select('*')
      .eq('user_id', blueprint.user_id)
      .eq('interest_id', blueprint.interest_id)
      .neq('visibility', 'private')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data as TimelineStepRecord[]) ?? [];
  } catch (err) {
    logger.error('Failed to get blueprint steps', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 4. Subscriptions
// ---------------------------------------------------------------------------

export async function subscribe(
  subscriberId: string,
  blueprintId: string,
): Promise<BlueprintSubscriptionRecord> {
  try {
    logger.debug('Subscribing to blueprint', { subscriberId, blueprintId });

    // Fetch blueprint and check access
    const blueprint = await getBlueprintById(blueprintId);
    if (!blueprint) throw new Error('Blueprint not found');

    const access = await checkBlueprintAccess(subscriberId, blueprint);
    if (!access.allowed) {
      throw new Error(access.reason ?? 'Access denied');
    }

    // Insert subscription (upsert to handle re-subscribing)
    const { data, error } = await supabase
      .from('blueprint_subscriptions')
      .upsert(
        {
          blueprint_id: blueprintId,
          subscriber_id: subscriberId,
          subscribed_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'blueprint_id,subscriber_id' },
      )
      .select()
      .single();

    if (error) throw error;

    // Auto-follow the blueprint author
    if (blueprint.user_id !== subscriberId) {
      await supabase
        .from('user_follows')
        .upsert(
          {
            follower_id: subscriberId,
            following_id: blueprint.user_id,
          },
          { onConflict: 'follower_id,following_id' },
        )
        .then(({ error: followErr }) => {
          if (followErr) logger.warn('Auto-follow failed (non-blocking)', followErr);
        });
    }

    return data as BlueprintSubscriptionRecord;
  } catch (err) {
    logger.error('Failed to subscribe to blueprint', err);
    throw err;
  }
}

export async function unsubscribe(
  subscriberId: string,
  blueprintId: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('blueprint_subscriptions')
      .delete()
      .eq('blueprint_id', blueprintId)
      .eq('subscriber_id', subscriberId);

    if (error) throw error;
  } catch (err) {
    logger.error('Failed to unsubscribe from blueprint', err);
    throw err;
  }
}

export async function getSubscription(
  subscriberId: string,
  blueprintId: string,
): Promise<BlueprintSubscriptionRecord | null> {
  try {
    const { data, error } = await supabase
      .from('blueprint_subscriptions')
      .select('*')
      .eq('blueprint_id', blueprintId)
      .eq('subscriber_id', subscriberId)
      .maybeSingle();

    if (error) throw error;
    return (data as BlueprintSubscriptionRecord) ?? null;
  } catch (err) {
    logger.error('Failed to get subscription', err);
    throw err;
  }
}

export async function getMySubscriptions(
  subscriberId: string,
): Promise<BlueprintSubscriptionRecord[]> {
  try {
    const { data, error } = await supabase
      .from('blueprint_subscriptions')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .order('subscribed_at', { ascending: false });

    if (error) throw error;
    return (data as BlueprintSubscriptionRecord[]) ?? [];
  } catch (err) {
    logger.error('Failed to get subscriptions', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 5. New steps for subscriber (living subscription feed)
// ---------------------------------------------------------------------------

export async function getNewStepsForSubscriber(
  subscriberId: string,
  interestId?: string | null,
): Promise<BlueprintNewStep[]> {
  try {
    // Get all active subscriptions
    const { data: subs, error: subsErr } = await supabase
      .from('blueprint_subscriptions')
      .select('id, blueprint_id, last_synced_at')
      .eq('subscriber_id', subscriberId);

    if (subsErr) throw subsErr;
    if (!subs || subs.length === 0) return [];

    const results: BlueprintNewStep[] = [];

    for (const sub of subs) {
      // Get the blueprint
      const { data: bp } = await supabase
        .from('timeline_blueprints')
        .select('*')
        .eq('id', (sub as any).blueprint_id)
        .eq('is_published', true)
        .maybeSingle();

      if (!bp) continue;
      const blueprint = bp as BlueprintRecord;

      // Skip if filtering by interest and doesn't match
      if (interestId && blueprint.interest_id !== interestId) continue;

      // Get steps from the blueprint author that haven't been acted on
      const { data: actedStepIds } = await supabase
        .from('blueprint_step_actions')
        .select('source_step_id')
        .eq('subscription_id', (sub as any).id);

      const excludeIds = (actedStepIds ?? []).map((a: any) => a.source_step_id);

      let query = supabase
        .from('timeline_steps')
        .select('id, title, description, status, created_at, user_id')
        .eq('user_id', blueprint.user_id)
        .eq('interest_id', blueprint.interest_id)
        .neq('visibility', 'private')
        .order('sort_order', { ascending: true });

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data: steps, error: stepsErr } = await query;
      if (stepsErr) {
        logger.warn('Failed to fetch blueprint steps', stepsErr);
        continue;
      }

      // Get author name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', blueprint.user_id)
        .maybeSingle();

      for (const step of (steps ?? [])) {
        results.push({
          step_id: (step as any).id,
          step_title: (step as any).title,
          step_description: (step as any).description,
          step_status: (step as any).status,
          step_created_at: (step as any).created_at,
          blueprint_id: blueprint.id,
          blueprint_title: blueprint.title,
          blueprint_slug: blueprint.slug,
          author_id: blueprint.user_id,
          author_name: (profile as any)?.display_name ?? undefined,
          subscription_id: (sub as any).id,
        });
      }
    }

    return results;
  } catch (err) {
    logger.error('Failed to get new steps for subscriber', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 6. Step actions (adopt / dismiss / seen)
// ---------------------------------------------------------------------------

export async function markStepAction(
  subscriptionId: string,
  sourceStepId: string,
  action: 'adopted' | 'dismissed' | 'seen',
  adoptedStepId?: string | null,
): Promise<BlueprintStepActionRecord> {
  try {
    const { data, error } = await supabase
      .from('blueprint_step_actions')
      .upsert(
        {
          subscription_id: subscriptionId,
          source_step_id: sourceStepId,
          action,
          acted_at: new Date().toISOString(),
          adopted_step_id: adoptedStepId ?? null,
        },
        { onConflict: 'subscription_id,source_step_id' },
      )
      .select()
      .single();

    if (error) throw error;
    return data as BlueprintStepActionRecord;
  } catch (err) {
    logger.error('Failed to mark step action', err);
    throw err;
  }
}

export async function updateLastSynced(
  subscriptionId: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('blueprint_subscriptions')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', subscriptionId);

    if (error) throw error;
  } catch (err) {
    logger.error('Failed to update last synced', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 7. Organization blueprints & access control
// ---------------------------------------------------------------------------

export async function getOrganizationBlueprints(
  orgId: string,
): Promise<BlueprintRecord[]> {
  try {
    const { data, error } = await supabase
      .from('timeline_blueprints')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as BlueprintRecord[]) ?? [];
  } catch (err) {
    logger.error('Failed to get organization blueprints', err);
    throw err;
  }
}

export async function checkBlueprintAccess(
  userId: string,
  blueprint: BlueprintRecord,
): Promise<{ allowed: boolean; reason?: string }> {
  if (blueprint.access_level === 'public') return { allowed: true };
  if (!blueprint.organization_id) return { allowed: true };

  try {
    const { data } = await supabase
      .from('organization_memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', blueprint.organization_id)
      .in('membership_status', ['active'])
      .maybeSingle();

    if (data) return { allowed: true };
    return { allowed: false, reason: 'You must be a member of this organization to subscribe.' };
  } catch (err) {
    logger.error('Failed to check blueprint access', err);
    return { allowed: false, reason: 'Unable to verify membership.' };
  }
}

export async function getBlueprintAccessInfo(
  slug: string,
): Promise<{
  exists: boolean;
  access_level?: string;
  is_published?: boolean;
  org_id?: string;
  org_name?: string;
  org_slug?: string;
  title?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('get_blueprint_access_info', { p_slug: slug });
    if (error) throw error;
    return (data as any) ?? { exists: false };
  } catch (err) {
    logger.error('Failed to get blueprint access info', err);
    return { exists: false };
  }
}

// ---------------------------------------------------------------------------
// 8. Slug generation helper
// ---------------------------------------------------------------------------

export function generateBlueprintSlug(
  displayName: string,
  interestName: string,
): string {
  const base = `${displayName}-${interestName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  // Add short random suffix for uniqueness
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
