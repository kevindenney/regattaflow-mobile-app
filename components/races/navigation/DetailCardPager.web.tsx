/**
 * DetailCardPager (Web)
 *
 * Web-specific implementation using CSS scroll-snap for native feel.
 * Uses vertical scroll-snap for smooth card transitions.
 */

import React, { useCallback, useEffect, useRef, useState, ReactElement, useMemo } from 'react';
import { StyleSheet, View, ViewStyle, Pressable } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import {
  DETAIL_CARD_GAP,
  DETAIL_CARD_HEIGHT_RATIO,
  DETAIL_CARD_SCALE,
  DETAIL_CARD_OPACITY,
  DETAIL_CARD_TYPES,
  type DetailCardType,
} from '@/constants/navigationAnimations';

// =============================================================================
// TYPES
// =============================================================================

export interface DetailCardData {
  type: DetailCardType;
  id: string;
  title: string;
  [key: string]: unknown;
}

export interface DetailCardPagerProps {
  /** Array of detail cards to display */
  cards?: DetailCardData[];
  /** Height of the detail zone */
  zoneHeight: number;
  /** Currently selected card index */
  selectedIndex?: number;
  /** Render function for each detail card */
  renderCard: (card: DetailCardData, index: number, isActive: boolean) => ReactElement;
  /** Callback when active card changes */
  onCardChange?: (index: number, cardType: DetailCardType) => void;
  /** Callback when a card is pressed */
  onCardPress?: (index: number, card: DetailCardData) => void;
  /** Whether to show navigation indicators */
  showIndicators?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Card container style */
  cardStyle?: ViewStyle;
  /** Whether haptics are enabled (no-op on web) */
  enableHaptics?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// DEFAULT CARDS
// =============================================================================

const createDefaultDetailCards = (): DetailCardData[] => [
  { type: 'conditions', id: 'detail-conditions', title: 'Conditions' },
  { type: 'strategy', id: 'detail-strategy', title: 'Strategy' },
  { type: 'rig', id: 'detail-rig', title: 'Rig Setup' },
  { type: 'course', id: 'detail-course', title: 'Course' },
  { type: 'fleet', id: 'detail-fleet', title: 'Fleet' },
  { type: 'regulatory', id: 'detail-regulatory', title: 'Regulatory' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function DetailCardPager({
  cards,
  zoneHeight,
  selectedIndex = 0,
  renderCard,
  onCardChange,
  onCardPress,
  showIndicators = false,
  style,
  cardStyle,
  testID,
}: DetailCardPagerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const activeIndexShared = useSharedValue(selectedIndex);

  // Use provided cards or default
  const detailCards = useMemo(() => {
    return cards || createDefaultDetailCards();
  }, [cards]);

  // Calculate dimensions
  const cardHeight = Math.floor(zoneHeight * DETAIL_CARD_HEIGHT_RATIO);
  const snapInterval = cardHeight + DETAIL_CARD_GAP;
  const contentPadding = (zoneHeight - cardHeight) / 2;

  /**
   * Handle scroll end to detect active card
   */
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const newIndex = Math.round(scrollTop / snapInterval);
    const clampedIndex = Math.max(0, Math.min(newIndex, detailCards.length - 1));

    if (clampedIndex !== activeIndex) {
      setActiveIndex(clampedIndex);
      activeIndexShared.value = clampedIndex;
      const cardType = DETAIL_CARD_TYPES[clampedIndex] || 'conditions';
      onCardChange?.(clampedIndex, cardType);
    }
  }, [snapInterval, detailCards.length, activeIndex, activeIndexShared, onCardChange]);

  /**
   * Scroll to a specific index
   */
  const scrollToIndex = useCallback(
    (index: number) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const targetScroll = index * snapInterval;
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    },
    [snapInterval]
  );

  // Scroll to initial index on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToIndex(selectedIndex);
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedIndex, scrollToIndex]);

  // Scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Debounced scroll handler
    let scrollTimeout: NodeJS.Timeout;
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    container.addEventListener('scroll', debouncedScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', debouncedScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleScroll]);

  // Empty state
  if (detailCards.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        {/* Empty state could go here */}
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: zoneHeight }, style]} testID={testID}>
      {/* Scroll container with CSS scroll-snap */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          height: zoneHeight,
          paddingTop: contentPadding,
          paddingBottom: contentPadding,
          paddingLeft: 16,
          paddingRight: 16,
          gap: DETAIL_CARD_GAP,
          // Hide scrollbar
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {detailCards.map((card, index) => {
          const isActive = index === activeIndex;

          return (
            <Pressable
              key={card.id ?? `detail-${index}`}
              onPress={() => onCardPress?.(index, card)}
              style={[
                styles.cardContainer,
                {
                  height: cardHeight,
                  scrollSnapAlign: 'center',
                  flexShrink: 0,
                  opacity: isActive ? DETAIL_CARD_OPACITY.active : DETAIL_CARD_OPACITY.inactive,
                  transform: [
                    { scale: isActive ? DETAIL_CARD_SCALE.active : DETAIL_CARD_SCALE.inactive },
                  ],
                  // @ts-ignore - Web transition property
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                },
                cardStyle,
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${card.title} - Card ${index + 1} of ${detailCards.length}`}
              accessibilityState={{ selected: isActive }}
            >
              {renderCard(card, index, isActive)}
            </Pressable>
          );
        })}
      </div>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
    overflow: 'hidden',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden',
  },
});

export default DetailCardPager;
