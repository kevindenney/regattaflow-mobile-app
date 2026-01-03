import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ClaudeClient } from '../../../services/ai/ClaudeClient';
import { AIActivityLogger } from '../../../services/ai/AIActivityLogger';
import { resolveClubSummary } from '../../../services/ai/ContextResolvers';
import { buildDailySummaryPrompt } from '../../../services/ai/PromptBuilder';
import { parseDailySummary } from '../../../services/ai/OutputValidator';
import { createClient } from '@supabase/supabase-js';

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    res.status(401).json({ error: 'Invalid cron secret' });
    return;
  }

  const supabase = createServiceClient();
  const client = new ClaudeClient();
  const logger = new AIActivityLogger(supabase);

  try {
    const { data: clubs } = await supabase.from('club_profiles').select('id').neq('id', null);

    if (!clubs?.length) {
      res.status(200).json({ message: 'No clubs to process' });
      return;
    }

    for (const club of clubs) {
      try {
        const summary = await resolveClubSummary(supabase, club.id);
        const stats = await loadDailyStats(supabase, club.id);
        const prompt = buildDailySummaryPrompt(summary, stats);

        const completion = await client.createMessage({
          model: 'claude-3-haiku-20240307',
          system: prompt.system,
          messages: prompt.messages,
          maxTokens: 800,
          temperature: 0.3,
        });

        const parsed = parseDailySummary(completion.text);

        await supabase.from('ai_generated_documents').insert({
          club_id: club.id,
          created_by: null,
          document_type: 'daily_summary',
          status: 'draft',
          draft_text: `${parsed.headline}\n\n${parsed.highlights.join('\n')}`,
          metadata: parsed,
        });

        await logger.logActivity({
          clubId: club.id,
          userId: null,
          skill: 'daily_summary',
          status: 'success',
          tokensIn: completion.tokensIn,
          tokensOut: completion.tokensOut,
          requestPayload: { stats },
          responsePayload: { headline: parsed.headline },
        });
      } catch (clubError: any) {
        console.error('Daily summary error', club.id, clubError);
        await logger.logActivity({
          clubId: club.id,
          userId: null,
          skill: 'daily_summary',
          status: 'error',
          errorMessage: clubError?.message ?? 'unknown',
        });
      }
    }

    res.status(200).json({ message: 'Daily summaries queued' });
  } catch (error: any) {
    console.error('Cron failure', error);
    res.status(500).json({ error: 'Failed to run summary job', detail: error?.message });
  }
};

function createServiceClient() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error('Missing Supabase service credentials');
  }
  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function loadDailyStats(supabase: ReturnType<typeof createServiceClient>, clubId: string) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [{ data: registrations }, { data: payments }, { data: notices }] = await Promise.all([
    supabase
      .from('club_event_registrations')
      .select('id')
      .eq('club_id', clubId)
      .gte('created_at', since.toISOString()),
    supabase
      .from('payments')
      .select('amount')
      .eq('club_id', clubId)
      .gte('created_at', since.toISOString()),
    supabase
      .from('ai_notifications')
      .select('id, topic')
      .eq('club_id', clubId)
      .gte('created_at', since.toISOString()),
  ]);

  const paymentsTotal = payments?.reduce((sum: number, p: any) => sum + Number(p.amount ?? 0), 0) ?? 0;

  return {
    registrations: registrations?.length ?? 0,
    payments: paymentsTotal,
    notifications: notices ?? [],
    generated_at: new Date().toISOString(),
  };
}

export default handler;

