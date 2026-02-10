/**
 * useContextualHint — Consumer hook for individual hint components.
 *
 * Handles delay, conditional display, and auto-requesting on mount.
 */

import { useEffect, useRef, useMemo } from 'react';
import { useContextualHints } from '@/providers/ContextualHintProvider';
import { HINT_DEFAULT_PRIORITIES, type HintId } from '@/lib/contextual-hints';

interface UseContextualHintOptions {
  /** Priority override (lower = higher). Falls back to HINT_DEFAULT_PRIORITIES. */
  priority?: number;
  /** Delay in ms before requesting the hint (default 800). */
  delay?: number;
  /** Only request when this condition is true. */
  condition?: boolean;
  /** Automatically request on mount when condition is met (default true). */
  autoRequestOnMount?: boolean;
}

interface UseContextualHintReturn {
  /** Whether this hint is currently the visible one. */
  isVisible: boolean;
  /** Whether this hint has been permanently dismissed. */
  isDismissed: boolean;
  /** Dismiss this hint. */
  dismiss: () => void;
  /** Whether hint storage is still loading. */
  isLoading: boolean;
}

export function useContextualHint(
  hintId: HintId,
  options: UseContextualHintOptions = {},
): UseContextualHintReturn {
  const {
    priority,
    delay = 800,
    condition = true,
    autoRequestOnMount = true,
  } = options;

  const {
    isHintVisible,
    isHintDismissed,
    dismissHint,
    requestHint,
    cancelHintRequest,
    isLoaded,
  } = useContextualHints();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectivePriority = priority ?? HINT_DEFAULT_PRIORITIES[hintId] ?? 10;

  // Auto-request on mount with delay
  useEffect(() => {
    if (!autoRequestOnMount || !isLoaded || !condition) return;
    if (isHintDismissed(hintId)) return;

    timerRef.current = setTimeout(() => {
      requestHint(hintId, effectivePriority);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelHintRequest(hintId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, condition, hintId]);

  return useMemo(
    () => ({
      isVisible: isHintVisible(hintId),
      isDismissed: isHintDismissed(hintId),
      dismiss: () => dismissHint(hintId),
      isLoading: !isLoaded,
    }),
    [isHintVisible, isHintDismissed, dismissHint, hintId, isLoaded],
  );
}
