import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { ClaudeClient } from '../../../../../services/ai/ClaudeClient';
import { AIActivityLogger } from '../../../../../services/ai/AIActivityLogger';
import { resolveRaceContext, resolveClubSummary } from '../../../../../services/ai/ContextResolvers';
import { buildRaceCommsPrompt } from '../../../../../services/ai/PromptBuilder';
import { parseRaceComms } from '../../../../../services/ai/OutputValidator';

const handler = withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id } = req.query;
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};

  if (!id || Array.isArray(id)) {
    res.status(400).json({ error: 'Missing race id' });
    return;
  }

  const updateType = body.update_type ?? body.topic ?? 'general update';

  const supabase = req.supabase;
  const logger = new AIActivityLogger(supabase);
  const client = new ClaudeClient();

  try {
    const raceContext = await resolveRaceContext(supabase, id);
    const clubSummary = await resolveClubSummary(supabase, raceContext.clubId);
    const prompt = buildRaceCommsPrompt(raceContext, updateType);

    const started = Date.now();
    const completion = await client.createMessage({
      model: 'claude-3-haiku-20240307',
      system: prompt.system,
      messages: prompt.messages,
      maxTokens: 600,
      temperature: 0.2,
    });

    const parsed = parseRaceComms(completion.text);

    await logger.logNotification({
      clubId: raceContext.clubId,
      createdBy: req.auth.userId,
      raceId: id,
      topic: updateType,
      audience: body.audience ?? null,
      channels: body.channels ?? ['email', 'sms'],
      message: parsed.email,
      suggestedSendAt: parsed.suggested_send_time ?? null,
      metadata: {
        sms: parsed.sms,
        notice_board: parsed.notice_board,
        urgency: parsed.urgency,
      },
    });

    await logger.logActivity({
      clubId: raceContext.clubId,
      userId: req.auth.userId,
      skill: 'race_comms_draft',
      status: 'success',
      tokensIn: completion.tokensIn,
      tokensOut: completion.tokensOut,
      durationMs: Date.now() - started,
      requestPayload: { raceId: id, updateType },
      responsePayload: { urgency: parsed.urgency, suggested_send: parsed.suggested_send_time },
    });

    res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Claude comms error', error);
    await logger.logActivity({
      clubId: req.auth.clubId ?? null,
      userId: req.auth.userId,
      skill: 'race_comms_draft',
      status: 'error',
      errorMessage: error?.message ?? 'unknown error',
    });
    res.status(500).json({ error: 'Unable to generate communications', detail: error?.message });
  }
}, { requireClub: true });

export default handler;
