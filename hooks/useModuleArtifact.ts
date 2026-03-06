import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { isUuid } from '@/utils/uuid';
import {
  getModuleArtifact,
  upsertModuleArtifact,
  type ModuleArtifactContent,
  type ModuleArtifactEventType,
  type ModuleArtifactRow,
} from '@/services/moduleArtifactService';

const logger = createLogger('useModuleArtifact');

interface UseModuleArtifactParams {
  isEnabled: boolean;
  isOpen: boolean;
  moduleId: string | null;
  eventType: ModuleArtifactEventType | null;
  eventId: string | null;
  userId?: string | null;
  content: ModuleArtifactContent;
  onHydrate: (content: ModuleArtifactContent) => boolean | void;
}

type SaveStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

const SAVE_DEBOUNCE_MS = 900;

interface SaveScope {
  moduleId: string;
  eventType: ModuleArtifactEventType;
  eventId: string;
  userId: string;
}

interface PendingSave {
  scope: SaveScope;
  includeAttachments: boolean;
  frequentSignature: string;
  attachmentsSignature: string;
}

const normalizeContent = (content: Partial<ModuleArtifactContent> | null | undefined): ModuleArtifactContent => {
  const toolValues = content?.toolValues && typeof content.toolValues === 'object'
    ? content.toolValues
    : {};
  const notes = typeof content?.notes === 'string' ? content.notes : '';
  const attachments = Array.isArray(content?.attachments)
    ? content.attachments
      .filter((item) => item && typeof item === 'object')
      .map((item: any) => ({
        id: String(item.id || ''),
        type: String(item.type || 'idea'),
        label: String(item.label || ''),
        ...(item.uri ? { uri: String(item.uri) } : {}),
      }))
      .filter((item) => item.id.length > 0 && item.label.length > 0)
    : [];
  const mappedCompetencyIds = Array.isArray(content?.mappedCompetencyIds)
    ? content.mappedCompetencyIds
      .filter((id) => typeof id === 'string' && id.trim().length > 0)
      .map((id) => id.trim())
    : [];

  const safeToolValues = Object.entries(toolValues).reduce<Record<string,string>>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value;
    }
    return acc;
  }, {});

  return {
    toolValues: safeToolValues,
    notes,
    attachments,
    mappedCompetencyIds,
  };
};

const getScopeKey = (scope: SaveScope | null): string => {
  if (!scope) return '';
  return `${scope.eventType}:${scope.eventId}:${scope.userId}:${scope.moduleId}`;
};

export function useModuleArtifact({
  isEnabled,
  isOpen,
  moduleId,
  eventType,
  eventId,
  userId,
  content,
  onHydrate,
}: UseModuleArtifactParams) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [isLoadReady, setIsLoadReady] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(userId || null);
  const [currentArtifactId, setCurrentArtifactId] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<PendingSave | null>(null);
  const inFlightSaveRef = useRef<Promise<unknown> | null>(null);
  const hydratingRef = useRef(false);

  const lastPersistedFrequentSignatureRef = useRef('');
  const lastPersistedAttachmentsSignatureRef = useRef('');
  const persistedAttachmentsRef = useRef<ModuleArtifactContent['attachments']>([]);

  useEffect(() => {
    setResolvedUserId(userId || null);
  }, [userId]);

  useEffect(() => {
    if (!isEnabled || userId) return;
    let isCancelled = false;

    const resolveUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (isCancelled) return;
      if (error) {
        logger.warn('[useModuleArtifact] Could not resolve auth user for artifact persistence', { error });
        return;
      }
      setResolvedUserId(data.user?.id || null);
    };

    resolveUser();

    return () => {
      isCancelled = true;
    };
  }, [isEnabled, userId]);

  const scope = useMemo<SaveScope | null>(() => {
    if (
      !isEnabled
      || !moduleId
      || !eventType
      || !eventId
      || !resolvedUserId
      || !isUuid(eventId)
      || !isUuid(resolvedUserId)
    ) return null;
    return {
      moduleId,
      eventType,
      eventId,
      userId: resolvedUserId,
    };
  }, [isEnabled, moduleId, eventType, eventId, resolvedUserId]);

  const normalizedContent = useMemo(() => normalizeContent(content), [content]);
  const frequentSignature = useMemo(
    () => JSON.stringify({
      toolValues: normalizedContent.toolValues,
      notes: normalizedContent.notes,
      mappedCompetencyIds: normalizedContent.mappedCompetencyIds || [],
    }),
    [normalizedContent.toolValues, normalizedContent.notes, normalizedContent.mappedCompetencyIds]
  );
  const attachmentsSignature = useMemo(
    () => JSON.stringify(normalizedContent.attachments),
    [normalizedContent.attachments]
  );

  const normalizedContentRef = useRef(normalizedContent);
  const frequentSignatureRef = useRef(frequentSignature);
  const attachmentsSignatureRef = useRef(attachmentsSignature);

  useEffect(() => {
    normalizedContentRef.current = normalizedContent;
  }, [normalizedContent]);

  useEffect(() => {
    frequentSignatureRef.current = frequentSignature;
  }, [frequentSignature]);

  useEffect(() => {
    attachmentsSignatureRef.current = attachmentsSignature;
  }, [attachmentsSignature]);

  const clearPendingTimer = useCallback(() => {
    if (!saveTimeoutRef.current) return;
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = null;
  }, []);

  const buildPayload = useCallback((includeAttachments: boolean): ModuleArtifactContent => {
    const latest = normalizedContentRef.current;
    return {
      toolValues: latest.toolValues,
      notes: latest.notes,
      attachments: includeAttachments
        ? latest.attachments
        : persistedAttachmentsRef.current,
      mappedCompetencyIds: latest.mappedCompetencyIds || [],
    };
  }, []);

  const persistPendingNow = useCallback(async (options?: { ensureSaved?: boolean }): Promise<ModuleArtifactRow | null> => {
    const pending = pendingSaveRef.current;
    if (!pending) {
      if (!options?.ensureSaved || !scope) return null;
      try {
        const upserted = await upsertModuleArtifact(scope, buildPayload(true));
        setCurrentArtifactId(upserted.artifact_id);
        lastPersistedFrequentSignatureRef.current = frequentSignatureRef.current;
        lastPersistedAttachmentsSignatureRef.current = attachmentsSignatureRef.current;
        persistedAttachmentsRef.current = normalizedContentRef.current.attachments;
        setStatus('saved');
        return upserted;
      } catch (error) {
        logger.error('[useModuleArtifact] Failed to ensure saved module artifact', { scope, error });
        setStatus('error');
        return null;
      }
    }

    pendingSaveRef.current = null;
    clearPendingTimer();

    const run = async (): Promise<ModuleArtifactRow> => {
      const latest = normalizedContentRef.current;
      const payload = buildPayload(pending.includeAttachments);
      const upserted = await upsertModuleArtifact(pending.scope, payload);
      setCurrentArtifactId(upserted.artifact_id);

      lastPersistedFrequentSignatureRef.current = pending.frequentSignature;
      if (pending.includeAttachments) {
        persistedAttachmentsRef.current = latest.attachments;
        lastPersistedAttachmentsSignatureRef.current = pending.attachmentsSignature;
      }
      setStatus('saved');
      return upserted;
    };

    const inFlight = (inFlightSaveRef.current || Promise.resolve<ModuleArtifactRow | null>(null))
      .then(() => run())
      .catch((error) => {
        logger.error('[useModuleArtifact] Failed to save module artifact', { scope: pending.scope, error });
        setStatus('error');
        return null;
      })
      .finally(() => {
        if (inFlightSaveRef.current === inFlight) {
          inFlightSaveRef.current = null;
        }
      });

    inFlightSaveRef.current = inFlight;
    return await inFlight;
  }, [buildPayload, clearPendingTimer, scope]);

  const queueSave = useCallback((includeAttachments: boolean) => {
    if (!scope || !isOpen || hydratingRef.current) return;

    const existing = pendingSaveRef.current;
    if (existing && getScopeKey(existing.scope) === getScopeKey(scope)) {
      pendingSaveRef.current = {
        ...existing,
        includeAttachments: existing.includeAttachments || includeAttachments,
        frequentSignature: frequentSignatureRef.current,
        attachmentsSignature: attachmentsSignatureRef.current,
      };
    } else {
      pendingSaveRef.current = {
        scope,
        includeAttachments,
        frequentSignature: frequentSignatureRef.current,
        attachmentsSignature: attachmentsSignatureRef.current,
      };
    }

    setStatus('saving');
    clearPendingTimer();
    saveTimeoutRef.current = setTimeout(() => {
      void persistPendingNow();
    }, SAVE_DEBOUNCE_MS);
  }, [scope, isOpen, clearPendingTimer, persistPendingNow]);

  const scopeKey = useMemo(() => getScopeKey(scope), [scope]);
  const previousScopeKeyRef = useRef(scopeKey);

  useEffect(() => {
    if (!isOpen || !scope) {
      setIsLoadReady(false);
      setCurrentArtifactId(null);
      return;
    }
    setIsLoadReady(false);
    setCurrentArtifactId(null);
  }, [isOpen, scopeKey, scope]);

  useEffect(() => {
    const previousScopeKey = previousScopeKeyRef.current;
    if (previousScopeKey && previousScopeKey !== scopeKey) {
      void persistPendingNow();
    }
    previousScopeKeyRef.current = scopeKey;
  }, [scopeKey, persistPendingNow]);

  useEffect(() => {
    if (!isOpen || !scope) return;

    let isCancelled = false;

    const load = async () => {
      setStatus('loading');
      setIsLoadReady(false);
      try {
        const artifact = await getModuleArtifact(scope);
        if (isCancelled) return;

        if (!artifact?.content) {
          lastPersistedFrequentSignatureRef.current = frequentSignatureRef.current;
          lastPersistedAttachmentsSignatureRef.current = attachmentsSignatureRef.current;
          persistedAttachmentsRef.current = normalizedContentRef.current.attachments;
          setStatus('idle');
          setIsLoadReady(true);
          return;
        }

        const hydratedContent = normalizeContent(artifact.content);
        const hydratedFrequentSignature = JSON.stringify({
          toolValues: hydratedContent.toolValues,
          notes: hydratedContent.notes,
          mappedCompetencyIds: hydratedContent.mappedCompetencyIds || [],
        });
        const hydratedAttachmentsSignature = JSON.stringify(hydratedContent.attachments);

        const shouldHydrate = (() => {
          hydratingRef.current = true;
          try {
            return onHydrate(hydratedContent) !== false;
          } finally {
            setTimeout(() => {
              hydratingRef.current = false;
            }, 0);
          }
        })();

        if (shouldHydrate) {
          lastPersistedFrequentSignatureRef.current = hydratedFrequentSignature;
          lastPersistedAttachmentsSignatureRef.current = hydratedAttachmentsSignature;
          persistedAttachmentsRef.current = hydratedContent.attachments;
          setStatus('saved');
          setCurrentArtifactId(artifact.artifact_id);
        } else {
          setStatus('idle');
          setCurrentArtifactId(artifact.artifact_id);
        }
        setIsLoadReady(true);
      } catch (error) {
        if (!isCancelled) {
          logger.error('[useModuleArtifact] Failed to load module artifact', { scope, error });
          setStatus('error');
          setIsLoadReady(true);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, scope, onHydrate]);

  useEffect(() => {
    if (!isOpen || !scope || !isLoadReady || hydratingRef.current) return;
    if (frequentSignature === lastPersistedFrequentSignatureRef.current) return;
    queueSave(false);
  }, [isOpen, scope, isLoadReady, frequentSignature, queueSave]);

  useEffect(() => {
    if (!isOpen || !scope || !isLoadReady || hydratingRef.current) return;
    if (attachmentsSignature === lastPersistedAttachmentsSignatureRef.current) return;
    queueSave(true);
  }, [isOpen, scope, isLoadReady, attachmentsSignature, queueSave]);

  useEffect(() => {
    return () => {
      clearPendingTimer();
    };
  }, [clearPendingTimer]);

  return {
    saveStatus: status,
    flushPendingSave: persistPendingNow,
    currentArtifactId,
  };
}
