import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  NURSING_CORE_V1_CAPABILITIES,
} from '../../../configs/competencies/nursing-core-v1';
import { isFeatureAvailable } from '../../../lib/subscriptions/sailorTiers';
import type { AuthContext } from '../server';

function jsonResponse(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerCompetencyTools(
  server: McpServer,
  supabase: SupabaseClient,
  auth: AuthContext,
) {
  server.registerTool(
    'get_competency_dashboard',
    {
      description:
        'Get a competency dashboard summary for a user: totals by status, by category, and overall percentage.',
      inputSchema: {
        user_id: z
          .string()
          .optional()
          .describe('User ID (defaults to authenticated user)'),
      },
    },
    async (args) => {
      const userId = args.user_id || auth.userId;

      const { data: progress, error } = await supabase
        .from('competency_progress')
        .select('id, competency_id, status, attempts_count, validated_at, approved_at')
        .eq('user_id', userId);

      if (error) return jsonResponse({ error: error.message });

      const progressMap = new Map(
        (progress ?? []).map((p: any) => [p.competency_id, p]),
      );

      const statuses = [
        'not_started', 'learning', 'practicing',
        'checkoff_ready', 'validated', 'competent',
      ] as const;

      const byStatus: Record<string, number> = {};
      for (const s of statuses) byStatus[s] = 0;

      const byCategory: Record<string, { total: number; completed: number }> = {};

      for (const cap of NURSING_CORE_V1_CAPABILITIES) {
        const p = progressMap.get(cap.id);
        const status = p?.status ?? 'not_started';
        byStatus[status] = (byStatus[status] ?? 0) + 1;

        const cat = cap.domain;
        if (!byCategory[cat]) byCategory[cat] = { total: 0, completed: 0 };
        byCategory[cat].total++;
        if (status === 'validated' || status === 'competent') {
          byCategory[cat].completed++;
        }
      }

      const total = NURSING_CORE_V1_CAPABILITIES.length;
      const completed = (byStatus['validated'] ?? 0) + (byStatus['competent'] ?? 0);
      const overallPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      return jsonResponse({
        user_id: userId,
        total,
        byStatus,
        byCategory,
        overallPercent,
      });
    },
  );

  server.registerTool(
    'get_competency_progress',
    {
      description:
        'Get detailed progress for a single competency including attempts and reviews.',
      inputSchema: {
        competency_id: z.string().describe('Competency ID (e.g. nurs-qs-patient-safety-vigilance)'),
        user_id: z.string().optional().describe('User ID (defaults to authenticated user)'),
      },
    },
    async (args) => {
      const userId = args.user_id || auth.userId;

      const [progressRes, attemptsRes] = await Promise.all([
        supabase
          .from('competency_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('competency_id', args.competency_id)
          .maybeSingle(),
        supabase
          .from('competency_attempts')
          .select('*')
          .eq('user_id', userId)
          .eq('competency_id', args.competency_id)
          .order('attempt_number', { ascending: true }),
      ]);

      // Fetch reviews if we have a progress record
      let reviews: any[] = [];
      if (progressRes.data?.id) {
        const { data: reviewData } = await supabase
          .from('competency_reviews')
          .select('*')
          .eq('progress_id', progressRes.data.id)
          .order('created_at', { ascending: true });
        reviews = reviewData ?? [];
      }

      const capability = NURSING_CORE_V1_CAPABILITIES.find(c => c.id === args.competency_id);

      return jsonResponse({
        competency: capability ?? { id: args.competency_id },
        progress: progressRes.data ?? null,
        attempts: attemptsRes.data ?? [],
        reviews,
      });
    },
  );

  server.registerTool(
    'log_competency_attempt',
    {
      description:
        'Record a new practice attempt for a competency with self-assessment.',
      inputSchema: {
        competency_id: z.string().describe('Competency ID'),
        self_rating: z
          .enum(['needs_practice', 'developing', 'proficient', 'confident'])
          .describe('Self-assessment rating'),
        self_notes: z.string().optional().describe('Notes about the attempt'),
        clinical_context: z.string().optional().describe('Clinical context description'),
        event_id: z.string().optional().describe('Associated event/session ID'),
      },
    },
    async (args) => {
      if (!isFeatureAvailable('mcp_write', auth.tier)) {
        return jsonResponse({
          error: 'Logging competency attempts via MCP requires a Pro subscription.',
          required_tier: 'pro',
          current_tier: auth.tier,
        });
      }

      const userId = auth.userId;

      // Upsert progress record
      const { data: existing } = await supabase
        .from('competency_progress')
        .select('id, attempts_count, status')
        .eq('user_id', userId)
        .eq('competency_id', args.competency_id)
        .maybeSingle();

      let progressId: string;
      const newCount = (existing?.attempts_count ?? 0) + 1;

      if (existing) {
        const { data: updated, error } = await supabase
          .from('competency_progress')
          .update({
            attempts_count: newCount,
            last_attempt_at: new Date().toISOString(),
            status: existing.status === 'not_started' ? 'practicing' : existing.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select('id')
          .single();
        if (error) return jsonResponse({ error: error.message });
        progressId = updated.id;
      } else {
        const { data: created, error } = await supabase
          .from('competency_progress')
          .insert({
            user_id: userId,
            competency_id: args.competency_id,
            status: 'practicing',
            attempts_count: 1,
            last_attempt_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (error) return jsonResponse({ error: error.message });
        progressId = created.id;
      }

      // Insert attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('competency_attempts')
        .insert({
          user_id: userId,
          competency_id: args.competency_id,
          attempt_number: newCount,
          self_rating: args.self_rating,
          self_notes: args.self_notes ?? null,
          clinical_context: args.clinical_context ?? null,
          event_id: args.event_id ?? null,
        })
        .select('id, attempt_number, self_rating, created_at')
        .single();

      if (attemptError) return jsonResponse({ error: attemptError.message });

      return jsonResponse({ logged: true, progress_id: progressId, attempt });
    },
  );

  server.registerTool(
    'search_competencies',
    {
      description:
        'Search the AACN competency catalog by keyword or domain. Returns matching competencies from the nursing-core-v1 catalog.',
      inputSchema: {
        query: z.string().optional().describe('Search keyword (matches title or description)'),
        domain: z.string().optional().describe('Filter by AACN domain ID (e.g. quality-and-safety)'),
      },
    },
    async (args) => {
      let results = [...NURSING_CORE_V1_CAPABILITIES];

      if (args.domain) {
        results = results.filter(c => c.domain === args.domain);
      }

      if (args.query) {
        const q = args.query.toLowerCase();
        results = results.filter(
          c =>
            c.title.toLowerCase().includes(q) ||
            c.shortDescription.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q),
        );
      }

      return jsonResponse({ count: results.length, competencies: results });
    },
  );
}
