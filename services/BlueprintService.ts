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
  BlueprintSuggestedNextStep,
  SubscriberProgress,
  PeerTimeline,
  PeerTimelineStep,
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
        program_id: input.program_id ?? null,
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
      .select('full_name, avatar_url')
      .eq('id', blueprint.user_id)
      .maybeSingle();

    const result: BlueprintWithAuthor = {
      ...blueprint,
      author_name: (profile as any)?.full_name ?? undefined,
      author_avatar_emoji: undefined,
      author_avatar_color: undefined,
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

    // Fetch program name if linked to a program
    if (blueprint.program_id) {
      const { data: program } = await supabase
        .from('programs')
        .select('title')
        .eq('id', blueprint.program_id)
        .maybeSingle();
      result.program_name = (program as any)?.title ?? undefined;
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
    // First try curated blueprint_steps
    const { data: curatedRows, error: curatedErr } = await supabase
      .from('blueprint_steps')
      .select('step_id, sort_order')
      .eq('blueprint_id', blueprintId)
      .order('sort_order', { ascending: true });

    if (curatedErr) throw curatedErr;

    if (curatedRows && curatedRows.length > 0) {
      // Fetch the actual step records
      const stepIds = curatedRows.map((r: any) => r.step_id);
      const { data: steps, error: stepsErr } = await supabase
        .from('timeline_steps')
        .select('*')
        .in('id', stepIds);

      if (stepsErr) throw stepsErr;

      // Sort by the blueprint_steps sort_order
      const orderMap = new Map(curatedRows.map((r: any) => [r.step_id, r.sort_order]));
      return ((steps ?? []) as TimelineStepRecord[]).sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
      );
    }

    // Fallback: all non-private steps for author+interest (backward compat)
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

export async function addStepToBlueprint(
  blueprintId: string,
  stepId: string,
  sortOrder?: number,
): Promise<void> {
  try {
    // If no sort_order provided, append at end
    let order = sortOrder;
    if (order === undefined) {
      const { data: maxRow } = await supabase
        .from('blueprint_steps')
        .select('sort_order')
        .eq('blueprint_id', blueprintId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      order = ((maxRow as any)?.sort_order ?? -1) + 1;
    }

    const { error } = await supabase
      .from('blueprint_steps')
      .upsert(
        { blueprint_id: blueprintId, step_id: stepId, sort_order: order },
        { onConflict: 'blueprint_id,step_id' },
      );

    if (error) throw error;
  } catch (err) {
    logger.error('Failed to add step to blueprint', err);
    throw err;
  }
}

export async function removeStepFromBlueprint(
  blueprintId: string,
  stepId: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('blueprint_steps')
      .delete()
      .eq('blueprint_id', blueprintId)
      .eq('step_id', stepId);

    if (error) throw error;
  } catch (err) {
    logger.error('Failed to remove step from blueprint', err);
    throw err;
  }
}

export async function reorderBlueprintSteps(
  blueprintId: string,
  stepIds: string[],
): Promise<void> {
  try {
    const updates = stepIds.map((stepId, index) => ({
      blueprint_id: blueprintId,
      step_id: stepId,
      sort_order: index,
    }));

    // Upsert all with new sort_orders
    const { error } = await supabase
      .from('blueprint_steps')
      .upsert(updates, { onConflict: 'blueprint_id,step_id' });

    if (error) throw error;
  } catch (err) {
    logger.error('Failed to reorder blueprint steps', err);
    throw err;
  }
}

export async function setBlueprintSteps(
  blueprintId: string,
  stepIds: string[],
): Promise<void> {
  try {
    // Delete all existing
    const { error: delErr } = await supabase
      .from('blueprint_steps')
      .delete()
      .eq('blueprint_id', blueprintId);

    if (delErr) throw delErr;

    if (stepIds.length === 0) return;

    // Insert new
    const rows = stepIds.map((stepId, index) => ({
      blueprint_id: blueprintId,
      step_id: stepId,
      sort_order: index,
    }));

    const { error: insErr } = await supabase
      .from('blueprint_steps')
      .insert(rows);

    if (insErr) throw insErr;
  } catch (err) {
    logger.error('Failed to set blueprint steps', err);
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

/**
 * Get subscribed blueprints for a user, optionally filtered by interest.
 * Returns joined blueprint + author info for display.
 */
export async function getSubscribedBlueprints(
  subscriberId: string,
  interestId?: string | null,
): Promise<import('@/types/blueprint').SubscribedBlueprintInfo[]> {
  try {
    const { data: subs, error: subsErr } = await supabase
      .from('blueprint_subscriptions')
      .select('id, blueprint_id, subscribed_at')
      .eq('subscriber_id', subscriberId);
    if (subsErr) throw subsErr;
    if (!subs || subs.length === 0) return [];

    const blueprintIds = subs.map((s: any) => s.blueprint_id);
    let query = supabase
      .from('timeline_blueprints')
      .select('id, title, slug, user_id, interest_id')
      .in('id', blueprintIds)
      .eq('is_published', true);
    if (interestId) query = query.eq('interest_id', interestId);

    const { data: blueprints, error: bpErr } = await query;
    if (bpErr) throw bpErr;
    if (!blueprints || blueprints.length === 0) return [];

    // Fetch author names
    const authorIds = [...new Set((blueprints as any[]).map((bp) => bp.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', authorIds);
    const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));

    const subsMap = new Map(subs.map((s: any) => [s.blueprint_id, s]));

    return (blueprints as any[]).map((bp) => ({
      subscription_id: subsMap.get(bp.id)!.id,
      blueprint_id: bp.id,
      blueprint_title: bp.title,
      blueprint_slug: bp.slug,
      author_name: nameMap.get(bp.user_id) ?? null,
      subscribed_at: subsMap.get(bp.id)!.subscribed_at,
    }));
  } catch (err) {
    logger.error('Failed to get subscribed blueprints', err);
    return [];
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

      // Get steps: prefer curated blueprint_steps, fallback to all non-private
      const { data: curatedRows } = await supabase
        .from('blueprint_steps')
        .select('step_id')
        .eq('blueprint_id', blueprint.id);

      let stepQuery;
      if (curatedRows && curatedRows.length > 0) {
        const curatedIds = curatedRows.map((r: any) => r.step_id);
        // Filter out already-acted steps
        const remainingIds = curatedIds.filter((id: string) => !excludeIds.includes(id));
        if (remainingIds.length === 0) continue;

        stepQuery = supabase
          .from('timeline_steps')
          .select('id, title, description, status, created_at, user_id')
          .in('id', remainingIds)
          .order('sort_order', { ascending: true });
      } else {
        stepQuery = supabase
          .from('timeline_steps')
          .select('id, title, description, status, created_at, user_id')
          .eq('user_id', blueprint.user_id)
          .eq('interest_id', blueprint.interest_id)
          .neq('visibility', 'private')
          .order('sort_order', { ascending: true });

        if (excludeIds.length > 0) {
          stepQuery = stepQuery.not('id', 'in', `(${excludeIds.join(',')})`);
        }
      }

      const { data: steps, error: stepsErr } = await stepQuery;
      if (stepsErr) {
        logger.warn('Failed to fetch blueprint steps', stepsErr);
        continue;
      }

      // Get author name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
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
          interest_id: blueprint.interest_id,
          author_id: blueprint.user_id,
          author_name: (profile as any)?.full_name ?? undefined,
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

export async function getProgramBlueprints(
  programId: string,
): Promise<BlueprintRecord[]> {
  try {
    const { data, error } = await supabase
      .from('timeline_blueprints')
      .select('*')
      .eq('program_id', programId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as BlueprintRecord[]) ?? [];
  } catch (err) {
    logger.error('Failed to get program blueprints', err);
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
// 8. Blueprint subscribers
// ---------------------------------------------------------------------------

export async function getBlueprintSubscribers(
  blueprintId: string,
): Promise<
  {
    id: string;
    subscriber_id: string;
    subscriber_name: string | null;
    subscriber_avatar_url: string | null;
    subscribed_at: string;
  }[]
> {
  try {
    const { data: subs, error } = await supabase
      .from('blueprint_subscriptions')
      .select('id, subscriber_id, subscribed_at')
      .eq('blueprint_id', blueprintId)
      .order('subscribed_at', { ascending: false });

    if (error) throw error;
    if (!subs || subs.length === 0) return [];

    const subscriberIds = (subs as any[]).map((s) => s.subscriber_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', subscriberIds);

    const profileMap = new Map(
      (profiles ?? []).map((p: any) => [p.id, p]),
    );

    return (subs as any[]).map((s) => {
      const profile = profileMap.get(s.subscriber_id);
      return {
        id: s.id,
        subscriber_id: s.subscriber_id,
        subscriber_name: profile?.full_name ?? null,
        subscriber_avatar_url: profile?.avatar_url ?? null,
        subscribed_at: s.subscribed_at,
      };
    });
  } catch (err) {
    logger.error('Failed to get blueprint subscribers', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 9. Subscriber progress (for blueprint authors)
// ---------------------------------------------------------------------------

export async function getBlueprintSubscriberProgress(
  blueprintId: string,
): Promise<SubscriberProgress[]> {
  try {
    const { data, error } = await supabase.rpc('get_blueprint_subscriber_progress', {
      p_blueprint_id: blueprintId,
    });

    if (error) throw error;

    const rows = (data as any[]) ?? [];
    return rows.map((row) => {
      const steps = row.steps ?? [];
      return {
        subscriber_id: row.subscriber_id,
        name: row.name,
        avatar_url: row.avatar_url,
        subscribed_at: row.subscribed_at,
        steps,
        adopted_count: steps.filter((s: any) => s.action === 'adopted').length,
        completed_count: steps.filter((s: any) => s.status === 'completed').length,
        dismissed_count: steps.filter((s: any) => s.action === 'dismissed').length,
      };
    });
  } catch (err) {
    logger.error('Failed to get blueprint subscriber progress', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 10. Suggested next steps (for smart add sheet)
// ---------------------------------------------------------------------------

export async function getSuggestedNextSteps(
  subscriberId: string,
  interestId?: string | null,
): Promise<BlueprintSuggestedNextStep[]> {
  try {
    const { data, error } = await supabase.rpc('get_suggested_next_steps', {
      p_subscriber_id: subscriberId,
      p_interest_id: interestId ?? null,
    });

    if (error) throw error;
    return (data as BlueprintSuggestedNextStep[]) ?? [];
  } catch (err) {
    logger.error('Failed to get suggested next steps', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 11. Peer subscriber timelines (for peer progress display)
// ---------------------------------------------------------------------------

export async function getPeerSubscriberTimelines(
  blueprintId: string,
  excludeUserId: string,
  interestId: string,
  blueprintTitle: string,
): Promise<PeerTimeline[]> {
  try {
    // 1. Get subscribers for this blueprint
    const subscribers = await getBlueprintSubscribers(blueprintId);
    const peerIds = subscribers
      .map((s) => s.subscriber_id)
      .filter((id) => id !== excludeUserId);

    if (peerIds.length === 0) return [];

    // Limit to 10 peers
    const limitedPeerIds = peerIds.slice(0, 10);

    // 2. Batch-fetch non-private timeline_steps for these peers
    const { data: steps, error } = await supabase
      .from('timeline_steps')
      .select('id, title, status, completed_at, user_id')
      .in('user_id', limitedPeerIds)
      .eq('interest_id', interestId)
      .neq('visibility', 'private')
      .order('sort_order', { ascending: true })
      .limit(200); // 10 peers × 20 steps max

    if (error) throw error;

    // 3. Group by user, limit 20 steps per peer
    const stepsByUser = new Map<string, PeerTimelineStep[]>();
    for (const step of (steps ?? []) as any[]) {
      const userId = step.user_id;
      if (!stepsByUser.has(userId)) stepsByUser.set(userId, []);
      const userSteps = stepsByUser.get(userId)!;
      if (userSteps.length < 20) {
        userSteps.push({
          id: step.id,
          title: step.title,
          status: step.status,
          completed_at: step.completed_at,
        });
      }
    }

    // 4. Build subscriber name/avatar map
    const subMap = new Map(
      subscribers.map((s) => [s.subscriber_id, s]),
    );

    // 5. Return only peers with ≥1 visible step
    const results: PeerTimeline[] = [];
    for (const peerId of limitedPeerIds) {
      const peerSteps = stepsByUser.get(peerId);
      if (!peerSteps || peerSteps.length === 0) continue;

      const sub = subMap.get(peerId);
      const completedCount = peerSteps.filter((s) => s.status === 'completed').length;

      results.push({
        blueprint_id: blueprintId,
        blueprint_title: blueprintTitle,
        subscriber_id: peerId,
        subscriber_name: sub?.subscriber_name ?? null,
        subscriber_avatar_emoji: null,
        subscriber_avatar_color: null,
        steps: peerSteps,
        completed_count: completedCount,
        total_count: peerSteps.length,
      });
    }

    return results;
  } catch (err) {
    logger.error('Failed to get peer subscriber timelines', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 12. Slug generation helper
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
