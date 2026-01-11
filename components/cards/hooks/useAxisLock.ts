/**
 * useAxisLock - Gesture Axis Locking Hook
 *
 * Manages gesture axis locking for the 2D card grid:
 * - Locks to horizontal or vertical after 10px movement
 * - Prevents diagonal gestures
 * - 300ms delay before unlocking for next gesture
 *
 * Uses shared values for UI thread performance.
 */

import { useCallback, useRef } from 'react';
import {
  useSharedValue,
  runOnJS,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { GestureAxis, UseAxisLockReturn } from '../types';
import {
  GESTURE_ACTIVE_OFFSET,
  GESTURE_UNLOCK_DELAY,
  AXIS_PRIORITY_RATIO,
} from '../constants';

// =============================================================================
// TYPES
// =============================================================================

interface UseAxisLockOptions {
  /** Distance in pixels before locking axis (default: 10px) */
  lockDistance?: number;
  /** Delay before unlocking for next gesture (default: 300ms) */
  unlockDelay?: number;
  /** Callback when axis is locked */
  onAxisLock?: (axis: 'horizontal' | 'vertical') => void;
  /** Callback when axis is unlocked */
  onAxisUnlock?: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function useAxisLock(options: UseAxisLockOptions = {}): UseAxisLockReturn {
  const {
    lockDistance = GESTURE_ACTIVE_OFFSET,
    unlockDelay = GESTURE_UNLOCK_DELAY,
    onAxisLock,
    onAxisUnlock,
  } = options;

  // Shared value for UI thread access
  const lockedAxis = useSharedValue<GestureAxis>(null);

  // JS thread state for callbacks
  const jsLockedAxis = useRef<GestureAxis>(null);

  // Track if unlock is pending (to prevent rapid lock/unlock)
  const unlockPending = useRef(false);

  /**
   * Update axis lock based on gesture translation
   * Called from pan gesture handler
   */
  const updateLock = useCallback(
    (translationX: number, translationY: number) => {
      'worklet';
      // Skip if already locked
      if (lockedAxis.value !== null) {
        return;
      }

      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);

      // Check if we've moved enough to lock
      const totalDistance = Math.max(absX, absY);
      if (totalDistance < lockDistance) {
        return;
      }

      // Determine axis based on dominant direction with priority ratio
      let axis: 'horizontal' | 'vertical';
      if (absX > absY * AXIS_PRIORITY_RATIO) {
        axis = 'horizontal';
      } else if (absY > absX * AXIS_PRIORITY_RATIO) {
        axis = 'vertical';
      } else {
        // If close to diagonal, prefer horizontal (more common in timeline)
        axis = absX >= absY ? 'horizontal' : 'vertical';
      }

      // Lock the axis
      lockedAxis.value = axis;

      // Notify JS thread
      if (onAxisLock) {
        runOnJS(onAxisLock)(axis);
      }
    },
    [lockDistance, onAxisLock, lockedAxis]
  );

  /**
   * Release the axis lock
   * Called when gesture ends
   */
  const releaseLock = useCallback(() => {
    'worklet';
    if (lockedAxis.value === null) {
      return;
    }

    // Mark unlock as pending
    runOnJS(() => {
      unlockPending.current = true;
    })();

    // Delay unlock to prevent rapid axis switching
    lockedAxis.value = withDelay(
      unlockDelay,
      withTiming(null as unknown as number, { duration: 0 }, () => {
        'worklet';
        // Note: This is a workaround for setting to null
        // The actual null assignment happens via direct assignment
      })
    );

    // Actually set to null after delay
    setTimeout(() => {
      lockedAxis.value = null;
      jsLockedAxis.current = null;
      unlockPending.current = false;

      if (onAxisUnlock) {
        onAxisUnlock();
      }
    }, unlockDelay);
  }, [unlockDelay, onAxisUnlock, lockedAxis]);

  /**
   * Check if axis is currently locked (worklet safe)
   */
  const isLocked = useCallback(() => {
    'worklet';
    return lockedAxis.value !== null;
  }, [lockedAxis]);

  /**
   * Get current locked axis (JS thread)
   */
  const getLockedAxis = useCallback((): GestureAxis => {
    return jsLockedAxis.current;
  }, []);

  // Sync shared value to JS ref for callbacks
  // Note: This is handled via the onAxisLock callback

  return {
    lockedAxis,
    updateLock,
    releaseLock,
    isLocked,
    getLockedAxis,
  };
}

export default useAxisLock;
