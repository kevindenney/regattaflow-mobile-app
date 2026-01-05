/**
 * useCardNavigation Hook
 *
 * Manages horizontal card pager state including:
 * - Active card index tracking
 * - Scroll offset for interpolations
 * - Programmatic scrolling
 * - Card dimension calculations
 */

import { useCallback, useMemo, useRef } from 'react';
import { Dimensions, FlatList } from 'react-native';
import {
  useSharedValue,
  useAnimatedScrollHandler,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';

import {
  CARD_WIDTH_RATIO,
  PEEK_WIDTH_RATIO,
  CARD_GAP,
} from '@/constants/navigationAnimations';

// =============================================================================
// TYPES
// =============================================================================

export interface CardDimensions {
  /** Width of each card in pixels */
  cardWidth: number;
  /** Width of the peek area on each side */
  peekWidth: number;
  /** Gap between cards */
  gap: number;
  /** Total item width including gap (for snap interval) */
  snapInterval: number;
  /** Screen width */
  screenWidth: number;
  /** Padding on left side for centering first card */
  contentPaddingLeft: number;
  /** Padding on right side for centering last card */
  contentPaddingRight: number;
}

export interface UseCardNavigationOptions {
  /** Total number of cards */
  totalCards: number;
  /** Initial active index */
  initialIndex?: number;
  /** Callback when active card changes */
  onCardChange?: (index: number) => void;
  /** Custom card width (overrides ratio calculation) */
  customCardWidth?: number;
}

export interface UseCardNavigationReturn {
  /** Shared value of horizontal scroll offset */
  scrollOffset: SharedValue<number>;
  /** Shared value of current active index (may be fractional during scroll) */
  activeIndex: SharedValue<number>;
  /** Shared value indicating if currently scrolling */
  isScrolling: SharedValue<boolean>;
  /** Calculated card dimensions */
  dimensions: CardDimensions;
  /** Ref to attach to FlatList */
  flatListRef: React.RefObject<FlatList>;
  /** Animated scroll handler for FlatList */
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  /** Programmatically scroll to a specific card index */
  scrollToIndex: (index: number, animated?: boolean) => void;
  /** Calculate card position relative to center (-1 to 1) for a given index */
  getCardPosition: (cardIndex: number) => number;
  /** Get animated position value for a card (for use in worklets) */
  getCardPositionValue: (cardIndex: number) => SharedValue<number>;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calculate card dimensions based on screen width
 */
function calculateDimensions(customCardWidth?: number): CardDimensions {
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = customCardWidth ?? screenWidth * CARD_WIDTH_RATIO;
  const peekWidth = screenWidth * PEEK_WIDTH_RATIO;
  const gap = CARD_GAP;
  const snapInterval = cardWidth + gap;

  // Padding to center the first and last cards
  // contentPaddingLeft = (screenWidth - cardWidth) / 2 for centered layout
  const contentPaddingLeft = (screenWidth - cardWidth) / 2;
  const contentPaddingRight = contentPaddingLeft;

  return {
    cardWidth,
    peekWidth,
    gap,
    snapInterval,
    screenWidth,
    contentPaddingLeft,
    contentPaddingRight,
  };
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing horizontal card pager navigation state
 *
 * @example
 * ```tsx
 * const {
 *   dimensions,
 *   flatListRef,
 *   scrollHandler,
 *   scrollToIndex,
 *   activeIndex,
 * } = useCardNavigation({
 *   totalCards: races.length,
 *   onCardChange: (index) => setSelectedRace(races[index]),
 * });
 *
 * <Animated.FlatList
 *   ref={flatListRef}
 *   onScroll={scrollHandler}
 *   snapToInterval={dimensions.snapInterval}
 *   contentContainerStyle={{
 *     paddingHorizontal: dimensions.contentPaddingLeft,
 *   }}
 * />
 * ```
 */
export function useCardNavigation({
  totalCards,
  initialIndex = 0,
  onCardChange,
  customCardWidth,
}: UseCardNavigationOptions): UseCardNavigationReturn {
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const lastReportedIndex = useRef(initialIndex);

  // Calculate dimensions
  const dimensions = useMemo(
    () => calculateDimensions(customCardWidth),
    [customCardWidth]
  );

  // Shared values for animation synchronization
  const scrollOffset = useSharedValue(initialIndex * dimensions.snapInterval);
  const activeIndex = useSharedValue(initialIndex);
  const isScrolling = useSharedValue(false);

  // Card position shared values (one per card)
  const cardPositions = useMemo(() => {
    return Array.from({ length: Math.max(totalCards, 1) }, () =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useSharedValue(0)
    );
  }, [totalCards]);

  /**
   * Animated scroll handler - runs on UI thread
   */
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollOffset.value = event.contentOffset.x;

      // Calculate active index (can be fractional during scroll)
      const newActiveIndex = event.contentOffset.x / dimensions.snapInterval;
      activeIndex.value = newActiveIndex;

      // Update card positions
      for (let i = 0; i < cardPositions.length; i++) {
        // Position: -1 (left), 0 (center), 1 (right)
        cardPositions[i].value = i - newActiveIndex;
      }
    },
    onBeginDrag: () => {
      'worklet';
      isScrolling.value = true;
    },
    onMomentumEnd: (event) => {
      'worklet';
      isScrolling.value = false;

      // Calculate final snapped index
      const snappedIndex = Math.round(
        event.contentOffset.x / dimensions.snapInterval
      );
      const clampedIndex = Math.max(0, Math.min(snappedIndex, totalCards - 1));

      // Report card change to JS thread
      if (onCardChange && clampedIndex !== lastReportedIndex.current) {
        runOnJS((newIndex: number) => {
          lastReportedIndex.current = newIndex;
          onCardChange(newIndex);
        })(clampedIndex);
      }
    },
  });

  /**
   * Programmatically scroll to a card index
   */
  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      const clampedIndex = Math.max(0, Math.min(index, totalCards - 1));
      flatListRef.current?.scrollToIndex({
        index: clampedIndex,
        animated,
      });

      // Update tracking
      if (onCardChange && clampedIndex !== lastReportedIndex.current) {
        lastReportedIndex.current = clampedIndex;
        onCardChange(clampedIndex);
      }
    },
    [totalCards, onCardChange]
  );

  /**
   * Get card position relative to center for a given index
   * Returns value between -1 (left peek) and 1 (right peek)
   * 0 = centered/active
   */
  const getCardPosition = useCallback(
    (cardIndex: number): number => {
      const currentActiveIndex = scrollOffset.value / dimensions.snapInterval;
      return cardIndex - currentActiveIndex;
    },
    [scrollOffset, dimensions.snapInterval]
  );

  /**
   * Get the shared value for a card's position
   * Use this for animated interpolations
   */
  const getCardPositionValue = useCallback(
    (cardIndex: number): SharedValue<number> => {
      if (cardIndex < 0 || cardIndex >= cardPositions.length) {
        // Return a static shared value for out-of-bounds
        return { value: 0 } as SharedValue<number>;
      }
      return cardPositions[cardIndex];
    },
    [cardPositions]
  );

  return {
    scrollOffset,
    activeIndex,
    isScrolling,
    dimensions,
    flatListRef,
    scrollHandler,
    scrollToIndex,
    getCardPosition,
    getCardPositionValue,
  };
}

export default useCardNavigation;
