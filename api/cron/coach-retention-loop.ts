import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { buildCoachRetentionDeliveries } from '../../lib/coach/retentionCron';

type RetentionDeliveryRecord = {
  id: string;
  user_id: string;
  delivery_type: 'reminders' | 'weekly_recap';
  payload: Record<string, unknown>;
};

function buildNotificationContent(row: RetentionDeliveryRecord): { title: string; body: string } {
  if (row.delivery_type === 'reminders') {
    const reminders = Array.isArray((row.payload as any).reminders)
      ? (row.payload as any).reminders
      : [];
    const label = reminders[0]?.label || 'You have pending coach actions';
    return {
      title: 'Coach reminders',
      body: String(label),
    };
  }

  const completed = Number((row.payload as any).completedActions || 0);
  const pending = Number((row.payload as any).pendingActions || 0);
  return {
    title: 'Weekly coach recap',
    body: `${completed} completed, ${pending} pending this week`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendEmailViaSendGrid(input: {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: input.toEmail }] }],
        from: { email: input.fromEmail, name: 'RegattaFlow' },
        subject: input.subject,
        content: [
          { type: 'text/plain', value: input.body },
          { type: 'text/html', value: `<p>${escapeHtml(input.body)}</p>` },
        ],
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: `sendgrid_${response.status}:${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message || 'sendgrid_request_failed' };
  }
}

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL/EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  try {
    const now = new Date();
    const lookback = new Date(now);
    lookback.setUTCDate(lookback.getUTCDate() - 35);

    const { data: assessmentRows, error: assessmentError } = await supabase
      .from('assessment_records')
      .select('organization_id,evaluator_id,status,evidence,assessed_at,created_at')
      .or(`created_at.gte.${lookback.toISOString()},assessed_at.gte.${lookback.toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(12000);
    if (assessmentError) throw assessmentError;

    const deliveries = buildCoachRetentionDeliveries((assessmentRows || []) as any[], now);
    if (deliveries.length === 0) {
      return res.status(200).json({
        ok: true,
        inserted: 0,
        dispatched: 0,
        skipped: true,
        reason: 'No retention deliveries to write',
      });
    }

    const { error: insertError } = await supabase
      .from('coach_retention_deliveries')
      .upsert(deliveries, {
        onConflict: 'organization_id,user_id,delivery_type,window_start,window_end',
      });
    if (insertError) throw insertError;

    const { data: pendingRows, error: pendingError } = await supabase
      .from('coach_retention_deliveries')
      .select('id,user_id,delivery_type,payload')
      .is('dispatched_at', null)
      .order('created_at', { ascending: true })
      .limit(500);
    if (pendingError) throw pendingError;

    const rows = (pendingRows || []) as RetentionDeliveryRecord[];
    let pushDispatched = 0;
    let emailDispatched = 0;
    if (rows.length > 0) {
      const notifications = rows.map((row) => {
        const { title, body } = buildNotificationContent(row);
        return {
          user_id: row.user_id,
          type: 'new_message',
          title,
          body,
          data: {
            source: 'coach_retention_loop',
            delivery_type: row.delivery_type,
            payload: row.payload,
          },
        };
      });

      const { error: notificationError } = await supabase
        .from('social_notifications')
        .insert(notifications);
      if (notificationError) {
        const ids = rows.map((row) => row.id);
        await supabase
          .from('coach_retention_deliveries')
          .update({ dispatch_error: notificationError.message })
          .in('id', ids);
        throw notificationError;
      }

      const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
      const [{ data: prefsRows, error: prefsError }, { data: userRows, error: usersError }] = await Promise.all([
        supabase
          .from('notification_preferences')
          .select('user_id,push_enabled,email_enabled')
          .in('user_id', userIds),
        supabase
          .from('users')
          .select('id,email')
          .in('id', userIds),
      ]);
      if (prefsError) throw prefsError;
      if (usersError) throw usersError;

      const prefByUserId = new Map<string, { push_enabled?: boolean; email_enabled?: boolean }>();
      for (const row of prefsRows || []) {
        const typed = row as { user_id?: string | null; push_enabled?: boolean; email_enabled?: boolean };
        if (!typed.user_id) continue;
        prefByUserId.set(typed.user_id, typed);
      }

      const emailByUserId = new Map<string, string>();
      for (const row of userRows || []) {
        const typed = row as { id?: string | null; email?: string | null };
        const id = String(typed.id || '').trim();
        const email = String(typed.email || '').trim();
        if (!id || !email) continue;
        emailByUserId.set(id, email);
      }

      const pushRecipients = rows
        .filter((row) => (prefByUserId.get(row.user_id)?.push_enabled ?? true))
        .map((row) => {
          const { title, body } = buildNotificationContent(row);
          return {
            userId: row.user_id,
            title,
            body,
            data: {
              source: 'coach_retention_loop',
              delivery_type: row.delivery_type,
            },
            category: 'group_messages',
          };
        });

      if (pushRecipients.length > 0) {
        const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipients: pushRecipients }),
        });
        if (pushResponse.ok) {
          pushDispatched = pushRecipients.length;
        } else {
          const pushErrorText = await pushResponse.text();
          console.error('coach-retention-loop push fanout failed', pushResponse.status, pushErrorText);
        }
      }

      const sendGridApiKey = process.env.SENDGRID_API_KEY || '';
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@regattaflow.com';
      if (sendGridApiKey) {
        for (const row of rows) {
          if (!(prefByUserId.get(row.user_id)?.email_enabled ?? false)) continue;
          const toEmail = emailByUserId.get(row.user_id);
          if (!toEmail) continue;
          const { title, body } = buildNotificationContent(row);
          const emailResult = await sendEmailViaSendGrid({
            apiKey: sendGridApiKey,
            fromEmail,
            toEmail,
            subject: title,
            body,
          });
          if (emailResult.ok) {
            emailDispatched += 1;
          } else {
            console.error('coach-retention-loop email fanout failed', emailResult.error);
          }
        }
      }

      const ids = rows.map((row) => row.id);
      const { error: dispatchedUpdateError } = await supabase
        .from('coach_retention_deliveries')
        .update({
          dispatched_at: now.toISOString(),
          dispatch_error: null,
        })
        .in('id', ids);
      if (dispatchedUpdateError) throw dispatchedUpdateError;
    }

    const reminders = deliveries.filter((row) => row.delivery_type === 'reminders').length;
    const recaps = deliveries.filter((row) => row.delivery_type === 'weekly_recap').length;

    return res.status(200).json({
      ok: true,
      inserted: deliveries.length,
      dispatched: rows.length,
      pushDispatched,
      emailDispatched,
      reminders,
      weeklyRecaps: recaps,
    });
  } catch (error: any) {
    console.error('coach-retention-loop cron error:', error);
    return res.status(500).json({
      error: 'Failed to process coach retention loop',
      detail: error?.message || 'unknown_error',
    });
  }
};

export default handler;
