/**
 * useSailorProfile Hook
 *
 * Fetches and manages the current user's sailor profile ID.
 * Used for strategy cards and other sailor-specific features.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
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
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const fetchSailorId = async () => {
      const runId = ++fetchRunIdRef.current;
      const targetUserId = user?.id ?? null;
      const canCommit = () =>
        isMountedRef.current &&
        runId === fetchRunIdRef.current &&
        activeUserIdRef.current === targetUserId;

      if (!targetUserId) {
        if (!canCommit()) return;
        setSailorId(null);
        setLoading(false);
        return;
      }

      if (!canCommit()) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sailor_profiles')
          .select('id')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (error) {
          logger.warn('[useSailorProfile] Error fetching sailor profile', error);
          if (!canCommit()) return;
          setSailorId(null);
          return;
        }

        if (!canCommit()) return;
        setSailorId(data?.id || null);
      } catch (error) {
        logger.warn('[useSailorProfile] Unexpected error fetching sailor profile', error);
        if (!canCommit()) return;
        setSailorId(null);
      } finally {
        if (!canCommit()) return;
        setLoading(false);
      }
    };

    void fetchSailorId();
  }, [user?.id]);

  return {
    sailorId,
    loading,
  };
}

export default useSailorProfile;
