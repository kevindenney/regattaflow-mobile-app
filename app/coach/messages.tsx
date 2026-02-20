/**
 * Messages Screen (Inbox)
 *
 * Shows all messaging conversations for the current user.
 * Works for both coaches and sailors.
 */

import React, { useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

import { useAuth } from '@/providers/AuthProvider';
import { useConversations } from '@/hooks/useMessaging';
import type { CoachingConversation } from '@/services/MessagingService';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { conversations, loading, refresh } = useConversations(user?.id);

  const handleOpenConversation = useCallback(
    (conversationId: string) => {
      router.push(`/coach/conversation/${conversationId}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: CoachingConversation }) => {
      const isCoach = item.coach_id === user?.id;
      const unreadCount = isCoach ? item.coach_unread_count : item.sailor_unread_count;
      const name = item.other_user?.full_name || item.other_user?.email || 'Unknown';
      const initials = getInitials(name);
      const timeAgo = item.last_message_at
        ? formatDistanceToNow(new Date(item.last_message_at), { addSuffix: true })
        : '';

      return (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.6}
          onPress={() => handleOpenConversation(item.id)}
        >
          {/* Avatar */}
          <View style={[styles.avatar, unreadCount > 0 && styles.avatarUnread]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* Content */}
          <View style={styles.rowContent}>
            <View style={styles.rowHeader}>
              <Text
                style={[styles.name, unreadCount > 0 && styles.nameUnread]}
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text style={styles.time}>{timeAgo}</Text>
            </View>
            <View style={styles.rowFooter}>
              <Text
                style={[styles.preview, unreadCount > 0 && styles.previewUnread]}
                numberOfLines={2}
              >
                {item.last_message_preview || 'No messages yet'}
              </Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [user?.id, handleOpenConversation]
  );

  const keyExtractor = useCallback((item: CoachingConversation) => item.id, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Ionicons
                name="chatbubbles-outline"
                size={56}
                color={IOS_COLORS.systemGray3}
              />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Start a conversation with your coach or client.
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] || '?').toUpperCase();
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: IOS_COLORS.systemGray5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarUnread: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '400',
    color: IOS_COLORS.label,
    flex: 1,
    marginRight: 8,
  },
  nameUnread: {
    fontWeight: '600',
  },
  time: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  preview: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
    marginRight: 8,
    lineHeight: 19,
  },
  previewUnread: {
    color: IOS_COLORS.label,
  },
  badge: {
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 76, // avatar width + margin
  },
});
