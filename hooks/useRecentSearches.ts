/**
 * useRecentSearches – AsyncStorage-backed recent search queries
 *
 * Stores up to 3 recent searches in LIFO order. Deduplicates on add.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'regattaflow:recent_searches';
const MAX_RECENTS = 3;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setRecentSearches(parsed);
        } catch {
          // ignore corrupted data
        }
      }
    });
  }, []);

  const addRecentSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      setRecentSearches((prev) => {
        const deduped = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
        const next = [trimmed, ...deduped].slice(0, MAX_RECENTS);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recentSearches, addRecentSearch, clearRecent } as const;
}
