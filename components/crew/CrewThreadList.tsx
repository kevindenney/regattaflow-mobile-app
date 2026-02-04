/**
 * CrewThreadList
 *
 * List of crew conversation threads with unread badges.
 * Used in Messages screen and Messages preview in Activity inbox.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Users, ChevronRight, Plus } from 'lucide-react-native';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import { getInitials } from '@/components/account/accountStyles';
import type { CrewThread } from '@/services/CrewThreadService';
import { useAuth } from '@/providers/AuthProvider';

// =============================================================================
// TYPES
// =============================================================================

interface CrewThreadListProps {
  threads: CrewThread[];
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onCreateThread?: () => void;
  showCreateButton?: boolean;
  /** Limit number of threads shown (for preview mode) */
  limit?: number;
  /** Show "See all" link at bottom */
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  /** Compact mode for preview in Activity inbox */
  compact?: boolean;
  /** Search query to filter threads */
  searchQuery?: string;
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
  compact,
  currentUserId,
}: {
  thread: CrewThread;
  onPress: () => void;
  compact?: boolean;
  currentUserId?: string;
}) {
  const isDirectChat = thread.threadType === 'direct';
  const displayName = isDirectChat && thread.otherUser?.fullName
    ? thread.otherUser.fullName
    : thread.name;

  // For direct chats, show the other user's avatar; for groups, show emoji
  const renderAvatar = () => {
    if (isDirectChat && thread.otherUser) {
      const initials = getInitials(thread.otherUser.fullName || '?');
      return (
        <View
          style={[
            styles.avatar,
            compact && styles.avatarCompact,
            { backgroundColor: thread.otherUser.avatarColor || IOS_COLORS.systemGray4 },
          ]}
        >
          {thread.otherUser.avatarEmoji ? (
            <Text style={[styles.avatarEmoji, compact && styles.avatarEmojiCompact]}>
              {thread.otherUser.avatarEmoji}
            </Text>
          ) : (
            <Text style={styles.avatarInitials}>{initials}</Text>
          )}
        </View>
      );
    }

    return (
      <View style={[styles.avatar, compact && styles.avatarCompact]}>
        <Text style={[styles.avatarEmoji, compact && styles.avatarEmojiCompact]}>
          {thread.avatarEmoji || '⛵'}
        </Text>
      </View>
    );
  };

  // Format last message with sender prefix
  const formatLastMessage = () => {
    if (!thread.lastMessage) return null;

    // For direct chats, don't show prefix (it's obvious who sent it)
    if (isDirectChat) {
      const isFromMe = thread.lastMessageUserId === currentUserId;
      if (isFromMe) {
        return `You: ${thread.lastMessage}`;
      }
      return thread.lastMessage;
    }

    // For group chats, show "You:" prefix if sent by current user
    const isFromMe = thread.lastMessageUserId === currentUserId;
    if (isFromMe) {
      return `You: ${thread.lastMessage}`;
    }

    return thread.lastMessage;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.threadRow,
        compact && styles.threadRowCompact,
        pressed && styles.threadRowPressed,
      ]}
      onPress={onPress}
    >
      {/* Unread indicator (blue dot) */}
      {thread.unreadCount > 0 && <View style={styles.unreadDot} />}

      {/* Avatar */}
      {renderAvatar()}

      {/* Content */}
      <View style={styles.threadContent}>
        <View style={styles.threadHeader}>
          <Text
            style={[
              styles.threadName,
              compact && styles.threadNameCompact,
              thread.unreadCount > 0 && styles.threadNameUnread,
            ]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {thread.lastMessageAt && (
            <Text
              style={[
                styles.threadTime,
                thread.unreadCount > 0 && styles.threadTimeUnread,
              ]}
            >
              {formatTimeAgo(thread.lastMessageAt)}
            </Text>
          )}
        </View>

        <View style={styles.threadFooter}>
          <View style={styles.threadInfo}>
            {thread.lastMessage ? (
              <Text
                style={[
                  styles.lastMessage,
                  thread.unreadCount > 0 && styles.lastMessageUnread,
                ]}
                numberOfLines={1}
              >
                {formatLastMessage()}
              </Text>
            ) : (
              <Text style={styles.noMessages}>No messages yet</Text>
            )}
          </View>

          <View style={styles.threadMeta}>
            {thread.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                </Text>
              </View>
            )}
            <ChevronRight size={16} color={IOS_COLORS.tertiaryLabel} />
          </View>
        </View>

        {!compact && !isDirectChat && (
          <View style={styles.memberRow}>
            <Users size={12} color={IOS_COLORS.tertiaryLabel} />
            <Text style={styles.memberCount}>
              {thread.memberCount || 1} member{(thread.memberCount || 1) !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CrewThreadList({
  threads,
  isLoading = false,
  onRefresh,
  isRefreshing = false,
  onCreateThread,
  showCreateButton = true,
  limit,
  showSeeAll = false,
  onSeeAll,
  compact = false,
  searchQuery = '',
}: CrewThreadListProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Filter by search query
  const filteredThreads = searchQuery.trim()
    ? threads.filter((t) => {
        const searchLower = searchQuery.toLowerCase();
        // Search thread name
        if (t.name.toLowerCase().includes(searchLower)) return true;
        // Search other user name for direct chats
        if (t.otherUser?.fullName?.toLowerCase().includes(searchLower)) return true;
        // Search last message
        if (t.lastMessage?.toLowerCase().includes(searchLower)) return true;
        return false;
      })
    : threads;

  const displayThreads = limit ? filteredThreads.slice(0, limit) : filteredThreads;

  const handleThreadPress = useCallback(
    (thread: CrewThread) => {
      router.push(`/crew-thread/${thread.id}`);
    },
    [router]
  );

  const renderThread = useCallback(
    ({ item }: { item: CrewThread }) => (
      <ThreadRow
        thread={item}
        onPress={() => handleThreadPress(item)}
        compact={compact}
        currentUserId={user?.id}
      />
    ),
    [handleThreadPress, compact, user?.id]
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>👥</Text>
        <Text style={styles.emptyTitle}>No crew threads yet</Text>
        <Text style={styles.emptySubtitle}>
          Create a thread to start chatting with your crew
        </Text>
        {showCreateButton && onCreateThread && (
          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.createButtonPressed,
            ]}
            onPress={onCreateThread}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.createButtonText}>New Thread</Text>
          </Pressable>
        )}
      </View>
    );
  }, [isLoading, showCreateButton, onCreateThread]);

  const renderHeader = useCallback(() => {
    if (!showCreateButton || !onCreateThread || compact) return null;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.newThreadRow,
          pressed && styles.newThreadRowPressed,
        ]}
        onPress={onCreateThread}
      >
        <View style={styles.newThreadIcon}>
          <Plus size={20} color={IOS_COLORS.systemBlue} />
        </View>
        <Text style={styles.newThreadText}>New Thread</Text>
      </Pressable>
    );
  }, [showCreateButton, onCreateThread, compact]);

  const renderFooter = useCallback(() => {
    if (!showSeeAll || !onSeeAll || displayThreads.length === 0) return null;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.seeAllRow,
          pressed && styles.seeAllRowPressed,
        ]}
        onPress={onSeeAll}
      >
        <Text style={styles.seeAllText}>See all messages</Text>
        <ChevronRight size={16} color={IOS_COLORS.systemBlue} />
      </Pressable>
    );
  }, [showSeeAll, onSeeAll, displayThreads.length]);

  return (
    <FlatList
      data={displayThreads}
      keyExtractor={(item) => item.id}
      renderItem={renderThread}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={[
        styles.listContent,
        displayThreads.length === 0 && styles.listContentEmpty,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={IOS_COLORS.systemBlue}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  listContentEmpty: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IOS_SPACING.xxxl,
  },

  // Thread row
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    gap: IOS_SPACING.md,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    left: 6,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: IOS_COLORS.systemBlue,
  },
  threadRowCompact: {
    paddingVertical: IOS_SPACING.sm,
  },
  threadRowPressed: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: IOS_COLORS.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  avatarEmojiCompact: {
    fontSize: 20,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  threadContent: {
    flex: 1,
    gap: 2,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadName: {
    ...IOS_TYPOGRAPHY.body,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  threadNameCompact: {
    ...IOS_TYPOGRAPHY.subhead,
  },
  threadNameUnread: {
    fontWeight: '700',
  },
  threadTime: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.tertiaryLabel,
    marginLeft: IOS_SPACING.sm,
  },
  threadTimeUnread: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
  threadFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadInfo: {
    flex: 1,
  },
  lastMessage: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
  },
  lastMessageUnread: {
    color: IOS_COLORS.label,
    fontWeight: '500',
  },
  noMessages: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  unreadBadge: {
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  memberCount: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.tertiaryLabel,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 80, // Align with content after avatar
  },

  // New thread row
  newThreadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    gap: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  newThreadRowPressed: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  newThreadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: IOS_COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newThreadText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },

  // See all row
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IOS_SPACING.md,
    gap: IOS_SPACING.xs,
  },
  seeAllRowPressed: {
    opacity: 0.7,
  },
  seeAllText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: IOS_SPACING.xxl,
    gap: IOS_SPACING.sm,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: IOS_SPACING.sm,
  },
  emptyTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.lg,
    marginTop: IOS_SPACING.md,
    gap: IOS_SPACING.xs,
  },
  createButtonPressed: {
    opacity: 0.8,
  },
  createButtonText: {
    ...IOS_TYPOGRAPHY.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CrewThreadList;
