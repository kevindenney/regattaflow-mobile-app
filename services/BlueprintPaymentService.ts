/**
 * Blueprint Payment Service
 * Handles blueprint purchases via Stripe.
 * Modeled on CoursePaymentService.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { Platform } from 'react-native';

const logger = createLogger('BlueprintPaymentService');

export interface BlueprintPaymentResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  free?: boolean;
  error?: string;
}

export interface BlueprintPurchaseStatus {
  purchased: boolean;
  status?: string;
  purchasedAt?: string;
}

export class BlueprintPaymentService {
  /**
   * Check if user has purchased a blueprint
   */
  async checkPurchase(userId: string, blueprintId: string): Promise<BlueprintPurchaseStatus> {
    try {
      const { data, error } = await supabase
        .from('blueprint_purchases')
        .select('id, status, purchased_at')
        .eq('blueprint_id', blueprintId)
        .eq('buyer_id', userId)
        .maybeSingle();

      if (error || !data) {
        return { purchased: false };
      }

      return {
        purchased: data.status === 'completed',
        status: data.status,
        purchasedAt: data.purchased_at,
      };
    } catch (error) {
      logger.error('Failed to check blueprint purchase:', error);
      return { purchased: false };
    }
  }

  /**
   * Initiate blueprint purchase checkout
   */
  async purchaseBlueprint(
    userId: string,
    blueprintId: string,
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<BlueprintPaymentResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const baseUrl = Platform.OS === 'web'
        ? window.location.origin
        : 'betterat://';

      const finalSuccessUrl = successUrl || `${baseUrl}/blueprint/purchase-success`;
      const finalCancelUrl = cancelUrl || `${baseUrl}/blueprint/purchase-cancelled`;

      logger.debug('Creating blueprint checkout session', { userId, blueprintId });

      const { data, error } = await supabase.functions.invoke('blueprint-checkout', {
        body: {
          blueprintId,
          userId,
          successUrl: finalSuccessUrl,
          cancelUrl: finalCancelUrl,
        },
      });

      if (error) {
        logger.error('Blueprint checkout error:', error);
        return { success: false, error: error.message };
      }

      // Handle free blueprint / org member bypass
      if (data.free) {
        return {
          success: true,
          free: true,
        };
      }

      // Return checkout URL for paid blueprint
      if (data.url) {
        return {
          success: true,
          url: data.url,
          sessionId: data.sessionId,
        };
      }

      return { success: false, error: 'No checkout URL returned' };
    } catch (error: any) {
      logger.error('Purchase blueprint error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify a purchase was successful (called after checkout redirect)
   */
  async verifyPurchase(sessionId: string, blueprintId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      // Check by checkout session ID
      const { data: purchase } = await supabase
        .from('blueprint_purchases')
        .select('id')
        .eq('blueprint_id', blueprintId)
        .eq('stripe_checkout_session_id', sessionId)
        .eq('status', 'completed')
        .maybeSingle();

      if (purchase) return true;

      // Fallback: check by user ID (webhook might have used payment intent)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userPurchase } = await supabase
          .from('blueprint_purchases')
          .select('id')
          .eq('blueprint_id', blueprintId)
          .eq('buyer_id', user.id)
          .eq('status', 'completed')
          .maybeSingle();

        return !!userPurchase;
      }

      return false;
    } catch (error) {
      logger.error('Failed to verify blueprint purchase:', error);
      return false;
    }
  }

  /**
   * Get blueprint pricing info
   */
  async getBlueprintPricing(blueprintId: string): Promise<{
    priceCents: number | null;
    currency: string;
    isFree: boolean;
  }> {
    try {
      const { data: blueprint } = await supabase
        .from('timeline_blueprints')
        .select('price_cents, currency')
        .eq('id', blueprintId)
        .single();

      if (!blueprint) {
        return { priceCents: null, currency: 'usd', isFree: true };
      }

      return {
        priceCents: blueprint.price_cents,
        currency: blueprint.currency || 'usd',
        isFree: !blueprint.price_cents || blueprint.price_cents <= 0,
      };
    } catch (error) {
      logger.error('Failed to get blueprint pricing:', error);
      return { priceCents: null, currency: 'usd', isFree: true };
    }
  }
}

export const blueprintPaymentService = new BlueprintPaymentService();
