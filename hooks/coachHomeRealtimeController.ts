export type CoachHomeRealtimePayload = {
  table?: string;
  eventType?: string;
  commit_timestamp?: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
};

export type CoachHomeRealtimeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED' | string;

export type CoachHomeRealtimeChannel = {
  on: (
    event: 'postgres_changes',
    config: { event: '*'; schema: 'public'; table: string; filter: string },
    callback: (payload: CoachHomeRealtimePayload) => void
  ) => CoachHomeRealtimeChannel;
  subscribe: (callback: (status: CoachHomeRealtimeStatus) => void) => CoachHomeRealtimeChannel;
};

export type CoachHomeRealtimeSupabase = {
  channel: (name: string) => CoachHomeRealtimeChannel;
  removeChannel: (channel: CoachHomeRealtimeChannel) => unknown;
};

type CreateCoachHomeRealtimeControllerParams = {
  organizationId: string;
  userId: string;
  runId: number;
  isActiveRun: () => boolean;
  supabase: CoachHomeRealtimeSupabase;
  scheduleRefresh: (delayMs?: number) => void;
  now?: () => number;
  setTimer?: (handler: () => void, timeoutMs: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
};

const DUPLICATE_WINDOW_MS = 5_000;
const SIGNATURE_TTL_MS = 90_000;
const RECONNECT_DELAY_MS = 1_500;

export function createCoachHomeRealtimeController(params: CreateCoachHomeRealtimeControllerParams) {
  const now = params.now ?? (() => Date.now());
  const setTimer = params.setTimer ?? ((handler, timeoutMs) => setTimeout(handler, timeoutMs));
  const clearTimer = params.clearTimer ?? ((timer) => clearTimeout(timer));
  const seenSignatures = new Map<string, number>();

  let disposed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let channel: CoachHomeRealtimeChannel | null = null;

  const canCommit = () => !disposed && params.isActiveRun();

  const clearReconnectTimer = () => {
    if (!reconnectTimer) return;
    clearTimer(reconnectTimer);
    reconnectTimer = null;
  };

  const clearChannel = () => {
    if (!channel) return;
    void params.supabase.removeChannel(channel);
    channel = null;
  };

  const buildKeyId = (payload: CoachHomeRealtimePayload): string => {
    const table = String(payload.table || '');
    const next = (payload.new || {}) as Record<string, unknown>;
    const old = (payload.old || {}) as Record<string, unknown>;

    if (table === 'assessment_records' || table === 'communication_messages') {
      return String(next.id || old.id || '');
    }
    if (table === 'communication_thread_reads') {
      const threadId = String(next.thread_id || old.thread_id || '');
      const readUserId = String(next.user_id || old.user_id || '');
      return `${threadId}:${readUserId}`;
    }
    return '';
  };

  const isDuplicateRealtimeEvent = (payload: CoachHomeRealtimePayload): boolean => {
    const table = String(payload.table || '');
    const eventType = String(payload.eventType || '');
    const commitTs = String(payload.commit_timestamp || '');
    const keyId = buildKeyId(payload);
    const signature = `${table}|${eventType}|${commitTs}|${keyId}`;
    const tsNow = now();

    for (const [key, ts] of seenSignatures.entries()) {
      if (tsNow - ts > SIGNATURE_TTL_MS) {
        seenSignatures.delete(key);
      }
    }

    const previous = seenSignatures.get(signature);
    if (previous && tsNow - previous < DUPLICATE_WINDOW_MS) {
      return true;
    }

    seenSignatures.set(signature, tsNow);
    return false;
  };

  const onRealtimePayload = (payload: CoachHomeRealtimePayload) => {
    if (!canCommit()) return;
    if (isDuplicateRealtimeEvent(payload)) return;

    const table = String(payload.table || '');
    const next = (payload.new || {}) as Record<string, unknown>;
    const old = (payload.old || {}) as Record<string, unknown>;

    if (table === 'assessment_records') {
      const evaluatorId = String(next.evaluator_id || old.evaluator_id || '');
      if (evaluatorId !== params.userId) return;
    }

    if (table === 'communication_messages') {
      const senderId = String(next.sender_id || old.sender_id || '');
      if (senderId && senderId === params.userId) return;
    }

    if (table === 'communication_thread_reads') {
      const readUserId = String(next.user_id || old.user_id || '');
      if (readUserId !== params.userId) return;
    }

    params.scheduleRefresh();
  };

  const scheduleReconnect = () => {
    if (!canCommit()) return;
    clearReconnectTimer();
    reconnectTimer = setTimer(() => {
      reconnectTimer = null;
      if (!canCommit()) return;
      connect();
    }, RECONNECT_DELAY_MS);
  };

  const onStatus = (status: CoachHomeRealtimeStatus) => {
    if (!canCommit()) return;
    if (status === 'SUBSCRIBED') {
      clearReconnectTimer();
      params.scheduleRefresh(0);
      return;
    }
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      scheduleReconnect();
    }
  };

  const connect = () => {
    if (!canCommit()) return;
    clearChannel();

    const channelName = `coach-home-counters:${params.organizationId}:${params.userId}:${params.runId}`;
    channel = params.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assessment_records', filter: `organization_id=eq.${params.organizationId}` },
        onRealtimePayload
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'communication_messages', filter: `organization_id=eq.${params.organizationId}` },
        onRealtimePayload
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'communication_thread_reads', filter: `organization_id=eq.${params.organizationId}` },
        onRealtimePayload
      );

    channel.subscribe(onStatus);
  };

  connect();

  return {
    dispose: () => {
      disposed = true;
      clearReconnectTimer();
      clearChannel();
    },
  };
}
