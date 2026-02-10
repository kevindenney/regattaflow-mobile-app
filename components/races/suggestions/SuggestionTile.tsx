/**
 * SuggestionTile — 155x155px tile for displaying a follower suggestion
 *
 * Matches the Apple Weather tile pattern used in TileGrid.
 * Shows category icon, suggester first name, and message preview.
 * Tap opens SuggestionDetailSheet.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { triggerHaptic } from '@/lib/haptics';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  type FollowerSuggestion,
} from '@/services/FollowerSuggestionService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SuggestionTileProps {
  suggestion: FollowerSuggestion;
  onPress: (suggestion: FollowerSuggestion) => void;
}

export function SuggestionTile({ suggestion, onPress }: SuggestionTileProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    triggerHaptic('selection');
    onPress(suggestion);
  }, [onPress, suggestion]);

  const iconName = CATEGORY_ICONS[suggestion.category];
  const color = CATEGORY_COLORS[suggestion.category];
  const categoryLabel = CATEGORY_LABELS[suggestion.category];
  const firstName = suggestion.suggesterName?.split(' ')[0] ?? 'Someone';

  return (
    <AnimatedPressable
      style={[styles.tile, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Category icon + label header */}
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: color + '20' }]}>
          <Ionicons name={iconName as any} size={16} color={color} />
        </View>
        <Text style={[styles.categoryLabel, { color }]} numberOfLines={1}>
          {categoryLabel}
        </Text>
      </View>

      {/* Message preview */}
      <Text style={styles.message} numberOfLines={4}>
        {suggestion.message}
      </Text>

      {/* Footer: suggester name */}
      <View style={styles.footer}>
        <View
          style={[
            styles.miniAvatar,
            { backgroundColor: suggestion.suggesterAvatarColor || '#E5E5EA' },
          ]}
        >
          <Text style={styles.miniAvatarEmoji}>
            {suggestion.suggesterAvatarEmoji || '⛵'}
          </Text>
        </View>
        <Text style={styles.suggesterName} numberOfLines={1}>
          {firstName}
        </Text>
      </View>

      {/* New indicator dot */}
      <View style={[styles.newDot, { backgroundColor: color }]} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 155,
    height: 155,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    flex: 1,
  },
  message: {
    fontSize: 13,
    lineHeight: 17,
    color: '#3C3C43',
    flex: 1,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarEmoji: {
    fontSize: 10,
  },
  suggesterName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    flex: 1,
  },
  newDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default SuggestionTile;
