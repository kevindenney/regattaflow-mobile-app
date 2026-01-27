/**
 * VenueModerationService
 *
 * Handles venue moderation: role management, post moderation,
 * and moderator tools.
 */

import { supabase } from '@/services/supabase';
import type { VenueRole } from '@/types/community-feed';

class VenueModerationServiceClass {
  /**
   * Grant a role to a user at a venue
   */
  async grantRole(venueId: string, userId: string, role: VenueRole): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
      .from('venue_member_roles')
      .upsert({
        venue_id: venueId,
        user_id: userId,
        role,
        granted_by: user.id,
      }, {
        onConflict: 'venue_id,user_id,role',
      });

    if (error) {
      console.error('[VenueModerationService] Error granting role:', error);
      throw error;
    }
  }

  /**
   * Revoke a role from a user at a venue
   */
  async revokeRole(venueId: string, userId: string, role: VenueRole): Promise<void> {
    const { error } = await supabase
      .from('venue_member_roles')
      .delete()
      .eq('venue_id', venueId)
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      console.error('[VenueModerationService] Error revoking role:', error);
      throw error;
    }
  }

  /**
   * List all moderators for a venue
   */
  async listModerators(venueId: string): Promise<{
    user_id: string;
    role: VenueRole;
    full_name: string | null;
    avatar_url: string | null;
  }[]> {
    const { data, error } = await supabase
      .from('venue_member_roles')
      .select(`
        user_id,
        role,
        user:profiles!user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('venue_id', venueId)
      .eq('role', 'moderator');

    if (error) {
      console.error('[VenueModerationService] Error listing moderators:', error);
      return [];
    }

    return (data || []).map((d: any) => ({
      user_id: d.user_id,
      role: d.role,
      full_name: d.user?.full_name || null,
      avatar_url: d.user?.avatar_url || null,
    }));
  }

  /**
   * Pin or unpin a post (moderator action)
   */
  async pinPost(postId: string, pinned: boolean): Promise<void> {
    const { error } = await supabase
      .from('venue_discussions')
      .update({ pinned })
      .eq('id', postId);

    if (error) {
      console.error('[VenueModerationService] Error pinning post:', error);
      throw error;
    }
  }

  /**
   * Delete a post as moderator
   */
  async moderatorDeletePost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('venue_discussions')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('[VenueModerationService] Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Delete a comment as moderator
   */
  async moderatorDeleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('venue_discussion_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('[VenueModerationService] Error deleting comment:', error);
      throw error;
    }
  }
}

export const VenueModerationService = new VenueModerationServiceClass();
