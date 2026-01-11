// @ts-nocheck

/**
 * Subscription Service
 * Marine-grade subscription management for professional sailing platform
 * Handles native in-app purchases and subscription lifecycle
 * 
 * NOTE: expo-in-app-purchases was deprecated in SDK 50. 
 * Using mock implementation until expo-iap is configured.
 */

// Mock InAppPurchases until expo-iap is properly configured
const InAppPurchases = {
  IAPResponseCode: {
    OK: 0,
    USER_CANCELED: 1,
    ERROR: 2,
  },
  connectAsync: async () => {},
  disconnectAsync: async () => {},
  getProductsAsync: async (_ids: string[]) => ({ results: [], responseCode: 0 }),
  purchaseItemAsync: async (_id: string) => ({ responseCode: 1, results: [], errorCode: null }),
  getPurchaseHistoryAsync: async () => ({ responseCode: 0, results: [] }),
  finishTransactionAsync: async (_purchase: any, _consume: boolean) => {},
  setPurchaseListener: (_callback: any) => {},
};

import { Platform, Alert } from 'react-native';
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
  tier: 'free' | 'pro' | 'championship';
  expiresAt: Date | null;
  isTrialing?: boolean;
  trialEndsAt?: Date | null;
  willRenew: boolean;
  platform: 'ios' | 'android' | 'web';
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  error?: string;
  needsRestore?: boolean;
}

/**
 * RegattaFlow Subscription Products
 * Professional sailing platform pricing tiers
 */

const logger = createLogger('subscriptionService');

/**
 * Stripe Price IDs for web fallback
 * Note: Native uses App Store/Play Store product IDs
 */
const STRIPE_PRICE_IDS = {
  pro_yearly: 'price_1Sl0i8BbfEeOhHXbmUQ5OBkV',           // $300/year
  championship_yearly: 'price_1Sl0ljBbfEeOhHXbKmEU06Ha', // $480/year
};

export const SUBSCRIPTION_PRODUCTS: Record<string, SubscriptionProduct> = {
  pro: {
    id: Platform.select({
      ios: 'regattaflow_pro_yearly',
      android: 'regattaflow_pro_yearly',
      default: STRIPE_PRICE_IDS.pro_yearly,
    }),
    title: 'Pro',
    description: 'Full racing features for serious sailors',
    price: '$300/year',
    priceAmountMicros: 300000000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'yearly',
    effectiveMonthly: '$25/mo',
    isPopular: true,
    features: [
      'Unlimited AI queries',
      'Full venue intelligence access',
      'Advanced race strategy',
      'Performance analytics',
      'Offline mode',
      'Cloud backup and sync',
    ],
  },
  championship: {
    id: Platform.select({
      ios: 'regattaflow_championship_yearly',
      android: 'regattaflow_championship_yearly',
      default: STRIPE_PRICE_IDS.championship_yearly,
    }),
    title: 'Championship',
    description: 'For teams & serious competitors',
    price: '$480/year',
    priceAmountMicros: 480000000,
    priceCurrencyCode: 'USD',
    billingPeriod: 'yearly',
    effectiveMonthly: '$40/mo',
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'Advanced team analytics',
      'All Racing Academy modules included',
      'Priority support',
    ],
  },
};

/**
 * Subscription Service Class
 * Handles all subscription operations for the sailing platform
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

  /**
   * Initialize subscription service
   * Sets up in-app purchases and loads available products
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Connect to app store
      await InAppPurchases.connectAsync();

      // Load available products
      await this.loadProducts();

      // Set up purchase listener
      this.setupPurchaseListener();

      this.isInitialized = true;

    } catch (error) {

      throw new Error('Failed to initialize subscription service');
    }
  }

  /**
   * Load available subscription products from app stores
   */
  private async loadProducts(): Promise<void> {
    try {
      const productIds = Object.values(SUBSCRIPTION_PRODUCTS).map(p => p.id);
      const { results, responseCode } = await InAppPurchases.getProductsAsync(productIds);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        this.availableProducts = results.map(product => {
          const configProduct = Object.values(SUBSCRIPTION_PRODUCTS).find(
            p => p.id === product.productId
          );

          return {
            ...configProduct!,
            price: product.price,
            priceAmountMicros: product.priceAmountMicros,
            priceCurrencyCode: product.priceCurrencyCode,
          };
        });

      } else {
        throw new Error(`Failed to load products: ${responseCode}`);
      }
    } catch (error) {

      throw error;
    }
  }

  /**
   * Set up purchase event listener
   */
  private setupPurchaseListener(): void {
    InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results?.forEach(purchase => {
          this.handlePurchaseComplete(purchase);
        });
      } else {

      }
    });
  }

  /**
   * Handle completed purchase
   */
  private async handlePurchaseComplete(purchase: any): Promise<void> {
    try {

      // Verify purchase with backend
      await this.verifyPurchase(purchase);

      // Update local subscription status
      await this.refreshSubscriptionStatus();

      // Finish the transaction
      await InAppPurchases.finishTransactionAsync(purchase, true);

      Alert.alert(
        '🌊 Subscription Active',
        'Welcome to RegattaFlow Pro! Your subscription is now active and all features are unlocked.',
        [{ text: 'Start Racing', style: 'default' }]
      );
    } catch (error) {

      Alert.alert(
        '🔴 Purchase Error',
        'There was an issue processing your purchase. Please contact support if the problem persists.'
      );
    }
  }

  /**
   * Verify purchase with backend
   */
  private async verifyPurchase(purchase: any): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-purchase', {
        body: {
          platform: Platform.OS,
          transactionId: purchase.transactionId,
          productId: purchase.productId,
          purchaseToken: purchase.purchaseToken,
          receipt: purchase.transactionReceipt,
        },
      });

      if (error) {
        throw error;
      }

    } catch (error) {

      throw error;
    }
  }

  /**
   * Get available subscription products
   */
  async getAvailableProducts(): Promise<SubscriptionProduct[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.availableProducts;
  }

  /**
   * Purchase a subscription product
   */
  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { responseCode, results, errorCode } = await InAppPurchases.purchaseItemAsync(productId);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        const purchase = results?.[0];
        return {
          success: true,
          productId: purchase?.productId,
          transactionId: purchase?.transactionId,
        };
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        return {
          success: false,
          error: 'Purchase cancelled by user',
        };
      } else {
        return {
          success: false,
          error: `Purchase failed: ${errorCode || responseCode}`,
        };
      }
    } catch (error) {

      return {
        success: false,
        error: 'Purchase failed due to technical error',
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        if (results && results.length > 0) {
          // Process restored purchases
          for (const purchase of results) {
            await this.verifyPurchase(purchase);
          }

          await this.refreshSubscriptionStatus();

          return {
            success: true,
          };
        } else {
          return {
            success: false,
            error: 'No previous purchases found',
          };
        }
      } else {
        return {
          success: false,
          error: 'Failed to restore purchases',
        };
      }
    } catch (error) {

      return {
        success: false,
        error: 'Failed to restore purchases',
      };
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      if (!this.currentStatus) {
        await this.refreshSubscriptionStatus();
      }
      return this.currentStatus!;
    } catch (error) {

      return this.getDefaultStatus();
    }
  }

  /**
   * Refresh subscription status from backend
   */
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

      if (error) {
        throw error;
      }

      this.currentStatus = {
        isActive: data.subscription_status === 'active',
        productId: data.subscription_tier || null,
        tier: data.subscription_tier || 'free',
        expiresAt: data.subscription_expires_at ? new Date(data.subscription_expires_at) : null,
        willRenew: data.subscription_status === 'active',
        platform: data.subscription_platform || Platform.OS,
      };

    } catch (error) {

      this.currentStatus = this.getDefaultStatus();
    }
  }

  /**
   * Get default subscription status for free users
   */
  private getDefaultStatus(): SubscriptionStatus {
    return {
      isActive: false,
      productId: null,
      tier: 'free',
      expiresAt: null,
      willRenew: false,
      platform: Platform.OS as 'ios' | 'android',
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<boolean> {
    try {
      // For mobile platforms, users need to cancel through App Store/Play Store
      const message = Platform.select({
        ios: 'To cancel your subscription, go to Settings > Apple ID > Subscriptions on your device.',
        android: 'To cancel your subscription, open the Google Play Store app and go to Subscriptions.',
        default: 'Subscription cancellation is handled through your app store.',
      });

      Alert.alert(
        '⚠️ Cancel Subscription',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              // Open device settings (implementation depends on platform)
              logger.debug('Opening device subscription settings...');
            }
          },
        ]
      );

      return true;
    } catch (error) {

      return false;
    }
  }

  /**
   * Disconnect from app store
   */
  async disconnect(): Promise<void> {
    try {
      await InAppPurchases.disconnectAsync();
      this.isInitialized = false;

    } catch (error) {

    }
  }
}

// Export singleton instance
export const subscriptionService = SubscriptionService.getInstance();

export default subscriptionService;
