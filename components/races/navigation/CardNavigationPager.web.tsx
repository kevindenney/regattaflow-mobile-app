/**
 * CardNavigationPager (Web)
 *
 * Web-specific implementation using CSS scroll-snap for native feel.
 * No JS animations for better web performance.
 */

import React, { useCallback, useEffect, useRef, useState, ReactElement } from 'react';
import { StyleSheet, View, ViewStyle, Pressable, Dimensions } from 'react-native';

import {
  CARD_WIDTH_RATIO,
  CARD_GAP,
} from '@/constants/navigationAnimations';
import { NavigationIndicators } from './NavigationIndicators';
import { useSharedValue } from 'react-native-reanimated';

// =============================================================================
// TYPES
// =============================================================================

export interface RaceData {
  id: string;
  [key: string]: unknown;
}

export interface CardNavigationPagerProps<T extends RaceData> {
  /** Array of race data to display */
  races: T[];
  /** Currently selected race index */
  selectedIndex?: number;
  /** Render function for each race card */
  renderCard: (race: T, index: number, isActive: boolean) => ReactElement;
  /** Callback when active card changes */
  onCardChange?: (index: number, race: T) => void;
  /** Callback when a card is pressed */
  onCardPress?: (index: number, race: T) => void;
  /** Callback when a card is long pressed */
  onCardLongPress?: (index: number, race: T) => void;
  /** Whether to show navigation indicators (dots) */
  showIndicators?: boolean;
  /** Active indicator color */
  indicatorActiveColor?: string;
  /** Inactive indicator color */
  indicatorInactiveColor?: string;
  /** Container style */
  style?: ViewStyle;
  /** Card container style */
  cardStyle?: ViewStyle;
  /** Header content to render above the pager */
  headerContent?: ReactElement;
  /** Whether haptics are enabled (no-op on web) */
  enableHaptics?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CardNavigationPager<T extends RaceData>({
  races,
  selectedIndex = 0,
  renderCard,
  onCardChange,
  onCardPress,
  onCardLongPress,
  showIndicators = true,
  indicatorActiveColor,
  indicatorInactiveColor,
  style,
  cardStyle,
  headerContent,
  testID,
}: CardNavigationPagerProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const activeIndexShared = useSharedValue(selectedIndex);

  // Calculate dimensions
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth * CARD_WIDTH_RATIO;
  const snapInterval = cardWidth + CARD_GAP;
  const contentPadding = (screenWidth - cardWidth) / 2;

  /**
   * Handle scroll end to detect active card
   */
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const newIndex = Math.round(scrollLeft / snapInterval);
    const clampedIndex = Math.max(0, Math.min(newIndex, races.length - 1));

    if (clampedIndex !== activeIndex) {
      setActiveIndex(clampedIndex);
      activeIndexShared.value = clampedIndex;
      onCardChange?.(clampedIndex, races[clampedIndex]);
    }
  }, [snapInterval, races, activeIndex, activeIndexShared, onCardChange]);

  /**
   * Scroll to a specific index
   */
  const scrollToIndex = useCallback(
    (index: number) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const targetScroll = index * snapInterval;
      container.scrollTo({
        left: targetScroll,
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

  // Intersection observer for active card detection
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScrollEnd = () => {
      handleScroll();
    };

    // Debounced scroll handler
    let scrollTimeout: NodeJS.Timeout;
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 100);
    };

    container.addEventListener('scroll', debouncedScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', debouncedScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleScroll]);

  // Empty state
  if (races.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        {headerContent}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Header content */}
      {headerContent}

      {/* Scroll container with CSS scroll-snap */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          flexDirection: 'row',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          paddingLeft: contentPadding,
          paddingRight: contentPadding,
          gap: CARD_GAP,
          // Hide scrollbar
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        // @ts-ignore - webkit scrollbar hiding
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        {races.map((race, index) => {
          const isActive = index === activeIndex;

          return (
            <Pressable
              key={race.id ?? `race-${index}`}
              onPress={() => onCardPress?.(index, race)}
              onLongPress={() => onCardLongPress?.(index, race)}
              style={[
                {
                  width: cardWidth,
                  scrollSnapAlign: 'center',
                  flexShrink: 0,
                  opacity: isActive ? 1 : 0.7,
                  transform: [{ scale: isActive ? 1 : 0.92 }],
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                },
                cardStyle,
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Race ${index + 1} of ${races.length}`}
              accessibilityState={{ selected: isActive }}
            >
              {renderCard(race, index, isActive)}
            </Pressable>
          );
        })}
      </div>

      {/* Navigation indicators */}
      {showIndicators && (
        <NavigationIndicators
          count={races.length}
          activeIndex={activeIndexShared}
          activeColor={indicatorActiveColor}
          inactiveColor={indicatorInactiveColor}
        />
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CardNavigationPager;
