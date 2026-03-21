/**
 * StepCommentService — CRUD for step discussion comments.
 * Follows the ActivityCommentService pattern.
 */

import { supabase } from './supabase';

export interface StepComment {
  id: string;
  stepId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  // Profile data
  userName: string;
  userAvatarEmoji?: string;
  userAvatarColor?: string;
  userAvatarUrl?: string;
}

export class StepCommentService {
  /**
   * Get all comments for a step, with author profile info.
   */
  static async getComments(stepId: string): Promise<StepComment[]> {
    const { data, error } = await supabase
      .from('step_comments')
      .select('*')
      .eq('step_id', stepId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[StepCommentService] getComments error:', error);
      return [];
    }

    // Batch-load profiles
    const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
    const profileMap = new Map<string, { name: string; emoji?: string; color?: string; avatarUrl?: string }>();

    if (userIds.length > 0) {
      // Get name + avatar_url from profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      (profiles || []).forEach((p: any) => {
        profileMap.set(p.id, {
          name: p.full_name || 'User',
          avatarUrl: p.avatar_url,
        });
      });

      // Get avatar emoji/color from sailor_profiles
      const { data: sailorProfiles } = await supabase
        .from('sailor_profiles')
        .select('user_id, avatar_emoji, avatar_color')
        .in('user_id', userIds);

      (sailorProfiles || []).forEach((sp: any) => {
        const existing = profileMap.get(sp.user_id);
        profileMap.set(sp.user_id, {
          name: existing?.name || 'User',
          avatarUrl: existing?.avatarUrl,
          emoji: sp.avatar_emoji,
          color: sp.avatar_color,
        });
      });
    }

    return (data || []).map((row: any) => {
      const profile = profileMap.get(row.user_id);
      return {
        id: row.id,
        stepId: row.step_id,
        userId: row.user_id,
        parentId: row.parent_id,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userName: profile?.name || 'User',
        userAvatarEmoji: profile?.emoji,
        userAvatarColor: profile?.color,
        userAvatarUrl: profile?.avatarUrl,
      };
    });
  }

  /**
   * Add a comment to a step.
   */
  static async addComment(
    stepId: string,
    userId: string,
    content: string,
    parentId?: string | null,
  ): Promise<StepComment> {
    const { data, error } = await supabase
      .from('step_comments')
      .insert({
        step_id: stepId,
        user_id: userId,
        content,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      stepId: data.step_id,
      userId: data.user_id,
      parentId: data.parent_id,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userName: 'You',
    };
  }

  /**
   * Delete own comment.
   */
  static async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('step_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  }
}
