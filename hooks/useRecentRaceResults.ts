/**
 * useRecentRaceResults Hook
 *
 * Fetches the sailor's last ~6 race positions for sparkline display.
 * Queries race_timer_sessions where self_reported_position IS NOT NULL,
 * ordered by start_time desc, excluding the current race.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';

import { createLogger } from '@/lib/utils/logger';

// Module-level cache: skip all queries once the table/columns are confirmed missing
let tableUnavailable = false;
const CACHE_TTL_MS = 60_000;

type RecentRow = {
  regatta_id?: string | null;
  start_time: string;
  self_reported_position: number | null;
  self_reported_fleet_size: number | null;
};

const recentRowsCache = new Map<string, { expiresAt: number; rows: RecentRow[] }>();
const inFlightByUser = new Map<string, Promise<RecentRow[]>>();

export interface RecentRacePosition {
  raceId: string;
  raceName: string;
  date: string;
  position: number;
  fleetSize: number;
}

interface UseRecentRaceResultsResult {
  recentResults: RecentRacePosition[];
  averagePosition: number | null;
  isLoading: boolean;
}

const logger = createLogger('useRecentRaceResults');

async function loadRecentRowsForUser(userId: string, limit: number): Promise<RecentRow[]> {
  if (tableUnavailable) return [];

  const now = Date.now();
  const cached = recentRowsCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.rows;

  const inFlight = inFlightByUser.get(userId);
  if (inFlight) return inFlight;

  const baseLimit = Math.max(limit * 4, 24);

  const request = (async (): Promise<RecentRow[]> => {
    let query = supabase
      .from('race_timer_sessions')
      .select('regatta_id, start_time, self_reported_position, self_reported_fleet_size')
      .eq('sailor_id', userId)
      .not('self_reported_position', 'is', null)
      .not('self_reported_fleet_size', 'is', null)
      .order('start_time', { ascending: false })
      .limit(baseLimit);

    let { data, error } = await query;
    if (error) {
      logger.warn('Query error (suppressing future calls)', error);
      tableUnavailable = true;
      return [];
    }

    const rows = (data || []) as RecentRow[];
    recentRowsCache.set(userId, { rows, expiresAt: Date.now() + CACHE_TTL_MS });
    return rows;
  })();

  inFlightByUser.set(userId, request);
  try {
    return await request;
  } finally {
    inFlightByUser.delete(userId);
  }
}

export function useRecentRaceResults(
  userId?: string,
  currentRaceId?: string,
  limit: number = 6
): UseRecentRaceResultsResult {
  const [recentResults, setRecentResults] = useState<RecentRacePosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | undefined>(userId);
  const activeRaceIdRef = useRef<string | undefined>(currentRaceId);

  useEffect(() => {
    activeUserIdRef.current = userId;
    activeRaceIdRef.current = currentRaceId;
  }, [userId, currentRaceId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    async function fetchRecentResults() {
      const runId = ++fetchRunIdRef.current;
      const targetUserId = userId;
      const targetRaceId = currentRaceId;
      const canCommit = () =>
        isMountedRef.current &&
        runId === fetchRunIdRef.current &&
        activeUserIdRef.current === targetUserId &&
        activeRaceIdRef.current === targetRaceId;

      if (!targetUserId || tableUnavailable) {
        if (!canCommit()) return;
        setRecentResults([]);
        setIsLoading(false);
        return;
      }

      if (!canCommit()) return;
      setIsLoading(true);

      try {
        const rows = await loadRecentRowsForUser(targetUserId, limit);

        if (!canCommit()) return;

        const filtered = rows
          .filter((row) => {
            if (!targetRaceId) return true;
            return row.regatta_id !== targetRaceId;
          })
          .slice(0, limit);

        const results: RecentRacePosition[] = filtered.map((row) => ({
          raceId: row.regatta_id || '',
          raceName: '', // Not needed for sparkline
          date: row.start_time,
          position: row.self_reported_position as number,
          fleetSize: row.self_reported_fleet_size as number,
        }));

        // Reverse so oldest is first (left side of sparkline)
        results.reverse();

        setRecentResults(results);
      } catch (err) {
        logger.error('Error loading recent race results', err);
        if (!canCommit()) return;
        setRecentResults([]);
      } finally {
        if (!canCommit()) return;
        setIsLoading(false);
      }
    }

    void fetchRecentResults();
  }, [userId, currentRaceId, limit]);

  // Compute average position
  const averagePosition =
    recentResults.length > 0
      ? Math.round(
          (recentResults.reduce((sum, r) => sum + r.position, 0) / recentResults.length) * 10
        ) / 10
      : null;

  return { recentResults, averagePosition, isLoading };
}

export default useRecentRaceResults;
