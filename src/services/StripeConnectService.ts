/**
 * Stripe Connect Service for Coach Onboarding and Management
 * Handles Stripe Connect account creation, onboarding, and status checking
 */

import { supabase } from '../lib/supabase';

export interface StripeConnectStatus {
  connected: boolean;
  accountId?: string;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  needsOnboarding?: boolean;
  requirements?: any;
}

export interface StripeOnboardingResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class StripeConnectService {
  /**
   * Check Stripe Connect account status for a coach
   */
  static async getConnectStatus(coachId: string): Promise<StripeConnectStatus> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `/api/stripe/connect/onboard?coachId=${coachId}&userId=${session.user.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Stripe Connect status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Stripe Connect status:', error);
      return {
        connected: false,
        needsOnboarding: true,
      };
    }
  }

  /**
   * Start Stripe Connect onboarding for a coach
   */
  static async startOnboarding(
    coachId: string,
    returnUrl?: string,
    refreshUrl?: string
  ): Promise<StripeOnboardingResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'User not authenticated' };
      }

      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          coachId,
          returnUrl,
          refreshUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to start onboarding' };
      }

      const { url } = await response.json();
      return { success: true, url };
    } catch (error: any) {
      console.error('Error starting Stripe Connect onboarding:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Stripe Express dashboard login link for a coach
   */
  static async getDashboardLink(coachId: string): Promise<StripeOnboardingResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'User not authenticated' };
      }

      const response = await fetch('/api/stripe/connect/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          coachId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to get dashboard link' };
      }

      const { url } = await response.json();
      return { success: true, url };
    } catch (error: any) {
      console.error('Error getting Stripe dashboard link:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh Stripe Connect account status and update local database
   */
  static async refreshAccountStatus(coachId: string): Promise<void> {
    try {
      const status = await this.getConnectStatus(coachId);

      if (status.connected && status.accountId) {
        // Update local database with latest status
        const { error } = await supabase
          .from('coach_profiles')
          .update({
            stripe_details_submitted: status.detailsSubmitted,
            stripe_charges_enabled: status.chargesEnabled,
            stripe_payouts_enabled: status.payoutsEnabled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', coachId);

        if (error) {
          console.error('Error updating coach Stripe status:', error);
        }
      }
    } catch (error) {
      console.error('Error refreshing account status:', error);
    }
  }

  /**
   * Check if coach is ready to receive payments
   */
  static async isPaymentReady(coachId: string): Promise<boolean> {
    try {
      const status = await this.getConnectStatus(coachId);
      return status.connected &&
             status.detailsSubmitted === true &&
             status.chargesEnabled === true;
    } catch (error) {
      console.error('Error checking payment readiness:', error);
      return false;
    }
  }

  /**
   * Check if coach is ready to receive payouts
   */
  static async isPayoutReady(coachId: string): Promise<boolean> {
    try {
      const status = await this.getConnectStatus(coachId);
      return status.connected &&
             status.detailsSubmitted === true &&
             status.payoutsEnabled === true;
    } catch (error) {
      console.error('Error checking payout readiness:', error);
      return false;
    }
  }

  /**
   * Get requirements needed to complete Stripe onboarding
   */
  static async getRequirements(coachId: string): Promise<string[]> {
    try {
      const status = await this.getConnectStatus(coachId);
      return status.requirements?.currently_due || [];
    } catch (error) {
      console.error('Error getting requirements:', error);
      return [];
    }
  }
}

export default StripeConnectService;