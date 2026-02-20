import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import { useRouter } from 'expo-router';
import { CoachSearchFilters, CoachSearchResult, SkillLevel } from '../../types/coach';
import { CoachMarketplaceService } from '@/services/CoachingService';
import CoachCard from './CoachCard';
import CoachFilters from './CoachFilters';

export default function CoachDiscovery() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [coaches, setCoaches] = useState<CoachSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CoachSearchFilters>({});

  // Load initial coaches
  useEffect(() => {
    loadCoaches();
  }, [filters]);

  const loadCoaches = async (pageNum: number = 1, searchTerm?: string) => {
    setLoading(true);
    try {
      const searchFilters = {
        ...filters,
        ...(searchTerm && { location: searchTerm }),
      };

      const response = await CoachMarketplaceService.searchCoaches(searchFilters, pageNum, 20);

      if (pageNum === 1) {
        setCoaches(response.coaches);
      } else {
        setCoaches(prev => [...prev, ...response.coaches]);
      }

      setTotalCount(response.total_count);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading coaches:', error);
      showAlert('Error', 'Failed to load coaches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadCoaches(1, searchQuery);
  };

  const handleFilterApply = (newFilters: CoachSearchFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const loadMoreCoaches = () => {
    if (!loading && coaches.length < totalCount) {
      loadCoaches(page + 1);
    }
  };

  const handleCoachPress = (coach: CoachSearchResult) => {
    router.push(`/coach/${coach.id}`);
  };

  const handleBookPress = (coach: CoachSearchResult) => {
    router.push(`/coach/${coach.id}/book`);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.boat_classes?.length) count++;
    if (filters.specialties?.length) count++;
    if (filters.skill_levels?.length) count++;
    if (filters.price_range) count++;
    if (filters.rating) count++;
    if (filters.languages?.length) count++;
    return count;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Coach</Text>
        <Text style={styles.subtitle}>
          Connect with world-class sailing coaches for personalized instruction
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location, boat class, or coach name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={[styles.filterButton, getActiveFiltersCount() > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={[styles.filterButtonText, getActiveFiltersCount() > 0 && styles.filterButtonTextActive]}>
            Filters
            {getActiveFiltersCount() > 0 && ` (${getActiveFiltersCount()})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {totalCount} coaches found
        </Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Best Match ⌄</Text>
        </TouchableOpacity>
      </View>

      {/* Coach List */}
      <ScrollView
        style={styles.coachList}
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={loadMoreCoaches}
      >
        {coaches.map((coach) => (
          <CoachCard
            key={coach.id}
            coach={coach}
            onPress={() => handleCoachPress(coach)}
            onBookPress={() => handleBookPress(coach)}
          />
        ))}

        {/* Loading More Indicator */}
        {loading && coaches.length > 0 && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#0066CC" />
            <Text style={styles.loadingText}>Loading more coaches...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && coaches.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No coaches found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search criteria or filters to find more coaches.
            </Text>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => setFilters({})}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Initial Loading */}
        {loading && coaches.length === 0 && (
          <View style={styles.initialLoading}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Finding the best coaches for you...</Text>
          </View>
        )}
      </ScrollView>

      {/* Filters Modal */}
      {showFilters && (
        <CoachFilters
          filters={filters}
          onApply={handleFilterApply}
          onClose={() => setShowFilters(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 18,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 16,
    color: '#666',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '500',
  },
  coachList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  clearFiltersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0066CC',
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  initialLoading: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
});