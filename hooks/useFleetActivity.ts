/**
 * useFleetActivity Hook
 *
 * Fetches race activity from fleet mates automatically (auto-surface).
 * Fleet mates' race prep and results appear without requiring explicit follow.
 *
 * Discovery Mode: Inner Circle (Auto-Surface)
 * - Fleet members' upcoming race prep
 * - Tuning notes and strategy
 * - Recent results and post-race analysis
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { CrewFinderService, FleetWithMembers } from '@/services/CrewFinderService';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useFleetActivity');

/**
 * Race content shared by a fleet mate
 */
export interface FleetMateRace {
  id: string;
  name: string;
  startDate: string;
  venue?: string;
  userId: string;
  userName: string;
  avatarEmoji?: string;
  avatarColor?: string;
  // Content fields
  prepNotes?: string;
  tuningSettings?: Record<string, unknown>;
  postRaceNotes?: string;
  lessonsLearned?: string[];
  // Metadata
  isPast: boolean;
  daysUntil: number;
}

/**
 * Fleet activity grouped by fleet
 */
export interface FleetActivityGroup {
  fleetId: string;
  fleetName: string;
  boatClassName?: string;
  memberCount: number;
  races: FleetMateRace[];
}

/**
 * Hook return type
 */
export interface UseFleetActivityResult {
  /** Activity grouped by fleet */
  fleetActivity: FleetActivityGroup[];
  /** All races flattened and sorted by date */
  allFleetRaces: FleetMateRace[];
  /** Upcoming races only */
  upcomingRaces: FleetMateRace[];
  /** Past races with content */
  pastRacesWithContent: FleetMateRace[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Total count of races from fleet mates */
  totalRaceCount: number;
}

/**
 * Hook to fetch fleet mates' race activity automatically
 */
export function useFleetActivity(): UseFleetActivityResult {
  const { user, isGuest } = useAuth();
  const [fleets, setFleets] = useState<FleetWithMembers[]>([]);
  const [fleetRaces, setFleetRaces] = useState<Map<string, FleetMateRace[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);

  const userId = user?.id;

  useEffect(() => {
    activeUserIdRef.current = userId ?? null;
  }, [userId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  // Fetch fleet mates and their races
  const fetchFleetActivity = useCallback(async () => {
    const runId = ++fetchRunIdRef.current;
    const targetUserId = userId ?? null;
    const canCommit = () =>
      isMountedRef.current &&
      runId === fetchRunIdRef.current &&
      activeUserIdRef.current === targetUserId;

    if (!targetUserId || isGuest) {
      if (!canCommit()) return;
      setFleets([]);
      setFleetRaces(new Map());
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!canCommit()) return;
    setIsLoading(true);
    setError(null);

    try {
      logger.info('[useFleetActivity] Fetching fleet mates...');

      // Step 1: Get user's fleets with members
      const userFleets = await CrewFinderService.getFleetMatesForUser(targetUserId);
      if (!canCommit()) return;
      setFleets(userFleets);

      if (userFleets.length === 0) {
        logger.info('[useFleetActivity] User has no fleets');
        if (!canCommit()) return;
        setFleetRaces(new Map());
        setIsLoading(false);
        return;
      }

      // Step 2: Get all fleet mate user IDs
      const fleetMateIds = new Set<string>();
      const memberInfoMap = new Map<string, { name: string; emoji?: string; color?: string; fleetId: string }>();

      userFleets.forEach((fleet) => {
        fleet.members.forEach((member) => {
          fleetMateIds.add(member.userId);
          memberInfoMap.set(member.userId, {
            name: member.fullName,
            emoji: member.avatarEmoji,
            color: member.avatarColor,
            fleetId: fleet.id,
          });
        });
      });

      if (fleetMateIds.size === 0) {
        logger.info('[useFleetActivity] No fleet mates found');
        if (!canCommit()) return;
        setFleetRaces(new Map());
        setIsLoading(false);
        return;
      }

      // Step 3: Filter fleet mates by their sharing setting
      // Only show content from users who have allow_follower_sharing = true
      const { data: sharingProfiles, error: sharingError } = await supabase
        .from('sailor_profiles')
        .select('user_id')
        .in('user_id', Array.from(fleetMateIds))
        .eq('allow_follower_sharing', true);

      if (sharingError) {
        logger.warn('[useFleetActivity] Error fetching sharing profiles:', sharingError);
        // Continue with all fleet mates if there's an error (graceful degradation)
      }

      // Use only fleet mates who have sharing enabled
      const sharingUserIds = sharingProfiles
        ? sharingProfiles.map((p: { user_id: string }) => p.user_id)
        : Array.from(fleetMateIds); // Fallback to all if query fails

      if (sharingUserIds.length === 0) {
        logger.info('[useFleetActivity] No fleet mates with sharing enabled');
        if (!canCommit()) return;
        setFleetRaces(new Map());
        setIsLoading(false);
        return;
      }

      // Step 4: Fetch races from fleet mates who allow sharing
      // Get races from last 30 days and all future races
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: races, error: racesError } = await supabase
        .from('regattas')
        .select('*')
        .in('created_by', sharingUserIds)
        .gte('start_date', thirtyDaysAgo.toISOString())
        .order('start_date', { ascending: true });

      if (racesError) {
        throw racesError;
      }

      // Step 5: Transform and group races
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const racesByFleet = new Map<string, FleetMateRace[]>();

      (races || []).forEach((race: any) => {
        const memberInfo = memberInfoMap.get(race.created_by);
        if (!memberInfo) return;

        const startDate = new Date(race.start_date);
        const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const fleetRace: FleetMateRace = {
          id: race.id,
          name: race.name,
          startDate: race.start_date,
          venue: race.venue,
          userId: race.created_by,
          userName: memberInfo.name,
          avatarEmoji: memberInfo.emoji,
          avatarColor: memberInfo.color,
          prepNotes: race.prep_notes,
          tuningSettings: race.tuning_settings,
          postRaceNotes: race.post_race_notes,
          lessonsLearned: race.lessons_learned,
          isPast: daysUntil < 0,
          daysUntil,
        };

        // Group by fleet
        if (!racesByFleet.has(memberInfo.fleetId)) {
          racesByFleet.set(memberInfo.fleetId, []);
        }
        racesByFleet.get(memberInfo.fleetId)!.push(fleetRace);
      });

      if (!canCommit()) return;
      setFleetRaces(racesByFleet);
      logger.info('[useFleetActivity] Fetched activity:', {
        fleetCount: userFleets.length,
        totalRaces: races?.length || 0,
      });
    } catch (err: any) {
      logger.error('[useFleetActivity] Error:', err);
      if (!canCommit()) return;
      setError(err?.message || 'Failed to load fleet activity');
    } finally {
      if (!canCommit()) return;
      setIsLoading(false);
    }
  }, [userId, isGuest]);

  // Initial fetch
  useEffect(() => {
    fetchFleetActivity();
  }, [fetchFleetActivity]);

  // Build grouped activity
  const fleetActivity: FleetActivityGroup[] = useMemo(() => {
    return fleets.map((fleet) => ({
      fleetId: fleet.id,
      fleetName: fleet.name,
      boatClassName: fleet.boatClassName,
      memberCount: fleet.memberCount,
      races: fleetRaces.get(fleet.id) || [],
    }));
  }, [fleets, fleetRaces]);

  // Flatten all races
  const allFleetRaces: FleetMateRace[] = useMemo(() => {
    const all: FleetMateRace[] = [];
    fleetRaces.forEach((races) => all.push(...races));
    return all.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [fleetRaces]);

  // Filter upcoming
  const upcomingRaces = useMemo(() => {
    return allFleetRaces.filter((r) => !r.isPast);
  }, [allFleetRaces]);

  // Filter past with content
  const pastRacesWithContent = useMemo(() => {
    return allFleetRaces.filter((r) => r.isPast && (r.postRaceNotes || r.lessonsLearned?.length));
  }, [allFleetRaces]);

  return {
    fleetActivity,
    allFleetRaces,
    upcomingRaces,
    pastRacesWithContent,
    isLoading,
    error,
    refresh: fetchFleetActivity,
    totalRaceCount: allFleetRaces.length,
  };
}

export default useFleetActivity;
