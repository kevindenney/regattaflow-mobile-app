/**
 * useCommunityPost - React Query hook for creating community posts
 *
 * Provides a mutation hook specifically for creating posts in communities.
 * Invalidates relevant feed queries on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CommunityFeedService } from '@/services/venue/CommunityFeedService';
import { communityFeedKeys } from '@/hooks/useCommunityFeed';
import { communityKeys } from '@/hooks/useCommunities';
import type { PostType } from '@/types/community-feed';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateCommunityPostParams {
  community_id: string;
  title: string;
  body: string;
  post_type: PostType;
  is_public?: boolean;
  topic_tag_ids?: string[];
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Create a new community post
 *
 * This hook is specifically for creating posts in communities (not venues).
 * It invalidates:
 * - All feed queries (community feeds, joined communities feed)
 * - User communities query (to refresh post counts if applicable)
 */
export function useCreateCommunityPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCommunityPostParams) => {
      return CommunityFeedService.createPost({
        community_id: params.community_id,
        title: params.title,
        body: params.body,
        post_type: params.post_type,
        is_public: params.is_public ?? true,
        topic_tag_ids: params.topic_tag_ids,
      });
    },
    onSuccess: (_data, variables) => {
      // Invalidate all feed queries to refresh the community feed
      queryClient.invalidateQueries({ queryKey: communityFeedKeys.feeds() });

      // Invalidate the specific community feed
      queryClient.invalidateQueries({
        queryKey: communityFeedKeys.communityFeed(variables.community_id),
      });

      // Invalidate user communities to refresh any post count badges
      queryClient.invalidateQueries({ queryKey: communityKeys.userCommunities() });
    },
  });
}
