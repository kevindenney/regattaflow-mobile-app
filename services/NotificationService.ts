/**
 * NotificationService
 *
 * Service for social notifications:
 * - Fetching notifications
 * - Marking as read
 * - Real-time subscription
 * - Notification preferences
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

const logger = createLogger('NotificationService');

// =============================================================================
// TYPES
// =============================================================================

export type SocialNotificationType =
  | 'new_follower'
  | 'followed_user_race'
  | 'race_like'
  | 'race_comment'
  | 'race_comment_reply'
  | 'race_result_posted'
  | 'achievement_earned';

export interface SocialNotification {
  id: string;
  type: SocialNotificationType;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
  // Related entities
  actorId?: string;
  actorName?: string;
  actorAvatarUrl?: string;
  actorAvatarEmoji?: string;
  actorAvatarColor?: string;
  regattaId?: string;
  regattaName?: string;
  commentId?: string;
  achievementId?: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newFollower: boolean;
  followedUserRace: boolean;
  raceLikes: boolean;
  raceComments: boolean;
  achievements: boolean;
  directMessages: boolean;
  groupMessages: boolean;
  quietHoursStart?: string | null; // HH:MM format
  quietHoursEnd?: string | null;
}

export interface NotificationStats {
  unreadCount: number;
  totalCount: number;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

class NotificationServiceClass {
  private realtimeChannel: RealtimeChannel | null = null;
  private listeners: Set<(notification: SocialNotification) => void> =
    new Set();

  // ===========================================================================
  // NOTIFICATIONS CRUD
  // ===========================================================================

  /**
   * Get notifications for a user (paginated)
   */
  async getNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      types?: SocialNotificationType[];
    }
  ): Promise<{ notifications: SocialNotification[]; hasMore: boolean }> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    let query = supabase
      .from('social_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (options?.types && options.types.length > 0) {
      query = query.in('type', options.types);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to get notifications', { userId, error });
      throw error;
    }

    if (!data || data.length === 0) {
      return { notifications: [], hasMore: false };
    }

    // Fetch actor info
    const actorIds = [
      ...new Set(data.map((n: any) => n.actor_id).filter(Boolean)),
    ];
    let actorMap = new Map<
      string,
      { name: string; avatarUrl?: string; avatarEmoji?: string; avatarColor?: string }
    >();

    if (actorIds.length > 0) {
      // Fetch from users table (includes avatar_url)
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', actorIds);

      const { data: sailorProfiles } = await supabase
        .from('sailor_profiles')
        .select('user_id, avatar_emoji, avatar_color')
        .in('user_id', actorIds);

      const usersMap = new Map((users || []).map((u: any) => [u.id, u]));
      const sailorProfilesMap = new Map(
        (sailorProfiles || []).map((sp: any) => [sp.user_id, sp])
      );

      actorIds.forEach((id) => {
        const sailorProfile = sailorProfilesMap.get(id);
        const user = usersMap.get(id);
        actorMap.set(id, {
          name: user?.full_name || 'Sailor',
          avatarUrl: user?.avatar_url,
          avatarEmoji: sailorProfile?.avatar_emoji,
          avatarColor: sailorProfile?.avatar_color,
        });
      });
    }

    // Fetch regatta names
    const regattaIds = [
      ...new Set(data.map((n: any) => n.regatta_id).filter(Boolean)),
    ];
    let regattaMap = new Map<string, string>();

    if (regattaIds.length > 0) {
      const { data: regattas } = await supabase
        .from('regattas')
        .select('id, name')
        .in('id', regattaIds);

      regattaMap = new Map((regattas || []).map((r: any) => [r.id, r.name]));
    }

    const notifications: SocialNotification[] = data.map((n: any) => {
      const actor = n.actor_id ? actorMap.get(n.actor_id) : undefined;

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.is_read,
        createdAt: n.created_at,
        actorId: n.actor_id,
        actorName: actor?.name,
        actorAvatarUrl: actor?.avatarUrl,
        actorAvatarEmoji: actor?.avatarEmoji,
        actorAvatarColor: actor?.avatarColor,
        regattaId: n.regatta_id,
        regattaName: n.regatta_id ? regattaMap.get(n.regatta_id) : undefined,
        commentId: n.comment_id,
        achievementId: n.achievement_id,
        data: n.data,
      };
    });

    return {
      notifications,
      hasMore: count !== null ? offset + limit < count : false,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('social_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      logger.warn('Error getting unread count', { userId, error });
      return 0;
    }

    return count || 0;
  }

  /**
   * Get notification stats
   */
  async getStats(userId: string): Promise<NotificationStats> {
    const [unreadResult, totalResult] = await Promise.all([
      supabase
        .from('social_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
      supabase
        .from('social_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    return {
      unreadCount: unreadResult.count || 0,
      totalCount: totalResult.count || 0,
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('social_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to mark notification as read', {
        userId,
        notificationId,
        error,
      });
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('social_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      logger.error('Failed to mark all notifications as read', {
        userId,
        error,
      });
      throw error;
    }

    logger.info('Marked all notifications as read', { userId });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    userId: string,
    notificationId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('social_notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to delete notification', {
        userId,
        notificationId,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(userId: string): Promise<void> {
    const { error } = await supabase
      .from('social_notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to delete all notifications', { userId, error });
      throw error;
    }

    logger.info('Deleted all notifications', { userId });
  }

  // ===========================================================================
  // NOTIFICATION PREFERENCES
  // ===========================================================================

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.warn('Error getting preferences', { userId, error });
    }

    // Return defaults if no preferences exist
    if (!data) {
      return {
        pushEnabled: true,
        emailEnabled: false,
        newFollower: true,
        followedUserRace: true,
        raceLikes: true,
        raceComments: true,
        achievements: true,
        directMessages: true,
        groupMessages: true,
      };
    }

    return {
      pushEnabled: data.push_enabled ?? true,
      emailEnabled: data.email_enabled ?? false,
      newFollower: data.new_follower ?? true,
      followedUserRace: data.followed_user_race ?? true,
      raceLikes: data.race_likes ?? true,
      raceComments: data.race_comments ?? true,
      achievements: data.achievements ?? true,
      directMessages: data.direct_messages ?? true,
      groupMessages: data.group_messages ?? true,
      quietHoursStart: data.quiet_hours_start ?? null,
      quietHoursEnd: data.quiet_hours_end ?? null,
    };
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const updates: Record<string, any> = { user_id: userId };

    if (preferences.pushEnabled !== undefined) {
      updates.push_enabled = preferences.pushEnabled;
    }
    if (preferences.emailEnabled !== undefined) {
      updates.email_enabled = preferences.emailEnabled;
    }
    if (preferences.newFollower !== undefined) {
      updates.new_follower = preferences.newFollower;
    }
    if (preferences.followedUserRace !== undefined) {
      updates.followed_user_race = preferences.followedUserRace;
    }
    if (preferences.raceLikes !== undefined) {
      updates.race_likes = preferences.raceLikes;
    }
    if (preferences.raceComments !== undefined) {
      updates.race_comments = preferences.raceComments;
    }
    if (preferences.achievements !== undefined) {
      updates.achievements = preferences.achievements;
    }
    if (preferences.directMessages !== undefined) {
      updates.direct_messages = preferences.directMessages;
    }
    if (preferences.groupMessages !== undefined) {
      updates.group_messages = preferences.groupMessages;
    }
    if (preferences.quietHoursStart !== undefined) {
      updates.quiet_hours_start = preferences.quietHoursStart;
    }
    if (preferences.quietHoursEnd !== undefined) {
      updates.quiet_hours_end = preferences.quietHoursEnd;
    }

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(updates, { onConflict: 'user_id' });

    if (error) {
      logger.error('Failed to update preferences', { userId, error });
      throw error;
    }

    logger.info('Updated notification preferences', { userId });
  }

  // ===========================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ===========================================================================

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: SocialNotification) => void
  ): () => void {
    logger.info('Subscribing to notifications', { userId });

    // Add listener
    this.listeners.add(callback);

    // Set up Supabase realtime channel if not already done
    if (!this.realtimeChannel) {
      this.realtimeChannel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'social_notifications',
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            logger.info('Received realtime notification', { payload });

            const n = payload.new as any;

            // Fetch actor info
            let actorInfo: {
              name?: string;
              avatarEmoji?: string;
              avatarColor?: string;
            } = {};
            if (n.actor_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', n.actor_id)
                .single();

              const { data: sailorProfile } = await supabase
                .from('sailor_profiles')
                .select('avatar_emoji, avatar_color')
                .eq('user_id', n.actor_id)
                .single();

              actorInfo = {
                name: profile?.full_name || 'Sailor',
                avatarEmoji: sailorProfile?.avatar_emoji,
                avatarColor: sailorProfile?.avatar_color,
              };
            }

            const notification: SocialNotification = {
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              isRead: n.is_read,
              createdAt: n.created_at,
              actorId: n.actor_id,
              actorName: actorInfo.name,
              actorAvatarEmoji: actorInfo.avatarEmoji,
              actorAvatarColor: actorInfo.avatarColor,
              regattaId: n.regatta_id,
              commentId: n.comment_id,
              achievementId: n.achievement_id,
              data: n.data,
            };

            // Notify all listeners
            this.listeners.forEach((listener) => {
              try {
                listener(notification);
              } catch (e) {
                logger.error('Error in notification listener', { error: e });
              }
            });
          }
        )
        .subscribe();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);

      // Unsubscribe from realtime if no more listeners
      if (this.listeners.size === 0 && this.realtimeChannel) {
        this.realtimeChannel.unsubscribe();
        this.realtimeChannel = null;
      }
    };
  }

  /**
   * Unsubscribe from all notifications
   */
  unsubscribeAll(): void {
    this.listeners.clear();
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
    logger.info('Unsubscribed from all notifications');
  }

  // ===========================================================================
  // MANUAL NOTIFICATION CREATION
  // ===========================================================================

  /**
   * Create a custom notification (for testing or manual triggers)
   */
  async createNotification(
    userId: string,
    notification: {
      type: SocialNotificationType;
      title: string;
      body?: string;
      actorId?: string;
      regattaId?: string;
      commentId?: string;
      achievementId?: string;
      data?: Record<string, any>;
    }
  ): Promise<string> {
    const { data, error } = await supabase
      .from('social_notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        actor_id: notification.actorId,
        regatta_id: notification.regattaId,
        comment_id: notification.commentId,
        achievement_id: notification.achievementId,
        data: notification.data,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to create notification', { userId, error });
      throw error;
    }

    return data.id;
  }
}

// Export singleton instance
export const NotificationService = new NotificationServiceClass();

// Export type for dependency injection
export type NotificationServiceType = typeof NotificationService;
