/**
 * Telegram tool definitions — bridges MCP Zod schemas to Anthropic Messages API format.
 *
 * Phase 1: Redeclares schemas and queries from services/mcp/tools/*.
 * Phase 2: Refactor into shared handler functions consumed by both MCP and Telegram.
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import { isFeatureAvailable } from '../subscriptions/sailorTiers';
import type { AuthContext } from '../../services/mcp/server';
import { buildStepButtons, buildCreatedStepButtons, buildPhotoAttachButtons } from './formatting';
import type { InlineKeyboardButton } from './formatting';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToolHandler = (
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  auth: AuthContext,
) => Promise<unknown>;

interface TelegramToolDef {
  name: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  handler: ToolHandler;
  requiresWrite?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers (mirrored from services/mcp/tools/step-management.ts)
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveInterestId(
  supabase: SupabaseClient,
  ref: string,
): Promise<{ id: string; name: string; slug: string } | null> {
  if (UUID_RE.test(ref)) {
    const { data } = await supabase
      .from('interests')
      .select('id, name, slug')
      .eq('id', ref)
      .maybeSingle();
    if (data) return data as { id: string; name: string; slug: string };
  }

  const { data: bySlug } = await supabase
    .from('interests')
    .select('id, name, slug')
    .eq('slug', ref.toLowerCase())
    .maybeSingle();
  if (bySlug) return bySlug as { id: string; name: string; slug: string };

  const { data: byName } = await supabase
    .from('interests')
    .select('id, name, slug')
    .ilike('name', ref)
    .maybeSingle();
  if (byName) return byName as { id: string; name: string; slug: string };

  return null;
}

// ---------------------------------------------------------------------------
// Tool registry
// ---------------------------------------------------------------------------

const TOOLS: TelegramToolDef[] = [
  // -- Student Progress ----------------------------------------------------
  {
    name: 'get_student_timeline',
    description:
      "Get the user's actual learning steps from their timeline. This is the PRIMARY tool for answering questions about what the user is working on, what's next, what's planned, or what's done. Returns up to 50 steps with their interest, optionally filtered by status or interest.",
    schema: z.object({
      status: z
        .enum(['pending', 'in_progress', 'completed', 'skipped'])
        .optional()
        .describe('Filter by step status'),
      interest: z
        .string()
        .optional()
        .describe('Filter by interest slug, name, or UUID'),
    }),
    handler: async (input, supabase, auth) => {
      let query = supabase
        .from('timeline_steps')
        .select('id, title, description, category, status, starts_at, ends_at, sort_order, interest_id, created_at, updated_at')
        .eq('user_id', auth.userId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(50);

      if (input.status) query = query.eq('status', input.status as string);

      if (input.interest) {
        const interest = await resolveInterestId(supabase, input.interest as string);
        if (interest) {
          query = query.eq('interest_id', interest.id);
        } else {
          return { error: `Could not find interest "${input.interest}". Use list_interests to see available options.` };
        }
      }

      const { data, error } = await query;
      if (error) return { error: error.message };

      // Resolve interest names (no FK exists for PostgREST join)
      const interestIds = [...new Set((data ?? []).map((s: Record<string, unknown>) => s.interest_id as string))];
      const interestMap: Record<string, { name: string; slug: string }> = {};
      if (interestIds.length > 0) {
        const { data: interests } = await supabase
          .from('interests')
          .select('id, name, slug')
          .in('id', interestIds);
        for (const i of interests ?? []) {
          interestMap[i.id] = { name: i.name, slug: i.slug };
        }
      }

      const steps = (data ?? []).map((s: Record<string, unknown>) => ({
        ...s,
        interest: interestMap[s.interest_id as string] ?? null,
      }));

      return { user_id: auth.userId, count: steps.length, steps };
    },
  },

  {
    name: 'get_step_detail',
    description: 'Get full detail for a single learning step including Plan/Act/Review metadata.',
    schema: z.object({
      step_id: z.string().describe('The timeline step ID'),
    }),
    handler: async (input, supabase) => {
      const { data, error } = await supabase
        .from('timeline_steps')
        .select('*')
        .eq('id', input.step_id as string)
        .maybeSingle();

      if (error) return { error: error.message };
      if (!data) return { error: 'Step not found' };
      return data;
    },
  },

  {
    name: 'update_step_status',
    description: 'Update the status of a learning step (e.g. mark completed, in_progress, or skipped).',
    schema: z.object({
      step_id: z.string().describe('The timeline step ID'),
      status: z
        .enum(['pending', 'in_progress', 'completed', 'skipped'])
        .describe('New status'),
    }),
    requiresWrite: true,
    handler: async (input, supabase, auth) => {
      const { data, error } = await supabase
        .from('timeline_steps')
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq('id', input.step_id as string)
        .eq('user_id', auth.userId)
        .select('id, title, status, updated_at')
        .single();

      if (error) return { error: error.message };
      return { updated: true, step: data };
    },
  },

  // -- Step Management -----------------------------------------------------
  {
    name: 'create_step',
    description:
      "Create a new learning step on the user's timeline. " +
      'The interest can be a slug (e.g. "nursing"), name, or UUID.',
    schema: z.object({
      title: z.string().describe('Step title'),
      interest: z.string().describe('Interest slug, name, or UUID'),
      description: z.string().optional().describe('Longer description'),
      category: z
        .enum(['general', 'practice', 'race', 'study', 'assessment', 'clinical', 'lab', 'field'])
        .optional()
        .describe('Step category (defaults to "general")'),
      status: z
        .enum(['pending', 'in_progress', 'completed', 'skipped'])
        .optional()
        .describe('Initial status (defaults to "pending")'),
      starts_at: z.string().optional().describe('Start date/time in ISO 8601'),
      ends_at: z.string().optional().describe('End date/time in ISO 8601'),
      plan_notes: z.string().optional().describe('Initial planning notes'),
    }),
    requiresWrite: true,
    handler: async (input, supabase, auth) => {
      const interest = await resolveInterestId(supabase, input.interest as string);
      if (!interest) {
        return { error: `Could not find interest "${input.interest}". Use list_interests to see available options.` };
      }

      const metadata = {
        plan: { notes: (input.plan_notes as string) ?? '', collaborators: [] },
        act: {},
        review: {},
      };

      const insertPayload = {
        user_id: auth.userId,
        interest_id: interest.id,
        title: input.title,
        description: input.description ?? null,
        category: input.category ?? 'general',
        status: input.status ?? 'pending',
        visibility: 'followers',
        starts_at: input.starts_at ?? new Date().toISOString(),
        ends_at: input.ends_at ?? null,
        source_type: 'manual',
        metadata,
      };
      const { data, error } = await supabase
        .from('timeline_steps')
        .insert(insertPayload)
        .select('id, title, description, category, status, starts_at, ends_at, created_at')
        .single();

      if (error) return { error: error.message };
      return { created: true, step: data, interest: { id: interest.id, name: interest.name, slug: interest.slug } };
    },
  },

  {
    name: 'update_step',
    description: 'Update an existing learning step. Can change title, description, status, plan notes, and more.',
    schema: z.object({
      step_id: z.string().describe('The timeline step ID to update'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      category: z
        .enum(['general', 'practice', 'race', 'study', 'assessment', 'clinical', 'lab', 'field'])
        .optional()
        .describe('New category'),
      status: z
        .enum(['pending', 'in_progress', 'completed', 'skipped'])
        .optional()
        .describe('New status'),
      starts_at: z.string().optional().describe('New start date/time (ISO 8601)'),
      ends_at: z.string().optional().describe('New end date/time (ISO 8601)'),
      plan_notes: z.string().optional().describe('Update the planning notes'),
    }),
    requiresWrite: true,
    handler: async (input, supabase, auth) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.category !== undefined) updates.category = input.category;
      if (input.status !== undefined) updates.status = input.status;
      if (input.starts_at !== undefined) updates.starts_at = input.starts_at;
      if (input.ends_at !== undefined) updates.ends_at = input.ends_at;

      if (input.plan_notes !== undefined) {
        const { data: existing } = await supabase
          .from('timeline_steps')
          .select('metadata')
          .eq('id', input.step_id as string)
          .single();

        const existingMeta = (existing?.metadata as Record<string, unknown>) ?? {};
        const existingPlan = (existingMeta.plan as Record<string, unknown>) ?? {};
        updates.metadata = { ...existingMeta, plan: { ...existingPlan, notes: input.plan_notes } };
      }

      const { data, error } = await supabase
        .from('timeline_steps')
        .update(updates)
        .eq('id', input.step_id as string)
        .eq('user_id', auth.userId)
        .select('id, title, description, category, status, starts_at, ends_at, updated_at')
        .single();

      if (error) return { error: error.message };
      return { updated: true, step: data };
    },
  },

  {
    name: 'list_interests',
    description:
      "List the user's active interests/subjects (those they have timeline steps for). " +
      'Also accepts a search to find any interest in the catalog.',
    schema: z.object({
      search: z.string().optional().describe('Search catalog by name (partial match). Omit to see user\'s active interests.'),
    }),
    handler: async (input, supabase, auth) => {
      if (input.search) {
        // Search the full catalog
        const { data, error } = await supabase
          .from('interests')
          .select('id, slug, name, description, type, parent_id')
          .eq('status', 'active')
          .ilike('name', `%${input.search}%`)
          .order('name', { ascending: true });
        if (error) return { error: error.message };
        return { source: 'catalog_search', count: data?.length ?? 0, interests: data ?? [] };
      }

      // Default: show interests the user actually has steps in
      const { data: steps, error } = await supabase
        .from('timeline_steps')
        .select('interest_id, interests(id, name, slug, description, type)')
        .eq('user_id', auth.userId);

      if (error) return { error: error.message };

      // Deduplicate by interest_id
      const seen = new Set<string>();
      const userInterests: unknown[] = [];
      for (const step of steps ?? []) {
        const interest = (step as Record<string, unknown>).interests as { id: string; name: string; slug: string; description: string; type: string } | null;
        if (interest && !seen.has(interest.id)) {
          seen.add(interest.id);
          userInterests.push(interest);
        }
      }

      return { source: 'user_timeline', count: userInterests.length, interests: userInterests };
    },
  },

  {
    name: 'get_suggested_next_steps',
    description:
      "Get NEW step suggestions from subscribed blueprints/curricula that the user hasn't added yet. " +
      "Only use this when the user explicitly asks for suggestions or recommendations for NEW things to add. " +
      "Do NOT use this to check what the user is currently working on — use get_student_timeline instead.",
    schema: z.object({
      interest: z.string().optional().describe('Filter by interest slug, name, or UUID'),
      limit: z.number().optional().describe('Max suggestions to return (default 5)'),
    }),
    handler: async (input, supabase, auth) => {
      const maxResults = (input.limit as number) ?? 5;

      const { data: subs, error: subError } = await supabase
        .from('blueprint_subscriptions')
        .select('blueprint_id, timeline_blueprints!inner(id, title, user_id, interest_id)')
        .eq('subscriber_id', auth.userId);

      if (subError) return { error: subError.message };
      if (!subs?.length) {
        return { suggestions: [], message: 'No subscribed blueprints. Use list_blueprints and subscribe_to_blueprint first.' };
      }

      let filteredSubs = subs;
      if (input.interest) {
        const interest = await resolveInterestId(supabase, input.interest as string);
        if (interest) {
          filteredSubs = subs.filter((s: any) => s.timeline_blueprints?.interest_id === interest.id);
        }
      }

      const { data: existingSteps } = await supabase
        .from('timeline_steps')
        .select('title')
        .eq('user_id', auth.userId);

      const existingTitles = new Set((existingSteps ?? []).map((s: any) => s.title?.toLowerCase()));

      const suggestions: {
        blueprint_title: string;
        blueprint_id: string;
        step_id: string;
        title: string;
        description: string | null;
        category: string;
        sort_order: number;
      }[] = [];

      for (const sub of filteredSubs) {
        const bp = (sub as any).timeline_blueprints;
        if (!bp) continue;

        const { data: bpSteps } = await supabase
          .from('timeline_steps')
          .select('id, title, description, category, sort_order')
          .eq('user_id', bp.user_id)
          .eq('interest_id', bp.interest_id)
          .neq('visibility', 'private')
          .order('sort_order', { ascending: true });

        for (const step of bpSteps ?? []) {
          if (!existingTitles.has((step as any).title?.toLowerCase())) {
            suggestions.push({
              blueprint_title: bp.title,
              blueprint_id: bp.id,
              step_id: (step as any).id,
              title: (step as any).title,
              description: (step as any).description,
              category: (step as any).category,
              sort_order: (step as any).sort_order,
            });
          }
        }
      }

      suggestions.sort((a, b) => a.sort_order - b.sort_order);
      return {
        count: suggestions.length,
        suggestions: suggestions.slice(0, maxResults),
        message: suggestions.length
          ? 'Use create_step to add any of these to your timeline.'
          : "You've adopted all available steps from your blueprints!",
      };
    },
  },

  // -- Competencies ---------------------------------------------------------
  {
    name: 'get_competency_dashboard',
    description: 'Get a competency dashboard summary: totals by status, by category, and overall percentage.',
    schema: z.object({}),
    handler: async (_input, supabase, auth) => {
      const { data: progress, error } = await supabase
        .from('competency_progress')
        .select('competency_id, status')
        .eq('user_id', auth.userId);

      if (error) return { error: error.message };

      const progressMap = new Map((progress ?? []).map((p: any) => [p.competency_id, p]));
      const statuses = ['not_started', 'learning', 'practicing', 'checkoff_ready', 'validated', 'competent'];
      const byStatus: Record<string, number> = {};
      for (const s of statuses) byStatus[s] = 0;

      // We can't import the full competency catalog here (it's a large config),
      // so just aggregate what's in the progress table
      for (const row of progress ?? []) {
        const s = (row as any).status ?? 'not_started';
        byStatus[s] = (byStatus[s] ?? 0) + 1;
      }

      const total = (progress ?? []).length;
      const completed = (byStatus['validated'] ?? 0) + (byStatus['competent'] ?? 0);
      const overallPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { user_id: auth.userId, total, byStatus, overallPercent };
    },
  },

  // -- Organization ---------------------------------------------------------
  {
    name: 'list_cohort_members',
    description: 'List members of an organization/cohort with profile info.',
    schema: z.object({
      organization_id: z
        .string()
        .optional()
        .describe("Organization ID (defaults to the user's organization)"),
    }),
    handler: async (input, supabase, auth) => {
      const orgId = (input.organization_id as string) || auth.clubId;
      if (!orgId) return { error: 'No organization context. Provide organization_id or ensure user has an org.' };

      const { data: memberships, error } = await supabase
        .from('organization_memberships')
        .select('user_id, role, status, joined_at')
        .eq('organization_id', orgId)
        .in('status', ['active', 'verified']);

      if (error) return { error: error.message };
      if (!memberships?.length) return { organization_id: orgId, count: 0, members: [] };

      const userIds = memberships.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji')
        .in('id', userIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const members = memberships.map((m: any) => ({
        user_id: m.user_id,
        role: m.role,
        status: m.status,
        joined_at: m.joined_at,
        display_name: profileMap.get(m.user_id)?.display_name ?? null,
      }));

      return { organization_id: orgId, count: members.length, members };
    },
  },

  {
    name: 'get_cohort_progress_summary',
    description: 'Get aggregate competency progress across all members of a cohort/organization.',
    schema: z.object({
      organization_id: z
        .string()
        .optional()
        .describe("Organization ID (defaults to the user's organization)"),
    }),
    handler: async (input, supabase, auth) => {
      const orgId = (input.organization_id as string) || auth.clubId;
      if (!orgId) return { error: 'No organization context. Provide organization_id or ensure user has an org.' };

      const { data: memberships, error: memError } = await supabase
        .from('organization_memberships')
        .select('user_id')
        .eq('organization_id', orgId)
        .in('status', ['active', 'verified']);

      if (memError) return { error: memError.message };
      if (!memberships?.length) return { organization_id: orgId, member_count: 0, summary: {} };

      const userIds = memberships.map((m: any) => m.user_id);
      const { data: progress, error: progError } = await supabase
        .from('competency_progress')
        .select('user_id, competency_id, status')
        .in('user_id', userIds);

      if (progError) return { error: progError.message };

      const statusCounts: Record<string, number> = {};
      const perStudent: Record<string, { total: number; byStatus: Record<string, number> }> = {};

      for (const row of (progress ?? []) as any[]) {
        const s = row.status ?? 'not_started';
        statusCounts[s] = (statusCounts[s] ?? 0) + 1;

        if (!perStudent[row.user_id]) perStudent[row.user_id] = { total: 0, byStatus: {} };
        perStudent[row.user_id].total++;
        perStudent[row.user_id].byStatus[s] = (perStudent[row.user_id].byStatus[s] ?? 0) + 1;
      }

      const completionRates = Object.values(perStudent).map(s => {
        const done = (s.byStatus['validated'] ?? 0) + (s.byStatus['competent'] ?? 0);
        return s.total > 0 ? Math.round((done / s.total) * 100) : 0;
      });

      const avgCompletion = completionRates.length > 0
        ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
        : 0;

      return {
        organization_id: orgId,
        member_count: userIds.length,
        total_progress_records: (progress ?? []).length,
        statusCounts,
        avgCompletionPercent: avgCompletion,
        completionDistribution: {
          min: completionRates.length > 0 ? Math.min(...completionRates) : 0,
          max: completionRates.length > 0 ? Math.max(...completionRates) : 0,
          avg: avgCompletion,
        },
      };
    },
  },

  // -- Nutrition Logging ----------------------------------------------------
  {
    name: 'log_nutrition',
    description:
      'Log nutrition entries extracted from a meal description or photo analysis. ' +
      'Use this after analyzing what the user ate (from text or a food photo).',
    schema: z.object({
      entries: z.array(z.object({
        description: z.string().describe('Food/drink description'),
        meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other']).optional(),
        calories: z.number().optional(),
        protein_g: z.number().optional(),
        carbs_g: z.number().optional(),
        fat_g: z.number().optional(),
        fiber_g: z.number().optional(),
        water_oz: z.number().optional(),
        confidence: z.enum(['exact', 'estimated', 'rough']).optional(),
      })).describe('Array of nutrition entries to log'),
    }),
    requiresWrite: true,
    handler: async (input, supabase, auth) => {
      const entries = input.entries as Record<string, unknown>[];
      if (!entries?.length) return { error: 'No entries provided' };

      const inserted: unknown[] = [];
      const errors: string[] = [];

      for (const entry of entries) {
        const row = {
          user_id: auth.userId,
          description: entry.description,
          meal_type: entry.meal_type ?? 'other',
          calories: entry.calories ?? null,
          protein_g: entry.protein_g ?? null,
          carbs_g: entry.carbs_g ?? null,
          fat_g: entry.fat_g ?? null,
          fiber_g: entry.fiber_g ?? null,
          water_oz: entry.water_oz ?? null,
          confidence: entry.confidence ?? 'estimated',
          logged_at: new Date().toISOString(),
          source: 'telegram',
        };

        const { data, error } = await supabase
          .from('nutrition_entries')
          .insert(row)
          .select('id, description, meal_type, calories, protein_g, carbs_g, fat_g')
          .single();

        if (error) {
          errors.push(`${entry.description}: ${error.message}`);
        } else {
          inserted.push(data);
        }
      }

      return {
        logged: inserted.length,
        entries: inserted,
        ...(errors.length > 0 ? { errors } : {}),
      };
    },
  },

  // -- Evidence Attachment ---------------------------------------------------
  {
    name: 'attach_step_evidence',
    description:
      'Attach a photo or note as evidence to a step\'s Act tab. ' +
      'Use this when the user sends a photo or voice note documenting what they did for a step. ' +
      'The photo must have already been uploaded — pass the photo_url provided by the system. ' +
      'You can also add a text caption/note describing the evidence.',
    schema: z.object({
      step_id: z.string().describe('The timeline step ID to attach evidence to'),
      photo_url: z.string().optional().describe('URL of the uploaded photo (provided by system)'),
      caption: z.string().optional().describe('Description of the evidence'),
      notes: z.string().optional().describe('Additional notes to add to the act tab'),
    }),
    requiresWrite: true,
    handler: async (input, supabase, auth) => {
      console.log('[attach_step_evidence] input:', JSON.stringify({
        step_id: input.step_id,
        photo_url: input.photo_url ? `${(input.photo_url as string).slice(0, 80)}...` : null,
        caption: input.caption,
        notes: input.notes,
      }));

      // Fetch current step metadata
      const { data: step, error: fetchError } = await supabase
        .from('timeline_steps')
        .select('id, title, metadata')
        .eq('id', input.step_id as string)
        .eq('user_id', auth.userId)
        .single();

      if (fetchError || !step) {
        console.error('[attach_step_evidence] step fetch failed:', fetchError?.message);
        return { error: fetchError?.message ?? 'Step not found' };
      }

      const metadata = (step.metadata as Record<string, unknown>) ?? {};
      const act = (metadata.act as Record<string, unknown>) ?? {};
      const existingUploads = (act.media_uploads as { id: string; uri: string; type: string; caption?: string }[]) ?? [];

      const updates: Record<string, unknown> = {};

      // Add photo as media upload
      if (input.photo_url) {
        const newUpload = {
          id: `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          uri: input.photo_url as string,
          type: 'photo',
          caption: (input.caption as string) || undefined,
        };
        updates.media_uploads = [...existingUploads, newUpload];
        console.log('[attach_step_evidence] adding upload:', newUpload.id, 'total:', (updates.media_uploads as unknown[]).length);
      } else {
        console.warn('[attach_step_evidence] no photo_url provided!');
      }

      // Add/append notes
      if (input.notes) {
        const existingNotes = (act.notes as string) ?? '';
        const timestamp = new Date().toISOString().split('T')[0];
        const newNote = `[${timestamp} via Telegram] ${input.notes}`;
        updates.notes = existingNotes ? `${existingNotes}\n\n${newNote}` : newNote;
      }

      // Set started_at if not already set
      if (!act.started_at) {
        updates.started_at = new Date().toISOString();
      }

      // Deep merge into metadata
      const updatedMetadata = {
        ...metadata,
        act: { ...act, ...updates },
      };

      // Check current step status — if pending, auto-advance to in_progress
      const { data: currentStep } = await supabase
        .from('timeline_steps')
        .select('status')
        .eq('id', input.step_id as string)
        .single();

      const stepUpdate: Record<string, unknown> = {
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      };
      if (currentStep?.status === 'pending') {
        stepUpdate.status = 'in_progress';
      }

      // Use .select() to verify the update actually modified a row
      const { data: updated, error: updateError } = await supabase
        .from('timeline_steps')
        .update(stepUpdate)
        .eq('id', input.step_id as string)
        .eq('user_id', auth.userId)
        .select('id, metadata')
        .single();

      if (updateError) {
        console.error('[attach_step_evidence] update failed:', updateError.message);
        return { error: updateError.message };
      }

      const updatedAct = (updated?.metadata as Record<string, unknown>)?.act as Record<string, unknown> | undefined;
      const finalUploads = (updatedAct?.media_uploads as unknown[]) ?? [];
      console.log('[attach_step_evidence] success! uploads after save:', finalUploads.length);

      return {
        attached: true,
        step_id: step.id,
        step_title: step.title,
        evidence_count: finalUploads.length,
        has_notes: !!updates.notes,
      };
    },
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert tool definitions to Anthropic Messages API format.
 */
export function getAnthropicTools(): Tool[] {
  return TOOLS.map(tool => {
    const jsonSchema = zodToJsonSchema(tool.schema, { target: 'openApi3' });
    // Remove $schema and other top-level keys that Anthropic doesn't expect
    const { $schema, ...inputSchema } = jsonSchema as Record<string, unknown>;
    return {
      name: tool.name,
      description: tool.description,
      input_schema: inputSchema as Tool['input_schema'],
    };
  });
}

/**
 * Execute a tool by name. Returns the JSON-serialized result.
 */
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  auth: AuthContext,
): Promise<string> {
  const tool = TOOLS.find(t => t.name === name);
  if (!tool) return JSON.stringify({ error: `Unknown tool: ${name}` });

  // Check write tier gating — Telegram write ops require Plus or higher
  if (tool.requiresWrite && auth.tier === 'free') {
    return JSON.stringify({
      error: `You need a Plus subscription to create new steps. Your account is currently on the free plan.`,
      required_tier: 'plus',
      current_tier: auth.tier,
    });
  }

  try {
    const result = await tool.handler(input, supabase, auth);
    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error);
    return JSON.stringify({ error: `Tool execution failed: ${String(error)}` });
  }
}

/**
 * Generate inline keyboard buttons based on tool results.
 * When `hasPendingPhoto` is true, adds "Attach photo to: Step" buttons
 * so the user can attach their photo to an existing step via button tap.
 * Returns null if no buttons are appropriate for this tool/result.
 */
export function getToolResponseKeyboard(
  toolName: string,
  resultJson: string,
  hasPendingPhoto = false,
): InlineKeyboardButton[][] | null {
  try {
    const result = JSON.parse(resultJson);
    if (result.error) return null;

    switch (toolName) {
      case 'get_student_timeline': {
        const steps = result.steps as { id: string; title: string; status: string }[] | undefined;
        if (!steps?.length) return null;

        if (hasPendingPhoto) {
          // Show "Attach photo" buttons instead of Start/Done
          const attachButtons = buildPhotoAttachButtons(steps);
          return attachButtons.length > 0 ? attachButtons : null;
        }

        const buttons = buildStepButtons(steps);
        return buttons.length > 0 ? buttons : null;
      }

      case 'create_step': {
        const stepId = result.step?.id as string | undefined;
        if (!stepId) return null;
        return buildCreatedStepButtons(stepId);
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}
