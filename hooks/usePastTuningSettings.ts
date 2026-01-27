/**
 * usePastTuningSettings Hook
 *
 * Fetches the user's most recent race with tuning settings to provide
 * AI-powered suggestions for the current race prep form.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { TuningSettings } from './useRegattaContent';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('usePastTuningSettings');

export interface UsePastTuningSettingsParams {
  /** Current regatta ID to exclude from results */
  excludeRegattaId?: string;
  /** Boat class ID to filter by (for more relevant suggestions) */
  boatClassId?: string;
}

export interface UsePastTuningSettingsReturn {
  /** Past tuning settings if available */
  pastSettings: TuningSettings | null;
  /** Name of the race these settings came from */
  pastRaceName: string | null;
  /** Date of the past race */
  pastRaceDate: string | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Refetch the data */
  refetch: () => Promise<void>;
}

/**
 * Normalizes legacy tuning settings to the new format
 * - Maps `kicker` to `vang`
 * - Maps single `shroud_tension` to both upper/lower if not already split
 */
function normalizeTuningSettings(settings: TuningSettings | null): TuningSettings | null {
  if (!settings) return null;

  const normalized: TuningSettings = { ...settings };

  // Map legacy kicker field to vang
  if (settings.kicker && !settings.vang) {
    normalized.vang = settings.kicker;
  }

  // If we have a single shroud_tension but no split values, suggest it for both
  if (settings.shroud_tension && !settings.upper_shroud_tension && !settings.lower_shroud_tension) {
    // Keep the original value - user can adjust when applying
    normalized.upper_shroud_tension = settings.shroud_tension;
    normalized.lower_shroud_tension = settings.shroud_tension;
  }

  return normalized;
}

/**
 * Hook for fetching the user's most recent race with tuning settings
 */
export function usePastTuningSettings({
  excludeRegattaId,
  boatClassId,
}: UsePastTuningSettingsParams = {}): UsePastTuningSettingsReturn {
  const { user } = useAuth();

  const [pastSettings, setPastSettings] = useState<TuningSettings | null>(null);
  const [pastRaceName, setPastRaceName] = useState<string | null>(null);
  const [pastRaceDate, setPastRaceDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user?.id) {
      setPastSettings(null);
      setPastRaceName(null);
      setPastRaceDate(null);
      return;
    }

    setIsLoading(true);

    try {
      // Build query to find most recent race with tuning settings
      let query = supabase
        .from('regattas')
        .select('id, name, start_date, tuning_settings')
        .eq('created_by', user.id)
        .not('tuning_settings', 'is', null)
        .order('start_date', { ascending: false })
        .limit(5); // Get a few in case the first matches are excluded

      // Exclude current regatta
      if (excludeRegattaId) {
        query = query.neq('id', excludeRegattaId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[usePastTuningSettings] Query error:', error);
        return;
      }

      if (!data || data.length === 0) {
        setPastSettings(null);
        setPastRaceName(null);
        setPastRaceDate(null);
        return;
      }

      // Find the first match with actual tuning content
      let bestMatch = data[0];

      // Check if tuning_settings has any actual content
      const settings = bestMatch.tuning_settings as TuningSettings | null;
      const hasContent = settings && Object.values(settings).some(v => v && String(v).trim());

      if (!hasContent) {
        // Try next match
        const alternateMatch = data.find(
          r => r.id !== bestMatch.id &&
          r.tuning_settings &&
          Object.values(r.tuning_settings as TuningSettings).some(v => v && String(v).trim())
        );

        if (alternateMatch) {
          bestMatch = alternateMatch;
        } else {
          setPastSettings(null);
          setPastRaceName(null);
          setPastRaceDate(null);
          return;
        }
      }

      const normalizedSettings = normalizeTuningSettings(bestMatch.tuning_settings as TuningSettings);
      setPastSettings(normalizedSettings);
      setPastRaceName(bestMatch.name);
      setPastRaceDate(bestMatch.start_date);

      logger.debug('[usePastTuningSettings] Found past settings from:', bestMatch.name);
    } catch (err) {
      logger.error('[usePastTuningSettings] Exception:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, excludeRegattaId]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    pastSettings,
    pastRaceName,
    pastRaceDate,
    isLoading,
    refetch,
  };
}

export default usePastTuningSettings;
