/**
 * Supabase Edge Function: Send Race Reminders
 *
 * This function should be scheduled to run daily via pg_cron or external scheduler
 *
 * Schedule with pg_cron:
 * SELECT cron.schedule(
 *   'daily-race-reminders',
 *   '0 10 * * *', -- Run at 10:00 AM UTC daily
 *   $$SELECT net.http_post(
 *     url:='https://your-project.supabase.co/functions/v1/send-race-reminders',
 *     headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
 *   ) as request_id;$$
 * );
 *
 * Or use Vercel Cron Jobs with this endpoint
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') ?? '';
const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'noreply@regattaflow.com';

serve(async (req) => {
  try {
    // Verify authorization (optional: add a secret key check for cron jobs)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calculate tomorrow's date range (24-26 hours from now)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowPlus2Hours = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000);

    console.log(`Checking for races between ${tomorrow.toISOString()} and ${tomorrowPlus2Hours.toISOString()}`);

    // Get all confirmed race entries for races starting tomorrow
    const { data: entries, error } = await supabase
      .from('race_entries')
      .select(`
        *,
        regattas!inner (
          event_name,
          start_date,
          sailing_venues (
            name
          )
        ),
        users!sailor_id (
          name,
          email
        )
      `)
      .eq('status', 'confirmed')
      .gte('regattas.start_date', tomorrow.toISOString())
      .lte('regattas.start_date', tomorrowPlus2Hours.toISOString());

    if (error) {
      console.error('Failed to fetch entries:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ message: 'No races found for tomorrow', sent: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${entries.length} race entries`);

    let sent = 0;
    let errors = 0;

    // Send emails via SendGrid
    for (const entry of entries) {
      try {
        if (!entry.users?.email || !entry.regattas) {
          errors++;
          continue;
        }

        const emailData = {
          sailor_name: entry.users.name || 'Sailor',
          sailor_email: entry.users.email,
          regatta_name: entry.regattas.event_name || 'Regatta',
          start_date: entry.regattas.start_date,
          venue_name: entry.regattas.sailing_venues?.name || 'Venue',
          entry_number: entry.entry_number || 'TBD',
        };

        // Build email HTML (simplified template)
        const html = `
          <h1>⏰ Race Tomorrow!</h1>
          <h2>${emailData.regatta_name}</h2>
          <p>Hi ${emailData.sailor_name},</p>
          <p>Your race is tomorrow!</p>
          <p><strong>Event:</strong> ${emailData.regatta_name}</p>
          <p><strong>Start:</strong> ${new Date(emailData.start_date).toLocaleString()}</p>
          <p><strong>Venue:</strong> ${emailData.venue_name}</p>
          <p><strong>Entry #:</strong> ${emailData.entry_number}</p>
          <p>Good luck out there! ⛵</p>
        `;

        // Send via SendGrid
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: emailData.sailor_email }] }],
            from: { email: SENDGRID_FROM_EMAIL, name: 'RegattaFlow' },
            subject: `Race Tomorrow: ${emailData.regatta_name}`,
            content: [{ type: 'text/html', value: html }],
          }),
        });

        if (response.ok) {
          sent++;
          console.log(`✅ Sent to ${emailData.sailor_email}`);

          // Log email
          await supabase.from('email_logs').insert({
            to_email: emailData.sailor_email,
            subject: `Race Tomorrow: ${emailData.regatta_name}`,
            html_body: html,
            email_type: 'race_reminder',
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
        } else {
          errors++;
          console.error(`❌ Failed to send to ${emailData.sailor_email}`);
        }
      } catch (emailError) {
        errors++;
        console.error('Email error:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        errors,
        total: entries.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      });
  }
});
