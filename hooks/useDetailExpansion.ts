/**
 * useDetailExpansion Hook
 *
 * Manages vertical detail card expansion state including:
 * - Expansion progress (0-1)
 * - Gesture handling for swipe-up reveal
 * - Animation timing with Apple's ease-out
 * - Haptic feedback at threshold
 */

import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import {
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  VELOCITY_THRESHOLD,
  DISTANCE_THRESHOLD,
  DETAIL_EXPAND_DURATION,
  DETAIL_COLLAPSE_DURATION,
  APPLE_EASE_OUT,
  DETAIL_CARD_TYPES,
  DetailCardType,
} from '@/constants/navigationAnimations';

// =============================================================================
// TYPES
// =============================================================================

export interface UseDetailExpansionOptions {
  /** Callback when expansion starts */
  onExpand?: () => void;
  /** Callback when collapse starts */
  onCollapse?: () => void;
  /** Callback when expansion completes */
  onExpandComplete?: () => void;
  /** Callback when collapse completes */
  onCollapseComplete?: () => void;
  /** Whether haptics are enabled */
  enableHaptics?: boolean;
}

export interface UseDetailExpansionReturn {
  /** Expansion progress (0 = collapsed, 1 = expanded) */
  expansionProgress: SharedValue<number>;
  /** Whether details are currently expanded */
  isExpanded: SharedValue<boolean>;
  /** Whether expansion animation is in progress */
  isAnimating: SharedValue<boolean>;
  /** Current active detail card index */
  activeDetailIndex: SharedValue<number>;
  /** Available detail card types */
  detailCardTypes: readonly DetailCardType[];
  /** Expand detail cards */
  expand: () => void;
  /** Collapse detail cards */
  collapse: () => void;
  /** Toggle expansion state */
  toggle: () => void;
  /** Handle vertical pan gesture update */
  handlePanUpdate: (translationY: number, velocityY: number) => void;
  /** Handle vertical pan gesture end */
  handlePanEnd: (translationY: number, velocityY: number) => void;
  /** Navigate to specific detail card */
  goToDetailCard: (index: number) => void;
  /** Navigate to next detail card */
  nextDetailCard: () => void;
  /** Navigate to previous detail card */
  previousDetailCard: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing detail card expansion
 *
 * @example
 * ```tsx
 * const { expansionProgress, isExpanded, expand, collapse, handlePanUpdate, handlePanEnd } =
 *   useDetailExpansion({
 *     onExpand: () => console.log('Expanded'),
 *     onCollapse: () => console.log('Collapsed'),
 *   });
 *
 * const panGesture = Gesture.Pan()
 *   .onUpdate((e) => handlePanUpdate(e.translationY, e.velocityY))
 *   .onEnd((e) => handlePanEnd(e.translationY, e.velocityY));
 * ```
 */
export function useDetailExpansion({
  onExpand,
  onCollapse,
  onExpandComplete,
  onCollapseComplete,
  enableHaptics = true,
}: UseDetailExpansionOptions = {}): UseDetailExpansionReturn {
  // Shared values for animations
  const expansionProgress = useSharedValue(0);
  const isExpanded = useSharedValue(false);
  const isAnimating = useSharedValue(false);
  const activeDetailIndex = useSharedValue(0);

  // Track if threshold haptic has fired
  const thresholdHapticFired = useRef(false);

  /**
   * Trigger haptic feedback
   */
  const triggerHaptic = useCallback(
    (type: 'light' | 'selection') => {
      if (!enableHaptics || Platform.OS === 'web') return;

      if (type === 'light') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.selectionAsync();
      }
    },
    [enableHaptics]
  );

  /**
   * Expand detail cards
   */
  const expand = useCallback(() => {
    'worklet';
    if (isExpanded.value || isAnimating.value) return;

    isAnimating.value = true;
    isExpanded.value = true;

    // Notify via JS thread
    if (onExpand) {
      runOnJS(onExpand)();
    }

    // Animate expansion
    expansionProgress.value = withTiming(
      1,
      {
        duration: DETAIL_EXPAND_DURATION,
        easing: APPLE_EASE_OUT,
      },
      (finished) => {
        'worklet';
        if (finished) {
          isAnimating.value = false;
          if (onExpandComplete) {
            runOnJS(onExpandComplete)();
          }
        }
      }
    );
  }, [expansionProgress, isExpanded, isAnimating, onExpand, onExpandComplete]);

  /**
   * Collapse detail cards
   */
  const collapse = useCallback(() => {
    'worklet';
    if (!isExpanded.value || isAnimating.value) return;

    isAnimating.value = true;

    // Notify via JS thread
    if (onCollapse) {
      runOnJS(onCollapse)();
    }

    // Animate collapse
    expansionProgress.value = withTiming(
      0,
      {
        duration: DETAIL_COLLAPSE_DURATION,
        easing: APPLE_EASE_OUT,
      },
      (finished) => {
        'worklet';
        if (finished) {
          isExpanded.value = false;
          isAnimating.value = false;
          activeDetailIndex.value = 0; // Reset to first card
          if (onCollapseComplete) {
            runOnJS(onCollapseComplete)();
          }
        }
      }
    );
  }, [
    expansionProgress,
    isExpanded,
    isAnimating,
    activeDetailIndex,
    onCollapse,
    onCollapseComplete,
  ]);

  /**
   * Toggle expansion state
   */
  const toggle = useCallback(() => {
    'worklet';
    if (isExpanded.value) {
      collapse();
    } else {
      expand();
    }
  }, [isExpanded, expand, collapse]);

  /**
   * Handle vertical pan gesture update
   * Updates expansion progress based on drag distance
   */
  const handlePanUpdate = useCallback(
    (translationY: number, velocityY: number) => {
      'worklet';

      // Only respond to upward swipes when collapsed
      if (!isExpanded.value && translationY < 0) {
        // Normalize translation to progress (0-1)
        // Use 200px as the full expansion distance
        const progress = Math.min(Math.abs(translationY) / 200, 1);
        expansionProgress.value = progress;

        // Check for threshold crossing (for haptic)
        if (
          progress > 0.25 &&
          !thresholdHapticFired.current &&
          enableHaptics &&
          Platform.OS !== 'web'
        ) {
          thresholdHapticFired.current = true;
          runOnJS(() => {
            Haptics.selectionAsync();
          })();
        }
      }

      // When expanded, respond to downward swipes
      if (isExpanded.value && translationY > 0) {
        const progress = Math.max(1 - translationY / 200, 0);
        expansionProgress.value = progress;
      }
    },
    [expansionProgress, isExpanded, enableHaptics]
  );

  /**
   * Handle vertical pan gesture end
   * Determines whether to complete expansion or snap back
   */
  const handlePanEnd = useCallback(
    (translationY: number, velocityY: number) => {
      'worklet';

      // Reset threshold flag
      runOnJS(() => {
        thresholdHapticFired.current = false;
      })();

      // When collapsed, check if should expand
      if (!isExpanded.value) {
        const shouldExpand =
          velocityY < -VELOCITY_THRESHOLD || // Fast upward swipe
          Math.abs(translationY) > DISTANCE_THRESHOLD; // Sufficient distance

        if (shouldExpand) {
          expand();
        } else {
          // Snap back to collapsed
          expansionProgress.value = withTiming(0, {
            duration: DETAIL_COLLAPSE_DURATION,
            easing: APPLE_EASE_OUT,
          });
        }
      }

      // When expanded, check if should collapse
      if (isExpanded.value) {
        const shouldCollapse =
          velocityY > VELOCITY_THRESHOLD || // Fast downward swipe
          translationY > DISTANCE_THRESHOLD; // Sufficient distance

        if (shouldCollapse) {
          collapse();
        } else {
          // Snap back to expanded
          expansionProgress.value = withTiming(1, {
            duration: DETAIL_EXPAND_DURATION,
            easing: APPLE_EASE_OUT,
          });
        }
      }
    },
    [isExpanded, expand, collapse, expansionProgress]
  );

  /**
   * Navigate to specific detail card
   */
  const goToDetailCard = useCallback(
    (index: number) => {
      'worklet';
      const clampedIndex = Math.max(
        0,
        Math.min(index, DETAIL_CARD_TYPES.length - 1)
      );
      activeDetailIndex.value = clampedIndex;
    },
    [activeDetailIndex]
  );

  /**
   * Navigate to next detail card
   */
  const nextDetailCard = useCallback(() => {
    'worklet';
    const nextIndex = Math.min(
      activeDetailIndex.value + 1,
      DETAIL_CARD_TYPES.length - 1
    );
    activeDetailIndex.value = nextIndex;
  }, [activeDetailIndex]);

  /**
   * Navigate to previous detail card
   */
  const previousDetailCard = useCallback(() => {
    'worklet';
    const prevIndex = Math.max(activeDetailIndex.value - 1, 0);
    activeDetailIndex.value = prevIndex;
  }, [activeDetailIndex]);

  return {
    expansionProgress,
    isExpanded,
    isAnimating,
    activeDetailIndex,
    detailCardTypes: DETAIL_CARD_TYPES,
    expand,
    collapse,
    toggle,
    handlePanUpdate,
    handlePanEnd,
    goToDetailCard,
    nextDetailCard,
    previousDetailCard,
  };
}

export default useDetailExpansion;
