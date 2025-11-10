import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ClaudeClient } from '../../../services/ai/ClaudeClient';
import { AIActivityLogger } from '../../../services/ai/AIActivityLogger';
import { resolveClubSummary } from '../../../services/ai/ContextResolvers';
import { buildSupportPrompt } from '../../../services/ai/PromptBuilder';
import { parseSupportReply } from '../../../services/ai/OutputValidator';

const handler = withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
  const message = body.message;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const supabase = req.supabase;
  const clubId = req.auth.clubId;
  if (!clubId) {
    res.status(400).json({ error: 'club_id missing on profile' });
    return;
  }

  const logger = new AIActivityLogger(supabase);
  const client = new ClaudeClient();

  try {
    const clubSummary = await resolveClubSummary(supabase, clubId);

    const { data: historyData } = await supabase
      .from('ai_conversations')
      .select('role, message')
      .eq('club_id', clubId)
      .is('user_id', null)
      .order('created_at', { ascending: true })
      .limit(10);

    const prompt = buildSupportPrompt(
      clubSummary,
      (historyData ?? []).map(entry => ({
        role: entry.role === 'assistant' ? 'assistant' : 'user',
        message: entry.message,
      })),
      message
    );

    const started = Date.now();
    const completion = await client.createMessage({
      model: 'claude-3-haiku-20240307',
      system: prompt.system,
      messages: prompt.messages,
      maxTokens: 700,
      temperature: 0.3,
    });

    const parsed = parseSupportReply(completion.text);

    await supabase.from('ai_conversations').insert([
      {
        club_id: clubId,
        user_id: req.auth.userId,
        role: 'user',
        message,
      },
      {
        club_id: clubId,
        role: 'assistant',
        message: parsed.reply,
        metadata: {
          suggested_action: parsed.suggested_action ?? null,
          needs_handoff: parsed.needs_handoff ?? false,
        },
      },
    ]);

    await logger.logActivity({
      clubId,
      userId: req.auth.userId,
      skill: 'support_chat',
      status: 'success',
      tokensIn: completion.tokensIn,
      tokensOut: completion.tokensOut,
      durationMs: Date.now() - started,
      requestPayload: { message },
      responsePayload: { suggested_action: parsed.suggested_action },
    });

    res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Claude support error', error);
    await logger.logActivity({
      clubId,
      userId: req.auth.userId,
      skill: 'support_chat',
      status: 'error',
      errorMessage: error?.message ?? 'unknown error',
    });
    res.status(500).json({ error: 'Unable to generate reply', detail: error?.message });
  }
}, { requireClub: true });

export default handler;

