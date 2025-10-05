import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TuningGuide {
  id: string;
  title: string;
  author: string;
  type: 'official' | 'community';
  windRange: string;
  views: number;
  likes: number;
  lastUpdated: string;
  tags: string[];
  isBookmarked?: boolean;
}

interface TuningLibraryProps {
  fleetId: string;
}

export function TuningLibrary({ fleetId }: TuningLibraryProps) {
  const [filterType, setFilterType] = useState<'all' | 'official' | 'community'>('all');
  const [guides, setGuides] = useState<TuningGuide[]>([
    {
      id: '1',
      title: 'Heavy Air Setup - 18+ Knots',
      author: 'Dragon Class Association',
      type: 'official',
      windRange: '18-25 kts',
      views: 234,
      likes: 45,
      lastUpdated: '2 weeks ago',
      tags: ['heavy-air', 'rig-tension', 'jib'],
      isBookmarked: true,
    },
    {
      id: '2',
      title: 'Light Air Optimization Guide',
      author: 'Sarah Chen',
      type: 'community',
      windRange: '0-8 kts',
      views: 156,
      likes: 32,
      lastUpdated: '1 week ago',
      tags: ['light-air', 'sail-trim', 'weight'],
    },
    {
      id: '3',
      title: 'Medium Breeze Setup',
      author: 'Dragon Class Association',
      type: 'official',
      windRange: '8-15 kts',
      views: 189,
      likes: 38,
      lastUpdated: '3 weeks ago',
      tags: ['medium', 'all-around', 'mast-rake'],
    },
    {
      id: '4',
      title: 'Mast Tuning for Waves',
      author: 'Mike Johnson',
      type: 'community',
      windRange: '12-20 kts',
      views: 98,
      likes: 21,
      lastUpdated: '4 days ago',
      tags: ['waves', 'mast', 'rig-tension'],
    },
  ]);

  const filteredGuides = guides.filter(guide =>
    filterType === 'all' ? true : guide.type === filterType
  );

  const handleBookmark = (guideId: string) => {
    setGuides(guides.map(guide =>
      guide.id === guideId ? { ...guide, isBookmarked: !guide.isBookmarked } : guide
    ));
  };

  const renderGuide = ({ item }: { item: TuningGuide }) => (
    <Pressable style={styles.guideCard}>
      <View style={styles.guideHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.guideTitle}>{item.title}</Text>
          <View style={styles.metaInfo}>
            <View style={[
              styles.typeBadge,
              item.type === 'official' ? styles.officialBadge : styles.communityBadge
            ]}>
              <Text style={styles.typeBadgeText}>
                {item.type === 'official' ? 'OFFICIAL' : 'COMMUNITY'}
              </Text>
            </View>
            <Text style={styles.windRange}>{item.windRange}</Text>
          </View>
        </View>

        <Pressable
          style={styles.bookmarkButton}
          onPress={() => handleBookmark(item.id)}
        >
          <Ionicons
            name={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={item.isBookmarked ? '#3B82F6' : '#9CA3AF'}
          />
        </Pressable>
      </View>

      <Text style={styles.author}>By {item.author}</Text>

      <View style={styles.tags}>
        {item.tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.guideFooter}>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={16} color="#6B7280" />
            <Text style={styles.statText}>{item.views}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={16} color="#6B7280" />
            <Text style={styles.statText}>{item.likes}</Text>
          </View>
        </View>
        <Text style={styles.updatedText}>Updated {item.lastUpdated}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            All Guides
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filterType === 'official' && styles.filterButtonActive]}
          onPress={() => setFilterType('official')}
        >
          <Text style={[styles.filterText, filterType === 'official' && styles.filterTextActive]}>
            Official
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filterType === 'community' && styles.filterButtonActive]}
          onPress={() => setFilterType('community')}
        >
          <Text style={[styles.filterText, filterType === 'community' && styles.filterTextActive]}>
            Community
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredGuides}
        renderItem={renderGuide}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No guides found</Text>
          </View>
        }
      />

      <Pressable style={styles.fab}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 12,
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  officialBadge: {
    backgroundColor: '#DBEAFE',
  },
  communityBadge: {
    backgroundColor: '#F3E8FF',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },
  windRange: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  bookmarkButton: {
    padding: 4,
  },
  author: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
  },
  guideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
  },
  updatedText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
