/**
 * useGuestRaces Hook
 *
 * Provides race data for guest (non-authenticated) users.
 * Combines demo races with any locally stored guest race.
 */

import { useCallback, useEffect, useState } from 'react';
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
 * Returns demo races + any locally stored guest race
 */
export function useGuestRaces() {
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

  // Get demo races (these are generated, not fetched)
  const demoRaces = DemoRaceService.getDemoRaces();

  // Combine demo races with guest race
  const allRaces: GuestRaceListItem[] = [
    // Demo races first
    ...demoRaces.map(demoRaceToListItem),
    // Guest race if it exists
    ...(guestRace ? [guestRaceToListItem(guestRace)] : []),
  ];

  // Sort by date (upcoming first, then past)
  const sortedRaces = allRaces.sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return dateA - dateB;
  });

  // Check if guest has a race
  const hasGuestRace = guestRace !== null && guestRace !== undefined;

  // Refresh function to reload guest race
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['guestRace'] });
    refetchGuestRace();
  }, [queryClient, refetchGuestRace]);

  return {
    liveRaces: sortedRaces,
    loading: guestRaceLoading,
    refresh,
    hasGuestRace,
    guestRace,
    demoRaces,
  };
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
