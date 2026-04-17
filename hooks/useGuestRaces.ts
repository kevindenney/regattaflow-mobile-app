/**
 * useGuestRaces Hook
 *
 * Provides race data for guest (non-authenticated) users.
 * Combines demo races with any locally stored guest race.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DemoRaceService } from '@/services/DemoRaceService';
import { GuestStorageService, type GuestRace } from '@/services/GuestStorageService';
import type { DemoRace } from '@/lib/demo/demoRaceData';

export interface GuestRaceListItem {
  id: string;
  name: string;
  start_date: string;
  venue?: string;
  latitude?: number;
  longitude?: number;
  race_type?: string;
  status?: string;
  isDemo?: boolean;
  isGuestRace?: boolean;
  /** Boat ID for equipment features (demo boats) */
  boat_id?: string;
  /** Class ID for tuning features (demo boats) */
  class_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Convert a DemoRace to a list item format
 */
function demoRaceToListItem(demo: DemoRace): GuestRaceListItem {
  return {
    id: demo.id,
    name: demo.name,
    start_date: demo.start_date,
    venue: demo.venue,
    latitude: demo.latitude,
    longitude: demo.longitude,
    race_type: demo.race_type,
    status: demo.status,
    isDemo: true,
    boat_id: demo.boat_id,
    class_id: demo.class_id,
    metadata: {
      ...demo.metadata,
      startTime: demo.startTime,
      weather: demo.weather,
      tide: demo.tide,
      strategy: demo.strategy,
      results: demo.results,
      analysis: demo.analysis,
      checklist: demo.checklist,
    },
  };
}

/**
 * Convert a GuestRace to a list item format
 */
function guestRaceToListItem(guest: GuestRace): GuestRaceListItem {
  return {
    id: guest.id,
    name: guest.name,
    start_date: guest.start_date,
    venue: guest.venue,
    latitude: guest.latitude,
    longitude: guest.longitude,
    race_type: guest.race_type,
    status: 'upcoming',
    isDemo: false,
    isGuestRace: true,
    metadata: guest.metadata,
  };
}

/**
 * Hook for getting races for guest users
 * Returns demo races + any locally stored guest race.
 *
 * The heavy sailing DemoRace objects (Cowes Week, Round the Island) only make
 * sense for the `sail-racing` interest. For any other interest — *and* while
 * the active interest is still loading (slug === undefined) — we return an
 * empty list so we never flash sailing demos into non-sailing interests.
 * Non-sailing interests fall through to the per-interest demo steps in
 * `getDemoTimelineSteps()` (hooks/useRaceListData.ts).
 *
 * @param interestSlug The currently-selected interest slug. Must be
 *                     explicitly `'sail-racing'` to receive the sailing demo
 *                     races — any other value (including null/undefined while
 *                     loading) yields an empty demo list.
 */
export function useGuestRaces(interestSlug?: string | null) {
  const queryClient = useQueryClient();

  // Query for guest race from local storage
  const {
    data: guestRace,
    isLoading: guestRaceLoading,
    refetch: refetchGuestRace,
  } = useQuery({
    queryKey: ['guestRace'],
    queryFn: async () => {
      const race = await GuestStorageService.getGuestRace();
      return race;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Get demo races (these are generated, not fetched).
  // Only include them when the user is *explicitly* on the sailing interest —
  // any other value (including `undefined` during the interest-loading window)
  // yields an empty list so demos never leak across interests.
  const isSailingInterest = interestSlug === 'sail-racing';
  const allDemoRaces = DemoRaceService.getDemoRaces();
  const demoRaces = useMemo(
    () => (isSailingInterest ? allDemoRaces : []),
    [isSailingInterest, allDemoRaces],
  );

  // Combine demo races with guest race
  const sortedRaces = useMemo(() => {
    const allRaces: GuestRaceListItem[] = [
      // Demo races first (empty on non-sailing interests)
      ...demoRaces.map(demoRaceToListItem),
      // Guest race if it exists
      ...(guestRace ? [guestRaceToListItem(guestRace)] : []),
    ];

    // Sort by date (upcoming first, then past)
    return allRaces.sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return dateA - dateB;
    });
  }, [demoRaces, guestRace]);

  // Check if guest has a race
  const hasGuestRace = guestRace !== null && guestRace !== undefined;

  // Refresh function to reload guest race
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['guestRace'] });
    refetchGuestRace();
  }, [queryClient, refetchGuestRace]);

  return useMemo(() => ({
    liveRaces: sortedRaces,
    loading: guestRaceLoading,
    refresh,
    hasGuestRace,
    guestRace,
    demoRaces,
  }), [sortedRaces, guestRaceLoading, refresh, hasGuestRace, guestRace, demoRaces]);
}

/**
 * Check if a race is a demo race
 */
export function isDemoRace(raceId: string): boolean {
  return DemoRaceService.isDemoRace(raceId);
}

/**
 * Get a demo race by ID
 */
export function getDemoRaceById(raceId: string) {
  return DemoRaceService.getDemoRaceById(raceId);
}

export default useGuestRaces;
