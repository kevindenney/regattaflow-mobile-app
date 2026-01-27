/**
 * useClassExperts Hook
 *
 * Discovers high-performing sailors by boat class who share openly.
 * Uses expert scoring algorithm: results performance + sharing activity.
 *
 * Discovery Mode: Class Expert Discovery
 * - "Learn from top Dragon sailors"
 * - Filtered by user's boat class
 * - Ranked by podium finishes + content sharing
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useClassExperts');

/**
 * Expert sailor profile with scoring
 */
export interface ClassExpert {
  userId: string;
  userName: string;
  avatarEmoji?: string;
  avatarColor?: string;
  expertScore: number;
  podiumCount: number;
  publicRaceCount: number;
  recentActivity: boolean;
  isFollowing?: boolean;
  // Preview content (loaded on demand)
  recentRaces?: ExpertRacePreview[];
}

/**
 * Race preview for expert card
 */
export interface ExpertRacePreview {
  id: string;
  name: string;
  date: string;
  hasPrepNotes: boolean;
  hasPostRaceNotes: boolean;
}

/**
 * Hook options
 */
export interface UseClassExpertsOptions {
  /** Boat class ID to filter experts */
  classId?: string;
  /** Maximum number of experts to return */
  limit?: number;
  /** Whether to auto-fetch on mount */
  enabled?: boolean;
}

/**
 * Hook return type
 */
export interface UseClassExpertsResult {
  /** Expert sailors */
  experts: ClassExpert[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Load race previews for an expert */
  loadExpertRaces: (expertUserId: string) => Promise<ExpertRacePreview[]>;
  /** Toggle follow for an expert */
  toggleFollow: (expertUserId: string) => Promise<void>;
}

/**
 * Hook to discover class experts
 */
export function useClassExperts(
  options: UseClassExpertsOptions = {}
): UseClassExpertsResult {
  const { classId, limit = 10, enabled = true } = options;
  const { user, isGuest } = useAuth();
  const [experts, setExperts] = useState<ClassExpert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  // Fetch class experts using database function
  const fetchExperts = useCallback(async () => {
    if (!enabled || !classId || isGuest) {
      setExperts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('[useClassExperts] Fetching experts for class:', classId);

      // Call the database function
      const { data, error: rpcError } = await supabase.rpc('get_class_experts', {
        target_class_id: classId,
        exclude_user_id: userId || null,
        result_limit: limit,
      });

      if (rpcError) {
        throw rpcError;
      }

      // Get following status for current user
      let followingIds: Set<string> = new Set();
      if (userId) {
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId);

        if (follows) {
          followingIds = new Set(follows.map((f: any) => f.following_id));
        }
      }

      const foundExperts: ClassExpert[] = (data || []).map((e: any) => ({
        userId: e.user_id,
        userName: e.user_name,
        avatarEmoji: e.avatar_emoji,
        avatarColor: e.avatar_color,
        expertScore: e.expert_score,
        podiumCount: e.podium_count,
        publicRaceCount: e.public_race_count,
        recentActivity: e.recent_activity,
        isFollowing: followingIds.has(e.user_id),
      }));

      setExperts(foundExperts);
      logger.info('[useClassExperts] Found experts:', foundExperts.length);
    } catch (err: any) {
      logger.error('[useClassExperts] Error:', err);
      setError(err?.message || 'Failed to find experts');
      setExperts([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, classId, userId, limit, isGuest]);

  // Load race previews for an expert
  const loadExpertRaces = useCallback(async (expertUserId: string): Promise<ExpertRacePreview[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('regattas')
        .select('id, name, start_date, prep_notes, post_race_notes')
        .eq('created_by', expertUserId)
        .eq('content_visibility', 'public')
        .order('start_date', { ascending: false })
        .limit(5);

      if (fetchError) {
        throw fetchError;
      }

      const previews: ExpertRacePreview[] = (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        date: r.start_date,
        hasPrepNotes: !!r.prep_notes,
        hasPostRaceNotes: !!r.post_race_notes,
      }));

      // Update expert with race previews
      setExperts((prev) =>
        prev.map((e) => (e.userId === expertUserId ? { ...e, recentRaces: previews } : e))
      );

      return previews;
    } catch (err: any) {
      logger.error('[useClassExperts] Error loading races:', err);
      return [];
    }
  }, []);

  // Toggle follow for an expert
  const toggleFollow = useCallback(async (expertUserId: string) => {
    if (!userId) return;

    try {
      const expert = experts.find((e) => e.userId === expertUserId);
      if (!expert) return;

      if (expert.isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', expertUserId);
      } else {
        await supabase.from('user_follows').insert({
          follower_id: userId,
          following_id: expertUserId,
        });
      }

      // Update local state
      setExperts((prev) =>
        prev.map((e) =>
          e.userId === expertUserId ? { ...e, isFollowing: !e.isFollowing } : e
        )
      );

      logger.info('[useClassExperts] Toggled follow:', {
        expertUserId,
        nowFollowing: !expert.isFollowing,
      });
    } catch (err: any) {
      logger.error('[useClassExperts] Error toggling follow:', err);
    }
  }, [userId, experts]);

  // Initial fetch
  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  return {
    experts,
    isLoading,
    error,
    refresh: fetchExperts,
    loadExpertRaces,
    toggleFollow,
  };
}

/**
 * Hook to get user's primary boat class
 */
export function useUserBoatClass(): {
  classId: string | null;
  className: string | null;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const [classId, setClassId] = useState<string | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchBoatClass = async () => {
      try {
        // Get user's primary boat
        const { data: boat } = await supabase
          .from('sailor_boats')
          .select('class_id, boat_classes(id, name)')
          .eq('sailor_id', user.id)
          .eq('is_primary', true)
          .maybeSingle();

        if (boat) {
          setClassId(boat.class_id);
          setClassName((boat.boat_classes as any)?.name || null);
        } else {
          // Try getting any boat
          const { data: anyBoat } = await supabase
            .from('sailor_boats')
            .select('class_id, boat_classes(id, name)')
            .eq('sailor_id', user.id)
            .limit(1)
            .maybeSingle();

          if (anyBoat) {
            setClassId(anyBoat.class_id);
            setClassName((anyBoat.boat_classes as any)?.name || null);
          }
        }
      } catch (err) {
        logger.error('[useUserBoatClass] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoatClass();
  }, [user?.id]);

  return { classId, className, isLoading };
}

export default useClassExperts;
