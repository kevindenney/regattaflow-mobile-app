/**
 * CommentThread - Nested comment display with replies
 */

import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { VenueDiscussionComment } from '@/services/venue/VenueDiscussionService';
import { useVoteComment } from '@/hooks/useVenueDiscussions';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';

interface CommentThreadProps {
  comment: VenueDiscussionComment;
  discussionId: string;
  depth?: number;
  onReply: (commentId: string) => void;
  replyingTo: string | null;
}

export function CommentThread({
  comment,
  discussionId,
  depth = 0,
  onReply,
  replyingTo,
}: CommentThreadProps) {
  const { user } = useAuth();
  const voteMutation = useVoteComment();

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
  const netVotes = comment.upvotes - comment.downvotes;
  const maxDepth = 3;

  const handleVote = (vote: 1 | -1) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to vote');
      return;
    }

    const currentVote = comment.user_vote;
    const newVote = currentVote === vote ? 0 : vote;

    voteMutation.mutate({
      commentId: comment.id,
      vote: newVote as 1 | -1 | 0,
      discussionId,
    });
  };

  const handleReply = () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to reply');
      return;
    }
    onReply(comment.id);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.commentCard, depth > 0 && styles.nestedComment]}>
        {/* Thread Line for nested comments */}
        {depth > 0 && <View style={styles.threadLine} />}

        {/* Comment Content */}
        <View style={styles.commentContent}>
          {/* Header */}
          <View style={styles.commentHeader}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {(comment.author?.full_name || 'A').charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.authorInfo}>
              <ThemedText style={styles.authorName}>
                {comment.author?.full_name || 'Anonymous'}
              </ThemedText>
              <ThemedText style={styles.timeAgo}>{timeAgo}</ThemedText>
            </View>
          </View>

          {/* Body */}
          <ThemedText style={styles.commentBody}>{comment.body}</ThemedText>

          {/* Actions */}
          <View style={styles.actions}>
            {/* Voting */}
            <View style={styles.voteContainer}>
              <TouchableOpacity
                style={[styles.voteButton, comment.user_vote === 1 && styles.voteButtonActive]}
                onPress={() => handleVote(1)}
              >
                <Ionicons
                  name={comment.user_vote === 1 ? 'arrow-up' : 'arrow-up-outline'}
                  size={16}
                  color={comment.user_vote === 1 ? '#059669' : '#9CA3AF'}
                />
              </TouchableOpacity>

              <ThemedText
                style={[
                  styles.voteCount,
                  netVotes > 0 && styles.votePositive,
                  netVotes < 0 && styles.voteNegative,
                ]}
              >
                {netVotes}
              </ThemedText>

              <TouchableOpacity
                style={[styles.voteButton, comment.user_vote === -1 && styles.voteButtonActive]}
                onPress={() => handleVote(-1)}
              >
                <Ionicons
                  name={comment.user_vote === -1 ? 'arrow-down' : 'arrow-down-outline'}
                  size={16}
                  color={comment.user_vote === -1 ? '#DC2626' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>

            {/* Reply Button (only show if not too deeply nested) */}
            {depth < maxDepth && (
              <TouchableOpacity
                style={[styles.replyButton, replyingTo === comment.id && styles.replyButtonActive]}
                onPress={handleReply}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={14}
                  color={replyingTo === comment.id ? '#2563EB' : '#9CA3AF'}
                />
                <ThemedText
                  style={[
                    styles.replyButtonText,
                    replyingTo === comment.id && styles.replyButtonTextActive,
                  ]}
                >
                  Reply
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              discussionId={discussionId}
              depth={depth + 1}
              onReply={onReply}
              replyingTo={replyingTo}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  commentCard: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  nestedComment: {
    marginLeft: 16,
    paddingLeft: 12,
  },
  threadLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  authorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentBody: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
    marginLeft: 36,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 36,
    gap: 16,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteButton: {
    padding: 4,
    borderRadius: 4,
  },
  voteButtonActive: {
    backgroundColor: '#F3F4F6',
  },
  voteCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    minWidth: 20,
    textAlign: 'center',
  },
  votePositive: {
    color: '#059669',
  },
  voteNegative: {
    color: '#DC2626',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 4,
  },
  replyButtonActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  replyButtonText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  replyButtonTextActive: {
    color: '#2563EB',
    fontWeight: '500',
  },
  repliesContainer: {
    marginLeft: 16,
  },
});
