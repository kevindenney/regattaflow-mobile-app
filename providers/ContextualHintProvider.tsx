/**
 * ContextualHintProvider — React context for the hint queue system.
 *
 * Only one hint is visible at a time. When a hint is dismissed, the next
 * highest-priority hint in the queue is shown after a short delay (500ms).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ContextualHintStorageService } from '@/services/onboarding/ContextualHintStorageService';
import type { HintId } from '@/lib/contextual-hints';

interface HintRequest {
  id: HintId;
  priority: number;
}

interface ContextualHintContextValue {
  /** Is a specific hint currently visible on screen? */
  isHintVisible: (id: HintId) => boolean;
  /** Has the hint been permanently dismissed? */
  isHintDismissed: (id: HintId) => boolean;
  /** Dismiss a hint (persists to storage). */
  dismissHint: (id: HintId) => void;
  /** Request a hint to be shown. Queued by priority. */
  requestHint: (id: HintId, priority: number) => void;
  /** Cancel a pending hint request (e.g. component unmounted). */
  cancelHintRequest: (id: HintId) => void;
  /** Whether the service has finished loading from storage. */
  isLoaded: boolean;
}

const ContextualHintContext = createContext<ContextualHintContextValue>({
  isHintVisible: () => false,
  isHintDismissed: () => false,
  dismissHint: () => {},
  requestHint: () => {},
  cancelHintRequest: () => {},
  isLoaded: false,
});

export function ContextualHintProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dismissedSet, setDismissedSet] = useState<Set<string>>(new Set());
  const [activeHintId, setActiveHintId] = useState<HintId | null>(null);
  const queueRef = useRef<HintRequest[]>([]);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    let mounted = true;
    ContextualHintStorageService.loadHints().then((state) => {
      if (!mounted) return;
      setDismissedSet(new Set(Object.keys(state.dismissed).filter((k) => state.dismissed[k])));
      setIsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Pick the next hint from the queue whenever active hint is null
  const pickNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      setActiveHintId(null);
      return;
    }
    // Sort by priority (lower = higher)
    queueRef.current.sort((a, b) => a.priority - b.priority);
    setActiveHintId(queueRef.current[0].id);
  }, []);

  const requestHint = useCallback(
    (id: HintId, priority: number) => {
      // Don't add if already dismissed
      if (dismissedSet.has(id)) return;
      // Don't add duplicates
      if (queueRef.current.some((r) => r.id === id)) return;

      queueRef.current.push({ id, priority });

      // If nothing is active, pick immediately
      if (!activeHintId) {
        pickNext();
      }
    },
    [dismissedSet, activeHintId, pickNext],
  );

  const cancelHintRequest = useCallback(
    (id: HintId) => {
      queueRef.current = queueRef.current.filter((r) => r.id !== id);
      if (activeHintId === id) {
        setActiveHintId(null);
        // Schedule next hint after delay
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = setTimeout(pickNext, 500);
      }
    },
    [activeHintId, pickNext],
  );

  const dismissHint = useCallback(
    (id: HintId) => {
      // Remove from queue
      queueRef.current = queueRef.current.filter((r) => r.id !== id);

      // Persist
      ContextualHintStorageService.dismissHint(id);
      setDismissedSet((prev) => new Set([...prev, id]));

      // Clear active and schedule next
      if (activeHintId === id) {
        setActiveHintId(null);
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = setTimeout(pickNext, 500);
      }
    },
    [activeHintId, pickNext],
  );

  const isHintVisible = useCallback(
    (id: HintId) => activeHintId === id,
    [activeHintId],
  );

  const isHintDismissedFn = useCallback(
    (id: HintId) => dismissedSet.has(id),
    [dismissedSet],
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  return (
    <ContextualHintContext.Provider
      value={{
        isHintVisible,
        isHintDismissed: isHintDismissedFn,
        dismissHint,
        requestHint,
        cancelHintRequest,
        isLoaded,
      }}
    >
      {children}
    </ContextualHintContext.Provider>
  );
}

export function useContextualHints() {
  return useContext(ContextualHintContext);
}
