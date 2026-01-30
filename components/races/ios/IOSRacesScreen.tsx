/**
 * IOSRacesScreen - Full Screen Races View
 *
 * Award-winning Apple iOS design:
 * - Minimal header with large title
 * - Full-screen swipeable race cards
 * - Clean page indicator
 * - Smooth gestures and haptics
 */

import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Pressable,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';
import { triggerHaptic } from '@/lib/haptics';
import { IOSRaceCard } from './IOSRaceCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// Types
interface Race {
  id: string;
  name: string;
  venue?: string;
  date: string;
  startTime: string;
  raceType?: 'fleet' | 'distance' | 'match' | 'team';
  status: 'upcoming' | 'today' | 'past';
  daysUntil: number;
  hoursUntil?: number;
  minutesUntil?: number;
  wind?: { direction: string; speed: number };
  numberOfRaces?: number;
  progress?: number;
}

interface IOSRacesScreenProps {
  races: Race[];
  onRacePress?: (race: Race) => void;
  onAddRace?: () => void;
  onSettingsPress?: () => void;
  isLoading?: boolean;
}

/**
 * Minimal page indicator dots
 */
const PageIndicator: React.FC<{
  count: number;
  activeIndex: number;
  onDotPress?: (index: number) => void;
}> = ({ count, activeIndex, onDotPress }) => {
  if (count <= 1) return null;

  // Only show up to 5 dots, with ellipsis for more
  const maxDots = 5;
  const showEllipsis = count > maxDots;

  return (
    <View style={pageStyles.container}>
      {Array.from({ length: Math.min(count, maxDots) }).map((_, i) => {
        const isActive = i === activeIndex || (i === maxDots - 1 && activeIndex >= maxDots - 1);
        return (
          <Pressable
            key={i}
            onPress={() => {
              triggerHaptic('selection');
              onDotPress?.(i);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
          >
            <View
              style={[
                pageStyles.dot,
                isActive && pageStyles.dotActive,
              ]}
            />
          </Pressable>
        );
      })}
      {showEllipsis && (
        <Text style={pageStyles.more}>+{count - maxDots}</Text>
      )}
    </View>
  );
};

const pageStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: IOS_SPACING.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: IOS_COLORS.systemGray4,
  },
  dotActive: {
    width: 24,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 4,
  },
  more: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginLeft: 4,
  },
});

/**
 * Race count pill
 */
const RaceCountPill: React.FC<{
  current: number;
  total: number;
  upcoming: number;
}> = ({ current, total, upcoming }) => {
  return (
    <View style={pillStyles.container}>
      <Text style={pillStyles.current}>
        {current} of {total}
      </Text>
      <View style={pillStyles.divider} />
      <Text style={pillStyles.upcoming}>
        {upcoming} upcoming
      </Text>
    </View>
  );
};

const pillStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: IOS_RADIUS.full,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.xs,
  },
  current: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: IOS_COLORS.separator,
    marginHorizontal: IOS_SPACING.sm,
  },
  upcoming: {
    fontSize: 13,
    color: IOS_COLORS.systemBlue,
  },
});

/**
 * Empty state
 */
const EmptyState: React.FC<{ onAddRace?: () => void }> = ({ onAddRace }) => {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconContainer}>
        <Ionicons name="flag-outline" size={64} color={IOS_COLORS.systemGray3} />
      </View>
      <Text style={emptyStyles.title}>No Races Yet</Text>
      <Text style={emptyStyles.subtitle}>
        Add your first race to start preparing
      </Text>
      {onAddRace && (
        <Pressable
          style={({ pressed }) => [
            emptyStyles.addButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => {
            triggerHaptic('impactLight');
            onAddRace();
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={emptyStyles.addButtonText}>Add Race</Text>
        </Pressable>
      )}
    </View>
  );
};

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: IOS_SPACING.xxxl,
  },
  iconContainer: {
    marginBottom: IOS_SPACING.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.sm,
  },
  subtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    marginBottom: IOS_SPACING.xl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.xl,
    borderRadius: IOS_RADIUS.lg,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

/**
 * Main Races Screen Component
 */
export function IOSRacesScreen({
  races,
  onRacePress,
  onAddRace,
  onSettingsPress,
  isLoading = false,
}: IOSRacesScreenProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  // Calculate card dimensions
  const cardWidth = SCREEN_WIDTH;
  const cardHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 120; // Header + page indicator

  // Count upcoming races
  const upcomingCount = useMemo(() =>
    races.filter(r => r.status !== 'past').length,
    [races]
  );

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Handle scroll end to update active index
  const handleScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / cardWidth);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < races.length) {
      setActiveIndex(newIndex);
      triggerHaptic('selection');
    }
  }, [activeIndex, cardWidth, races.length]);

  // Scroll to specific race
  const scrollToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  }, []);

  // Render race card
  const renderRaceCard = useCallback(({ item, index }: { item: Race; index: number }) => {
    return (
      <View style={{ width: cardWidth, height: cardHeight, paddingVertical: IOS_SPACING.sm }}>
        <IOSRaceCard
          race={item}
          onPress={() => onRacePress?.(item)}
          isActive={index === activeIndex}
        />
      </View>
    );
  }, [cardWidth, cardHeight, activeIndex, onRacePress]);

  // Key extractor
  const keyExtractor = useCallback((item: Race) => item.id, []);

  // Get item layout for optimization
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: cardWidth,
    offset: cardWidth * index,
    index,
  }), [cardWidth]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Races</Text>
        </View>
        <View style={styles.headerRight}>
          {races.length > 0 && (
            <RaceCountPill
              current={activeIndex + 1}
              total={races.length}
              upcoming={upcomingCount}
            />
          )}
          <Pressable
            style={styles.headerButton}
            onPress={() => {
              triggerHaptic('impactLight');
              onAddRace?.();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add-circle" size={28} color={IOS_COLORS.systemBlue} />
          </Pressable>
        </View>
      </View>

      {/* Race Cards */}
      {races.length > 0 ? (
        <>
          <AnimatedFlatList
            ref={flatListRef}
            data={races}
            renderItem={renderRaceCard}
            keyExtractor={keyExtractor}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            onMomentumScrollEnd={handleScrollEnd}
            getItemLayout={getItemLayout}
            initialNumToRender={2}
            maxToRenderPerBatch={3}
            windowSize={5}
            decelerationRate="fast"
            snapToInterval={cardWidth}
            snapToAlignment="start"
          />

          {/* Page Indicator */}
          <View style={[styles.pageIndicatorContainer, { paddingBottom: FLOATING_TAB_BAR_HEIGHT + (insets.bottom || IOS_SPACING.lg) }]}>
            <PageIndicator
              count={races.length}
              activeIndex={activeIndex}
              onDotPress={scrollToIndex}
            />
          </View>
        </>
      ) : (
        <EmptyState onAddRace={onAddRace} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.md,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  headerButton: {
    padding: IOS_SPACING.xs,
  },

  // Page Indicator
  pageIndicatorContainer: {
    alignItems: 'center',
    paddingTop: IOS_SPACING.sm,
  },
});

export default IOSRacesScreen;
