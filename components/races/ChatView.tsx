/**
 * ChatView Component
 *
 * Simple linear chat view for race card discussions.
 * Features:
 * - Scrollable message list (newest at bottom)
 * - Message bubbles with avatar, name, timestamp
 * - Input field with send button
 * - System messages styled differently
 * - Empty state
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Avatar, AvatarFallbackText } from '@/components/ui/avatar';
import { RaceMessage } from '@/types/raceCollaboration';
import { IOS_COLORS } from '@/components/cards/constants';
import { Send, MessageSquare } from 'lucide-react-native';

interface ChatViewProps {
  /** List of messages */
  messages: RaceMessage[];
  /** Callback to send a message */
  onSend: (message: string) => Promise<void>;
  /** Callback to delete a message (own messages only) */
  onDelete?: (messageId: string) => Promise<void>;
  /** Current user ID for styling own messages */
  currentUserId?: string;
  /** Whether currently loading */
  isLoading?: boolean;
  /** Placeholder text for input */
  placeholder?: string;
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get initials from message profile
 */
function getInitials(message: RaceMessage): string {
  if (message.profile?.fullName) {
    const parts = message.profile.fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return message.profile.fullName.substring(0, 2).toUpperCase();
  }
  return '??';
}

export function ChatView({
  messages,
  onSend,
  onDelete,
  currentUserId,
  isLoading = false,
  placeholder = 'Type a message...',
}: ChatViewProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');

    try {
      await onSend(text);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore text if send failed
      setInputText(text);
      Alert.alert(
        'Message not sent',
        'Could not deliver your message. Check your connection and try again.',
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Messages List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={IOS_COLORS.gray3} />
            <Text style={styles.emptyStateTitle}>No messages yet</Text>
            <Text style={styles.emptyStateText}>
              Start the conversation with your crew
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.userId === currentUserId}
              onDelete={onDelete}
            />
          ))
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={placeholder}
          placeholderTextColor={IOS_COLORS.gray2}
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
          editable={!isSending}
        />
        <Pressable
          style={[
            styles.sendButton,
            (!inputText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          <Send
            size={20}
            color={
              inputText.trim() && !isSending
                ? IOS_COLORS.systemBackground
                : IOS_COLORS.gray3
            }
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Individual message bubble
 */
interface MessageBubbleProps {
  message: RaceMessage;
  isOwn: boolean;
  onDelete?: (messageId: string) => Promise<void>;
}

function MessageBubble({ message, isOwn, onDelete }: MessageBubbleProps) {
  const handleLongPress = () => {
    if (!isOwn || !onDelete) return;
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

  // System messages have different styling
  if (message.messageType === 'system') {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemMessageText}>{message.message}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={[styles.messageBubbleContainer, isOwn && styles.ownMessage]}
    >
      {!isOwn && (
        <Avatar
          size="xs"
          style={{
            backgroundColor:
              message.profile?.avatarColor || IOS_COLORS.blue,
          }}
        >
          {message.profile?.avatarEmoji ? (
            <AvatarFallbackText style={styles.avatarEmoji}>
              {message.profile.avatarEmoji}
            </AvatarFallbackText>
          ) : (
            <AvatarFallbackText>{getInitials(message)}</AvatarFallbackText>
          )}
        </Avatar>
      )}

      <View
        style={[
          styles.messageBubble,
          isOwn ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        {!isOwn && message.profile?.fullName && (
          <Text style={styles.senderName}>{message.profile.fullName}</Text>
        )}
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
          {message.message}
        </Text>
        <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  emptyStateText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '85%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: IOS_COLORS.blue,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: IOS_COLORS.gray6,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  ownMessageText: {
    color: IOS_COLORS.systemBackground,
  },
  messageTime: {
    fontSize: 10,
    color: IOS_COLORS.gray,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: IOS_COLORS.gray5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  systemMessageText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
  avatarEmoji: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  input: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: IOS_COLORS.label,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: IOS_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: IOS_COLORS.gray5,
  },
});

export default ChatView;
