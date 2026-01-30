/**
 * Subscription Service - Web Version
 * Uses Stripe for web subscriptions instead of native in-app purchases
 *
 * Updated: 2026-01-30
 * New pricing: Individual $120/yr, Team $480/yr
 * Learning modules purchased separately at $30/yr each
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

export interface SubscriptionProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  features: string[];
  isPopular?: boolean;
  billingPeriod: 'yearly';
  effectiveMonthly?: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  productId: string | null;
  tier: 'free' | 'individual' | 'team';
  expiresAt: Date | null;
  willRenew: boolean;
  platform: 'ios' | 'android' | 'web';
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  error?: string;
  needsRestore?: boolean;
  checkoutUrl?: string;
}

const logger = createLogger('subscriptionService.web');

/**
 * Stripe Price IDs for subscriptions
 * Updated: 2026-01-30
 *
 * Race Strategy: Free / Individual $120/yr / Team $480/yr
 * Learning: $30/yr per module (purchased separately)
 */
export const STRIPE_PRICE_IDS = {
  // Race Strategy Plans (yearly only)
  individual_yearly: 'price_1SvDDBBbfEeOhHXbyxF7XSKY',  // $120/year
  team_yearly: 'price_1SvDDCBbfEeOhHXbRi18kcG1',       // $480/year (up to 5 users)

  // Racing Academy / Learning (separate purchase)
  academy_module: 'price_1Sl0mWBbfEeOhHXbcvQnBisj',    // $30/year per module
};

export const SUBSCRIPTION_PRODUCTS: Record<string, SubscriptionProduct> = {
  individual: {
    id: STRIPE_PRICE_IDS.individual_yearly,
    title: 'Individual',
    description: 'Full racing features for solo sailors',
    price: '$120/year',
    priceAmountMicros: 120000000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'yearly',
    effectiveMonthly: '$10/mo',
    isPopular: true,
    features: [
      'Unlimited races',
      'Unlimited AI queries',
      'AI strategy analysis',
      'Automatic weather updates',
      'Historical race data',
      'Offline mode',
      'Advanced analytics',
      'Cloud backup & sync',
    ],
  },
  team: {
    id: STRIPE_PRICE_IDS.team_yearly,
    title: 'Team',
    description: 'Full racing features for teams',
    price: '$480/year',
    priceAmountMicros: 480000000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'yearly',
    effectiveMonthly: '$40/mo',
    features: [
      'Everything in Individual',
      'Up to 5 team members',
      'Team sharing & collaboration',
      'Shared race preparation',
      'Team analytics dashboard',
      'Priority support',
    ],
  },
};

/**
 * Learning/Academy subscription products
 * Note: Learning modules are purchased separately, NOT bundled with subscriptions
 */
export const LEARNING_PRODUCTS: Record<string, SubscriptionProduct> = {
  module: {
    id: STRIPE_PRICE_IDS.academy_module,
    title: 'Single Module',
    description: 'Access one learning module',
    price: '$30/year',
    priceAmountMicros: 30000000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'yearly',
    features: [
      'Choose any learning module',
      'Interactive lessons',
      'Progress tracking',
      'Certificate on completion',
    ],
  },
};

/**
 * Web Subscription Service
 * Uses Stripe Checkout for web payments
 */
export class SubscriptionService {
  private static instance: SubscriptionService;
  private isInitialized = false;
  private availableProducts: SubscriptionProduct[] = [];
  private currentStatus: SubscriptionStatus | null = null;

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.debug('Initializing web subscription service');
    this.availableProducts = Object.values(SUBSCRIPTION_PRODUCTS);
    this.isInitialized = true;
  }

  async getAvailableProducts(): Promise<SubscriptionProduct[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.availableProducts;
  }

  /**
   * Purchase via Stripe Checkout
   */
  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    try {
      logger.debug('Starting Stripe checkout for product:', productId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'Please sign in to subscribe',
        };
      }

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: productId,
          userId: user.id,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        return {
          success: true,
          checkoutUrl: data.url,
        };
      }

      return {
        success: false,
        error: 'Failed to create checkout session',
      };
    } catch (error) {
      logger.error('Purchase error:', error);
      return {
        success: false,
        error: 'Purchase failed. Please try again.',
      };
    }
  }

  /**
   * Restore purchases - redirects to customer portal on web
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'Please sign in first',
        };
      }

      // On web, we refresh status from backend
      await this.refreshSubscriptionStatus();

      if (this.currentStatus?.isActive) {
        return { success: true };
      }

      return {
        success: false,
        error: 'No active subscription found. Contact support if you believe this is an error.',
      };
    } catch (error) {
      logger.error('Restore error:', error);
      return {
        success: false,
        error: 'Failed to check subscription status',
      };
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    if (!this.currentStatus) {
      await this.refreshSubscriptionStatus();
    }
    return this.currentStatus!;
  }

  async refreshSubscriptionStatus(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        this.currentStatus = this.getDefaultStatus();
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('subscription_status, subscription_tier, subscription_expires_at, subscription_platform')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Normalize tier name (handle legacy values)
      let tier: 'free' | 'individual' | 'team' = 'free';
      const rawTier = data.subscription_tier?.toLowerCase();
      if (rawTier === 'individual' || rawTier === 'basic') {
        tier = 'individual';
      } else if (rawTier === 'team' || rawTier === 'pro' || rawTier === 'championship') {
        tier = 'team';
      }

      this.currentStatus = {
        isActive: data.subscription_status === 'active',
        productId: data.subscription_tier || null,
        tier,
        expiresAt: data.subscription_expires_at ? new Date(data.subscription_expires_at) : null,
        willRenew: data.subscription_status === 'active',
        platform: 'web',
      };
    } catch (error) {
      logger.error('Failed to refresh subscription status:', error);
      this.currentStatus = this.getDefaultStatus();
    }
  }

  private getDefaultStatus(): SubscriptionStatus {
    return {
      isActive: false,
      productId: null,
      tier: 'free',
      expiresAt: null,
      willRenew: false,
      platform: 'web',
    };
  }

  /**
   * Open Stripe customer portal for subscription management
   */
  async cancelSubscription(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { userId: user.id },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to open customer portal:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isInitialized = false;
    this.currentStatus = null;
  }
}

export const subscriptionService = SubscriptionService.getInstance();
export default subscriptionService;
