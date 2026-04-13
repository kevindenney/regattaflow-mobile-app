import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../../../../middleware/auth';
import { resolveWorkspaceDomainForAuth } from '../../../../middleware/domain';
import { AIClient } from '../../../../../services/ai/AIClient';
import { AIActivityLogger } from '../../../../../services/ai/AIActivityLogger';
import { resolveRaceContext, resolveClubSummary } from '../../../../../services/ai/ContextResolvers';
import { buildRaceCommsPrompt } from '../../../../../services/ai/PromptBuilder';
import { parseRaceComms } from '../../../../../services/ai/OutputValidator';

const authedHandler = withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { id } = req.query;
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};

  if (!id || Array.isArray(id)) {
    res.status(400).json({ error: 'Missing race id' });
    return;
  }

  const updateType = body.update_type ?? body.topic ?? 'general update';

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
        error: 'Race communications are only available in sailing workspaces.',
        code: 'DOMAIN_GATED',
      });
      return;
    }
  }

  const logger = new AIActivityLogger(supabase);
  const client = new AIClient();

  try {
    const raceContext = await resolveRaceContext(supabase, id);
    const clubSummary = await resolveClubSummary(supabase, raceContext.clubId);
    const prompt = buildRaceCommsPrompt(raceContext, updateType);

    const started = Date.now();
    const completion = await client.createMessage({
      model: 'claude-3-5-haiku-20241022',
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

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  await authedHandler(req, res);
};

export default handler;
