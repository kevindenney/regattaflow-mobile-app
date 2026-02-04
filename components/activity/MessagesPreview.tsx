/**
 * MessagesPreview - iOS-style Messages Preview
 *
 * Compact preview of recent crew threads following Apple iOS design principles.
 * Styled like iOS Messages conversation list.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useCrewThreads } from '@/hooks/useCrewThreads';
import type { CrewThread } from '@/services/CrewThreadService';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

// =============================================================================
// TYPES
// =============================================================================

interface MessagesPreviewProps {
  /** Maximum threads to show */
  limit?: number;
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
// THREAD ROW
// =============================================================================

function ThreadRow({
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
        styles.threadRow,
        pressed && styles.threadRowPressed,
      ]}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{thread.avatarEmoji || '⛵'}</Text>
        </View>
        {hasUnread && <View style={styles.unreadIndicator} />}
      </View>

      {/* Content */}
      <View style={[styles.threadContent, !isLast && styles.threadContentBorder]}>
        <View style={styles.threadRow1}>
          <Text
            style={[styles.threadName, hasUnread && styles.threadNameUnread]}
            numberOfLines={1}
          >
            {thread.name}
          </Text>
          <View style={styles.threadMeta}>
            {thread.lastMessageAt && (
              <Text style={styles.threadTime}>
                {formatTimeAgo(thread.lastMessageAt)}
              </Text>
            )}
            <ChevronRight size={14} color={IOS_COLORS.tertiaryLabel} />
          </View>
        </View>
        <Text
          style={[styles.threadMessage, hasUnread && styles.threadMessageUnread]}
          numberOfLines={2}
        >
          {thread.lastMessage || 'No messages yet'}
        </Text>
      </View>
    </Pressable>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MessagesPreview({ limit = 3 }: MessagesPreviewProps) {
  const router = useRouter();
  const { threads, isLoading } = useCrewThreads();

  const displayThreads = threads.slice(0, limit);
  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  const handleThreadPress = useCallback(
    (thread: CrewThread) => {
      router.push(`/crew-thread/${thread.id}`);
    },
    [router]
  );

  const handleSeeAll = useCallback(() => {
    router.push('/messages');
  }, [router]);

  // Don't show section if no threads and not loading
  if (!isLoading && threads.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Pressable
        style={({ pressed }) => [
          styles.sectionHeader,
          pressed && styles.sectionHeaderPressed,
        ]}
        onPress={handleSeeAll}
      >
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {totalUnread > 99 ? '99+' : totalUnread}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.seeAllRow}>
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={16} color={IOS_COLORS.systemBlue} />
        </View>
      </Pressable>

      {/* Loading State */}
      {isLoading && threads.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={IOS_COLORS.systemGray} />
        </View>
      )}

      {/* Thread List */}
      {displayThreads.length > 0 && (
        <View style={styles.threadList}>
          {displayThreads.map((thread, index) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              onPress={() => handleThreadPress(thread)}
              isLast={index === displayThreads.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: IOS_SPACING.md,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  sectionHeaderPressed: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.4,
  },
  badge: {
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 15,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },

  // Loading
  loadingContainer: {
    paddingVertical: IOS_SPACING.xl,
    alignItems: 'center',
  },

  // Thread List
  threadList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },

  // Thread Row
  threadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  threadRowPressed: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    paddingVertical: IOS_SPACING.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: IOS_COLORS.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  unreadIndicator: {
    position: 'absolute',
    top: IOS_SPACING.sm,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: IOS_COLORS.systemBlue,
    borderWidth: 2,
    borderColor: IOS_COLORS.secondarySystemGroupedBackground,
  },

  // Content
  threadContent: {
    flex: 1,
    marginLeft: IOS_SPACING.md,
    paddingRight: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
  },
  threadContentBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  threadRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  threadName: {
    fontSize: 16,
    fontWeight: '400',
    color: IOS_COLORS.label,
    flex: 1,
    marginRight: IOS_SPACING.sm,
  },
  threadNameUnread: {
    fontWeight: '600',
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  threadTime: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  threadMessage: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  threadMessageUnread: {
    color: IOS_COLORS.label,
  },
});

export default MessagesPreview;
