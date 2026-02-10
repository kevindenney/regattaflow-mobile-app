/**
 * ActivityCommentService
 *
 * Service for managing comments on sailor activity in the Follow feed.
 */

import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ActivityCommentService');

// =============================================================================
// TYPES
// =============================================================================

export type ActivityType = 'race_result' | 'race_entry' | 'race_completion' | 'achievement';

export interface ActivityComment {
  id: string;
  activityType: ActivityType;
  activityId: string;
  targetUserId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  // Profile data
  authorName: string | null;
  authorAvatarEmoji: string | null;
  authorAvatarColor: string | null;
}

export interface CreateCommentInput {
  activityType: ActivityType;
  activityId: string;
  targetUserId: string;
  content: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export class ActivityCommentService {
  /**
   * Get comments for a specific activity
   */
  static async getComments(
    activityType: ActivityType,
    activityId: string
  ): Promise<ActivityComment[]> {
    try {
      const { data, error } = await supabase
        .from('activity_comments')
        .select('*')
        .eq('activity_type', activityType)
        .eq('activity_id', activityId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Failed to get comments:', error);
        return [];
      }

      // Batch-load user profiles
      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      const profileMap = new Map<string, { name: string | null; emoji: string | null; color: string | null }>();

      if (userIds.length > 0) {
        // Try to get from sailor_profiles first (has avatar info)
        const { data: sailorProfiles } = await supabase
          .from('sailor_profiles')
          .select('user_id, display_name, avatar_emoji, avatar_color')
          .in('user_id', userIds);

        (sailorProfiles || []).forEach((sp: any) => {
          profileMap.set(sp.user_id, {
            name: sp.display_name,
            emoji: sp.avatar_emoji,
            color: sp.avatar_color,
          });
        });

        // Fallback to profiles table for any missing users
        const missingIds = userIds.filter((id) => !profileMap.has(id));
        if (missingIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', missingIds);

          (profiles || []).forEach((p: any) => {
            profileMap.set(p.id, {
              name: p.full_name,
              emoji: null,
              color: null,
            });
          });

          // Last resort: users table for any still missing
          const stillMissing = missingIds.filter((id) => !profileMap.has(id));
          if (stillMissing.length > 0) {
            const { data: users } = await supabase
              .from('users')
              .select('id, full_name')
              .in('id', stillMissing);

            (users || []).forEach((u: any) => {
              profileMap.set(u.id, {
                name: u.full_name,
                emoji: null,
                color: null,
              });
            });
          }
        }
      }

      return (data || []).map((row: any) => {
        const profile = profileMap.get(row.user_id);
        return {
          id: row.id,
          activityType: row.activity_type as ActivityType,
          activityId: row.activity_id,
          targetUserId: row.target_user_id,
          userId: row.user_id,
          content: row.content,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          authorName: profile?.name || null,
          authorAvatarEmoji: profile?.emoji || null,
          authorAvatarColor: profile?.color || null,
        };
      });
    } catch (error) {
      logger.error('getComments failed:', error);
      return [];
    }
  }

  /**
   * Get comment count for an activity
   */
  static async getCommentCount(
    activityType: ActivityType,
    activityId: string
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('activity_comments')
        .select('*', { count: 'exact', head: true })
        .eq('activity_type', activityType)
        .eq('activity_id', activityId);

      if (error) {
        logger.error('Failed to get comment count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('getCommentCount failed:', error);
      return 0;
    }
  }

  /**
   * Get comment counts for multiple activities (batch)
   */
  static async getCommentCounts(
    activities: Array<{ activityType: ActivityType; activityId: string }>
  ): Promise<Map<string, number>> {
    try {
      if (activities.length === 0) return new Map();

      // Build OR conditions for each activity
      const conditions = activities.map(
        (a) => `(activity_type.eq.${a.activityType},activity_id.eq.${a.activityId})`
      );

      const { data, error } = await supabase
        .from('activity_comments')
        .select('activity_type, activity_id');

      if (error) {
        logger.error('Failed to get comment counts:', error);
        return new Map();
      }

      // Count by activity
      const countMap = new Map<string, number>();
      (data || []).forEach((row: any) => {
        const key = `${row.activity_type}:${row.activity_id}`;
        countMap.set(key, (countMap.get(key) || 0) + 1);
      });

      return countMap;
    } catch (error) {
      logger.error('getCommentCounts failed:', error);
      return new Map();
    }
  }

  /**
   * Create a new comment
   */
  static async createComment(input: CreateCommentInput): Promise<ActivityComment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activity_comments')
        .insert({
          activity_type: input.activityType,
          activity_id: input.activityId,
          target_user_id: input.targetUserId,
          user_id: user.id,
          content: input.content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Get profile for return — sailor_profiles has avatar info and display_name
      const { data: sailorProfile } = await supabase
        .from('sailor_profiles')
        .select('display_name, avatar_emoji, avatar_color')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fallback to profiles table for name if sailor_profiles missing
      let authorName = sailorProfile?.display_name || null;
      if (!authorName) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        authorName = profile?.full_name || null;
      }

      // Last resort: use email prefix from auth user
      if (!authorName) {
        authorName = user.email?.split('@')[0] || null;
      }

      return {
        id: data.id,
        activityType: data.activity_type as ActivityType,
        activityId: data.activity_id,
        targetUserId: data.target_user_id,
        userId: data.user_id,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        authorName,
        authorAvatarEmoji: sailorProfile?.avatar_emoji || null,
        authorAvatarColor: sailorProfile?.avatar_color || null,
      };
    } catch (error) {
      logger.error('createComment failed:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(commentId: string, content: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('activity_comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('updateComment failed:', error);
      return false;
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('activity_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('deleteComment failed:', error);
      return false;
    }
  }

  /**
   * Get recent comments on user's activity (for notifications)
   */
  static async getRecentCommentsOnMyActivity(limit: number = 20): Promise<ActivityComment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('activity_comments')
        .select('*')
        .eq('target_user_id', user.id)
        .neq('user_id', user.id) // Exclude own comments
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to get recent comments:', error);
        return [];
      }

      // Batch-load user profiles
      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      const profileMap = new Map<string, { name: string | null; emoji: string | null; color: string | null }>();

      if (userIds.length > 0) {
        const { data: sailorProfiles } = await supabase
          .from('sailor_profiles')
          .select('user_id, display_name, avatar_emoji, avatar_color')
          .in('user_id', userIds);

        (sailorProfiles || []).forEach((sp: any) => {
          profileMap.set(sp.user_id, {
            name: sp.display_name,
            emoji: sp.avatar_emoji,
            color: sp.avatar_color,
          });
        });

        const missingIds = userIds.filter((id) => !profileMap.has(id));
        if (missingIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', missingIds);

          (profiles || []).forEach((p: any) => {
            profileMap.set(p.id, {
              name: p.full_name,
              emoji: null,
              color: null,
            });
          });
        }
      }

      return (data || []).map((row: any) => {
        const profile = profileMap.get(row.user_id);
        return {
          id: row.id,
          activityType: row.activity_type as ActivityType,
          activityId: row.activity_id,
          targetUserId: row.target_user_id,
          userId: row.user_id,
          content: row.content,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          authorName: profile?.name || null,
          authorAvatarEmoji: profile?.emoji || null,
          authorAvatarColor: profile?.color || null,
        };
      });
    } catch (error) {
      logger.error('getRecentCommentsOnMyActivity failed:', error);
      return [];
    }
  }
}

export default ActivityCommentService;
