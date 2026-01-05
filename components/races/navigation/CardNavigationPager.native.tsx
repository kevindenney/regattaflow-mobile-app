/**
 * CardNavigationPager (Native)
 *
 * Horizontal card pager with:
 * - 85% width active card
 * - 7.5% peek cards on left/right
 * - Snap-to-card with spring physics
 * - Scale, opacity, and rotation animations
 * - Haptic feedback at snap points
 *
 * Uses FlatList with Reanimated for smooth 60fps scrolling.
 */

import React, { useCallback, ReactElement } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  DECELERATION_RATE,
  INITIAL_NUM_TO_RENDER,
  MAX_TO_RENDER_PER_BATCH,
  WINDOW_SIZE,
  CARD_GAP,
} from '@/constants/navigationAnimations';
import { useCardNavigation, CardDimensions } from '@/hooks/useCardNavigation';
import { AnimatedRaceCard } from './AnimatedRaceCard';
import { NavigationIndicators } from './NavigationIndicators';

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
  /** Whether haptics are enabled */
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
  enableHaptics = true,
  testID,
}: CardNavigationPagerProps<T>) {
  // Card navigation state and scroll handlers
  const {
    dimensions,
    flatListRef,
    scrollHandler,
    activeIndex,
    getCardPositionValue,
  } = useCardNavigation({
    totalCards: races.length,
    initialIndex: selectedIndex,
    onCardChange: (index) => {
      // Haptic feedback on snap
      if (enableHaptics && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Notify parent
      if (onCardChange && races[index]) {
        onCardChange(index, races[index]);
      }
    },
  });

  /**
   * Render a single race card with animations
   */
  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      const position = getCardPositionValue(index);
      const isActive = Math.round(activeIndex.value) === index;

      return (
        <AnimatedRaceCard
          position={position}
          index={index}
          totalCards={races.length}
          cardWidth={dimensions.cardWidth}
          isActive={isActive}
          onPress={
            onCardPress ? () => onCardPress(index, item) : undefined
          }
          onLongPress={
            onCardLongPress ? () => onCardLongPress(index, item) : undefined
          }
          style={cardStyle}
        >
          {renderCard(item, index, isActive)}
        </AnimatedRaceCard>
      );
    },
    [
      races.length,
      dimensions.cardWidth,
      activeIndex,
      getCardPositionValue,
      renderCard,
      onCardPress,
      onCardLongPress,
      cardStyle,
    ]
  );

  /**
   * Key extractor for FlatList
   */
  const keyExtractor = useCallback((item: T, index: number) => {
    return item.id ?? `race-${index}`;
  }, []);

  /**
   * Get item layout for optimized scrolling
   */
  const getItemLayout = useCallback(
    (_data: readonly T[] | null | undefined, index: number) => ({
      length: dimensions.cardWidth + CARD_GAP,
      offset: (dimensions.cardWidth + CARD_GAP) * index,
      index,
    }),
    [dimensions.cardWidth]
  );

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

      {/* Horizontal race card pager */}
      <Animated.FlatList
        ref={flatListRef}
        data={races}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        // Snap behavior
        snapToInterval={dimensions.snapInterval}
        snapToAlignment="start"
        decelerationRate={DECELERATION_RATE}
        // Scroll handling
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        // Layout
        getItemLayout={getItemLayout}
        initialScrollIndex={selectedIndex}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingHorizontal: dimensions.contentPaddingLeft,
            gap: CARD_GAP,
          },
        ]}
        // Performance optimizations
        removeClippedSubviews={Platform.OS !== 'web'}
        initialNumToRender={INITIAL_NUM_TO_RENDER}
        maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
        windowSize={WINDOW_SIZE}
        // Prevent vertical scroll interference
        nestedScrollEnabled={false}
        // Error handling for scroll to index
        onScrollToIndexFailed={(info) => {
          // Fallback: scroll to nearest valid index
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: Math.min(info.index, races.length - 1),
              animated: false,
            });
          }, 100);
        }}
      />

      {/* Navigation indicators */}
      {showIndicators && (
        <NavigationIndicators
          count={races.length}
          activeIndex={activeIndex}
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
  contentContainer: {
    alignItems: 'center',
  },
});

export default CardNavigationPager;
