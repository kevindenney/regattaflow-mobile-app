/**
 * useVenueDiscussions - React Query hooks for venue discussions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  VenueDiscussionService,
  VenueDiscussion,
  VenueDiscussionComment,
  DiscussionCategory,
  CreateDiscussionParams,
  CreateCommentParams,
} from '@/services/venue/VenueDiscussionService';
import { useAuth } from '@/providers/AuthProvider';

// Query keys
export const discussionKeys = {
  all: ['venue-discussions'] as const,
  lists: () => [...discussionKeys.all, 'list'] as const,
  list: (venueId: string, filters?: {
    category?: DiscussionCategory;
    sortBy?: string;
    racingAreaId?: string | null;
    raceRouteId?: string | null;
  }) => [...discussionKeys.lists(), venueId, filters] as const,
  details: () => [...discussionKeys.all, 'detail'] as const,
  detail: (discussionId: string) => [...discussionKeys.details(), discussionId] as const,
  comments: (discussionId: string) => [...discussionKeys.all, 'comments', discussionId] as const,
};

/**
 * Fetch discussions for a venue
 */
export function useVenueDiscussions(
  venueId: string,
  options: {
    category?: DiscussionCategory;
    racingAreaId?: string | null;
    raceRouteId?: string | null;
    sortBy?: 'recent' | 'popular' | 'active';
    limit?: number;
    enabled?: boolean;
  } = {}
) {
  const { user } = useAuth();
  const {
    category,
    racingAreaId,
    raceRouteId,
    sortBy = 'recent',
    limit = 20,
    enabled = true
  } = options;

  return useQuery({
    queryKey: discussionKeys.list(venueId, { category, sortBy, racingAreaId, raceRouteId }),
    queryFn: async () => {
      const result = await VenueDiscussionService.getDiscussions(venueId, {
        category,
        racingAreaId,
        raceRouteId,
        sortBy,
        limit,
        userId: user?.id,
      });
      return result;
    },
    enabled: enabled && !!venueId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch a single discussion with comments
 */
export function useVenueDiscussion(discussionId: string, enabled = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: discussionKeys.detail(discussionId),
    queryFn: async () => {
      const discussion = await VenueDiscussionService.getDiscussion(discussionId, user?.id);
      return discussion;
    },
    enabled: enabled && !!discussionId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch comments for a discussion
 */
export function useDiscussionComments(discussionId: string, enabled = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: discussionKeys.comments(discussionId),
    queryFn: async () => {
      const comments = await VenueDiscussionService.getComments(discussionId, user?.id);
      return comments;
    },
    enabled: enabled && !!discussionId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Create a new discussion
 */
export function useCreateDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateDiscussionParams) => {
      return VenueDiscussionService.createDiscussion(params);
    },
    onSuccess: (data, variables) => {
      // Invalidate the discussions list for this venue
      queryClient.invalidateQueries({
        queryKey: discussionKeys.lists()
      });
    },
  });
}

/**
 * Update a discussion
 */
export function useUpdateDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      discussionId,
      updates
    }: {
      discussionId: string;
      updates: Partial<Pick<VenueDiscussion, 'title' | 'body' | 'category'>>
    }) => {
      return VenueDiscussionService.updateDiscussion(discussionId, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: discussionKeys.detail(data.id)
      });
      queryClient.invalidateQueries({
        queryKey: discussionKeys.lists()
      });
    },
  });
}

/**
 * Delete a discussion
 */
export function useDeleteDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (discussionId: string) => {
      return VenueDiscussionService.deleteDiscussion(discussionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: discussionKeys.lists()
      });
    },
  });
}

/**
 * Create a comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCommentParams) => {
      return VenueDiscussionService.createComment(params);
    },
    onSuccess: (data, variables) => {
      // Invalidate comments for this discussion
      queryClient.invalidateQueries({
        queryKey: discussionKeys.comments(variables.discussion_id)
      });
      // Also invalidate the discussion to update comment count
      queryClient.invalidateQueries({
        queryKey: discussionKeys.detail(variables.discussion_id)
      });
      queryClient.invalidateQueries({
        queryKey: discussionKeys.lists()
      });
    },
  });
}

/**
 * Update a comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      body,
      discussionId,
    }: {
      commentId: string;
      body: string;
      discussionId: string;
    }) => {
      return VenueDiscussionService.updateComment(commentId, body);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: discussionKeys.comments(variables.discussionId)
      });
    },
  });
}

/**
 * Delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      discussionId,
    }: {
      commentId: string;
      discussionId: string;
    }) => {
      return VenueDiscussionService.deleteComment(commentId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: discussionKeys.comments(variables.discussionId)
      });
      queryClient.invalidateQueries({
        queryKey: discussionKeys.detail(variables.discussionId)
      });
      queryClient.invalidateQueries({
        queryKey: discussionKeys.lists()
      });
    },
  });
}

/**
 * Vote on a discussion
 */
export function useVoteDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      discussionId,
      vote,
      venueId,
    }: {
      discussionId: string;
      vote: 1 | -1 | 0;
      venueId: string;
    }) => {
      return VenueDiscussionService.vote('discussion', discussionId, vote);
    },
    onMutate: async ({ discussionId, vote, venueId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: discussionKeys.detail(discussionId) });

      const previousDiscussion = queryClient.getQueryData<VenueDiscussion>(
        discussionKeys.detail(discussionId)
      );

      if (previousDiscussion) {
        const oldVote = previousDiscussion.user_vote || 0;
        const upvoteDiff = vote === 1 ? (oldVote === 1 ? -1 : 1) : (oldVote === 1 ? -1 : 0);
        const downvoteDiff = vote === -1 ? (oldVote === -1 ? -1 : 1) : (oldVote === -1 ? -1 : 0);

        queryClient.setQueryData<VenueDiscussion>(
          discussionKeys.detail(discussionId),
          {
            ...previousDiscussion,
            user_vote: vote === 0 ? null : vote,
            upvotes: previousDiscussion.upvotes + upvoteDiff,
            downvotes: previousDiscussion.downvotes + downvoteDiff,
          }
        );
      }

      return { previousDiscussion };
    },
    onError: (err, variables, context) => {
      if (context?.previousDiscussion) {
        queryClient.setQueryData(
          discussionKeys.detail(variables.discussionId),
          context.previousDiscussion
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: discussionKeys.detail(variables.discussionId)
      });
      queryClient.invalidateQueries({
        queryKey: discussionKeys.lists()
      });
    },
  });
}

/**
 * Vote on a comment
 */
export function useVoteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      vote,
      discussionId,
    }: {
      commentId: string;
      vote: 1 | -1 | 0;
      discussionId: string;
    }) => {
      return VenueDiscussionService.vote('comment', commentId, vote);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: discussionKeys.comments(variables.discussionId)
      });
    },
  });
}

/**
 * Get discussion categories
 */
export function useDiscussionCategories() {
  return VenueDiscussionService.getCategories();
}
