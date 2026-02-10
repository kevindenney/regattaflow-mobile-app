/**
 * FeatureLockIcon — Small lock badge overlay for premium features.
 *
 * Shows a lock icon on features gated behind `individual` or `team` tier.
 * Tapping triggers the contextual paywall modal.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import type { GatedFeature } from '@/lib/subscriptions/sailorTiers';

interface FeatureLockIconProps {
  /** The feature this lock gates. */
  feature: GatedFeature;
  /** Wraps children; shows lock badge overlay when feature is locked. */
  children: React.ReactNode;
  /** Optional context string for the upgrade prompt. */
  context?: string;
  /** Optional extra style for the container. */
  style?: ViewStyle;
}

export function FeatureLockIcon({
  feature,
  children,
  context,
  style,
}: FeatureLockIconProps) {
  const { checkFeature } = useFeatureGate();
  const { isAvailable, promptUpgrade } = checkFeature(feature);

  if (isAvailable) {
    // Feature is available — render children without lock
    return <>{children}</>;
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => promptUpgrade()}
      activeOpacity={0.8}
    >
      <View pointerEvents="none">{children}</View>
      <View style={styles.lockBadge}>
        <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
