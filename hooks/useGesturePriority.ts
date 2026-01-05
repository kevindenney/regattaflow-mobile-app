/**
 * useGesturePriority Hook
 *
 * Handles horizontal vs vertical gesture detection and priority.
 * Uses a 1.5x ratio to create a diagonal dead zone that prevents
 * accidental axis switching mid-gesture.
 */

import { useCallback, useRef } from 'react';
import { useSharedValue, runOnJS } from 'react-native-reanimated';

import {
  GESTURE_PRIORITY_RATIO,
  GESTURE_LOCK_DISTANCE,
  GESTURE_UNLOCK_DELAY,
} from '@/constants/navigationAnimations';

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
  /** Timestamp when gesture was locked */
  lockedAt: number;
}

export interface UseGesturePriorityOptions {
  /** Callback when gesture axis is locked (for visual feedback) */
  onGestureAxisLock?: (direction: GestureDirection) => void;
  /** Callback when gesture is unlocked */
  onGestureUnlock?: () => void;
}

export interface UseGesturePriorityReturn {
  /** Current gesture direction (shared value for worklets) */
  gestureDirection: ReturnType<typeof useSharedValue<GestureDirection>>;
  /** Whether gesture is locked (shared value for worklets) */
  isGestureLocked: ReturnType<typeof useSharedValue<boolean>>;
  /** Start X position for displacement calculation (shared value) */
  gestureStartX: ReturnType<typeof useSharedValue<number>>;
  /** Start Y position for displacement calculation (shared value) */
  gestureStartY: ReturnType<typeof useSharedValue<number>>;
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
   * Updates gesture direction based on displacement from start
   * More reliable than velocity for initial direction detection
   * Call from gesture handler's onUpdate with absolute position
   */
  updateGestureDirectionByDisplacement: (absoluteX: number, absoluteY: number) => void;
  /**
   * Records the starting position of a gesture
   * Call from gesture handler's onStart
   */
  setGestureStart: (x: number, y: number) => void;
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

/**
 * Determines if displacement indicates horizontal movement
 * Uses GESTURE_LOCK_DISTANCE as minimum threshold
 * @worklet
 */
export function isHorizontalDisplacementWorklet(
  dx: number,
  dy: number
): boolean {
  'worklet';
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  return absDx >= GESTURE_LOCK_DISTANCE && absDx > absDy * GESTURE_PRIORITY_RATIO;
}

/**
 * Determines if displacement indicates vertical movement
 * Uses GESTURE_LOCK_DISTANCE as minimum threshold
 * @worklet
 */
export function isVerticalDisplacementWorklet(
  dx: number,
  dy: number
): boolean {
  'worklet';
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  return absDy >= GESTURE_LOCK_DISTANCE && absDy > absDx * GESTURE_PRIORITY_RATIO;
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
 * const {
 *   isHorizontalGesture,
 *   gestureDirection,
 *   lockGesture,
 *   resetGesture,
 *   setGestureStart,
 *   updateGestureDirectionByDisplacement,
 * } = useGesturePriority({
 *   onGestureAxisLock: (dir) => console.log('Locked to:', dir),
 * });
 *
 * const panGesture = Gesture.Pan()
 *   .onStart((e) => {
 *     resetGesture();
 *     setGestureStart(e.absoluteX, e.absoluteY);
 *   })
 *   .onUpdate((e) => {
 *     updateGestureDirectionByDisplacement(e.absoluteX, e.absoluteY);
 *     if (isHorizontalGesture(e.velocityX, e.velocityY)) {
 *       // Handle horizontal pan
 *     }
 *   })
 *   .onEnd(() => {
 *     resetGesture();
 *   });
 * ```
 */
export function useGesturePriority(
  options: UseGesturePriorityOptions = {}
): UseGesturePriorityReturn {
  const { onGestureAxisLock, onGestureUnlock } = options;

  const gestureDirection = useSharedValue<GestureDirection>('none');
  const isGestureLocked = useSharedValue(false);
  const gestureStartX = useSharedValue(0);
  const gestureStartY = useSharedValue(0);

  // Internal state ref for JS thread callbacks
  const stateRef = useRef<GestureState>({
    direction: 'none',
    isLocked: false,
    startX: 0,
    startY: 0,
    lockedAt: 0,
  });

  // Unlock delay timer ref
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
   * Set the starting position for displacement calculation
   */
  const setGestureStart = useCallback(
    (x: number, y: number) => {
      'worklet';
      gestureStartX.value = x;
      gestureStartY.value = y;
      runOnJS((startX: number, startY: number) => {
        stateRef.current.startX = startX;
        stateRef.current.startY = startY;
      })(x, y);
    },
    [gestureStartX, gestureStartY]
  );

  /**
   * Update gesture direction based on displacement from start
   * Automatically locks when threshold is reached
   */
  const updateGestureDirectionByDisplacement = useCallback(
    (absoluteX: number, absoluteY: number) => {
      'worklet';
      // Don't update if already locked
      if (isGestureLocked.value) return;

      const dx = absoluteX - gestureStartX.value;
      const dy = absoluteY - gestureStartY.value;

      if (isHorizontalDisplacementWorklet(dx, dy)) {
        gestureDirection.value = 'horizontal';
        isGestureLocked.value = true;
        if (onGestureAxisLock) {
          runOnJS(onGestureAxisLock)('horizontal');
        }
        runOnJS((direction: GestureDirection) => {
          stateRef.current.isLocked = true;
          stateRef.current.direction = direction;
          stateRef.current.lockedAt = Date.now();
        })('horizontal');
      } else if (isVerticalDisplacementWorklet(dx, dy)) {
        gestureDirection.value = 'vertical';
        isGestureLocked.value = true;
        if (onGestureAxisLock) {
          runOnJS(onGestureAxisLock)('vertical');
        }
        runOnJS((direction: GestureDirection) => {
          stateRef.current.isLocked = true;
          stateRef.current.direction = direction;
          stateRef.current.lockedAt = Date.now();
        })('vertical');
      }
    },
    [gestureDirection, isGestureLocked, gestureStartX, gestureStartY, onGestureAxisLock]
  );

  /**
   * Lock the current gesture direction
   */
  const lockGesture = useCallback(() => {
    'worklet';
    if (gestureDirection.value === 'none') return; // Don't lock if no direction
    isGestureLocked.value = true;
    if (onGestureAxisLock) {
      runOnJS(onGestureAxisLock)(gestureDirection.value);
    }
    runOnJS((direction: GestureDirection) => {
      stateRef.current.isLocked = true;
      stateRef.current.direction = direction;
      stateRef.current.lockedAt = Date.now();
    })(gestureDirection.value);
  }, [gestureDirection, isGestureLocked, onGestureAxisLock]);

  /**
   * Unlock gesture direction with delay
   */
  const unlockGesture = useCallback(() => {
    'worklet';
    isGestureLocked.value = false;
    runOnJS(() => {
      // Clear any existing timer
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
      }
      // Delay the full unlock to prevent rapid axis switching
      unlockTimerRef.current = setTimeout(() => {
        stateRef.current.isLocked = false;
        if (onGestureUnlock) {
          onGestureUnlock();
        }
      }, GESTURE_UNLOCK_DELAY);
    })();
  }, [isGestureLocked, onGestureUnlock]);

  /**
   * Reset gesture state completely
   */
  const resetGesture = useCallback(() => {
    'worklet';
    gestureDirection.value = 'none';
    isGestureLocked.value = false;
    gestureStartX.value = 0;
    gestureStartY.value = 0;
    runOnJS(() => {
      // Clear any pending unlock timer
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = null;
      }
      stateRef.current = {
        direction: 'none',
        isLocked: false,
        startX: 0,
        startY: 0,
        lockedAt: 0,
      };
    })();
  }, [gestureDirection, isGestureLocked, gestureStartX, gestureStartY]);

  return {
    gestureDirection,
    isGestureLocked,
    gestureStartX,
    gestureStartY,
    isHorizontalGesture,
    isVerticalGesture,
    updateGestureDirection,
    updateGestureDirectionByDisplacement,
    setGestureStart,
    lockGesture,
    unlockGesture,
    resetGesture,
  };
}

export default useGesturePriority;
