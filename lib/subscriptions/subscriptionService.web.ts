/**
 * Subscription Service - Web Version
 * Uses Stripe for web subscriptions instead of native in-app purchases
 */

import { Platform } from 'react-native';
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
  tier: 'free' | 'basic' | 'pro';
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
 * Updated: 2026-01-15
 *
 * Race Strategy: Free / Basic $120/yr / Pro $360/yr
 * Learning: Free / Module $30/yr / Bundle $100/yr
 */
export const STRIPE_PRICE_IDS = {
  // Race Strategy Plans (yearly only)
  basic_yearly: 'price_1Splo2BbfEeOhHXbHi1ENal0',     // $120/year
  pro_yearly: 'price_1SplplBbfEeOhHXbRunl0IIa',       // $360/year

  // Racing Academy / Learning
  academy_module: 'price_1Sl0mWBbfEeOhHXbcvQnBisj',   // $30/year per module
  academy_bundle: 'price_1Splr8BbfEeOhHXbUEa1Yrn6',   // $100/year all modules
};

export const SUBSCRIPTION_PRODUCTS: Record<string, SubscriptionProduct> = {
  basic: {
    id: STRIPE_PRICE_IDS.basic_yearly,
    title: 'Basic',
    description: 'Essential tools for club racers',
    price: '$120/year',
    priceAmountMicros: 120000000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'yearly',
    effectiveMonthly: '$10/mo',
    features: [
      'Unlimited races',
      '20 AI queries per month',
      'Automatic weather updates',
      'Race checklists & prep tools',
      'Document upload & storage',
      'Cloud backup & sync',
    ],
  },
  pro: {
    id: STRIPE_PRICE_IDS.pro_yearly,
    title: 'Pro',
    description: 'Full racing features for serious sailors',
    price: '$360/year',
    priceAmountMicros: 360000000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'yearly',
    effectiveMonthly: '$30/mo',
    isPopular: true,
    features: [
      'Everything in Basic',
      'Unlimited AI queries',
      'AI strategy analysis',
      'Team sharing & collaboration',
      'Historical race data',
      'Offline mode',
      'Advanced analytics',
      'Priority support',
    ],
  },
};

/**
 * Learning/Academy subscription products
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
  bundle: {
    id: STRIPE_PRICE_IDS.academy_bundle,
    title: 'All Modules',
    description: 'Access all learning content',
    price: '$100/year',
    priceAmountMicros: 100000000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'yearly',
    isPopular: true,
    features: [
      'All learning modules included',
      'Interactive lessons & simulations',
      'Progress tracking',
      'Certificates on completion',
      'New modules as released',
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

      this.currentStatus = {
        isActive: data.subscription_status === 'active',
        productId: data.subscription_tier || null,
        tier: data.subscription_tier || 'free',
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

