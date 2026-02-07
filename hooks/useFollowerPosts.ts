/**
 * useFollowerPosts hooks
 *
 * TanStack React Query mutations for creating and deleting follower posts.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FollowerPostService,
  type CreateFollowerPostInput,
} from '@/services/FollowerPostService';
import { watchFeedKeys } from './useWatchFeed';

/**
 * Mutation hook for creating a new follower post
 */
export function useCreateFollowerPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFollowerPostInput) =>
      FollowerPostService.createPost(input),
    onSuccess: () => {
      // Invalidate the watch feed to pick up the new post
      queryClient.invalidateQueries({ queryKey: watchFeedKeys.all });
    },
  });
}

/**
 * Mutation hook for deleting a follower post
 */
export function useDeleteFollowerPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => FollowerPostService.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchFeedKeys.all });
    },
  });
}
