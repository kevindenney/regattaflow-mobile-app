import { supabase } from './supabase';

export type PostType = 'race_result' | 'tuning_guide' | 'check_in' | 'event' | 'announcement' | 'discussion';
export type PostVisibility = 'fleet' | 'public' | 'private';
export type NotificationType =
  | 'new_post' | 'post_like' | 'post_comment' | 'post_share'
  | 'tuning_guide_posted' | 'race_result_posted' | 'event_created'
  | 'member_check_in' | 'mention';

export interface FleetPost {
  id: string;
  fleetId: string;
  authorId: string;
  postType: PostType;
  content: string | null;
  metadata: Record<string, any>;
  visibility: PostVisibility;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;

  // Aggregated data (joined)
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  isLikedByUser?: boolean;
  isBookmarkedByUser?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;

  // Joined data
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface FleetNotification {
  id: string;
  userId: string;
  fleetId: string;
  notificationType: NotificationType;
  relatedPostId: string | null;
  relatedCommentId: string | null;
  actorId: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;

  // Joined data
  actor?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  fleet?: {
    id: string;
    name: string;
  };
}

export interface CreatePostParams {
  fleetId: string;
  postType: PostType;
  content?: string;
  metadata?: Record<string, any>;
  visibility?: PostVisibility;
}

export interface CreateCommentParams {
  postId: string;
  content: string;
  parentCommentId?: string;
}

class FleetSocialService {
  // ==========================================
  // POSTS
  // ==========================================

  async getFeedPosts(fleetId: string, options?: {
    limit?: number;
    offset?: number;
    postType?: PostType;
    userId?: string;
  }): Promise<FleetPost[]> {
    const userId = options?.userId;

    let query = supabase
      .from('fleet_posts')
      .select(`
        *,
        author:author_id (id, full_name, avatar_url),
        likes:fleet_post_likes(count),
        comments:fleet_post_comments(count),
        shares:fleet_post_shares(count)
      `)
      .eq('fleet_id', fleetId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (options?.postType) {
      query = query.eq('post_type', options.postType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 25) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching feed posts:', error);
      throw error;
    }

    // Get user's likes and bookmarks if userId provided
    let userLikes: Set<string> = new Set();
    let userBookmarks: Set<string> = new Set();

    if (userId && data && data.length > 0) {
      const postIds = data.map(p => p.id);

      const [likesRes, bookmarksRes] = await Promise.all([
        supabase
          .from('fleet_post_likes')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds),
        supabase
          .from('fleet_post_bookmarks')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds),
      ]);

      userLikes = new Set(likesRes.data?.map(l => l.post_id) || []);
      userBookmarks = new Set(bookmarksRes.data?.map(b => b.post_id) || []);
    }

    return (data || []).map(post => ({
      id: post.id,
      fleetId: post.fleet_id,
      authorId: post.author_id,
      postType: post.post_type,
      content: post.content,
      metadata: post.metadata || {},
      visibility: post.visibility,
      isPinned: post.is_pinned,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: post.author ? {
        id: post.author.id,
        name: post.author.full_name || 'Unknown',
        avatar_url: post.author.avatar_url,
      } : undefined,
      likesCount: Array.isArray(post.likes) ? post.likes.length : (post.likes?.[0]?.count || 0),
      commentsCount: Array.isArray(post.comments) ? post.comments.length : (post.comments?.[0]?.count || 0),
      sharesCount: Array.isArray(post.shares) ? post.shares.length : (post.shares?.[0]?.count || 0),
      isLikedByUser: userLikes.has(post.id),
      isBookmarkedByUser: userBookmarks.has(post.id),
    }));
  }

  async createPost(params: CreatePostParams): Promise<FleetPost> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('fleet_posts')
      .insert({
        fleet_id: params.fleetId,
        author_id: userData.user.id,
        post_type: params.postType,
        content: params.content || null,
        metadata: params.metadata || {},
        visibility: params.visibility || 'fleet',
      })
      .select(`
        *,
        author:author_id (id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating post:', error);
      throw error;
    }

    // Notify fleet members based on post type
    this.notifyOnNewPost(data.id, data.fleet_id, data.post_type);

    return this.mapPost(data);
  }

  async updatePost(postId: string, updates: {
    content?: string;
    metadata?: Record<string, any>;
    visibility?: PostVisibility;
  }): Promise<void> {
    const { error } = await supabase
      .from('fleet_posts')
      .update({
        content: updates.content,
        metadata: updates.metadata,
        visibility: updates.visibility,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('fleet_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // ==========================================
  // LIKES
  // ==========================================

  async likePost(postId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('fleet_post_likes')
      .insert({
        post_id: postId,
        user_id: userData.user.id,
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('Error liking post:', error);
      throw error;
    }
  }

  async unlikePost(postId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('fleet_post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  }

  // ==========================================
  // COMMENTS
  // ==========================================

  async getComments(postId: string): Promise<PostComment[]> {
    const { data, error } = await supabase
      .from('fleet_post_comments')
      .select(`
        *,
        author:author_id (id, full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    return (data || []).map(comment => ({
      id: comment.id,
      postId: comment.post_id,
      authorId: comment.author_id,
      content: comment.content,
      parentCommentId: comment.parent_comment_id,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: comment.author ? {
        id: comment.author.id,
        name: comment.author.full_name || 'Unknown',
        avatar_url: comment.author.avatar_url,
      } : undefined,
    }));
  }

  async createComment(params: CreateCommentParams): Promise<PostComment> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('fleet_post_comments')
      .insert({
        post_id: params.postId,
        author_id: userData.user.id,
        content: params.content,
        parent_comment_id: params.parentCommentId || null,
      })
      .select(`
        *,
        author:author_id (id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      throw error;
    }

    return {
      id: data.id,
      postId: data.post_id,
      authorId: data.author_id,
      content: data.content,
      parentCommentId: data.parent_comment_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      author: data.author ? {
        id: data.author.id,
        name: data.author.full_name || 'Unknown',
        avatar_url: data.author.avatar_url,
      } : undefined,
    };
  }

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('fleet_post_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // ==========================================
  // BOOKMARKS
  // ==========================================

  async bookmarkPost(postId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('fleet_post_bookmarks')
      .insert({
        post_id: postId,
        user_id: userData.user.id,
      });

    if (error && error.code !== '23505') {
      console.error('Error bookmarking post:', error);
      throw error;
    }
  }

  async unbookmarkPost(postId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('fleet_post_bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  async getBookmarkedPosts(userId: string): Promise<FleetPost[]> {
    const { data, error } = await supabase
      .from('fleet_post_bookmarks')
      .select(`
        post:post_id (
          *,
          author:author_id (id, full_name, avatar_url)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookmarked posts:', error);
      throw error;
    }

    return (data || [])
      .filter(item => item.post)
      .map(item => this.mapPost(item.post));
  }

  // ==========================================
  // SHARES
  // ==========================================

  async sharePost(postId: string, targetFleetId: string, message?: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('fleet_post_shares')
      .insert({
        post_id: postId,
        shared_by: userData.user.id,
        target_fleet_id: targetFleetId,
        message: message || null,
      });

    if (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  async getNotifications(userId: string, options?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<FleetNotification[]> {
    let query = supabase
      .from('fleet_notifications')
      .select(`
        *,
        actor:actor_id (id, full_name, avatar_url),
        fleet:fleet_id (id, name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return (data || []).map(notif => ({
      id: notif.id,
      userId: notif.user_id,
      fleetId: notif.fleet_id,
      notificationType: notif.notification_type,
      relatedPostId: notif.related_post_id,
      relatedCommentId: notif.related_comment_id,
      actorId: notif.actor_id,
      message: notif.message,
      isRead: notif.is_read,
      createdAt: notif.created_at,
      actor: notif.actor ? {
        id: notif.actor.id,
        name: notif.actor.full_name || 'Someone',
        avatar_url: notif.actor.avatar_url,
      } : undefined,
      fleet: notif.fleet ? {
        id: notif.fleet.id,
        name: notif.fleet.name,
      } : undefined,
    }));
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('fleet_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('fleet_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================

  subscribeToFleetPosts(fleetId: string, callback: (post: FleetPost) => void) {
    return supabase
      .channel(`fleet_posts:${fleetId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fleet_posts',
          filter: `fleet_id=eq.${fleetId}`,
        },
        async (payload) => {
          // Fetch full post with author data
          const { data } = await supabase
            .from('fleet_posts')
            .select(`
              *,
              author:author_id (id, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            callback(this.mapPost(data));
          }
        }
      )
      .subscribe();
  }

  subscribeToPostLikes(postId: string, callback: (count: number) => void) {
    return supabase
      .channel(`post_likes:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fleet_post_likes',
          filter: `post_id=eq.${postId}`,
        },
        async () => {
          const { count } = await supabase
            .from('fleet_post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

          callback(count || 0);
        }
      )
      .subscribe();
  }

  subscribeToNotifications(userId: string, callback: (notification: FleetNotification) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fleet_notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('fleet_notifications')
            .select(`
              *,
              actor:actor_id (id, full_name, avatar_url),
              fleet:fleet_id (id, name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            callback({
              id: data.id,
              userId: data.user_id,
              fleetId: data.fleet_id,
              notificationType: data.notification_type,
              relatedPostId: data.related_post_id,
              relatedCommentId: data.related_comment_id,
              actorId: data.actor_id,
              message: data.message,
              isRead: data.is_read,
              createdAt: data.created_at,
              actor: data.actor,
              fleet: data.fleet,
            });
          }
        }
      )
      .subscribe();
  }

  // ==========================================
  // PRIVATE HELPERS
  // ==========================================

  private mapPost(data: any): FleetPost {
    return {
      id: data.id,
      fleetId: data.fleet_id,
      authorId: data.author_id,
      postType: data.post_type,
      content: data.content,
      metadata: data.metadata || {},
      visibility: data.visibility,
      isPinned: data.is_pinned,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      author: data.author ? {
        id: data.author.id,
        name: data.author.full_name || 'Unknown',
        avatar_url: data.author.avatar_url,
      } : undefined,
    };
  }

  private async notifyOnNewPost(postId: string, fleetId: string, postType: PostType): Promise<void> {
    // Get fleet followers who want notifications for this post type
    const { data: followers } = await supabase
      .from('fleet_followers')
      .select('follower_id, notify_on_documents, notify_on_announcements, notify_on_events')
      .eq('fleet_id', fleetId);

    if (!followers) return;

    const { data: userData } = await supabase.auth.getUser();
    const actorId = userData.user?.id;

    // Determine notification type and filter
    let notificationType: NotificationType;
    let shouldNotify = (f: any) => false;

    switch (postType) {
      case 'tuning_guide':
        notificationType = 'tuning_guide_posted';
        shouldNotify = (f) => f.notify_on_documents;
        break;
      case 'race_result':
        notificationType = 'race_result_posted';
        shouldNotify = () => true; // Always notify on race results
        break;
      case 'event':
        notificationType = 'event_created';
        shouldNotify = (f) => f.notify_on_events;
        break;
      default:
        notificationType = 'new_post';
        shouldNotify = () => true;
    }

    // Create notifications for eligible followers
    const notifications = followers
      .filter(shouldNotify)
      .map(f => ({
        user_id: f.follower_id,
        fleet_id: fleetId,
        notification_type: notificationType,
        actor_id: actorId,
        related_post_id: postId,
        is_read: false,
      }));

    if (notifications.length > 0) {
      await supabase.from('fleet_notifications').insert(notifications);
    }
  }
}

export const fleetSocialService = new FleetSocialService();
