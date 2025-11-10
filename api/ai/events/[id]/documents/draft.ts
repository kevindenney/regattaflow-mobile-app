import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { ClaudeClient } from '../../../../../services/ai/ClaudeClient';
import { AIActivityLogger } from '../../../../../services/ai/AIActivityLogger';
import { resolveEventContext, resolveClubSummary } from '../../../../../services/ai/ContextResolvers';
import { buildEventDocumentPrompt } from '../../../../../services/ai/PromptBuilder';
import { parseDocumentDraft } from '../../../../../services/ai/OutputValidator';

const handler = withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id } = req.query;
  const { document_type: documentType = 'nor' } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};

  if (!id || Array.isArray(id)) {
    res.status(400).json({ error: 'Missing event id' });
    return;
  }

  const supabase = req.supabase;
  const logger = new AIActivityLogger(supabase);
  const client = new ClaudeClient();

  try {
    const eventContext = await resolveEventContext(supabase, id);
    const clubSummary = await resolveClubSummary(supabase, eventContext.clubId);
    const prompt = buildEventDocumentPrompt(eventContext, clubSummary, documentType);

    const started = Date.now();
    const completion = await client.createMessage({
      model: documentType === 'amendment' ? 'claude-3-haiku-20240307' : 'claude-3-5-sonnet-20240620',
      system: prompt.system,
      messages: prompt.messages,
      maxTokens: 1500,
      temperature: 0.4,
    });

    const parsed = parseDocumentDraft(completion.text);

    await logger.logDocument({
      clubId: eventContext.clubId,
      createdBy: req.auth.userId,
      eventId: id,
      type: documentType,
      draftText: parsed.markdown,
      metadata: {
        title: parsed.title,
        sections: parsed.sections,
      },
      confidence: parsed.confidence ?? null,
    });

    await logger.logActivity({
      clubId: eventContext.clubId,
      userId: req.auth.userId,
      skill: 'event_document_draft',
      status: 'success',
      tokensIn: completion.tokensIn,
      tokensOut: completion.tokensOut,
      durationMs: Date.now() - started,
      requestPayload: { eventId: id, documentType },
      responsePayload: { documentTitle: parsed.title },
    });

    res.status(200).json({
      title: parsed.title,
      markdown: parsed.markdown,
      sections: parsed.sections,
      confidence: parsed.confidence ?? null,
    });
  } catch (error: any) {
    console.error('Claude draft error', error);
    await logger.logActivity({
      clubId: req.auth.clubId ?? null,
      userId: req.auth.userId,
      skill: 'event_document_draft',
      status: 'error',
      errorMessage: error?.message ?? 'unknown error',
    });
    res.status(500).json({ error: 'Unable to generate document', detail: error?.message });
  }
}, { requireClub: true });

export default handler;
