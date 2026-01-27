/**
 * useRacePresence Hook
 *
 * Tracks which crew members are currently viewing a race detail screen
 * using Supabase Realtime Presence. No DB tables needed — presence is ephemeral.
 *
 * Usage:
 *   const { presentUserIds, isTracking } = useRacePresence({
 *     regattaId: 'some-uuid',
 *     userId: user?.id,
 *     displayName: user?.user_metadata?.full_name,
 *   });
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useRacePresence');

interface PresenceUser {
  userId: string;
  displayName?: string;
  joinedAt: string;
}

interface UseRacePresenceOptions {
  regattaId: string | undefined;
  userId: string | undefined;
  displayName?: string;
  /** Whether presence tracking is enabled (default: true) */
  enabled?: boolean;
}

interface UseRacePresenceReturn {
  /** Set of user IDs currently present on this race */
  presentUserIds: Set<string>;
  /** Full presence state for each user */
  presentUsers: PresenceUser[];
  /** Whether this client is actively tracking */
  isTracking: boolean;
}

export function useRacePresence({
  regattaId,
  userId,
  displayName,
  enabled = true,
}: UseRacePresenceOptions): UseRacePresenceReturn {
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Sync presence state from Supabase channel
  const syncPresence = useCallback((state: Record<string, any[]>) => {
    const users: PresenceUser[] = [];
    for (const presences of Object.values(state)) {
      for (const presence of presences) {
        if (presence.userId) {
          users.push({
            userId: presence.userId,
            displayName: presence.displayName,
            joinedAt: presence.joinedAt || new Date().toISOString(),
          });
        }
      }
    }
    setPresentUsers(users);
  }, []);

  useEffect(() => {
    if (!regattaId || !userId || !enabled) {
      setPresentUsers([]);
      setIsTracking(false);
      return;
    }

    const channelName = `race-presence:${regattaId}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        syncPresence(state);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        logger.info('Presence join:', newPresences?.length);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        logger.info('Presence leave:', leftPresences?.length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId,
            displayName: displayName || 'Unknown',
            joinedAt: new Date().toISOString(),
          });
          setIsTracking(true);
        }
      });

    // Handle app state changes — untrack when backgrounded
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active' && channelRef.current) {
        channelRef.current.track({
          userId,
          displayName: displayName || 'Unknown',
          joinedAt: new Date().toISOString(),
        });
      } else if (state === 'background' && channelRef.current) {
        channelRef.current.untrack();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      subscription.remove();
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsTracking(false);
    };
  }, [regattaId, userId, displayName, enabled, syncPresence]);

  const presentUserIds = new Set(presentUsers.map((u) => u.userId));

  return {
    presentUserIds,
    presentUsers,
    isTracking,
  };
}

export default useRacePresence;
