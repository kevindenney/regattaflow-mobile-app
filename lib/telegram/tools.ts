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
import { buildStepButtons, buildCreatedStepButtons, buildPhotoAttachButtons, buildSubStepButtons } from './formatting';
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
    description:
      'Get full detail for a single learning step including sub-steps with progress, ' +
      'evidence count, nutrition status, and Plan/Act/Review metadata. ' +
      'Use this to see sub-step checklists before toggling them.',
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

      // Parse metadata for structured sub-step info
      const metadata = (data.metadata as Record<string, unknown>) ?? {};
      const plan = (metadata.plan as Record<string, unknown>) ?? {};
      const act = (metadata.act as Record<string, unknown>) ?? {};
      const subSteps = (plan.how_sub_steps as { id: string; text: string; sort_order: number }[]) ?? [];
      const progress = (act.sub_step_progress as Record<string, boolean>) ?? {};
      const deviations = (act.sub_step_deviations as Record<string, string>) ?? {};
      const overrides = (act.sub_step_overrides as Record<string, string>) ?? {};
      const mediaUploads = (act.media_uploads as unknown[]) ?? [];
      const nutrition = act.nutrition as { entries?: unknown[] } | undefined;
      const measurements = act.measurements as { extracted?: unknown[] } | undefined;

      const completedCount = subSteps.filter(ss => progress[ss.id]).length;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        category: data.category,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
        interest_id: data.interest_id,
        sub_steps: subSteps.map(ss => ({
          id: ss.id,
          text: overrides[ss.id] || ss.text,
          completed: progress[ss.id] ?? false,
          deviation: deviations[ss.id] ?? null,
        })),
        sub_step_summary: subSteps.length > 0 ? `${completedCount}/${subSteps.length} done` : 'No sub-steps',
        evidence_count: mediaUploads.length,
        has_nutrition: !!(nutrition?.entries?.length),
        has_measurements: !!(measurements?.extracted?.length),
        plan_what: plan.what_will_you_do ?? null,
        plan_why: plan.why_reasoning ?? null,
        notes: act.notes ?? null,
      };
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
      starts_at: z.string().optional().describe('DEPRECATED — use date_offset_days instead. Only use for absolute ISO 8601 dates the user explicitly provides (e.g. "2026-04-15").'),
      date_offset_days: z.number().optional().describe('Days from today: 0 = today, 1 = tomorrow, 7 = next week, -1 = yesterday. Use this for relative dates like "tomorrow", "next week", etc.'),
      time_of_day: z.string().optional().describe('Time in HH:MM 24h format (e.g. "14:00" for 2pm). Only if user specifies a time.'),
      ends_at: z.string().optional().describe('End date/time in ISO 8601'),
      plan_notes: z.string().optional().describe('Initial planning notes'),
      what_will_you_do: z.string().optional().describe('What the user plans to do — the main focus/goal of the session'),
      why_reasoning: z.string().optional().describe('Why this step is the right next thing to work on'),
      sub_steps: z.array(z.string()).optional().describe('Ordered list of sub-step texts (e.g. ["Warm up", "Practice drills", "Cool down"])'),
      competency_ids: z.array(z.string()).optional().describe('Competency UUIDs to link to this step'),
      capability_goals: z.array(z.string()).optional().describe('Free-text skill goals (e.g. ["vein selection", "sterile technique"])'),
      location_name: z.string().optional().describe('Where the session will take place'),
    }),
    requiresWrite: true,
    handler: async (input, supabase, auth) => {
      const serverNow = new Date();

      // Resolve date server-side to avoid LLM date hallucination
      let resolvedDate: Date;
      const offsetDays = input.date_offset_days as number | undefined;
      const timeOfDay = input.time_of_day as string | undefined;

      if (offsetDays !== undefined && offsetDays !== null) {
        // Preferred path: offset from server's "today"
        resolvedDate = new Date(serverNow);
        resolvedDate.setUTCDate(resolvedDate.getUTCDate() + offsetDays);
        console.log(`[create_step] Date from offset: ${offsetDays} days → ${resolvedDate.toISOString().split('T')[0]}`);
      } else if (input.starts_at) {
        // Fallback: validate LLM-provided ISO date isn't hallucinated
        const parsed = new Date(input.starts_at as string);
        const diffMs = Math.abs(parsed.getTime() - serverNow.getTime());
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (isNaN(parsed.getTime()) || diffDays > 365) {
          // Date is invalid or more than a year off — likely hallucinated
          console.warn(`[create_step] Rejected hallucinated starts_at: ${input.starts_at} (server: ${serverNow.toISOString()})`);
          resolvedDate = serverNow;
        } else {
          resolvedDate = parsed;
          console.log(`[create_step] Using validated starts_at: ${input.starts_at}`);
        }
      } else {
        resolvedDate = serverNow;
        console.log(`[create_step] No date provided, using today: ${serverNow.toISOString().split('T')[0]}`);
      }

      // Apply time of day if provided
      if (timeOfDay) {
        const [hours, minutes] = timeOfDay.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          resolvedDate.setUTCHours(hours, minutes, 0, 0);
        }
      }

      const startsAtISO = resolvedDate.toISOString();
      console.log(`[create_step] Final starts_at: ${startsAtISO} (title: ${input.title})`);

      const interest = await resolveInterestId(supabase, input.interest as string);
      if (!interest) {
        return { error: `Could not find interest "${input.interest}". Use list_interests to see available options.` };
      }

      // Build sub-steps with IDs
      const subSteps = (input.sub_steps as string[] | undefined)?.map((text, i) => ({
        id: `ss-${Date.now()}-${i}`,
        text,
        sort_order: i,
        completed: false,
      })) ?? [];

      const metadata = {
        plan: {
          what_will_you_do: (input.what_will_you_do as string) ?? (input.plan_notes as string) ?? '',
          why_reasoning: (input.why_reasoning as string) ?? '',
          how_sub_steps: subSteps,
          competency_ids: (input.competency_ids as string[]) ?? [],
          capability_goals: (input.capability_goals as string[]) ?? [],
          where_location: (input.location_name as string) ? { name: input.location_name as string } : undefined,
          collaborators: [],
        },
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
        starts_at: startsAtISO,
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
    description: 'Update an existing learning step. Can change title, description, status, and structured plan fields.',
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
      what_will_you_do: z.string().optional().describe('What the user plans to do'),
      why_reasoning: z.string().optional().describe('Why this step matters'),
      sub_steps: z.array(z.string()).optional().describe('Replace sub-steps with this list of texts'),
      competency_ids: z.array(z.string()).optional().describe('Competency UUIDs to link'),
      capability_goals: z.array(z.string()).optional().describe('Free-text skill goals'),
      location_name: z.string().optional().describe('Where the session takes place'),
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

      // Check if any plan metadata fields need updating
      const planFields = ['plan_notes', 'what_will_you_do', 'why_reasoning', 'sub_steps', 'competency_ids', 'capability_goals', 'location_name'] as const;
      const hasPlanUpdates = planFields.some(f => input[f] !== undefined);

      if (hasPlanUpdates) {
        const { data: existing } = await supabase
          .from('timeline_steps')
          .select('metadata')
          .eq('id', input.step_id as string)
          .single();

        const existingMeta = (existing?.metadata as Record<string, unknown>) ?? {};
        const existingPlan = (existingMeta.plan as Record<string, unknown>) ?? {};
        const planUpdates: Record<string, unknown> = {};

        if (input.plan_notes !== undefined) planUpdates.notes = input.plan_notes;
        if (input.what_will_you_do !== undefined) planUpdates.what_will_you_do = input.what_will_you_do;
        if (input.why_reasoning !== undefined) planUpdates.why_reasoning = input.why_reasoning;
        if (input.competency_ids !== undefined) planUpdates.competency_ids = input.competency_ids;
        if (input.capability_goals !== undefined) planUpdates.capability_goals = input.capability_goals;
        if (input.location_name !== undefined) planUpdates.where_location = { name: input.location_name };
        if (input.sub_steps !== undefined) {
          planUpdates.how_sub_steps = (input.sub_steps as string[]).map((text, i) => ({
            id: `ss-${Date.now()}-${i}`,
            text,
            sort_order: i,
            completed: false,
          }));
        }

        updates.metadata = { ...existingMeta, plan: { ...existingPlan, ...planUpdates } };
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

  // -- Sub-step Management --------------------------------------------------
  {
    name: 'toggle_sub_step',
    description:
      'Mark a sub-step as done or undone. Use get_step_detail first to see the ' +
      'sub-step IDs and their current progress. Reports updated progress (e.g. "3/5 done").',
    schema: z.object({
      step_id: z.string().describe('The timeline step ID'),
      sub_step_id: z.string().describe('The sub-step ID to toggle'),
      completed: z.boolean().describe('Mark as done (true) or undone (false)'),
    }),
    requiresWrite: true,
    handler: async (input, supabase, auth) => {
      const { data: step, error: fetchErr } = await supabase
        .from('timeline_steps')
        .select('metadata, status')
        .eq('id', input.step_id as string)
        .eq('user_id', auth.userId)
        .single();

      if (fetchErr || !step) return { error: fetchErr?.message ?? 'Step not found' };

      const metadata = (step.metadata as Record<string, unknown>) ?? {};
      const plan = (metadata.plan as Record<string, unknown>) ?? {};
      const act = (metadata.act as Record<string, unknown>) ?? {};
      const subSteps = (plan.how_sub_steps as { id: string; text: string }[]) ?? [];
      const progress = (act.sub_step_progress as Record<string, boolean>) ?? {};

      // Verify the sub-step exists
      const subStep = subSteps.find(ss => ss.id === input.sub_step_id);
      if (!subStep) return { error: `Sub-step "${input.sub_step_id}" not found in this step` };

      const updatedProgress = { ...progress, [input.sub_step_id as string]: input.completed as boolean };
      const completedCount = subSteps.filter(ss => updatedProgress[ss.id]).length;

      const stepUpdate: Record<string, unknown> = {
        metadata: { ...metadata, act: { ...act, sub_step_progress: updatedProgress } },
        updated_at: new Date().toISOString(),
      };
      // Auto-advance pending steps to in_progress when sub-steps are toggled
      if (step.status === 'pending') {
        stepUpdate.status = 'in_progress';
      }

      const { error: updateErr } = await supabase
        .from('timeline_steps')
        .update(stepUpdate)
        .eq('id', input.step_id as string)
        .eq('user_id', auth.userId);

      if (updateErr) return { error: updateErr.message };

      return {
        toggled: true,
        sub_step_title: subStep.text,
        completed: input.completed,
        progress: `${completedCount}/${subSteps.length} done`,
      };
    },
  },

  {
    name: 'log_sub_step_deviation',
    description:
      'Record what the user actually did instead of a planned sub-step. ' +
      'Use this when the user says they did something different from the plan.',
    schema: z.object({
      step_id: z.string().describe('The timeline step ID'),
      sub_step_id: z.string().describe('The sub-step ID'),
      deviation: z.string().describe('What the user actually did instead of the planned sub-step'),
    }),
    requiresWrite: true,
    handler: async (input, supabase, auth) => {
      const { data: step, error: fetchErr } = await supabase
        .from('timeline_steps')
        .select('metadata')
        .eq('id', input.step_id as string)
        .eq('user_id', auth.userId)
        .single();

      if (fetchErr || !step) return { error: fetchErr?.message ?? 'Step not found' };

      const metadata = (step.metadata as Record<string, unknown>) ?? {};
      const plan = (metadata.plan as Record<string, unknown>) ?? {};
      const act = (metadata.act as Record<string, unknown>) ?? {};
      const subSteps = (plan.how_sub_steps as { id: string; text: string }[]) ?? [];
      const deviations = (act.sub_step_deviations as Record<string, string>) ?? {};

      const subStep = subSteps.find(ss => ss.id === input.sub_step_id);
      if (!subStep) return { error: `Sub-step "${input.sub_step_id}" not found` };

      const updatedDeviations = { ...deviations, [input.sub_step_id as string]: input.deviation as string };

      const { error: updateErr } = await supabase
        .from('timeline_steps')
        .update({
          metadata: { ...metadata, act: { ...act, sub_step_deviations: updatedDeviations } },
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.step_id as string)
        .eq('user_id', auth.userId);

      if (updateErr) return { error: updateErr.message };

      return {
        recorded: true,
        sub_step_title: subStep.text,
        deviation: input.deviation,
      };
    },
  },

  // -- Competency Assessment -------------------------------------------------
  {
    name: 'analyze_step',
    description:
      'Get full step data for competency analysis: planned competencies, evidence, progress, and history. ' +
      'Use when the user asks how they did, whether they demonstrated a skill, or to review progress on a step. ' +
      'YOU (the assistant) should analyze the returned data and provide the competency assessment directly.',
    schema: z.object({
      step_id: z.string().describe('The timeline step ID to analyze'),
    }),
    handler: async (input, supabase, auth) => {
      // 1. Fetch the step
      const { data: step, error: stepErr } = await supabase
        .from('timeline_steps')
        .select('id, title, description, status, interest_id, metadata, starts_at')
        .eq('id', input.step_id as string)
        .eq('user_id', auth.userId)
        .single();

      if (stepErr || !step) return { error: stepErr?.message ?? 'Step not found' };

      const metadata = (step.metadata as Record<string, unknown>) ?? {};
      const plan = (metadata.plan as Record<string, unknown>) ?? {};
      const act = (metadata.act as Record<string, unknown>) ?? {};
      const review = (metadata.review as Record<string, unknown>) ?? {};

      // 2. Fetch planned competency definitions
      const competencyIds = (plan.competency_ids as string[]) ?? [];
      let plannedCompetencies: { id: string; title: string; category: string; description: string | null; status?: string; attempts?: number }[] = [];
      if (competencyIds.length) {
        const { data: comps } = await supabase
          .from('betterat_competencies')
          .select('id, title, category, description')
          .in('id', competencyIds);

        const { data: progressRows } = await supabase
          .from('betterat_competency_progress')
          .select('competency_id, status, attempts_count')
          .eq('user_id', auth.userId)
          .in('competency_id', competencyIds);
        const progressMap = new Map((progressRows ?? []).map(r => [r.competency_id, r]));

        plannedCompetencies = (comps ?? []).map(c => {
          const prog = progressMap.get(c.id);
          return { ...c, status: prog?.status ?? 'not_started', attempts: prog?.attempts_count ?? 0 };
        });
      }

      // 3. Build evidence summary
      const subSteps = (plan.how_sub_steps as { id: string; text: string }[]) ?? [];
      const subProgress = (act.sub_step_progress as Record<string, boolean>) ?? {};
      const subDeviations = (act.sub_step_deviations as Record<string, string>) ?? {};
      const mediaUploads = (act.media_uploads as { caption?: string; type: string }[]) ?? [];
      const nutrition = act.nutrition as { entries?: { calories?: number }[] } | undefined;
      const measurements = act.measurements as { extracted?: { extracted_from_text?: string }[] } | undefined;
      const capabilityRatings = (review.capability_progress as Record<string, number>) ?? {};

      // 4. Fetch recent step history for context (lightweight)
      const { data: historySteps } = await supabase
        .from('timeline_steps')
        .select('title, status, starts_at')
        .eq('user_id', auth.userId)
        .eq('interest_id', step.interest_id)
        .in('status', ['completed', 'in_progress'])
        .neq('id', step.id)
        .order('starts_at', { ascending: false })
        .limit(5);

      // Return all data for Claude to analyze directly — no nested AI call
      return {
        instruction: 'Analyze this step data. For each planned competency, assess whether the evidence demonstrates it (initial_exposure / developing / proficient / not_demonstrated). Identify gaps and suggest next steps. Be specific and concise.',
        step: {
          title: step.title,
          status: step.status,
          plan: plan.what_will_you_do || null,
          capability_goals: plan.capability_goals ?? [],
        },
        planned_competencies: plannedCompetencies,
        evidence: {
          notes: act.notes || null,
          photos_videos: mediaUploads.length,
          photo_captions: mediaUploads.filter((m: { caption?: string }) => m.caption).map((m: { caption?: string }) => m.caption),
          sub_steps_completed: `${subSteps.filter(ss => subProgress[ss.id]).length}/${subSteps.length}`,
          sub_step_deviations: Object.keys(subDeviations).length > 0 ? subDeviations : null,
          measurements: (measurements?.extracted ?? []).slice(0, 5).map(m => m.extracted_from_text).filter(Boolean),
          nutrition_entries: nutrition?.entries?.length ?? 0,
          nutrition_calories: nutrition?.entries?.reduce((s, e) => s + (e.calories ?? 0), 0) ?? 0,
        },
        self_ratings: Object.keys(capabilityRatings).length > 0 ? capabilityRatings : null,
        recent_history: (historySteps ?? []).map(s => ({ title: s.title, status: s.status })),
      };
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

  {
    name: 'get_competency_gaps',
    description:
      'Get competency gaps for an interest: which framework competencies are not yet demonstrated, ' +
      'which are in progress, and recommended focus areas. Use when the user asks what to work on next, ' +
      'what skills they are missing, or their progress toward certification.',
    schema: z.object({
      interest_id: z.string().optional().describe('Interest ID (defaults to first interest with competencies)'),
    }),
    handler: async (input, supabase, auth) => {
      // Resolve interest — check user_interests first, fall back to timeline_steps
      let interestId = input.interest_id as string | undefined;
      if (!interestId) {
        // Try user_interests table first
        const { data: interests, error: uiErr } = await supabase
          .from('user_interests')
          .select('interest_id')
          .eq('user_id', auth.userId)
          .limit(5);

        const interestIds = (interests ?? []).map((ui: any) => ui.interest_id);

        // Fall back to distinct interest_ids from timeline_steps
        if (!interestIds.length) {
          const { data: stepInterests } = await supabase
            .from('timeline_steps')
            .select('interest_id')
            .eq('user_id', auth.userId)
            .limit(50);
          const unique = [...new Set((stepInterests ?? []).map((s: any) => s.interest_id).filter(Boolean))];
          interestIds.push(...unique);
        }

        if (!interestIds.length) return { error: 'No interests found' };

        // Find the first interest that has competencies
        for (const iid of interestIds) {
          const { count } = await supabase
            .from('betterat_competencies')
            .select('id', { count: 'exact', head: true })
            .eq('interest_id', iid);
          if ((count ?? 0) > 0) { interestId = iid; break; }
        }
        if (!interestId) return { error: 'No competency frameworks found for your interests' };
      }

      // Fetch all competencies for this interest
      const { data: competencies, error: compErr } = await supabase
        .from('betterat_competencies')
        .select('id, title, category, description, requires_supervision')
        .eq('interest_id', interestId)
        .order('sort_order', { ascending: true });

      if (compErr || !competencies?.length) return { error: compErr?.message ?? 'No competencies found' };

      // Fetch user's progress
      const { data: progressRows } = await supabase
        .from('betterat_competency_progress')
        .select('competency_id, status, attempts_count')
        .eq('user_id', auth.userId);

      const progressMap = new Map((progressRows ?? []).map(r => [r.competency_id, r]));

      // Build gap list: everything not yet competent
      const gaps = competencies
        .map(c => {
          const prog = progressMap.get(c.id);
          return {
            competency_id: c.id,
            title: c.title,
            category: c.category,
            status: prog?.status ?? 'not_started',
            attempts: prog?.attempts_count ?? 0,
            requires_supervision: c.requires_supervision,
          };
        })
        .filter(g => g.status !== 'competent' && g.status !== 'validated');

      const total = competencies.length;
      const demonstrated = total - gaps.length;

      return {
        interest_id: interestId,
        total_competencies: total,
        demonstrated,
        completion_pct: total > 0 ? Math.round((demonstrated / total) * 100) : 0,
        gaps: gaps.slice(0, 10),
        gap_count: gaps.length,
      };
    },
  },

  {
    name: 'suggest_next_step_for_competency',
    description:
      'Get context for suggesting a practice session for a specific competency. ' +
      'Returns the competency definition, user attempt history, and recent related steps. ' +
      'Use when the user asks HOW to practice a specific skill or wants a session plan for a competency.',
    schema: z.object({
      competency_id: z.string().describe('The competency ID to suggest a practice session for'),
    }),
    handler: async (input, supabase, auth) => {
      // 1. Fetch the competency definition
      const { data: comp, error: compErr } = await supabase
        .from('betterat_competencies')
        .select('id, title, category, description, requires_supervision, interest_id')
        .eq('id', input.competency_id as string)
        .single();

      if (compErr || !comp) return { error: compErr?.message ?? 'Competency not found' };

      // 2. Fetch the interest name
      const { data: interest } = await supabase
        .from('interests')
        .select('name')
        .eq('id', comp.interest_id)
        .single();

      // 3. Fetch user's progress on this competency
      const { data: progress } = await supabase
        .from('betterat_competency_progress')
        .select('status, attempts_count, last_assessed_at')
        .eq('user_id', auth.userId)
        .eq('competency_id', comp.id)
        .maybeSingle();

      // 4. Fetch recent steps that had this competency planned
      const { data: recentSteps } = await supabase
        .from('timeline_steps')
        .select('title, status, starts_at, metadata')
        .eq('user_id', auth.userId)
        .eq('interest_id', comp.interest_id)
        .in('status', ['completed', 'in_progress'])
        .order('starts_at', { ascending: false })
        .limit(5);

      const relatedSteps = (recentSteps ?? [])
        .filter((s: any) => {
          const compIds = (s.metadata?.plan?.competency_ids as string[]) ?? [];
          return compIds.includes(comp.id);
        })
        .map((s: any) => ({
          title: s.title,
          status: s.status,
          plan: s.metadata?.plan?.what_will_you_do || null,
          learned: s.metadata?.review?.what_learned || null,
        }));

      return {
        instruction: `Suggest a focused practice session for the competency "${comp.title}". Include a session title, 3-5 sub-steps, and a rationale. Consider the user's current level and past attempts. Be specific and actionable.`,
        competency: {
          title: comp.title,
          category: comp.category,
          description: comp.description,
          requires_supervision: comp.requires_supervision,
        },
        interest: interest?.name ?? 'unknown',
        user_progress: {
          status: progress?.status ?? 'not_started',
          attempts: progress?.attempts_count ?? 0,
          last_assessed: progress?.last_assessed_at ?? null,
        },
        related_past_steps: relatedSteps,
      };
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
      'Use this after analyzing what the user ate (from text or a food photo). ' +
      'If step_id is provided, nutrition data will also be attached to the step so it ' +
      'appears in the Review tab. Always provide step_id when you know which step this relates to.',
    schema: z.object({
      step_id: z.string().optional().describe('Step ID to attach nutrition data to (makes it visible in Review tab)'),
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
      const now = new Date().toISOString();

      // Insert into nutrition_entries table (for analytics/history)
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
          logged_at: now,
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

      // Also write to step metadata so nutrition shows in Review tab
      let stepAttached = false;
      if (input.step_id && inserted.length > 0) {
        const { data: step } = await supabase
          .from('timeline_steps')
          .select('metadata')
          .eq('id', input.step_id as string)
          .eq('user_id', auth.userId)
          .single();

        if (step) {
          const metadata = (step.metadata as Record<string, unknown>) ?? {};
          const act = (metadata.act as Record<string, unknown>) ?? {};
          const existingNutrition = (act.nutrition as { entries?: unknown[] }) ?? {};
          const existingEntries = (existingNutrition.entries as Record<string, unknown>[]) ?? [];

          // Build StepNutritionEntry objects for step metadata
          const newStepEntries = entries.map((entry, i) => ({
            id: `tg_nutr_${Date.now()}_${i}`,
            description: entry.description,
            meal_type: entry.meal_type ?? 'other',
            calories: entry.calories ?? undefined,
            protein_g: entry.protein_g ?? undefined,
            carbs_g: entry.carbs_g ?? undefined,
            fat_g: entry.fat_g ?? undefined,
            fiber_g: entry.fiber_g ?? undefined,
            water_oz: entry.water_oz ?? undefined,
            confidence: entry.confidence ?? 'estimated',
            source: 'telegram',
            verified: false,
            timestamp: now,
          }));

          const updatedMetadata = {
            ...metadata,
            act: {
              ...act,
              nutrition: {
                ...existingNutrition,
                entries: [...existingEntries, ...newStepEntries],
                last_extracted_at: now,
              },
            },
          };

          const { error: updateErr } = await supabase
            .from('timeline_steps')
            .update({ metadata: updatedMetadata, updated_at: now })
            .eq('id', input.step_id as string)
            .eq('user_id', auth.userId);

          stepAttached = !updateErr;
        }
      }

      return {
        logged: inserted.length,
        entries: inserted,
        step_attached: stepAttached,
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
      // Resolve photo URL: prefer explicit input, fallback to pending_photo_url from conversation
      const inputPhotoUrl = (input.photo_url as string) || '';
      let photoUrl = inputPhotoUrl;

      if (!photoUrl) {
        const { data: convo } = await supabase
          .from('telegram_conversations')
          .select('pending_photo_url')
          .eq('user_id', auth.userId)
          .maybeSingle();
        photoUrl = (convo?.pending_photo_url as string) || '';
      }

      // Fail early if no photo URL available from any source
      if (!photoUrl && !input.notes) {
        return { error: 'No photo_url provided and no pending photo found. Send a photo first.' };
      }

      // Fetch current step metadata
      const { data: step, error: fetchError } = await supabase
        .from('timeline_steps')
        .select('id, title, metadata, status')
        .eq('id', input.step_id as string)
        .eq('user_id', auth.userId)
        .single();

      if (fetchError || !step) {
        return { error: fetchError?.message ?? 'Step not found' };
      }

      const metadata = (step.metadata as Record<string, unknown>) ?? {};
      const act = (metadata.act as Record<string, unknown>) ?? {};
      const existingUploads = (act.media_uploads as { id: string; uri: string; type: string; caption?: string }[]) ?? [];

      // Build new uploads array — always include existing uploads
      const newUploads = [...existingUploads];
      if (photoUrl) {
        newUploads.push({
          id: `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          uri: photoUrl,
          type: 'photo',
          caption: (input.caption as string) || undefined,
        });
      }

      const actUpdates: Record<string, unknown> = {
        media_uploads: newUploads,
      };

      // Add/append notes
      if (input.notes) {
        const existingNotes = (act.notes as string) ?? '';
        const timestamp = new Date().toISOString().split('T')[0];
        const newNote = `[${timestamp} via Telegram] ${input.notes}`;
        actUpdates.notes = existingNotes ? `${existingNotes}\n\n${newNote}` : newNote;
      }

      // Set started_at if not already set
      if (!act.started_at) {
        actUpdates.started_at = new Date().toISOString();
      }

      // Deep merge into metadata — preserve all existing act fields
      const updatedMetadata = {
        ...metadata,
        act: { ...act, ...actUpdates },
      };

      // Build update payload — auto-advance pending steps to in_progress
      const stepUpdate: Record<string, unknown> = {
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      };
      if (step.status === 'pending') {
        stepUpdate.status = 'in_progress';
      }

      const { data: updated, error: updateError } = await supabase
        .from('timeline_steps')
        .update(stepUpdate)
        .eq('id', input.step_id as string)
        .eq('user_id', auth.userId)
        .select('id, metadata')
        .single();

      if (updateError) {
        return { error: updateError.message };
      }

      if (!updated) {
        return { error: 'Update matched no rows — step may not belong to this user' };
      }

      const updatedAct = (updated.metadata as Record<string, unknown>)?.act as Record<string, unknown> | undefined;
      const finalUploads = (updatedAct?.media_uploads as unknown[]) ?? [];

      // Clear pending photo now that it's been attached
      if (photoUrl) {
        await supabase
          .from('telegram_conversations')
          .update({ pending_photo_url: null })
          .eq('user_id', auth.userId);
      }

      return {
        attached: true,
        step_id: step.id,
        step_title: step.title,
        evidence_count: finalUploads.length,
        has_notes: !!actUpdates.notes,
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

      case 'get_step_detail': {
        const subSteps = result.sub_steps as { id: string; text: string; completed: boolean }[] | undefined;
        if (!subSteps?.length) return null;
        const stepId = result.id as string | undefined;
        if (!stepId) return null;
        const buttons = buildSubStepButtons(stepId, subSteps);
        return buttons.length > 0 ? buttons : null;
      }

      case 'update_step': {
        const stepId = result.step?.id as string | undefined;
        if (!stepId) return null;
        // Show "View step" button after update
        return [[{ text: '📋 View Step', callback_data: `detail:${stepId}` }]];
      }

      case 'attach_step_evidence': {
        // Photo was already attached — clear any pending "Attach to:" buttons
        if (result.attached) return [];
        return null;
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}
