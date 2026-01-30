/**
 * GlobalSearchProvider
 *
 * Provides a shared `openGlobalSearch()` function that navigates to the
 * Search tab for a unified search experience.
 *
 * Previously this opened a modal overlay, but we've consolidated search
 * to the Search Tab for a better, more actionable UX.
 */

import { router } from 'expo-router';
import React, { createContext, useCallback, useContext } from 'react';

interface GlobalSearchContextValue {
  openGlobalSearch: () => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const openGlobalSearch = useCallback(() => {
    // Navigate to the Search Tab instead of opening a modal
    router.push('/search');
  }, []);

  return (
    <GlobalSearchContext.Provider value={{ openGlobalSearch }}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch(): GlobalSearchContextValue {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) {
    throw new Error('useGlobalSearch must be used within a GlobalSearchProvider');
  }
  return ctx;
}
