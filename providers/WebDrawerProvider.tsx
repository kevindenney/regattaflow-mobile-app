/**
 * WebDrawerProvider - Context for web navigation drawer state
 *
 * Provides open/close/toggle functions for the sidebar drawer on web.
 * Used by TabScreenToolbar (hamburger button) and _layout.tsx (drawer rendering).
 * On native, the drawer is never shown — all functions are no-ops.
 *
 * Pin functionality: When pinned, the drawer stays open and cannot be collapsed.
 * Defaults to pinned & open on web for persistent sidebar experience.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Platform } from 'react-native';

interface WebDrawerContextValue {
  isDrawerOpen: boolean;
  isPinned: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  togglePin: () => void;
  setIsPinned: (pinned: boolean) => void;
}

const WebDrawerContext = createContext<WebDrawerContextValue>({
  isDrawerOpen: false,
  isPinned: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
  togglePin: () => {},
  setIsPinned: () => {},
});

export function WebDrawerProvider({ children }: { children: React.ReactNode }) {
  // Default to open and pinned on web
  const [isDrawerOpen, setIsDrawerOpen] = useState(Platform.OS === 'web');
  const [isPinned, setIsPinned] = useState(Platform.OS === 'web');

  const openDrawer = useCallback(() => {
    if (Platform.OS === 'web') setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    // Only close if not pinned
    if (!isPinned) {
      setIsDrawerOpen(false);
    }
  }, [isPinned]);

  const toggleDrawer = useCallback(() => {
    if (Platform.OS === 'web') {
      // If pinned and open, unpinning will allow toggle
      // If pinned and trying to close, don't close
      if (isPinned) return;
      setIsDrawerOpen((prev) => !prev);
    }
  }, [isPinned]);

  const togglePin = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsPinned((prev) => {
        const newPinned = !prev;
        // If pinning, ensure drawer is open
        if (newPinned) {
          setIsDrawerOpen(true);
        }
        return newPinned;
      });
    }
  }, []);

  return (
    <WebDrawerContext.Provider
      value={{
        isDrawerOpen,
        isPinned,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        togglePin,
        setIsPinned,
      }}
    >
      {children}
    </WebDrawerContext.Provider>
  );
}

export const useWebDrawer = () => useContext(WebDrawerContext);
