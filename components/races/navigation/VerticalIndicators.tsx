/**
 * VerticalIndicators Component
 *
 * Vertical position indicator for detail card navigation.
 * Shows card type icons with active state highlighting.
 * Positioned on the right edge of the detail zone.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import {
  DETAIL_CARD_TYPES,
  type DetailCardType,
} from '@/constants/navigationAnimations';

// =============================================================================
// TYPES
// =============================================================================

export interface VerticalIndicatorsProps {
  /** Current active card index (shared value for animations) */
  activeIndex: Animated.SharedValue<number>;
  /** Total number of cards */
  count: number;
  /** Card types in order */
  cardTypes?: DetailCardType[];
  /** Callback when indicator is pressed */
  onPress?: (index: number) => void;
  /** Active indicator color */
  activeColor?: string;
  /** Inactive indicator color */
  inactiveColor?: string;
  /** Whether to show labels */
  showLabels?: boolean;
}

// =============================================================================
// ICON MAPPING
// =============================================================================

const CARD_TYPE_ICONS: Record<DetailCardType, keyof typeof Ionicons.glyphMap> = {
  conditions: 'cloud-outline',
  strategy: 'compass-outline',
  rig: 'settings-outline',
  course: 'map-outline',
  fleet: 'boat-outline',
  regulatory: 'document-text-outline',
};

const CARD_TYPE_LABELS: Record<DetailCardType, string> = {
  conditions: 'Conditions',
  strategy: 'Strategy',
  rig: 'Rig',
  course: 'Course',
  fleet: 'Fleet',
  regulatory: 'Regulatory',
};

// =============================================================================
// ANIMATED INDICATOR
// =============================================================================

interface IndicatorItemProps {
  index: number;
  cardType: DetailCardType;
  activeIndex: Animated.SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
  showLabel: boolean;
  onPress?: () => void;
}

function IndicatorItem({
  index,
  cardType,
  activeIndex,
  activeColor,
  inactiveColor,
  showLabel,
  onPress,
}: IndicatorItemProps) {
  const animatedIconStyle = useAnimatedStyle(() => {
    const isActive = Math.round(activeIndex.value) === index;

    // Calculate distance from active (0 = active, 1 = adjacent, etc.)
    const distance = Math.abs(activeIndex.value - index);

    const scale = interpolate(
      distance,
      [0, 1, 2],
      [1.2, 1.0, 0.9],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      distance,
      [0, 1, 2],
      [1, 0.6, 0.4],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    const isActive = Math.round(activeIndex.value) === index;
    const distance = Math.abs(activeIndex.value - index);

    const backgroundColor = interpolateColor(
      distance,
      [0, 1],
      [activeColor + '20', 'transparent'] // 20 = 12% opacity
    );

    const borderColor = interpolateColor(
      distance,
      [0, 1],
      [activeColor, 'transparent']
    );

    return {
      backgroundColor,
      borderColor,
      borderWidth: distance < 0.5 ? 1 : 0,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndex.value - index);

    const opacity = interpolate(
      distance,
      [0, 0.5, 1],
      [1, 0.5, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  const iconName = CARD_TYPE_ICONS[cardType];
  const label = CARD_TYPE_LABELS[cardType];

  return (
    <Pressable onPress={onPress} style={styles.indicatorPressable}>
      <Animated.View style={[styles.indicatorContainer, animatedContainerStyle]}>
        <Animated.View style={animatedIconStyle}>
          <Ionicons
            name={iconName}
            size={18}
            color={inactiveColor}
          />
        </Animated.View>
        {showLabel && (
          <Animated.Text
            style={[
              styles.indicatorLabel,
              { color: inactiveColor },
              animatedTextStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function VerticalIndicators({
  activeIndex,
  count,
  cardTypes = DETAIL_CARD_TYPES.slice(0, count) as DetailCardType[],
  onPress,
  activeColor = '#2563EB',
  inactiveColor = '#6B7280',
  showLabels = false,
}: VerticalIndicatorsProps) {
  // Connection line animated style
  const connectionLineStyle = useAnimatedStyle(() => {
    const progress = activeIndex.value / Math.max(count - 1, 1);

    return {
      top: `${progress * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      {/* Connection line background */}
      <View style={[styles.connectionLine, { backgroundColor: inactiveColor + '30' }]} />

      {/* Active position marker */}
      <Animated.View
        style={[
          styles.activeMarker,
          { backgroundColor: activeColor },
          connectionLineStyle,
        ]}
      />

      {/* Indicators */}
      <View style={styles.indicatorsColumn}>
        {cardTypes.map((cardType, index) => (
          <IndicatorItem
            key={`indicator-${index}`}
            index={index}
            cardType={cardType}
            activeIndex={activeIndex}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            showLabel={showLabels}
            onPress={onPress ? () => onPress(index) : undefined}
          />
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
    position: 'absolute',
    right: 8,
    top: '10%',
    bottom: '10%',
    width: 44,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  connectionLine: {
    position: 'absolute',
    left: '50%',
    top: 12,
    bottom: 12,
    width: 2,
    marginLeft: -1,
    borderRadius: 1,
  },
  activeMarker: {
    position: 'absolute',
    left: '50%',
    width: 8,
    height: 8,
    marginLeft: -4,
    borderRadius: 4,
  },
  indicatorsColumn: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  indicatorPressable: {
    padding: 4,
  },
  indicatorContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorLabel: {
    fontSize: 8,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default VerticalIndicators;
