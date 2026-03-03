export type RetentionDeliveryType = 'reminders' | 'weekly_recap';

export type RetentionDispatchRow = {
  id: string;
  delivery_type: RetentionDeliveryType;
  payload: Record<string, unknown>;
  in_app_dispatched_at?: string | null;
  push_dispatched_at?: string | null;
  email_dispatched_at?: string | null;
};

export type DispatchChannel = 'in_app' | 'push' | 'email';

type WeeklyRecapPayload = {
  completedActions: number;
  pendingActions: number;
  activeDays: number;
  trendDelta: number | null;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isCompleteWeeklyRecapPayload(payload: Record<string, unknown>): payload is WeeklyRecapPayload {
  return (
    isFiniteNumber(payload.completedActions) &&
    isFiniteNumber(payload.pendingActions) &&
    isFiniteNumber(payload.activeDays) &&
    (payload.trendDelta === null || isFiniteNumber(payload.trendDelta))
  );
}

export function hasPendingChannel(row: RetentionDispatchRow, channel: DispatchChannel): boolean {
  if (channel === 'in_app') return !row.in_app_dispatched_at;
  if (channel === 'push') return !row.push_dispatched_at;
  return !row.email_dispatched_at;
}

export function isFullyDispatched(row: {
  in_app_dispatched_at?: string | null;
  push_dispatched_at?: string | null;
  email_dispatched_at?: string | null;
}): boolean {
  return Boolean(row.in_app_dispatched_at && row.push_dispatched_at && row.email_dispatched_at);
}
