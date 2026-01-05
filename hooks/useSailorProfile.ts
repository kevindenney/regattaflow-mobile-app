/**
 * useSailorProfile Hook
 *
 * Fetches and manages the current user's sailor profile ID.
 * Used for strategy cards and other sailor-specific features.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useSailorProfile');

// =============================================================================
// TYPES
// =============================================================================

export interface UserForSailorProfile {
  id: string;
  [key: string]: unknown;
}

export interface UseSailorProfileParams {
  /** Current user */
  user: UserForSailorProfile | null;
}

export interface UseSailorProfileReturn {
  /** The sailor profile ID for the current user */
  sailorId: string | null;
  /** Whether the profile is currently loading */
  loading: boolean;
}

/**
 * Hook for fetching the current user's sailor profile ID
 */
export function useSailorProfile({
  user,
}: UseSailorProfileParams): UseSailorProfileReturn {
  const [sailorId, setSailorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSailorId = async () => {
      if (!user?.id) {
        setSailorId(null);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sailor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          logger.warn('[useSailorProfile] Error fetching sailor profile', error);
          setSailorId(null);
          return;
        }

        setSailorId(data?.id || null);
      } catch (error) {
        logger.warn('[useSailorProfile] Unexpected error fetching sailor profile', error);
        setSailorId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSailorId();
  }, [user?.id]);

  return {
    sailorId,
    loading,
  };
}

export default useSailorProfile;
