/**
 * Stripe Connect Service for Coach Onboarding and Management
 * Handles Stripe Connect account creation, onboarding, and status checking
 */

import { supabase } from '@/services/supabase';

// Get Supabase function URL
const getSupabaseFunctionUrl = (functionName: string) => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('EXPO_PUBLIC_SUPABASE_URL not configured');
  return `${supabaseUrl}/functions/v1/${functionName}`;
};

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

export interface PayoutResult {
  success: boolean;
  payout_id?: string;
  amount?: number;
  currency?: string;
  estimated_arrival?: string | null;
  status?: string;
  error?: string;
  code?: string;
  pending_amount?: number;
  existing_payout?: {
    id: string;
    amount: number;
    currency: string;
    estimated_arrival: string | null;
  };
}

export interface PayoutHistoryItem {
  id: string;
  amount: number;
  currency: string;
  created: number;
  arrival_date: number;
  status: string;
  type: string;
  description: string;
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

      const functionUrl = getSupabaseFunctionUrl('stripe-connect-status');
      const params = new URLSearchParams({
        coach_id: coachId,
      });

      const response = await fetch(`${functionUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

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
   * Get current Stripe balance for a coach's connected account
   */
  static async getBalance(coachId: string): Promise<{
    available: number; // amount in cents
    pending: number;   // amount in cents
    currency?: string;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const functionUrl = getSupabaseFunctionUrl('stripe-balance');
      const params = new URLSearchParams({
        coachId,
        userId: session.user.id,
      });

      const response = await fetch(`${functionUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // BUG 3: Propagate error so the UI can distinguish "no balance" from "unavailable"
        throw new Error(errorData?.error || 'Failed to fetch Stripe balance');
      }

      const data = await response.json();
      return {
        available: typeof data.available === 'number' ? data.available : 0,
        pending: typeof data.pending === 'number' ? data.pending : 0,
        currency: data.currency || 'usd',
      };
    } catch (error) {
      console.error('Error fetching Stripe balance:', error);
      throw error;
    }
  }

  /**
   * List recent transactions/transfers for a coach's connected account
   */
  static async getTransactions(
    coachId: string,
    opts?: { limit?: number }
  ): Promise<
    Array<{
      id: string;
      amount: number; // cents
      currency: string;
      created: number; // unix epoch seconds
      description?: string;
      status?: string;
      type?: string; // charge|transfer|payout
    }>
  > {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const functionUrl = getSupabaseFunctionUrl('stripe-transactions');
      const params = new URLSearchParams({
        coachId,
        userId: session.user.id,
      });
      if (opts?.limit) params.set('limit', String(opts.limit));

      const response = await fetch(`${functionUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Failed to fetch Stripe transactions');
      }

      const data = await response.json();

      return Array.isArray(data?.transactions) ? data.transactions : [];
    } catch (error) {
      console.error('Error fetching Stripe transactions:', error);
      return [];
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

      const functionUrl = getSupabaseFunctionUrl('create-stripe-connect-account');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          coach_id: coachId,
          return_url: returnUrl,
          refresh_url: refreshUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to start onboarding' };
      }

      return { success: true, url: data.url };
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

      const functionUrl = getSupabaseFunctionUrl('stripe-connect-dashboard');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          coach_id: coachId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to get dashboard link' };
      }

      return { success: true, url: data.url };
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

  /**
   * Request a payout of all available funds to the coach's bank account
   */
  static async requestPayout(coachId: string): Promise<PayoutResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'User not authenticated' };
      }

      const functionUrl = getSupabaseFunctionUrl('stripe-create-payout');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ coach_id: coachId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create payout',
          code: data.code,
          pending_amount: data.pending_amount,
          existing_payout: data.existing_payout,
        };
      }

      return data;
    } catch (error: any) {
      console.error('Error requesting payout:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get the available balance (not pending) for a coach's Stripe account
   */
  static async getAvailableBalance(coachId: string): Promise<{
    available: number;
    pending: number;
    currency: string;
  }> {
    return this.getBalance(coachId).then(balance => ({
      available: balance.available,
      pending: balance.pending,
      currency: balance.currency || 'usd',
    }));
  }

  /**
   * Get payout history for a coach via the stripe-transactions edge function
   */
  static async getPayoutHistory(coachId: string): Promise<PayoutHistoryItem[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const functionUrl = getSupabaseFunctionUrl('stripe-transactions');
      const params = new URLSearchParams({
        coachId,
        userId: session.user.id,
      });

      const response = await fetch(`${functionUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payout history');
      }

      const data = await response.json();
      return Array.isArray(data?.payouts) ? data.payouts : [];
    } catch (error) {
      console.error('Error fetching payout history:', error);
      return [];
    }
  }
}

export default StripeConnectService;