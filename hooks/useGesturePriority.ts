/**
 * useGesturePriority Hook
 *
 * Handles horizontal vs vertical gesture detection and priority.
 * Uses a 1.5x ratio to create a diagonal dead zone that prevents
 * accidental axis switching mid-gesture.
 */

import { useCallback, useRef } from 'react';
import { useSharedValue, runOnJS } from 'react-native-reanimated';

import { GESTURE_PRIORITY_RATIO } from '@/constants/navigationAnimations';

// =============================================================================
// TYPES
// =============================================================================

export type GestureDirection = 'none' | 'horizontal' | 'vertical';

export interface GestureState {
  /** Current detected gesture direction */
  direction: GestureDirection;
  /** Whether the gesture direction is locked (committed) */
  isLocked: boolean;
  /** Initial touch X position */
  startX: number;
  /** Initial touch Y position */
  startY: number;
}

export interface UseGesturePriorityReturn {
  /** Current gesture direction (shared value for worklets) */
  gestureDirection: ReturnType<typeof useSharedValue<GestureDirection>>;
  /** Whether gesture is locked (shared value for worklets) */
  isGestureLocked: ReturnType<typeof useSharedValue<boolean>>;
  /**
   * Determines if a gesture is horizontal based on velocities
   * Use in worklets with 'worklet' directive
   */
  isHorizontalGesture: (velocityX: number, velocityY: number) => boolean;
  /**
   * Determines if a gesture is vertical based on velocities
   * Use in worklets with 'worklet' directive
   */
  isVerticalGesture: (velocityX: number, velocityY: number) => boolean;
  /**
   * Updates gesture direction based on velocity
   * Call from gesture handler's onUpdate
   */
  updateGestureDirection: (velocityX: number, velocityY: number) => void;
  /**
   * Locks the current gesture direction (prevents switching axes)
   * Call once gesture has committed to a direction
   */
  lockGesture: () => void;
  /**
   * Unlocks gesture direction (call on gesture end)
   */
  unlockGesture: () => void;
  /**
   * Resets gesture state (call on gesture start)
   */
  resetGesture: () => void;
}

// =============================================================================
// WORKLET FUNCTIONS
// =============================================================================

/**
 * Determines if gesture velocities indicate horizontal movement
 * @worklet
 */
export function isHorizontalGestureWorklet(
  velocityX: number,
  velocityY: number
): boolean {
  'worklet';
  return Math.abs(velocityX) > Math.abs(velocityY) * GESTURE_PRIORITY_RATIO;
}

/**
 * Determines if gesture velocities indicate vertical movement
 * @worklet
 */
export function isVerticalGestureWorklet(
  velocityX: number,
  velocityY: number
): boolean {
  'worklet';
  return Math.abs(velocityY) > Math.abs(velocityX) * GESTURE_PRIORITY_RATIO;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing gesture direction priority
 *
 * Creates a diagonal dead zone where neither horizontal nor vertical
 * gesture is detected, preventing accidental axis switching.
 *
 * @example
 * ```tsx
 * const { isHorizontalGesture, gestureDirection, lockGesture, resetGesture } = useGesturePriority();
 *
 * const panGesture = Gesture.Pan()
 *   .onStart(() => {
 *     resetGesture();
 *   })
 *   .onUpdate((e) => {
 *     if (isHorizontalGesture(e.velocityX, e.velocityY)) {
 *       // Handle horizontal pan
 *     }
 *   })
 *   .onEnd(() => {
 *     resetGesture();
 *   });
 * ```
 */
export function useGesturePriority(): UseGesturePriorityReturn {
  const gestureDirection = useSharedValue<GestureDirection>('none');
  const isGestureLocked = useSharedValue(false);

  // Internal state ref for JS thread callbacks
  const stateRef = useRef<GestureState>({
    direction: 'none',
    isLocked: false,
    startX: 0,
    startY: 0,
  });

  /**
   * Check if gesture is horizontal (usable in worklets)
   */
  const isHorizontalGesture = useCallback(
    (velocityX: number, velocityY: number): boolean => {
      'worklet';
      // If gesture is locked, only return true if locked to horizontal
      if (isGestureLocked.value) {
        return gestureDirection.value === 'horizontal';
      }
      return isHorizontalGestureWorklet(velocityX, velocityY);
    },
    [gestureDirection, isGestureLocked]
  );

  /**
   * Check if gesture is vertical (usable in worklets)
   */
  const isVerticalGesture = useCallback(
    (velocityX: number, velocityY: number): boolean => {
      'worklet';
      // If gesture is locked, only return true if locked to vertical
      if (isGestureLocked.value) {
        return gestureDirection.value === 'vertical';
      }
      return isVerticalGestureWorklet(velocityX, velocityY);
    },
    [gestureDirection, isGestureLocked]
  );

  /**
   * Update gesture direction based on current velocities
   */
  const updateGestureDirection = useCallback(
    (velocityX: number, velocityY: number) => {
      'worklet';
      // Don't update if locked
      if (isGestureLocked.value) return;

      if (isHorizontalGestureWorklet(velocityX, velocityY)) {
        gestureDirection.value = 'horizontal';
      } else if (isVerticalGestureWorklet(velocityX, velocityY)) {
        gestureDirection.value = 'vertical';
      }
      // If neither, remain in current state (or 'none')
    },
    [gestureDirection, isGestureLocked]
  );

  /**
   * Lock the current gesture direction
   */
  const lockGesture = useCallback(() => {
    'worklet';
    isGestureLocked.value = true;
    runOnJS((direction: GestureDirection) => {
      stateRef.current.isLocked = true;
      stateRef.current.direction = direction;
    })(gestureDirection.value);
  }, [gestureDirection, isGestureLocked]);

  /**
   * Unlock gesture direction
   */
  const unlockGesture = useCallback(() => {
    'worklet';
    isGestureLocked.value = false;
    runOnJS(() => {
      stateRef.current.isLocked = false;
    })();
  }, [isGestureLocked]);

  /**
   * Reset gesture state completely
   */
  const resetGesture = useCallback(() => {
    'worklet';
    gestureDirection.value = 'none';
    isGestureLocked.value = false;
    runOnJS(() => {
      stateRef.current = {
        direction: 'none',
        isLocked: false,
        startX: 0,
        startY: 0,
      };
    })();
  }, [gestureDirection, isGestureLocked]);

  return {
    gestureDirection,
    isGestureLocked,
    isHorizontalGesture,
    isVerticalGesture,
    updateGestureDirection,
    lockGesture,
    unlockGesture,
    resetGesture,
  };
}

export default useGesturePriority;
