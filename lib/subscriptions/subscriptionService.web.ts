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
  billingPeriod: 'monthly' | 'yearly';
  trialPeriod?: number;
}

export interface SubscriptionStatus {
  isActive: boolean;
  productId: string | null;
  tier: 'free' | 'sailor_pro' | 'championship' | 'professional';
  expiresAt: Date | null;
  isTrialing: boolean;
  trialEndsAt: Date | null;
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

export const SUBSCRIPTION_PRODUCTS: Record<string, SubscriptionProduct> = {
  sailor_pro_monthly: {
    id: 'price_sailor_pro_monthly',
    title: 'Sailor Pro',
    description: 'Full racing features for competitive sailors',
    price: '$29.99/month',
    priceAmountMicros: 29990000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'monthly',
    trialPeriod: 7,
    features: [
      '🌊 Unlimited race tracking and strategy',
      '🗺️ Global venue intelligence (147+ venues)',
      '🤖 AI-powered race analysis',
      '📱 Offline racing capabilities',
      '⚙️ Equipment optimization guides',
      '📊 Performance analytics and trends',
      '☁️ Cloud backup and sync',
    ],
  },
  sailor_pro_yearly: {
    id: 'price_sailor_pro_yearly',
    title: 'Sailor Pro',
    description: 'Full racing features - Save 25% annually',
    price: '$269.99/year',
    priceAmountMicros: 269990000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'yearly',
    trialPeriod: 14,
    isPopular: true,
    features: [
      '🌊 Unlimited race tracking and strategy',
      '🗺️ Global venue intelligence (147+ venues)',
      '🤖 AI-powered race analysis',
      '📱 Offline racing capabilities',
      '⚙️ Equipment optimization guides',
      '📊 Performance analytics and trends',
      '☁️ Cloud backup and sync',
      '💰 Save $90 compared to monthly',
    ],
  },
  championship_monthly: {
    id: 'price_championship_monthly',
    title: 'Championship',
    description: 'Advanced AI and environmental intelligence',
    price: '$49.99/month',
    priceAmountMicros: 49990000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'monthly',
    trialPeriod: 7,
    features: [
      '⭐ Everything in Sailor Pro',
      '🧠 Advanced AI strategy simulation',
      '🌡️ Multi-model weather ensemble',
      '🎯 Monte Carlo race predictions',
      '🌍 Cultural venue adaptation',
      '📈 Cross-venue performance analytics',
      '🏆 Championship preparation tools',
      '💼 Priority customer support',
    ],
  },
  championship_yearly: {
    id: 'price_championship_yearly',
    title: 'Championship',
    description: 'Advanced features - Save 25% annually',
    price: '$449.99/year',
    priceAmountMicros: 449990000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'yearly',
    trialPeriod: 14,
    features: [
      '⭐ Everything in Sailor Pro',
      '🧠 Advanced AI strategy simulation',
      '🌡️ Multi-model weather ensemble',
      '🎯 Monte Carlo race predictions',
      '🌍 Cultural venue adaptation',
      '📈 Cross-venue performance analytics',
      '🏆 Championship preparation tools',
      '💼 Priority customer support',
      '💰 Save $150 compared to monthly',
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
        isTrialing: data.subscription_status === 'trialing',
        trialEndsAt: data.subscription_expires_at ? new Date(data.subscription_expires_at) : null,
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
      isTrialing: false,
      trialEndsAt: null,
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

