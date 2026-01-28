/**
 * WebDrawerProvider - Context for web navigation drawer state
 *
 * Provides open/close/toggle functions for the sidebar drawer on web.
 * Used by TabScreenToolbar (hamburger button) and _layout.tsx (drawer rendering).
 * On native, the drawer is never shown — all functions are no-ops.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Platform } from 'react-native';

interface WebDrawerContextValue {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const WebDrawerContext = createContext<WebDrawerContextValue>({
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
});

export function WebDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(Platform.OS === 'web');

  const openDrawer = useCallback(() => {
    if (Platform.OS === 'web') setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    if (Platform.OS === 'web') setIsDrawerOpen((prev) => !prev);
  }, []);

  return (
    <WebDrawerContext.Provider value={{ isDrawerOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </WebDrawerContext.Provider>
  );
}

export const useWebDrawer = () => useContext(WebDrawerContext);
