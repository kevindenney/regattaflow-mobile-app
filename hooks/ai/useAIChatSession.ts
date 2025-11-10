import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/services/supabase';

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_BASE_URL ||
  process.env.EXPO_PUBLIC_WEB_BASE_URL ||
  '';

const buildApiUrl = (path: string) => {
  if (!API_BASE) {
    return path;
  }
  return `${API_BASE.replace(/\/$/, '')}${path}`;
};

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
  optimistic?: boolean;
}

export interface AssistantMetadata {
  suggestedAction: string | null;
  needsHandoff: boolean;
}

export interface UseAIChatSessionOptions {
  clubId: string | null;
  limit?: number;
  autoLoad?: boolean;
}

export interface UseAIChatSessionReturn {
  messages: ChatMessage[];
  loading: boolean;
  isSending: boolean;
  error: string | null;
  assistantMeta: AssistantMetadata | null;
  sendMessage: (message: string) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function useAIChatSession(options: UseAIChatSessionOptions): UseAIChatSessionReturn {
  const { clubId, limit = 40, autoLoad = true } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistantMeta, setAssistantMeta] = useState<AssistantMetadata | null>(null);

  const ready = useMemo(() => !!clubId, [clubId]);

  const mapRowsToMessages = useCallback((rows: any[]): ChatMessage[] => {
    return rows.map((row) => ({
      id: row.id,
      role: row.role === 'assistant' ? 'assistant' : 'user',
      text: row.message,
      createdAt: new Date(row.created_at),
      metadata: row.metadata ?? null,
    }));
  }, []);

  const loadHistory = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!ready) {
        return;
      }

      if (!opts?.silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (!session) {
          throw new Error('You must be signed in to view chat history.');
        }

        const { data, error: queryError } = await supabase
          .from('ai_conversations')
          .select('id, role, message, metadata, created_at')
          .eq('club_id', clubId)
          .order('created_at', { ascending: true })
          .limit(limit);

        if (queryError) {
          throw queryError;
        }

        const history = mapRowsToMessages(data ?? []);
        setMessages(history);

        const lastAssistant = [...history].reverse().find((msg) => msg.role === 'assistant');
        if (lastAssistant) {
          setAssistantMeta({
            suggestedAction: (lastAssistant.metadata as any)?.suggested_action ?? null,
            needsHandoff: Boolean((lastAssistant.metadata as any)?.needs_handoff),
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load chat history';
        setError(message);
      } finally {
        if (!opts?.silent) {
          setLoading(false);
        }
      }
    },
    [clubId, limit, mapRowsToMessages, ready]
  );

  useEffect(() => {
    if (autoLoad && ready) {
      loadHistory().catch((err) => {
        console.error('[useAIChatSession] history load error', err);
      });
    }
  }, [autoLoad, loadHistory, ready]);

  const reset = useCallback(() => {
    setMessages([]);
    setAssistantMeta(null);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const trimmed = rawMessage.trim();
      if (!trimmed) {
        return;
      }

      if (!ready) {
        setError('Club workspace not available yet.');
        return;
      }

      const optimisticMessage: ChatMessage = {
        id: `local-${Date.now()}`,
        role: 'user',
        text: trimmed,
        createdAt: new Date(),
        optimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setIsSending(true);
      setError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (!session?.access_token) {
          throw new Error('You must be signed in to chat with the assistant.');
        }

        const response = await fetch(buildApiUrl('/api/ai/club/support'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ message: trimmed }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Unable to reach Claude assistant');
        }

        setAssistantMeta({
          suggestedAction: payload?.suggested_action ?? null,
          needsHandoff: Boolean(payload?.needs_handoff),
        });

        await loadHistory({ silent: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to send message';
        setError(message);
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      } finally {
        setIsSending(false);
      }
    },
    [loadHistory, ready]
  );

  return {
    messages,
    loading,
    isSending,
    error,
    assistantMeta,
    sendMessage,
    refresh: loadHistory,
    reset,
  };
}
