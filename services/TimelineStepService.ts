/**
 * TimelineStepService
 *
 * Data-access layer for timeline steps: CRUD, adoption from other users,
 * and org template operations.
 *
 * Tables:
 *   timeline_steps          - per-user timeline step records
 *   timeline_step_templates - org-defined learning path blueprints
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import type {
  TimelineStepRecord,
  CreateTimelineStepInput,
  UpdateTimelineStepInput,
  TimelineStepListFilters,
} from '@/types/timeline-steps';
import { resolveDefaultVisibility } from '@/services/PrivacySettingsService';
import type { StepMetadata } from '@/types/step-detail';
import type {
  CourseLesson,
  CourseStructure,
  LibraryResourceRecord,
} from '@/types/library';
import { getAllLessons } from '@/types/library';

const logger = createLogger('TimelineStepService');

// Cache interest slug → id lookups for the session
const interestIdCache = new Map<string, string>();

export async function resolveInterestId(slug: string): Promise<string | null> {
  if (interestIdCache.has(slug)) return interestIdCache.get(slug)!;
  try {
    const { data, error } = await supabase
      .from('interests')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return null;
    const id = String((data as any).id);
    interestIdCache.set(slug, id);
    return id;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. Get a user's timeline steps
// ---------------------------------------------------------------------------

export async function getUserTimeline(
  userId: string,
  interestId?: string | string[] | null,
): Promise<TimelineStepRecord[]> {
  try {
    // Fetch own steps
    let ownQuery = supabase
      .from('timeline_steps')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (interestId) {
      if (Array.isArray(interestId)) {
        ownQuery = ownQuery.in('interest_id', interestId);
      } else {
        ownQuery = ownQuery.eq('interest_id', interestId);
      }
    }

    // Fetch steps where user is a collaborator (shared with them)
    let collabQuery = supabase
      .from('timeline_steps')
      .select('*')
      .contains('collaborator_user_ids', [userId])
      .neq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (interestId) {
      if (Array.isArray(interestId)) {
        collabQuery = collabQuery.in('interest_id', interestId);
      } else {
        collabQuery = collabQuery.eq('interest_id', interestId);
      }
    }

    const [ownResult, collabResult] = await Promise.all([ownQuery, collabQuery]);

    if (ownResult.error) throw ownResult.error;
    if (collabResult.error) throw collabResult.error;

    // Merge: own steps first (sorted), then collaborated steps appended — deduplicated
    const ownSteps = (ownResult.data ?? []) as TimelineStepRecord[];
    const collabSteps = (collabResult.data ?? []) as TimelineStepRecord[];
    const seenIds = new Set(ownSteps.map((s) => s.id));
    const uniqueCollabSteps = collabSteps.filter((s) => {
      if (seenIds.has(s.id)) return false;
      seenIds.add(s.id);
      return true;
    });
    return [...ownSteps, ...uniqueCollabSteps];
  } catch (err) {
    logger.error('Failed to fetch user timeline', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 1b. Get a single step by ID
// ---------------------------------------------------------------------------

export async function getStepById(stepId: string): Promise<TimelineStepRecord> {
  try {
    const { data, error } = await supabase
      .from('timeline_steps')
      .select('*')
      .eq('id', stepId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error(`Step ${stepId} not found`);
    return data as TimelineStepRecord;
  } catch (err) {
    logger.error('Failed to fetch step by ID', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 1c. Update step metadata with deep merge
// ---------------------------------------------------------------------------

export async function updateStepMetadata(
  stepId: string,
  partialMetadata: Partial<StepMetadata>,
): Promise<TimelineStepRecord> {
  try {
    // Fetch current step to merge metadata
    const { data: current, error: fetchErr } = await supabase
      .from('timeline_steps')
      .select('metadata')
      .eq('id', stepId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!current) throw new Error(`Step ${stepId} not found or not owned by current user`);

    const existingMetadata = (current?.metadata ?? {}) as StepMetadata;

    // Deep merge: for each top-level key (plan, act, review), merge objects
    const merged: StepMetadata = { ...existingMetadata };
    for (const key of Object.keys(partialMetadata) as Array<keyof StepMetadata>) {
      const existing = merged[key];
      const incoming = partialMetadata[key];
      if (
        existing &&
        incoming &&
        typeof existing === 'object' &&
        typeof incoming === 'object' &&
        !Array.isArray(existing) &&
        !Array.isArray(incoming)
      ) {
        (merged as any)[key] = { ...existing, ...incoming };
      } else {
        (merged as any)[key] = incoming;
      }
    }

    // Extract platform collaborator user_ids for the denormalized RLS column
    const collaborators = (merged.plan as any)?.collaborators as
      | Array<{ type: string; user_id?: string }>
      | undefined;
    const collaboratorUserIds = (collaborators ?? [])
      .filter((c) => c.type === 'platform' && c.user_id)
      .map((c) => c.user_id!);

    const { data, error } = await supabase
      .from('timeline_steps')
      .update({
        metadata: merged,
        collaborator_user_ids: collaboratorUserIds,
      })
      .eq('id', stepId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error(`Step ${stepId} not found or not owned by current user`);
    return data as TimelineStepRecord;
  } catch (err) {
    logger.error('Failed to update step metadata', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 2. Get timelines of users the current user follows
// ---------------------------------------------------------------------------

export async function getFollowedUsersTimelines(
  userId: string,
  interestId?: string | null,
): Promise<TimelineStepRecord[]> {
  try {
    // Get followed user IDs
    const { data: follows, error: followErr } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (followErr) throw followErr;
    if (!follows || follows.length === 0) return [];

    const followingIds = follows.map((f: any) => String(f.following_id));

    let query = supabase
      .from('timeline_steps')
      .select('*')
      .in('user_id', followingIds)
      .neq('visibility', 'private')
      .order('updated_at', { ascending: false })
      .limit(200);

    if (interestId) {
      query = query.eq('interest_id', interestId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as TimelineStepRecord[];
  } catch (err) {
    logger.error('Failed to fetch followed users timelines', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 3. Create a timeline step
// ---------------------------------------------------------------------------

export async function createStep(
  input: CreateTimelineStepInput,
): Promise<TimelineStepRecord> {
  try {
    logger.debug('Creating timeline step', { title: input.title, userId: input.user_id });

    // Resolve visibility through the cascade: explicit → interest default → profile default → 'followers'
    const visibility =
      input.visibility ??
      (await resolveDefaultVisibility(input.user_id, input.interest_id));

    const { data, error } = await supabase
      .from('timeline_steps')
      .insert({
        user_id: input.user_id,
        interest_id: input.interest_id,
        organization_id: input.organization_id ?? null,
        program_session_id: input.program_session_id ?? null,
        source_type: input.source_type ?? 'manual',
        source_id: input.source_id ?? null,
        title: input.title,
        description: input.description ?? null,
        category: input.category ?? 'general',
        status: input.status ?? 'pending',
        starts_at: input.starts_at ?? null,
        ends_at: input.ends_at ?? null,
        location_name: input.location_name ?? null,
        location_lat: input.location_lat ?? null,
        location_lng: input.location_lng ?? null,
        location_place_id: input.location_place_id ?? null,
        visibility,
        share_approximate_location: input.share_approximate_location ?? false,
        metadata: input.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as TimelineStepRecord;
  } catch (err) {
    logger.error('Failed to create timeline step', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 4. Update a timeline step
// ---------------------------------------------------------------------------

export async function updateStep(
  stepId: string,
  input: UpdateTimelineStepInput,
): Promise<TimelineStepRecord> {
  try {
    logger.debug('Updating timeline step', { stepId });

    // Auto-set completed_at when status changes
    const payload: Record<string, unknown> = { ...input };
    if (input.status === 'completed') {
      payload.completed_at = new Date().toISOString();
    } else if (input.status) {
      payload.completed_at = null;
    }

    const { data, error } = await supabase
      .from('timeline_steps')
      .update(payload)
      .eq('id', stepId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error(`Step ${stepId} not found or not owned by current user`);
    return data as TimelineStepRecord;
  } catch (err) {
    logger.error('Failed to update timeline step', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 5. Delete a timeline step
// ---------------------------------------------------------------------------

export async function deleteStep(stepId: string): Promise<void> {
  try {
    logger.debug('Deleting timeline step', { stepId });
    const { error } = await supabase
      .from('timeline_steps')
      .delete()
      .eq('id', stepId);

    if (error) throw error;
  } catch (err) {
    logger.error('Failed to delete timeline step', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 6. Adopt a step from another user (copy with source tracking)
// ---------------------------------------------------------------------------

export async function adoptStep(
  userId: string,
  sourceStepId: string,
  interestId: string,
  blueprintId?: string | null,
): Promise<TimelineStepRecord> {
  try {
    logger.debug('Adopting step', { userId, sourceStepId });

    // Fetch the source step
    const { data: source, error: fetchErr } = await supabase
      .from('timeline_steps')
      .select('*')
      .eq('id', sourceStepId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!source) throw new Error('Source step not found');

    // Get the max sort_order for the adopter's timeline
    const { data: maxRow } = await supabase
      .from('timeline_steps')
      .select('sort_order')
      .eq('user_id', userId)
      .eq('interest_id', interestId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSort = (maxRow?.sort_order ?? 0) + 1;

    // Copy metadata but strip brain_dump (it's author-specific context, not relevant to adopter)
    const sourceMetadata = { ...((source as any).metadata ?? {}) };
    delete sourceMetadata.brain_dump;

    // Copy linked library resources via SECURITY DEFINER RPC so the adopter
    // can read the author's resources (RLS normally blocks cross-user reads).
    const linkedIds: string[] = sourceMetadata.plan?.linked_resource_ids ?? [];
    if (linkedIds.length > 0) {
      try {
        const { data: idMap, error: rpcErr } = await supabase.rpc(
          'copy_library_resources_for_adoption',
          {
            p_source_resource_ids: linkedIds,
            p_adopter_user_id: userId,
            p_interest_id: interestId,
          },
        );

        if (rpcErr) {
          logger.warn('RPC copy_library_resources_for_adoption failed', rpcErr);
        } else if (idMap && Object.keys(idMap).length > 0) {
          // Rewrite linked_resource_ids to point to the adopter's copies
          sourceMetadata.plan = {
            ...(sourceMetadata.plan ?? {}),
            linked_resource_ids: linkedIds.map((id) => idMap[id] ?? id),
          };
          logger.debug('Library resources copied for adoption', { count: Object.keys(idMap).length });
        }
      } catch (err) {
        // Non-fatal — step adoption still works without library resources
        logger.warn('Failed to copy library resources during adoption', err);
      }
    }

    const insertPayload: Record<string, unknown> = {
        user_id: userId,
        interest_id: interestId,
        organization_id: (source as any).organization_id ?? null,
        source_type: 'copied',
        source_id: sourceStepId,
        copied_from_user_id: (source as any).user_id,
        title: (source as any).title,
        description: (source as any).description,
        category: (source as any).category ?? 'general',
        status: 'pending',
        location_name: (source as any).location_name,
        location_lat: (source as any).location_lat,
        location_lng: (source as any).location_lng,
        location_place_id: (source as any).location_place_id,
        visibility: 'followers',
        share_approximate_location: false,
        sort_order: nextSort,
        metadata: sourceMetadata,
    };

    if (blueprintId) {
      insertPayload.source_blueprint_id = blueprintId;
    }

    const { data, error } = await supabase
      .from('timeline_steps')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;
    return data as TimelineStepRecord;
  } catch (err) {
    logger.error('Failed to adopt step', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 7. Org template operations
// ---------------------------------------------------------------------------

export interface TimelineStepTemplate {
  id: string;
  organization_id: string;
  interest_id: string;
  path_name: string;
  title: string;
  description: string | null;
  category: string;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function getTemplatesForOrg(
  orgId: string,
  interestId?: string | null,
): Promise<TimelineStepTemplate[]> {
  try {
    let query = supabase
      .from('timeline_step_templates')
      .select('*')
      .eq('organization_id', orgId)
      .order('path_name')
      .order('sort_order', { ascending: true });

    if (interestId) {
      query = query.eq('interest_id', interestId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as TimelineStepTemplate[];
  } catch (err) {
    logger.error('Failed to fetch templates', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 8. Batch-create timeline steps from course lessons
// ---------------------------------------------------------------------------

export interface CourseToTimelineOptions {
  userId: string;
  interestId: string;
  resourceId: string;
  courseTitle: string;
  authorOrCreator?: string;
  lessons: CourseLesson[];
  /** Days between each step (0 = all on the same day) */
  spacingDays?: number;
  startDate?: string;
}

export async function createStepsFromCourse(
  options: CourseToTimelineOptions,
): Promise<TimelineStepRecord[]> {
  const {
    userId,
    interestId,
    resourceId,
    courseTitle,
    authorOrCreator,
    lessons,
    spacingDays = 0,
    startDate,
  } = options;

  try {
    logger.debug('Creating steps from course', {
      userId,
      resourceId,
      lessonCount: lessons.length,
    });

    // Get user's current max sort_order
    const { data: maxRow } = await supabase
      .from('timeline_steps')
      .select('sort_order')
      .eq('user_id', userId)
      .eq('interest_id', interestId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextSort = (maxRow?.sort_order ?? 0) + 1;
    const baseDate = startDate ? new Date(startDate) : null;

    const rows = lessons.map((lesson, idx) => {
      const startsAt = baseDate
        ? new Date(
            baseDate.getTime() + idx * spacingDays * 24 * 60 * 60 * 1000,
          ).toISOString()
        : null;

      const metadata: StepMetadata = {
        plan: {
          what_will_you_do: lesson.description || `Complete: ${lesson.title}`,
          linked_resource_ids: [resourceId],
        },
        course_context: {
          resource_id: resourceId,
          course_title: courseTitle,
          author_or_creator: authorOrCreator,
          lesson_id: lesson.id,
          lesson_index: idx,
          total_lessons: lessons.length,
        },
      };

      return {
        user_id: userId,
        interest_id: interestId,
        source_type: 'template' as const,
        source_id: resourceId,
        title: lesson.title,
        description: lesson.description ?? null,
        category: 'lesson',
        status: 'pending' as const,
        visibility: 'followers' as const,
        sort_order: nextSort++,
        starts_at: startsAt,
        metadata,
      };
    });

    const { data, error } = await supabase
      .from('timeline_steps')
      .insert(rows)
      .select();

    if (error) throw error;
    return (data ?? []) as TimelineStepRecord[];
  } catch (err) {
    logger.error('Failed to create steps from course', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 9. Adopt an org-published course (creates steps + library resource)
// ---------------------------------------------------------------------------

export interface OrgCourseAdoptionInput {
  userId: string;
  interestId: string;
  orgId: string;
  /** The path_name for the course's template group */
  coursePath: string;
  /** Library ID where the mirror resource should be created */
  libraryId: string;
}

export async function adoptOrgCourse(
  input: OrgCourseAdoptionInput,
): Promise<{ steps: TimelineStepRecord[]; resourceId: string }> {
  const { userId, interestId, orgId, coursePath, libraryId } = input;

  try {
    logger.debug('Adopting org course', { userId, orgId, coursePath });

    // 1. Fetch the org's template steps for this course
    const { data: templates, error: fetchErr } = await supabase
      .from('timeline_step_templates')
      .select('*')
      .eq('organization_id', orgId)
      .eq('path_name', coursePath)
      .order('sort_order', { ascending: true });

    if (fetchErr) throw fetchErr;
    if (!templates || templates.length === 0) {
      throw new Error('Course template not found');
    }

    // 2. Get org name for display
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    const orgName = (org as any)?.name || 'Organization';

    // 3. Create a library resource to mirror the course
    const courseStructure: CourseStructure = {
      modules: [
        {
          id: 'main',
          title: coursePath,
          sort_order: 0,
          lessons: (templates as any[]).map((t, i) => ({
            id: t.id,
            title: t.title,
            sort_order: i,
            description: t.description,
          })),
        },
      ],
      total_lessons: templates.length,
    };

    const { data: resource, error: resErr } = await supabase
      .from('library_resources')
      .insert({
        library_id: libraryId,
        user_id: userId,
        title: coursePath,
        resource_type: 'online_course',
        author_or_creator: orgName,
        description: `Adopted from ${orgName}`,
        metadata: { course_structure: courseStructure, progress: { completed_lesson_ids: [] } },
      })
      .select()
      .single();

    if (resErr) throw resErr;
    const resourceId = (resource as any).id;

    // 4. Create timeline steps from the templates
    const { data: maxRow } = await supabase
      .from('timeline_steps')
      .select('sort_order')
      .eq('user_id', userId)
      .eq('interest_id', interestId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextSort = (maxRow?.sort_order ?? 0) + 1;

    const rows = (templates as any[]).map((t, idx) => ({
      user_id: userId,
      interest_id: interestId,
      organization_id: orgId,
      source_type: 'template' as const,
      source_id: t.id,
      title: t.title,
      description: t.description,
      category: t.category ?? 'lesson',
      status: 'pending' as const,
      visibility: 'followers' as const,
      sort_order: nextSort++,
      metadata: {
        ...((t.metadata as Record<string, unknown>) ?? {}),
        plan: {
          linked_resource_ids: [resourceId],
        },
        course_context: {
          resource_id: resourceId,
          course_title: coursePath,
          author_or_creator: orgName,
          lesson_id: t.id,
          lesson_index: idx,
          total_lessons: templates.length,
        },
      },
    }));

    const { data: steps, error: stepErr } = await supabase
      .from('timeline_steps')
      .insert(rows)
      .select();

    if (stepErr) throw stepErr;

    return {
      steps: (steps ?? []) as TimelineStepRecord[],
      resourceId,
    };
  } catch (err) {
    logger.error('Failed to adopt org course', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 10. Get steps where the user is a collaborator (not the owner)
// ---------------------------------------------------------------------------

export async function getCollaboratedSteps(
  userId: string,
  interestId?: string | null,
): Promise<TimelineStepRecord[]> {
  try {
    let query = supabase
      .from('timeline_steps')
      .select('*')
      .contains('collaborator_user_ids', [userId])
      .neq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (interestId) {
      query = query.eq('interest_id', interestId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as TimelineStepRecord[];
  } catch (err) {
    logger.error('Failed to fetch collaborated steps', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 11. Public sharing — generate/retrieve share tokens
// ---------------------------------------------------------------------------

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function getShareUrl(token: string): string {
  const base =
    typeof window !== 'undefined' ? window.location.origin : 'https://regattaflow.com';
  return `${base}/p/step/${token}`;
}

export async function enableStepSharing(
  stepId: string,
): Promise<{ token: string; url: string }> {
  try {
    // Check if step already has a share token
    const { data: existing, error: fetchErr } = await supabase
      .from('timeline_steps')
      .select('share_token, share_enabled')
      .eq('id', stepId)
      .single();

    if (fetchErr) throw fetchErr;

    if (existing?.share_token && existing?.share_enabled) {
      return { token: existing.share_token, url: getShareUrl(existing.share_token) };
    }

    const token = existing?.share_token || generateShareToken();

    const { error } = await supabase
      .from('timeline_steps')
      .update({
        share_token: token,
        share_enabled: true,
        public_shared_at: new Date().toISOString(),
      })
      .eq('id', stepId);

    if (error) throw error;

    return { token, url: getShareUrl(token) };
  } catch (err) {
    logger.error('Failed to enable step sharing', err);
    throw err;
  }
}

export async function getStepShareInfo(
  stepId: string,
): Promise<{ share_enabled: boolean; share_token: string | null; url: string | null } | null> {
  try {
    const { data, error } = await supabase
      .from('timeline_steps')
      .select('share_enabled, share_token')
      .eq('id', stepId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      share_enabled: data.share_enabled ?? false,
      share_token: data.share_token ?? null,
      url: data.share_token ? getShareUrl(data.share_token) : null,
    };
  } catch (err) {
    logger.error('Failed to get step share info', err);
    throw err;
  }
}

export async function adoptTemplate(
  userId: string,
  orgId: string,
  pathName: string,
  interestId: string,
): Promise<TimelineStepRecord[]> {
  try {
    logger.debug('Adopting template path', { userId, orgId, pathName });

    // Fetch the template steps for this path
    const { data: templates, error: fetchErr } = await supabase
      .from('timeline_step_templates')
      .select('*')
      .eq('organization_id', orgId)
      .eq('path_name', pathName)
      .order('sort_order', { ascending: true });

    if (fetchErr) throw fetchErr;
    if (!templates || templates.length === 0) throw new Error('Template path not found');

    // Get user's current max sort_order
    const { data: maxRow } = await supabase
      .from('timeline_steps')
      .select('sort_order')
      .eq('user_id', userId)
      .eq('interest_id', interestId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextSort = (maxRow?.sort_order ?? 0) + 1;

    const rows = (templates as any[]).map((t) => ({
      user_id: userId,
      interest_id: interestId,
      organization_id: orgId,
      source_type: 'template' as const,
      source_id: t.id,
      title: t.title,
      description: t.description,
      category: t.category ?? 'general',
      status: 'pending' as const,
      visibility: 'followers' as const,
      sort_order: nextSort++,
      metadata: t.metadata ?? {},
    }));

    const { data, error } = await supabase
      .from('timeline_steps')
      .insert(rows)
      .select();

    if (error) throw error;
    return (data ?? []) as TimelineStepRecord[];
  } catch (err) {
    logger.error('Failed to adopt template', err);
    throw err;
  }
}
