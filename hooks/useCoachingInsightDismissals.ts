/**
 * useCoachingInsightDismissals
 *
 * Manages dismissal tracking for coaching insight cards.
 * Dismissed insights are hidden for 14 days.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISSAL_STORAGE_KEY = '@regattaflow/coaching-insight-dismissals';
const DISMISSAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

interface DismissalRecord {
  [insightId: string]: number; // timestamp when dismissed
}

export function useCoachingInsightDismissals() {
  const [dismissals, setDismissals] = useState<DismissalRecord>({});
  const [loaded, setLoaded] = useState(false);

  // Load dismissals from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(DISMISSAL_STORAGE_KEY).then((value) => {
      if (value) {
        try {
          const parsed = JSON.parse(value);
          // Clean up expired dismissals
          const now = Date.now();
          const cleaned: DismissalRecord = {};
          Object.entries(parsed).forEach(([id, timestamp]) => {
            if (now - (timestamp as number) < DISMISSAL_DURATION_MS) {
              cleaned[id] = timestamp as number;
            }
          });
          setDismissals(cleaned);
        } catch {
          // Ignore parse errors
        }
      }
      setLoaded(true);
    });
  }, []);

  // Check if an insight is dismissed
  const isDismissed = useCallback(
    (insightId: string): boolean => {
      const dismissedAt = dismissals[insightId];
      if (!dismissedAt) return false;
      return Date.now() - dismissedAt < DISMISSAL_DURATION_MS;
    },
    [dismissals]
  );

  // Dismiss an insight
  const dismiss = useCallback(
    async (insightId: string) => {
      const updated = {
        ...dismissals,
        [insightId]: Date.now(),
      };
      setDismissals(updated);
      await AsyncStorage.setItem(DISMISSAL_STORAGE_KEY, JSON.stringify(updated));
    },
    [dismissals]
  );

  // Filter out dismissed insights from a list
  const filterDismissed = useCallback(
    <T extends { insightId: string }>(insights: T[]): T[] => {
      return insights.filter((insight) => !isDismissed(insight.insightId));
    },
    [isDismissed]
  );

  return {
    isDismissed,
    dismiss,
    filterDismissed,
    loaded,
  };
}
