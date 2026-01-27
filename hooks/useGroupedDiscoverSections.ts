/**
 * useGroupedDiscoverSections Hook
 *
 * Orchestrates multiple data sources into SectionList-compatible sections
 * for the grouped discover/sailors list view.
 *
 * Sections:
 * - Following: Races from followed users (hidden when 0 follows)
 * - Fleet Activity: Races from fleet mates (collapsed by default)
 * - Class Experts: Top performers in user's boat class (collapsed by default)
 * - Discover: Public races for discovery (always visible, infinite scroll)
 */

import { useCallback, useMemo, useState } from 'react';
import { useDiscoveryFeed } from '@/hooks/useDiscoveryFeed';
import { useFleetActivity, type FleetMateRace } from '@/hooks/useFleetActivity';
import { useClassExperts, useUserBoatClass, type ClassExpert } from '@/hooks/useClassExperts';
import type { PublicRacePreview } from '@/services/CrewFinderService';
import type { SailorRaceRowData } from '@/components/discover/SailorRaceRow';

// =============================================================================
// TYPES
// =============================================================================

export type SectionKey = 'following' | 'fleet' | 'experts' | 'discover';

export interface EmptyStateConfig {
  message: string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface DiscoverSection {
  key: SectionKey;
  title: string;
  data: SailorRaceRowData[] | ClassExpert[];
  count: number;
  emptyMessage?: string;
  emptyState?: EmptyStateConfig;
  /** First 3 items for peek preview when collapsed */
  peekItems?: (SailorRaceRowData | ClassExpert)[];
  /** Contextual reason label: "Because you sail a Laser", etc. */
  reasonLabel?: string;
}

export interface UseGroupedDiscoverSectionsResult {
  sections: DiscoverSection[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  isLoadingMore: boolean;
  toggleFollow: (userId: string) => Promise<void>;
  toggleExpertFollow: (userId: string) => Promise<void>;
  collapsedSections: Record<SectionKey, boolean>;
  toggleSectionCollapsed: (key: SectionKey) => void;
  className: string | null;
  /** Dismiss a race from the discover feed (not interested) */
  dismissRace: (raceId: string) => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function publicRaceToRowData(race: PublicRacePreview): SailorRaceRowData {
  return {
    id: race.id,
    name: race.name,
    startDate: race.startDate,
    venue: race.venue,
    userId: race.userId,
    userName: race.userName,
    avatarEmoji: race.avatarEmoji,
    avatarColor: race.avatarColor,
    boatClass: race.boatClass,
    hasPrepNotes: race.hasPrepNotes,
    hasTuning: race.hasTuning,
    hasPostRaceNotes: race.hasPostRaceNotes,
    hasLessons: race.hasLessons,
    isPast: race.isPast,
    daysUntil: race.daysUntil,
    isFollowing: race.isFollowing,
  };
}

function fleetRaceToRowData(race: FleetMateRace): SailorRaceRowData {
  return {
    id: race.id,
    name: race.name,
    startDate: race.startDate,
    venue: race.venue,
    userId: race.userId,
    userName: race.userName,
    avatarEmoji: race.avatarEmoji,
    avatarColor: race.avatarColor,
    hasPrepNotes: !!race.prepNotes,
    hasTuning: !!race.tuningSettings,
    hasPostRaceNotes: !!race.postRaceNotes,
    hasLessons: !!(race.lessonsLearned && race.lessonsLearned.length > 0),
    isPast: race.isPast,
    daysUntil: race.daysUntil,
  };
}

// =============================================================================
// HOOK
// =============================================================================

export function useGroupedDiscoverSections(): UseGroupedDiscoverSectionsResult {
  const discoveryFeed = useDiscoveryFeed();
  const fleetActivity = useFleetActivity();
  const { classId, className } = useUserBoatClass();
  const classExperts = useClassExperts({ classId: classId || undefined, enabled: !!classId });

  // Collapse state — following expanded, fleet and experts collapsed
  const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
    following: false,
    fleet: true,
    experts: true,
    discover: false,
  });

  // Dismissed race IDs — "not interested" feedback for recommendations
  const [dismissedRaceIds, setDismissedRaceIds] = useState<Set<string>>(new Set());

  const toggleSectionCollapsed = useCallback((key: SectionKey) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const dismissRace = useCallback((raceId: string) => {
    setDismissedRaceIds((prev) => {
      const next = new Set(prev);
      next.add(raceId);
      return next;
    });
  }, []);

  // Deduplicate race IDs across sections
  const sections: DiscoverSection[] = useMemo(() => {
    const seenRaceIds = new Set<string>();
    const result: DiscoverSection[] = [];

    // 1. Following section
    if (discoveryFeed.followingCount > 0) {
      const followingRows = discoveryFeed.followingRaces
        .filter((r) => {
          if (seenRaceIds.has(r.id)) return false;
          seenRaceIds.add(r.id);
          return true;
        })
        .map(publicRaceToRowData);

      result.push({
        key: 'following',
        title: 'Following',
        data: followingRows,
        count: followingRows.length,
        reasonLabel: 'From sailors you follow',
        peekItems: followingRows.slice(0, 3),
      });
    }

    // 2. Fleet Activity section
    const fleetRows = fleetActivity.allFleetRaces
      .filter((r) => {
        if (seenRaceIds.has(r.id)) return false;
        seenRaceIds.add(r.id);
        return true;
      })
      .map(fleetRaceToRowData);

    result.push({
      key: 'fleet',
      title: 'Fleet Activity',
      data: fleetRows,
      count: fleetRows.length,
      emptyMessage: 'Join a fleet to see activity',
      emptyState: {
        message: 'Join a fleet to see sailing mates',
        actionLabel: 'Browse Fleets',
        actionRoute: '/(tabs)/fleets',
      },
      peekItems: fleetRows.slice(0, 3),
      reasonLabel: 'Based on your fleet membership',
    });

    // 3. Class Experts section
    result.push({
      key: 'experts',
      title: 'Class Experts',
      data: classExperts.experts,
      count: classExperts.experts.length,
      emptyMessage: 'Set your boat class to find experts',
      emptyState: {
        message: 'Set your boat class to find top sailors',
        actionLabel: 'Set Boat Class',
        actionRoute: '/account/boat-setup',
      },
      peekItems: classExperts.experts.slice(0, 3),
      reasonLabel: className ? `Because you sail a ${className}` : 'Based on your boat class',
    });

    // 4. Discover section — filter out dismissed races
    const discoverRows = discoveryFeed.discoveryRaces
      .filter((r) => {
        if (seenRaceIds.has(r.id)) return false;
        if (dismissedRaceIds.has(r.id)) return false;
        seenRaceIds.add(r.id);
        return true;
      })
      .map(publicRaceToRowData);

    result.push({
      key: 'discover',
      title: 'Discover',
      data: discoverRows,
      count: discoverRows.length,
    });

    return result;
  }, [
    discoveryFeed.followingCount,
    discoveryFeed.followingRaces,
    discoveryFeed.discoveryRaces,
    fleetActivity.allFleetRaces,
    classExperts.experts,
    dismissedRaceIds,
    className,
  ]);

  // Combined loading state
  const isLoading =
    discoveryFeed.isLoading || fleetActivity.isLoading || classExperts.isLoading;

  // Parallel refresh — depend on the stable .refresh methods, not the full hook objects
  const discoveryRefresh = discoveryFeed.refresh;
  const fleetRefresh = fleetActivity.refresh;
  const expertsRefresh = classExperts.refresh;

  const refresh = useCallback(async () => {
    await Promise.all([
      discoveryRefresh(),
      fleetRefresh(),
      expertsRefresh(),
    ]);
  }, [discoveryRefresh, fleetRefresh, expertsRefresh]);

  return {
    sections,
    isLoading,
    refresh,
    loadMore: discoveryFeed.loadMore,
    isLoadingMore: discoveryFeed.isLoadingMore,
    toggleFollow: discoveryFeed.toggleFollow,
    toggleExpertFollow: classExperts.toggleFollow,
    collapsedSections,
    toggleSectionCollapsed,
    className,
    dismissRace,
  };
}

export default useGroupedDiscoverSections;
