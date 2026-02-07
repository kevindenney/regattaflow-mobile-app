/**
 * MessagesPreviewList - Vertical Message Thread List
 *
 * iOS Messages-style vertical list of message threads.
 * Compact rows with avatar left, name + preview right, time far right.
 * Blue dot indicates unread messages (inline with avatar).
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
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

interface MessagesPreviewListProps {
  threads: CrewThread[];
  maxItems?: number;
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
// MESSAGE ROW
// =============================================================================

function MessageRow({
  thread,
  onPress,
  isLast,
}: {
  thread: CrewThread;
  onPress: () => void;
  isLast: boolean;
}) {
  const hasUnread = thread.unreadCount > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
    >
      {/* Left section: Unread dot + Avatar */}
      <View style={styles.leftSection}>
        {/* Unread dot - fixed width column */}
        <View style={styles.unreadColumn}>
          {hasUnread && <View style={styles.unreadDot} />}
        </View>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{thread.avatarEmoji || '⛵'}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={[styles.content, !isLast && styles.contentBorder]}>
        {/* Text column */}
        <View style={styles.textColumn}>
          <Text
            style={[styles.threadName, hasUnread && styles.threadNameUnread]}
            numberOfLines={1}
          >
            {thread.name}
          </Text>
          <Text style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} numberOfLines={1}>
            {thread.lastMessage || 'No messages yet'}
          </Text>
        </View>

        {/* Time */}
        {thread.lastMessageAt && (
          <Text style={[styles.time, hasUnread && styles.timeUnread]}>
            {formatTimeAgo(thread.lastMessageAt)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MessagesPreviewList({ threads, maxItems = 3 }: MessagesPreviewListProps) {
  const router = useRouter();

  const handleThreadPress = useCallback(
    (thread: CrewThread) => {
      router.push(`/crew-thread/${thread.id}`);
    },
    [router]
  );

  if (threads.length === 0) return null;

  const displayedThreads = threads.slice(0, maxItems);

  return (
    <View style={styles.container}>
      {displayedThreads.map((thread, index) => (
        <MessageRow
          key={thread.id}
          thread={thread}
          onPress={() => handleThreadPress(thread)}
          isLast={index === displayedThreads.length - 1}
        />
      ))}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const AVATAR_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    minHeight: 68,
  },
  rowPressed: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },

  // Left section containing unread dot and avatar
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: IOS_SPACING.sm,
  },

  // Unread indicator column - fixed width
  unreadColumn: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: IOS_COLORS.systemBlue,
  },

  // Avatar
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: IOS_COLORS.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: IOS_SPACING.sm,
  },
  avatarEmoji: {
    fontSize: 24,
  },

  // Content
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.sm,
    paddingRight: IOS_SPACING.lg,
    minHeight: 68,
  },
  contentBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },

  // Text column
  textColumn: {
    flex: 1,
    marginRight: IOS_SPACING.sm,
    justifyContent: 'center',
  },
  threadName: {
    fontSize: 16,
    fontWeight: '400',
    color: IOS_COLORS.label,
    marginBottom: 3,
  },
  threadNameUnread: {
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  lastMessageUnread: {
    color: IOS_COLORS.label,
  },

  // Time
  time: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
  },
  timeUnread: {
    color: IOS_COLORS.systemBlue,
  },
});

export default MessagesPreviewList;
