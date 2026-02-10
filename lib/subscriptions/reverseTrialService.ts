/**
 * Reverse Trial Service
 *
 * Manages the 14-day Pro reverse trial for new users.
 * All new signups get full Pro access for 14 days, then
 * downgrade to Free unless they subscribe.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ReverseTrialService');

const TRIAL_DURATION_DAYS = 14;

export interface TrialStatus {
  /** Whether the trial is currently active. */
  isActive: boolean;
  /** Days remaining (0 if expired or no trial). */
  daysRemaining: number;
  /** When the trial expires (null if no trial). */
  expiresAt: Date | null;
  /** Whether the user has ever had a trial. */
  hasHadTrial: boolean;
}

export class ReverseTrialService {
  /**
   * Start a 14-day Pro trial for a new user.
   * Sets subscription_tier = 'individual', subscription_status = 'trialing',
   * and trial_ends_at = NOW() + 14 days.
   */
  static async startTrial(userId: string): Promise<boolean> {
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);

      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: 'individual',
          subscription_status: 'trialing',
          trial_started_at: new Date().toISOString(),
          trial_ends_at: trialEnd.toISOString(),
        })
        .eq('id', userId);

      if (error) {
        logger.error('Failed to start trial:', error);
        return false;
      }

      logger.info('Trial started for user', userId, '— expires', trialEnd.toISOString());
      return true;
    } catch (err) {
      logger.error('startTrial error:', err);
      return false;
    }
  }

  /**
   * Get the current trial status for a user.
   */
  static async getTrialStatus(userId: string): Promise<TrialStatus> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('trial_started_at, trial_ends_at, subscription_status, subscription_tier')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return { isActive: false, daysRemaining: 0, expiresAt: null, hasHadTrial: false };
      }

      const hasHadTrial = !!data.trial_started_at;

      if (!data.trial_ends_at) {
        return { isActive: false, daysRemaining: 0, expiresAt: null, hasHadTrial };
      }

      const expiresAt = new Date(data.trial_ends_at);
      const now = new Date();
      const isActive = data.subscription_status === 'trialing' && expiresAt > now;
      const daysRemaining = isActive
        ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return { isActive, daysRemaining, expiresAt, hasHadTrial };
    } catch {
      return { isActive: false, daysRemaining: 0, expiresAt: null, hasHadTrial: false };
    }
  }

  /**
   * Expire / downgrade a user's trial to Free tier.
   */
  static async expireTrial(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: 'free',
          subscription_status: 'expired',
        })
        .eq('id', userId);

      if (error) {
        logger.error('Failed to expire trial:', error);
        return false;
      }

      logger.info('Trial expired for user', userId, '— downgraded to free');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a user has already had a trial (prevent re-triggering).
   */
  static async hasHadTrial(userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('users')
        .select('trial_started_at')
        .eq('id', userId)
        .maybeSingle();

      return !!data?.trial_started_at;
    } catch {
      return false;
    }
  }

  /**
   * Client-side check on app load: if trial_ends_at < now, downgrade to free.
   * Called from AuthProvider on session restore.
   */
  static async checkAndExpireIfNeeded(userId: string): Promise<TrialStatus> {
    const status = await this.getTrialStatus(userId);

    if (status.hasHadTrial && !status.isActive && status.expiresAt) {
      // Trial has expired but might not be downgraded yet
      const { data } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', userId)
        .maybeSingle();

      if (data?.subscription_status === 'trialing') {
        await this.expireTrial(userId);
      }
    }

    return status;
  }
}
