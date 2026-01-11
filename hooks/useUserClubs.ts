/**
 * useUserClubs Hook
 *
 * Fetches clubs the current user is a member of.
 * Also includes clubs from their boats' home_club_id references.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useUserClubs');

export interface UserClub {
  id: string;
  name: string;
  short_name?: string;
  logo_url?: string;
  website?: string;
  city?: string;
  country?: string;
  /** Whether user is a member through club_members table */
  isMember?: boolean;
  /** Whether this is user's home club (from a boat) */
  isHomeClub?: boolean;
}

interface UseUserClubsOptions {
  /** Whether to include clubs from boat home_club references */
  includeHomeClubs?: boolean;
  /** Whether to enable fetching */
  enabled?: boolean;
}

interface UseUserClubsReturn {
  /** List of user's clubs */
  clubs: UserClub[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Refetch clubs */
  refetch: () => Promise<void>;
  /** Whether user has any clubs */
  hasClubs: boolean;
}

export function useUserClubs(options: UseUserClubsOptions = {}): UseUserClubsReturn {
  const { includeHomeClubs = true, enabled = true } = options;
  const { user, ready: authReady } = useAuth();

  // Only enable query when auth is ready and we have a user
  const queryEnabled = enabled && authReady && !!user?.id;

  const {
    data: clubs = [],
    isLoading: queryLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-clubs', user?.id, includeHomeClubs],
    queryFn: async () => {
      if (!user?.id) {
        logger.debug('[useUserClubs] No user ID, returning empty');
        return [];
      }

      logger.debug('[useUserClubs] Fetching clubs for user:', user.id);

      const clubMap = new Map<string, UserClub>();

      // 1. Fetch clubs from club_members table
      try {
        const { data: memberships, error: memberError } = await supabase
          .from('club_members')
          .select(`
            club:clubs(id, name, short_name, logo_url, website, city, country)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (!memberError && memberships) {
          for (const membership of memberships) {
            const club = membership.club as any;
            if (club?.id) {
              clubMap.set(club.id, {
                ...club,
                isMember: true,
              });
            }
          }
        }
      } catch (e) {
        logger.warn('[useUserClubs] Error fetching club memberships:', e);
      }

      // 2. Fetch home clubs from boats (if enabled)
      if (includeHomeClubs) {
        try {
          const { data: boats, error: boatError } = await supabase
            .from('sailor_boats')
            .select(`
              home_club:clubs!home_club_id(id, name, short_name, logo_url, website, city, country)
            `)
            .eq('sailor_id', user.id)
            .not('home_club_id', 'is', null);

          if (!boatError && boats) {
            for (const boat of boats) {
              const club = boat.home_club as any;
              if (club?.id && !clubMap.has(club.id)) {
                clubMap.set(club.id, {
                  ...club,
                  isHomeClub: true,
                });
              } else if (club?.id) {
                // Already in map, mark as home club too
                const existing = clubMap.get(club.id)!;
                existing.isHomeClub = true;
              }
            }
          }
        } catch (e) {
          logger.warn('[useUserClubs] Error fetching home clubs from boats:', e);
        }
      }

      const result = Array.from(clubMap.values());

      logger.debug('[useUserClubs] Fetched clubs:', {
        count: result.length,
        clubs: result.map(c => ({ id: c.id, name: c.name })),
      });

      return result;
    },
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Show loading while auth is not ready OR query is loading
  const isLoading = !authReady || queryLoading;

  return {
    clubs,
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
    hasClubs: clubs.length > 0,
  };
}

/**
 * Fetch all available clubs (for selection when user has no clubs)
 * This is a separate hook to avoid fetching all clubs unless needed.
 */
export function useAllClubs(options: { enabled?: boolean; limit?: number } = {}) {
  const { enabled = true, limit = 50 } = options;

  return useQuery({
    queryKey: ['all-clubs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, short_name, logo_url, city, country')
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        logger.error('[useAllClubs] Error fetching clubs:', error);
        throw error;
      }

      return (data || []) as UserClub[];
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - clubs don't change often
  });
}

export type { UseUserClubsOptions, UseUserClubsReturn };
