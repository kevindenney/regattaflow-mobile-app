/**
 * DetailStack Component (Native)
 *
 * Vertical detail card expansion with pan gesture.
 * When expanded:
 * - Main card scales to 0.95 and translates up
 * - Detail cards rise from below with parallax
 * - Cards: Strategy, Rig/Tuning, Marks/Course, Performance
 */

import React, { ReactElement, useCallback } from 'react';
import { Dimensions, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
  Extrapolation,
} from 'react-native-reanimated';

import {
  CARD_SCALE,
  DETAIL_PARALLAX_FACTOR,
  GESTURE_ACTIVE_OFFSET,
  DETAIL_CARD_TYPES,
  DetailCardType,
} from '@/constants/navigationAnimations';
import { useDetailExpansion, UseDetailExpansionReturn } from '@/hooks/useDetailExpansion';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

export interface DetailStackProps {
  /** The main race card content */
  mainCard: ReactElement;
  /** Render function for detail cards */
  renderDetailCard: (type: DetailCardType, index: number) => ReactElement;
  /** Detail expansion state (from useDetailExpansion hook) */
  detailState: UseDetailExpansionReturn;
  /** Container style */
  style?: ViewStyle;
  /** Whether to show the swipe-up handle affordance */
  showHandle?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// DETAIL CARD WRAPPER
// =============================================================================

interface DetailCardWrapperProps {
  index: number;
  expansionProgress: SharedValue<number>;
  children: ReactElement;
}

function DetailCardWrapper({
  index,
  expansionProgress,
  children,
}: DetailCardWrapperProps) {
  /**
   * Animated style for individual detail card
   * Cards slide up from below with staggered timing
   */
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    // Start position below screen
    const startY = SCREEN_HEIGHT * 0.6;
    // End position with stagger (each card slightly lower)
    const endY = index * 16; // 16px offset per card

    // Staggered animation: each card starts slightly later
    const staggerOffset = index * 0.1;
    const adjustedProgress = Math.max(
      0,
      Math.min(1, (expansionProgress.value - staggerOffset) / (1 - staggerOffset))
    );

    const translateY = interpolate(
      adjustedProgress,
      [0, 1],
      [startY, endY],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      adjustedProgress,
      [0, 0.3, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.detailCard, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// =============================================================================
// MAIN CARD WRAPPER
// =============================================================================

interface MainCardWrapperProps {
  expansionProgress: SharedValue<number>;
  children: ReactElement;
}

function MainCardWrapper({ expansionProgress, children }: MainCardWrapperProps) {
  /**
   * Animated style for main card during expansion
   * Scales down and translates up
   */
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    const scale = interpolate(
      expansionProgress.value,
      [0, 1],
      [CARD_SCALE.active, CARD_SCALE.expanded],
      Extrapolation.CLAMP
    );

    // Translate up to make room for detail cards
    // Uses parallax factor for subtle movement
    const translateY = interpolate(
      expansionProgress.value,
      [0, 1],
      [0, -SCREEN_HEIGHT * 0.15 * DETAIL_PARALLAX_FACTOR],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  return (
    <Animated.View style={[styles.mainCardWrapper, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// =============================================================================
// SWIPE HANDLE
// =============================================================================

interface SwipeHandleProps {
  expansionProgress: SharedValue<number>;
}

function SwipeHandle({ expansionProgress }: SwipeHandleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    // Rotate handle when expanded (points down)
    const rotate = interpolate(
      expansionProgress.value,
      [0, 1],
      [0, 180],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      expansionProgress.value,
      [0, 0.5],
      [1, 0.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ rotate: `${rotate}deg` }],
      opacity,
    };
  });

  return (
    <View style={styles.handleContainer}>
      <Animated.View style={[styles.handle, animatedStyle]}>
        <View style={styles.handleBar} />
      </Animated.View>
    </View>
  );
}

// =============================================================================
// DETAIL STACK
// =============================================================================

export function DetailStack({
  mainCard,
  renderDetailCard,
  detailState,
  style,
  showHandle = true,
  testID,
}: DetailStackProps) {
  const {
    expansionProgress,
    isExpanded,
    handlePanUpdate,
    handlePanEnd,
  } = detailState;

  /**
   * Pan gesture for vertical swipe
   */
  const panGesture = Gesture.Pan()
    .activeOffsetY([-GESTURE_ACTIVE_OFFSET, GESTURE_ACTIVE_OFFSET])
    .onUpdate((event) => {
      'worklet';
      handlePanUpdate(event.translationY, event.velocityY);
    })
    .onEnd((event) => {
      'worklet';
      handlePanEnd(event.translationY, event.velocityY);
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.container, style]} testID={testID}>
        {/* Main race card */}
        <MainCardWrapper expansionProgress={expansionProgress}>
          <>
            {mainCard}
            {/* Swipe handle */}
            {showHandle && <SwipeHandle expansionProgress={expansionProgress} />}
          </>
        </MainCardWrapper>

        {/* Detail cards stack */}
        <View style={styles.detailCardsContainer}>
          {DETAIL_CARD_TYPES.map((type, index) => (
            <DetailCardWrapper
              key={type}
              index={index}
              expansionProgress={expansionProgress}
            >
              {renderDetailCard(type, index)}
            </DetailCardWrapper>
          ))}
        </View>
      </View>
    </GestureDetector>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  mainCardWrapper: {
    zIndex: 10,
  },
  handleContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 11,
  },
  handle: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB', // gray-300
  },
  detailCardsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  detailCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    // Height will be determined by content
  },
});

export default DetailStack;
