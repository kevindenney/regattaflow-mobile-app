/**
 * useCardGrid - Main Navigation State Hook
 *
 * Manages the 2D card grid navigation:
 * - Shared values for horizontal (race) and vertical (detail) positions
 * - Snap-to-card logic with velocity threshold
 * - Preserves vertical position per race
 * - State persistence to AsyncStorage
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import {
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  CardPosition,
  CardDimensions,
  CardGridState,
  CardType,
  CARD_TYPES,
  CARD_COUNT,
  UseCardGridReturn,
  CardNavigationPersistedState,
} from '../types';
import {
  calculateCardDimensions,
  SNAP_SPRING_CONFIG,
  DETAIL_SNAP_SPRING_CONFIG,
  VELOCITY_THRESHOLD,
  SNAP_DISTANCE_THRESHOLD,
  ENABLE_HAPTICS,
  ENABLE_PERSISTENCE,
  PERSISTENCE_KEY,
  PERSISTENCE_DEBOUNCE,
} from '../constants';
import { useAxisLock } from './useAxisLock';

// =============================================================================
// TYPES
// =============================================================================

interface UseCardGridOptions {
  /** Total number of races */
  totalRaces: number;
  /** Initial race index */
  initialRaceIndex?: number;
  /** Initial card index (detail level) */
  initialCardIndex?: number;
  /** Callback when race changes */
  onRaceChange?: (index: number) => void;
  /** Callback when card (detail level) changes */
  onCardChange?: (cardType: CardType, index: number) => void;
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  /** Enable state persistence */
  persistState?: boolean;
  /** Custom persistence key */
  persistenceKey?: string;
  /** Actual container width (overrides screen width) */
  containerWidth?: number;
  /** Actual container height (overrides screen height) */
  containerHeight?: number;
}

// =============================================================================
// HOOK
// =============================================================================

export function useCardGrid(options: UseCardGridOptions): UseCardGridReturn {
  const {
    totalRaces,
    initialRaceIndex: rawInitialRaceIndex = 0,
    initialCardIndex: rawInitialCardIndex = 0,
    onRaceChange,
    onCardChange,
    enableHaptics = ENABLE_HAPTICS,
    persistState = ENABLE_PERSISTENCE,
    persistenceKey = PERSISTENCE_KEY,
    containerWidth,
    containerHeight,
  } = options;

  // Clamp initial indices to valid ranges
  const initialRaceIndex = Math.max(0, Math.min(rawInitialRaceIndex, totalRaces - 1));
  const initialCardIndex = Math.max(0, Math.min(rawInitialCardIndex, CARD_COUNT - 1));

  // ==========================================================================
  // DIMENSIONS
  // ==========================================================================

  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Use container dimensions if provided, otherwise fall back to screen dimensions
  const effectiveWidth = containerWidth ?? screenDimensions.width;
  const effectiveHeight = containerHeight ?? screenDimensions.height;

  const dimensions: CardDimensions = useMemo(
    () => calculateCardDimensions(effectiveWidth, effectiveHeight),
    [effectiveWidth, effectiveHeight]
  );

  // Listen for dimension changes (rotation, etc.)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // ==========================================================================
  // SHARED VALUES (UI Thread)
  // ==========================================================================

  const currentRaceIndex = useSharedValue(initialRaceIndex);
  const currentCardIndex = useSharedValue(initialCardIndex);
  const horizontalOffset = useSharedValue(initialRaceIndex * dimensions.horizontalSnapInterval);
  const verticalOffset = useSharedValue(initialCardIndex * dimensions.verticalSnapInterval);
  const isGestureActive = useSharedValue(false);

  // Axis lock hook
  const { lockedAxis, updateLock, releaseLock } = useAxisLock({
    onAxisLock: (axis) => {
      // Haptic feedback when axis locks
      if (enableHaptics && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
  });

  // Grid state object
  const gridState: CardGridState = useMemo(
    () => ({
      currentRaceIndex,
      currentCardIndex,
      horizontalOffset,
      verticalOffset,
      lockedAxis,
      isGestureActive,
    }),
    [currentRaceIndex, currentCardIndex, horizontalOffset, verticalOffset, lockedAxis, isGestureActive]
  );

  // ==========================================================================
  // JS THREAD STATE
  // ==========================================================================

  const [jsRaceIndex, setJsRaceIndex] = useState(initialRaceIndex);
  const [jsCardIndex, setJsCardIndex] = useState(initialCardIndex);

  // Per-race vertical positions (for preserving position when switching races)
  const verticalPositionsRef = useRef<Record<number, number>>({});

  // Debounce timer for persistence
  const persistenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ==========================================================================
  // NAVIGATION METHODS
  // ==========================================================================

  /**
   * Navigate to a specific race index
   */
  const goToRace = useCallback(
    (index: number, animated = true) => {
      'worklet';
      // Clamp to valid range
      const clampedIndex = Math.max(0, Math.min(index, totalRaces - 1));

      // Calculate target offset
      const targetOffset = clampedIndex * dimensions.horizontalSnapInterval;

      // Animate to position
      if (animated) {
        horizontalOffset.value = withSpring(targetOffset, SNAP_SPRING_CONFIG);
      } else {
        horizontalOffset.value = targetOffset;
      }

      currentRaceIndex.value = clampedIndex;

      // Update JS state
      runOnJS(setJsRaceIndex)(clampedIndex);

      // Callback
      if (onRaceChange) {
        runOnJS(onRaceChange)(clampedIndex);
      }
    },
    [totalRaces, dimensions.horizontalSnapInterval, horizontalOffset, currentRaceIndex, onRaceChange]
  );

  /**
   * Navigate to a specific card index (detail level)
   */
  const goToCard = useCallback(
    (index: number, animated = true) => {
      'worklet';
      // Clamp to valid range
      const clampedIndex = Math.max(0, Math.min(index, CARD_COUNT - 1));

      // Calculate target offset
      const targetOffset = clampedIndex * dimensions.verticalSnapInterval;

      // Animate to position
      if (animated) {
        verticalOffset.value = withSpring(targetOffset, DETAIL_SNAP_SPRING_CONFIG);
      } else {
        verticalOffset.value = targetOffset;
      }

      currentCardIndex.value = clampedIndex;

      // Update JS state
      runOnJS(setJsCardIndex)(clampedIndex);

      // Store vertical position for this race
      const raceIdx = currentRaceIndex.value;
      runOnJS((rIdx: number, cardIdx: number) => {
        verticalPositionsRef.current[rIdx] = cardIdx;
      })(raceIdx, clampedIndex);

      // Callback
      if (onCardChange) {
        const cardType = CARD_TYPES[clampedIndex];
        runOnJS(onCardChange)(cardType, clampedIndex);
      }
    },
    [dimensions.verticalSnapInterval, verticalOffset, currentCardIndex, currentRaceIndex, onCardChange]
  );

  /**
   * Navigate to a specific position (race and card)
   */
  const goToPosition = useCallback(
    (position: CardPosition, animated = true) => {
      goToRace(position.x, animated);
      goToCard(position.y, animated);
    },
    [goToRace, goToCard]
  );

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  /**
   * Save navigation state to storage
   */
  const saveState = useCallback(async () => {
    if (!persistState) return;

    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;

      const state: CardNavigationPersistedState = {
        lastRaceId: null, // TODO: Get from race data
        lastRaceIndex: jsRaceIndex,
        verticalPositions: verticalPositionsRef.current,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(persistenceKey, JSON.stringify(state));
    } catch (error) {
      console.warn('[CardGrid] Failed to save state:', error);
    }
  }, [persistState, persistenceKey, jsRaceIndex]);

  /**
   * Load navigation state from storage
   */
  const loadState = useCallback(async () => {
    if (!persistState) return;

    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;

      const stored = await AsyncStorage.getItem(persistenceKey);
      if (!stored) return;

      const state: CardNavigationPersistedState = JSON.parse(stored);

      // Restore race index
      if (state.lastRaceIndex >= 0 && state.lastRaceIndex < totalRaces) {
        goToRace(state.lastRaceIndex, false);
      }

      // Restore vertical positions
      if (state.verticalPositions) {
        verticalPositionsRef.current = state.verticalPositions;

        // Restore current race's vertical position
        const savedCardIndex = state.verticalPositions[state.lastRaceIndex];
        if (savedCardIndex !== undefined && savedCardIndex >= 0 && savedCardIndex < CARD_COUNT) {
          goToCard(savedCardIndex, false);
        }
      }
    } catch (error) {
      console.warn('[CardGrid] Failed to load state:', error);
    }
  }, [persistState, persistenceKey, totalRaces, goToRace, goToCard]);

  // Auto-save on state changes (debounced)
  useEffect(() => {
    if (!persistState) return;

    if (persistenceTimer.current) {
      clearTimeout(persistenceTimer.current);
    }

    persistenceTimer.current = setTimeout(() => {
      saveState();
    }, PERSISTENCE_DEBOUNCE);

    return () => {
      if (persistenceTimer.current) {
        clearTimeout(persistenceTimer.current);
      }
    };
  }, [jsRaceIndex, jsCardIndex, persistState, saveState]);

  // Load state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  // ==========================================================================
  // DERIVED VALUES
  // ==========================================================================

  const currentCardType: CardType = useMemo(
    () => CARD_TYPES[jsCardIndex] || 'race_summary',
    [jsCardIndex]
  );

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    gridState,
    dimensions,
    goToRace,
    goToCard,
    goToPosition,
    currentRaceIndex: jsRaceIndex,
    currentCardIndex: jsCardIndex,
    currentCardType,
    saveState,
    loadState,
  };
}

export default useCardGrid;
