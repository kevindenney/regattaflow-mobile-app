/**
 * useDetailCardNavigation Hook
 *
 * Manages vertical detail card pager state for the race detail zone.
 * Handles card selection, scroll position, and animations.
 */

import { useCallback, useMemo, useRef } from 'react';
import { Dimensions, FlatList, Platform } from 'react-native';
import {
  useSharedValue,
  useAnimatedScrollHandler,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  DETAIL_SNAP_SPRING_CONFIG,
  DETAIL_CARD_HEIGHT_RATIO,
  DETAIL_CARD_GAP,
  DETAIL_CARD_TYPES,
  type DetailCardType,
} from '@/constants/navigationAnimations';

// =============================================================================
// TYPES
// =============================================================================

export interface DetailCard {
  type: DetailCardType;
  id: string;
  title: string;
}

export interface UseDetailCardNavigationOptions {
  /** Available height for the detail zone */
  zoneHeight: number;
  /** Called when active card changes */
  onCardChange?: (index: number, cardType: DetailCardType) => void;
  /** Initial card index */
  initialIndex?: number;
  /** Enable haptic feedback */
  enableHaptics?: boolean;
}

export interface UseDetailCardNavigationReturn {
  /** Ref for the FlatList */
  flatListRef: React.RefObject<FlatList>;
  /** Current scroll offset (shared value for animations) */
  scrollOffset: ReturnType<typeof useSharedValue<number>>;
  /** Current active card index (shared value) */
  activeIndex: ReturnType<typeof useSharedValue<number>>;
  /** Height of each card in pixels */
  cardHeight: number;
  /** Snap interval for the pager */
  snapInterval: number;
  /** Content padding for proper centering */
  contentPadding: number;
  /** Animated scroll handler */
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  /** Get position value for a specific card (for animations) */
  getCardPosition: (index: number) => number;
  /** Scroll to a specific card index */
  scrollToIndex: (index: number, animated?: boolean) => void;
  /** Scroll to next card */
  scrollToNext: () => void;
  /** Scroll to previous card */
  scrollToPrevious: () => void;
  /** Get item layout for FlatList optimization */
  getItemLayout: (data: any, index: number) => { length: number; offset: number; index: number };
  /** Handle momentum scroll end (for card change detection) */
  handleMomentumScrollEnd: (offsetY: number) => void;
  /** Default detail cards */
  defaultDetailCards: DetailCard[];
}

// =============================================================================
// DEFAULT CARDS
// =============================================================================

const createDefaultDetailCards = (): DetailCard[] => [
  { type: 'conditions', id: 'detail-conditions', title: 'Conditions' },
  { type: 'strategy', id: 'detail-strategy', title: 'Strategy' },
  { type: 'rig', id: 'detail-rig', title: 'Rig Setup' },
  { type: 'course', id: 'detail-course', title: 'Course' },
  { type: 'fleet', id: 'detail-fleet', title: 'Fleet' },
  { type: 'regulatory', id: 'detail-regulatory', title: 'Regulatory' },
];

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing vertical detail card navigation
 *
 * @example
 * ```tsx
 * const {
 *   flatListRef,
 *   scrollHandler,
 *   cardHeight,
 *   snapInterval,
 *   scrollToIndex,
 *   getItemLayout,
 * } = useDetailCardNavigation({
 *   zoneHeight: 300,
 *   onCardChange: (index, type) => console.log('Card changed:', type),
 * });
 *
 * <Animated.FlatList
 *   ref={flatListRef}
 *   data={detailCards}
 *   onScroll={scrollHandler}
 *   snapToInterval={snapInterval}
 *   getItemLayout={getItemLayout}
 * />
 * ```
 */
export function useDetailCardNavigation(
  options: UseDetailCardNavigationOptions
): UseDetailCardNavigationReturn {
  const {
    zoneHeight,
    onCardChange,
    initialIndex = 0,
    enableHaptics = true,
  } = options;

  const flatListRef = useRef<FlatList>(null);
  const scrollOffset = useSharedValue(0);
  const activeIndex = useSharedValue(initialIndex);
  const lastReportedIndex = useRef(initialIndex);

  // Calculate card dimensions
  const cardHeight = useMemo(() => {
    return Math.floor(zoneHeight * DETAIL_CARD_HEIGHT_RATIO);
  }, [zoneHeight]);

  const snapInterval = useMemo(() => {
    return cardHeight + DETAIL_CARD_GAP;
  }, [cardHeight]);

  // Content padding to center first and last cards
  const contentPadding = useMemo(() => {
    return (zoneHeight - cardHeight) / 2;
  }, [zoneHeight, cardHeight]);

  // Default detail cards
  const defaultDetailCards = useMemo(() => createDefaultDetailCards(), []);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [enableHaptics]);

  // Handle card change
  const handleCardChange = useCallback(
    (newIndex: number) => {
      if (newIndex !== lastReportedIndex.current && newIndex >= 0) {
        lastReportedIndex.current = newIndex;
        triggerHaptic();
        if (onCardChange) {
          const cardType = DETAIL_CARD_TYPES[newIndex] || 'conditions';
          onCardChange(newIndex, cardType);
        }
      }
    },
    [onCardChange, triggerHaptic]
  );

  // Animated scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;

      // Calculate active index
      const newIndex = Math.round(event.contentOffset.y / snapInterval);
      if (newIndex !== activeIndex.value && newIndex >= 0) {
        activeIndex.value = newIndex;
        runOnJS(handleCardChange)(newIndex);
      }
    },
  });

  // Get position for a specific card (0 = active, negative = above, positive = below)
  const getCardPosition = useCallback(
    (index: number): number => {
      'worklet';
      const cardCenter = index * snapInterval;
      const viewportCenter = scrollOffset.value;
      return (cardCenter - viewportCenter) / snapInterval;
    },
    [snapInterval, scrollOffset]
  );

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      flatListRef.current?.scrollToIndex({
        index,
        animated,
        viewPosition: 0, // Position at top of visible area
      });
    },
    []
  );

  // Scroll to next card
  const scrollToNext = useCallback(() => {
    const nextIndex = Math.min(
      activeIndex.value + 1,
      DETAIL_CARD_TYPES.length - 1
    );
    scrollToIndex(nextIndex);
  }, [scrollToIndex, activeIndex]);

  // Scroll to previous card
  const scrollToPrevious = useCallback(() => {
    const prevIndex = Math.max(activeIndex.value - 1, 0);
    scrollToIndex(prevIndex);
  }, [scrollToIndex, activeIndex]);

  // Get item layout for FlatList optimization
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: cardHeight + DETAIL_CARD_GAP,
      offset: (cardHeight + DETAIL_CARD_GAP) * index,
      index,
    }),
    [cardHeight]
  );

  // Handle momentum scroll end
  const handleMomentumScrollEnd = useCallback(
    (offsetY: number) => {
      const newIndex = Math.round(offsetY / snapInterval);
      if (newIndex >= 0 && newIndex < DETAIL_CARD_TYPES.length) {
        activeIndex.value = newIndex;
        handleCardChange(newIndex);
      }
    },
    [snapInterval, activeIndex, handleCardChange]
  );

  return {
    flatListRef,
    scrollOffset,
    activeIndex,
    cardHeight,
    snapInterval,
    contentPadding,
    scrollHandler,
    getCardPosition,
    scrollToIndex,
    scrollToNext,
    scrollToPrevious,
    getItemLayout,
    handleMomentumScrollEnd,
    defaultDetailCards,
  };
}

export default useDetailCardNavigation;
