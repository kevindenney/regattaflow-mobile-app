/**
 * DiscussionList - List of discussion threads for a venue
 * Reddit-style with upvotes, categories, and activity indicators
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useVenueDiscussions, useDiscussionCategories } from '@/hooks/useVenueDiscussions';
import { VenueDiscussion, DiscussionCategory } from '@/services/venue/VenueDiscussionService';
import { formatDistanceToNow } from 'date-fns';

interface DiscussionListProps {
  venueId: string;
  racingAreaId?: string | null;
  raceRouteId?: string | null;
  onSelectDiscussion: (discussion: VenueDiscussion) => void;
  onCreateDiscussion: () => void;
}

export function DiscussionList({
  venueId,
  racingAreaId,
  raceRouteId,
  onSelectDiscussion,
  onCreateDiscussion,
}: DiscussionListProps) {
  const [selectedCategory, setSelectedCategory] = useState<DiscussionCategory | undefined>();
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'active'>('recent');

  const categories = useDiscussionCategories();
  const { data, isLoading, isRefetching, refetch } = useVenueDiscussions(venueId, {
    category: selectedCategory,
    racingAreaId,
    raceRouteId,
    sortBy,
  });

  const getCategoryColor = (category: DiscussionCategory): string => {
    const colors: Record<DiscussionCategory, string> = {
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

  const renderDiscussion = ({ item }: { item: VenueDiscussion }) => {
    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    const netVotes = item.upvotes - item.downvotes;

    return (
      <TouchableOpacity
        style={styles.discussionCard}
        onPress={() => onSelectDiscussion(item)}
        activeOpacity={0.7}
      >
        {/* Vote Column */}
        <View style={styles.voteColumn}>
          <Ionicons name="chevron-up" size={18} color="#9CA3AF" />
          <ThemedText style={[styles.voteCount, netVotes > 0 && styles.votePositive]}>
            {netVotes}
          </ThemedText>
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        </View>

        {/* Content */}
        <View style={styles.contentColumn}>
          {/* Category Badge + Title */}
          <View style={styles.titleRow}>
            {item.category && (
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                <ThemedText style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                  {categories.find(c => c.value === item.category)?.label || item.category}
                </ThemedText>
              </View>
            )}
            {item.pinned && (
              <View style={styles.pinnedBadge}>
                <Ionicons name="pin" size={12} color="#059669" />
              </View>
            )}
          </View>

          <ThemedText style={styles.title} numberOfLines={2}>
            {item.title}
          </ThemedText>

          {item.body && (
            <ThemedText style={styles.preview} numberOfLines={2}>
              {item.body}
            </ThemedText>
          )}

          {/* Meta Row */}
          <View style={styles.metaRow}>
            <ThemedText style={styles.metaText}>
              {item.author?.full_name || 'Anonymous'}
            </ThemedText>
            <ThemedText style={styles.metaDot}>·</ThemedText>
            <ThemedText style={styles.metaText}>{timeAgo}</ThemedText>
            <ThemedText style={styles.metaDot}>·</ThemedText>
            <View style={styles.commentCount}>
              <Ionicons name="chatbubble-outline" size={12} color="#6B7280" />
              <ThemedText style={styles.metaText}>{item.comment_count}</ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Category Filters */}
      <FlatList
        horizontal
        data={[{ value: undefined, label: 'All', icon: 'apps-outline' }, ...categories]}
        keyExtractor={(item) => item.value || 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilters}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === item.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(item.value as DiscussionCategory | undefined)}
          >
            <Ionicons
              name={item.icon as any}
              size={14}
              color={selectedCategory === item.value ? '#2563EB' : '#6B7280'}
            />
            <ThemedText
              style={[
                styles.filterChipText,
                selectedCategory === item.value && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </ThemedText>
          </TouchableOpacity>
        )}
      />

      {/* Sort Options */}
      <View style={styles.sortRow}>
        {(['recent', 'popular', 'active'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.sortOption, sortBy === option && styles.sortOptionActive]}
            onPress={() => setSortBy(option)}
          >
            <ThemedText
              style={[styles.sortText, sortBy === option && styles.sortTextActive]}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
      <ThemedText style={styles.emptyTitle}>No discussions yet</ThemedText>
      <ThemedText style={styles.emptyText}>
        Be the first to start a conversation about this venue
      </ThemedText>
      <TouchableOpacity style={styles.createButton} onPress={onCreateDiscussion}>
        <Ionicons name="add" size={20} color="white" />
        <ThemedText style={styles.createButtonText}>Start a Discussion</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.data || []}
        keyExtractor={(item) => item.id}
        renderItem={renderDiscussion}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      />

      {/* Floating Create Button */}
      {(data?.data?.length || 0) > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={onCreateDiscussion}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 8,
  },
  categoryFilters: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  sortOption: {
    paddingVertical: 4,
  },
  sortOptionActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  sortText: {
    fontSize: 13,
    color: '#6B7280',
  },
  sortTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  discussionCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    padding: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  voteColumn: {
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 4,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginVertical: 2,
  },
  votePositive: {
    color: '#059669',
  },
  contentColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pinnedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  metaDot: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
      },
      default: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
});
