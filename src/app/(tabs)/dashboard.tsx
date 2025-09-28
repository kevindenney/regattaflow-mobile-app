/**
 * Enhanced Sailor Dashboard - "OnX Maps for Sailing" Experience
 * Integrates global venue intelligence, AI race strategy, and advanced components
 * Represents the comprehensive sailor journey planned in sailor-experience.md
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalVenueIntelligence } from '@/src/components/venue/GlobalVenueIntelligence';
import { WeatherIntelligence } from '@/src/components/weather/WeatherIntelligence';
import { AIRaceAnalysisDashboard } from '@/src/components/ai/AIRaceAnalysisDashboard';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { useGlobalVenueIntelligence } from '@/src/hooks/useGlobalVenueIntelligence';

interface DashboardStats {
  total_regattas: number;
  total_documents: number;
  avg_position: number;
  best_position: number;
  recent_races: number;
  venues_visited: number;
  global_ranking: number;
}

interface RecentEvent {
  id: string;
  title: string;
  start_date: string;
  status: string;
  position?: number;
  fleet_size?: number;
  venue?: string;
  country?: string;
}

// VenueAdaptation interface removed - using real venue intelligence from hook

export default function DashboardScreen() {
  console.log('🌍 Enhanced Dashboard: Loading Global Venue Intelligence System');
  console.log('📊 Dashboard: "OnX Maps for Sailing" Experience Initializing');

  const { user, signedIn, ready, loading: authLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  // Debug auth state in dashboard
  console.log('📊 [DASHBOARD] ===== DASHBOARD RENDER =====');
  console.log('📊 [DASHBOARD] Current URL:', window.location.href);
  console.log('📊 [DASHBOARD] Auth state:', {
    hasUser: !!user,
    signedIn,
    ready,
    authLoading,
    userEmail: user?.email || 'null'
  });
  console.log('📊 [DASHBOARD] Component should render:', ready && signedIn);
  console.log('📊 [DASHBOARD] ===== DASHBOARD RENDER COMPLETE =====');

  // Auth Guard: Redirect to landing page if not authenticated
  useEffect(() => {
    if (ready && !signedIn && !authLoading) {
      console.log('🚨 [DASHBOARD] Auth guard triggered - user not signed in');
      console.log('🚨 [DASHBOARD] Redirecting to landing page...');
      console.log('🚨 [DASHBOARD] Current URL before redirect:', window.location.href);

      if (Platform.OS === 'web') {
        window.location.href = '/';
      } else {
        router.replace('/');
      }
    }
  }, [ready, signedIn, authLoading]);

  // Global Venue Intelligence - real location-aware system
  const venueIntelligence = useGlobalVenueIntelligence();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [selectedSection, setSelectedSection] = useState<'overview' | 'venue' | 'weather' | 'strategy' | 'analytics'>('overview');

  useEffect(() => {
    loadEnhancedDashboardData();
  }, []);

  const loadEnhancedDashboardData = async () => {
    try {
      console.log('🔄 Loading enhanced dashboard with global intelligence...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Enhanced stats with global context
      setStats({
        total_regattas: 23,
        total_documents: 67,
        avg_position: 4.2,
        best_position: 1,
        recent_races: 5,
        venues_visited: 12,
        global_ranking: 47
      });

      // Global sailing events with venue context
      setRecentEvents([
        {
          id: '1',
          title: 'Dragon World Championship Qualifier',
          start_date: '2024-10-15',
          status: 'upcoming',
          fleet_size: 42,
          venue: 'Royal Hong Kong Yacht Club',
          country: 'Hong Kong'
        },
        {
          id: '2',
          title: 'Hiroshima Bay Dragon Cup',
          start_date: '2024-09-22',
          status: 'completed',
          position: 3,
          fleet_size: 28,
          venue: 'Hiroshima Sailing Club',
          country: 'Japan'
        },
        {
          id: '3',
          title: 'Mediterranean Dragon Circuit',
          start_date: '2024-09-08',
          status: 'completed',
          position: 7,
          fleet_size: 35,
          venue: 'Porto Cervo',
          country: 'Italy'
        }
      ]);

      // Real venue intelligence will be loaded by the hook automatically

      console.log('✅ Enhanced dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load enhanced dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEnhancedDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>🌍 Initializing Global Sailing Intelligence...</Text>
        <Text style={styles.loadingSubtext}>Loading venue detection and cultural adaptation</Text>
      </View>
    );
  }

  const renderOverviewSection = () => (
    <ScrollView style={styles.overviewContent} showsVerticalScrollIndicator={false}>
      {/* Global Context Header - Real Venue Intelligence */}
      {venueIntelligence.currentVenue && (
        <View style={styles.venueContextCard}>
          <LinearGradient
            colors={['#4C63D2', '#667eea']}
            style={styles.venueHeader}
          >
            <View style={styles.venueInfo}>
              <Text style={styles.venueTitle}>📍 Current Location</Text>
              <Text style={styles.venueName}>{venueIntelligence.currentVenue.name}</Text>
              <Text style={styles.venueLocation}>
                {venueIntelligence.currentVenue.country} • {venueIntelligence.currentVenue.region}
              </Text>
              {venueIntelligence.isDetecting && (
                <Text style={styles.detectionStatus}>🔍 Detecting location...</Text>
              )}
              {venueIntelligence.venueConfidence > 0 && (
                <Text style={styles.confidenceLevel}>
                  Confidence: {Math.round(venueIntelligence.venueConfidence * 100)}%
                </Text>
              )}
            </View>
            <View style={styles.cultureInfo}>
              <Text style={styles.cultureLabel}>🌐 Cultural Context</Text>
              <Text style={styles.cultureDetail}>
                {venueIntelligence.currentVenue.culturalContext?.primaryLanguages?.[0]?.name || 'English'}
              </Text>
              <Text style={styles.cultureDetail}>
                {venueIntelligence.currentVenue.culturalContext?.economicFactors?.currency || 'USD'}
              </Text>
              {venueIntelligence.isTransitioning && (
                <Text style={styles.transitionStatus}>🔄 Adapting to venue...</Text>
              )}
            </View>
          </LinearGradient>
        </View>
      )}

      {/* No Venue Detected State */}
      {!venueIntelligence.currentVenue && !venueIntelligence.isDetecting && (
        <View style={styles.venueContextCard}>
          <LinearGradient
            colors={['#6B7280', '#9CA3AF']}
            style={styles.venueHeader}
          >
            <View style={styles.venueInfo}>
              <Text style={styles.venueTitle}>📍 Location Detection</Text>
              <Text style={styles.venueName}>No venue detected</Text>
              <Text style={styles.venueLocation}>
                {venueIntelligence.detectionMethod === 'manual' ? 'Manual selection available' : 'Searching for sailing venues...'}
              </Text>
              <TouchableOpacity
                style={styles.forceDetectionButton}
                onPress={() => venueIntelligence.forceVenueDetection()}
              >
                <Text style={styles.forceDetectionText}>🔍 Detect Current Location</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Enhanced Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="trophy-outline" size={24} color="#0066CC" />
          <Text style={styles.statNumber}>{stats?.total_regattas || 0}</Text>
          <Text style={styles.statLabel}>Total Regattas</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="location-outline" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{stats?.venues_visited || 0}</Text>
          <Text style={styles.statLabel}>Venues Visited</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="podium-outline" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats?.avg_position?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.statLabel}>Avg Position</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="globe-outline" size={24} color="#9C27B0" />
          <Text style={styles.statNumber}>#{stats?.global_ranking || 0}</Text>
          <Text style={styles.statLabel}>Global Ranking</Text>
        </View>
      </View>

      {/* AI-Powered Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧠 AI-Powered Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.aiActionCard]}
            onPress={() => setSelectedSection('strategy')}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.actionGradient}
            >
              <Ionicons name="bulb" size={28} color="white" />
              <Text style={styles.aiActionText}>Generate Strategy</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.aiActionCard]}
            onPress={() => setSelectedSection('venue')}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.actionGradient}
            >
              <Ionicons name="compass-outline" size={28} color="white" />
              <Text style={styles.aiActionText}>Venue Intelligence</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.aiActionCard]}
            onPress={() => setSelectedSection('weather')}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={styles.actionGradient}
            >
              <Ionicons name="cloudy-outline" size={28} color="white" />
              <Text style={styles.aiActionText}>Weather Intel</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Global Race Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌍 Global Racing Calendar</Text>
        {recentEvents.map((event) => (
          <TouchableOpacity key={event.id} style={styles.eventCard}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventVenue}>{event.venue} • {event.country}</Text>
              <Text style={styles.eventDate}>{event.start_date}</Text>
              {event.position && (
                <Text style={styles.eventPosition}>
                  🏆 Position: {event.position}/{event.fleet_size}
                </Text>
              )}
            </View>
            <View style={[styles.statusBadge,
              { backgroundColor: event.status === 'completed' ? '#10B981' : '#F59E0B' }]}>
              <Text style={styles.statusText}>{event.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header with Global Context */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Sailor'}! 🌍</Text>
          <Text style={styles.subtitle}>Global Sailing Intelligence Dashboard</Text>
        </View>
        {venueIntelligence.currentVenue && (
          <View style={styles.venueIndicator}>
            <Ionicons name="location" size={12} color="#0066CC" />
            <Text style={styles.venueIndicatorText}>{venueIntelligence.currentVenue.country}</Text>
          </View>
        )}
      </View>

      {/* Section Navigation */}
      <View style={styles.sectionNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: '🏠 Overview', icon: 'home' },
            { key: 'venue', label: '🌍 Venue Intel', icon: 'location' },
            { key: 'weather', label: '🌤️ Weather', icon: 'cloudy' },
            { key: 'strategy', label: '🧠 AI Strategy', icon: 'bulb' },
            { key: 'analytics', label: '📊 Analytics', icon: 'analytics' }
          ].map(section => (
            <TouchableOpacity
              key={section.key}
              style={[
                styles.sectionButton,
                selectedSection === section.key && styles.sectionButtonActive
              ]}
              onPress={() => setSelectedSection(section.key as any)}
            >
              <Text style={[
                styles.sectionButtonText,
                selectedSection === section.key && styles.sectionButtonTextActive
              ]}>
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dynamic Content Based on Selection */}
      <View style={styles.content}>
        {selectedSection === 'overview' && (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {renderOverviewSection()}
          </ScrollView>
        )}

        {selectedSection === 'venue' && (
          <GlobalVenueIntelligence
            currentVenue={venueIntelligence.currentVenue}
            nearbyVenues={venueIntelligence.nearbyVenues}
            culturalBriefing={venueIntelligence.culturalBriefing}
            isDetecting={venueIntelligence.isDetecting}
            confidence={venueIntelligence.venueConfidence}
            onVenueSelected={(venue) => {
              console.log('📍 Venue selected manually:', venue.name);
              venueIntelligence.selectVenue(venue.id);
            }}
            onForceDetection={venueIntelligence.forceVenueDetection}
            onToggleFavorite={venueIntelligence.toggleFavoriteVenue}
            showNearbyVenues={true}
            showCulturalBriefing={true}
            showWeatherPreview={true}
            showVenueTransition={venueIntelligence.isTransitioning}
          />
        )}

        {selectedSection === 'weather' && (
          <WeatherIntelligence
            venue={venueIntelligence.currentVenue}
            nearbyVenues={venueIntelligence.nearbyVenues}
            onRefresh={onRefresh}
            isLoading={venueIntelligence.isDetecting}
            weatherData={venueIntelligence.weather}
            culturalContext={venueIntelligence.culturalBriefing}
            regionalSources={venueIntelligence.currentVenue?.weatherSources}
            showComparison={venueIntelligence.nearbyVenues.length > 0}
            showRegionalContext={true}
            onVenueWeatherSelected={(venue) => {
              console.log('🌤️ Weather view switched to venue:', venue.name);
              venueIntelligence.selectVenue(venue.id);
            }}
          />
        )}

        {selectedSection === 'strategy' && (
          <AIRaceAnalysisDashboard
            currentVenue={venueIntelligence.currentVenue}
            venueIntelligence={venueIntelligence}
            weatherData={venueIntelligence.weather}
            culturalContext={venueIntelligence.culturalBriefing}
            onStrategyGenerated={(strategy) => {
              console.log('🧠 AI Strategy generated for venue:', venueIntelligence.currentVenue?.name);
              console.log('🧠 Strategy confidence:', strategy.confidence);
              console.log('🧠 Venue-adapted strategy:', strategy.venueSpecific);
            }}
            onInsightGenerated={(insight) => {
              console.log('💡 Tactical insight:', insight.type);
              console.log('💡 Venue context:', insight.venueContext);
            }}
            onVenueStrategyUpdate={(venueStrategy) => {
              console.log('🌍 Venue-specific strategy updated:', venueStrategy.adaptations);
            }}
          />
        )}

        {selectedSection === 'analytics' && (
          <View style={styles.comingSoonContainer}>
            <Ionicons name="analytics" size={64} color="#DDD" />
            <Text style={styles.comingSoonTitle}>Advanced Analytics</Text>
            <Text style={styles.comingSoonText}>
              Performance correlation, venue comparison, and championship progress tracking coming soon.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
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
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  venueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  venueIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  sectionNav: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  sectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  sectionButtonActive: {
    backgroundColor: '#1E40AF',
  },
  sectionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  sectionButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  overviewContent: {
    flex: 1,
  },
  venueContextCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  venueHeader: {
    flexDirection: 'row',
    padding: 20,
  },
  venueInfo: {
    flex: 1,
  },
  venueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cultureInfo: {
    alignItems: 'flex-end',
  },
  cultureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  cultureDetail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  aiActionCard: {
    backgroundColor: 'transparent',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  aiActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 2,
    fontWeight: '500',
  },
  eventDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  eventPosition: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Venue Detection Styles
  detectionStatus: {
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 4,
    fontStyle: 'italic',
  },
  confidenceLevel: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 2,
  },
  transitionStatus: {
    fontSize: 12,
    color: '#FCD34D',
    marginTop: 4,
    fontWeight: '500',
  },
  forceDetectionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  forceDetectionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});