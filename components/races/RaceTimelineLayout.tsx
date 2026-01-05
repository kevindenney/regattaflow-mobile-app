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

import React, { useCallback, useRef, useState, ReactElement } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { ZONE_HEIGHTS, type DetailCardType } from '@/constants/navigationAnimations';
import { DetailCardPager, DetailCardData } from './navigation/DetailCardPager';

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
  renderDetailCard?: (card: DetailCardData, index: number, isActive: boolean) => ReactElement;

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
}: RaceTimelineLayoutProps) {
  const flatListRef = useRef<FlatList>(null);
  const detailScrollRef = useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [activeDetailIndex, setActiveDetailIndex] = useState(0);

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
    return (
      <View style={[styles.cardContainer, { width: cardWidth }]}>
        {renderRaceCard(item, index)}
      </View>
    );
  }, [cardWidth, renderRaceCard]);

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

        {/* Timeline Indicators (dots) */}
        {races.length > 1 && (
          <View style={styles.timelineIndicators}>
            {races.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === selectedRaceIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
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
                  tintColor="#2563EB"
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
    backgroundColor: '#F9FAFB', // gray-50
  },

  // Hero Zone
  heroZone: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
    shadowColor: '#000',
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
  },

  // Timeline Indicators
  timelineIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB', // gray-300
  },
  indicatorActive: {
    backgroundColor: '#2563EB', // blue-600
    width: 24,
  },

  // Detail Zone
  detailZone: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    padding: 16,
    paddingBottom: 32,
  },
});

export default RaceTimelineLayout;
