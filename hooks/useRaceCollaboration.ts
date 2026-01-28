/**
 * useRaceCollaboration Hook
 *
 * Full-featured hook for race collaboration including:
 * - Collaborators list with real-time updates
 * - Messages with real-time chat
 * - Access level checking
 * - Actions (invite, remove, send message)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RaceCollaborationService } from '@/services/RaceCollaborationService';
import {
  RaceCollaborator,
  RaceMessage,
  AccessLevel,
  MessageType,
} from '@/types/raceCollaboration';
import { createLogger } from '@/lib/utils/logger';
import { isUuid } from '@/utils/uuid';
import { supabase } from '@/services/supabase';

const logger = createLogger('useRaceCollaboration');

interface UseRaceCollaborationResult {
  // State
  collaborators: RaceCollaborator[];
  messages: RaceMessage[];
  isLoading: boolean;
  error: Error | null;

  // Access info
  userAccess: AccessLevel | null;
  isOwner: boolean;
  canView: boolean;
  currentCollaboratorId: string | null;

  // Actions
  createInvite: (accessLevel?: AccessLevel, displayName?: string, role?: string) => Promise<string>;
  sendMessage: (message: string, type?: MessageType) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  removeCollaborator: (collaboratorId: string) => Promise<void>;
  updateAccessLevel: (collaboratorId: string, level: AccessLevel) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRaceCollaboration(regattaId: string | null): UseRaceCollaborationResult {
  const [collaborators, setCollaborators] = useState<RaceCollaborator[]>([]);
  const [messages, setMessages] = useState<RaceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userAccess, setUserAccess] = useState<AccessLevel | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [currentCollaboratorId, setCurrentCollaboratorId] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    // Skip for null/undefined or non-UUID regattaIds (e.g., demo-race)
    if (!regattaId || !isUuid(regattaId)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch access first - this determines if user can see anything
      const accessData = await RaceCollaborationService.checkAccess(regattaId);
      setUserAccess(accessData.accessLevel || null);
      setIsOwner(accessData.isOwner);
      setCurrentCollaboratorId(accessData.collaboratorId || null);

      // Then fetch collaborators and messages (these might fail due to RLS if not owner/collaborator)
      const [collaboratorsResult, messagesResult] = await Promise.allSettled([
        RaceCollaborationService.getCollaborators(regattaId),
        RaceCollaborationService.getMessages(regattaId),
      ]);

      if (collaboratorsResult.status === 'fulfilled') {
        setCollaborators(collaboratorsResult.value);
      } else {
        logger.warn('Failed to fetch collaborators:', collaboratorsResult.reason);
        setCollaborators([]);
      }

      if (messagesResult.status === 'fulfilled') {
        setMessages(messagesResult.value);
      } else {
        logger.warn('Failed to fetch messages:', messagesResult.reason);
        setMessages([]);
      }
    } catch (err) {
      logger.error('Failed to fetch collaboration data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setIsLoading(false);
    }
  }, [regattaId]);

  // Initial fetch and subscribe to changes
  useEffect(() => {
    // Skip for null/undefined or non-UUID regattaIds (e.g., demo-race)
    if (!regattaId || !isUuid(regattaId)) return;

    fetchData();

    // Subscribe to real-time changes
    const unsubCollaborators = RaceCollaborationService.subscribeToCollaborators(
      regattaId,
      setCollaborators
    );
    const unsubMessages = RaceCollaborationService.subscribeToMessages(
      regattaId,
      setMessages
    );

    return () => {
      unsubCollaborators();
      unsubMessages();
    };
  }, [regattaId, fetchData]);

  // Actions
  const createInvite = useCallback(
    async (accessLevel: AccessLevel = 'view', displayName?: string, role?: string): Promise<string> => {
      if (!regattaId) throw new Error('No regatta ID');

      const result = await RaceCollaborationService.createInvite(
        regattaId,
        accessLevel,
        displayName,
        role
      );
      return result.inviteCode;
    },
    [regattaId]
  );

  const sendMessage = useCallback(
    async (message: string, type: MessageType = 'text'): Promise<void> => {
      if (!regattaId) throw new Error('No regatta ID');

      // Get current user for optimistic update
      const { data: { user } } = await supabase.auth.getUser();

      // Optimistic: add message to local state immediately
      const optimisticId = `optimistic-${Date.now()}`;
      if (user) {
        const optimisticMessage: RaceMessage = {
          id: optimisticId,
          regattaId,
          userId: user.id,
          message,
          messageType: type,
          createdAt: new Date().toISOString(),
          profile: {
            fullName: user.user_metadata?.full_name || user.email || 'You',
          },
        };
        setMessages((prev) => [...prev, optimisticMessage]);
      }

      try {
        const sentMessage = await RaceCollaborationService.sendMessage(regattaId, message, type);
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? sentMessage : m))
        );
      } catch (err) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        throw err;
      }
    },
    [regattaId]
  );

  const deleteMessage = useCallback(
    async (messageId: string): Promise<void> => {
      // Optimistic: remove from local state immediately
      const removed = messages.find((m) => m.id === messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      try {
        await RaceCollaborationService.deleteMessage(messageId);
      } catch (err) {
        // Restore on failure
        if (removed) {
          setMessages((prev) => {
            const restored = [...prev, removed];
            restored.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return restored;
          });
        }
        throw err;
      }
    },
    [messages]
  );

  const removeCollaborator = useCallback(
    async (collaboratorId: string): Promise<void> => {
      await RaceCollaborationService.removeCollaborator(collaboratorId);
    },
    []
  );

  const updateAccessLevel = useCallback(
    async (collaboratorId: string, level: AccessLevel): Promise<void> => {
      await RaceCollaborationService.updateAccessLevel(collaboratorId, level);
    },
    []
  );

  // Computed values
  const canView = useMemo(
    () => userAccess === 'view' || userAccess === 'full' || isOwner,
    [userAccess, isOwner]
  );

  return {
    // State
    collaborators,
    messages,
    isLoading,
    error,

    // Access info
    userAccess,
    isOwner,
    canView,
    currentCollaboratorId,

    // Actions
    createInvite,
    sendMessage,
    deleteMessage,
    removeCollaborator,
    updateAccessLevel,
    refresh: fetchData,
  };
}
