import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import {
  IOS_COLORS,
  IOS_SHADOWS,
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
  const handleSegmentPress = useCallback(
    (value: T) => {
      if (disabled) return;
      triggerHaptic('selection');
      onValueChange(value);
    },
    [disabled, onValueChange]
  );

  const segmentWidthPercent = `${(100 / segments.length).toFixed(2)}%` as `${number}%`;

  return (
    <View
      style={[
        styles.segmentedControl,
        disabled && styles.disabledContainer,
        style,
      ]}
    >
      {segments.map((segment) => {
        const isSelected = segment.value === selectedValue;
        return (
          <Pressable
            key={segment.value}
            style={[
              styles.tab,
              { width: segmentWidthPercent },
              isSelected && filled && styles.tabActive,
              isSelected && !filled && styles.selectedSegmentUnfilled,
              disabled && styles.tabDisabled,
            ]}
            onPress={() => handleSegmentPress(segment.value)}
            disabled={disabled}
          >
            {segment.icon && (
              <View style={styles.segmentIcon}>{segment.icon}</View>
            )}
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelActive : styles.labelInactive,
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

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.systemGray5,
    borderRadius: 8.91,
    padding: 2,
    height: 32,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  tab: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6.93,
    flexDirection: 'row',
  },
  tabActive: {
    backgroundColor: IOS_COLORS.systemBackground,
    ...IOS_SHADOWS.sm,
    shadowOpacity: 0.12,
    shadowRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tabDisabled: {
    opacity: 0.5,
  },
  selectedSegmentUnfilled: {
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 6,
  },
  segmentIcon: {
    marginRight: 4,
  },
  label: {
    fontSize: 13,
    letterSpacing: -0.08,
  },
  labelActive: {
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  labelInactive: {
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  disabledText: {
    color: IOS_COLORS.tertiaryLabel,
  },
});

export default IOSSegmentedControl;
