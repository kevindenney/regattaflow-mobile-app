/**
 * useRaceMessages Hook
 *
 * Fetches race messages and subscribes to realtime updates via Supabase.
 * Combines initial query load with realtime INSERT events for cache-friendly updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  RaceMessage,
  RaceMessageRow,
  rowToRaceMessage,
  MessageType,
} from '@/types/raceCollaboration';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useRaceMessages');

interface UseRaceMessagesOptions {
  regattaId: string | undefined;
  /** Whether to subscribe to realtime updates (default: true) */
  realtime?: boolean;
  /** Initial page size (default: 50) */
  pageSize?: number;
}

interface UseRaceMessagesReturn {
  messages: RaceMessage[];
  isLoading: boolean;
  error: Error | null;
  /** Send a new text message */
  sendMessage: (text: string) => Promise<void>;
  /** Delete a message (own messages only) */
  deleteMessage: (messageId: string) => Promise<void>;
  /** Post a system message (e.g., checklist completion) */
  postSystemMessage: (text: string) => Promise<void>;
  /** Whether a send is in progress */
  isSending: boolean;
  refetch: () => Promise<void>;
}

/**
 * Enrich a message row with profile data
 */
async function enrichWithProfile(msg: RaceMessage): Promise<RaceMessage> {
  if (!msg.userId) return msg;

  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_emoji, avatar_color')
      .eq('id', msg.userId)
      .maybeSingle();

    if (data) {
      return {
        ...msg,
        profile: {
          fullName: data.full_name,
          avatarEmoji: data.avatar_emoji,
          avatarColor: data.avatar_color,
        },
      };
    }
  } catch {
    // Profile enrichment is best-effort
  }

  return msg;
}

export function useRaceMessages({
  regattaId,
  realtime = true,
  pageSize = 50,
}: UseRaceMessagesOptions): UseRaceMessagesReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RaceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const profileCacheRef = useRef<Record<string, RaceMessage['profile']>>({});

  const fetchMessages = useCallback(async () => {
    if (!regattaId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('race_messages')
        .select('*')
        .eq('regatta_id', regattaId)
        .order('created_at', { ascending: true })
        .limit(pageSize);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const rows = (data || []) as RaceMessageRow[];
      const transformed = rows.map(rowToRaceMessage);

      // Batch-load profiles
      const userIds = [...new Set(transformed.map((m) => m.userId))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_emoji, avatar_color')
          .in('id', userIds);

        if (profiles) {
          const map: Record<string, RaceMessage['profile']> = {};
          profiles.forEach((p: any) => {
            map[p.id] = {
              fullName: p.full_name,
              avatarEmoji: p.avatar_emoji,
              avatarColor: p.avatar_color,
            };
          });
          profileCacheRef.current = { ...profileCacheRef.current, ...map };

          transformed.forEach((msg) => {
            if (map[msg.userId]) {
              msg.profile = map[msg.userId];
            }
          });
        }
      }

      setMessages(transformed);
    } catch (err) {
      logger.error('Failed to fetch messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setIsLoading(false);
    }
  }, [regattaId, pageSize]);

  // Initial load
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!regattaId || !realtime) return;

    const channel = supabase
      .channel(`race-messages:${regattaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'race_messages',
          filter: `regatta_id=eq.${regattaId}`,
        },
        async (payload) => {
          const row = payload.new as RaceMessageRow;
          let msg = rowToRaceMessage(row);

          // Try cached profile first, then fetch
          if (profileCacheRef.current[msg.userId]) {
            msg.profile = profileCacheRef.current[msg.userId];
          } else {
            msg = await enrichWithProfile(msg);
            if (msg.profile) {
              profileCacheRef.current[msg.userId] = msg.profile;
            }
          }

          setMessages((prev) => {
            // Avoid duplicates (e.g., from optimistic insert)
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          logger.error('Realtime channel error for race messages');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [regattaId, realtime]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!regattaId || !user?.id || !text.trim()) return;

      setIsSending(true);
      try {
        const { error: insertError } = await supabase
          .from('race_messages')
          .insert({
            regatta_id: regattaId,
            user_id: user.id,
            message: text.trim(),
            message_type: 'text',
          });

        if (insertError) throw new Error(insertError.message);
      } catch (err) {
        logger.error('Failed to send message:', err);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [regattaId, user]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      // Optimistic removal
      const removed = messages.find((m) => m.id === messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      try {
        const { error: deleteError } = await supabase
          .from('race_messages')
          .delete()
          .eq('id', messageId);

        if (deleteError) throw new Error(deleteError.message);
      } catch (err) {
        // Restore on failure
        if (removed) {
          setMessages((prev) => {
            const restored = [...prev, removed];
            restored.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return restored;
          });
        }
        logger.error('Failed to delete message:', err);
        throw err;
      }
    },
    [messages]
  );

  const postSystemMessage = useCallback(
    async (text: string) => {
      if (!regattaId || !user?.id) return;

      try {
        const { error: insertError } = await supabase
          .from('race_messages')
          .insert({
            regatta_id: regattaId,
            user_id: user.id,
            message: text,
            message_type: 'system',
          });

        if (insertError) {
          logger.warn('Failed to post system message:', insertError.message);
        }
      } catch (err) {
        // System messages are best-effort — don't throw
        logger.warn('Failed to post system message:', err);
      }
    },
    [regattaId, user]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    postSystemMessage,
    isSending,
    refetch: fetchMessages,
  };
}

export default useRaceMessages;
