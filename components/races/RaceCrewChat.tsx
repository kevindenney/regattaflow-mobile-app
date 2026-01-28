/**
 * RaceCrewChat
 *
 * Apple Messages-style crew chat for race collaboration.
 * Renders as a bottom sheet on the race detail screen.
 *
 * Features:
 * - Text messages from crew members
 * - System messages (checklist completions, strategy updates)
 * - Realtime updates via Supabase
 * - Lightweight composer with send button
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from '@/components/ui/actionsheet';
import { Send } from 'lucide-react-native';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import type { RaceMessage } from '@/types/raceCollaboration';

// =============================================================================
// TYPES
// =============================================================================

interface RaceCrewChatProps {
  visible: boolean;
  onClose: () => void;
  messages: RaceMessage[];
  currentUserId?: string;
  onSendMessage: (text: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  isSending?: boolean;
  isLoading?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  if (d.toDateString() === today) return 'Today';
  if (d.toDateString() === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function shouldShowDateHeader(messages: RaceMessage[], index: number): boolean {
  if (index === 0) return true;
  const curr = new Date(messages[index].createdAt).toDateString();
  const prev = new Date(messages[index - 1].createdAt).toDateString();
  return curr !== prev;
}

function getAvatarColor(userId: string): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

// =============================================================================
// MESSAGE BUBBLE
// =============================================================================

function SystemMessageRow({ message }: { message: RaceMessage }) {
  return (
    <View style={styles.systemMessageRow}>
      <Text style={styles.systemMessageText}>{message.message}</Text>
      <Text style={styles.systemMessageTime}>
        {formatMessageTime(message.createdAt)}
      </Text>
    </View>
  );
}

function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  onDelete,
}: {
  message: RaceMessage;
  isOwnMessage: boolean;
  showAvatar: boolean;
  onDelete?: (messageId: string) => Promise<void>;
}) {
  const initials = message.profile?.fullName
    ? message.profile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '??';

  const handleLongPress = () => {
    if (!isOwnMessage || !onDelete) return;
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(message.id).catch(() => {
              Alert.alert('Error', 'Could not delete message.');
            });
          },
        },
      ],
    );
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={[
        styles.messageBubbleRow,
        isOwnMessage && styles.messageBubbleRowOwn,
      ]}
    >
      {/* Avatar (only for others' messages, with spacing) */}
      {!isOwnMessage && showAvatar && (
        <View
          style={[
            styles.bubbleAvatar,
            {
              backgroundColor:
                message.profile?.avatarColor || getAvatarColor(message.userId),
            },
          ]}
        >
          <Text style={styles.bubbleAvatarText}>
            {message.profile?.avatarEmoji || initials}
          </Text>
        </View>
      )}
      {!isOwnMessage && !showAvatar && <View style={styles.bubbleAvatarSpacer} />}

      <View style={{ flex: 1, maxWidth: '78%' }}>
        {/* Sender name (for others' messages, when avatar shown) */}
        {!isOwnMessage && showAvatar && (
          <Text style={styles.senderName}>
            {message.profile?.fullName || 'Unknown'}
          </Text>
        )}

        {/* Bubble */}
        <View
          style={[
            styles.bubble,
            isOwnMessage ? styles.bubbleOwn : styles.bubbleOther,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isOwnMessage ? styles.bubbleTextOwn : styles.bubbleTextOther,
            ]}
          >
            {message.message}
          </Text>
        </View>

        {/* Timestamp */}
        <Text
          style={[
            styles.bubbleTime,
            isOwnMessage && styles.bubbleTimeOwn,
          ]}
        >
          {formatMessageTime(message.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RaceCrewChat({
  visible,
  onClose,
  messages,
  currentUserId,
  onSendMessage,
  onDeleteMessage,
  isSending = false,
  isLoading = false,
}: RaceCrewChatProps) {
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    try {
      await onSendMessage(text);
    } catch {
      // Restore text on failure
      setInputText(text);
      Alert.alert(
        'Message not sent',
        'Could not deliver your message. Check your connection and try again.',
      );
    }
  }, [inputText, isSending, onSendMessage]);

  const renderMessage = useCallback(
    ({ item, index }: { item: RaceMessage; index: number }) => {
      const isOwnMessage = item.userId === currentUserId;

      // Show avatar when sender differs from previous message
      const showAvatar =
        index === 0 ||
        messages[index - 1].userId !== item.userId ||
        messages[index - 1].messageType === 'system';

      if (item.messageType === 'system' || item.messageType === 'checklist') {
        return <SystemMessageRow message={item} />;
      }

      return (
        <MessageBubble
          message={item}
          isOwnMessage={isOwnMessage}
          showAvatar={showAvatar}
          onDelete={onDeleteMessage}
        />
      );
    },
    [currentUserId, messages, onDeleteMessage]
  );

  const renderDateHeader = useCallback(
    ({ item, index }: { item: RaceMessage; index: number }) => {
      if (!shouldShowDateHeader(messages, index)) return null;
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>
            {formatDateHeader(item.createdAt)}
          </Text>
        </View>
      );
    },
    [messages]
  );

  const canSend = inputText.trim().length > 0 && !isSending;

  return (
    <Actionsheet isOpen={visible} onClose={onClose} snapPoints={[70]}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={styles.chatContent}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        {/* Chat header */}
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>Crew Chat</Text>
          <Text style={styles.chatSubtitle}>
            {messages.filter((m) => m.messageType === 'text').length} messages
          </Text>
        </View>

        {/* Message list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View>
              {renderDateHeader({ item, index })}
              {renderMessage({ item, index })}
            </View>
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Start a conversation with your crew
              </Text>
            </View>
          }
        />

        {/* Composer */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.composerRow}>
            <TextInput
              style={styles.composerInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message your crew..."
              placeholderTextColor={IOS_COLORS.tertiaryLabel}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={handleSend}
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                !canSend && styles.sendButtonDisabled,
                pressed && canSend && styles.sendButtonPressed,
              ]}
              onPress={handleSend}
              disabled={!canSend}
            >
              <Send
                size={18}
                color={canSend ? '#FFFFFF' : IOS_COLORS.systemGray3}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ActionsheetContent>
    </Actionsheet>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  chatContent: {
    paddingBottom: 34,
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  chatTitle: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
  },
  chatSubtitle: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
  },
  messageList: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    flexGrow: 1,
  },

  // Date headers
  dateHeader: {
    alignItems: 'center',
    marginVertical: IOS_SPACING.md,
  },
  dateHeaderText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
  },

  // System messages
  systemMessageRow: {
    alignItems: 'center',
    marginVertical: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.xl,
  },
  systemMessageText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  systemMessageTime: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },

  // Message bubbles
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    gap: IOS_SPACING.sm,
  },
  messageBubbleRowOwn: {
    flexDirection: 'row-reverse',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  bubbleAvatarSpacer: {
    width: 28,
  },
  senderName: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: 18,
    maxWidth: '100%',
  },
  bubbleOwn: {
    backgroundColor: IOS_COLORS.systemBlue,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleOther: {
    backgroundColor: IOS_COLORS.systemGray6,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  bubbleText: {
    ...IOS_TYPOGRAPHY.body,
    lineHeight: 20,
  },
  bubbleTextOwn: {
    color: '#FFFFFF',
  },
  bubbleTextOther: {
    color: IOS_COLORS.label,
  },
  bubbleTime: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
    marginLeft: 4,
  },
  bubbleTimeOwn: {
    textAlign: 'right',
    marginRight: 4,
    marginLeft: 0,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IOS_SPACING.xxxxl,
    gap: IOS_SPACING.xs,
  },
  emptyTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.tertiaryLabel,
  },

  // Composer
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    gap: IOS_SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  composerInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    borderRadius: 18,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemGray6,
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.systemBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
});

export default RaceCrewChat;
