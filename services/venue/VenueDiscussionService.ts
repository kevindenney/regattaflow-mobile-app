/**
 * VenueDiscussionService - Reddit-style discussions for venues
 * Handles discussions, comments, and voting
 */

import { supabase } from '@/services/supabase';

export interface VenueDiscussion {
  id: string;
  venue_id: string;
  author_id: string | null;
  title: string;
  body: string | null;
  category: DiscussionCategory | null;
  is_public: boolean;
  fleet_id: string | null;
  racing_area_id: string | null;
  race_route_id: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  // Joined fields
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  racing_area?: {
    id: string;
    area_name: string;
  };
  race_route?: {
    id: string;
    name: string;
  };
  user_vote?: number | null; // 1, -1, or null
}

export interface VenueDiscussionComment {
  id: string;
  discussion_id: string;
  parent_id: string | null;
  author_id: string | null;
  body: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  user_vote?: number | null;
  replies?: VenueDiscussionComment[];
}

export type DiscussionCategory =
  | 'general'
  | 'tactics'
  | 'conditions'
  | 'gear'
  | 'services'
  | 'racing'
  | 'safety';

export interface CreateDiscussionParams {
  venue_id: string;
  title: string;
  body?: string;
  category?: DiscussionCategory;
  is_public?: boolean;
  fleet_id?: string;
  racing_area_id?: string;
  race_route_id?: string;
}

export interface CreateCommentParams {
  discussion_id: string;
  body: string;
  parent_id?: string;
}

class VenueDiscussionServiceClass {
  /**
   * Get discussions for a venue
   */
  async getDiscussions(
    venueId: string,
    options: {
      category?: DiscussionCategory;
      racingAreaId?: string | null;
      raceRouteId?: string | null;
      includeGeneral?: boolean; // Include general venue discussions when filtering by area
      limit?: number;
      offset?: number;
      sortBy?: 'recent' | 'popular' | 'active';
      userId?: string;
    } = {}
  ): Promise<{ data: VenueDiscussion[]; count: number }> {
    const {
      category,
      racingAreaId,
      raceRouteId,
      includeGeneral = true,
      limit = 20,
      offset = 0,
      sortBy = 'recent',
      userId
    } = options;

    let query = supabase
      .from('venue_discussions')
      .select(`
        *,
        author:auth.users!author_id (
          id,
          raw_user_meta_data->full_name,
          raw_user_meta_data->avatar_url
        ),
        racing_area:venue_racing_areas!racing_area_id (
          id,
          area_name
        ),
        race_route:race_routes!race_route_id (
          id,
          name
        )
      `, { count: 'exact' })
      .eq('venue_id', venueId);

    if (category) {
      query = query.eq('category', category);
    }

    // Filter by racing area - include area-specific AND general discussions
    if (racingAreaId) {
      if (includeGeneral) {
        query = query.or(`racing_area_id.eq.${racingAreaId},racing_area_id.is.null`);
      } else {
        query = query.eq('racing_area_id', racingAreaId);
      }
    }

    // Filter by race route - include route-specific AND general discussions
    if (raceRouteId) {
      if (includeGeneral) {
        query = query.or(`race_route_id.eq.${raceRouteId},race_route_id.is.null`);
      } else {
        query = query.eq('race_route_id', raceRouteId);
      }
    }

    // Sort order
    switch (sortBy) {
      case 'popular':
        query = query.order('upvotes', { ascending: false });
        break;
      case 'active':
        query = query.order('last_activity_at', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[VenueDiscussionService] Error fetching discussions:', error);
      throw error;
    }

    // Get user votes if userId provided
    let discussions = data || [];
    if (userId && discussions.length > 0) {
      const discussionIds = discussions.map(d => d.id);
      const { data: votes } = await supabase
        .from('venue_discussion_votes')
        .select('target_id, vote')
        .eq('user_id', userId)
        .eq('target_type', 'discussion')
        .in('target_id', discussionIds);

      const voteMap = new Map(votes?.map(v => [v.target_id, v.vote]) || []);
      discussions = discussions.map(d => ({
        ...d,
        user_vote: voteMap.get(d.id) || null,
      }));
    }

    return { data: discussions, count: count || 0 };
  }

  /**
   * Get a single discussion with its comments
   */
  async getDiscussion(
    discussionId: string,
    userId?: string
  ): Promise<VenueDiscussion | null> {
    const { data, error } = await supabase
      .from('venue_discussions')
      .select(`
        *,
        author:auth.users!author_id (
          id,
          raw_user_meta_data->full_name,
          raw_user_meta_data->avatar_url
        )
      `)
      .eq('id', discussionId)
      .single();

    if (error) {
      console.error('[VenueDiscussionService] Error fetching discussion:', error);
      return null;
    }

    // Get user vote if userId provided
    if (userId && data) {
      const { data: voteData } = await supabase
        .from('venue_discussion_votes')
        .select('vote')
        .eq('user_id', userId)
        .eq('target_type', 'discussion')
        .eq('target_id', discussionId)
        .single();

      return { ...data, user_vote: voteData?.vote || null };
    }

    return data;
  }

  /**
   * Create a new discussion
   */
  async createDiscussion(params: CreateDiscussionParams): Promise<VenueDiscussion> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to create a discussion');

    const { data, error } = await supabase
      .from('venue_discussions')
      .insert({
        venue_id: params.venue_id,
        author_id: user.id,
        title: params.title,
        body: params.body || null,
        category: params.category || 'general',
        is_public: params.is_public ?? true,
        fleet_id: params.fleet_id || null,
        racing_area_id: params.racing_area_id || null,
        race_route_id: params.race_route_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[VenueDiscussionService] Error creating discussion:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a discussion
   */
  async updateDiscussion(
    discussionId: string,
    updates: Partial<Pick<VenueDiscussion, 'title' | 'body' | 'category'>>
  ): Promise<VenueDiscussion> {
    const { data, error } = await supabase
      .from('venue_discussions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', discussionId)
      .select()
      .single();

    if (error) {
      console.error('[VenueDiscussionService] Error updating discussion:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a discussion
   */
  async deleteDiscussion(discussionId: string): Promise<void> {
    const { error } = await supabase
      .from('venue_discussions')
      .delete()
      .eq('id', discussionId);

    if (error) {
      console.error('[VenueDiscussionService] Error deleting discussion:', error);
      throw error;
    }
  }

  /**
   * Get comments for a discussion
   */
  async getComments(
    discussionId: string,
    userId?: string
  ): Promise<VenueDiscussionComment[]> {
    const { data, error } = await supabase
      .from('venue_discussion_comments')
      .select(`
        *,
        author:auth.users!author_id (
          id,
          raw_user_meta_data->full_name,
          raw_user_meta_data->avatar_url
        )
      `)
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[VenueDiscussionService] Error fetching comments:', error);
      throw error;
    }

    let comments = data || [];

    // Get user votes if userId provided
    if (userId && comments.length > 0) {
      const commentIds = comments.map(c => c.id);
      const { data: votes } = await supabase
        .from('venue_discussion_votes')
        .select('target_id, vote')
        .eq('user_id', userId)
        .eq('target_type', 'comment')
        .in('target_id', commentIds);

      const voteMap = new Map(votes?.map(v => [v.target_id, v.vote]) || []);
      comments = comments.map(c => ({
        ...c,
        user_vote: voteMap.get(c.id) || null,
      }));
    }

    // Build comment tree (nest replies under parents)
    return this.buildCommentTree(comments);
  }

  /**
   * Build a nested comment tree from flat comments
   */
  private buildCommentTree(comments: VenueDiscussionComment[]): VenueDiscussionComment[] {
    const commentMap = new Map<string, VenueDiscussionComment>();
    const rootComments: VenueDiscussionComment[] = [];

    // First pass: create map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    comments.forEach(comment => {
      const node = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(node);
        } else {
          rootComments.push(node);
        }
      } else {
        rootComments.push(node);
      }
    });

    return rootComments;
  }

  /**
   * Create a comment
   */
  async createComment(params: CreateCommentParams): Promise<VenueDiscussionComment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to comment');

    const { data, error } = await supabase
      .from('venue_discussion_comments')
      .insert({
        discussion_id: params.discussion_id,
        author_id: user.id,
        body: params.body,
        parent_id: params.parent_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[VenueDiscussionService] Error creating comment:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, body: string): Promise<VenueDiscussionComment> {
    const { data, error } = await supabase
      .from('venue_discussion_comments')
      .update({
        body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error('[VenueDiscussionService] Error updating comment:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('venue_discussion_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('[VenueDiscussionService] Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Vote on a discussion or comment
   */
  async vote(
    targetType: 'discussion' | 'comment',
    targetId: string,
    vote: 1 | -1 | 0 // 0 to remove vote
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to vote');

    if (vote === 0) {
      // Remove vote
      const { error } = await supabase
        .from('venue_discussion_votes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (error) {
        console.error('[VenueDiscussionService] Error removing vote:', error);
        throw error;
      }
    } else {
      // Upsert vote
      const { error } = await supabase
        .from('venue_discussion_votes')
        .upsert({
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
          vote,
        }, {
          onConflict: 'user_id,target_type,target_id',
        });

      if (error) {
        console.error('[VenueDiscussionService] Error voting:', error);
        throw error;
      }
    }
  }

  /**
   * Upvote a discussion
   */
  async upvoteDiscussion(discussionId: string): Promise<void> {
    return this.vote('discussion', discussionId, 1);
  }

  /**
   * Downvote a discussion
   */
  async downvoteDiscussion(discussionId: string): Promise<void> {
    return this.vote('discussion', discussionId, -1);
  }

  /**
   * Remove vote from discussion
   */
  async removeDiscussionVote(discussionId: string): Promise<void> {
    return this.vote('discussion', discussionId, 0);
  }

  /**
   * Upvote a comment
   */
  async upvoteComment(commentId: string): Promise<void> {
    return this.vote('comment', commentId, 1);
  }

  /**
   * Downvote a comment
   */
  async downvoteComment(commentId: string): Promise<void> {
    return this.vote('comment', commentId, -1);
  }

  /**
   * Remove vote from comment
   */
  async removeCommentVote(commentId: string): Promise<void> {
    return this.vote('comment', commentId, 0);
  }

  /**
   * Get discussion categories
   */
  getCategories(): { value: DiscussionCategory; label: string; icon: string }[] {
    return [
      { value: 'general', label: 'General', icon: 'chatbubble-outline' },
      { value: 'tactics', label: 'Tactics', icon: 'compass-outline' },
      { value: 'conditions', label: 'Conditions', icon: 'cloud-outline' },
      { value: 'gear', label: 'Gear', icon: 'construct-outline' },
      { value: 'services', label: 'Services', icon: 'business-outline' },
      { value: 'racing', label: 'Racing', icon: 'flag-outline' },
      { value: 'safety', label: 'Safety', icon: 'warning-outline' },
    ];
  }
}

export const VenueDiscussionService = new VenueDiscussionServiceClass();
