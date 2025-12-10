/**
 * useVenueRaces Hook
 * Fetches upcoming races at a specific venue from club_race_calendar
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';

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

  const loadRaces = useCallback(async (reset: boolean = false) => {
    if (!venueId) {
      setRaces([]);
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
          regatta_id,
          clubs (
            club_name
          )
        `, { count: 'exact' })
        .eq('venue_id', venueId)
        .gte('end_date', today)
        .order('start_date', { ascending: true })
        .range(currentOffset, currentOffset + limit - 1);

      if (queryError) {
        throw new Error(queryError.message);
      }

      const transformedRaces: VenueRace[] = (data || []).map((row: any) => {
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
          clubName: row.clubs?.club_name,
          venueId: row.venue_id,
          regattaId: row.regatta_id,
          daysUntilStart: days,
          isUpcoming: days >= 0,
          isToday: isToday(row.start_date),
          formattedDateRange: formatDateRange(row.start_date, row.end_date || row.start_date),
        };
      });

      if (reset) {
        setRaces(transformedRaces);
        setOffset(limit);
      } else {
        setRaces(prev => [...prev, ...transformedRaces]);
        setOffset(currentOffset + limit);
      }
      
      setHasMore((count || 0) > currentOffset + limit);
    } catch (err: any) {
      console.error('[useVenueRaces] Error loading races:', err);
      setError(err.message || 'Failed to load races');
    } finally {
      setIsLoading(false);
    }
  }, [venueId, limit, offset]);

  // Auto-load when venueId changes
  useEffect(() => {
    if (venueId && venueId !== lastVenueIdRef.current) {
      lastVenueIdRef.current = venueId;
      setOffset(0);
      loadRaces(true);
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

