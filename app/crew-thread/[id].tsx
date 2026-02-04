/**
 * Crew Thread Chat Screen
 *
 * Full-screen chat interface for a crew thread conversation.
 * Supports light and dark mode via useIOSColors hook.
 */

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Users,
  MoreHorizontal,
  UserPlus,
  Trash2,
  Edit3,
  LogOut,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useCrewThreadMessages } from '@/hooks/useCrewThreadMessages';
import { useIOSColors } from '@/hooks/useIOSColors';
import { CrewThreadService, CrewThread } from '@/services/CrewThreadService';
import { CrewThreadChat } from '@/components/crew/CrewThreadChat';
import { IOSActionSheet, ActionSheetAction } from '@/components/ui/IOSActionSheet';
import { ThreadMembersModal } from '@/components/crew/ThreadMembersModal';
import { AddMemberModal } from '@/components/crew/AddMemberModal';
import {
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

export default function CrewThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useIOSColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [thread, setThread] = useState<CrewThread | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const {
    messages,
    isLoading: isLoadingMessages,
    sendMessage,
    deleteMessage,
    isSending,
    hasMore,
    isLoadingMore,
    loadMore,
  } = useCrewThreadMessages({ threadId: id });

  // Fetch thread details
  useEffect(() => {
    if (!id) return;

    const fetchThread = async () => {
      setIsLoadingThread(true);
      const threadData = await CrewThreadService.getThread(id);
      setThread(threadData);
      setIsLoadingThread(false);
    };

    fetchThread();
  }, [id]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/messages');
    }
  }, [router]);

  const handleViewMembers = useCallback(() => {
    setShowOptions(false);
    // Small delay to let action sheet close first
    setTimeout(() => setShowMembers(true), 100);
  }, []);

  const handleAddMember = useCallback(() => {
    setShowOptions(false);
    // Small delay to let action sheet close first
    setTimeout(() => setShowAddMember(true), 100);
  }, []);

  const handleMemberChanged = useCallback(async () => {
    // Refresh thread to update member count
    if (!id) return;
    const threadData = await CrewThreadService.getThread(id);
    if (threadData) setThread(threadData);
  }, [id]);

  const handleEditThread = useCallback(() => {
    setShowOptions(false);
    // TODO: Show edit modal
    Alert.alert('Coming Soon', 'Edit thread feature coming soon');
  }, []);

  const handleLeaveThread = useCallback(async () => {
    setShowOptions(false);
    Alert.alert(
      'Leave Thread',
      'Are you sure you want to leave this thread?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            const success = await CrewThreadService.leaveThread(id);
            if (success) {
              router.replace('/messages');
            } else {
              Alert.alert('Error', 'Could not leave thread');
            }
          },
        },
      ]
    );
  }, [id, router]);

  const handleDeleteThread = useCallback(async () => {
    setShowOptions(false);
    Alert.alert(
      'Delete Thread',
      'Are you sure you want to delete this thread? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            const success = await CrewThreadService.deleteThread(id);
            if (success) {
              router.replace('/messages');
            } else {
              Alert.alert('Error', 'Could not delete thread');
            }
          },
        },
      ]
    );
  }, [id, router]);

  const isOwner = thread?.ownerId === user?.id;
  const isAdmin = thread?.role === 'admin';

  // Build action sheet actions
  const actions = useMemo(() => {
    const result: ActionSheetAction[] = [
      {
        label: 'View Members',
        icon: <Users />,
        onPress: handleViewMembers,
      },
    ];

    // Add member (owner or admin only)
    if (isOwner || isAdmin) {
      result.push({
        label: 'Add Member',
        icon: <UserPlus />,
        onPress: handleAddMember,
      });
    }

    // Edit thread (owner only)
    if (isOwner) {
      result.push({
        label: 'Edit Thread',
        icon: <Edit3 />,
        onPress: handleEditThread,
      });
    }

    // Leave thread (non-owners only)
    if (!isOwner) {
      result.push({
        label: 'Leave Thread',
        icon: <LogOut />,
        onPress: handleLeaveThread,
        destructive: true,
      });
    }

    // Delete thread (owner only)
    if (isOwner) {
      result.push({
        label: 'Delete Thread',
        icon: <Trash2 />,
        onPress: handleDeleteThread,
        destructive: true,
      });
    }

    return result;
  }, [isOwner, isAdmin, handleViewMembers, handleAddMember, handleEditThread, handleLeaveThread, handleDeleteThread]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[staticStyles.container, { backgroundColor: colors.systemBackground }]}>
        {/* Header */}
        <View
          style={[
            staticStyles.header,
            {
              paddingTop: insets.top,
              backgroundColor: colors.secondarySystemGroupedBackground,
              borderBottomColor: colors.separator,
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              staticStyles.backButton,
              pressed && { backgroundColor: colors.quaternarySystemFill },
            ]}
            onPress={handleBack}
          >
            <ChevronLeft size={24} color={colors.systemBlue} />
          </Pressable>

          <View style={staticStyles.headerCenter}>
            <View style={[staticStyles.headerAvatar, { backgroundColor: colors.systemGray5 }]}>
              <Text style={staticStyles.headerAvatarEmoji}>
                {thread?.avatarEmoji || '⛵'}
              </Text>
            </View>
            <View style={staticStyles.headerInfo}>
              <Text style={[staticStyles.headerTitle, { color: colors.label }]} numberOfLines={1}>
                {thread?.name || 'Loading...'}
              </Text>
              {thread && (
                <View style={staticStyles.headerMeta}>
                  <Users size={12} color={colors.tertiaryLabel} />
                  <Text style={[staticStyles.headerMemberCount, { color: colors.tertiaryLabel }]}>
                    {thread.memberCount || 1} member
                    {(thread.memberCount || 1) !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              staticStyles.optionsButton,
              pressed && { backgroundColor: colors.quaternarySystemFill },
            ]}
            onPress={() => setShowOptions(true)}
          >
            <MoreHorizontal size={24} color={colors.systemBlue} />
          </Pressable>
        </View>

        {/* Chat */}
        <CrewThreadChat
          messages={messages}
          currentUserId={user?.id}
          onSendMessage={sendMessage}
          onDeleteMessage={deleteMessage}
          isSending={isSending}
          isLoading={isLoadingMessages || isLoadingThread}
          threadName={thread?.name}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
        />
      </View>

      {/* Options Action Sheet */}
      <IOSActionSheet
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        title={thread?.name}
        actions={actions}
      />

      {/* Members Modal */}
      <ThreadMembersModal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        threadId={id || ''}
        threadName={thread?.name}
        currentUserRole={thread?.role || 'member'}
        currentUserId={user?.id}
        onMemberRemoved={handleMemberChanged}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        threadId={id || ''}
        threadName={thread?.name}
        onMemberAdded={handleMemberChanged}
      />
    </>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
  },
  optionsButton: {
    padding: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarEmoji: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.headline,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerMemberCount: {
    ...IOS_TYPOGRAPHY.caption1,
  },
});
