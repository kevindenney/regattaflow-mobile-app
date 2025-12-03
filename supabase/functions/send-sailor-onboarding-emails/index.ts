/**
 * Supabase Edge Function: send-sailor-onboarding-emails
 * Processes pending email sequences and sends onboarding emails
 * Designed to run as a cron job every 5-15 minutes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Email provider configuration (using Resend as example)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'RegattaFlow <noreply@regattaflow.com>'
const APP_URL = Deno.env.get('APP_URL') || 'https://app.regattaflow.com'

interface EmailSequence {
  id: string
  user_id: string
  email_type: string
  metadata: Record<string, any>
  user_email: string
  user_name: string
  subscription_tier: string
  subscription_status: string
  onboarding_completed: boolean
  last_active_at: string | null
}

interface EmailPayload {
  from: string
  to: string
  subject: string
  html: string
  text: string
  reply_to?: string
}

// Email template generator (simplified - full templates in SailorOnboardingEmailService.ts)
function generateEmailContent(
  emailType: string,
  data: {
    userName: string
    userEmail: string
    subscriptionTier: string
    appUrl: string
    dashboardUrl: string
    upgradeUrl: string
  }
): { subject: string; html: string; text: string } {
  const firstName = data.userName.split(' ')[0] || 'Sailor'
  
  switch (emailType) {
    case 'welcome':
      return {
        subject: `⛵ Welcome aboard, ${firstName}!`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0ea5e9, #0369a1); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">Welcome to RegattaFlow!</h1>
            </div>
            <div style="padding: 24px; background: #fff;">
              <p>Hi ${firstName}! 👋</p>
              <p>Welcome to RegattaFlow — the AI-powered platform built by sailors, for sailors.</p>
              <h3>🎯 Complete your setup in 2 minutes:</h3>
              <ol>
                <li>Set your home sailing venue</li>
                <li>Add your boat details</li>
                <li>Create your first race</li>
              </ol>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${data.dashboardUrl}" style="background: #0ea5e9; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Complete Setup →</a>
              </div>
              <p style="background: #fef3c7; padding: 12px; border-radius: 8px; color: #92400e;">
                <strong>🎁 You have 7 days of full access</strong> — explore all premium features!
              </p>
            </div>
          </div>
        `,
        text: `Welcome to RegattaFlow, ${firstName}!\n\nComplete your setup:\n1. Set your home sailing venue\n2. Add your boat details\n3. Create your first race\n\nVisit: ${data.dashboardUrl}`,
      }
      
    case 'quick_start':
      return {
        subject: `⏰ ${firstName}, finish setting up RegattaFlow`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">Quick Start Guide</h1>
            </div>
            <div style="padding: 24px; background: #fff;">
              <p>Hi ${firstName},</p>
              <p>We noticed you started setting up RegattaFlow but haven't finished yet. Let's get you racing-ready!</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${data.dashboardUrl}" style="background: #8b5cf6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Continue Setup</a>
              </div>
            </div>
          </div>
        `,
        text: `Hi ${firstName},\n\nFinish setting up RegattaFlow to access AI race analysis and more.\n\nContinue: ${data.dashboardUrl}`,
      }
      
    case 'trial_reminder_5':
    case 'trial_reminder_2':
      const daysLeft = emailType === 'trial_reminder_5' ? 5 : 2
      return {
        subject: `📅 ${firstName}, ${daysLeft} days left in your trial`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">${daysLeft} Days Left</h1>
            </div>
            <div style="padding: 24px; background: #fff;">
              <p>Hi ${firstName},</p>
              <p>Your premium trial ends in <strong>${daysLeft} days</strong>. Keep all your features for just $9.99/month.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${data.upgradeUrl}" style="background: #f59e0b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Upgrade Now</a>
              </div>
            </div>
          </div>
        `,
        text: `Hi ${firstName},\n\nYour trial ends in ${daysLeft} days. Upgrade to keep all features: ${data.upgradeUrl}`,
      }
      
    case 'trial_ending':
      return {
        subject: `⚡ ${firstName}, your trial ends TODAY`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">Trial Ends Today</h1>
            </div>
            <div style="padding: 24px; background: #fff;">
              <p>Hi ${firstName},</p>
              <p>Your premium trial ends <strong>today</strong>. Don't lose access to AI race analysis!</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${data.upgradeUrl}" style="background: #ef4444; color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 18px;">Upgrade Now — $9.99/mo</a>
              </div>
            </div>
          </div>
        `,
        text: `Hi ${firstName},\n\nYour trial ends TODAY. Upgrade now: ${data.upgradeUrl}`,
      }
      
    case 'trial_ended':
      return {
        subject: `📦 ${firstName}, you're now on the Free plan`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6b7280, #4b5563); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">Welcome to Free</h1>
            </div>
            <div style="padding: 24px; background: #fff;">
              <p>Hi ${firstName},</p>
              <p>Your trial has ended. You're on our Free plan with limited features.</p>
              <p>Ready to upgrade? All your data is safe and waiting.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${data.upgradeUrl}" style="background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Upgrade to Pro</a>
              </div>
            </div>
          </div>
        `,
        text: `Hi ${firstName},\n\nYour trial has ended. Upgrade anytime: ${data.upgradeUrl}`,
      }
      
    case 'feature_tip':
      return {
        subject: `💡 Pro tip: AI race analysis for your next regatta`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">Feature Spotlight</h1>
            </div>
            <div style="padding: 24px; background: #fff;">
              <p>Hi ${firstName},</p>
              <p>Here's a killer feature most sailors don't discover right away:</p>
              <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 16px 0;">
                <h2 style="color: #059669; margin: 0 0 12px 0;">🤖 AI Race Analysis</h2>
                <p style="color: #065f46; margin: 0;">Upload your race documents and get strategic recommendations, rule interpretations, and tactical suggestions!</p>
              </div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${data.appUrl}/add-race" style="background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Try AI Analysis →</a>
              </div>
            </div>
          </div>
        `,
        text: `Hi ${firstName},\n\nTry our AI Race Analysis feature! Upload your race documents for strategic recommendations.\n\nTry it: ${data.appUrl}/add-race`,
      }
      
    case 're_engagement':
      return {
        subject: `🌊 ${firstName}, we miss you on the water!`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">Time to Get Back Racing?</h1>
            </div>
            <div style="padding: 24px; background: #fff;">
              <p>Hi ${firstName},</p>
              <p>It's been a while! Are you ready for your next regatta?</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${data.dashboardUrl}" style="background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Get Back to Racing</a>
              </div>
            </div>
          </div>
        `,
        text: `Hi ${firstName},\n\nIt's been a while! Get back to racing: ${data.dashboardUrl}`,
      }
      
    default:
      return {
        subject: `RegattaFlow Update`,
        html: `<p>Hi ${firstName}, check out what's new in RegattaFlow!</p>`,
        text: `Hi ${firstName}, check out what's new in RegattaFlow!`,
      }
  }
}

// Check if email should be sent based on conditions
function shouldSendEmail(email: EmailSequence): boolean {
  const conditions = email.metadata?.condition
  
  if (!conditions) return true
  
  switch (conditions) {
    case 'onboarding_incomplete':
      return !email.onboarding_completed
      
    case 'is_trialing':
      return email.subscription_status === 'trialing'
      
    case 'trial_ended_not_converted':
      return email.subscription_status !== 'active' && email.subscription_tier === 'free'
      
    case 'inactive_7_days':
      if (!email.last_active_at) return true
      const lastActive = new Date(email.last_active_at)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return lastActive < sevenDaysAgo
      
    default:
      return true
  }
}

// Send email via Resend
async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured')
    return false
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: payload.reply_to || 'support@regattaflow.com',
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

serve(async (req) => {
  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get pending emails
    const { data: pendingEmails, error: fetchError } = await supabase
      .rpc('get_pending_emails_to_send')
    
    if (fetchError) {
      console.error('Error fetching pending emails:', fetchError)
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending emails', processed: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    console.log(`Processing ${pendingEmails.length} pending emails`)
    
    let sent = 0
    let skipped = 0
    let failed = 0
    
    for (const email of pendingEmails as EmailSequence[]) {
      // Check conditions
      if (!shouldSendEmail(email)) {
        // Cancel this email since conditions aren't met
        await supabase.rpc('mark_email_failed', {
          p_email_id: email.id,
          p_error: 'Conditions not met',
        })
        skipped++
        continue
      }
      
      // Generate email content
      const content = generateEmailContent(email.email_type, {
        userName: email.user_name,
        userEmail: email.user_email,
        subscriptionTier: email.subscription_tier,
        appUrl: APP_URL,
        dashboardUrl: `${APP_URL}/dashboard`,
        upgradeUrl: `${APP_URL}/subscription`,
      })
      
      // Send email
      const success = await sendEmail({
        from: FROM_EMAIL,
        to: email.user_email,
        subject: content.subject,
        html: content.html,
        text: content.text,
      })
      
      if (success) {
        await supabase.rpc('mark_email_sent', { p_email_id: email.id })
        sent++
      } else {
        await supabase.rpc('mark_email_failed', {
          p_email_id: email.id,
          p_error: 'Send failed',
        })
        failed++
      }
    }
    
    return new Response(
      JSON.stringify({
        message: 'Email processing complete',
        processed: pendingEmails.length,
        sent,
        skipped,
        failed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

