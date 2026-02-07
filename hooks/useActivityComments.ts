/**
 * useActivityComments Hook
 *
 * Fetches and manages comments on sailor activity.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  ActivityCommentService,
  ActivityComment,
  ActivityType,
  CreateCommentInput,
} from '@/services/ActivityCommentService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useActivityComments');

export const ACTIVITY_COMMENTS_QUERY_KEY = 'activity-comments';

interface UseActivityCommentsOptions {
  activityType: ActivityType;
  activityId: string;
  enabled?: boolean;
}

interface UseActivityCommentsReturn {
  comments: ActivityComment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  addComment: (content: string, targetUserId: string) => Promise<ActivityComment | null>;
  isAdding: boolean;
  updateComment: (commentId: string, content: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
  commentCount: number;
}

export function useActivityComments({
  activityType,
  activityId,
  enabled = true,
}: UseActivityCommentsOptions): UseActivityCommentsReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = [ACTIVITY_COMMENTS_QUERY_KEY, activityType, activityId];

  // Fetch comments
  const {
    data: comments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => ActivityCommentService.getComments(activityType, activityId),
    enabled: enabled && !!activityId,
    staleTime: 30 * 1000,
  });

  // Add comment mutation
  const addMutation = useMutation({
    mutationFn: (input: CreateCommentInput) => ActivityCommentService.createComment(input),
    onSuccess: (newComment) => {
      if (newComment) {
        queryClient.setQueryData(
          queryKey,
          (old: ActivityComment[] | undefined) => [...(old || []), newComment]
        );
      }
    },
  });

  // Update comment mutation
  const updateMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      ActivityCommentService.updateComment(commentId, content),
    onSuccess: (success, { commentId, content }) => {
      if (success) {
        queryClient.setQueryData(
          queryKey,
          (old: ActivityComment[] | undefined) =>
            (old || []).map((c) =>
              c.id === commentId
                ? { ...c, content, updatedAt: new Date().toISOString() }
                : c
            )
        );
      }
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => ActivityCommentService.deleteComment(commentId),
    onSuccess: (success, commentId) => {
      if (success) {
        queryClient.setQueryData(
          queryKey,
          (old: ActivityComment[] | undefined) =>
            (old || []).filter((c) => c.id !== commentId)
        );
      }
    },
  });

  return {
    comments,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
    addComment: async (content: string, targetUserId: string) => {
      const result = await addMutation.mutateAsync({
        activityType,
        activityId,
        targetUserId,
        content,
      });
      return result;
    },
    isAdding: addMutation.isPending,
    updateComment: async (commentId: string, content: string) => {
      return updateMutation.mutateAsync({ commentId, content });
    },
    deleteComment: async (commentId: string) => {
      return deleteMutation.mutateAsync(commentId);
    },
    commentCount: comments.length,
  };
}

/**
 * Hook to get comment count for an activity (lighter weight than full comments)
 */
export function useActivityCommentCount(
  activityType: ActivityType,
  activityId: string
): {
  count: number;
  isLoading: boolean;
} {
  const { data: count = 0, isLoading } = useQuery({
    queryKey: [ACTIVITY_COMMENTS_QUERY_KEY, 'count', activityType, activityId],
    queryFn: () => ActivityCommentService.getCommentCount(activityType, activityId),
    enabled: !!activityId,
    staleTime: 60 * 1000, // 1 minute
  });

  return { count, isLoading };
}

export default useActivityComments;
