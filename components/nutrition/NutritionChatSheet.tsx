/**
 * NutritionChatSheet — Bottom sheet conversation for food logging.
 *
 * Reuses the bubble chat UI pattern. After each user message,
 * NutritionExtractionService creates entries automatically.
 * Inline extraction confirmations show what was logged.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { useNutritionChat } from '@/hooks/useNutritionChat';

interface NutritionChatSheetProps {
  interestId: string;
  interestName: string;
  onClose: () => void;
}

export function NutritionChatSheet({
  interestId,
  interestName,
  onClose,
}: NutritionChatSheetProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const {
    messages,
    isLoading,
    isInitializing,
    sendMessage,
    complete,
    lastExtraction,
  } = useNutritionChat({ interestId, interestName });

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length, isLoading, lastExtraction]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    sendMessage(trimmed);
  }, [input, isLoading, sendMessage]);

  const handleClose = useCallback(async () => {
    await complete().catch(() => {});
    onClose();
  }, [complete, onClose]);

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="nutrition-outline" size={16} color={IOS_COLORS.systemGreen} />
            <Text style={styles.headerTitle}>Log Nutrition</Text>
          </View>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={styles.doneButton}>Done</Text>
          </Pressable>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isInitializing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={IOS_COLORS.systemGreen} />
            </View>
          )}

          {messages.map((msg, i) => (
            <View
              key={`${msg.role}_${i}`}
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
              ]}
            >
              {msg.role === 'assistant' && (
                <Ionicons name="nutrition" size={10} color={IOS_COLORS.systemGreen} />
              )}
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          ))}

          {/* Inline extraction confirmation */}
          {lastExtraction?.summary ? (
            <View style={styles.extractionBadge}>
              <Ionicons name="checkmark-circle" size={12} color={IOS_COLORS.systemGreen} />
              <Text style={styles.extractionText}>{lastExtraction.summary}</Text>
            </View>
          ) : null}

          {isLoading && (
            <View style={[styles.bubble, styles.bubbleAssistant]}>
              <ActivityIndicator size="small" color={IOS_COLORS.systemGreen} />
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            placeholder="What did you eat?"
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            returnKeyType="send"
            editable={!isLoading}
            autoFocus
          />
          <Pressable
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={14}
              color={input.trim() && !isLoading ? '#FFFFFF' : IOS_COLORS.systemGray3}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.systemGreen,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: IOS_SPACING.md,
    gap: IOS_SPACING.xs,
    flexGrow: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.lg,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: '85%',
    gap: 3,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: IOS_COLORS.systemGreen,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: IOS_COLORS.systemGray6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  bubbleTextAssistant: {
    color: IOS_COLORS.label,
  },
  extractionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52,199,89,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
  },
  extractionText: {
    fontSize: 12,
    color: IOS_COLORS.systemGreen,
    fontWeight: '500',
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.systemGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
});
