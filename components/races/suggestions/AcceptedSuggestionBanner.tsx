/**
 * AcceptedSuggestionBanner
 *
 * Compact inline card (~48px) rendered below TileGrids to surface
 * accepted follower suggestions in the relevant race tab section.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import {
  CATEGORY_COLORS,
  type FollowerSuggestion,
} from '@/services/FollowerSuggestionService';

interface AcceptedSuggestionBannerProps {
  suggestion: FollowerSuggestion;
  onDismiss: (suggestionId: string) => void;
}

export function AcceptedSuggestionBanner({
  suggestion,
  onDismiss,
}: AcceptedSuggestionBannerProps) {
  const categoryColor = CATEGORY_COLORS[suggestion.category];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: categoryColor + '14' },
      ]}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarEmoji}>
          {suggestion.suggesterAvatarEmoji || '⛵'}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {suggestion.suggesterName || 'A sailor'}
        </Text>
        <Text style={styles.message} numberOfLines={1}>
          {suggestion.message}
        </Text>
      </View>
      <Pressable
        style={styles.dismissButton}
        onPress={() => onDismiss(suggestion.id)}
        hitSlop={8}
      >
        <X size={14} color="#8E8E93" />
      </Pressable>
    </View>
  );
}

interface AcceptedSuggestionBannerListProps {
  suggestions: FollowerSuggestion[];
  onDismiss: (suggestionId: string) => void;
}

export function AcceptedSuggestionBannerList({
  suggestions,
  onDismiss,
}: AcceptedSuggestionBannerListProps) {
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.list}>
      {suggestions.map((s) => (
        <AcceptedSuggestionBanner
          key={s.id}
          suggestion={s}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    minHeight: 48,
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3C3C43',
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    color: '#3C3C43',
    lineHeight: 18,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AcceptedSuggestionBanner;
