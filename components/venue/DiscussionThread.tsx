/**
 * DiscussionThread - Single discussion view with comments
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import {
  useVenueDiscussion,
  useDiscussionComments,
  useCreateComment,
  useVoteDiscussion,
  useDiscussionCategories,
} from '@/hooks/useVenueDiscussions';
import { VenueDiscussion } from '@/services/venue/VenueDiscussionService';
import { CommentThread } from './CommentThread';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';

interface DiscussionThreadProps {
  discussion: VenueDiscussion;
  venueId: string;
  onBack: () => void;
}

export function DiscussionThread({
  discussion: initialDiscussion,
  venueId,
  onBack,
}: DiscussionThreadProps) {
  const { user } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const categories = useDiscussionCategories();
  const { data: discussion, isLoading: loadingDiscussion } = useVenueDiscussion(
    initialDiscussion.id
  );
  const { data: comments, isLoading: loadingComments } = useDiscussionComments(
    initialDiscussion.id
  );

  const createCommentMutation = useCreateComment();
  const voteMutation = useVoteDiscussion();

  const displayDiscussion = discussion || initialDiscussion;
  const timeAgo = formatDistanceToNow(new Date(displayDiscussion.created_at), { addSuffix: true });
  const netVotes = displayDiscussion.upvotes - displayDiscussion.downvotes;
  const categoryInfo = categories.find(c => c.value === displayDiscussion.category);

  const handleVote = (vote: 1 | -1) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to vote');
      return;
    }

    const currentVote = displayDiscussion.user_vote;
    const newVote = currentVote === vote ? 0 : vote;

    voteMutation.mutate({
      discussionId: displayDiscussion.id,
      vote: newVote as 1 | -1 | 0,
      venueId,
    });
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;

    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to comment');
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        discussion_id: displayDiscussion.id,
        body: replyText.trim(),
        parent_id: replyingTo || undefined,
      });
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      general: '#6B7280',
      tactics: '#2563EB',
      conditions: '#059669',
      gear: '#D97706',
      services: '#7C3AED',
      racing: '#DC2626',
      safety: '#EA580C',
    };
    return colors[category] || '#6B7280';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            Discussion
          </ThemedText>
          <ThemedText style={styles.commentCount}>
            {displayDiscussion.comment_count} {displayDiscussion.comment_count === 1 ? 'comment' : 'comments'}
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Discussion Post */}
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            {displayDiscussion.category && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: getCategoryColor(displayDiscussion.category) + '20' },
                ]}
              >
                <Ionicons
                  name={categoryInfo?.icon as any || 'chatbubble'}
                  size={12}
                  color={getCategoryColor(displayDiscussion.category)}
                />
                <ThemedText
                  style={[styles.categoryText, { color: getCategoryColor(displayDiscussion.category) }]}
                >
                  {categoryInfo?.label || displayDiscussion.category}
                </ThemedText>
              </View>
            )}
            {displayDiscussion.pinned && (
              <View style={styles.pinnedBadge}>
                <Ionicons name="pin" size={12} color="#059669" />
                <ThemedText style={styles.pinnedText}>Pinned</ThemedText>
              </View>
            )}
          </View>

          <ThemedText style={styles.postTitle}>{displayDiscussion.title}</ThemedText>

          {displayDiscussion.body && (
            <ThemedText style={styles.postBody}>{displayDiscussion.body}</ThemedText>
          )}

          <View style={styles.postMeta}>
            <ThemedText style={styles.authorName}>
              {displayDiscussion.author?.full_name || 'Anonymous'}
            </ThemedText>
            <ThemedText style={styles.metaDot}>·</ThemedText>
            <ThemedText style={styles.timeAgo}>{timeAgo}</ThemedText>
          </View>

          {/* Vote Actions */}
          <View style={styles.voteRow}>
            <TouchableOpacity
              style={[
                styles.voteButton,
                displayDiscussion.user_vote === 1 && styles.voteButtonActive,
              ]}
              onPress={() => handleVote(1)}
            >
              <Ionicons
                name={displayDiscussion.user_vote === 1 ? 'arrow-up' : 'arrow-up-outline'}
                size={20}
                color={displayDiscussion.user_vote === 1 ? '#059669' : '#6B7280'}
              />
            </TouchableOpacity>

            <ThemedText
              style={[
                styles.voteCountLarge,
                netVotes > 0 && styles.votePositive,
                netVotes < 0 && styles.voteNegative,
              ]}
            >
              {netVotes}
            </ThemedText>

            <TouchableOpacity
              style={[
                styles.voteButton,
                displayDiscussion.user_vote === -1 && styles.voteButtonActive,
              ]}
              onPress={() => handleVote(-1)}
            >
              <Ionicons
                name={displayDiscussion.user_vote === -1 ? 'arrow-down' : 'arrow-down-outline'}
                size={20}
                color={displayDiscussion.user_vote === -1 ? '#DC2626' : '#6B7280'}
              />
            </TouchableOpacity>

            <View style={styles.voteSpacing} />

            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color="#6B7280" />
              <ThemedText style={styles.shareText}>Share</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <ThemedText style={styles.commentsHeader}>
            Comments ({displayDiscussion.comment_count})
          </ThemedText>

          {loadingComments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : comments && comments.length > 0 ? (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  discussionId={displayDiscussion.id}
                  onReply={(commentId) => setReplyingTo(commentId)}
                  replyingTo={replyingTo}
                />
              ))}
            </View>
          ) : (
            <View style={styles.noComments}>
              <Ionicons name="chatbubble-outline" size={32} color="#D1D5DB" />
              <ThemedText style={styles.noCommentsText}>No comments yet</ThemedText>
              <ThemedText style={styles.noCommentsSubtext}>
                Be the first to share your thoughts
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Reply Input */}
      <View style={styles.replyContainer}>
        {replyingTo && (
          <View style={styles.replyingToBar}>
            <ThemedText style={styles.replyingToText}>Replying to comment</ThemedText>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.replyInputRow}>
          <TextInput
            style={styles.replyInput}
            placeholder={user ? 'Add a comment...' : 'Sign in to comment'}
            placeholderTextColor="#9CA3AF"
            value={replyText}
            onChangeText={setReplyText}
            multiline
            editable={!!user}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!replyText.trim() || createCommentMutation.isPending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmitReply}
            disabled={!replyText.trim() || createCommentMutation.isPending}
          >
            {createCommentMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  commentCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  menuButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 26,
    marginBottom: 12,
  },
  postBody: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  metaDot: {
    fontSize: 14,
    color: '#D1D5DB',
    marginHorizontal: 8,
  },
  timeAgo: {
    fontSize: 14,
    color: '#6B7280',
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  voteButton: {
    padding: 8,
    borderRadius: 8,
  },
  voteButtonActive: {
    backgroundColor: '#F3F4F6',
  },
  voteCountLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginHorizontal: 8,
    minWidth: 32,
    textAlign: 'center',
  },
  votePositive: {
    color: '#059669',
  },
  voteNegative: {
    color: '#DC2626',
  },
  voteSpacing: {
    flex: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  shareText: {
    fontSize: 14,
    color: '#6B7280',
  },
  commentsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  commentsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  commentsList: {
    gap: 12,
  },
  noComments: {
    alignItems: 'center',
    padding: 32,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  replyContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyingToBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 13,
    color: '#6B7280',
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
