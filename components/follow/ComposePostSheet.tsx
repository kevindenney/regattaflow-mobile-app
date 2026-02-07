/**
 * ComposePostSheet
 *
 * Modal sheet for composing a new follower post.
 * Supports text content, post type selection, and optional race linking.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING, IOS_RADIUS } from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { useCreateFollowerPost } from '@/hooks/useFollowerPosts';
import type { FollowerPostType } from '@/services/FollowerPostService';

// =============================================================================
// CONSTANTS
// =============================================================================

const POST_TYPES: { value: FollowerPostType; label: string; icon: string; color: string }[] = [
  { value: 'general', label: 'Update', icon: 'chatbubble-outline', color: IOS_COLORS.systemBlue },
  { value: 'race_recap', label: 'Race Recap', icon: 'trophy-outline', color: IOS_COLORS.systemOrange },
  { value: 'tip', label: 'Tip', icon: 'bulb-outline', color: IOS_COLORS.systemYellow },
  { value: 'gear_update', label: 'Gear', icon: 'construct-outline', color: IOS_COLORS.systemPurple },
  { value: 'milestone', label: 'Milestone', icon: 'ribbon-outline', color: IOS_COLORS.systemGreen },
];

// =============================================================================
// COMPONENT
// =============================================================================

interface ComposePostSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

export function ComposePostSheet({ isOpen, onClose, onPostCreated }: ComposePostSheetProps) {
  const insets = useSafeAreaInsets();
  const createPost = useCreateFollowerPost();

  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<FollowerPostType>('general');

  const canPost = content.trim().length > 0 && !createPost.isPending;

  const handlePost = useCallback(async () => {
    if (!canPost) return;

    triggerHaptic('success');
    await createPost.mutateAsync({
      content: content.trim(),
      postType,
    });

    // Reset and close
    setContent('');
    setPostType('general');
    onClose();
    onPostCreated?.();
  }, [canPost, content, postType, createPost, onClose, onPostCreated]);

  const handleClose = useCallback(() => {
    setContent('');
    setPostType('general');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.headerButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.headerTitle}>New Post</Text>
            <Pressable
              onPress={handlePost}
              disabled={!canPost}
              style={[styles.headerButton, styles.postButton]}
            >
              {createPost.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.postButtonText,
                    !canPost && styles.postButtonTextDisabled,
                  ]}
                >
                  Post
                </Text>
              )}
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollContent} keyboardDismissMode="on-drag">
            {/* Post Type Picker */}
            <View style={styles.typeRow}>
              {POST_TYPES.map((type) => {
                const isSelected = postType === type.value;
                return (
                  <Pressable
                    key={type.value}
                    onPress={() => {
                      triggerHaptic('selection');
                      setPostType(type.value);
                    }}
                    style={[
                      styles.typePill,
                      isSelected && { backgroundColor: type.color + '20' },
                    ]}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={14}
                      color={isSelected ? type.color : IOS_COLORS.secondaryLabel}
                    />
                    <Text
                      style={[
                        styles.typePillText,
                        isSelected && { color: type.color, fontWeight: '600' },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.textInput}
              placeholder="Share an update with your followers..."
              placeholderTextColor={IOS_COLORS.tertiaryLabel}
              value={content}
              onChangeText={setContent}
              multiline
              autoFocus
              textAlignVertical="top"
              maxLength={2000}
            />

            {/* Character count */}
            <Text style={styles.charCount}>
              {content.length}/2000
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  headerButton: {
    paddingVertical: IOS_SPACING.xs,
    paddingHorizontal: IOS_SPACING.sm,
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  cancelText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.systemBlue,
  },
  postButton: {
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: IOS_RADIUS.lg,
    paddingHorizontal: IOS_SPACING.lg,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    opacity: 0.5,
  },
  scrollContent: {
    flex: 1,
    padding: IOS_SPACING.md,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.sm,
    marginBottom: IOS_SPACING.md,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.xs,
    borderRadius: IOS_RADIUS.lg,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  typePillText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
  textInput: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    minHeight: 200,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.md,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
      default: {},
    }),
  },
  charCount: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'right',
    marginTop: IOS_SPACING.xs,
  },
});

export default ComposePostSheet;
