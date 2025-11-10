import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { resolveRaceContext } from '@/services/ai/ContextResolvers';
import { buildRaceCommsPrompt } from '@/services/ai/PromptBuilder';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useRaceBriefSync');

interface RaceBriefData {
  id?: string;
  name?: string;
  series?: string;
  venue?: string;
  startTime?: string;
  warningSignal?: string;
  cleanRegatta?: boolean;
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
  };
  weatherSummary?: string;
  tideSummary?: string;
  lastUpdated?: string;
}

interface UseRaceBriefSyncOptions {
  raceEventId: string | null;
  raceBrief: RaceBriefData | null;
  enabled?: boolean;
}

interface UseRaceBriefSyncReturn {
  /**
   * Get AI context for the current race with all preparation data
   */
  getAIContext: (updateType?: string) => Promise<{
    system: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } | null>;

  /**
   * Check if the race brief has been updated recently
   */
  isStale: boolean;

  /**
   * Manually refresh the AI context
   */
  refreshContext: () => Promise<void>;
}

/**
 * Hook to sync race brief data between hero UI and AI chat
 * This ensures the AI always has the latest race context for conversations
 */
export function useRaceBriefSync({
  raceEventId,
  raceBrief,
  enabled = true,
}: UseRaceBriefSyncOptions): UseRaceBriefSyncReturn {
  const { user } = useAuth();
  const lastSyncRef = useRef<string | null>(null);
  const contextCacheRef = useRef<any>(null);

  // Check if race brief is stale (older than 5 minutes)
  const isStale = useCallback(() => {
    if (!raceBrief?.lastUpdated) return false;

    const lastUpdate = new Date(raceBrief.lastUpdated).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return now - lastUpdate > fiveMinutes;
  }, [raceBrief?.lastUpdated]);

  /**
   * Get AI context with full race preparation data
   */
  const getAIContext = useCallback(async (updateType: string = 'general') => {
    if (!raceEventId || !user?.id || !enabled) {
      logger.debug('Cannot get AI context: missing required data');
      return null;
    }

    try {
      // Use cached context if available and race brief hasn't changed
      const briefKey = JSON.stringify(raceBrief);
      if (contextCacheRef.current && lastSyncRef.current === briefKey) {
        logger.debug('Using cached AI context');
        return buildRaceCommsPrompt(contextCacheRef.current, updateType);
      }

      // Fetch full race context with sailor preparation
      logger.info('Fetching AI context for race:', raceEventId);
      const context = await resolveRaceContext(supabase, raceEventId, user.id);

      // Cache the context
      contextCacheRef.current = context;
      lastSyncRef.current = briefKey;

      // Build the prompt with context
      return buildRaceCommsPrompt(context, updateType);
    } catch (error) {
      logger.error('Failed to get AI context:', error);
      return null;
    }
  }, [raceEventId, user?.id, enabled]);

  /**
   * Refresh the AI context by invalidating cache
   */
  const refreshContext = useCallback(async () => {
    logger.info('Refreshing AI context');
    contextCacheRef.current = null;
    lastSyncRef.current = null;
    await getAIContext();
  }, [getAIContext]);

  // Auto-refresh when race brief changes significantly
  useEffect(() => {
    if (!enabled || !raceBrief) return;

    const briefKey = JSON.stringify(raceBrief);
    if (lastSyncRef.current !== briefKey) {
      logger.debug('Race brief changed, invalidating cache');
      contextCacheRef.current = null;
    }
  }, [enabled, raceBrief]);

  return {
    getAIContext,
    isStale: isStale(),
    refreshContext,
  };
}

/**
 * Helper hook to prepare race brief for chat context
 * This is useful for passing to chat components
 */
export function useRaceBriefForChat(raceEventId: string | null, raceBrief: RaceBriefData | null) {
  const { getAIContext, isStale } = useRaceBriefSync({
    raceEventId,
    raceBrief,
    enabled: true,
  });

  const getChatContext = useCallback(async () => {
    const context = await getAIContext('chat');

    if (!context) {
      return {
        system: 'You are a helpful sailing race assistant.',
        messages: [],
      };
    }

    return context;
  }, [getAIContext]);

  const getContextSummary = useCallback(() => {
    if (!raceBrief) return null;

    const parts = [
      raceBrief.name,
      raceBrief.series,
      raceBrief.venue,
    ].filter(Boolean);

    if (raceBrief.weatherSummary) {
      parts.push(`Weather: ${raceBrief.weatherSummary}`);
    }

    if (raceBrief.countdown) {
      const { days, hours, minutes } = raceBrief.countdown;
      if (days > 0) {
        parts.push(`${days}d ${hours}h until start`);
      } else if (hours > 0) {
        parts.push(`${hours}h ${minutes}m until start`);
      } else {
        parts.push(`${minutes}m until start`);
      }
    }

    return parts.join(' • ');
  }, [raceBrief?.name, raceBrief?.series, raceBrief?.venue, raceBrief?.weatherSummary, raceBrief?.countdown]);

  return {
    getChatContext,
    getContextSummary,
    isStale,
  };
}
