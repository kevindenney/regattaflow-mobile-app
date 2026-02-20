/**
 * Conversation Detail Screen (Chat View)
 *
 * Standard chat UI between a coach and a sailor.
 * Messages display in a scrollable list, newest at bottom.
 * Real-time updates via Supabase subscriptions.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useAuth } from '@/providers/AuthProvider';
import { useMessages } from '@/hooks/useMessaging';
import { messagingService, type CoachingMessage, type MessageType } from '@/services/MessagingService';
import { supabase } from '@/services/supabase';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

export default function ConversationScreen() {
  const { id: conversationId, prefill } = useLocalSearchParams<{ id: string; prefill?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const { messages, loading, hasMore, loadEarlier } = useMessages(conversationId);
  const [inputText, setInputText] = useState(prefill || '');
  const [sending, setSending] = useState(false);
  const [otherUserName, setOtherUserName] = useState('');

  // Load the other user's name for the header
  useEffect(() => {
    if (!conversationId) return;
    (async () => {
      const { data } = await supabase
        .from('coaching_conversations')
        .select(`
          coach_id, sailor_id,
          coach_user:users!coaching_conversations_coach_id_fkey(full_name, email),
          sailor_user:users!coaching_conversations_sailor_id_fkey(full_name, email)
        `)
        .eq('id', conversationId)
        .single();
      if (data && user) {
        const isCoach = data.coach_id === user.id;
        const other: any = isCoach ? data.sailor_user : data.coach_user;
        setOtherUserName(other?.full_name || other?.email || 'Chat');
      }
    })();
  }, [conversationId, user]);

  // Mark messages as read when opening
  useEffect(() => {
    if (!conversationId || !user?.id) return;
    messagingService.markConversationRead(conversationId, user.id).catch(() => {});
  }, [conversationId, user?.id, messages.length]);

  // Send message
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !conversationId || !user?.id || sending) return;

    setSending(true);
    setInputText('');
    try {
      await messagingService.sendMessage(conversationId, user.id, text, 'text');
    } catch (err) {
      console.error('[ConversationScreen] Send error:', err);
      setInputText(text); // Restore on failure
    } finally {
      setSending(false);
    }
  }, [inputText, conversationId, user?.id, sending]);

  // Messages are stored newest-first in state; FlatList with inverted shows them correctly
  const renderMessage = useCallback(
    ({ item }: { item: CoachingMessage }) => {
      if (item.message_type === 'system') {
        return <SystemMessage message={item} />;
      }

      if (item.message_type === 'session_note' || item.message_type === 'debrief_share') {
        return (
          <ContentCard
            message={item}
            isMine={item.sender_id === user?.id}
          />
        );
      }

      const isMine = item.sender_id === user?.id;
      return (
        <View style={[styles.bubbleRow, isMine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
              {item.content}
            </Text>
            <View style={styles.bubbleMeta}>
              <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                {format(new Date(item.created_at), 'h:mm a')}
              </Text>
              {isMine && item.read_at && (
                <Text style={styles.readReceipt}>Read</Text>
              )}
            </View>
          </View>
        </View>
      );
    },
    [user?.id]
  );

  const keyExtractor = useCallback((item: CoachingMessage) => item.id, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: otherUserName || 'Chat',
          headerShown: true,
          headerBackTitle: 'Messages',
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          inverted
          contentContainerStyle={styles.messageList}
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity style={styles.loadMore} onPress={loadEarlier}>
                <Text style={styles.loadMoreText}>Load earlier messages</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubble-outline" size={40} color={IOS_COLORS.systemGray3} />
                <Text style={styles.emptyChatText}>Send a message to start the conversation</Text>
              </View>
            )
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={IOS_COLORS.systemGray}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={5000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Ionicons
              name="arrow-up-circle-sharp"
              size={32}
              color={inputText.trim() && !sending ? IOS_COLORS.systemBlue : IOS_COLORS.systemGray3}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SystemMessage({ message }: { message: CoachingMessage }) {
  return (
    <View style={styles.systemRow}>
      <Text style={styles.systemText}>{message.content}</Text>
    </View>
  );
}

function ContentCard({ message, isMine }: { message: CoachingMessage; isMine: boolean }) {
  const isNote = message.message_type === 'session_note';
  const label = isNote ? 'Session Notes' : 'Shared Debrief';
  const icon = isNote ? 'document-text-outline' : 'analytics-outline';
  const meta = message.metadata || {};

  return (
    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      <TouchableOpacity
        style={[styles.contentCard, isMine ? styles.contentCardMine : styles.contentCardTheirs]}
        activeOpacity={0.7}
      >
        <View style={styles.contentCardHeader}>
          <Ionicons name={icon as any} size={16} color={IOS_COLORS.systemBlue} />
          <Text style={styles.contentCardLabel}>{label}</Text>
        </View>
        <Text style={styles.contentCardContent} numberOfLines={3}>
          {message.content}
        </Text>
        {meta.session_date && (
          <Text style={styles.contentCardMeta}>{meta.session_date}</Text>
        )}
        {meta.race_name && (
          <Text style={styles.contentCardMeta}>{meta.race_name}</Text>
        )}
        <Text style={[styles.bubbleTime, { marginTop: 4 }]}>
          {format(new Date(message.created_at), 'h:mm a')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  messageList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  // Bubbles
  bubbleRow: {
    marginVertical: 2,
    flexDirection: 'row',
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: IOS_COLORS.systemBlue,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: IOS_COLORS.systemGray5,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 21,
    color: IOS_COLORS.label,
  },
  bubbleTextMine: {
    color: '#FFFFFF',
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  bubbleTime: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  readReceipt: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },

  // System messages
  systemRow: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 20,
  },
  systemText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Content cards (session notes / debrief shares)
  contentCard: {
    maxWidth: '78%',
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  contentCardMine: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderColor: IOS_COLORS.systemBlue,
  },
  contentCardTheirs: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  contentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  contentCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  contentCardContent: {
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 19,
  },
  contentCardMeta: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },

  // Load more
  loadMore: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadMoreText: {
    fontSize: 14,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },

  // Empty chat
  emptyChat: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 8,
    // Inverted list means this shows at "top" visually, which is bottom of scroll
    transform: [{ scaleY: -1 }],
  },
  emptyChatText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.systemBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.systemGray6,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 9 : 8,
    paddingBottom: Platform.OS === 'ios' ? 9 : 8,
    fontSize: 16,
    color: IOS_COLORS.label,
    marginRight: 8,
  },
  sendButton: {
    paddingBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
