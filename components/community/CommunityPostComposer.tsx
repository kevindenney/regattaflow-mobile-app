/**
 * CommunityPostComposer
 *
 * Modal sheet for composing a new community post.
 * Requires selecting a community, supports title + body,
 * and community-specific post types.
 */

import React, { useCallback, useState } from 'react';
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
import { useCreateCommunityPost } from '@/hooks/useCommunityPost';
import { CommunityPicker, CommunityPickerButton } from '@/components/community/CommunityPicker';
import { POST_TYPE_CONFIG, type PostType } from '@/types/community-feed';
import type { Community } from '@/types/community';

// =============================================================================
// CONSTANTS
// =============================================================================

const POST_TYPES: { value: PostType; label: string; icon: string; color: string }[] = [
  { value: 'discussion', label: 'Discussion', icon: POST_TYPE_CONFIG.discussion.icon, color: POST_TYPE_CONFIG.discussion.color },
  { value: 'question', label: 'Question', icon: POST_TYPE_CONFIG.question.icon, color: POST_TYPE_CONFIG.question.color },
  { value: 'tip', label: 'Tip', icon: POST_TYPE_CONFIG.tip.icon, color: POST_TYPE_CONFIG.tip.color },
  { value: 'report', label: 'Report', icon: POST_TYPE_CONFIG.report.icon, color: POST_TYPE_CONFIG.report.color },
  { value: 'safety_alert', label: 'Safety', icon: POST_TYPE_CONFIG.safety_alert.icon, color: POST_TYPE_CONFIG.safety_alert.color },
];

const MAX_BODY_LENGTH = 5000;
const MIN_TITLE_LENGTH = 5;
const MIN_BODY_LENGTH = 10;

// =============================================================================
// COMPONENT
// =============================================================================

interface CommunityPostComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  /** Optional pre-selected community */
  initialCommunity?: Community | null;
}

export function CommunityPostComposer({
  isOpen,
  onClose,
  onPostCreated,
  initialCommunity = null,
}: CommunityPostComposerProps) {
  const insets = useSafeAreaInsets();
  const createPost = useCreateCommunityPost();

  // Form state
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(initialCommunity);
  const [postType, setPostType] = useState<PostType>('discussion');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);

  // Validation
  const isTitleValid = title.trim().length >= MIN_TITLE_LENGTH;
  const isBodyValid = body.trim().length >= MIN_BODY_LENGTH;
  const canPost =
    selectedCommunity !== null &&
    isTitleValid &&
    isBodyValid &&
    !createPost.isPending;

  const handlePost = useCallback(async () => {
    if (!canPost || !selectedCommunity) return;

    triggerHaptic('success');
    try {
      await createPost.mutateAsync({
        community_id: selectedCommunity.id,
        title: title.trim(),
        body: body.trim(),
        post_type: postType,
        is_public: true,
      });

      // Reset and close
      setSelectedCommunity(initialCommunity);
      setPostType('discussion');
      setTitle('');
      setBody('');
      onClose();
      onPostCreated?.();
    } catch (error) {
      // Error is handled by the mutation (toast, etc.)
      console.error('[CommunityPostComposer] Error creating post:', error);
    }
  }, [canPost, selectedCommunity, title, body, postType, createPost, initialCommunity, onClose, onPostCreated]);

  const handleClose = useCallback(() => {
    setSelectedCommunity(initialCommunity);
    setPostType('discussion');
    setTitle('');
    setBody('');
    onClose();
  }, [initialCommunity, onClose]);

  const handleSelectCommunity = useCallback((community: Community) => {
    setSelectedCommunity(community);
    setShowCommunityPicker(false);
  }, []);

  const getPlaceholderText = useCallback(() => {
    switch (postType) {
      case 'question':
        return "What's your question?";
      case 'tip':
        return 'Share your local knowledge...';
      case 'report':
        return 'Describe current conditions...';
      case 'safety_alert':
        return 'Describe the safety concern...';
      default:
        return 'Start a discussion...';
    }
  }, [postType]);

  return (
    <>
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
                style={[
                  styles.headerButton,
                  styles.postButton,
                  !canPost && styles.postButtonDisabled,
                ]}
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
              {/* Community Picker */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>POSTING TO</Text>
                <CommunityPickerButton
                  selectedCommunity={selectedCommunity}
                  onPress={() => setShowCommunityPicker(true)}
                />
                {!selectedCommunity && (
                  <Text style={styles.requiredHint}>
                    Select a community to post
                  </Text>
                )}
              </View>

              {/* Post Type Picker */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>POST TYPE</Text>
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
              </View>

              {/* Title Input */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TITLE</Text>
                <TextInput
                  style={styles.titleInput}
                  placeholder={getPlaceholderText()}
                  placeholderTextColor={IOS_COLORS.tertiaryLabel}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={200}
                  autoFocus
                />
                {title.length > 0 && !isTitleValid && (
                  <Text style={styles.validationHint}>
                    Title must be at least {MIN_TITLE_LENGTH} characters
                  </Text>
                )}
              </View>

              {/* Body Input */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>DETAILS</Text>
                <TextInput
                  style={styles.bodyInput}
                  placeholder="Add details..."
                  placeholderTextColor={IOS_COLORS.tertiaryLabel}
                  value={body}
                  onChangeText={setBody}
                  multiline
                  textAlignVertical="top"
                  maxLength={MAX_BODY_LENGTH}
                />
                <View style={styles.bodyMeta}>
                  {body.length > 0 && !isBodyValid && (
                    <Text style={styles.validationHint}>
                      At least {MIN_BODY_LENGTH} characters required
                    </Text>
                  )}
                  <Text style={styles.charCount}>
                    {body.length}/{MAX_BODY_LENGTH}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Community Picker Modal */}
      <CommunityPicker
        visible={showCommunityPicker}
        selectedCommunityId={selectedCommunity?.id}
        onSelect={handleSelectCommunity}
        onDismiss={() => setShowCommunityPicker(false)}
      />
    </>
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
  postButtonDisabled: {
    backgroundColor: IOS_COLORS.systemGray4,
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
  section: {
    marginBottom: IOS_SPACING.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.xs,
  },
  requiredHint: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemOrange,
    marginTop: IOS_SPACING.xs,
  },
  validationHint: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemRed,
    marginTop: IOS_SPACING.xs,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.sm,
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
  titleInput: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.md,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
      default: {},
    }),
  },
  bodyInput: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    minHeight: 150,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.md,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
      default: {},
    }),
  },
  bodyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: IOS_SPACING.xs,
  },
  charCount: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
    marginLeft: 'auto',
  },
});

export default CommunityPostComposer;
