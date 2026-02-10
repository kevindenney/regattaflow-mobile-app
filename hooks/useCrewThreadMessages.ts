/**
 * useCrewThreadMessages Hook
 *
 * Fetches crew thread messages and subscribes to realtime updates via Supabase.
 * Combines initial query load with realtime INSERT events for cache-friendly updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  CrewThreadService,
  CrewThreadMessage,
} from '@/services/CrewThreadService';
import { createLogger } from '@/lib/utils/logger';
import { CREW_THREADS_QUERY_KEY, CREW_THREAD_UNREAD_COUNT_KEY } from './useCrewThreads';

const logger = createLogger('useCrewThreadMessages');

/**
 * Validates if a string is a valid UUID format
 */
const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

interface UseCrewThreadMessagesOptions {
  threadId: string | undefined;
  /** Whether to subscribe to realtime updates (default: true) */
  realtime?: boolean;
  /** Initial page size (default: 50) */
  pageSize?: number;
  /** Auto mark as read when viewing (default: true) */
  autoMarkRead?: boolean;
}

interface UseCrewThreadMessagesReturn {
  messages: CrewThreadMessage[];
  isLoading: boolean;
  error: Error | null;
  /** Send a new text message */
  sendMessage: (text: string) => Promise<void>;
  /** Delete a message (own messages only) */
  deleteMessage: (messageId: string) => Promise<void>;
  /** Post a system message */
  postSystemMessage: (text: string) => Promise<void>;
  /** Whether a send is in progress */
  isSending: boolean;
  refetch: () => Promise<void>;
  /** Mark thread as read */
  markAsRead: () => Promise<void>;
  /** Whether there are more older messages to load */
  hasMore: boolean;
  /** Whether older messages are being loaded */
  isLoadingMore: boolean;
  /** Load older messages (for pagination) */
  loadMore: () => Promise<void>;
}

/**
 * Enrich a message row with profile data
 */
async function enrichWithProfile(msg: CrewThreadMessage): Promise<CrewThreadMessage> {
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

export function useCrewThreadMessages({
  threadId,
  realtime = true,
  pageSize = 50,
  autoMarkRead = true,
}: UseCrewThreadMessagesOptions): UseCrewThreadMessagesReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<CrewThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const profileCacheRef = useRef<Record<string, CrewThreadMessage['profile']>>({});

  const fetchMessages = useCallback(async () => {
    if (!threadId || !isValidUUID(threadId)) {
      setMessages([]);
      setIsLoading(false);
      setHasMore(false);
      return;
    }

    try {
      setError(null);
      const fetchedMessages = await CrewThreadService.getMessages(threadId, {
        limit: pageSize,
      });

      // Cache profiles
      fetchedMessages.forEach((msg) => {
        if (msg.profile) {
          profileCacheRef.current[msg.userId] = msg.profile;
        }
      });

      setMessages(fetchedMessages);
      // If we got fewer messages than pageSize, there are no more older messages
      setHasMore(fetchedMessages.length >= pageSize);
    } catch (err) {
      logger.error('Failed to fetch messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setIsLoading(false);
    }
  }, [threadId, pageSize]);

  // Initial load
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Mark as read on mount (if autoMarkRead)
  useEffect(() => {
    if (threadId && autoMarkRead && user?.id) {
      CrewThreadService.markAsRead(threadId).then(() => {
        // Invalidate unread count
        queryClient.invalidateQueries({ queryKey: [CREW_THREAD_UNREAD_COUNT_KEY] });
        queryClient.invalidateQueries({ queryKey: [CREW_THREADS_QUERY_KEY] });
      });
    }
  }, [threadId, autoMarkRead, user?.id, queryClient]);

  // Realtime subscription
  useEffect(() => {
    if (!threadId || !realtime || !isValidUUID(threadId)) return;

    const channel = supabase
      .channel(`crew-thread-messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crew_thread_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          const row = payload.new as any;
          let msg: CrewThreadMessage = {
            id: row.id,
            threadId: row.thread_id,
            userId: row.user_id,
            message: row.message,
            messageType: row.message_type,
            createdAt: row.created_at,
            profile: null,
          };

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
            // Avoid duplicates
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          // Mark as read if it's not from current user
          if (autoMarkRead && msg.userId !== user?.id) {
            CrewThreadService.markAsRead(threadId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'crew_thread_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          logger.error('Realtime channel error for crew thread messages');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, realtime, user?.id, autoMarkRead]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!threadId || !user?.id || !text.trim()) return;

      setIsSending(true);
      try {
        const newMessage = await CrewThreadService.sendMessage(threadId, text.trim());
        if (!newMessage) {
          throw new Error('Failed to send message');
        }
        // Add message to local state immediately (realtime will deduplicate)
        if (newMessage.profile) {
          profileCacheRef.current[newMessage.userId] = newMessage.profile;
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      } catch (err) {
        logger.error('Failed to send message:', err);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [threadId, user]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      // Optimistic removal
      const removed = messages.find((m) => m.id === messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      try {
        const success = await CrewThreadService.deleteMessage(messageId);
        if (!success) throw new Error('Failed to delete message');
      } catch (err) {
        // Restore on failure
        if (removed) {
          setMessages((prev) => {
            const restored = [...prev, removed];
            restored.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
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
      if (!threadId || !user?.id) return;

      try {
        await CrewThreadService.sendMessage(threadId, text, 'system');
      } catch (err) {
        // System messages are best-effort
        logger.warn('Failed to post system message:', err);
      }
    },
    [threadId, user]
  );

  const markAsRead = useCallback(async () => {
    if (!threadId) return;
    await CrewThreadService.markAsRead(threadId);
    queryClient.invalidateQueries({ queryKey: [CREW_THREAD_UNREAD_COUNT_KEY] });
    queryClient.invalidateQueries({ queryKey: [CREW_THREADS_QUERY_KEY] });
  }, [threadId, queryClient]);

  const loadMore = useCallback(async () => {
    if (!threadId || !hasMore || isLoadingMore || messages.length === 0) return;

    // Get the oldest message's createdAt as the cursor
    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setIsLoadingMore(true);
    try {
      const olderMessages = await CrewThreadService.getMessages(threadId, {
        limit: pageSize,
        before: oldestMessage.createdAt,
      });

      // Cache profiles from older messages
      olderMessages.forEach((msg) => {
        if (msg.profile) {
          profileCacheRef.current[msg.userId] = msg.profile;
        }
      });

      if (olderMessages.length > 0) {
        // Prepend older messages to the beginning
        setMessages((prev) => [...olderMessages, ...prev]);
      }

      // If we got fewer than pageSize, no more messages to load
      setHasMore(olderMessages.length >= pageSize);
    } catch (err) {
      logger.error('Failed to load more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [threadId, hasMore, isLoadingMore, messages, pageSize]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    postSystemMessage,
    isSending,
    refetch: fetchMessages,
    markAsRead,
    hasMore,
    isLoadingMore,
    loadMore,
  };
}

export default useCrewThreadMessages;
