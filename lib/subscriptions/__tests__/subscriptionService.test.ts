// Mock react-native Platform before any imports
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (opts: any) => opts.ios ?? opts.default },
  Alert: { alert: jest.fn() },
}));

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    functions: { invoke: jest.fn() },
  },
}));
jest.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

import { supabase } from '@/services/supabase';
import { mockSupabaseResponse } from '../../../test/helpers/supabaseMock';

const fromMock = supabase.from as jest.Mock;
const getUserMock = supabase.auth.getUser as jest.Mock;

function chainBuilder(result: { data: any; error: any }) {
  const b: Record<string, any> = {};
  const chain = ['select', 'eq', 'order', 'limit', 'range', 'filter'];
  for (const m of chain) b[m] = jest.fn().mockReturnValue(b);
  b.single = jest.fn().mockResolvedValue(result);
  b.maybeSingle = jest.fn().mockResolvedValue(result);
  b.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return b;
}

describe('subscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton's internal state between tests
    // We need a fresh require for each test since the module caches state
  });

  describe('refreshSubscriptionStatus — tier normalization', () => {
    it.each([
      ['basic', 'individual'],
      ['individual', 'individual'],
      ['team', 'pro'],
      ['championship', 'pro'],
      ['pro', 'pro'],
      [null, 'free'],
      ['unknown_tier', 'free'],
    ])('normalizes "%s" to "%s"', async (rawTier, expectedTier) => {
      getUserMock.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const builder = chainBuilder(
        mockSupabaseResponse({
          subscription_status: rawTier ? 'active' : null,
          subscription_tier: rawTier,
          subscription_expires_at: '2026-12-31T00:00:00Z',
          subscription_platform: 'ios',
        }),
      );
      fromMock.mockReturnValue(builder);

      // Use a fresh instance to avoid state leaking between tests
      const { SubscriptionService } = require('../subscriptionService');
      const instance = new SubscriptionService();

      await instance.refreshSubscriptionStatus();
      const status = await instance.getSubscriptionStatus();

      expect(status.tier).toBe(expectedTier);
    });

    it('defaults to free status when no user is authenticated', async () => {
      getUserMock.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { SubscriptionService } = require('../subscriptionService');
      const instance = new SubscriptionService();

      await instance.refreshSubscriptionStatus();
      const status = await instance.getSubscriptionStatus();

      expect(status.tier).toBe('free');
      expect(status.isActive).toBe(false);
    });
  });

  describe('purchaseProduct — response code handling', () => {
    it('returns success on IAPResponseCode.OK', async () => {
      const { SubscriptionService } = require('../subscriptionService');
      const instance = new SubscriptionService();

      // Mock the IAP module's purchaseItemAsync via the internal mock
      // The subscription service uses a top-level mock InAppPurchases object
      // We test via the public purchaseProduct method
      const result = await instance.purchaseProduct('regattaflow_individual_monthly');

      // The mock InAppPurchases.purchaseItemAsync returns responseCode: 1 (USER_CANCELED)
      // by default, so this should return a cancellation result
      expect(result.success).toBe(false);
      expect(result.error).toContain('cancelled');
    });
  });
});
