/**
 * useActivityCatalog — Fetches activity templates for the current interest.
 *
 * Used in the Add Event flow to show templates from followed organizations
 * and coaches above the "Create from scratch" option.
 */

import { useState, useEffect, useCallback } from 'react';
import { useInterest } from '@/providers/InterestProvider';
import { useAuth } from '@/providers/AuthProvider';
import { getCatalogForInterest, enrollInTemplate } from '@/services/activityCatalog';
import type { ActivityTemplate } from '@/types/activities';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useActivityCatalog');

interface UseActivityCatalogResult {
  templates: ActivityTemplate[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  enroll: (template: ActivityTemplate) => Promise<void>;
}

export function useActivityCatalog(eventType?: string): UseActivityCatalogResult {
  const { currentInterest } = useInterest();
  const { user } = useAuth();

  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCatalog = useCallback(async () => {
    if (!currentInterest?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await getCatalogForInterest(currentInterest.id, {
        eventType,
        limit: 20,
      });
      setTemplates(results);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      logger.error('[useActivityCatalog] Fetch error:', e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [currentInterest?.id, eventType]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const enroll = useCallback(
    async (template: ActivityTemplate) => {
      if (!user?.id) return;
      try {
        await enrollInTemplate(user.id, template.id);
        logger.info('[useActivityCatalog] Enrolled in template:', template.id);
      } catch (err) {
        logger.error('[useActivityCatalog] Enroll error:', err);
      }
    },
    [user?.id],
  );

  return {
    templates,
    isLoading,
    error,
    refresh: fetchCatalog,
    enroll,
  };
}

export default useActivityCatalog;
