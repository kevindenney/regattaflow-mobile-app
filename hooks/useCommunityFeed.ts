/**
 * useCommunityFeed - React Query hooks for community knowledge feed
 *
 * Provides hooks for feed listing, post detail, voting, comments,
 * membership, topic tags, condition matching, and map pins.
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { CommunityFeedService } from '@/services/venue/CommunityFeedService';
import { ConditionMatchingService } from '@/services/venue/ConditionMatchingService';
import { useAuth } from '@/providers/AuthProvider';
import type {
  FeedPost,
  FeedSortType,
  PostType,
  TopPeriod,
  CurrentConditions,
  CreatePostParams,
  UpdatePostParams,
  MapBounds,
} from '@/types/community-feed';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const communityFeedKeys = {
  all: ['community-feed'] as const,
  feeds: () => [...communityFeedKeys.all, 'feed'] as const,
  feed: (venueId: string, filters?: {
    sort?: FeedSortType;
    postType?: PostType;
    tagIds?: string[];
    racingAreaId?: string | null;
    topPeriod?: TopPeriod;
  }) => [...communityFeedKeys.feeds(), venueId, filters] as const,
  posts: () => [...communityFeedKeys.all, 'post'] as const,
  post: (postId: string) => [...communityFeedKeys.posts(), postId] as const,
  comments: (postId: string) => [...communityFeedKeys.all, 'comments', postId] as const,
  topicTags: () => [...communityFeedKeys.all, 'topic-tags'] as const,
  membership: (venueId: string) => [...communityFeedKeys.all, 'membership', venueId] as const,
  mapPins: (venueId: string) => [...communityFeedKeys.all, 'map-pins', venueId] as const,
  authorStats: (authorId: string, venueId: string) =>
    [...communityFeedKeys.all, 'author-stats', authorId, venueId] as const,
  conditionsFeed: (venueId: string) => [...communityFeedKeys.all, 'conditions-feed', venueId] as const,
};

// ============================================================================
// FEED HOOKS
// ============================================================================

/**
 * Infinite-scrolling community feed with cursor pagination
 */
export function useCommunityFeed(
  venueId: string,
  options: {
    sort?: FeedSortType;
    postType?: PostType;
    tagIds?: string[];
    racingAreaId?: string | null;
    topPeriod?: TopPeriod;
    currentConditions?: CurrentConditions;
    enabled?: boolean;
  } = {}
) {
  const {
    sort = 'hot',
    postType,
    tagIds,
    racingAreaId,
    topPeriod,
    currentConditions,
    enabled = true,
  } = options;

  const isConditionsSort = sort === 'conditions_match' && currentConditions;

  return useInfiniteQuery({
    queryKey: isConditionsSort
      ? communityFeedKeys.conditionsFeed(venueId)
      : communityFeedKeys.feed(venueId, { sort, postType, tagIds, racingAreaId, topPeriod }),
    queryFn: async ({ pageParam = 0 }) => {
      if (isConditionsSort && currentConditions) {
        return ConditionMatchingService.getConditionMatchedFeed(
          venueId,
          currentConditions,
          pageParam,
          20
        );
      }

      return CommunityFeedService.getFeed({
        venueId,
        sort,
        postType,
        tagIds,
        racingAreaId,
        topPeriod,
        page: pageParam,
        limit: 20,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: enabled && !!venueId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ============================================================================
// POST DETAIL
// ============================================================================

/**
 * Fetch a single post with all joined data
 */
export function usePostDetail(postId: string, enabled = true) {
  return useQuery({
    queryKey: communityFeedKeys.post(postId),
    queryFn: () => CommunityFeedService.getPostById(postId),
    enabled: enabled && !!postId,
    staleTime: 1000 * 60, // 1 minute
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new post
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreatePostParams) => CommunityFeedService.createPost(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: communityFeedKeys.feeds() });
      queryClient.invalidateQueries({ queryKey: communityFeedKeys.mapPins(variables.venue_id) });
    },
  });
}

/**
 * Update a post
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, updates }: { postId: string; updates: UpdatePostParams }) =>
      CommunityFeedService.updatePost(postId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: communityFeedKeys.post(data.id) });
      queryClient.invalidateQueries({ queryKey: communityFeedKeys.feeds() });
    },
  });
}

/**
 * Delete a post
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => CommunityFeedService.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityFeedKeys.feeds() });
    },
  });
}

/**
 * Vote on a post with optimistic update
 */
export function useVotePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetType, targetId, vote }: {
      targetType: 'discussion' | 'comment';
      targetId: string;
      vote: 1 | 0;
    }) => CommunityFeedService.vote(targetType, targetId, vote),
    onMutate: async ({ targetType, targetId, vote }) => {
      if (targetType !== 'discussion') return;

      await queryClient.cancelQueries({ queryKey: communityFeedKeys.post(targetId) });

      const previousPost = queryClient.getQueryData<FeedPost>(
        communityFeedKeys.post(targetId)
      );

      if (previousPost) {
        const wasUpvoted = previousPost.user_vote === 1;
        const upvoteDelta = vote === 1
          ? (wasUpvoted ? -1 : 1)
          : (wasUpvoted ? -1 : 0);

        queryClient.setQueryData<FeedPost>(
          communityFeedKeys.post(targetId),
          {
            ...previousPost,
            user_vote: vote === 0 ? null : 1,
            upvotes: Math.max(0, previousPost.upvotes + upvoteDelta),
          }
        );
      }

      return { previousPost };
    },
    onError: (_err, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(
          communityFeedKeys.post(variables.targetId),
          context.previousPost
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      if (variables.targetType === 'discussion') {
        queryClient.invalidateQueries({ queryKey: communityFeedKeys.post(variables.targetId) });
      }
      queryClient.invalidateQueries({ queryKey: communityFeedKeys.feeds() });
    },
  });
}

// ============================================================================
// COMMENTS
// ============================================================================

/**
 * Fetch threaded comments for a post
 */
export function usePostComments(postId: string, enabled = true) {
  return useQuery({
    queryKey: communityFeedKeys.comments(postId),
    queryFn: () => CommunityFeedService.getComments(postId),
    enabled: enabled && !!postId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Create a comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, body, parentId }: {
      postId: string;
      body: string;
      parentId?: string;
    }) => CommunityFeedService.createComment(postId, body, parentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: communityFeedKeys.comments(variables.postId) });
      queryClient.invalidateQueries({ queryKey: communityFeedKeys.post(variables.postId) });
      queryClient.invalidateQueries({ queryKey: communityFeedKeys.feeds() });
    },
  });
}

// ============================================================================
// MEMBERSHIP & ROLES
// ============================================================================

/**
 * Check if current user is a member of a venue
 */
export function useVenueMembership(venueId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: communityFeedKeys.membership(venueId),
    queryFn: () => CommunityFeedService.checkMembership(venueId),
    enabled: !!venueId && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// TOPIC TAGS
// ============================================================================

/**
 * Get all topic tags (cached globally)
 */
export function useTopicTags() {
  return useQuery({
    queryKey: communityFeedKeys.topicTags(),
    queryFn: () => CommunityFeedService.getTopicTags(),
    staleTime: Infinity,
  });
}

// ============================================================================
// MAP PINS
// ============================================================================

/**
 * Get geo-pinned posts for map overlay
 */
export function useMapPinnedPosts(venueId: string, bounds?: MapBounds) {
  return useQuery({
    queryKey: communityFeedKeys.mapPins(venueId),
    queryFn: () => CommunityFeedService.getMapPinnedPosts(venueId, bounds),
    enabled: !!venueId,
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================================================
// AUTHOR STATS
// ============================================================================

/**
 * Get author's racing stats at a venue
 */
export function useAuthorVenueStats(authorId: string | null, venueId: string) {
  return useQuery({
    queryKey: communityFeedKeys.authorStats(authorId || '', venueId),
    queryFn: () => CommunityFeedService.getAuthorVenueStats(authorId!, venueId),
    enabled: !!authorId && !!venueId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
