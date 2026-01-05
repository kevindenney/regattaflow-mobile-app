/**
 * DetailStack Component (Shared/Web)
 *
 * Web-friendly version without gesture handler.
 * Uses click/tap to expand instead of swipe gesture.
 */

import React, { ReactElement, useCallback } from 'react';
import { Pressable, StyleSheet, View, ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
  Extrapolation,
} from 'react-native-reanimated';

import {
  CARD_SCALE,
  DETAIL_PARALLAX_FACTOR,
  DETAIL_CARD_TYPES,
  DetailCardType,
} from '@/constants/navigationAnimations';
import { UseDetailExpansionReturn } from '@/hooks/useDetailExpansion';

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
  /** Whether to show the expand button */
  showExpandButton?: boolean;
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
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    const startY = SCREEN_HEIGHT * 0.6;
    const endY = index * 16;

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
  onPress?: () => void;
}

function MainCardWrapper({ expansionProgress, children, onPress }: MainCardWrapperProps) {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    const scale = interpolate(
      expansionProgress.value,
      [0, 1],
      [CARD_SCALE.active, CARD_SCALE.expanded],
      Extrapolation.CLAMP
    );

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
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.mainCardWrapper, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// EXPAND BUTTON
// =============================================================================

interface ExpandButtonProps {
  isExpanded: boolean;
  onPress: () => void;
}

function ExpandButton({ isExpanded, onPress }: ExpandButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.expandButton}
      accessibilityRole="button"
      accessibilityLabel={isExpanded ? 'Collapse details' : 'Show details'}
    >
      <View
        style={[
          styles.expandIcon,
          isExpanded && styles.expandIconRotated,
        ]}
      />
    </Pressable>
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
  showExpandButton = true,
  testID,
}: DetailStackProps) {
  const {
    expansionProgress,
    isExpanded,
    toggle,
  } = detailState;

  const handleToggle = useCallback(() => {
    toggle();
  }, [toggle]);

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Main race card */}
      <MainCardWrapper
        expansionProgress={expansionProgress}
        onPress={handleToggle}
      >
        <>
          {mainCard}
          {/* Expand button */}
          {showExpandButton && (
            <ExpandButton
              isExpanded={isExpanded.value}
              onPress={handleToggle}
            />
          )}
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
  expandButton: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 11,
  },
  expandIcon: {
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#6B7280',
    transform: [{ rotate: '-45deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '135deg' }],
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
  },
});

export default DetailStack;
