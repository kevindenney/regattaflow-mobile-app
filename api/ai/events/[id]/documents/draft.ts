import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../../../../middleware/auth';
import { resolveWorkspaceDomainForAuth } from '../../../../middleware/domain';
import { AIClient } from '../../../../../services/ai/AIClient';
import { AIActivityLogger } from '../../../../../services/ai/AIActivityLogger';
import { resolveEventContext, resolveClubSummary } from '../../../../../services/ai/ContextResolvers';
import { buildEventDocumentPrompt } from '../../../../../services/ai/PromptBuilder';
import { parseDocumentDraft } from '../../../../../services/ai/OutputValidator';

const authedHandler = withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { id } = req.query;
  const { document_type: documentType = 'nor' } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};

  if (!id || Array.isArray(id)) {
    res.status(400).json({ error: 'Missing event id' });
    return;
  }

  const supabase = req.supabase;
  const activeOrganizationId = req.auth.clubId ?? null;

  if (activeOrganizationId) {
    const { data: organization, error: organizationError } = await supabase
      .from('organizations')
      .select('organization_type, metadata')
      .eq('id', activeOrganizationId)
      .maybeSingle();

    const metadata = ((organization as { metadata?: Record<string, unknown> | null } | null)?.metadata) || {};
    const resolvedDomain = resolveWorkspaceDomainForAuth({
      organizationType: (organization as { organization_type?: string | null } | null)?.organization_type ?? null,
      activeInterestId: String(metadata.active_interest_id || ''),
      activeInterestSlug: String(metadata.active_interest_slug || metadata.interest_slug || ''),
    });

    if (!organizationError && organization && resolvedDomain !== 'sailing') {
      res.status(403).json({
        error: 'Event document drafting is only available in sailing workspaces.',
        code: 'DOMAIN_GATED',
      });
      return;
    }
  }

  const logger = new AIActivityLogger(supabase);
  const client = new AIClient();

  try {
    const eventContext = await resolveEventContext(supabase, id);
    const clubSummary = await resolveClubSummary(supabase, eventContext.clubId);
    const prompt = buildEventDocumentPrompt(eventContext, clubSummary, documentType);

    const started = Date.now();
    const completion = await client.createMessage({
      model: documentType === 'amendment' ? 'claude-3-5-haiku-20241022' : 'claude-3-5-sonnet-20240620',
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

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  await authedHandler(req, res);
};

export default handler;
