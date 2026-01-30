/**
 * CommentInput - Auto-expanding comment input with send button
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send } from 'lucide-react-native';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

interface CommentInputProps {
  onSubmit: (text: string) => Promise<void>;
  placeholder?: string;
  replyingTo?: string | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export function CommentInput({
  onSubmit,
  placeholder = 'Add a comment...',
  replyingTo,
  onCancelReply,
  disabled = false,
}: CommentInputProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputHeight, setInputHeight] = useState(36);
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = useCallback(async () => {
    const trimmedText = text.trim();
    if (!trimmedText || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedText);
      setText('');
      setInputHeight(36);
    } finally {
      setIsSubmitting(false);
    }
  }, [text, isSubmitting, disabled, onSubmit]);

  const handleContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const newHeight = Math.min(
        Math.max(36, event.nativeEvent.contentSize.height),
        120
      );
      setInputHeight(newHeight);
    },
    []
  );

  const canSubmit = text.trim().length > 0 && !isSubmitting && !disabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {/* Reply indicator */}
        {replyingTo && (
          <View style={styles.replyIndicator}>
            <Text style={styles.replyText}>
              Replying to <Text style={styles.replyName}>{replyingTo}</Text>
            </Text>
            <Pressable onPress={onCancelReply}>
              <Text style={styles.cancelReply}>Cancel</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.inputRow}>
          <View style={[styles.inputContainer, { height: inputHeight }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { height: inputHeight }]}
              value={text}
              onChangeText={setText}
              placeholder={placeholder}
              placeholderTextColor={IOS_COLORS.tertiaryLabel}
              multiline
              maxLength={1000}
              onContentSizeChange={handleContentSizeChange}
              editable={!disabled && !isSubmitting}
              textAlignVertical="center"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              canSubmit && styles.sendButtonActive,
              pressed && canSubmit && styles.sendButtonPressed,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={IOS_COLORS.white} />
            ) : (
              <Send
                size={18}
                color={canSubmit ? IOS_COLORS.white : IOS_COLORS.tertiaryLabel}
              />
            )}
          </Pressable>
        </View>

        {/* Character count for long comments */}
        {text.length > 800 && (
          <Text style={styles.charCount}>{text.length}/1000</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: IOS_SPACING.xs,
    marginBottom: IOS_SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  replyText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
  replyName: {
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  cancelReply: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: IOS_SPACING.sm,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    borderRadius: IOS_RADIUS.lg,
    minHeight: 36,
  },
  input: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    minHeight: 36,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: IOS_RADIUS.full,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  charCount: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'right',
    marginTop: IOS_SPACING.xs,
  },
});
