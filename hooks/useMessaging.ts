/**
 * Messaging Hooks
 *
 * Real-time hooks for the coaching messaging system:
 * - useConversations     — live conversation list for the inbox
 * - useMessages          — paginated messages with real-time inserts
 * - useUnreadMessageCount — badge count with real-time updates
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createChannelName, realtimeService } from '@/services/RealtimeService';
import {
  messagingService,
  type CoachingConversation,
  type CoachingMessage,
} from '@/services/MessagingService';

// ---------------------------------------------------------------------------
// useConversations
// ---------------------------------------------------------------------------

export function useConversations(userId?: string) {
  const [conversations, setConversations] = useState<CoachingConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConversations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await messagingService.getConversations(userId);
      setConversations(data);
    } catch (err) {
      console.error('[useConversations] Error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    loadConversations();

    // Subscribe to conversation changes so badge counts and previews update live
    const channelName = createChannelName('user-conversations', userId);

    realtimeService.subscribe(
      channelName,
      { table: 'coaching_conversations' },
      (payload) => {
        const row = payload.new as any;
        if (!row) return;

        // Only care about conversations involving this user
        if (row.coach_id !== userId && row.sailor_id !== userId) return;

        if (payload.eventType === 'INSERT') {
          // Reload to get joined user data
          loadConversations();
        } else if (payload.eventType === 'UPDATE') {
          // BUG 30: Preserve existing other_user join data — the raw realtime
          // payload doesn't include joined relations, so we merge the
          // scalar fields while keeping the hydrated data from the initial fetch.
          setConversations((prev) =>
            prev
              .map((c) => {
                if (c.id !== row.id) return c;
                // Destructure to exclude joined fields the raw payload won't have
                const { other_user, coach_profile, ...scalarFields } = row;
                return { ...c, ...scalarFields };
              })
              .sort((a, b) => {
                const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                return bTime - aTime;
              })
          );
        } else if (payload.eventType === 'DELETE') {
          setConversations((prev) => prev.filter((c) => c.id !== (payload.old as any).id));
        }
      }
    );

    return () => {
      realtimeService.unsubscribe(channelName);
    };
  }, [userId, loadConversations]);

  return { conversations, loading, error, refresh: loadConversations };
}

// ---------------------------------------------------------------------------
// useMessages
// ---------------------------------------------------------------------------

export function useMessages(conversationId?: string) {
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const pageSize = 50;

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await messagingService.getMessages(conversationId, pageSize);
      setMessages(data);
      setHasMore(data.length >= pageSize);
    } catch (err) {
      console.error('[useMessages] Error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const loadEarlier = useCallback(async () => {
    if (!conversationId || messages.length === 0) return;
    const oldest = messages[messages.length - 1];
    try {
      const data = await messagingService.getMessages(conversationId, pageSize, oldest.created_at);
      setMessages((prev) => [...prev, ...data]);
      setHasMore(data.length >= pageSize);
    } catch (err) {
      console.error('[useMessages] loadEarlier error:', err);
    }
  }, [conversationId, messages]);

  useEffect(() => {
    if (!conversationId) return;

    loadMessages();

    // Real-time subscription for new messages
    const channelName = createChannelName('conversation-messages', conversationId);

    realtimeService.subscribe(
      channelName,
      {
        table: 'coaching_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as CoachingMessage;
          setMessages((prev) => {
            // Avoid duplicates (in case we sent the message ourselves)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [newMsg, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          // Handles read_at updates
          setMessages((prev) =>
            prev.map((m) => (m.id === (payload.new as any).id ? (payload.new as CoachingMessage) : m))
          );
        }
      }
    );

    return () => {
      realtimeService.unsubscribe(channelName);
    };
  }, [conversationId, loadMessages]);

  return { messages, loading, hasMore, error, loadEarlier, refresh: loadMessages };
}

// ---------------------------------------------------------------------------
// useUnreadMessageCount
// ---------------------------------------------------------------------------

export function useUnreadMessageCount(userId?: string) {
  const [count, setCount] = useState(0);
  const mountedRef = useRef(true);

  const loadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const total = await messagingService.getUnreadCount(userId);
      if (mountedRef.current) setCount(total);
    } catch (err) {
      console.error('[useUnreadMessageCount] Error:', err);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    if (!userId) return;

    loadCount();

    // Subscribe to conversation changes for this user to catch unread count updates
    const channelName = createChannelName('unread-count', userId);

    realtimeService.subscribe(
      channelName,
      { table: 'coaching_conversations' },
      (payload) => {
        const row = payload.new as any;
        if (!row) return;
        if (row.coach_id !== userId && row.sailor_id !== userId) return;
        // Re-compute total from scratch for correctness
        loadCount();
      }
    );

    return () => {
      mountedRef.current = false;
      realtimeService.unsubscribe(channelName);
    };
  }, [userId, loadCount]);

  return count;
}
