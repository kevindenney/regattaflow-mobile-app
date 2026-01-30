/**
 * useRegattaInteractions - Hook for race likes and comments
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { SocialService } from '@/services/SocialService';

export function useRegattaInteractions(regattaId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch likes data
  const {
    data: likesData,
    isLoading: isLoadingLikes,
  } = useQuery({
    queryKey: ['regatta-likes', regattaId, user?.id],
    queryFn: async () => {
      const [isLiked, likeCount] = await Promise.all([
        user?.id ? SocialService.hasUserLiked(user.id, regattaId) : false,
        SocialService.getLikeCount(regattaId),
      ]);
      return { isLiked, likeCount };
    },
    enabled: !!regattaId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch comments
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['regatta-comments', regattaId],
    queryFn: () => SocialService.getComments(regattaId),
    enabled: !!regattaId,
    staleTime: 60 * 1000,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      await SocialService.likeRegatta(user.id, regattaId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['regatta-likes', regattaId, user?.id] });
      const previous = queryClient.getQueryData(['regatta-likes', regattaId, user?.id]);
      queryClient.setQueryData(['regatta-likes', regattaId, user?.id], (old: any) => ({
        isLiked: true,
        likeCount: (old?.likeCount || 0) + 1,
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['regatta-likes', regattaId, user?.id], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['regatta-likes', regattaId, user?.id] });
    },
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      await SocialService.unlikeRegatta(user.id, regattaId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['regatta-likes', regattaId, user?.id] });
      const previous = queryClient.getQueryData(['regatta-likes', regattaId, user?.id]);
      queryClient.setQueryData(['regatta-likes', regattaId, user?.id], (old: any) => ({
        isLiked: false,
        likeCount: Math.max(0, (old?.likeCount || 0) - 1),
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['regatta-likes', regattaId, user?.id], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['regatta-likes', regattaId, user?.id] });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({
      content,
      parentId,
    }: {
      content: string;
      parentId?: string | null;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return SocialService.addComment(user.id, regattaId, content, parentId || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regatta-comments', regattaId] });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      return SocialService.deleteComment(user.id, commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regatta-comments', regattaId] });
    },
  });

  // Toggle like
  const toggleLike = useCallback(async () => {
    if (!user?.id) return;

    if (likesData?.isLiked) {
      await unlikeMutation.mutateAsync();
    } else {
      await likeMutation.mutateAsync();
    }
  }, [user?.id, likesData?.isLiked, likeMutation, unlikeMutation]);

  // Add comment
  const addComment = useCallback(
    async (content: string, parentId?: string | null) => {
      await addCommentMutation.mutateAsync({ content, parentId });
    },
    [addCommentMutation]
  );

  // Delete comment
  const deleteComment = useCallback(
    async (commentId: string) => {
      await deleteCommentMutation.mutateAsync(commentId);
    },
    [deleteCommentMutation]
  );

  return {
    // Likes
    isLiked: likesData?.isLiked ?? false,
    likeCount: likesData?.likeCount ?? 0,
    toggleLike,
    isLiking: likeMutation.isPending || unlikeMutation.isPending,

    // Comments
    comments: commentsData ?? [],
    commentCount: commentsData?.length ?? 0,
    addComment,
    deleteComment,
    isAddingComment: addCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,

    // Loading states
    isLoading: isLoadingLikes || isLoadingComments,
    refetchComments,
  };
}
