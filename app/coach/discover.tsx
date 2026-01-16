import { useSailorDashboardData } from '@/hooks/useSailorDashboardData';
import { useAuth } from '@/providers/AuthProvider';
import { coachingService, CoachProfile } from '@/services/CoachingService';
import { CoachMatchingAgent } from '@/services/agents/CoachMatchingAgent';
import { supabase } from '@/services/supabase';
import { TufteCoachRow } from '@/components/coach/TufteCoachRow';
import { TufteFiltersBar } from '@/components/coach/TufteFiltersBar';
import { ForYouSection } from '@/components/coach/ForYouSection';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
} from 'react-native';

interface CoachWithScore extends CoachProfile {
  display_name?: string | null;
  profile_photo_url?: string | null;
  compatibilityScore?: number;
  matchReasoning?: string;
  recommendations?: string[];
  scoreBreakdown?: {
    experienceMatch: number;
    teachingStyleMatch: number;
    specialtyAlignment: number;
    successRateRelevance: number;
    availabilityMatch: number;
    locationConvenience: number;
    valueScore: number;
  };
  skillGaps?: Array<{ skill: string; priority: string; reasoning: string }>;
}

type SortKey = 'rating' | 'sessions' | 'price' | 'name';

/**
 * CoachDiscoveryScreen - Tufte-inspired coach discovery
 *
 * Design principles:
 * - High data-ink ratio
 * - Dense, scannable rows
 * - Always-on AI recommendations (when user has data)
 * - Immediate filtering via dropdown bar
 */
export default function CoachDiscoveryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const sailorData = useSailorDashboardData();

  // Data state
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<CoachWithScore[]>([]);
  const [aiMatches, setAiMatches] = useState<CoachWithScore[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContext, setAiContext] = useState<string>('Based on your sailing profile');

  // Filter state
  const [filters, setFilters] = useState({
    location: '',
    specialty: '',
    maxRate: '',
    boatClass: '',
  });

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('rating');

  // Load coaches on mount
  useEffect(() => {
    loadCoaches();
  }, []);

  // Auto-run AI matching when user is logged in and has data
  useEffect(() => {
    if (user && sailorData.classes.length > 0) {
      runAIMatching();
    }
  }, [user, sailorData.classes.length]);

  // Reload coaches when filters change
  useEffect(() => {
    loadCoaches();
  }, [filters]);

  const loadCoaches = async () => {
    try {
      setLoading(true);

      // Build filter query - coach_profiles already has display_name
      let query = supabase
        .from('coach_profiles')
        .select('*')
        .eq('is_verified', true)
        .eq('is_active', true);

      // Apply filters
      if (filters.location) {
        query = query.ilike('location_name', `%${filters.location}%`);
      }
      if (filters.specialty) {
        query = query.contains('specializations', [filters.specialty]);
      }
      if (filters.maxRate) {
        query = query.lte('hourly_rate', parseInt(filters.maxRate));
      }

      const { data: results, error } = await query.order('rating', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Map to expected format
      const coachesWithNames = (results || []).map(coach => ({
        ...coach,
        // Map column names to expected interface
        average_rating: coach.rating ? parseFloat(coach.rating) : 0,
        specialties: coach.specializations || [],
        based_at: coach.location_name,
      }));

      setCoaches(coachesWithNames);
    } catch (error) {
      console.error('Error loading coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAIMatching = async () => {
    if (!user) return;

    try {
      setAiLoading(true);

      // Get sailor profile
      const { data: sailorProfile, error: profileError } = await supabase
        .from('sailor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !sailorProfile) {
        // No profile, skip AI matching silently
        setAiLoading(false);
        return;
      }

      // Build context description
      const boatClass = sailorProfile.boat_classes?.[0] || sailorData.classes[0]?.name;
      const venue = sailorData.venues.currentVenue?.name;
      if (boatClass && venue) {
        setAiContext(`Based on your ${boatClass} racing at ${venue}`);
      } else if (boatClass) {
        setAiContext(`Based on your ${boatClass} sailing`);
      }

      // Run AI matching
      const agent = new CoachMatchingAgent();
      const result = await agent.matchSailorWithCoach(
        user.id,
        {
          ...sailorProfile,
          sailing_experience: sailorProfile.sailing_experience || 5,
          boat_classes: sailorProfile.boat_classes || sailorData.classes.map(c => c.name),
          goals: sailorProfile.goals || 'Improve racing performance',
          competitive_level: sailorProfile.competitive_level || 'intermediate',
        },
        {
          boatClass: sailorProfile.boat_classes?.[0] || sailorData.classes[0]?.name,
          venueId: sailorData.venues.currentVenue?.id,
          goals: sailorProfile.goals,
        }
      );

      if (!result.success || !result.result) {
        setAiLoading(false);
        return;
      }

      // Process AI results
      const agentData = result.result;
      const scores = agentData.scores || [];
      const skillGaps = agentData.skillGaps || [];

      // Get coach profiles for scored coaches
      const coachIds = scores.map((s: any) => s.coachId);
      if (coachIds.length === 0) {
        setAiLoading(false);
        return;
      }

      const { data: coachProfiles } = await supabase
        .from('coach_profiles')
        .select(`*, users!inner(first_name, last_name, email)`)
        .in('id', coachIds);

      if (!coachProfiles) {
        setAiLoading(false);
        return;
      }

      // Merge scores with profiles
      const matchedCoaches: CoachWithScore[] = coachProfiles.map((coach) => {
        const score = scores.find((s: any) => s.coachId === coach.id);
        return {
          ...coach,
          display_name: `${coach.users.first_name} ${coach.users.last_name}`,
          compatibilityScore: score?.overallScore ? score.overallScore / 100 : 0,
          matchReasoning: score?.reasoning,
          recommendations: score?.recommendations,
          scoreBreakdown: score?.breakdown,
          skillGaps,
        };
      });

      // Sort by score
      matchedCoaches.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));

      setAiMatches(matchedCoaches);

      // Save scores to database (background, non-blocking)
      saveMatchScores(matchedCoaches, agentData);
    } catch (error) {
      console.error('AI matching error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const saveMatchScores = async (coaches: CoachWithScore[], agentData: any) => {
    if (!user) return;

    try {
      const matchRecords = coaches
        .filter(coach => coach.compatibilityScore !== undefined)
        .map(coach => ({
          user_id: user.id,
          coach_id: coach.id,
          compatibility_score: coach.compatibilityScore,
          skill_gap_analysis: agentData.skillGaps || null,
          match_reasoning: coach.matchReasoning || '',
          performance_data_used: {
            trends: agentData.trends || {},
            recentResults: agentData.recentResults || [],
          },
          score_breakdown: coach.scoreBreakdown || null,
        }));

      await supabase
        .from('coach_match_scores')
        .upsert(matchRecords, { onConflict: 'user_id,coach_id' });
    } catch (error) {
      console.error('Error saving match scores:', error);
    }
  };

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCoachPress = useCallback((coachId: string) => {
    router.push(`/coach/${coachId}`);
  }, [router]);

  // Sort coaches
  const sortedCoaches = [...coaches].sort((a, b) => {
    switch (sortKey) {
      case 'rating':
        return (b.average_rating || 0) - (a.average_rating || 0);
      case 'sessions':
        return (b.total_sessions || 0) - (a.total_sessions || 0);
      case 'price':
        return (a.hourly_rate || 0) - (b.hourly_rate || 0);
      case 'name':
        return (a.display_name || '').localeCompare(b.display_name || '');
      default:
        return 0;
    }
  });

  // Filter out AI matches from main list to avoid duplicates
  const aiMatchIds = new Set(aiMatches.map(c => c.id));
  const filteredCoaches = sortedCoaches.filter(c => !aiMatchIds.has(c.id));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find a Coach</Text>
      </View>

      {/* Filter Bar */}
      <TufteFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Content */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {/* AI Recommendations (always-on when user has data) */}
        {(aiMatches.length > 0 || aiLoading) && (
          <ForYouSection
            coaches={aiMatches}
            onCoachPress={handleCoachPress}
            isLoading={aiLoading}
            contextDescription={aiContext}
          />
        )}

        {/* Sort controls */}
        <View style={styles.sortBar}>
          <Text style={styles.resultCount}>
            {loading ? 'Loading...' : `${filteredCoaches.length} coaches`}
          </Text>
          <View style={styles.sortButtons}>
            {(['rating', 'sessions', 'price'] as SortKey[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.sortButton,
                  sortKey === key && styles.sortButtonActive,
                ]}
                onPress={() => setSortKey(key)}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortKey === key && styles.sortButtonTextActive,
                  ]}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Coach List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#666" />
          </View>
        ) : filteredCoaches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No coaches found. Try adjusting your filters.
            </Text>
          </View>
        ) : (
          filteredCoaches.map((coach) => (
            <TufteCoachRow
              key={coach.id}
              coach={coach}
              onPress={() => handleCoachPress(coach.id)}
            />
          ))
        )}

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const colors = {
  text: '#1a1a1a',
  textMuted: '#666666',
  textLight: '#999999',
  border: '#e5e5e5',
  background: '#ffffff',
  accent: '#2563eb',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  list: {
    flex: 1,
  },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  resultCount: {
    fontSize: 13,
    color: colors.textMuted,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  sortButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  sortButtonActive: {
    backgroundColor: '#f0f0f0',
  },
  sortButtonText: {
    fontSize: 12,
    color: colors.textLight,
  },
  sortButtonTextActive: {
    color: colors.text,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});
