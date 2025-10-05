/**
 * Send Session Reminders Edge Function
 *
 * Runs hourly via cron to send 24-hour reminders for upcoming coaching sessions.
 *
 * Schedule: 0 * * * * (every hour)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface CoachingSession {
  id: string;
  scheduled_at: string;
  session_type: string;
  location_notes?: string;
  pre_session_notes?: string;
  reminder_sent: boolean;
  coach: {
    display_name: string;
    users: {
      email: string;
      full_name: string;
    };
  };
  sailor: {
    email: string;
    full_name: string;
  };
}

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔔 Starting session reminder job...');

    // Get all sessions scheduled for 24 hours from now (+/- 1 hour window)
    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    console.log(`📅 Checking sessions between ${reminderWindowStart.toISOString()} and ${reminderWindowEnd.toISOString()}`);

    const { data: sessions, error } = await supabase
      .from('coaching_sessions')
      .select(`
        id,
        scheduled_at,
        session_type,
        location_notes,
        pre_session_notes,
        reminder_sent,
        coach:coach_profiles!coach_id (
          display_name,
          users!coach_profiles_user_id_fkey (
            email,
            full_name
          )
        ),
        sailor:users!sailor_id (
          email,
          full_name
        )
      `)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_at', reminderWindowStart.toISOString())
      .lte('scheduled_at', reminderWindowEnd.toISOString())
      .eq('reminder_sent', false);

    if (error) {
      console.error('❌ Error fetching sessions:', error);
      throw error;
    }

    console.log(`✅ Found ${sessions?.length || 0} sessions requiring reminders`);

    let successCount = 0;
    let errorCount = 0;

    for (const session of (sessions as CoachingSession[]) || []) {
      try {
        // Send reminder to coach
        console.log(`📧 Sending coach reminder for session ${session.id}`);
        await sendReminderEmail({
          participant_name: session.coach.users.full_name || session.coach.display_name,
          participant_email: session.coach.users.email,
          sailor_name: session.sailor.full_name,
          session_type: session.session_type,
          session_date: session.scheduled_at,
          location: session.location_notes,
          preparation_notes: session.pre_session_notes,
        });

        // Send reminder to sailor
        console.log(`📧 Sending sailor reminder for session ${session.id}`);
        await sendReminderEmail({
          participant_name: session.sailor.full_name,
          participant_email: session.sailor.email,
          coach_name: session.coach.display_name,
          session_type: session.session_type,
          session_date: session.scheduled_at,
          location: session.location_notes,
          preparation_notes: session.pre_session_notes,
        });

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('coaching_sessions')
          .update({ reminder_sent: true })
          .eq('id', session.id);

        if (updateError) {
          console.error(`⚠️  Failed to mark reminder as sent for session ${session.id}:`, updateError);
        } else {
          console.log(`✅ Sent reminders for session ${session.id}`);
          successCount++;
        }
      } catch (sessionError) {
        console.error(`❌ Error processing session ${session.id}:`, sessionError);
        errorCount++;
      }
    }

    const response = {
      success: true,
      summary: {
        total_sessions: sessions?.length || 0,
        reminders_sent: successCount,
        errors: errorCount,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('🎉 Session reminder job complete:', response.summary);

    return new Response(
      JSON.stringify(response),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('💥 Fatal error in session reminder job:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Send reminder email via EmailService
 */
async function sendReminderEmail(data: {
  participant_name: string;
  participant_email: string;
  coach_name?: string;
  sailor_name?: string;
  session_type: string;
  session_date: string;
  location?: string;
  preparation_notes?: string;
}): Promise<void> {
  const otherParty = data.coach_name || data.sailor_name || 'your session partner';
  const subject = `⏰ Reminder: Coaching session tomorrow with ${otherParty}`;

  const html = generateReminderHTML(data, otherParty);
  const text = generateReminderText(data, otherParty);

  // Send via SendGrid
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
  if (!sendgridKey) {
    console.warn('⚠️  SendGrid not configured, skipping email send');
    return;
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendgridKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: data.participant_email }],
      }],
      from: {
        email: Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@regattaflow.com',
        name: 'RegattaFlow',
      },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`SendGrid error: ${JSON.stringify(errorData)}`);
  }
}

function generateReminderHTML(data: any, otherParty: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px 20px; }
          .reminder-box { background: #FFF7ED; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 6px; }
          .reminder-box h2 { color: #F59E0B; margin-top: 0; }
          .prep-notes { background: #E8F4FD; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: #007AFF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: 600; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Session Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${data.participant_name},</p>
            <p>This is a friendly reminder about your upcoming coaching session:</p>

            <div class="reminder-box">
              <h2>Session Details</h2>
              <p>
                <strong>With:</strong> ${otherParty}<br>
                <strong>Type:</strong> ${data.session_type.replace('_', ' ')}<br>
                <strong>When:</strong> ${new Date(data.session_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}<br>
                ${data.location ? `<strong>Location:</strong> ${data.location}<br>` : ''}
              </p>
            </div>

            ${data.preparation_notes ? `
              <div class="prep-notes">
                <h2 style="margin-top: 0;">📋 Preparation Notes</h2>
                <p>${data.preparation_notes}</p>
              </div>
            ` : ''}

            <div style="text-align: center;">
              <a href="${Deno.env.get('EXPO_PUBLIC_APP_URL')}/coach/sessions" class="button">
                View Session Details
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 25px;">
              Need to reschedule? Please contact ${otherParty} as soon as possible.
            </p>
          </div>
          <div class="footer">
            <p>RegattaFlow - Your Sailing Performance Platform<br>© ${new Date().getFullYear()} RegattaFlow. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateReminderText(data: any, otherParty: string): string {
  return `
Session Reminder

Hi ${data.participant_name},

This is a friendly reminder about your upcoming coaching session:

Session Details:
- With: ${otherParty}
- Type: ${data.session_type.replace('_', ' ')}
- When: ${new Date(data.session_date).toLocaleDateString()}
${data.location ? `- Location: ${data.location}` : ''}

${data.preparation_notes ? `Preparation Notes:\n${data.preparation_notes}\n\n` : ''}

View session details at:
${Deno.env.get('EXPO_PUBLIC_APP_URL')}/coach/sessions

Need to reschedule? Please contact ${otherParty} as soon as possible.

RegattaFlow - Your Sailing Performance Platform
  `;
}
