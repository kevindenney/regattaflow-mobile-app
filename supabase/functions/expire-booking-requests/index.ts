/**
 * Expire Booking Requests Edge Function
 *
 * This function runs periodically (via cron) to:
 * 1. Expire pending booking requests that have passed their expiration time (48 hours)
 * 2. Send 24-hour warning notifications to coaches about expiring requests
 * 3. Notify sailors when their requests expire
 *
 * Schedule: Run every 15 minutes via pg_cron or external cron service
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendPushToUser(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    // Check preference
    const { data: prefEnabled } = await supabase.rpc('check_notification_preference', {
      p_user_id: userId,
      p_category: 'booking_requests',
    });
    if (prefEnabled === false) return;

    const { data: tokens } = await supabase.rpc('get_user_push_tokens', { p_user_id: userId });
    if (!tokens || tokens.length === 0) return;

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
      channelId: 'messages',
    }));

    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('[expire-bookings] Push error:', err);
  }
}

interface ExpiredRequest {
  id: string;
  coach_id: string;
  sailor_id: string;
  requested_start_time: string;
  sailor?: { email: string; full_name: string };
  coach?: { display_name: string; user_id: string };
}

interface WarningRequest {
  id: string;
  coach_id: string;
  sailor_id: string;
  expires_at: string;
  coach?: { display_name: string; user_id: string; users?: { email: string } };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      expired: 0,
      warnings_sent: 0,
      notifications_created: 0,
      errors: [] as string[],
    };

    // =========================================================================
    // Step 1: Expire pending requests that have passed their expiration time
    // =========================================================================

    const now = new Date().toISOString();

    // Get requests to expire (with sailor info for notifications)
    const { data: requestsToExpire, error: fetchExpireError } = await supabase
      .from('session_bookings')
      .select(`
        id,
        coach_id,
        sailor_id,
        requested_start_time,
        sailor:users!sailor_id (email, full_name),
        coach:coach_profiles!coach_id (display_name, user_id)
      `)
      .eq('status', 'pending')
      .not('expires_at', 'is', null)
      .lt('expires_at', now);

    if (fetchExpireError) {
      results.errors.push(`Fetch expire error: ${fetchExpireError.message}`);
    } else if (requestsToExpire && requestsToExpire.length > 0) {
      // Update status to expired
      const idsToExpire = requestsToExpire.map((r) => r.id);

      const { error: updateError } = await supabase
        .from('session_bookings')
        .update({
          status: 'expired',
          updated_at: now,
        })
        .in('id', idsToExpire);

      if (updateError) {
        results.errors.push(`Update expire error: ${updateError.message}`);
      } else {
        results.expired = requestsToExpire.length;

        // Send notifications to sailors
        for (const request of requestsToExpire as ExpiredRequest[]) {
          try {
            // Create in-app notification for sailor
            await supabase.from('notifications').insert({
              user_id: request.sailor_id,
              type: 'booking_expired',
              title: 'Booking Request Expired',
              message: `Your booking request to ${request.coach?.display_name || 'a coach'} wasn't confirmed in time. Find another coach or try again.`,
              data: {
                booking_id: request.id,
                coach_id: request.coach_id,
                requested_start_time: request.requested_start_time,
              },
              read: false,
            });
            results.notifications_created++;

            // Send push notification to sailor
            await sendPushToUser(
              supabase,
              request.sailor_id,
              'Booking Request Expired',
              `Your request to ${request.coach?.display_name || 'a coach'} wasn't confirmed in time`,
              { type: 'booking_expired', route: '/coach/discover', booking_id: request.id }
            );

          } catch (notifError) {
            console.error('Error creating expiration notification:', notifError);
          }
        }
      }
    }

    // =========================================================================
    // Step 2: Send 24-hour warning to coaches about expiring requests
    // =========================================================================

    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Get requests expiring within 24 hours that haven't been warned
    const { data: requestsToWarn, error: fetchWarnError } = await supabase
      .from('session_bookings')
      .select(`
        id,
        coach_id,
        sailor_id,
        expires_at,
        coach:coach_profiles!coach_id (
          display_name,
          user_id,
          users!coach_profiles_user_id_fkey (email)
        )
      `)
      .eq('status', 'pending')
      .eq('expiration_warning_sent', false)
      .not('expires_at', 'is', null)
      .lt('expires_at', twentyFourHoursFromNow)
      .gt('expires_at', now);

    if (fetchWarnError) {
      results.errors.push(`Fetch warn error: ${fetchWarnError.message}`);
    } else if (requestsToWarn && requestsToWarn.length > 0) {
      // Mark these as warned
      const idsToWarn = requestsToWarn.map((r) => r.id);

      const { error: updateWarnError } = await supabase
        .from('session_bookings')
        .update({
          expiration_warning_sent: true,
          updated_at: now,
        })
        .in('id', idsToWarn);

      if (updateWarnError) {
        results.errors.push(`Update warn error: ${updateWarnError.message}`);
      } else {
        results.warnings_sent = requestsToWarn.length;

        // Send warning notifications to coaches
        for (const request of requestsToWarn as WarningRequest[]) {
          try {
            const coachUserId = request.coach?.user_id;
            if (coachUserId) {
              // Calculate hours remaining
              const expiresAt = new Date(request.expires_at);
              const hoursRemaining = Math.round(
                (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
              );

              // Create in-app notification for coach
              await supabase.from('notifications').insert({
                user_id: coachUserId,
                type: 'booking_expiring_soon',
                title: 'Booking Request Expiring Soon',
                message: `You have a booking request expiring in ${hoursRemaining} hours. Please respond before it expires.`,
                data: {
                  booking_id: request.id,
                  expires_at: request.expires_at,
                  hours_remaining: hoursRemaining,
                },
                read: false,
              });
              results.notifications_created++;

              // Send push notification to coach
              await sendPushToUser(
                supabase,
                coachUserId,
                'Booking Request Expiring Soon',
                `A booking request expires in ${hoursRemaining} hours — please respond`,
                { type: 'booking_expiring', route: '/(tabs)/schedule', booking_id: request.id }
              );
            }
          } catch (notifError) {
            console.error('Error creating warning notification:', notifError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        timestamp: now,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Expire booking requests error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
