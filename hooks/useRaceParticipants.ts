/**
 * useRaceParticipants Hook
 *
 * Discovers other sailors preparing for the same race using fuzzy matching.
 * Matches on race name + date (±1 day) to find participants.
 *
 * Discovery Mode: Race Participant Discovery
 * - Shows "8 others prepping for Mid-Winters"
 * - View other entrants' prep notes and strategies
 * - Post-race: see everyone's analysis in one place
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useRaceParticipants');

/**
 * Participant info with their shared content
 */
export interface RaceParticipant {
  regattaId: string;
  userId: string;
  userName: string;
  avatarEmoji?: string;
  avatarColor?: string;
  hasPrepNotes: boolean;
  hasPostRaceNotes: boolean;
  contentVisibility: 'fleet' | 'public';
  // Content (loaded on demand)
  prepNotes?: string;
  tuningSettings?: Record<string, unknown>;
  postRaceNotes?: string;
  lessonsLearned?: string[];
}

/**
 * Hook options
 */
export interface UseRaceParticipantsOptions {
  /** Race name for fuzzy matching */
  raceName?: string;
  /** Race date for matching (YYYY-MM-DD) */
  raceDate?: string;
  /** Optional venue for stricter matching */
  venue?: string;
  /** Whether to auto-fetch on mount */
  enabled?: boolean;
}

/**
 * Hook return type
 */
export interface UseRaceParticipantsResult {
  /** Participants found */
  participants: RaceParticipant[];
  /** Count of participants */
  participantCount: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Load full content for a participant */
  loadParticipantContent: (participantRegattaId: string) => Promise<void>;
  /** Participants with prep notes */
  participantsWithPrep: RaceParticipant[];
  /** Participants with post-race notes */
  participantsWithAnalysis: RaceParticipant[];
}

/**
 * Hook to discover other sailors preparing for the same race
 */
export function useRaceParticipants(
  options: UseRaceParticipantsOptions = {}
): UseRaceParticipantsResult {
  const { raceName, raceDate, venue, enabled = true } = options;
  const { user, isGuest } = useAuth();
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  // Fetch participants using fuzzy matching
  const fetchParticipants = useCallback(async () => {
    if (!enabled || !raceName || !raceDate || isGuest) {
      setParticipants([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('[useRaceParticipants] Finding participants for:', { raceName, raceDate, venue });

      // Call the database function for fuzzy matching
      const { data, error: rpcError } = await supabase.rpc('find_race_participants', {
        race_name: raceName,
        race_date: raceDate,
        race_venue: venue || null,
        exclude_user_id: userId || null,
      });

      if (rpcError) {
        throw rpcError;
      }

      const foundParticipants: RaceParticipant[] = (data || []).map((p: any) => ({
        regattaId: p.regatta_id,
        userId: p.user_id,
        userName: p.user_name,
        avatarEmoji: p.avatar_emoji,
        avatarColor: p.avatar_color,
        hasPrepNotes: p.has_prep_notes,
        hasPostRaceNotes: p.has_post_race_notes,
        contentVisibility: p.content_visibility,
      }));

      setParticipants(foundParticipants);
      logger.info('[useRaceParticipants] Found participants:', foundParticipants.length);
    } catch (err: any) {
      logger.error('[useRaceParticipants] Error:', err);
      setError(err?.message || 'Failed to find participants');
      setParticipants([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, raceName, raceDate, venue, userId, isGuest]);

  // Load full content for a specific participant
  const loadParticipantContent = useCallback(async (participantRegattaId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('regattas')
        .select('prep_notes, tuning_settings, post_race_notes, lessons_learned')
        .eq('id', participantRegattaId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Update participant with content
      setParticipants((prev) =>
        prev.map((p) =>
          p.regattaId === participantRegattaId
            ? {
                ...p,
                prepNotes: data.prep_notes,
                tuningSettings: data.tuning_settings,
                postRaceNotes: data.post_race_notes,
                lessonsLearned: data.lessons_learned,
              }
            : p
        )
      );

      logger.info('[useRaceParticipants] Loaded content for:', participantRegattaId);
    } catch (err: any) {
      logger.error('[useRaceParticipants] Error loading content:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Filter participants with specific content
  const participantsWithPrep = useMemo(() => {
    return participants.filter((p) => p.hasPrepNotes);
  }, [participants]);

  const participantsWithAnalysis = useMemo(() => {
    return participants.filter((p) => p.hasPostRaceNotes);
  }, [participants]);

  return {
    participants,
    participantCount: participants.length,
    isLoading,
    error,
    refresh: fetchParticipants,
    loadParticipantContent,
    participantsWithPrep,
    participantsWithAnalysis,
  };
}

export default useRaceParticipants;
