jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    }),
    removeChannel: jest.fn(),
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

import { supabase } from '../supabase';
import { mockSupabaseResponse } from '../../test/helpers/supabaseMock';

const fromMock = supabase.from as jest.Mock;

function chainBuilder(result: { data: any; error: any; count?: number | null }) {
  const b: Record<string, any> = {};
  const chain = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'in', 'order', 'limit', 'range', 'filter',
  ];
  for (const m of chain) b[m] = jest.fn().mockReturnValue(b);
  b.single = jest.fn().mockResolvedValue(result);
  b.maybeSingle = jest.fn().mockResolvedValue(result);
  b.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return b;
}

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('fetches notifications with actor and regatta enrichment', async () => {
      const rawNotifications = [
        {
          id: 'n1',
          type: 'race_like',
          title: 'New like',
          body: null,
          is_read: false,
          created_at: '2026-03-17T00:00:00Z',
          actor_id: 'actor-1',
          regatta_id: 'reg-1',
          comment_id: null,
          achievement_id: null,
          data: null,
        },
      ];
      const users = [{ id: 'actor-1', full_name: 'Jane Doe', avatar_url: null }];
      const sailorProfiles = [{ user_id: 'actor-1', avatar_emoji: '⛵', avatar_color: '#0000FF' }];
      const regattas = [{ id: 'reg-1', name: 'Summer Series' }];

      const builders = [
        // notifications query
        chainBuilder({ data: rawNotifications, error: null, count: 1 }),
        // users query
        chainBuilder(mockSupabaseResponse(users)),
        // sailor_profiles query
        chainBuilder(mockSupabaseResponse(sailorProfiles)),
        // regattas query
        chainBuilder(mockSupabaseResponse(regattas)),
      ];

      let callCount = 0;
      fromMock.mockImplementation(() => builders[callCount++]);

      const { NotificationService } = require('../NotificationService');
      const { notifications, hasMore } = await NotificationService.getNotifications('user-1', {
        limit: 10,
        offset: 0,
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].actorName).toBe('Jane Doe');
      expect(notifications[0].actorAvatarEmoji).toBe('⛵');
      expect(notifications[0].regattaName).toBe('Summer Series');
      expect(notifications[0].type).toBe('race_like');
      expect(hasMore).toBe(false);
    });

    it('returns empty when no notifications exist', async () => {
      const builder = chainBuilder({ data: [], error: null, count: 0 });
      fromMock.mockReturnValue(builder);

      const { NotificationService } = require('../NotificationService');
      const { notifications, hasMore } = await NotificationService.getNotifications('user-1');

      expect(notifications).toEqual([]);
      expect(hasMore).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    it('upserts only the provided preference fields', async () => {
      const builder = chainBuilder(mockSupabaseResponse(null));
      fromMock.mockReturnValue(builder);

      const { NotificationService } = require('../NotificationService');
      await NotificationService.updatePreferences('user-1', {
        pushEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      });

      expect(builder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          push_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '07:00',
        }),
        { onConflict: 'user_id' },
      );

      // Should NOT include fields that weren't passed
      const upsertArg = builder.upsert.mock.calls[0][0];
      expect(upsertArg).not.toHaveProperty('email_enabled');
      expect(upsertArg).not.toHaveProperty('new_follower');
    });

    it('maps all camelCase preference keys to snake_case columns', async () => {
      const builder = chainBuilder(mockSupabaseResponse(null));
      fromMock.mockReturnValue(builder);

      const { NotificationService } = require('../NotificationService');
      await NotificationService.updatePreferences('user-1', {
        emailEnabled: true,
        newFollower: false,
        followedUserRace: true,
        raceLikes: false,
        raceComments: true,
        achievements: false,
        directMessages: true,
        groupMessages: false,
      });

      const upsertArg = builder.upsert.mock.calls[0][0];
      expect(upsertArg.email_enabled).toBe(true);
      expect(upsertArg.new_follower).toBe(false);
      expect(upsertArg.followed_user_race).toBe(true);
      expect(upsertArg.race_likes).toBe(false);
      expect(upsertArg.race_comments).toBe(true);
      expect(upsertArg.achievements).toBe(false);
      expect(upsertArg.direct_messages).toBe(true);
      expect(upsertArg.group_messages).toBe(false);
    });
  });
});
