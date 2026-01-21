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

      await RaceCollaborationService.sendMessage(regattaId, message, type);
    },
    [regattaId]
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
    removeCollaborator,
    updateAccessLevel,
    refresh: fetchData,
  };
}
