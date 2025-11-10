import { createClient, SupabaseClient } from '@supabase/supabase-js';

type LogStatus = 'success' | 'error';

export interface ActivityLogOptions {
  clubId?: string | null;
  userId?: string | null;
  skill: string;
  status: LogStatus;
  tokensIn?: number;
  tokensOut?: number;
  durationMs?: number;
  requestPayload?: Record<string, any>;
  responsePayload?: Record<string, any>;
  errorMessage?: string;
}

export interface DocumentLogOptions {
  clubId: string;
  createdBy: string;
  eventId?: string | null;
  type: string;
  draftText: string;
  metadata?: Record<string, any>;
  confidence?: number | null;
}

const createServiceClient = (): SupabaseClient => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error('Supabase service credentials missing');
  }

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export class AIActivityLogger {
  private supabase: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.supabase = client ?? createServiceClient();
  }

  async logActivity(options: ActivityLogOptions) {
    const payload = {
      club_id: options.clubId ?? null,
      user_id: options.userId ?? null,
      skill: options.skill,
      status: options.status,
      tokens_in: options.tokensIn ?? null,
      tokens_out: options.tokensOut ?? null,
      duration_ms: options.durationMs ?? null,
      request_payload: this.redact(options.requestPayload),
      response_payload: this.redact(options.responsePayload),
      error_message: options.errorMessage ?? null,
    };

    await this.supabase.from('ai_activity_logs').insert(payload);
  }

  async logDocument(options: DocumentLogOptions) {
    await this.supabase.from('ai_generated_documents').insert({
      club_id: options.clubId,
      created_by: options.createdBy,
      event_id: options.eventId ?? null,
      document_type: options.type,
      draft_text: options.draftText,
      metadata: options.metadata ?? {},
      confidence: options.confidence ?? null,
    });
  }

  async logNotification(options: {
    clubId: string;
    createdBy: string;
    raceId?: string | null;
    topic: string;
    audience?: string | null;
    channels?: string[];
    message: string;
    suggestedSendAt?: string | null;
    metadata?: Record<string, any>;
  }) {
    await this.supabase.from('ai_notifications').insert({
      club_id: options.clubId,
      created_by: options.createdBy,
      race_id: options.raceId ?? null,
      topic: options.topic,
      audience: options.audience ?? null,
      channels: options.channels ?? [],
      message: options.message,
      suggested_send_at: options.suggestedSendAt,
      metadata: options.metadata ?? {},
    });
  }

  private redact(payload?: Record<string, any>) {
    if (!payload) return null;
    const cloned = JSON.parse(JSON.stringify(payload));
    if (cloned?.input?.password) {
      cloned.input.password = '***';
    }
    if (cloned?.input?.email) {
      cloned.input.email = '[redacted]';
    }
    return cloned;
  }
}

