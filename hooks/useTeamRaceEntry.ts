/**
 * useTeamRaceEntry Hook
 *
 * Manages team race entries for collaboration.
 * Provides real-time sync of team members and state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { teamRaceEntryService } from '@/services/TeamRaceEntryService';
import {
  TeamRaceEntry,
  TeamRaceEntryMember,
  CreateTeamEntryInput,
  JoinTeamInput,
} from '@/types/teamRacing';
import type { RaceType } from '@/types/raceEvents';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useTeamRaceEntry');

interface UseTeamRaceEntryOptions {
  raceEventId: string;
  raceType: RaceType;
}

interface UseTeamRaceEntryReturn {
  // State
  teamEntry: TeamRaceEntry | null;
  members: TeamRaceEntryMember[];
  isLoading: boolean;
  isCreating: boolean;
  isJoining: boolean;
  error: Error | null;

  // Computed
  isTeamRace: boolean;
  isTeamMember: boolean;
  isTeamCreator: boolean;
  inviteCode: string | null;
  inviteLink: string | null;

  // Actions
  createTeamEntry: (teamName: string) => Promise<TeamRaceEntry>;
  generateInviteCode: () => Promise<string>;
  joinTeam: (input: JoinTeamInput) => Promise<void>;
  leaveTeam: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage team race entries and collaboration
 */
export function useTeamRaceEntry({
  raceEventId,
  raceType,
}: UseTeamRaceEntryOptions): UseTeamRaceEntryReturn {
  const { user } = useAuth();

  // State
  const [teamEntry, setTeamEntry] = useState<TeamRaceEntry | null>(null);
  const [members, setMembers] = useState<TeamRaceEntryMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Only active for team racing
  const isTeamRace = raceType === 'team';

  // Computed values
  const isTeamMember = useMemo(() => {
    if (!user?.id || !teamEntry) return false;
    return members.some((m) => m.userId === user.id);
  }, [user, teamEntry, members]);

  const isTeamCreator = useMemo(() => {
    if (!user?.id || !teamEntry) return false;
    return teamEntry.createdBy === user.id;
  }, [user, teamEntry]);

  const inviteCode = teamEntry?.inviteCode || null;

  const inviteLink = useMemo(() => {
    if (!inviteCode) return null;
    // Use deep link format for mobile
    return `regattaflow://join-team?code=${inviteCode}`;
  }, [inviteCode]);

  /**
   * Load team entry for this race
   */
  const loadTeamEntry = useCallback(async () => {
    if (!raceEventId || !isTeamRace) {
      setTeamEntry(null);
      setMembers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const entry = await teamRaceEntryService.getTeamEntryForRace(raceEventId);
      setTeamEntry(entry);

      if (entry) {
        const teamMembers = await teamRaceEntryService.getTeamMembers(entry.id);
        setMembers(teamMembers);
      } else {
        setMembers([]);
      }
    } catch (err) {
      logger.error('Failed to load team entry:', err);
      setError(err instanceof Error ? err : new Error('Failed to load team entry'));
    } finally {
      setIsLoading(false);
    }
  }, [raceEventId, isTeamRace]);

  /**
   * Create a new team entry
   */
  const createTeamEntry = useCallback(
    async (teamName: string): Promise<TeamRaceEntry> => {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      try {
        setIsCreating(true);
        setError(null);

        const entry = await teamRaceEntryService.createTeamEntry({
          raceEventId,
          teamName,
        });

        setTeamEntry(entry);

        // Load members (creator is auto-added)
        const teamMembers = await teamRaceEntryService.getTeamMembers(entry.id);
        setMembers(teamMembers);

        logger.info('Created team entry', { entryId: entry.id });
        return entry;
      } catch (err) {
        logger.error('Failed to create team entry:', err);
        setError(err instanceof Error ? err : new Error('Failed to create team'));
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [raceEventId, user]
  );

  /**
   * Generate invite code for teammates
   */
  const generateInviteCode = useCallback(async (): Promise<string> => {
    if (!teamEntry) {
      throw new Error('No team entry');
    }

    try {
      const code = await teamRaceEntryService.generateInviteCode(teamEntry.id);
      setTeamEntry((prev) => (prev ? { ...prev, inviteCode: code } : null));
      return code;
    } catch (err) {
      logger.error('Failed to generate invite code:', err);
      throw err;
    }
  }, [teamEntry]);

  /**
   * Join a team via invite code
   */
  const joinTeam = useCallback(
    async (input: JoinTeamInput): Promise<void> => {
      try {
        setIsJoining(true);
        setError(null);

        await teamRaceEntryService.joinTeam(input);

        // Reload to get updated entry and members
        await loadTeamEntry();

        logger.info('Joined team', { inviteCode: input.inviteCode });
      } catch (err) {
        logger.error('Failed to join team:', err);
        setError(err instanceof Error ? err : new Error('Failed to join team'));
        throw err;
      } finally {
        setIsJoining(false);
      }
    },
    [loadTeamEntry]
  );

  /**
   * Leave the team
   */
  const leaveTeam = useCallback(async (): Promise<void> => {
    if (!teamEntry) {
      throw new Error('Not in a team');
    }

    try {
      await teamRaceEntryService.leaveTeam(teamEntry.id);
      setTeamEntry(null);
      setMembers([]);
      logger.info('Left team', { entryId: teamEntry.id });
    } catch (err) {
      logger.error('Failed to leave team:', err);
      throw err;
    }
  }, [teamEntry]);

  /**
   * Refresh team data
   */
  const refresh = useCallback(async (): Promise<void> => {
    await loadTeamEntry();
  }, [loadTeamEntry]);

  // Load team entry on mount and when race changes
  useEffect(() => {
    loadTeamEntry();
  }, [loadTeamEntry]);

  // Subscribe to member changes when we have a team entry
  useEffect(() => {
    if (!teamEntry) return;

    const unsubscribe = teamRaceEntryService.subscribeToMemberChanges(
      teamEntry.id,
      (updatedMembers) => {
        setMembers(updatedMembers);
      }
    );

    return unsubscribe;
  }, [teamEntry?.id]);

  return {
    // State
    teamEntry,
    members,
    isLoading,
    isCreating,
    isJoining,
    error,

    // Computed
    isTeamRace,
    isTeamMember,
    isTeamCreator,
    inviteCode,
    inviteLink,

    // Actions
    createTeamEntry,
    generateInviteCode,
    joinTeam,
    leaveTeam,
    refresh,
  };
}

export default useTeamRaceEntry;
