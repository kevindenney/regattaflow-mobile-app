/**
 * useVenueRaces Hook
 * Fetches upcoming races at a specific venue from club_race_calendar
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

export interface VenueRace {
  id: string;
  eventName: string;
  eventType: 'weeknight_series' | 'championship' | 'weekend_regatta' | 'clinic' | 'distance_race' | string;
  startDate: string;
  endDate: string;
  entryFee?: number;
  currency?: string;
  registrationStatus?: 'open' | 'closed' | 'full' | 'pending' | string;
  norUrl?: string;
  siUrl?: string;
  resultsUrl?: string;
  clubId?: string;
  clubName?: string;
  venueId?: string;
  regattaId?: string;
  // Computed fields
  daysUntilStart: number;
  isUpcoming: boolean;
  isToday: boolean;
  formattedDateRange: string;
}

export interface UseVenueRacesResult {
  races: VenueRace[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

const logger = createLogger('useVenueRaces');

/**
 * Calculate days until a date
 */
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is today
 */
function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr.split('T')[0] === today;
}

/**
 * Format date range for display
 */
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  const year = start.getFullYear();
  
  // Same day
  if (startDate.split('T')[0] === endDate.split('T')[0]) {
    return `${startMonth} ${startDay}, ${year}`;
  }
  
  // Same month
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  }
  
  // Different months
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

/**
 * Hook to fetch upcoming races at a venue
 */
export function useVenueRaces(
  venueId?: string,
  limit: number = 10
): UseVenueRacesResult {
  const [races, setRaces] = useState<VenueRace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  
  const lastVenueIdRef = useRef<string>('');
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const activeVenueIdRef = useRef<string | undefined>(venueId);

  useEffect(() => {
    activeVenueIdRef.current = venueId;
  }, [venueId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const loadRaces = useCallback(async (reset: boolean = false) => {
    const targetVenueId = venueId;
    const requestId = ++requestIdRef.current;
    const canCommit = () =>
      isMountedRef.current &&
      requestId === requestIdRef.current &&
      activeVenueIdRef.current === targetVenueId;

    if (!targetVenueId) {
      if (canCommit()) {
        setRaces([]);
        setHasMore(false);
        setError(null);
        setIsLoading(false);
        setOffset(0);
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const currentOffset = reset ? 0 : offset;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Query club_race_calendar for upcoming races at this venue
      const { data, error: queryError, count } = await supabase
        .from('club_race_calendar')
        .select(`
          id,
          club_id,
          event_name,
          event_type,
          registration_status,
          start_date,
          end_date,
          entry_fee,
          currency,
          nor_url,
          si_url,
          results_url,
          venue_id,
          regatta_id
        `, { count: 'exact' })
        .eq('venue_id', targetVenueId)
        .gte('end_date', today)
        .order('start_date', { ascending: true })
        .range(currentOffset, currentOffset + limit - 1);

      if (queryError) {
        throw new Error(queryError.message);
      }

      const rows = data || [];
      const clubIds = Array.from(new Set(rows.map((row: any) => row?.club_id).filter(Boolean))) as string[];
      const clubNames = new Map<string, string>();

      if (clubIds.length > 0) {
        const { data: clubsData } = await supabase
          .from('clubs')
          .select('id, name, club_name')
          .in('id', clubIds);

        (clubsData || []).forEach((club: any) => {
          if (club?.id) {
            clubNames.set(club.id, club.name || club.club_name || 'Unknown Club');
          }
        });

        const missingIds = clubIds.filter((id) => !clubNames.has(id));
        if (missingIds.length > 0) {
          const { data: yachtClubsData } = await supabase
            .from('yacht_clubs')
            .select('id, name')
            .in('id', missingIds);
          (yachtClubsData || []).forEach((club: any) => {
            if (club?.id && club?.name) {
              clubNames.set(club.id, club.name);
            }
          });
        }
      }

      const transformedRaces: VenueRace[] = rows.map((row: any) => {
        const days = daysUntil(row.start_date);
        return {
          id: row.id,
          eventName: row.event_name || 'Unnamed Race',
          eventType: row.event_type || 'weekend_regatta',
          startDate: row.start_date,
          endDate: row.end_date || row.start_date,
          entryFee: row.entry_fee,
          currency: row.currency || 'USD',
          registrationStatus: row.registration_status,
          norUrl: row.nor_url,
          siUrl: row.si_url,
          resultsUrl: row.results_url,
          clubId: row.club_id,
          clubName: row.club_id ? clubNames.get(row.club_id) : undefined,
          venueId: row.venue_id,
          regattaId: row.regatta_id,
          daysUntilStart: days,
          isUpcoming: days >= 0,
          isToday: isToday(row.start_date),
          formattedDateRange: formatDateRange(row.start_date, row.end_date || row.start_date),
        };
      });

      if (reset) {
        if (!canCommit()) return;
        setRaces(transformedRaces);
        setOffset(limit);
      } else {
        if (!canCommit()) return;
        setRaces(prev => [...prev, ...transformedRaces]);
        setOffset(currentOffset + limit);
      }

      if (!canCommit()) return;
      setHasMore((count || 0) > currentOffset + limit);
    } catch (err: any) {
      logger.warn('Error loading races', err);
      if (!canCommit()) return;
      setError(err.message || 'Failed to load races');
    } finally {
      if (!canCommit()) return;
      setIsLoading(false);
    }
  }, [venueId, limit, offset]);

  // Auto-load when venueId changes
  useEffect(() => {
    if (!venueId) {
      lastVenueIdRef.current = '';
      setRaces([]);
      setHasMore(false);
      setError(null);
      setIsLoading(false);
      setOffset(0);
      return;
    }

    if (venueId && venueId !== lastVenueIdRef.current) {
      lastVenueIdRef.current = venueId;
      setOffset(0);
      void loadRaces(true);
    }
  }, [venueId, loadRaces]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await loadRaces(true);
  }, [loadRaces]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await loadRaces(false);
    }
  }, [isLoading, hasMore, loadRaces]);

  return {
    races,
    isLoading,
    error,
    refresh,
    hasMore,
    loadMore,
  };
}

export default useVenueRaces;
