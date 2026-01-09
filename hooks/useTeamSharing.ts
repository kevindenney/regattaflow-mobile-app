/**
 * useTeamSharing Hook
 *
 * Fetches and manages team sharing data for pre-race sharing
 * with coach and crew members.
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { crewManagementService, type CrewMember } from '@/services/crewManagementService';
import { createLogger } from '@/lib/utils/logger';
import type { CoachProfile, ShareResult, ShareableContent } from '@/components/sharing/types';

const logger = createLogger('useTeamSharing');

export interface RaceShare {
  id: string;
  raceEventId: string;
  sailorId: string;
  shareType: 'pre_race' | 'post_race' | 'result';
  channel: string;
  recipientId: string;
  recipientType: 'coach' | 'crew';
  sharedAt: string;
}

export interface UseTeamSharingParams {
  sailorId: string;
  raceId: string;
  raceName: string;
  boatClassId?: string;
}

export interface UseTeamSharingResult {
  /** Primary coach from coaching sessions */
  primaryCoach: CoachProfile | null;
  /** Primary crew members */
  primaryCrew: CrewMember[];
  /** Share history for this race */
  shareHistory: RaceShare[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Share with a specific coach */
  shareWithCoach: (content: ShareableContent) => Promise<ShareResult>;
  /** Share with specific crew members */
  shareWithCrew: (crewIds: string[], content: ShareableContent) => Promise<ShareResult[]>;
  /** Share with all (coach + all primary crew) */
  shareWithAll: (content: ShareableContent) => Promise<ShareResult[]>;
  /** Check if a recipient has already been shared with */
  hasSharedWith: (recipientId: string, recipientType: 'coach' | 'crew') => boolean;
  /** Refresh the data */
  refresh: () => Promise<void>;
}

export function useTeamSharing({
  sailorId,
  raceId,
  raceName,
  boatClassId,
}: UseTeamSharingParams): UseTeamSharingResult {
  const [primaryCoach, setPrimaryCoach] = useState<CoachProfile | null>(null);
  const [primaryCrew, setPrimaryCrew] = useState<CrewMember[]>([]);
  const [shareHistory, setShareHistory] = useState<RaceShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load primary coach from coaching sessions
   */
  const loadPrimaryCoach = useCallback(async () => {
    if (!sailorId) return null;

    try {
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          coach_id,
          coach:coach_profiles(
            id,
            user_id,
            display_name,
            is_verified,
            profile_image_url
          )
        `)
        .eq('sailor_id', sailorId)
        .in('status', ['completed', 'confirmed', 'scheduled'])
        .order('scheduled_at', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0 && sessions[0].coach) {
        return sessions[0].coach as unknown as CoachProfile;
      }
      return null;
    } catch (err) {
      logger.error('Failed to load primary coach:', err);
      return null;
    }
  }, [sailorId]);

  /**
   * Load primary crew members
   */
  const loadPrimaryCrew = useCallback(async () => {
    if (!sailorId || !boatClassId) return [];

    try {
      const crew = await crewManagementService.getPrimaryCrew(sailorId, boatClassId);
      return crew;
    } catch (err) {
      logger.error('Failed to load primary crew:', err);
      return [];
    }
  }, [sailorId, boatClassId]);

  /**
   * Load share history for this race
   */
  const loadShareHistory = useCallback(async () => {
    if (!sailorId || !raceId) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('race_shares')
        .select('*')
        .eq('race_event_id', raceId)
        .eq('sailor_id', sailorId)
        .eq('share_type', 'pre_race');

      if (fetchError) {
        throw fetchError;
      }

      return (data || []).map((row) => ({
        id: row.id,
        raceEventId: row.race_event_id,
        sailorId: row.sailor_id,
        shareType: row.share_type,
        channel: row.channel,
        recipientId: row.recipient_id,
        recipientType: row.recipient_type,
        sharedAt: row.shared_at,
      }));
    } catch (err) {
      logger.error('Failed to load share history:', err);
      return [];
    }
  }, [sailorId, raceId]);

  /**
   * Load all data
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [coach, crew, history] = await Promise.all([
        loadPrimaryCoach(),
        loadPrimaryCrew(),
        loadShareHistory(),
      ]);

      setPrimaryCoach(coach);
      setPrimaryCrew(crew);
      setShareHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load team data'));
    } finally {
      setLoading(false);
    }
  }, [loadPrimaryCoach, loadPrimaryCrew, loadShareHistory]);

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  /**
   * Check if a recipient has already been shared with
   */
  const hasSharedWith = useCallback(
    (recipientId: string, recipientType: 'coach' | 'crew') => {
      return shareHistory.some(
        (share) =>
          share.recipientId === recipientId && share.recipientType === recipientType
      );
    },
    [shareHistory]
  );

  /**
   * Record a share in the database
   */
  const recordShare = useCallback(
    async (
      recipientId: string,
      recipientType: 'coach' | 'crew',
      contentSnapshot?: object
    ) => {
      const { error: insertError } = await supabase.from('race_shares').insert({
        race_event_id: raceId,
        sailor_id: sailorId,
        share_type: 'pre_race',
        channel: recipientType,
        recipient_id: recipientId,
        recipient_type: recipientType,
        content_snapshot: contentSnapshot,
      });

      if (insertError) {
        throw insertError;
      }
    },
    [raceId, sailorId]
  );

  /**
   * Create notification for recipient
   */
  const createNotification = useCallback(
    async (recipientUserId: string, recipientName: string) => {
      const { error: notifyError } = await supabase.from('notifications').insert({
        user_id: recipientUserId,
        type: 'strategy_shared',
        title: 'Race Strategy Shared',
        message: `Race prep for ${raceName} has been shared with you`,
        data: {
          race_id: raceId,
          sailor_id: sailorId,
          share_type: 'pre_race',
        },
        read: false,
      });

      if (notifyError) {
        logger.warn('Failed to create notification:', notifyError);
      }
    },
    [raceId, sailorId, raceName]
  );

  /**
   * Share with coach
   */
  const shareWithCoach = useCallback(
    async (content: ShareableContent): Promise<ShareResult> => {
      if (!primaryCoach) {
        return {
          success: false,
          channel: 'coach',
          error: 'No coach connected',
        };
      }

      try {
        // Record the share
        await recordShare(primaryCoach.id, 'coach', content);

        // Create notification if coach has user_id
        if (primaryCoach.user_id) {
          await createNotification(primaryCoach.user_id, primaryCoach.display_name);
        }

        // Update local share history
        setShareHistory((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            raceEventId: raceId,
            sailorId,
            shareType: 'pre_race',
            channel: 'coach',
            recipientId: primaryCoach.id,
            recipientType: 'coach',
            sharedAt: new Date().toISOString(),
          },
        ]);

        const message = `Shared with ${primaryCoach.display_name}!`;
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Shared!', message);
        }

        return {
          success: true,
          channel: 'coach',
          recipientName: primaryCoach.display_name,
        };
      } catch (err) {
        logger.error('Failed to share with coach:', err);
        const errorMessage = 'Failed to share with coach';
        if (Platform.OS === 'web') {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
        return {
          success: false,
          channel: 'coach',
          error: errorMessage,
        };
      }
    },
    [primaryCoach, recordShare, createNotification, raceId, sailorId]
  );

  /**
   * Share with specific crew members
   */
  const shareWithCrew = useCallback(
    async (crewIds: string[], content: ShareableContent): Promise<ShareResult[]> => {
      const results: ShareResult[] = [];

      for (const crewId of crewIds) {
        const crewMember = primaryCrew.find((c) => c.id === crewId);
        if (!crewMember) {
          results.push({
            success: false,
            channel: 'crew',
            error: `Crew member ${crewId} not found`,
          });
          continue;
        }

        try {
          // Record the share
          await recordShare(crewMember.id, 'crew', content);

          // Create notification if crew has userId
          if (crewMember.userId) {
            await createNotification(crewMember.userId, crewMember.name);
          }

          // Update local share history
          setShareHistory((prev) => [
            ...prev,
            {
              id: `temp-${Date.now()}-${crewMember.id}`,
              raceEventId: raceId,
              sailorId,
              shareType: 'pre_race',
              channel: 'crew',
              recipientId: crewMember.id,
              recipientType: 'crew',
              sharedAt: new Date().toISOString(),
            },
          ]);

          results.push({
            success: true,
            channel: 'crew',
            recipientName: crewMember.name,
          });
        } catch (err) {
          logger.error(`Failed to share with crew ${crewMember.name}:`, err);
          results.push({
            success: false,
            channel: 'crew',
            error: `Failed to share with ${crewMember.name}`,
          });
        }
      }

      // Show summary alert
      const successful = results.filter((r) => r.success);
      if (successful.length > 0) {
        const names = successful.map((r) => r.recipientName).join(', ');
        const message = `Shared with ${names}!`;
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Shared!', message);
        }
      }

      return results;
    },
    [primaryCrew, recordShare, createNotification, raceId, sailorId]
  );

  /**
   * Share with all (coach + all primary crew)
   */
  const shareWithAll = useCallback(
    async (content: ShareableContent): Promise<ShareResult[]> => {
      const results: ShareResult[] = [];

      // Share with coach if available
      if (primaryCoach) {
        const coachResult = await shareWithCoach(content);
        results.push(coachResult);
      }

      // Share with all primary crew
      if (primaryCrew.length > 0) {
        const crewIds = primaryCrew.map((c) => c.id);
        const crewResults = await shareWithCrew(crewIds, content);
        results.push(...crewResults);
      }

      return results;
    },
    [primaryCoach, primaryCrew, shareWithCoach, shareWithCrew]
  );

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    primaryCoach,
    primaryCrew,
    shareHistory,
    loading,
    error,
    shareWithCoach,
    shareWithCrew,
    shareWithAll,
    hasSharedWith,
    refresh,
  };
}
