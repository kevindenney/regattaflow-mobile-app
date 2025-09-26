/**
 * Global Venue Intelligence Component
 * Displays location-aware venue intelligence with cultural adaptation
 * Core UI for the "OnX Maps for Sailing" experience
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalVenueIntelligence } from '@/src/hooks/useGlobalVenueIntelligence';
import { WeatherIntelligence } from '@/src/components/weather/WeatherIntelligence';
import type { SailingVenue, VenueType } from '@/src/lib/types/global-venues';

interface GlobalVenueIntelligenceProps {
  onVenueSelected?: (venue: SailingVenue) => void;
  showNearbyVenues?: boolean;
  showCulturalBriefing?: boolean;
  currentLocation?: [number, number]; // [longitude, latitude]
}

export const GlobalVenueIntelligence: React.FC<GlobalVenueIntelligenceProps> = ({
  onVenueSelected,
  showNearbyVenues = true,
  showCulturalBriefing = true,
  currentLocation
}) => {
  const {
    currentVenue,
    venueConfidence,
    isDetecting,
    detectionMethod,
    nearbyVenues,
    culturalBriefing,
    venueRecommendations,
    homeVenue,
    visitedVenues,
    error,
    hasLocationPermission,
    selectVenue,
    searchVenues,
    getVenuesByRegion,
    toggleFavoriteVenue,
    setHomeVenue,
    getGlobalStats,
    clearError,
    isInitialized
  } = useGlobalVenueIntelligence();

  const [selectedTab, setSelectedTab] = useState<'current' | 'weather' | 'search' | 'history' | 'stats'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SailingVenue[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);

  // Load global stats
  useEffect(() => {
    if (isInitialized) {
      const stats = getGlobalStats();
      setGlobalStats(stats);
    }
  }, [isInitialized, getGlobalStats]);

  // Handle venue search
  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = searchVenues(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Handle venue selection
  const handleVenueSelect = async (venue: SailingVenue) => {
    try {
      await selectVenue(venue.id);
      onVenueSelected?.(venue);
    } catch (error: any) {
      Alert.alert('Error', `Failed to select venue: ${error.message}`);
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>🌍 Initializing Global Venue Intelligence...</Text>
        <Text style={styles.loadingSubtext}>Loading 147+ sailing venues worldwide</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌍 Global Venue Intelligence</Text>
        {!hasLocationPermission && (
          <Text style={styles.permissionWarning}>📍 Manual venue selection (location access denied)</Text>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.errorDismiss}>
            <Text style={styles.errorDismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'current' && styles.activeTab]}
          onPress={() => setSelectedTab('current')}
        >
          <Text style={[styles.tabText, selectedTab === 'current' && styles.activeTabText]}>
            Venue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'weather' && styles.activeTab]}
          onPress={() => setSelectedTab('weather')}
        >
          <Text style={[styles.tabText, selectedTab === 'weather' && styles.activeTabText]}>
            Weather
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'search' && styles.activeTab]}
          onPress={() => setSelectedTab('search')}
        >
          <Text style={[styles.tabText, selectedTab === 'search' && styles.activeTabText]}>
            Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
          onPress={() => setSelectedTab('history')}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'stats' && styles.activeTab]}
          onPress={() => setSelectedTab('stats')}
        >
          <Text style={[styles.tabText, selectedTab === 'stats' && styles.activeTabText]}>
            Global
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {selectedTab === 'current' && (
          <CurrentVenueTab
            currentVenue={currentVenue}
            venueConfidence={venueConfidence}
            isDetecting={isDetecting}
            detectionMethod={detectionMethod}
            nearbyVenues={showNearbyVenues ? nearbyVenues : []}
            culturalBriefing={showCulturalBriefing ? culturalBriefing : null}
            venueRecommendations={venueRecommendations}
            onVenueSelect={handleVenueSelect}
            onToggleFavorite={toggleFavoriteVenue}
            onSetHome={setHomeVenue}
          />
        )}

        {selectedTab === 'weather' && (
          <WeatherIntelligence
            venue={currentVenue}
            onRefresh={() => {}}
          />
        )}

        {selectedTab === 'search' && (
          <SearchTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
            searchResults={searchResults}
            onVenueSelect={handleVenueSelect}
          />
        )}

        {selectedTab === 'history' && (
          <HistoryTab
            homeVenue={homeVenue}
            visitedVenues={visitedVenues}
            onVenueSelect={handleVenueSelect}
            onSetHome={setHomeVenue}
          />
        )}

        {selectedTab === 'stats' && (
          <StatsTab globalStats={globalStats} />
        )}
      </ScrollView>
    </View>
  );
};

// Current Venue Tab Component
interface CurrentVenueTabProps {
  currentVenue: SailingVenue | null;
  venueConfidence: number;
  isDetecting: boolean;
  detectionMethod: 'gps' | 'network' | 'manual' | null;
  nearbyVenues: SailingVenue[];
  culturalBriefing: any;
  venueRecommendations: SailingVenue[];
  onVenueSelect: (venue: SailingVenue) => void;
  onToggleFavorite: (venue: SailingVenue) => void;
  onSetHome: (venue: SailingVenue) => void;
}

const CurrentVenueTab: React.FC<CurrentVenueTabProps> = ({
  currentVenue,
  venueConfidence,
  isDetecting,
  detectionMethod,
  nearbyVenues,
  culturalBriefing,
  venueRecommendations,
  onVenueSelect,
  onToggleFavorite,
  onSetHome
}) => {
  if (isDetecting) {
    return (
      <View style={styles.detectingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.detectingText}>Detecting your sailing venue...</Text>
      </View>
    );
  }

  if (!currentVenue) {
    return (
      <View style={styles.noVenueContainer}>
        <Text style={styles.noVenueTitle}>📍 Location Unknown</Text>
        <Text style={styles.noVenueText}>
          We couldn't detect a sailing venue near your location. Try searching for a specific venue or enable location services.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.currentVenueContainer}>
      {/* Current Venue Card */}
      <View style={styles.venueCard}>
        <View style={styles.venueHeader}>
          <Text style={styles.venueName}>{currentVenue.name}</Text>
          <View style={styles.venueActions}>
            <TouchableOpacity onPress={() => onToggleFavorite(currentVenue)}>
              <Ionicons name="heart-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSetHome(currentVenue)}>
              <Ionicons name="home-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.venueLocation}>{currentVenue.country} • {currentVenue.region}</Text>
        <Text style={styles.venueType}>{getVenueTypeLabel(currentVenue.venueType)}</Text>

        {detectionMethod && (
          <View style={styles.detectionInfo}>
            <Text style={styles.detectionText}>
              Detected via {getDetectionMethodLabel(detectionMethod)}
              ({Math.round(venueConfidence * 100)}% confidence)
            </Text>
          </View>
        )}

        {/* Yacht Clubs */}
        {currentVenue.primaryClubs && currentVenue.primaryClubs.length > 0 && (
          <View style={styles.clubsSection}>
            <Text style={styles.sectionTitle}>🏆 Yacht Clubs</Text>
            {currentVenue.primaryClubs.slice(0, 3).map((club, index) => (
              <Text key={index} style={styles.clubName}>• {club.name}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Cultural Briefing */}
      {culturalBriefing && (
        <View style={styles.briefingCard}>
          <Text style={styles.briefingTitle}>🌐 Cultural Briefing</Text>
          <Text style={styles.briefingLanguage}>
            Primary Language: {culturalBriefing.languageInfo.primaryLanguage.name}
          </Text>
          <Text style={styles.briefingCurrency}>
            Currency: {culturalBriefing.economicInfo.currency}
          </Text>
          {culturalBriefing.practicalTips.slice(0, 2).map((tip: any, index: number) => (
            <Text key={index} style={styles.practicalTip}>💡 {tip.tip}</Text>
          ))}
        </View>
      )}

      {/* Nearby Venues */}
      {nearbyVenues.length > 0 && (
        <View style={styles.nearbySection}>
          <Text style={styles.sectionTitle}>📍 Nearby Sailing Venues</Text>
          {nearbyVenues.slice(0, 5).map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={styles.nearbyVenue}
              onPress={() => onVenueSelect(venue)}
            >
              <Text style={styles.nearbyVenueName}>{venue.name}</Text>
              <Text style={styles.nearbyVenueType}>{getVenueTypeLabel(venue.venueType)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {venueRecommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>✨ Recommended Venues</Text>
          {venueRecommendations.slice(0, 3).map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={styles.recommendedVenue}
              onPress={() => onVenueSelect(venue)}
            >
              <Text style={styles.recommendedVenueName}>{venue.name}</Text>
              <Text style={styles.recommendedVenueLocation}>{venue.country}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Search Tab Component
interface SearchTabProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (query: string) => void;
  searchResults: SailingVenue[];
  onVenueSelect: (venue: SailingVenue) => void;
}

const SearchTab: React.FC<SearchTabProps> = ({
  searchQuery,
  setSearchQuery,
  onSearch,
  searchResults,
  onVenueSelect
}) => {
  return (
    <View style={styles.searchContainer}>
      <Text style={styles.searchTitle}>🔍 Search Global Venues</Text>
      <Text style={styles.searchSubtitle}>Search 147+ sailing venues worldwide</Text>

      {/* Search Input */}
      <View style={styles.searchInputContainer}>
        {/* Note: In a real implementation, you'd use TextInput here */}
        <Text style={styles.searchPlaceholder}>Search venues, cities, or clubs...</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => onSearch('hong kong')} // Demo search
        >
          <Text style={styles.searchButtonText}>Demo Search: Hong Kong</Text>
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.searchResults}>
          <Text style={styles.resultsTitle}>Search Results ({searchResults.length})</Text>
          {searchResults.map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={styles.searchResultItem}
              onPress={() => onVenueSelect(venue)}
            >
              <Text style={styles.searchResultName}>{venue.name}</Text>
              <Text style={styles.searchResultLocation}>{venue.country} • {venue.region}</Text>
              <Text style={styles.searchResultType}>{getVenueTypeLabel(venue.venueType)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// History Tab Component
interface HistoryTabProps {
  homeVenue: SailingVenue | null;
  visitedVenues: SailingVenue[];
  onVenueSelect: (venue: SailingVenue) => void;
  onSetHome: (venue: SailingVenue) => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({
  homeVenue,
  visitedVenues,
  onVenueSelect,
  onSetHome
}) => {
  return (
    <View style={styles.historyContainer}>
      {/* Home Venue */}
      {homeVenue && (
        <View style={styles.homeVenueSection}>
          <Text style={styles.sectionTitle}>🏠 Home Venue</Text>
          <TouchableOpacity
            style={styles.homeVenueCard}
            onPress={() => onVenueSelect(homeVenue)}
          >
            <Text style={styles.homeVenueName}>{homeVenue.name}</Text>
            <Text style={styles.homeVenueLocation}>{homeVenue.country}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Visited Venues */}
      <View style={styles.visitedSection}>
        <Text style={styles.sectionTitle}>📝 Recently Visited ({visitedVenues.length})</Text>
        {visitedVenues.length === 0 ? (
          <Text style={styles.emptyText}>No venues visited yet</Text>
        ) : (
          visitedVenues.slice(0, 10).map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={styles.visitedVenueItem}
              onPress={() => onVenueSelect(venue)}
            >
              <Text style={styles.visitedVenueName}>{venue.name}</Text>
              <Text style={styles.visitedVenueLocation}>{venue.country}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};

// Stats Tab Component
interface StatsTabProps {
  globalStats: any;
}

const StatsTab: React.FC<StatsTabProps> = ({ globalStats }) => {
  if (!globalStats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text>Loading global statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>🌍 Global Sailing Intelligence</Text>

      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{globalStats.totalVenues}</Text>
        <Text style={styles.statLabel}>Total Venues Worldwide</Text>
      </View>

      <View style={styles.venueTypeStats}>
        <Text style={styles.sectionTitle}>Venues by Type</Text>
        {Object.entries(globalStats.venuesByType).map(([type, count]: [string, any]) => (
          <View key={type} style={styles.statRow}>
            <Text style={styles.statTypeLabel}>{getVenueTypeLabel(type as VenueType)}</Text>
            <Text style={styles.statTypeValue}>{count}</Text>
          </View>
        ))}
      </View>

      <View style={styles.regionStats}>
        <Text style={styles.sectionTitle}>Top Sailing Regions</Text>
        {globalStats.topSailingCountries?.slice(0, 5).map((item: any, index: number) => (
          <View key={item.country} style={styles.statRow}>
            <Text style={styles.regionLabel}>{item.country}</Text>
            <Text style={styles.regionValue}>{item.count} venues</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Helper Functions
function getVenueTypeLabel(type: VenueType): string {
  const labels: Record<VenueType, string> = {
    championship: 'Championship Venue',
    premier: 'Premier Racing Center',
    regional: 'Regional Hub',
    local: 'Local Venue',
    club: 'Yacht Club'
  };
  return labels[type] || type;
}

function getDetectionMethodLabel(method: 'gps' | 'network' | 'manual'): string {
  const labels = {
    gps: 'GPS',
    network: 'Network Location',
    manual: 'Manual Selection'
  };
  return labels[method] || method;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  permissionWarning: {
    marginTop: 4,
    fontSize: 12,
    color: '#FF9500',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    color: '#D32F2F',
    fontSize: 14,
  },
  errorDismiss: {
    padding: 4,
  },
  errorDismissText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  currentVenueContainer: {
    padding: 20,
  },
  venueCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  venueName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  venueActions: {
    flexDirection: 'row',
    gap: 12,
  },
  venueLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  venueType: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  detectionInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detectionText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  clubsSection: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  clubName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  briefingCard: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  briefingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  briefingLanguage: {
    fontSize: 13,
    color: '#4CAF50',
    marginBottom: 4,
  },
  briefingCurrency: {
    fontSize: 13,
    color: '#4CAF50',
    marginBottom: 8,
  },
  practicalTip: {
    fontSize: 12,
    color: '#558B2F',
    marginBottom: 4,
    lineHeight: 16,
  },
  nearbySection: {
    marginBottom: 16,
  },
  nearbyVenue: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  nearbyVenueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  nearbyVenueType: {
    fontSize: 12,
    color: '#666',
  },
  recommendationsSection: {
    marginBottom: 16,
  },
  recommendedVenue: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  recommendedVenueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
  },
  recommendedVenueLocation: {
    fontSize: 12,
    color: '#FF8F00',
  },
  detectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  detectingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  noVenueContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noVenueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noVenueText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchContainer: {
    padding: 20,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  searchInputContainer: {
    marginBottom: 20,
  },
  searchPlaceholder: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    color: '#999',
    marginBottom: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchResults: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  searchResultItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  searchResultLocation: {
    fontSize: 12,
    color: '#666',
  },
  searchResultType: {
    fontSize: 11,
    color: '#007AFF',
  },
  historyContainer: {
    padding: 20,
  },
  homeVenueSection: {
    marginBottom: 20,
  },
  homeVenueCard: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  homeVenueName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
  homeVenueLocation: {
    fontSize: 12,
    color: '#4CAF50',
  },
  visitedSection: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  visitedVenueItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  visitedVenueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  visitedVenueLocation: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  statCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#B3D9FF',
    textAlign: 'center',
  },
  venueTypeStats: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  regionStats: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statTypeLabel: {
    fontSize: 13,
    color: '#666',
  },
  statTypeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  regionLabel: {
    fontSize: 13,
    color: '#666',
  },
  regionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
});

export default GlobalVenueIntelligence;