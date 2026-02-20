/**
 * Session Reminders Edge Function
 *
 * Runs periodically via cron to send 1-hour reminders for upcoming coaching sessions.
 * Queries coaching_sessions for confirmed sessions starting within the next hour
 * that haven't had reminders sent yet. Sends push notifications to both coach and sailor.
 *
 * Schedule: Run every 15 minutes via the same cron that calls expire-booking-requests.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface SessionToRemind {
  id: string;
  coach_id: string;
  sailor_id: string;
  scheduled_at: string;
  session_type: string;
  coach_profile?: { display_name: string; user_id: string };
  sailor?: { full_name: string };
}

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: 'default';
  priority: 'high';
  channelId: string;
}

async function sendExpoPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  // Chunk into batches of 100
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        console.error(`[Reminders] Expo Push error: ${response.status}`);
      }

      const result = await response.json();
      const tickets = result.data || [];

      // Log stale tokens for cleanup (handled by send-push-notification in normal flow)
      for (const ticket of tickets) {
        if (ticket.details?.error === 'DeviceNotRegistered') {
          console.warn('[Reminders] Stale token detected — will be cleaned on next direct send');
        }
      }
    } catch (err) {
      console.error('[Reminders] Fetch error:', err);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    const results = {
      sessions_found: 0,
      reminders_sent: 0,
      errors: [] as string[],
    };

    // Find confirmed sessions starting within the next hour that haven't been reminded
    const { data: sessions, error: fetchError } = await supabase
      .from('coaching_sessions')
      .select(`
        id,
        coach_id,
        sailor_id,
        scheduled_at,
        session_type,
        coach_profile:coach_profiles!coach_id (
          display_name,
          user_id
        ),
        sailor:users!sailor_id (
          full_name
        )
      `)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .gt('scheduled_at', now.toISOString())
      .lte('scheduled_at', oneHourFromNow);

    if (fetchError) {
      results.errors.push(`Fetch error: ${fetchError.message}`);
      return new Response(
        JSON.stringify({ success: false, ...results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, ...results, message: 'No sessions need reminders' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    results.sessions_found = sessions.length;

    const pushMessages: PushMessage[] = [];
    const sessionIds: string[] = [];

    for (const session of sessions as SessionToRemind[]) {
      const coachUserId = session.coach_profile?.user_id;
      const coachName = session.coach_profile?.display_name || 'Your coach';
      const sailorName = session.sailor?.full_name || 'Your sailor';
      const sessionTime = new Date(session.scheduled_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      // Check notification preferences before adding messages
      const { data: coachPrefEnabled } = await supabase.rpc('check_notification_preference', {
        p_user_id: coachUserId,
        p_category: 'session_reminders',
      });

      const { data: sailorPrefEnabled } = await supabase.rpc('check_notification_preference', {
        p_user_id: session.sailor_id,
        p_category: 'session_reminders',
      });

      // Get push tokens for coach
      if (coachUserId && coachPrefEnabled !== false) {
        const { data: coachTokens } = await supabase.rpc('get_user_push_tokens', {
          p_user_id: coachUserId,
        });

        for (const t of coachTokens || []) {
          pushMessages.push({
            to: t.token,
            title: 'Session Starting Soon',
            body: `Session with ${sailorName} starts in 1 hour at ${sessionTime}`,
            data: {
              type: 'session_reminder',
              route: '/(tabs)/schedule',
              session_id: session.id,
            },
            sound: 'default',
            priority: 'high',
            channelId: 'messages',
          });
        }
      }

      // Get push tokens for sailor
      if (sailorPrefEnabled !== false) {
        const { data: sailorTokens } = await supabase.rpc('get_user_push_tokens', {
          p_user_id: session.sailor_id,
        });

        for (const t of sailorTokens || []) {
          pushMessages.push({
            to: t.token,
            title: 'Session Starting Soon',
            body: `Session with ${coachName} starts in 1 hour at ${sessionTime}`,
            data: {
              type: 'session_reminder',
              route: '/coach/my-bookings',
              session_id: session.id,
            },
            sound: 'default',
            priority: 'high',
            channelId: 'messages',
          });
        }
      }

      sessionIds.push(session.id);
    }

    // Mark sessions as reminded (do this before sending to prevent duplicates on retry)
    if (sessionIds.length > 0) {
      const { error: updateError } = await supabase
        .from('coaching_sessions')
        .update({ reminder_sent: true })
        .in('id', sessionIds);

      if (updateError) {
        results.errors.push(`Update error: ${updateError.message}`);
      }
    }

    // Send all push notifications
    await sendExpoPush(pushMessages);
    results.reminders_sent = sessionIds.length;

    console.log(`[Reminders] Sent reminders for ${results.reminders_sent} sessions`);

    return new Response(
      JSON.stringify({ success: true, ...results, timestamp: now.toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('[Reminders] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
