/**
 * useCommunities - React Query hooks for communities
 *
 * Provides hooks for community listing, search, membership,
 * categories, and discovery.
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { CommunityService } from '@/services/community/CommunityService';
import { useAuth } from '@/providers/AuthProvider';
import type {
  Community,
  CommunityCategory,
  CommunityType,
  CommunityMemberRole,
  CreateCommunityParams,
  UpdateCommunityParams,
  CommunitiesListParams,
} from '@/types/community';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const communityKeys = {
  all: ['communities'] as const,
  lists: () => [...communityKeys.all, 'list'] as const,
  list: (params?: CommunitiesListParams) => [...communityKeys.lists(), params] as const,
  search: (query: string, filters?: Record<string, unknown>) =>
    [...communityKeys.all, 'search', query, filters] as const,
  details: () => [...communityKeys.all, 'detail'] as const,
  detail: (id: string) => [...communityKeys.details(), id] as const,
  bySlug: (slug: string) => [...communityKeys.all, 'slug', slug] as const,
  byEntity: (entityType: string, entityId: string) =>
    [...communityKeys.all, 'entity', entityType, entityId] as const,
  categories: () => [...communityKeys.all, 'categories'] as const,
  userCommunities: () => [...communityKeys.all, 'user-communities'] as const,
  members: (communityId: string) => [...communityKeys.all, 'members', communityId] as const,
  flairs: (communityId: string) => [...communityKeys.all, 'flairs', communityId] as const,
  popular: () => [...communityKeys.all, 'popular'] as const,
  trending: () => [...communityKeys.all, 'trending'] as const,
  byCategory: (categoryId: string) => [...communityKeys.all, 'by-category', categoryId] as const,
  byType: (type: CommunityType) => [...communityKeys.all, 'by-type', type] as const,
};

// ============================================================================
// CATEGORY HOOKS
// ============================================================================

/**
 * Get all community categories
 */
export function useCommunityCategories() {
  return useQuery({
    queryKey: communityKeys.categories(),
    queryFn: () => CommunityService.getCategories(),
    staleTime: Infinity, // Categories rarely change
  });
}

// ============================================================================
// COMMUNITY DETAIL HOOKS
// ============================================================================

/**
 * Get a community by slug
 */
export function useCommunityBySlug(slug: string | undefined, enabled = true) {
  return useQuery({
    queryKey: communityKeys.bySlug(slug || ''),
    queryFn: () => CommunityService.getCommunityBySlug(slug!),
    enabled: enabled && !!slug,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get a community by ID
 */
export function useCommunityById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: communityKeys.detail(id || ''),
    queryFn: () => CommunityService.getCommunityById(id!),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get a community by linked entity (venue, boat class, etc.)
 */
export function useCommunityByEntity(
  entityType: string | undefined,
  entityId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: communityKeys.byEntity(entityType || '', entityId || ''),
    queryFn: () => CommunityService.getCommunityByLinkedEntity(entityType!, entityId!),
    enabled: enabled && !!entityType && !!entityId,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================================================
// COMMUNITY LIST HOOKS
// ============================================================================

/**
 * Infinite scrolling community list
 */
export function useCommunityList(params: Omit<CommunitiesListParams, 'offset'> = {}) {
  return useInfiniteQuery({
    queryKey: communityKeys.list(params),
    queryFn: async ({ pageParam = 0 }) => {
      return CommunityService.getCommunities({
        ...params,
        offset: pageParam,
        limit: params.limit || 20,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.data.length, 0);
      return lastPage.hasMore ? totalFetched : undefined;
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Search communities
 */
export function useCommunitySearch(
  query: string,
  filters?: {
    category_id?: string;
    community_type?: CommunityType;
    is_official?: boolean;
  },
  enabled = true
) {
  return useQuery({
    queryKey: communityKeys.search(query, filters),
    queryFn: () =>
      CommunityService.searchCommunities({
        query,
        ...filters,
        limit: 30,
      }),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 1,
  });
}

// ============================================================================
// USER COMMUNITIES
// ============================================================================

/**
 * Get communities the current user has joined
 */
export function useUserCommunities() {
  const { user } = useAuth();

  return useQuery({
    queryKey: communityKeys.userCommunities(),
    queryFn: () => CommunityService.getUserCommunities(),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================================================
// DISCOVERY HOOKS
// ============================================================================

/**
 * Get popular communities
 */
export function usePopularCommunities(limit = 10) {
  return useQuery({
    queryKey: communityKeys.popular(),
    queryFn: () => CommunityService.getPopularCommunities(limit),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get trending communities
 */
export function useTrendingCommunities(limit = 10) {
  return useQuery({
    queryKey: communityKeys.trending(),
    queryFn: () => CommunityService.getTrendingCommunities(limit),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get communities by category
 */
export function useCommunitiesByCategory(categoryId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: communityKeys.byCategory(categoryId || ''),
    queryFn: () => CommunityService.getCommunitiesByCategory(categoryId!, limit),
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get communities by type
 */
export function useCommunitiesByType(type: CommunityType | undefined, limit = 20) {
  return useQuery({
    queryKey: communityKeys.byType(type || 'general'),
    queryFn: () => CommunityService.getCommunitiesByType(type!, limit),
    enabled: !!type,
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================================================
// MEMBERSHIP MUTATIONS
// ============================================================================

/**
 * Join a community
 */
export function useJoinCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      communityId,
      role = 'member',
    }: {
      communityId: string;
      role?: CommunityMemberRole;
    }) => CommunityService.joinCommunity(communityId, role),
    onMutate: async ({ communityId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: communityKeys.detail(communityId) });

      const previousCommunity = queryClient.getQueryData<Community>(
        communityKeys.detail(communityId)
      );

      if (previousCommunity) {
        queryClient.setQueryData<Community>(communityKeys.detail(communityId), {
          ...previousCommunity,
          is_member: true,
          user_role: 'member',
          member_count: previousCommunity.member_count + 1,
        });
      }

      return { previousCommunity };
    },
    onError: (_err, { communityId }, context) => {
      if (context?.previousCommunity) {
        queryClient.setQueryData(
          communityKeys.detail(communityId),
          context.previousCommunity
        );
      }
    },
    onSettled: (_data, _error, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.userCommunities() });
      queryClient.invalidateQueries({ queryKey: communityKeys.lists() });
      // Also invalidate bySlug queries since the detail page uses slug-based fetching
      queryClient.invalidateQueries({ queryKey: [...communityKeys.all, 'slug'] });
    },
  });
}

/**
 * Leave a community
 */
export function useLeaveCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communityId: string) => CommunityService.leaveCommunity(communityId),
    onMutate: async (communityId) => {
      await queryClient.cancelQueries({ queryKey: communityKeys.detail(communityId) });

      const previousCommunity = queryClient.getQueryData<Community>(
        communityKeys.detail(communityId)
      );

      if (previousCommunity) {
        queryClient.setQueryData<Community>(communityKeys.detail(communityId), {
          ...previousCommunity,
          is_member: false,
          user_role: null,
          member_count: Math.max(0, previousCommunity.member_count - 1),
        });
      }

      return { previousCommunity };
    },
    onError: (_err, communityId, context) => {
      if (context?.previousCommunity) {
        queryClient.setQueryData(
          communityKeys.detail(communityId),
          context.previousCommunity
        );
      }
    },
    onSettled: (_data, _error, communityId) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.userCommunities() });
      queryClient.invalidateQueries({ queryKey: communityKeys.lists() });
      // Also invalidate bySlug queries since the detail page uses slug-based fetching
      queryClient.invalidateQueries({ queryKey: [...communityKeys.all, 'slug'] });
    },
  });
}

/**
 * Toggle membership (join/leave)
 */
export function useToggleCommunityMembership() {
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  return {
    mutate: (communityId: string, isMember: boolean) => {
      if (isMember) {
        leaveMutation.mutate(communityId);
      } else {
        joinMutation.mutate({ communityId });
      }
    },
    isPending: joinMutation.isPending || leaveMutation.isPending,
  };
}

// ============================================================================
// COMMUNITY MUTATIONS
// ============================================================================

/**
 * Create a community
 */
export function useCreateCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateCommunityParams) => CommunityService.createCommunity(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: communityKeys.userCommunities() });
    },
  });
}

/**
 * Update a community
 */
export function useUpdateCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      communityId,
      params,
    }: {
      communityId: string;
      params: UpdateCommunityParams;
    }) => CommunityService.updateCommunity(communityId, params),
    onSuccess: (data) => {
      queryClient.setQueryData(communityKeys.detail(data.id), data);
      queryClient.setQueryData(communityKeys.bySlug(data.slug), data);
      queryClient.invalidateQueries({ queryKey: communityKeys.lists() });
    },
  });
}

// ============================================================================
// MEMBERS & FLAIRS
// ============================================================================

/**
 * Get community members
 */
export function useCommunityMembers(communityId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: communityKeys.members(communityId || ''),
    queryFn: () => CommunityService.getCommunityMembers(communityId!),
    enabled: enabled && !!communityId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get community flairs
 */
export function useCommunityFlairs(communityId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: communityKeys.flairs(communityId || ''),
    queryFn: () => CommunityService.getCommunityFlairs(communityId!),
    enabled: enabled && !!communityId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Toggle notifications for a community
 */
export function useToggleCommunityNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      communityId,
      enabled,
    }: {
      communityId: string;
      enabled: boolean;
    }) => CommunityService.toggleNotifications(communityId, enabled),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.userCommunities() });
    },
  });
}
