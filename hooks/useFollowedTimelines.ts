/**
 * useFollowedTimelines Hook
 *
 * Fetches race timelines for users the current user follows.
 * Used for the social sailing multi-timeline view (TikTok-style swipe navigation).
 *
 * Returns:
 * - myTimeline: Current user's races (always first in navigation)
 * - followedTimelines: Array of followed users with their races
 * - Combined: All timelines for easy navigation indexing
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { CrewFinderService, FollowedUserTimeline, SailorProfileSummary } from '@/services/CrewFinderService';
import { useEnrichedRaces } from '@/hooks/useEnrichedRaces';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useFollowedTimelines');

/**
 * Avatar configuration for display
 */
export interface AvatarConfig {
  emoji?: string;
  color?: string;
}

/**
 * User info for timeline header
 */
export interface TimelineUser {
  id: string;
  name: string;
  avatar: AvatarConfig;
  isCurrentUser: boolean;
}

/**
 * A single timeline (user + their races)
 */
export interface Timeline {
  user: TimelineUser;
  races: any[]; // EnrichedRace[]
  isLoading: boolean;
  isEmpty: boolean;
}

/**
 * Hook return type
 */
export interface UseFollowedTimelinesResult {
  /** Current user's timeline (always index 0) */
  myTimeline: Timeline | null;
  /** Followed users' timelines */
  followedTimelines: Timeline[];
  /** All timelines combined (myTimeline + followedTimelines) */
  allTimelines: Timeline[];
  /** Whether initial data is loading */
  isLoading: boolean;
  /** Whether any timelines are available */
  hasTimelines: boolean;
  /** Total number of timelines */
  timelineCount: number;
  /** Refresh all timeline data */
  refresh: () => Promise<void>;
  /** Error message if any */
  error: string | null;
}

/**
 * Hook to fetch followed users' race timelines
 */
export function useFollowedTimelines(
  /** Current user's races (already enriched from parent) */
  myRaces: any[] = []
): UseFollowedTimelinesResult {
  const { user, userProfile, isGuest } = useAuth();
  const [followedData, setFollowedData] = useState<FollowedUserTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  // Build current user's timeline
  const myTimeline: Timeline | null = useMemo(() => {
    if (!userId) return null;

    const userName = userProfile?.full_name || 'My Timeline';
    const sailorProfile = userProfile as any;

    return {
      user: {
        id: userId,
        name: userName,
        avatar: {
          emoji: sailorProfile?.avatar_emoji || '⛵',
          color: sailorProfile?.avatar_color || '#3B82F6',
        },
        isCurrentUser: true,
      },
      races: myRaces,
      isLoading: false,
      isEmpty: myRaces.length === 0,
    };
  }, [userId, userProfile, myRaces]);

  // Fetch followed users' data
  const fetchFollowedTimelines = useCallback(async () => {
    if (!userId || isGuest) {
      setFollowedData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('[useFollowedTimelines] Fetching followed users with races...');

      const data = await CrewFinderService.getFollowedUsersWithRaces(userId, {
        includeRaces: true,
        racesLimit: 20,
      });

      logger.info('[useFollowedTimelines] Fetched data:', {
        followedCount: data.length,
        totalRaces: data.reduce((sum, u) => sum + u.raceCount, 0),
      });

      setFollowedData(data);
    } catch (err: any) {
      logger.error('[useFollowedTimelines] Error fetching data:', err);
      setError(err?.message || 'Failed to load followed timelines');
      setFollowedData([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isGuest]);

  // Initial fetch
  useEffect(() => {
    fetchFollowedTimelines();
  }, [fetchFollowedTimelines]);

  // Build followed timelines from fetched data
  const followedTimelines: Timeline[] = useMemo(() => {
    return followedData.map((userData) => ({
      user: {
        id: userData.user.userId,
        name: userData.user.fullName,
        avatar: {
          emoji: userData.user.avatarEmoji || '⛵',
          color: userData.user.avatarColor || '#64748B',
        },
        isCurrentUser: false,
      },
      races: userData.races,
      isLoading: false,
      isEmpty: userData.races.length === 0,
    }));
  }, [followedData]);

  // Combine all timelines (my timeline first, then followed)
  const allTimelines: Timeline[] = useMemo(() => {
    const timelines: Timeline[] = [];

    if (myTimeline) {
      timelines.push(myTimeline);
    }

    timelines.push(...followedTimelines);

    return timelines;
  }, [myTimeline, followedTimelines]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchFollowedTimelines();
  }, [fetchFollowedTimelines]);

  return {
    myTimeline,
    followedTimelines,
    allTimelines,
    isLoading,
    hasTimelines: allTimelines.length > 0,
    timelineCount: allTimelines.length,
    refresh,
    error,
  };
}

/**
 * Hook to check if a specific user is followed
 */
export function useIsFollowing(targetUserId: string | null): {
  isFollowing: boolean;
  isLoading: boolean;
  toggleFollow: () => Promise<void>;
} {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const userId = user?.id;

  // Check follow status
  useEffect(() => {
    if (!userId || !targetUserId) {
      setIsFollowing(false);
      setIsLoading(false);
      return;
    }

    const checkFollowStatus = async () => {
      setIsLoading(true);
      try {
        const following = await CrewFinderService.isFollowing(userId, targetUserId);
        setIsFollowing(following);
      } catch (err) {
        logger.error('[useIsFollowing] Error checking status:', err);
        setIsFollowing(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFollowStatus();
  }, [userId, targetUserId]);

  // Toggle follow/unfollow
  const toggleFollow = useCallback(async () => {
    if (!userId || !targetUserId) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await CrewFinderService.unfollowUser(userId, targetUserId);
        setIsFollowing(false);
      } else {
        await CrewFinderService.followUser(userId, targetUserId);
        setIsFollowing(true);
      }
    } catch (err) {
      logger.error('[useIsFollowing] Error toggling follow:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, targetUserId, isFollowing]);

  return { isFollowing, isLoading, toggleFollow };
}

export default useFollowedTimelines;
