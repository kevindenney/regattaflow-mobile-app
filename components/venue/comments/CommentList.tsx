/**
 * CommentList
 *
 * Renders threaded comments with nesting (max 3 levels).
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CommentNode } from './CommentNode';
import type { ThreadedComment } from '@/types/community-feed';

interface CommentListProps {
  comments: ThreadedComment[];
  currentUserId?: string | null;
  onReply?: (comment: ThreadedComment) => void;
  onVote?: (commentId: string, vote: 1 | -1 | 0) => void;
  onEditComment?: (commentId: string, newBody: string) => void;
}

export function CommentList({ comments, currentUserId, onReply, onVote, onEditComment }: CommentListProps) {
  return (
    <View style={styles.container}>
      {comments.map(comment => (
        <CommentNode
          key={comment.id}
          comment={comment}
          depth={0}
          currentUserId={currentUserId}
          onReply={onReply}
          onVote={onVote}
          onEditComment={onEditComment}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
});

export default CommentList;
