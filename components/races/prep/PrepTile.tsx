/**
 * PrepTile - Reusable Apple Weather-inspired tile for Prep and Race tabs
 *
 * 155x155px pressable tile matching the Review tab pattern (DebriefTile, RaceResultTile).
 * Extracts the ~80 lines of boilerplate shared across all tiles into one wrapper.
 *
 * Features:
 * - AnimatedPressable with scale 0.96 spring animation + haptic feedback
 * - Green completion badge (top-right, 20px circle with checkmark)
 * - Header row: icon + uppercase label
 * - Body: flex: 1, justifyContent: center children slot
 * - Footer: blue 11px hint text
 * - Complete state styling (green-tinted border/background)
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  gray: '#8E8E93',
  gray5: '#E5E5EA',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

export interface PrepTileProps {
  /** Uppercase label shown in header */
  label: string;
  /** Icon component (from lucide-react-native) */
  icon: React.ComponentType<any>;
  /** Color for the header icon */
  iconColor: string;
  /** Whether this tile is complete */
  isComplete: boolean;
  /** Callback when tile is pressed */
  onPress: () => void;
  /** Blue hint text at the bottom */
  hint: string;
  /** Children rendered in the body area */
  children: React.ReactNode;
  /** Disable the tile (no press) */
  disabled?: boolean;
}

export function PrepTile({
  label,
  icon: Icon,
  iconColor,
  isComplete,
  onPress,
  hint,
  children,
  disabled,
}: PrepTileProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePress = () => {
    if (disabled) return;
    triggerHaptic('impactLight');
    onPress();
  };

  return (
    <AnimatedPressable
      style={[
        styles.tile,
        isComplete && styles.tileComplete,
        animatedStyle,
        Platform.OS !== 'web' && IOS_SHADOWS.card,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${isComplete ? 'Complete' : 'Not complete'}`}
    >
      {/* Completion badge */}
      {isComplete && (
        <View style={styles.completeBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <Icon size={12} color={iconColor} />
        <Text style={styles.headerLabel} numberOfLines={1}>{label}</Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {children}
      </View>

      {/* Footer */}
      <Text style={styles.hint} numberOfLines={1}>
        {hint}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    padding: 12,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
      },
      default: {},
    }),
  },
  tileComplete: {
    borderColor: `${COLORS.green}60`,
    backgroundColor: `${COLORS.green}06`,
  },
  completeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.blue,
  },
});

export default PrepTile;
