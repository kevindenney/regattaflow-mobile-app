/**
 * MessagesCarousel - Horizontal Scrolling Message Cards
 *
 * Apple-style horizontal scroll of message thread cards.
 * Like App Store "Today" cards or Apple TV show cards.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { CrewThread } from '@/services/CrewThreadService';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

// =============================================================================
// TYPES
// =============================================================================

interface MessagesCarouselProps {
  threads: CrewThread[];
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// =============================================================================
// MESSAGE CARD
// =============================================================================

function MessageCard({
  thread,
  onPress,
}: {
  thread: CrewThread;
  onPress: () => void;
}) {
  const hasUnread = thread.unreadCount > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{thread.avatarEmoji || '⛵'}</Text>
        </View>
        {hasUnread && <View style={styles.unreadDot} />}
      </View>

      {/* Content */}
      <Text
        style={[styles.threadName, hasUnread && styles.threadNameUnread]}
        numberOfLines={1}
      >
        {thread.name}
      </Text>
      <Text style={styles.lastMessage} numberOfLines={2}>
        {thread.lastMessage || 'No messages yet'}
      </Text>

      {/* Time */}
      {thread.lastMessageAt && (
        <Text style={styles.time}>{formatTimeAgo(thread.lastMessageAt)}</Text>
      )}
    </Pressable>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MessagesCarousel({ threads }: MessagesCarouselProps) {
  const router = useRouter();

  const handleThreadPress = useCallback(
    (thread: CrewThread) => {
      router.push(`/crew-thread/${thread.id}`);
    },
    [router]
  );

  if (threads.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + IOS_SPACING.sm}
      snapToAlignment="start"
    >
      {threads.map((thread) => (
        <MessageCard
          key={thread.id}
          thread={thread}
          onPress={() => handleThreadPress(thread)}
        />
      ))}
    </ScrollView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const CARD_WIDTH = 160;

const styles = StyleSheet.create({
  scrollContent: {
    paddingRight: IOS_SPACING.md,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.md,
    marginRight: IOS_SPACING.sm,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // Avatar
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: IOS_SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: IOS_COLORS.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: IOS_COLORS.systemBlue,
    marginLeft: IOS_SPACING.xs,
  },

  // Text
  threadName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  threadNameUnread: {
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 17,
    marginBottom: IOS_SPACING.xs,
  },
  time: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
});

export default MessagesCarousel;
