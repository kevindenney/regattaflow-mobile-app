/**
 * Results Search Interface Component
 * Provides unified search across all external racing results sources
 * Supports searching by sailor, venue, and regatta with advanced filtering
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';

interface SearchFilters {
  type: 'sailor' | 'venue' | 'regatta';
  query: string;
  sailorName?: string;
  sailNumber?: string;
  venueId?: string;
  startDate?: string;
  endDate?: string;
}

interface SearchResult {
  id: string;
  type: 'sailor_result' | 'regatta' | 'venue_regatta';
  title: string;
  subtitle: string;
  details: string;
  date?: string;
  venue?: string;
  position?: number;
  source: string;
}

interface ResultsSearchInterfaceProps {
  initialFilters?: Partial<SearchFilters>;
  onResultSelect?: (result: SearchResult) => void;
  style?: any;
}

export const ResultsSearchInterface: React.FC<ResultsSearchInterfaceProps> = ({
  initialFilters,
  onResultSelect,
  style,
}) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'sailor',
    query: '',
    ...initialFilters,
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (filters.query.length >= 3) {
      performSearch();
    } else {
      setResults([]);
      setTotalCount(0);
    }
  }, [filters]);

  const performSearch = async () => {
    if (!user || !filters.query) return;

    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('type', filters.type);
      searchParams.append('q', filters.query);

      if (filters.sailorName) searchParams.append('sailor', filters.sailorName);
      if (filters.sailNumber) searchParams.append('sail_number', filters.sailNumber);
      if (filters.venueId) searchParams.append('venue', filters.venueId);
      if (filters.startDate) searchParams.append('start_date', filters.startDate);
      if (filters.endDate) searchParams.append('end_date', filters.endDate);

      const response = await fetch(`/api/results/search?${searchParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedResults = formatSearchResults(data.results, filters.type);
        setResults(formattedResults);
        setTotalCount(data.totalCount);
      } else {
        Alert.alert('Error', 'Failed to search results');
      }
    } catch (error) {
      console.error('Error searching results:', error);
      Alert.alert('Error', 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const formatSearchResults = (rawResults: any[], searchType: string): SearchResult[] => {
    return rawResults.map((result, index) => {
      switch (searchType) {
        case 'sailor':
          return {
            id: result.id || `sailor-${index}`,
            type: 'sailor_result',
            title: `${result.regattaName || result.regatta_name || 'Unknown Regatta'}`,
            subtitle: `Race ${result.raceNumber || result.race_number || 'N/A'} - Position ${result.position}`,
            details: `${result.sailorName || result.sailor_name} • ${result.boatClass || result.boat_class}`,
            date: result.raceDate || result.race_date,
            venue: result.venue,
            position: result.position,
            source: result.sourceId || result.source_id || 'Unknown',
          };

        case 'regatta':
          return {
            id: result.id,
            type: 'regatta',
            title: result.name,
            subtitle: `${result.venue} • ${result.entryCount || result.entry_count || 0} entries`,
            details: `${result.boatClasses?.join(', ') || result.boat_classes?.join(', ') || 'Various classes'}`,
            date: result.startDate || result.start_date,
            venue: result.venue,
            source: result.sourceId || result.source_id || 'Unknown',
          };

        case 'venue':
          return {
            id: result.id,
            type: 'venue_regatta',
            title: result.name,
            subtitle: `${result.entryCount || result.entry_count || 0} entries • ${result.status}`,
            details: `${result.boatClasses?.join(', ') || result.boat_classes?.join(', ') || 'Various classes'}`,
            date: result.startDate || result.start_date,
            venue: result.venue,
            source: result.sourceId || result.source_id || 'Unknown',
          };

        default:
          return {
            id: result.id || `result-${index}`,
            type: 'sailor_result',
            title: 'Unknown Result',
            subtitle: '',
            details: '',
            source: 'Unknown',
          };
      }
    });
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderSearchTypeSelector = () => (
    <View style={styles.typeSelector}>
      {(['sailor', 'regatta', 'venue'] as const).map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.typeButton,
            filters.type === type && styles.typeButtonActive,
          ]}
          onPress={() => updateFilter('type', type)}
        >
          <Text
            style={[
              styles.typeButtonText,
              filters.type === type && styles.typeButtonTextActive,
            ]}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSearchInput = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder={getSearchPlaceholder()}
          value={filters.query}
          onChangeText={(text) => updateFilter('query', text)}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {loading && (
          <ActivityIndicator size="small" color="#0066CC" />
        )}
      </View>
    </View>
  );

  const getSearchPlaceholder = (): string => {
    switch (filters.type) {
      case 'sailor':
        return 'Search sailor name or sail number...';
      case 'regatta':
        return 'Search regatta name...';
      case 'venue':
        return 'Search by venue...';
      default:
        return 'Search...';
    }
  };

  const renderAdvancedFilters = () => {
    if (filters.type !== 'sailor') return null;

    return (
      <View style={styles.advancedFilters}>
        <Text style={styles.advancedFiltersTitle}>Advanced Filters</Text>

        <View style={styles.filterRow}>
          <View style={styles.filterInput}>
            <Text style={styles.filterLabel}>Sail Number</Text>
            <TextInput
              style={styles.filterTextInput}
              placeholder="Optional"
              value={filters.sailNumber || ''}
              onChangeText={(text) => updateFilter('sailNumber', text)}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterInput}>
            <Text style={styles.filterLabel}>Start Date</Text>
            <TextInput
              style={styles.filterTextInput}
              placeholder="YYYY-MM-DD"
              value={filters.startDate || ''}
              onChangeText={(text) => updateFilter('startDate', text)}
            />
          </View>

          <View style={styles.filterInput}>
            <Text style={styles.filterLabel}>End Date</Text>
            <TextInput
              style={styles.filterTextInput}
              placeholder="YYYY-MM-DD"
              value={filters.endDate || ''}
              onChangeText={(text) => updateFilter('endDate', text)}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderResultItem = (result: SearchResult) => (
    <TouchableOpacity
      key={result.id}
      style={styles.resultItem}
      onPress={() => onResultSelect?.(result)}
    >
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{result.title}</Text>
          {result.position && (
            <View style={[
              styles.positionBadge,
              { backgroundColor: getPositionColor(result.position) }
            ]}>
              <Text style={styles.positionText}>{result.position}</Text>
            </View>
          )}
        </View>

        <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
        <Text style={styles.resultDetails}>{result.details}</Text>

        <View style={styles.resultFooter}>
          {result.date && (
            <Text style={styles.resultDate}>
              {new Date(result.date).toLocaleDateString()}
            </Text>
          )}
          <Text style={styles.resultSource}>{result.source}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const getPositionColor = (position: number): string => {
    if (position === 1) return '#FFD700';
    if (position === 2) return '#C0C0C0';
    if (position === 3) return '#CD7F32';
    if (position <= 10) return '#00AA33';
    return '#666666';
  };

  const renderResults = () => {
    if (filters.query.length < 3) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#CCC" />
          <Text style={styles.emptyStateText}>
            Enter at least 3 characters to search
          </Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Searching results...</Text>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#CCC" />
          <Text style={styles.emptyStateText}>
            No results found for your search
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsHeader}>
          {totalCount} result{totalCount !== 1 ? 's' : ''} found
        </Text>
        {results.map(renderResultItem)}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, style]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Search Results</Text>
        <Text style={styles.subtitle}>
          Find racing results across all major sailing platforms
        </Text>
      </View>

      {renderSearchTypeSelector()}
      {renderSearchInput()}
      {renderAdvancedFilters()}
      {renderResults()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#0066CC',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  advancedFilters: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  advancedFiltersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterInput: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  filterTextInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  resultsContainer: {
    marginTop: 8,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 1px',
    elevation: 2,
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultDate: {
    fontSize: 12,
    color: '#666',
  },
  resultSource: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
});

export default ResultsSearchInterface;