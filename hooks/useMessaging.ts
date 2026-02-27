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
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useMessaging');

// ---------------------------------------------------------------------------
// useConversations
// ---------------------------------------------------------------------------

export function useConversations(userId?: string) {
  const [conversations, setConversations] = useState<CoachingConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const loadRunIdRef = useRef(0);
  const realtimeRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | undefined>(userId);

  useEffect(() => {
    activeUserIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      loadRunIdRef.current += 1;
      realtimeRunIdRef.current += 1;
    };
  }, []);

  const loadConversations = useCallback(async () => {
    const runId = ++loadRunIdRef.current;
    const canCommit = () => mountedRef.current && runId === loadRunIdRef.current;

    if (!userId) {
      if (!canCommit()) return;
      setConversations([]);
      setError(null);
      setLoading(false);
      return;
    }
    if (!canCommit()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await messagingService.getConversations(userId);
      if (!canCommit()) return;
      setConversations(data);
    } catch (err) {
      logger.error('useConversations error', err);
      if (!canCommit()) return;
      setError(err as Error);
    } finally {
      if (!canCommit()) return;
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadConversations();
    if (!userId) return;
    const runId = ++realtimeRunIdRef.current;
    const targetUserId = userId;
    const canCommit = () =>
      mountedRef.current &&
      runId === realtimeRunIdRef.current &&
      activeUserIdRef.current === targetUserId;

    // Subscribe to conversation changes so badge counts and previews update live
    const channelName = createChannelName('user-conversations', userId);
    const onConversationsPayload = (payload: any) => {
      if (!canCommit()) return;
      const row = payload.new as any;
      if (!row) return;

      // Only care about conversations involving this user
      if (row.coach_id !== targetUserId && row.sailor_id !== targetUserId) return;

      if (payload.eventType === 'INSERT') {
        // Reload to get joined user data
        void loadConversations();
      } else if (payload.eventType === 'UPDATE') {
        // BUG 30: Preserve existing other_user join data — the raw realtime
        // payload doesn't include joined relations, so we merge the
        // scalar fields while keeping the hydrated data from the initial fetch.
        setConversations((prev) =>
          prev
            .map((c) => {
              if (c.id !== row.id) return c;
              // Destructure to exclude joined fields the raw payload won't have
              const { other_user: _other_user, coach_profile: _coach_profile, ...scalarFields } = row;
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
    };

    let subscribed = false;
    try {
      realtimeService.subscribe(
        channelName,
        { table: 'coaching_conversations' },
        onConversationsPayload
      );
      subscribed = true;
    } catch (err) {
      logger.error('Failed to subscribe to coaching_conversations realtime channel', err);
      setError(new Error('Realtime conversation updates unavailable. Pull to refresh.'));
    }

    return () => {
      if (realtimeRunIdRef.current === runId) {
        realtimeRunIdRef.current += 1;
      }
      if (subscribed) {
        void realtimeService.unsubscribe(channelName, onConversationsPayload);
      }
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
  const mountedRef = useRef(true);
  const loadRunIdRef = useRef(0);
  const realtimeRunIdRef = useRef(0);
  const conversationIdRef = useRef<string | undefined>(conversationId);
  const pageSize = 50;

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      loadRunIdRef.current += 1;
      realtimeRunIdRef.current += 1;
    };
  }, []);

  const loadMessages = useCallback(async () => {
    const runId = ++loadRunIdRef.current;
    const canCommit = () => mountedRef.current && runId === loadRunIdRef.current;

    if (!conversationId) {
      if (!canCommit()) return;
      setMessages([]);
      setHasMore(false);
      setError(null);
      setLoading(false);
      return;
    }
    if (!canCommit()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await messagingService.getMessages(conversationId, pageSize);
      if (!canCommit()) return;
      setMessages(data);
      setHasMore(data.length >= pageSize);
    } catch (err) {
      logger.error('useMessages error', err);
      if (!canCommit()) return;
      setError(err as Error);
    } finally {
      if (!canCommit()) return;
      setLoading(false);
    }
  }, [conversationId]);

  const loadEarlier = useCallback(async () => {
    if (!conversationId || messages.length === 0) return;
    const oldest = messages[messages.length - 1];
    const targetConversationId = conversationId;
    try {
      const data = await messagingService.getMessages(conversationId, pageSize, oldest.created_at);
      if (!mountedRef.current || conversationIdRef.current !== targetConversationId) return;
      setMessages((prev) => [...prev, ...data]);
      setHasMore(data.length >= pageSize);
    } catch (err) {
      logger.error('useMessages loadEarlier error', err);
    }
  }, [conversationId, messages]);

  useEffect(() => {
    void loadMessages();
    if (!conversationId) return;
    const runId = ++realtimeRunIdRef.current;
    const targetConversationId = conversationId;
    const canCommit = () =>
      mountedRef.current &&
      runId === realtimeRunIdRef.current &&
      conversationIdRef.current === targetConversationId;

    // Real-time subscription for new messages
    const channelName = createChannelName('conversation-messages', conversationId);
    const onMessagesPayload = (payload: any) => {
      if (!canCommit()) return;
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
    };

    let subscribed = false;
    try {
      realtimeService.subscribe(
        channelName,
        {
          table: 'coaching_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        onMessagesPayload
      );
      subscribed = true;
    } catch (err) {
      logger.error('Failed to subscribe to coaching_messages realtime channel', err);
      setError(new Error('Realtime message updates unavailable. Pull to refresh.'));
    }

    return () => {
      if (realtimeRunIdRef.current === runId) {
        realtimeRunIdRef.current += 1;
      }
      if (subscribed) {
        void realtimeService.unsubscribe(channelName, onMessagesPayload);
      }
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
  const loadRunIdRef = useRef(0);
  const realtimeRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | undefined>(userId);

  useEffect(() => {
    activeUserIdRef.current = userId;
  }, [userId]);

  const loadCount = useCallback(async () => {
    const runId = ++loadRunIdRef.current;
    const targetUserId = userId;
    const canCommit = () =>
      mountedRef.current &&
      runId === loadRunIdRef.current &&
      activeUserIdRef.current === targetUserId;

    if (!userId) {
      if (!canCommit()) return;
      setCount(0);
      return;
    }
    try {
      const total = await messagingService.getUnreadCount(userId);
      if (!canCommit()) return;
      setCount(total);
    } catch (err) {
      logger.error('useUnreadMessageCount error', err);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    if (!userId) {
      setCount(0);
      return;
    }
    const runId = ++realtimeRunIdRef.current;
    const targetUserId = userId;
    const canCommit = () =>
      mountedRef.current &&
      runId === realtimeRunIdRef.current &&
      activeUserIdRef.current === targetUserId;

    void loadCount();

    // Subscribe to conversation changes for this user to catch unread count updates
    const channelName = createChannelName('unread-count', userId);
    const onUnreadPayload = (payload: any) => {
      const row = payload.new as any;
      if (!row) return;
      if (!canCommit()) return;
      if (row.coach_id !== targetUserId && row.sailor_id !== targetUserId) return;
      // Re-compute total from scratch for correctness
      void loadCount();
    };

    let subscribed = false;
    try {
      realtimeService.subscribe(
        channelName,
        { table: 'coaching_conversations' },
        onUnreadPayload
      );
      subscribed = true;
    } catch (err) {
      logger.error('Failed to subscribe to unread count realtime channel', err);
    }

    return () => {
      mountedRef.current = false;
      loadRunIdRef.current += 1;
      if (realtimeRunIdRef.current === runId) {
        realtimeRunIdRef.current += 1;
      }
      if (subscribed) {
        void realtimeService.unsubscribe(channelName, onUnreadPayload);
      }
    };
  }, [userId, loadCount]);

  return count;
}
