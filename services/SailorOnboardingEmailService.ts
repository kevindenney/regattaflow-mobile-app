/**
 * Sailor Onboarding Email Service
 * Beautiful email sequences for sailor user onboarding
 * Handles welcome, tips, trial reminders, and re-engagement emails
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SailorOnboardingEmailData {
  // Sailor info
  sailor_id: string;
  sailor_name: string;
  sailor_email: string;
  
  // Context
  home_venue?: string;
  boat_class?: string;
  boat_name?: string;
  
  // Subscription info
  subscription_tier: 'free' | 'sailor_pro' | 'championship' | 'professional';
  trial_start_date?: string;
  trial_end_date?: string;
  
  // App URLs
  app_url: string;
  dashboard_url: string;
  upgrade_url: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export type OnboardingEmailType = 
  | 'welcome'
  | 'quick_start'
  | 'feature_tip'
  | 'trial_reminder_5'
  | 'trial_reminder_2'
  | 'trial_ending'
  | 'trial_ended'
  | 'onboarding_complete'
  | 're_engagement';

// ============================================================================
// EMAIL SERVICE CLASS
// ============================================================================

class SailorOnboardingEmailService {
  
  private readonly APP_NAME = 'RegattaFlow';
  private readonly SUPPORT_EMAIL = 'support@regattaflow.com';
  
  /**
   * Send a welcome email immediately after signup
   */
  async sendWelcomeEmail(data: SailorOnboardingEmailData): Promise<boolean> {
    try {
      const template = this.generateWelcomeEmail(data);
      return await this.send(data.sailor_email, template, 'welcome', data.sailor_id);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Send quick start guide if onboarding incomplete after 30 mins
   */
  async sendQuickStartEmail(data: SailorOnboardingEmailData): Promise<boolean> {
    try {
      const template = this.generateQuickStartEmail(data);
      return await this.send(data.sailor_email, template, 'quick_start', data.sailor_id);
    } catch (error) {
      console.error('Error sending quick start email:', error);
      return false;
    }
  }

  /**
   * Send feature tip email (day 2)
   */
  async sendFeatureTipEmail(data: SailorOnboardingEmailData): Promise<boolean> {
    try {
      const template = this.generateFeatureTipEmail(data);
      return await this.send(data.sailor_email, template, 'feature_tip', data.sailor_id);
    } catch (error) {
      console.error('Error sending feature tip email:', error);
      return false;
    }
  }

  /**
   * Send trial reminder (5 days left)
   */
  async sendTrialReminder5Days(data: SailorOnboardingEmailData): Promise<boolean> {
    try {
      const template = this.generateTrialReminderEmail(data, 5);
      return await this.send(data.sailor_email, template, 'trial_reminder_5', data.sailor_id);
    } catch (error) {
      console.error('Error sending trial reminder email:', error);
      return false;
    }
  }

  /**
   * Send trial reminder (2 days left)
   */
  async sendTrialReminder2Days(data: SailorOnboardingEmailData): Promise<boolean> {
    try {
      const template = this.generateTrialReminderEmail(data, 2);
      return await this.send(data.sailor_email, template, 'trial_reminder_2', data.sailor_id);
    } catch (error) {
      console.error('Error sending trial reminder email:', error);
      return false;
    }
  }

  /**
   * Send trial ending today email
   */
  async sendTrialEndingEmail(data: SailorOnboardingEmailData): Promise<boolean> {
    try {
      const template = this.generateTrialEndingEmail(data);
      return await this.send(data.sailor_email, template, 'trial_ending', data.sailor_id);
    } catch (error) {
      console.error('Error sending trial ending email:', error);
      return false;
    }
  }

  /**
   * Send trial ended / downgrade notice
   */
  async sendTrialEndedEmail(data: SailorOnboardingEmailData): Promise<boolean> {
    try {
      const template = this.generateTrialEndedEmail(data);
      return await this.send(data.sailor_email, template, 'trial_ended', data.sailor_id);
    } catch (error) {
      console.error('Error sending trial ended email:', error);
      return false;
    }
  }

  /**
   * Send onboarding complete email with tips
   */
  async sendOnboardingCompleteEmail(data: SailorOnboardingEmailData): Promise<boolean> {
    try {
      const template = this.generateOnboardingCompleteEmail(data);
      return await this.send(data.sailor_email, template, 'onboarding_complete', data.sailor_id);
    } catch (error) {
      console.error('Error sending onboarding complete email:', error);
      return false;
    }
  }

  /**
   * Send re-engagement email (day 14 if inactive)
   */
  async sendReEngagementEmail(data: SailorOnboardingEmailData): Promise<boolean> {
    try {
      const template = this.generateReEngagementEmail(data);
      return await this.send(data.sailor_email, template, 're_engagement', data.sailor_id);
    } catch (error) {
      console.error('Error sending re-engagement email:', error);
      return false;
    }
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  private generateWelcomeEmail(data: SailorOnboardingEmailData): EmailTemplate {
    const firstName = data.sailor_name.split(' ')[0];
    
    return {
      subject: `⛵ Welcome aboard, ${firstName}!`,
      html: this.wrapInTemplate(`
        <div class="header" style="background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);">
          <h1 style="color: white; font-size: 28px; margin: 0 0 8px 0;">Welcome to ${this.APP_NAME}!</h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">Your sailing journey just got smarter</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #0f172a;">Hi ${firstName}! 👋</p>
          
          <p style="color: #475569; font-size: 15px; line-height: 1.7;">
            Welcome to ${this.APP_NAME} — the AI-powered platform built by sailors, for sailors. 
            Whether you're racing Dragons, campaigning a J/70, or sailing Lasers, we're here to help you 
            perform at your best.
          </p>
          
          <div class="feature-box" style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #0369a1; margin: 0 0 16px 0; font-size: 16px;">🎯 Complete your setup in 2 minutes:</h3>
            
            <div style="margin-bottom: 12px;">
              <span style="display: inline-block; width: 24px; height: 24px; background: #0ea5e9; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 12px;">1</span>
              <span style="color: #0f172a;">Set your home sailing venue</span>
            </div>
            
            <div style="margin-bottom: 12px;">
              <span style="display: inline-block; width: 24px; height: 24px; background: #0ea5e9; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 12px;">2</span>
              <span style="color: #0f172a;">Add your boat details</span>
            </div>
            
            <div>
              <span style="display: inline-block; width: 24px; height: 24px; background: #0ea5e9; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 12px;">3</span>
              <span style="color: #0f172a;">Create your first race</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.dashboard_url}" class="button" style="display: inline-block; background: #0ea5e9; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Complete Setup →
            </a>
          </div>
          
          <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>🎁 You have 7 days of full access</strong> — explore AI race analysis, venue intelligence, and all premium features!
            </p>
          </div>
        </div>
      `, data),
      text: `
Welcome to ${this.APP_NAME}, ${firstName}!

Your sailing journey just got smarter. Complete your setup in 2 minutes:

1. Set your home sailing venue
2. Add your boat details  
3. Create your first race

You have 7 days of full access to all premium features!

Complete Setup: ${data.dashboard_url}

Questions? Reply to this email anytime.

Fair winds,
The ${this.APP_NAME} Team
      `.trim()
    };
  }

  private generateQuickStartEmail(data: SailorOnboardingEmailData): EmailTemplate {
    const firstName = data.sailor_name.split(' ')[0];
    
    return {
      subject: `⏰ ${firstName}, finish setting up ${this.APP_NAME}`,
      html: this.wrapInTemplate(`
        <div class="header" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
          <h1 style="color: white; font-size: 24px; margin: 0;">Quick Start Guide</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #0f172a;">Hi ${firstName},</p>
          
          <p style="color: #475569; line-height: 1.7;">
            We noticed you started setting up ${this.APP_NAME} but haven't finished yet. 
            Let's get you racing-ready in under 2 minutes!
          </p>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #8b5cf6;">
            <h3 style="color: #6d28d9; margin: 0 0 12px 0;">🚀 What you're missing:</h3>
            <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>AI-powered race strategy analysis</li>
              <li>Local venue intelligence & conditions</li>
              <li>Weather integration for your location</li>
              <li>Equipment optimization tips</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.dashboard_url}" class="button" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
              Continue Setup
            </a>
          </div>
        </div>
      `, data),
      text: `
Hi ${firstName},

We noticed you started setting up ${this.APP_NAME} but haven't finished yet.

What you're missing:
- AI-powered race strategy analysis
- Local venue intelligence & conditions
- Weather integration for your location
- Equipment optimization tips

Continue Setup: ${data.dashboard_url}

Fair winds,
The ${this.APP_NAME} Team
      `.trim()
    };
  }

  private generateFeatureTipEmail(data: SailorOnboardingEmailData): EmailTemplate {
    const firstName = data.sailor_name.split(' ')[0];
    const boatClassTip = data.boat_class 
      ? `Especially useful for ${data.boat_class} racing!`
      : 'Works with any boat class!';
    
    return {
      subject: `💡 Pro tip: AI race analysis for your next regatta`,
      html: this.wrapInTemplate(`
        <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
          <h1 style="color: white; font-size: 24px; margin: 0;">Feature Spotlight</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #0f172a;">Hi ${firstName},</p>
          
          <p style="color: #475569; line-height: 1.7;">
            Here's a killer feature most sailors don't discover right away:
          </p>
          
          <div style="background: #ecfdf5; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #059669; margin: 0 0 12px 0; font-size: 20px;">🤖 AI Race Analysis</h2>
            <p style="color: #065f46; margin: 0 0 16px 0; line-height: 1.7;">
              Upload your race documents (NOR, Sailing Instructions) and get:
            </p>
            <ul style="color: #065f46; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Strategic recommendations based on course layout</li>
              <li>Key rule interpretations that matter for this race</li>
              <li>Weather-integrated tactical suggestions</li>
              <li>Mark rounding priorities</li>
            </ul>
            <p style="color: #059669; margin: 16px 0 0 0; font-weight: 600; font-size: 14px;">
              ${boatClassTip}
            </p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.app_url}/add-race" class="button" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
              Try AI Analysis →
            </a>
          </div>
        </div>
      `, data),
      text: `
Hi ${firstName},

Here's a killer feature most sailors don't discover right away:

🤖 AI Race Analysis

Upload your race documents (NOR, Sailing Instructions) and get:
- Strategic recommendations based on course layout
- Key rule interpretations that matter for this race
- Weather-integrated tactical suggestions
- Mark rounding priorities

${boatClassTip}

Try it now: ${data.app_url}/add-race

Fair winds,
The ${this.APP_NAME} Team
      `.trim()
    };
  }

  private generateTrialReminderEmail(data: SailorOnboardingEmailData, daysLeft: number): EmailTemplate {
    const firstName = data.sailor_name.split(' ')[0];
    const urgency = daysLeft <= 2 ? '⚠️' : '📅';
    
    return {
      subject: `${urgency} ${firstName}, ${daysLeft} days left in your trial`,
      html: this.wrapInTemplate(`
        <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
          <h1 style="color: white; font-size: 24px; margin: 0;">${daysLeft} Days Left</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Your premium trial ends soon</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #0f172a;">Hi ${firstName},</p>
          
          <p style="color: #475569; line-height: 1.7;">
            Your ${this.APP_NAME} premium trial ends in <strong>${daysLeft} days</strong>. 
            After that, you'll move to our free tier.
          </p>
          
          <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #92400e; margin: 0 0 12px 0;">What you'll lose access to:</h3>
            <ul style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Unlimited AI race analysis</li>
              <li>Global venue intelligence</li>
              <li>Offline mode & cloud backup</li>
              <li>Advanced weather integration</li>
              <li>Performance analytics</li>
            </ul>
          </div>
          
          <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #065f46; margin: 0 0 8px 0;">Keep all features for just $9.99/month</h3>
            <p style="color: #047857; margin: 0; font-size: 14px;">
              Less than a day's mooring fee for unlimited racing intelligence.
            </p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.upgrade_url}" class="button" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
              Upgrade Now
            </a>
          </div>
        </div>
      `, data),
      text: `
Hi ${firstName},

Your ${this.APP_NAME} premium trial ends in ${daysLeft} days.

What you'll lose access to:
- Unlimited AI race analysis
- Global venue intelligence
- Offline mode & cloud backup
- Advanced weather integration
- Performance analytics

Keep all features for just $9.99/month — less than a day's mooring fee!

Upgrade now: ${data.upgrade_url}

Fair winds,
The ${this.APP_NAME} Team
      `.trim()
    };
  }

  private generateTrialEndingEmail(data: SailorOnboardingEmailData): EmailTemplate {
    const firstName = data.sailor_name.split(' ')[0];
    
    return {
      subject: `⚡ ${firstName}, your trial ends TODAY`,
      html: this.wrapInTemplate(`
        <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
          <h1 style="color: white; font-size: 24px; margin: 0;">Trial Ends Today</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #0f172a;">Hi ${firstName},</p>
          
          <p style="color: #475569; line-height: 1.7;">
            This is it — your premium trial ends <strong>today</strong>. 
            Don't lose access to your race intelligence!
          </p>
          
          <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin: 24px 0; border: 2px solid #fecaca;">
            <p style="color: #991b1b; margin: 0; font-size: 16px; font-weight: 600;">
              🚨 Upgrade in the next few hours to keep all your premium features!
            </p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.upgrade_url}" class="button" style="display: inline-block; background: #ef4444; color: white; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 18px;">
              Upgrade Now — $9.99/mo
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Cancel anytime. No questions asked.
          </p>
        </div>
      `, data),
      text: `
Hi ${firstName},

This is it — your premium trial ends TODAY.

Upgrade now to keep all your premium features!

Upgrade: ${data.upgrade_url}

$9.99/month — Cancel anytime.

Fair winds,
The ${this.APP_NAME} Team
      `.trim()
    };
  }

  private generateTrialEndedEmail(data: SailorOnboardingEmailData): EmailTemplate {
    const firstName = data.sailor_name.split(' ')[0];
    
    return {
      subject: `📦 ${firstName}, you're now on the Free plan`,
      html: this.wrapInTemplate(`
        <div class="header" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
          <h1 style="color: white; font-size: 24px; margin: 0;">Welcome to Free</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #0f172a;">Hi ${firstName},</p>
          
          <p style="color: #475569; line-height: 1.7;">
            Your premium trial has ended and you're now on our Free plan. 
            You can still use ${this.APP_NAME}, but with limited features.
          </p>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #374151; margin: 0 0 12px 0;">✅ What you still have:</h3>
            <ul style="color: #4b5563; margin: 0 0 16px 0; padding-left: 20px; line-height: 1.8;">
              <li>Basic race tracking</li>
              <li>3 document uploads</li>
              <li>Basic weather info</li>
            </ul>
            
            <h3 style="color: #6b7280; margin: 0 0 12px 0;">❌ What you lost:</h3>
            <ul style="color: #9ca3af; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Unlimited AI race analysis</li>
              <li>Global venue intelligence</li>
              <li>Offline mode</li>
              <li>Advanced analytics</li>
            </ul>
          </div>
          
          <p style="color: #475569; line-height: 1.7;">
            Ready to upgrade anytime? All your data is safe and waiting.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.upgrade_url}" class="button" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
              Upgrade to Pro
            </a>
          </div>
        </div>
      `, data),
      text: `
Hi ${firstName},

Your premium trial has ended and you're now on our Free plan.

What you still have:
✅ Basic race tracking
✅ 3 document uploads
✅ Basic weather info

What you lost:
❌ Unlimited AI race analysis
❌ Global venue intelligence
❌ Offline mode
❌ Advanced analytics

Ready to upgrade? All your data is safe: ${data.upgrade_url}

Fair winds,
The ${this.APP_NAME} Team
      `.trim()
    };
  }

  private generateOnboardingCompleteEmail(data: SailorOnboardingEmailData): EmailTemplate {
    const firstName = data.sailor_name.split(' ')[0];
    const venueMessage = data.home_venue 
      ? `We've loaded local intelligence for ${data.home_venue}.` 
      : '';
    
    return {
      subject: `🎉 You're all set, ${firstName}!`,
      html: this.wrapInTemplate(`
        <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
          <h1 style="color: white; font-size: 28px; margin: 0;">You're Ready to Race! 🏆</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #0f172a;">Awesome work, ${firstName}!</p>
          
          <p style="color: #475569; line-height: 1.7;">
            Your ${this.APP_NAME} account is fully set up. ${venueMessage}
          </p>
          
          <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #065f46; margin: 0 0 16px 0;">📍 Your Next Steps:</h3>
            
            <div style="margin-bottom: 16px; padding-left: 12px; border-left: 3px solid #10b981;">
              <h4 style="color: #047857; margin: 0 0 4px 0;">1. Add Your Next Race</h4>
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                Upload your Notice of Race or Sailing Instructions for AI analysis.
              </p>
            </div>
            
            <div style="margin-bottom: 16px; padding-left: 12px; border-left: 3px solid #10b981;">
              <h4 style="color: #047857; margin: 0 0 4px 0;">2. Check Venue Intelligence</h4>
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                See local conditions, typical wind patterns, and tidal info for your area.
              </p>
            </div>
            
            <div style="padding-left: 12px; border-left: 3px solid #10b981;">
              <h4 style="color: #047857; margin: 0 0 4px 0;">3. Explore Your Dashboard</h4>
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                Track performance, manage boats, and connect with your sailing community.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.dashboard_url}" class="button" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
              Go to Dashboard
            </a>
          </div>
        </div>
      `, data),
      text: `
Awesome work, ${firstName}!

Your ${this.APP_NAME} account is fully set up. ${venueMessage}

Your Next Steps:

1. Add Your Next Race
   Upload your Notice of Race or Sailing Instructions for AI analysis.

2. Check Venue Intelligence
   See local conditions, typical wind patterns, and tidal info.

3. Explore Your Dashboard
   Track performance, manage boats, and connect with your community.

Go to Dashboard: ${data.dashboard_url}

Fair winds,
The ${this.APP_NAME} Team
      `.trim()
    };
  }

  private generateReEngagementEmail(data: SailorOnboardingEmailData): EmailTemplate {
    const firstName = data.sailor_name.split(' ')[0];
    
    return {
      subject: `🌊 ${firstName}, we miss you on the water!`,
      html: this.wrapInTemplate(`
        <div class="header" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
          <h1 style="color: white; font-size: 24px; margin: 0;">Time to Get Back Racing?</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #0f172a;">Hi ${firstName},</p>
          
          <p style="color: #475569; line-height: 1.7;">
            It's been a while since you've used ${this.APP_NAME}. Racing season is always around 
            the corner — are you ready for your next regatta?
          </p>
          
          <div style="background: #eff6ff; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #1e40af; margin: 0 0 12px 0;">🆕 What's new since you left:</h3>
            <ul style="color: #1e3a8a; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Improved AI race analysis</li>
              <li>More venue data worldwide</li>
              <li>Enhanced weather integration</li>
              <li>Better performance analytics</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.dashboard_url}" class="button" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
              Get Back to Racing
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Need help? Just reply to this email.
          </p>
        </div>
      `, data),
      text: `
Hi ${firstName},

It's been a while since you've used ${this.APP_NAME}. Racing season is always around the corner!

What's new:
- Improved AI race analysis
- More venue data worldwide
- Enhanced weather integration
- Better performance analytics

Get back to racing: ${data.dashboard_url}

Need help? Just reply to this email.

Fair winds,
The ${this.APP_NAME} Team
      `.trim()
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Wrap email content in a consistent template
   */
  private wrapInTemplate(content: string, data: SailorOnboardingEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.APP_NAME}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      padding: 32px 24px;
      text-align: center;
    }
    .content {
      padding: 32px 24px;
    }
    .footer {
      background: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #64748b;
      font-size: 13px;
      margin: 4px 0;
    }
    .footer a {
      color: #0ea5e9;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .wrapper { padding: 12px; }
      .content { padding: 24px 16px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      ${content}
      
      <div class="footer">
        <p><strong>${this.APP_NAME}</strong></p>
        <p>AI-Powered Racing Intelligence</p>
        <p style="margin-top: 12px;">
          <a href="${data.app_url}">Website</a> • 
          <a href="mailto:${this.SUPPORT_EMAIL}">Support</a>
        </p>
        <p style="margin-top: 16px; font-size: 11px; color: #94a3b8;">
          You're receiving this because you signed up for ${this.APP_NAME}.<br>
          <a href="${data.app_url}/settings" style="color: #94a3b8;">Manage email preferences</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send email via Supabase Edge Function
   */
  private async send(
    to: string, 
    template: EmailTemplate, 
    emailType: OnboardingEmailType,
    sailorId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject: template.subject,
          html: template.html,
          text: template.text,
          replyTo: this.SUPPORT_EMAIL,
        },
      });

      if (error) {
        console.error('Error sending email:', error);
        return false;
      }

      // Log the email
      await this.logEmailSent(sailorId, emailType, to);
      
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Log email sent for tracking
   */
  private async logEmailSent(
    sailorId: string,
    emailType: OnboardingEmailType,
    recipientEmail: string
  ): Promise<void> {
    try {
      await supabase.from('sailor_email_sequences').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      }).match({
        user_id: sailorId,
        email_type: emailType,
        status: 'pending',
      });
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  /**
   * Cancel pending emails for a user (e.g., when they upgrade)
   */
  async cancelPendingTrialEmails(sailorId: string): Promise<void> {
    try {
      await supabase.from('sailor_email_sequences').update({
        status: 'cancelled',
      }).match({
        user_id: sailorId,
        status: 'pending',
      }).in('email_type', ['trial_reminder_5', 'trial_reminder_2', 'trial_ending', 'trial_ended']);
    } catch (error) {
      console.error('Failed to cancel pending emails:', error);
    }
  }
}

// Export singleton
export const sailorOnboardingEmailService = new SailorOnboardingEmailService();
export default SailorOnboardingEmailService;

