/**
 * GlobalSearchProvider
 *
 * Provides a shared `openGlobalSearch()` function so any tab screen
 * can trigger the full-screen search overlay without owning the state.
 */

import GlobalSearchOverlay from '@/components/search/GlobalSearchOverlay';
import React, { createContext, useCallback, useContext, useState } from 'react';

interface GlobalSearchContextValue {
  openGlobalSearch: () => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  const openGlobalSearch = useCallback(() => {
    setVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <GlobalSearchContext.Provider value={{ openGlobalSearch }}>
      {children}
      <GlobalSearchOverlay visible={visible} onClose={handleClose} />
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
