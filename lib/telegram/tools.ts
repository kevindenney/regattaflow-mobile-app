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
        .select('id, title, description, category, status, starts_at, ends_at, sort_order, interest_id, created_at, updated_at, interests(id, name, slug)')
        .eq('user_id', auth.userId)
        .order('sort_order', { ascending: true })
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
      return { user_id: auth.userId, count: data?.length ?? 0, steps: data ?? [] };
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
      console.log('[create_step] input:', JSON.stringify(input));
      console.log('[create_step] auth:', JSON.stringify(auth));

      const interest = await resolveInterestId(supabase, input.interest as string);
      console.log('[create_step] resolved interest:', JSON.stringify(interest));
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
      console.log('[create_step] inserting:', JSON.stringify(insertPayload));

      const { data, error } = await supabase
        .from('timeline_steps')
        .insert(insertPayload)
        .select('id, title, description, category, status, starts_at, ends_at, created_at')
        .single();

      console.log('[create_step] result:', JSON.stringify({ data, error }));
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
