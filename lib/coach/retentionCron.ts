import {
  buildCoachReminders,
  buildCoachWeeklyRecap,
  computeDailyStreak,
  countActiveDaysWithin,
} from './retentionLoop';

type AssessmentRow = {
  organization_id?: string | null;
  evaluator_id?: string | null;
  status?: string | null;
  evidence?: Record<string, unknown> | null;
  assessed_at?: string | null;
  created_at?: string | null;
};

export type CoachRetentionDeliveryRow = {
  organization_id: string;
  user_id: string;
  delivery_type: 'reminders' | 'weekly_recap';
  window_start: string;
  window_end: string;
  payload: Record<string, unknown>;
};

const DUE_STATUSES = new Set(['draft', 'submitted']);
const COMPLETED_STATUSES = new Set(['submitted', 'reviewed', 'finalized']);

function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function parseDueAt(row: AssessmentRow): Date | null {
  const evidence = row.evidence || {};
  const dueAtSource = evidence.due_at ?? evidence.dueAt ?? row.assessed_at ?? row.created_at ?? null;
  if (typeof dueAtSource !== 'string' || !dueAtSource.trim()) return null;
  return parseTimestamp(dueAtSource);
}

function getUtcDayStart(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function getUtcWeekStart(value: Date): Date {
  const start = getUtcDayStart(value);
  const day = start.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - diffToMonday);
  return start;
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function buildCoachRetentionDeliveries(
  rows: AssessmentRow[],
  now: Date = new Date()
): CoachRetentionDeliveryRow[] {
  const todayStart = getUtcDayStart(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const weekStart = getUtcWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const grouped = new Map<string, AssessmentRow[]>();
  for (const row of rows) {
    const organizationId = String(row.organization_id || '').trim();
    const evaluatorId = String(row.evaluator_id || '').trim();
    if (!organizationId || !evaluatorId) continue;
    const key = `${organizationId}:${evaluatorId}`;
    const list = grouped.get(key) || [];
    list.push(row);
    grouped.set(key, list);
  }

  const deliveries: CoachRetentionDeliveryRow[] = [];
  for (const [key, groupedRows] of grouped.entries()) {
    const [organizationId, evaluatorId] = key.split(':');

    let dueToday = 0;
    let overdue = 0;
    let totalDue = 0;
    let completedActions = 0;
    const activityTimestamps: string[] = [];

    for (const row of groupedRows) {
      const status = String(row.status || '').toLowerCase();
      const activityTimestamp = row.assessed_at || row.created_at || null;
      if (activityTimestamp) {
        activityTimestamps.push(activityTimestamp);
      }

      if (DUE_STATUSES.has(status)) {
        const dueAt = parseDueAt(row);
        if (!dueAt) continue;
        totalDue += 1;
        if (dueAt >= todayStart && dueAt < tomorrowStart) {
          dueToday += 1;
        } else if (dueAt < todayStart) {
          overdue += 1;
        }
      }

      if (COMPLETED_STATUSES.has(status)) {
        const completedAt = parseTimestamp(activityTimestamp);
        if (completedAt && completedAt >= sevenDaysAgo && completedAt < tomorrowStart) {
          completedActions += 1;
        }
      }
    }

    const reminders = buildCoachReminders({
      overdueAssessments: overdue,
      dueTodayAssessments: dueToday,
      unreadThreads: 0,
    });

    if (reminders.length > 0) {
      deliveries.push({
        organization_id: organizationId,
        user_id: evaluatorId,
        delivery_type: 'reminders',
        window_start: isoDate(todayStart),
        window_end: isoDate(tomorrowStart),
        payload: {
          streakDays: computeDailyStreak(activityTimestamps, now),
          reminders,
        },
      });
    }

    deliveries.push({
      organization_id: organizationId,
      user_id: evaluatorId,
      delivery_type: 'weekly_recap',
      window_start: isoDate(weekStart),
      window_end: isoDate(weekEnd),
      payload: buildCoachWeeklyRecap({
        completedActions,
        pendingActions: totalDue,
        activeDays: countActiveDaysWithin(activityTimestamps, 7, now),
        trendDelta: null,
      }) as unknown as Record<string, unknown>,
    });
  }

  return deliveries;
}
