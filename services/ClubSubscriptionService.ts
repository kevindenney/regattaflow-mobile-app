/**
 * Club Subscription Service
 * Handles Stripe subscription management for club accounts
 */

import { supabase } from './supabase';

export interface SubscriptionPlan {
  id: 'starter' | 'professional' | 'enterprise';
  name: string;
  price: number; // in cents
  priceFormatted: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  stripePriceId?: string; // Set in environment or config
}

export const CLUB_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Club Starter',
    price: 9900, // $99.00
    priceFormatted: '$99',
    period: '/per month',
    description: 'Perfect for small yacht clubs',
    features: [
      'Up to 5 events per month',
      'Basic scoring system',
      'Entry management',
      'Results publication',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'professional',
    name: 'Club Professional',
    price: 29900, // $299.00
    priceFormatted: '$299',
    period: '/per month',
    description: 'For active sailing clubs',
    features: [
      'Unlimited events',
      'Advanced scoring options',
      'Live race tracking',
      'Custom branding',
      'Priority support',
      'Mobile race committee app',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99900, // $999.00
    priceFormatted: '$999',
    period: '/per month',
    description: 'For major sailing organizations',
    features: [
      'Everything in Professional',
      'Multiple venue management',
      'Advanced analytics',
      'API access',
      'Dedicated support',
      'Custom integrations',
    ],
    popular: false,
  },
];

export interface CreateSubscriptionParams {
  userId: string;
  planId: 'starter' | 'professional' | 'enterprise';
  paymentMethodId: string; // Stripe payment method ID
  billingDetails?: {
    name: string;
    email: string;
    address?: {
      line1: string;
      city: string;
      postal_code: string;
      country: string;
    };
  };
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  error?: string;
  clientSecret?: string; // For 3D Secure authentication
}

export class ClubSubscriptionService {
  /**
   * Create a new Stripe subscription for a club
   * Note: This requires a backend API endpoint to interact with Stripe
   */
  static async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<SubscriptionResult> {
    try {
      // Get the plan details
      const plan = CLUB_SUBSCRIPTION_PLANS.find((p) => p.id === params.planId);
      if (!plan) {
        return {
          success: false,
          error: 'Invalid subscription plan',
        };
      }

      // Get or create club profile
      const { data: profile, error: profileError } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', params.userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw new Error('Failed to get club profile');
      }

      let clubProfileId = profile?.id;

      // Create profile if it doesn't exist
      if (!clubProfileId) {
        const { data: newProfile, error: createError } = await supabase
          .from('club_profiles')
          .insert({
            user_id: params.userId,
            club_name: 'Temporary', // Will be updated during onboarding
            website_url: 'https://temporary.com', // Will be updated
          })
          .select('id')
          .single();

        if (createError) {
          throw new Error('Failed to create club profile');
        }

        clubProfileId = newProfile.id;
      }

      // In production, this would call your backend API to create the Stripe subscription
      // For now, we'll simulate it with a mock implementation
      // TODO: Implement backend API endpoint for Stripe subscription creation

      /*
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.userId,
          planId: params.planId,
          paymentMethodId: params.paymentMethodId,
          billingDetails: params.billingDetails,
        }),
      });

      const { subscriptionId, clientSecret, customerId } = await response.json();
      */

      // Mock Stripe subscription ID for development
      const subscriptionId = `sub_mock_${Date.now()}`;
      const customerId = `cus_mock_${Date.now()}`;

      // Create subscription record in database
      const { error: subError } = await supabase
        .from('club_subscriptions')
        .insert({
          club_profile_id: clubProfileId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          stripe_price_id: plan.stripePriceId || `price_mock_${plan.id}`,
          plan_id: params.planId,
          status: 'active', // In production, this would be 'trialing' or based on Stripe response
          amount: plan.price,
          currency: 'usd',
          interval: 'month',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });

      if (subError) {
        console.error('Error creating subscription record:', subError);
        throw new Error('Failed to save subscription');
      }

      // Update user subscription status
      await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          subscription_tier: params.planId,
        })
        .eq('id', params.userId);

      return {
        success: true,
        subscriptionId,
      };
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to create subscription',
      };
    }
  }

  /**
   * Get subscription for a club
   */
  static async getSubscription(userId: string): Promise<any | null> {
    try {
      const { data: profile } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return null;
      }

      const { data, error } = await supabase
        .from('club_subscriptions')
        .select('*')
        .eq('club_profile_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    userId: string,
    immediate: boolean = false
  ): Promise<SubscriptionResult> {
    try {
      const subscription = await this.getSubscription(userId);
      if (!subscription) {
        return {
          success: false,
          error: 'No active subscription found',
        };
      }

      // In production, call Stripe API to cancel subscription
      // TODO: Implement backend API endpoint for cancellation

      /*
      await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
          immediate,
        }),
      });
      */

      // Update subscription in database
      const updateData: any = {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('club_subscriptions')
        .update(updateData)
        .eq('id', subscription.id);

      if (error) {
        throw new Error('Failed to update subscription status');
      }

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel subscription',
      };
    }
  }

  /**
   * Update subscription plan
   */
  static async updateSubscription(
    userId: string,
    newPlanId: 'starter' | 'professional' | 'enterprise'
  ): Promise<SubscriptionResult> {
    try {
      const subscription = await this.getSubscription(userId);
      if (!subscription) {
        return {
          success: false,
          error: 'No active subscription found',
        };
      }

      const plan = CLUB_SUBSCRIPTION_PLANS.find((p) => p.id === newPlanId);
      if (!plan) {
        return {
          success: false,
          error: 'Invalid subscription plan',
        };
      }

      // In production, call Stripe API to update subscription
      // TODO: Implement backend API endpoint

      // Update subscription in database
      const { error } = await supabase
        .from('club_subscriptions')
        .update({
          plan_id: newPlanId,
          stripe_price_id: plan.stripePriceId || `price_mock_${plan.id}`,
          amount: plan.price,
        })
        .eq('id', subscription.id);

      if (error) {
        throw new Error('Failed to update subscription');
      }

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to update subscription',
      };
    }
  }

  /**
   * Check if user has an active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    return subscription?.status === 'active' || subscription?.status === 'trialing';
  }

  /**
   * Get plan details
   */
  static getPlan(planId: string): SubscriptionPlan | undefined {
    return CLUB_SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  }

  /**
   * Get all available plans
   */
  static getAllPlans(): SubscriptionPlan[] {
    return CLUB_SUBSCRIPTION_PLANS;
  }

  // =====================================================
  // Event Registration Fee Tracking
  // =====================================================

  /**
   * Get platform revenue analytics for event registrations
   * Similar to coaching marketplace commission tracking
   */
  static async getEventRevenueAnalytics(clubId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id,
          amount_paid,
          platform_fee,
          club_payout,
          payment_status,
          payment_date,
          event_id,
          club_events!inner(club_id)
        `)
        .eq('club_events.club_id', clubId)
        .eq('payment_status', 'paid')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      if (error) throw error;

      // Calculate analytics
      const totalRevenue = data.reduce((sum, reg) => sum + (reg.amount_paid || 0), 0);
      const totalPlatformFees = data.reduce((sum, reg) => sum + (reg.platform_fee || 0), 0);
      const totalClubPayout = data.reduce((sum, reg) => sum + (reg.club_payout || 0), 0);
      const registrationCount = data.length;

      return {
        totalRevenue,
        totalPlatformFees,
        totalClubPayout,
        registrationCount,
        averageRegistrationValue: registrationCount > 0 ? totalRevenue / registrationCount : 0,
        platformFeeRate: totalRevenue > 0 ? (totalPlatformFees / totalRevenue) * 100 : 0,
      };
    } catch (error) {
      console.error('Error fetching event revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get combined revenue analytics (subscriptions + event registrations)
   */
  static async getCombinedRevenueAnalytics(startDate: string, endDate: string) {
    try {
      // Get subscription revenue
      const { data: subscriptions, error: subError } = await supabase
        .from('club_subscriptions')
        .select('*')
        .eq('status', 'active')
        .gte('current_period_start', startDate)
        .lte('current_period_start', endDate);

      if (subError) throw subError;

      const subscriptionRevenue = subscriptions.reduce(
        (sum, sub) => sum + (sub.amount || 0),
        0
      );

      // Get event registration revenue
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('payment_status', 'paid')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      if (regError) throw regError;

      const eventRevenue = registrations.reduce(
        (sum, reg) => sum + (reg.amount_paid || 0),
        0
      );
      const eventPlatformFees = registrations.reduce(
        (sum, reg) => sum + (reg.platform_fee || 0),
        0
      );

      return {
        subscriptionRevenue,
        eventRevenue,
        totalRevenue: subscriptionRevenue + eventRevenue,
        eventPlatformFees,
        totalPlatformRevenue: subscriptionRevenue + eventPlatformFees,
        subscriptionCount: subscriptions.length,
        registrationCount: registrations.length,
      };
    } catch (error) {
      console.error('Error fetching combined revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get club earnings summary (net revenue after platform fees)
   */
  static async getClubEarningsSummary(clubId: string, period: 'week' | 'month' | 'year') {
    try {
      const now = new Date();
      const startDate = new Date();

      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get event registration earnings
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          amount_paid,
          platform_fee,
          club_payout,
          payment_status,
          club_events!inner(club_id)
        `)
        .eq('club_events.club_id', clubId)
        .eq('payment_status', 'paid')
        .gte('payment_date', startDate.toISOString());

      if (error) throw error;

      const totalEarnings = data.reduce((sum, reg) => sum + (reg.club_payout || 0), 0);
      const totalPlatformFees = data.reduce((sum, reg) => sum + (reg.platform_fee || 0), 0);
      const grossRevenue = data.reduce((sum, reg) => sum + (reg.amount_paid || 0), 0);
      const registrationCount = data.length;

      // Calculate pending payments
      const { data: pending } = await supabase
        .from('event_registrations')
        .select(`
          amount_paid,
          club_events!inner(club_id)
        `)
        .eq('club_events.club_id', clubId)
        .eq('payment_status', 'unpaid');

      const pendingPayments = pending?.reduce(
        (sum, reg) => sum + (reg.amount_paid || 0),
        0
      ) || 0;

      return {
        totalEarnings,
        grossRevenue,
        totalPlatformFees,
        registrationCount,
        averageEarningsPerRegistration:
          registrationCount > 0 ? totalEarnings / registrationCount : 0,
        pendingPayments,
        period,
      };
    } catch (error) {
      console.error('Error fetching club earnings summary:', error);
      throw error;
    }
  }

  /**
   * Get platform fee summary across all clubs
   * Admin/platform analytics
   */
  static async getPlatformFeeSummary(startDate: string, endDate: string) {
    try {
      // Event registration platform fees
      const { data: eventFees, error: eventError } = await supabase
        .from('event_registrations')
        .select('platform_fee, club_payout, amount_paid')
        .eq('payment_status', 'paid')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      if (eventError) throw eventError;

      const eventPlatformFees = eventFees.reduce(
        (sum, reg) => sum + (reg.platform_fee || 0),
        0
      );
      const eventClubPayouts = eventFees.reduce(
        (sum, reg) => sum + (reg.club_payout || 0),
        0
      );
      const eventGrossRevenue = eventFees.reduce(
        (sum, reg) => sum + (reg.amount_paid || 0),
        0
      );

      // Club subscription revenue (100% platform revenue)
      const { data: subscriptions, error: subError } = await supabase
        .from('club_subscriptions')
        .select('amount')
        .eq('status', 'active')
        .gte('current_period_start', startDate)
        .lte('current_period_start', endDate);

      if (subError) throw subError;

      const subscriptionRevenue = subscriptions.reduce(
        (sum, sub) => sum + (sub.amount || 0),
        0
      );

      return {
        eventPlatformFees,
        eventClubPayouts,
        eventGrossRevenue,
        subscriptionRevenue,
        totalPlatformRevenue: eventPlatformFees + subscriptionRevenue,
        totalClubPayouts: eventClubPayouts,
        eventRegistrationCount: eventFees.length,
        subscriptionCount: subscriptions.length,
      };
    } catch (error) {
      console.error('Error fetching platform fee summary:', error);
      throw error;
    }
  }
}
