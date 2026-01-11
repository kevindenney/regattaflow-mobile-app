/**
 * RaceTimelineLayout Component
 *
 * Two-zone layout for the races screen:
 * - Hero Zone (58%): Horizontal race card timeline
 * - Detail Zone (42%): Vertical snapping detail cards
 *
 * Navigation:
 * - Horizontal swipe: Navigate between races
 * - Vertical swipe: Navigate between detail cards (with card pager mode)
 */

import React, { useCallback, useRef, useState, useEffect, ReactElement } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronUp } from 'lucide-react-native';

import { ZONE_HEIGHTS, type DetailCardType } from '@/constants/navigationAnimations';
import { IOS_COLORS } from '@/components/cards/constants';
import { DetailCardPager, DetailCardData, RenderCardOptions } from './navigation/DetailCardPager';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Layout constants
const HEADER_HEIGHT = 100; // Approximate header height including safe area
const HERO_RATIO = ZONE_HEIGHTS.hero.normal; // 58% for hero zone
const DETAIL_RATIO = ZONE_HEIGHTS.detail.normal; // 42% for detail zone
const CARD_GAP = 16;
const HORIZONTAL_PADDING = 16;

interface RaceTimelineLayoutProps {
  // Race cards data
  races: any[];
  selectedRaceIndex: number;
  onRaceChange: (index: number) => void;

  // Render functions
  renderRaceCard: (race: any, index: number) => React.ReactNode;
  /** Legacy: Render all detail content as scrollable content */
  renderDetailContent?: () => React.ReactNode;
  /** New: Render individual detail cards for card pager mode */
  renderDetailCard?: (card: DetailCardData, index: number, isActive: boolean, options?: RenderCardOptions) => ReactElement;

  // Detail cards data (for card pager mode)
  detailCards?: DetailCardData[];
  /** Callback when detail card changes (card pager mode) */
  onDetailCardChange?: (index: number, cardType: DetailCardType) => void;

  // Optional props
  refreshing?: boolean;
  onRefresh?: () => void;
  headerContent?: React.ReactNode;
  cardWidth?: number;
  /** Use card pager mode for detail zone instead of scroll view */
  useCardPagerMode?: boolean;
  /** Enable haptics (default: true) */
  enableHaptics?: boolean;
  /** Index of the next upcoming race (for jump-to-next FAB) */
  nextRaceIndex?: number;
}

export function RaceTimelineLayout({
  races,
  selectedRaceIndex,
  onRaceChange,
  renderRaceCard,
  renderDetailContent,
  renderDetailCard,
  detailCards,
  onDetailCardChange,
  refreshing = false,
  onRefresh,
  headerContent,
  cardWidth: propCardWidth,
  useCardPagerMode = false,
  enableHaptics = true,
  nextRaceIndex,
}: RaceTimelineLayoutProps) {
  // Debug props - CRITICAL LOG
  console.log('🔷🔷🔷 [RaceTimelineLayout] RENDER 🔷🔷🔷', {
    useCardPagerMode,
    hasRenderDetailCard: !!renderDetailCard,
    detailCardsLength: detailCards?.length ?? 'undefined',
    racesLength: races.length,
    selectedRaceIndex,
    nextRaceIndex,
  });

  const flatListRef = useRef<FlatList>(null);
  const detailScrollRef = useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [activeDetailIndex, setActiveDetailIndex] = useState(0);

  // Track if this is initial mount to avoid redundant scroll
  const hasMountedRef = useRef(false);
  const prevSelectedIndexRef = useRef(selectedRaceIndex);

  // Scroll to selected race when it changes (handles async data loading)
  useEffect(() => {
    // Skip if races not yet loaded
    if (races.length === 0) return;

    // On first mount, FlatList's initialScrollIndex handles it
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevSelectedIndexRef.current = selectedRaceIndex;
      return;
    }

    // Only scroll if index actually changed (not from our own scroll events)
    if (prevSelectedIndexRef.current !== selectedRaceIndex) {
      prevSelectedIndexRef.current = selectedRaceIndex;

      // Small delay to ensure FlatList is ready
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedRaceIndex,
          animated: true,
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedRaceIndex, races.length]);

  // FAB visibility animation
  const fabOpacity = useRef(new Animated.Value(0)).current;

  // Determine if FAB should be visible (2+ cards away from next race)
  const showJumpFab = nextRaceIndex !== undefined &&
    Math.abs(selectedRaceIndex - nextRaceIndex) >= 2;

  // Animate FAB visibility
  useEffect(() => {
    Animated.spring(fabOpacity, {
      toValue: showJumpFab ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [showJumpFab, fabOpacity]);

  // Handle jump to next race
  const handleJumpToNext = useCallback(() => {
    if (nextRaceIndex === undefined) return;

    if (enableHaptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    flatListRef.current?.scrollToIndex({
      index: nextRaceIndex,
      animated: true,
    });
    onRaceChange(nextRaceIndex);
  }, [nextRaceIndex, enableHaptics, onRaceChange]);

  // Calculate available height (screen minus header)
  const availableHeight = SCREEN_HEIGHT - HEADER_HEIGHT;
  const heroZoneHeight = availableHeight * HERO_RATIO;
  const detailZoneHeight = availableHeight * DETAIL_RATIO;

  // Card dimensions
  const cardWidth = propCardWidth ?? (SCREEN_WIDTH - HORIZONTAL_PADDING * 2);
  const snapInterval = cardWidth + CARD_GAP;

  // Handle race change when scrolling stops
  const handleMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / snapInterval);

    if (newIndex !== selectedRaceIndex && newIndex >= 0 && newIndex < races.length) {
      // Haptic feedback on race change
      if (enableHaptics && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onRaceChange(newIndex);

      // Reset detail scroll/pager to first card when race changes
      if (!useCardPagerMode) {
        detailScrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      setActiveDetailIndex(0);
    }
  }, [selectedRaceIndex, races.length, snapInterval, onRaceChange, enableHaptics, useCardPagerMode]);

  // Handle detail card change (card pager mode)
  const handleDetailCardChange = useCallback((index: number, cardType: DetailCardType) => {
    setActiveDetailIndex(index);
    onDetailCardChange?.(index, cardType);
  }, [onDetailCardChange]);

  // Scroll to specific race index
  const scrollToRace = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  }, []);

  // Render individual race card
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const isNextRace = index === nextRaceIndex;

    // Debug: Always log to see what's happening
    console.log('⭐⭐⭐ [RaceTimelineLayout] renderItem ⭐⭐⭐', {
      index,
      nextRaceIndex,
      isNextRace,
      itemName: item?.data?.name || item?.name || 'unknown',
    });

    return (
      <View style={[styles.cardContainer, { width: cardWidth }]}>
        {/* Tufte: Trust the timeline metaphor - position indicates next race */}
        {renderRaceCard(item, index)}
      </View>
    );
  }, [cardWidth, renderRaceCard, nextRaceIndex]);

  // Key extractor
  const keyExtractor = useCallback((item: any, index: number) => {
    return item.id || `race-${index}`;
  }, []);

  // Get item layout for optimized scrolling
  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: cardWidth + CARD_GAP,
    offset: (cardWidth + CARD_GAP) * index,
    index,
  }), [cardWidth]);

  return (
    <View style={styles.container}>
      {/* Hero Zone - Horizontal Race Timeline (60%) */}
      <View style={[styles.heroZone, { height: heroZoneHeight }]}>
        {headerContent}

        <FlatList
          ref={flatListRef}
          data={races}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={snapInterval}
          snapToAlignment="start"
          decelerationRate="fast"
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollBeginDrag={() => setIsScrolling(true)}
          onScrollEndDrag={() => setIsScrolling(false)}
          getItemLayout={getItemLayout}
          initialScrollIndex={selectedRaceIndex}
          contentContainerStyle={styles.raceCardsContent}
          // Performance optimizations
          removeClippedSubviews={Platform.OS !== 'web'}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={3}
        />

        {/* Timeline Indicators removed - season header provides temporal context */}

        {/* Jump to Next Race FAB */}
        {nextRaceIndex !== undefined && (
          <Animated.View
            style={[
              styles.jumpFab,
              {
                opacity: fabOpacity,
                transform: [{
                  scale: fabOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
              },
            ]}
            pointerEvents={showJumpFab ? 'auto' : 'none'}
          >
            <TouchableOpacity
              onPress={handleJumpToNext}
              style={styles.jumpFabButton}
              activeOpacity={0.8}
            >
              <ChevronUp size={16} color={IOS_COLORS.systemBackground} strokeWidth={2.5} />
              <Text style={styles.jumpFabText}>Next</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Detail Zone - Vertical Scroll/Card Pager (42%) */}
      <View style={[styles.detailZone, { height: detailZoneHeight }]}>
        {useCardPagerMode && renderDetailCard ? (
          // New: Card pager mode with snapping detail cards
          <DetailCardPager
            cards={detailCards}
            zoneHeight={detailZoneHeight}
            selectedIndex={activeDetailIndex}
            renderCard={renderDetailCard}
            onCardChange={handleDetailCardChange}
            enableHaptics={enableHaptics}
            testID="detail-card-pager"
          />
        ) : (
          // Legacy: Scrollable detail content
          <ScrollView
            ref={detailScrollRef}
            style={styles.detailScroll}
            contentContainerStyle={styles.detailContent}
            showsVerticalScrollIndicator={true}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={IOS_COLORS.blue}
                />
              ) : undefined
            }
          >
            {renderDetailContent?.()}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },

  // Hero Zone
  heroZone: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.separator,
    shadowColor: IOS_COLORS.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  raceCardsContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: CARD_GAP,
    alignItems: 'center',
  },
  cardContainer: {
    justifyContent: 'center',
    overflow: 'visible',
  },

  // Detail Zone
  detailZone: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Jump to Next FAB
  jumpFab: {
    position: 'absolute',
    bottom: 48, // Above timeline indicators
    right: 16,
  },
  jumpFabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
    shadowColor: IOS_COLORS.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  jumpFabText: {
    color: IOS_COLORS.systemBackground,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default RaceTimelineLayout;
