import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

interface Segment<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface IOSSegmentedControlProps<T extends string = string> {
  /** Array of segment options */
  segments: Segment<T>[];
  /** Currently selected segment value */
  selectedValue: T;
  /** Callback when selection changes */
  onValueChange: (value: T) => void;
  /** Size variant */
  size?: 'small' | 'regular' | 'large';
  /** Whether to use filled style (iOS 13+) */
  filled?: boolean;
  /** Additional container style */
  style?: ViewStyle;
  /** Whether the control is disabled */
  disabled?: boolean;
}

/**
 * iOS-style segmented control with animated selection indicator
 * Following Apple Human Interface Guidelines
 */
export function IOSSegmentedControl<T extends string = string>({
  segments,
  selectedValue,
  onValueChange,
  size = 'regular',
  filled = true,
  style,
  disabled = false,
}: IOSSegmentedControlProps<T>) {
  const selectedIndex = segments.findIndex((s) => s.value === selectedValue);
  const translateX = useSharedValue(0);
  const segmentWidths = useSharedValue<number[]>([]);
  const containerWidth = useSharedValue(0);

  const sizeStyles = getSizeStyles(size);

  useEffect(() => {
    if (segmentWidths.value.length > 0 && selectedIndex >= 0) {
      let offset = 0;
      for (let i = 0; i < selectedIndex; i++) {
        offset += segmentWidths.value[i] || 0;
      }
      translateX.value = withSpring(offset, IOS_ANIMATIONS.spring.snappy);
    }
  }, [selectedIndex, segmentWidths.value]);

  const handleSegmentPress = useCallback(
    (value: T) => {
      if (disabled) return;
      triggerHaptic('selection');
      onValueChange(value);
    },
    [disabled, onValueChange]
  );

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    containerWidth.value = event.nativeEvent.layout.width;
  }, []);

  const handleSegmentLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      segmentWidths.value = [...segmentWidths.value];
      segmentWidths.value[index] = width;
    },
    []
  );

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const currentWidth = segmentWidths.value[selectedIndex] || 0;
    return {
      transform: [{ translateX: translateX.value }],
      width: currentWidth,
    };
  });

  return (
    <View
      style={[
        styles.container,
        sizeStyles.container,
        filled && styles.filledContainer,
        disabled && styles.disabledContainer,
        style,
      ]}
      onLayout={handleContainerLayout}
    >
      {/* Animated selection indicator */}
      {filled && (
        <Animated.View
          style={[
            styles.indicator,
            sizeStyles.indicator,
            animatedIndicatorStyle,
          ]}
        />
      )}

      {/* Segment buttons */}
      {segments.map((segment, index) => {
        const isSelected = segment.value === selectedValue;
        return (
          <Pressable
            key={segment.value}
            style={[
              styles.segment,
              sizeStyles.segment,
              !filled && isSelected && styles.selectedSegmentUnfilled,
            ]}
            onPress={() => handleSegmentPress(segment.value)}
            onLayout={(e) => handleSegmentLayout(index, e)}
            disabled={disabled}
          >
            {segment.icon && (
              <View style={styles.segmentIcon}>{segment.icon}</View>
            )}
            <Text
              style={[
                styles.segmentText,
                sizeStyles.text,
                isSelected && styles.selectedText,
                disabled && styles.disabledText,
              ]}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getSizeStyles(size: 'small' | 'regular' | 'large') {
  switch (size) {
    case 'small':
      return {
        container: { height: 28, borderRadius: 7 },
        indicator: { borderRadius: 6 },
        segment: { paddingHorizontal: IOS_SPACING.sm },
        text: { fontSize: 13 },
      };
    case 'large':
      return {
        container: { height: 40, borderRadius: 9 },
        indicator: { borderRadius: 8 },
        segment: { paddingHorizontal: IOS_SPACING.lg },
        text: { fontSize: 15 },
      };
    case 'regular':
    default:
      return {
        container: { height: 32, borderRadius: 8 },
        indicator: { borderRadius: 7 },
        segment: { paddingHorizontal: IOS_SPACING.md },
        text: { fontSize: 13 },
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  filledContainer: {
    backgroundColor: IOS_COLORS.systemGray5,
    padding: 2,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  indicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    backgroundColor: IOS_COLORS.systemBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  selectedSegmentUnfilled: {
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 6,
  },
  segmentIcon: {
    marginRight: 4,
  },
  segmentText: {
    fontWeight: '500',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  selectedText: {
    fontWeight: '600',
  },
  disabledText: {
    color: IOS_COLORS.tertiaryLabel,
  },
});

export default IOSSegmentedControl;
