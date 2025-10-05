import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FeedPost {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  type?: 'result' | 'tuning' | 'discussion';
}

interface FleetFeedProps {
  fleetId: string;
}

export function FleetFeed({ fleetId }: FleetFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([
    {
      id: '1',
      author: { name: 'Sarah Chen' },
      content: 'Just won the weekend series with the new jib setup! Thanks for the tuning tips everyone 🏆',
      timestamp: '2h ago',
      likes: 12,
      comments: 5,
      isLiked: false,
      type: 'result',
    },
    {
      id: '2',
      author: { name: 'Mike Johnson' },
      content: 'Updated the forestay tension guide for 15+ knots. Check it out in the tuning library!',
      timestamp: '5h ago',
      likes: 8,
      comments: 3,
      isLiked: true,
      type: 'tuning',
    },
  ]);

  const [newPost, setNewPost] = useState('');

  const handleLike = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
        : post
    ));
  };

  const handlePost = () => {
    if (newPost.trim()) {
      const post: FeedPost = {
        id: Date.now().toString(),
        author: { name: 'You' },
        content: newPost,
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        isLiked: false,
      };
      setPosts([post, ...posts]);
      setNewPost('');
    }
  };

  const getPostTypeIcon = (type?: string) => {
    switch (type) {
      case 'result':
        return { name: 'trophy' as const, color: '#F59E0B' };
      case 'tuning':
        return { name: 'construct' as const, color: '#3B82F6' };
      default:
        return { name: 'chatbubble-ellipses' as const, color: '#6B7280' };
    }
  };

  const renderPost = ({ item }: { item: FeedPost }) => {
    const typeIcon = getPostTypeIcon(item.type);

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.author.name[0]}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{item.author.name}</Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
          {item.type && (
            <View style={styles.typeIcon}>
              <Ionicons name={typeIcon.name} size={16} color={typeIcon.color} />
            </View>
          )}
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        <View style={styles.postActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isLiked ? '#EF4444' : '#6B7280'}
            />
            <Text style={[styles.actionText, item.isLiked && styles.likedText]}>
              {item.likes}
            </Text>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
            <Text style={styles.actionText}>{item.comments}</Text>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color="#6B7280" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Share with your fleet..."
          value={newPost}
          onChangeText={setNewPost}
          multiline
        />
        <Pressable
          style={[styles.postButton, !newPost.trim() && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={!newPost.trim()}
        >
          <Ionicons name="send" size={20} color={newPost.trim() ? '#FFFFFF' : '#9CA3AF'} />
        </Pressable>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.feedList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  postButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  feedList: {
    padding: 12,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  timestamp: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  likedText: {
    color: '#EF4444',
  },
});
