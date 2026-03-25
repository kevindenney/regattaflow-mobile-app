import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isFeatureAvailable } from '../../../lib/subscriptions/sailorTiers';
import type { AuthContext } from '../server';

function jsonResponse(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerStudentProgressTools(
  server: McpServer,
  supabase: SupabaseClient,
  auth: AuthContext,
) {
  server.registerTool(
    'get_student_timeline',
    {
      description:
        'Get learning steps (timeline) for a user. Returns up to 50 steps, optionally filtered by status.',
      inputSchema: {
        user_id: z
          .string()
          .optional()
          .describe('User ID to fetch steps for (defaults to the authenticated user)'),
        status: z
          .enum(['pending', 'in_progress', 'completed', 'skipped'])
          .optional()
          .describe('Filter by step status'),
      },
    },
    async (args) => {
      const userId = args.user_id || auth.userId;

      let query = supabase
        .from('timeline_steps')
        .select('id, title, description, category, status, starts_at, ends_at, sort_order, created_at, updated_at')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
        .limit(50);

      if (args.status) {
        query = query.eq('status', args.status);
      }

      const { data, error } = await query;
      if (error) return jsonResponse({ error: error.message });

      return jsonResponse({ user_id: userId, count: data?.length ?? 0, steps: data ?? [] });
    },
  );

  server.registerTool(
    'get_step_detail',
    {
      description: 'Get full detail for a single learning step including Plan/Act/Review metadata.',
      inputSchema: {
        step_id: z.string().describe('The timeline step ID'),
      },
    },
    async (args) => {
      const { data, error } = await supabase
        .from('timeline_steps')
        .select('*')
        .eq('id', args.step_id)
        .maybeSingle();

      if (error) return jsonResponse({ error: error.message });
      if (!data) return jsonResponse({ error: 'Step not found' });

      return jsonResponse(data);
    },
  );

  server.registerTool(
    'update_step_status',
    {
      description: 'Update the status of a learning step (e.g. mark completed, in_progress, or skipped).',
      inputSchema: {
        step_id: z.string().describe('The timeline step ID'),
        status: z
          .enum(['pending', 'in_progress', 'completed', 'skipped'])
          .describe('New status'),
      },
    },
    async (args) => {
      if (!isFeatureAvailable('mcp_write', auth.tier)) {
        return jsonResponse({
          error: 'Updating steps via MCP requires a Pro subscription.',
          required_tier: 'pro',
          current_tier: auth.tier,
        });
      }

      const { data, error } = await supabase
        .from('timeline_steps')
        .update({ status: args.status, updated_at: new Date().toISOString() })
        .eq('id', args.step_id)
        .select('id, title, status, updated_at')
        .single();

      if (error) return jsonResponse({ error: error.message });

      return jsonResponse({ updated: true, step: data });
    },
  );
}
