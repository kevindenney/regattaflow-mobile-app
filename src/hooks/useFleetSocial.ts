import { useCallback, useEffect, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  fleetSocialService,
  FleetPost,
  PostType,
  CreatePostParams
} from '@/src/services/FleetSocialService';
import { useAuth } from '@/src/providers/AuthProvider';

interface UseFleetPostsOptions {
  limit?: number;
  postType?: PostType;
}

export function useFleetPosts(fleetId?: string, options?: UseFleetPostsOptions) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FleetPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  const loadPosts = useCallback(async () => {
    if (!fleetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedPosts = await fleetSocialService.getFeedPosts(fleetId, {
        limit: options?.limit,
        postType: options?.postType,
        userId: user?.id,
      });
      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Error loading fleet posts:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fleetId, options?.limit, options?.postType, user?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!fleetId) return;

    // Load initial posts
    loadPosts();

    // Subscribe to new posts
    const channel = fleetSocialService.subscribeToFleetPosts(fleetId, (newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    });

    setSubscription(channel);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fleetId, loadPosts]);

  const createPost = useCallback(
    async (params: Omit<CreatePostParams, 'fleetId'>) => {
      if (!fleetId) throw new Error('No fleet ID');

      const newPost = await fleetSocialService.createPost({
        ...params,
        fleetId,
      });

      // Post will be added via real-time subscription
      return newPost;
    },
    [fleetId]
  );

  const likePost = useCallback(async (postId: string) => {
    await fleetSocialService.likePost(postId);

    // Update local state optimistically
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              likesCount: (post.likesCount || 0) + 1,
              isLikedByUser: true,
            }
          : post
      )
    );
  }, []);

  const unlikePost = useCallback(async (postId: string) => {
    await fleetSocialService.unlikePost(postId);

    // Update local state optimistically
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              likesCount: Math.max((post.likesCount || 0) - 1, 0),
              isLikedByUser: false,
            }
          : post
      )
    );
  }, []);

  const bookmarkPost = useCallback(async (postId: string) => {
    await fleetSocialService.bookmarkPost(postId);

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isBookmarkedByUser: true } : post
      )
    );
  }, []);

  const unbookmarkPost = useCallback(async (postId: string) => {
    await fleetSocialService.unbookmarkPost(postId);

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isBookmarkedByUser: false } : post
      )
    );
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    await fleetSocialService.deletePost(postId);

    // Remove from local state
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  return {
    posts,
    loading,
    error,
    refresh: loadPosts,
    createPost,
    likePost,
    unlikePost,
    bookmarkPost,
    unbookmarkPost,
    deletePost,
  };
}

export function usePostComments(postId?: string) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const fetchedComments = await fleetSocialService.getComments(postId);
      setComments(fetchedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const createComment = useCallback(
    async (content: string, parentCommentId?: string) => {
      if (!postId) throw new Error('No post ID');

      const newComment = await fleetSocialService.createComment({
        postId,
        content,
        parentCommentId,
      });

      setComments((prev) => [...prev, newComment]);
      return newComment;
    },
    [postId]
  );

  const deleteComment = useCallback(async (commentId: string) => {
    await fleetSocialService.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  return {
    comments,
    loading,
    refresh: loadComments,
    createComment,
    deleteComment,
  };
}
