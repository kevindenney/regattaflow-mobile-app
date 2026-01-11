/**
 * DetailCardPager (Native)
 *
 * Vertical card pager for race detail cards with:
 * - 85% height active card with peek of next
 * - Snap-to-card with spring physics
 * - Scale and opacity animations
 * - Haptic feedback at snap points
 * - Accordion-style card expansion (only one expanded at a time)
 *
 * Uses FlatList with Reanimated for smooth 60fps scrolling.
 */

import React, { useCallback, ReactElement, useMemo, useState } from 'react';
import { Platform, StyleSheet, View, ViewStyle, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  DECELERATION_RATE,
  INITIAL_NUM_TO_RENDER,
  MAX_TO_RENDER_PER_BATCH,
  WINDOW_SIZE,
  DETAIL_CARD_GAP,
  DETAIL_CARD_HEIGHT_RATIO,
  DETAIL_CARD_SCALE,
  DETAIL_CARD_OPACITY,
  DETAIL_CARD_TYPES,
  type DetailCardType,
} from '@/constants/navigationAnimations';
import { useDetailCardNavigation, DetailCard } from '@/hooks/useDetailCardNavigation';
import { IOS_COLORS } from '@/components/cards/constants';

// =============================================================================
// TYPES
// =============================================================================

export interface DetailCardData {
  type: DetailCardType;
  id: string;
  title: string;
  [key: string]: unknown;
}

/**
 * Options passed to renderCard for expansion state
 */
export interface RenderCardOptions {
  isExpanded: boolean;
  onToggle: () => void;
}

export interface DetailCardPagerProps {
  /** Array of detail cards to display */
  cards?: DetailCardData[];
  /** Height of the detail zone */
  zoneHeight: number;
  /** Currently selected card index */
  selectedIndex?: number;
  /** Render function for each detail card */
  renderCard: (
    card: DetailCardData,
    index: number,
    isActive: boolean,
    options?: RenderCardOptions
  ) => ReactElement;
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
  /** Whether haptics are enabled */
  enableHaptics?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// ANIMATED DETAIL CARD
// =============================================================================

interface AnimatedDetailCardProps {
  children: ReactElement;
  index: number;
  cardHeight: number;
  scrollOffset: Animated.SharedValue<number>;
  snapInterval: number;
  style?: ViewStyle;
  onPress?: () => void;
}

function AnimatedDetailCard({
  children,
  index,
  cardHeight,
  scrollOffset,
  snapInterval,
  style,
  onPress,
}: AnimatedDetailCardProps) {
  // Animated style based on scroll position
  const animatedStyle = useAnimatedStyle(() => {
    // Calculate position relative to current scroll (-1 = above, 0 = active, 1 = below)
    const inputRange = [
      (index - 1) * snapInterval,
      index * snapInterval,
      (index + 1) * snapInterval,
    ];

    const scale = interpolate(
      scrollOffset.value,
      inputRange,
      [DETAIL_CARD_SCALE.inactive, DETAIL_CARD_SCALE.active, DETAIL_CARD_SCALE.inactive],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollOffset.value,
      inputRange,
      [DETAIL_CARD_OPACITY.inactive, DETAIL_CARD_OPACITY.active, DETAIL_CARD_OPACITY.inactive],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        { minHeight: cardHeight },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

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
  enableHaptics = true,
  testID,
}: DetailCardPagerProps) {
  // Expansion state - only one card can be expanded at a time (accordion)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Use the navigation hook
  const {
    flatListRef,
    scrollOffset,
    activeIndex,
    cardHeight,
    snapInterval,
    contentPadding,
    scrollHandler,
    getItemLayout,
    handleMomentumScrollEnd,
    defaultDetailCards,
  } = useDetailCardNavigation({
    zoneHeight,
    initialIndex: selectedIndex,
    enableHaptics,
    onCardChange: (index, cardType) => {
      if (onCardChange) {
        onCardChange(index, cardType);
      }
    },
  });

  // Use provided cards or default
  const detailCards = useMemo(() => {
    return cards || defaultDetailCards;
  }, [cards, defaultDetailCards]);

  /**
   * Handle card expansion toggle (accordion behavior)
   * If the same card is tapped, collapse it
   * If a different card is tapped, collapse current and expand new
   */
  const handleToggleExpand = useCallback((cardId: string) => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedCardId((current) => (current === cardId ? null : cardId));
  }, [enableHaptics]);

  /**
   * Handle momentum scroll end to update active index
   */
  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      handleMomentumScrollEnd(offsetY);
    },
    [handleMomentumScrollEnd]
  );

  /**
   * Render a single detail card with animations
   */
  const renderItem = useCallback(
    ({ item, index }: { item: DetailCardData; index: number }) => {
      const isActive = Math.round(activeIndex.value) === index;
      const isExpanded = expandedCardId === item.id;

      return (
        <AnimatedDetailCard
          index={index}
          cardHeight={cardHeight}
          scrollOffset={scrollOffset}
          snapInterval={snapInterval}
          style={cardStyle}
          onPress={onCardPress ? () => onCardPress(index, item) : undefined}
        >
          {renderCard(item, index, isActive, {
            isExpanded,
            onToggle: () => handleToggleExpand(item.id),
          })}
        </AnimatedDetailCard>
      );
    },
    [
      cardHeight,
      scrollOffset,
      snapInterval,
      activeIndex,
      renderCard,
      onCardPress,
      cardStyle,
      expandedCardId,
      handleToggleExpand,
    ]
  );

  /**
   * Key extractor for FlatList
   */
  const keyExtractor = useCallback((item: DetailCardData, index: number) => {
    return item.id ?? `detail-${index}`;
  }, []);

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
      {/* Vertical detail card pager */}
      <Animated.FlatList
        ref={flatListRef}
        data={detailCards}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        extraData={expandedCardId}
        // Vertical scroll
        horizontal={false}
        showsVerticalScrollIndicator={false}
        // Allow immediate touch response on iOS (prevents FlatList from swallowing taps)
        delaysContentTouches={false}
        // Snap behavior
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate={DECELERATION_RATE}
        // Scroll handling
        onScroll={scrollHandler}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        // Layout
        getItemLayout={getItemLayout}
        initialScrollIndex={selectedIndex}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: contentPadding,
            paddingBottom: contentPadding,
            gap: DETAIL_CARD_GAP,
          },
        ]}
        // Performance optimizations
        removeClippedSubviews={Platform.OS !== 'web'}
        initialNumToRender={INITIAL_NUM_TO_RENDER}
        maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
        windowSize={WINDOW_SIZE}
        // Allow vertical scroll
        nestedScrollEnabled={true}
        // Error handling for scroll to index
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: Math.min(info.index, detailCards.length - 1),
              animated: false,
            });
          }, 100);
        }}
      />
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    overflow: 'hidden',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'stretch',
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: IOS_COLORS.systemBackground,
    shadowColor: IOS_COLORS.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
});

export default DetailCardPager;
