/**
 * Telegram daily digest builders.
 * Returns formatted summary text or null if nothing to report.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

interface StepRow {
  id: string;
  title: string;
  status: string;
  starts_at: string | null;
  updated_at: string | null;
  interest_id: string;
}

/**
 * Morning digest: what's planned for today + in-progress items.
 */
export async function buildMorningDigest(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const todayStart = startOfDayUTC();
  const todayEnd = endOfDayUTC();

  // Steps due today
  const { data: todaySteps } = await supabase
    .from('timeline_steps')
    .select('id, title, status, starts_at, updated_at, interest_id')
    .eq('user_id', userId)
    .gte('starts_at', todayStart)
    .lte('starts_at', todayEnd)
    .in('status', ['pending', 'in_progress'])
    .order('starts_at', { ascending: true })
    .limit(10);

  // In-progress steps (regardless of date)
  const { data: inProgress } = await supabase
    .from('timeline_steps')
    .select('id, title, status, starts_at, updated_at, interest_id')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('updated_at', { ascending: false })
    .limit(5);

  const todayItems = (todaySteps ?? []) as StepRow[];
  const wipItems = (inProgress ?? []) as StepRow[];

  // Deduplicate (in_progress items may overlap with today's)
  const seen = new Set(todayItems.map(s => s.id));
  const extraWip = wipItems.filter(s => !seen.has(s.id));

  if (todayItems.length === 0 && extraWip.length === 0) return null;

  const lines: string[] = ['☀️ *Good morning!* Here\'s your day:'];

  if (todayItems.length > 0) {
    lines.push('');
    lines.push('*Today\'s steps:*');
    for (const step of todayItems) {
      const icon = step.status === 'in_progress' ? '🔄' : '📋';
      lines.push(`${icon} ${step.title}`);
    }
  }

  if (extraWip.length > 0) {
    lines.push('');
    lines.push('*Still in progress:*');
    for (const step of extraWip) {
      lines.push(`🔄 ${step.title}`);
    }
  }

  lines.push('');
  lines.push('Reply here to update any step or ask me anything!');

  return lines.join('\n');
}

/**
 * Evening digest: what was accomplished today.
 */
export async function buildEveningDigest(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const todayStart = startOfDayUTC();

  // Steps completed today
  const { data: completedToday } = await supabase
    .from('timeline_steps')
    .select('id, title, status, starts_at, updated_at, interest_id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('updated_at', todayStart)
    .order('updated_at', { ascending: false })
    .limit(10);

  // Steps still in progress
  const { data: stillWip } = await supabase
    .from('timeline_steps')
    .select('id, title, status, starts_at, updated_at, interest_id')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('updated_at', { ascending: false })
    .limit(5);

  const completed = (completedToday ?? []) as StepRow[];
  const wip = (stillWip ?? []) as StepRow[];

  if (completed.length === 0 && wip.length === 0) return null;

  const lines: string[] = ['🌙 *Evening recap*'];

  if (completed.length > 0) {
    lines.push('');
    lines.push(`*Completed today (${completed.length}):*`);
    for (const step of completed) {
      lines.push(`✅ ${step.title}`);
    }
  }

  if (wip.length > 0) {
    lines.push('');
    lines.push('*Still in progress:*');
    for (const step of wip) {
      lines.push(`🔄 ${step.title}`);
    }
  }

  if (completed.length > 0) {
    lines.push('');
    lines.push(completed.length >= 3
      ? 'Great productivity today! 🎯'
      : 'Nice work today! Keep it up 💪');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Date helpers (UTC)
// ---------------------------------------------------------------------------

function startOfDayUTC(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDayUTC(): string {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}
