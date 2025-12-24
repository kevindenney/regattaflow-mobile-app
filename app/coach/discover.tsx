import { useSailorDashboardData } from '@/hooks/useSailorDashboardData';
import { useAuth } from '@/providers/AuthProvider';
import { coachingService, CoachProfile } from '@/services/CoachingService';
import { CoachMatchingAgent } from '@/services/agents/CoachMatchingAgent';
import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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

export default function CoachDiscoveryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const sailorData = useSailorDashboardData();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [coaches, setCoaches] = useState<CoachWithScore[]>([]);
  const [aiMatching, setAiMatching] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    minRating: 0,
    maxHourlyRate: 0,
    specialties: [] as string[],
    boatClass: '',
    timezone: '',
    availability: 'any' as 'next_7_days' | 'next_30_days' | 'flexible' | 'any',
    sessionType: 'any' as 'on_water' | 'video_review' | 'strategy_planning' | 'any',
  });

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      const results = await coachingService.discoverCoaches({
        minRating: filters.minRating > 0 ? filters.minRating : undefined,
        maxHourlyRate: filters.maxHourlyRate > 0 ? filters.maxHourlyRate : undefined,
        location: filters.location || undefined,
        specializations: filters.specialties.length > 0 ? filters.specialties : undefined,
        boatClass: filters.boatClass || undefined,
        timezone: filters.timezone || undefined,
        availability: filters.availability !== 'any' ? filters.availability : undefined,
        sessionType: filters.sessionType !== 'any' ? filters.sessionType : undefined,
      });
      setCoaches(results);
    } catch (error) {
      console.error('Error loading coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const findMatchesWithAI = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to use AI coach matching.');
      return;
    }

    try {
      setAiMatching(true);
      setMode('ai');

      // Get sailor profile
      const { data: sailorProfile, error: profileError } = await supabase
        .from('sailor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !sailorProfile) {
        Alert.alert('Profile Required', 'Please complete your sailor profile to use AI matching.');
        return;
      }

      // Initialize AI agent
      const agent = new CoachMatchingAgent();

      // Run the matching workflow with recent race performance from sailorData
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

      if (!result.success) {
        Alert.alert('Matching Failed', result.error || 'Unable to find suitable coaches.');
        return;
      }

      // Extract compatibility scores from agent result
      const agentData = result.result;
      const scores = agentData.scores || [];
      const skillGaps = agentData.skillGaps || [];

      // Get full coach profiles for scored coaches
      const coachIds = scores.map((s: any) => s.coachId);
      const { data: coachProfiles, error: coachError } = await supabase
        .from('coach_profiles')
        .select(`
          *,
          users!inner(first_name, last_name, email)
        `)
        .in('id', coachIds);

      if (coachError || !coachProfiles) {
        Alert.alert('Error', 'Failed to load coach profiles.');
        return;
      }

      // Merge scores with coach profiles
      const coachesWithScores: CoachWithScore[] = coachProfiles.map((coach) => {
        const score = scores.find((s: any) => s.coachId === coach.id);
        return {
          ...coach,
          display_name: `${coach.users.first_name} ${coach.users.last_name}`,
          compatibilityScore: score?.overallScore ? score.overallScore / 100 : 0,
          matchReasoning: score?.reasoning,
          recommendations: score?.recommendations,
          scoreBreakdown: score?.breakdown,
          skillGaps: skillGaps, // Add identified skill gaps
        };
      });

      // Sort by compatibility score
      coachesWithScores.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));

      setCoaches(coachesWithScores);

      // Save top matches to database
      await saveMatchScores(coachesWithScores.slice(0, 10), agentData);

      Alert.alert(
        'AI Matching Complete',
        `Found ${coachesWithScores.length} compatible coaches. Results sorted by compatibility score.`
      );
    } catch (error: any) {
      console.error('AI matching error:', error);
      Alert.alert('Error', `AI matching failed: ${error.message}`);
    } finally {
      setAiMatching(false);
    }
  };

  const saveMatchScores = async (
    coaches: CoachWithScore[],
    agentData: any
  ) => {
    if (!user) return;

    try {
      const matchRecords = coaches
        .filter((coach) => coach.compatibilityScore !== undefined)
        .map((coach) => ({
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

      // Upsert scores (insert or update if exists)
      const { error } = await supabase
        .from('coach_match_scores')
        .upsert(matchRecords, {
          onConflict: 'user_id,coach_id',
        });

      if (error) {
        console.error('Failed to save match scores:', error);
      }
    } catch (error) {
      console.error('Error saving match scores:', error);
    }
  };

  const availableSpecialties = [
    'race_tactics',
    'boat_speed',
    'starts',
    'boat_handling',
    'weather_strategy',
    'mental_coaching',
    'physical_training',
    'video_analysis',
  ];

  const toggleSpecialty = (specialty: string) => {
    setFilters((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleSelectCoach = (coachId: string) => {
    router.push(`/coach/${coachId}`);
  };

  const formatHourlyRate = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}/hr`;
  };

  if (loading && mode === 'manual') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find a Coach</Text>
        <Text style={styles.subtitle}>
          Connect with expert sailing coaches
        </Text>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'manual' && styles.modeButtonActive,
            ]}
            onPress={() => {
              setMode('manual');
              setCoaches([]);
              loadCoaches();
            }}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'manual' && styles.modeButtonTextActive,
              ]}
            >
              Manual Search
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'ai' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('ai')}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'ai' && styles.modeButtonTextActive,
              ]}
            >
              🤖 AI Match
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters or AI Matching */}
      {mode === 'ai' ? (
        <View style={styles.aiContainer}>
          <Text style={styles.aiTitle}>AI-Powered Coach Matching</Text>
          <Text style={styles.aiDescription}>
            Our AI analyzes your race performance, identifies skill gaps, and finds coaches with
            the best compatibility for your needs.
          </Text>
          <TouchableOpacity
            style={styles.aiMatchButton}
            onPress={findMatchesWithAI}
            disabled={aiMatching}
          >
            {aiMatching ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.aiMatchButtonText}>
                ✨ Find My Ideal Coach
              </Text>
            )}
          </TouchableOpacity>
          {aiMatching && (
            <Text style={styles.aiMatchingText}>
              Analyzing your performance and finding compatible coaches...
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filters</Text>

          {/* Location Filter */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Location</Text>
            <TextInput
              style={styles.locationInput}
              placeholder="Enter city or venue..."
              value={filters.location}
              onChangeText={(text) => setFilters({ ...filters, location: text })}
              onSubmitEditing={loadCoaches}
            />
          </View>

          {/* Specialties Filter */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Specialties</Text>
            <View style={styles.specialtyChips}>
              {availableSpecialties.map((specialty) => (
                <TouchableOpacity
                  key={specialty}
                  style={[
                    styles.specialtyChip,
                    filters.specialties.includes(specialty) &&
                      styles.specialtyChipActive,
                  ]}
                  onPress={() => toggleSpecialty(specialty)}
                >
                  <Text
                    style={[
                      styles.specialtyChipText,
                      filters.specialties.includes(specialty) &&
                        styles.specialtyChipTextActive,
                    ]}
                  >
                    {specialty.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rating Filter */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Min Rating</Text>
            <View style={styles.ratingButtons}>
              {[0, 3, 4, 4.5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    filters.minRating === rating && styles.ratingButtonActive,
                  ]}
                  onPress={() => {
                    setFilters({ ...filters, minRating: rating });
                  }}
                >
                  <Text
                    style={[
                      styles.ratingButtonText,
                      filters.minRating === rating &&
                        styles.ratingButtonTextActive,
                    ]}
                  >
                    {rating === 0 ? 'Any' : `${rating}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Max Price Filter */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Max Hourly Rate</Text>
            <View style={styles.ratingButtons}>
              {[0, 5000, 10000, 15000, 20000].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[
                    styles.ratingButton,
                    filters.maxHourlyRate === rate && styles.ratingButtonActive,
                  ]}
                  onPress={() => {
                    setFilters({ ...filters, maxHourlyRate: rate });
                  }}
                >
                  <Text
                    style={[
                      styles.ratingButtonText,
                      filters.maxHourlyRate === rate &&
                        styles.ratingButtonTextActive,
                    ]}
                  >
                    {rate === 0 ? 'Any' : `$${rate / 100}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Boat Class Filter */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Boat Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.ratingButtons}>
                {['', 'dragon', 'j70', 'j80', 'etchells', 'swan_47', 'melges_24'].map((boatClass) => (
                  <TouchableOpacity
                    key={boatClass}
                    style={[
                      styles.ratingButton,
                      filters.boatClass === boatClass && styles.ratingButtonActive,
                    ]}
                    onPress={() => {
                      setFilters({ ...filters, boatClass });
                    }}
                  >
                    <Text
                      style={[
                        styles.ratingButtonText,
                        filters.boatClass === boatClass &&
                          styles.ratingButtonTextActive,
                      ]}
                    >
                      {boatClass === '' ? 'Any' : boatClass.toUpperCase().replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Timezone Filter */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Timezone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.ratingButtons}>
                {[
                  { value: '', label: 'Any' },
                  { value: 'America/New_York', label: 'EST' },
                  { value: 'America/Los_Angeles', label: 'PST' },
                  { value: 'Europe/London', label: 'GMT' },
                  { value: 'Asia/Hong_Kong', label: 'HKT' },
                  { value: 'Australia/Sydney', label: 'AEST' },
                ].map((tz) => (
                  <TouchableOpacity
                    key={tz.value}
                    style={[
                      styles.ratingButton,
                      filters.timezone === tz.value && styles.ratingButtonActive,
                    ]}
                    onPress={() => {
                      setFilters({ ...filters, timezone: tz.value });
                    }}
                  >
                    <Text
                      style={[
                        styles.ratingButtonText,
                        filters.timezone === tz.value &&
                          styles.ratingButtonTextActive,
                      ]}
                    >
                      {tz.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Availability Filter */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Availability</Text>
            <View style={styles.ratingButtons}>
              {[
                { value: 'any', label: 'Any Time' },
                { value: 'next_7_days', label: 'Next 7 Days' },
                { value: 'next_30_days', label: 'Next 30 Days' },
                { value: 'flexible', label: 'Flexible' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.ratingButton,
                    filters.availability === option.value && styles.ratingButtonActive,
                  ]}
                  onPress={() => {
                    setFilters({ ...filters, availability: option.value as any });
                  }}
                >
                  <Text
                    style={[
                      styles.ratingButtonText,
                      filters.availability === option.value &&
                        styles.ratingButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Session Type Filter */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Session Type</Text>
            <View style={styles.ratingButtons}>
              {[
                { value: 'any', label: 'Any Type' },
                { value: 'on_water', label: 'On-Water' },
                { value: 'video_review', label: 'Video Review' },
                { value: 'strategy_planning', label: 'Strategy' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.ratingButton,
                    filters.sessionType === option.value && styles.ratingButtonActive,
                  ]}
                  onPress={() => {
                    setFilters({ ...filters, sessionType: option.value as any });
                  }}
                >
                  <Text
                    style={[
                      styles.ratingButtonText,
                      filters.sessionType === option.value &&
                        styles.ratingButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Apply Filters Button */}
          <TouchableOpacity
            style={styles.applyFiltersButton}
            onPress={loadCoaches}
          >
            <Text style={styles.applyFiltersText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Coach List */}
      <ScrollView style={styles.coachList}>
        {coaches.length === 0 ? (
          <Text style={styles.emptyText}>
            {mode === 'ai'
              ? 'Click "Find My Ideal Coach" to get AI-powered recommendations.'
              : 'No coaches found. Try adjusting your filters.'}
          </Text>
        ) : (
          coaches.map((coach, index) => {
            const displayName =
              coach.display_name ||
              coach.based_at ||
              `Coach ${index + 1}`;
            const avatarInitial = displayName.charAt(0).toUpperCase();

            return (
              <TouchableOpacity
                key={coach.id}
                style={[
                  styles.coachCard,
                  mode === 'ai' && styles.coachCardAI,
                ]}
              onPress={() => handleSelectCoach(coach.id)}
            >
              {/* Compatibility Score Badge (AI Mode) */}
              {mode === 'ai' && coach.compatibilityScore !== undefined && (
                <View style={styles.compatibilityBadge}>
                  <Text style={styles.compatibilityScore}>
                    #{index + 1} • {Math.round(coach.compatibilityScore * 100)}%
                  </Text>
                  <Text style={styles.compatibilityLabel}>
                    Match Score
                  </Text>
                </View>
              )}

              <View style={styles.coachHeader}>
                <View style={styles.coachAvatar}>
                  {coach.profile_photo_url ? (
                    <Image
                      source={{ uri: coach.profile_photo_url }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {avatarInitial}
                    </Text>
                  )}
                </View>
                <View style={styles.coachInfo}>
                  <Text style={styles.coachName}>{displayName}</Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingStars}>★</Text>
                    <Text style={styles.ratingValue}>
                      {coach.average_rating?.toFixed(1) || '0.0'}
                    </Text>
                    <Text style={styles.sessionCount}>
                      ({coach.total_sessions ?? 0} sessions)
                    </Text>
                  </View>
                </View>
                <View style={styles.priceContainer}>
                  {coach.hourly_rate && (
                    <Text style={styles.hourlyRate}>
                      {formatHourlyRate(coach.hourly_rate)}
                    </Text>
                  )}
                </View>
              </View>

              {/* AI Match Reasoning */}
              {mode === 'ai' && coach.matchReasoning && (
                <View style={styles.matchReasoningContainer}>
                  <Text style={styles.matchReasoningTitle}>Why this match:</Text>
                  <Text style={styles.matchReasoning}>{coach.matchReasoning}</Text>
                </View>
              )}

              {/* Skill Gaps Identified (AI Mode) */}
              {mode === 'ai' && coach.skillGaps && coach.skillGaps.length > 0 && (
                <View style={styles.skillGapsContainer}>
                  <Text style={styles.skillGapsTitle}>Identified Skill Gaps:</Text>
                  {coach.skillGaps.slice(0, 3).map((gap, idx) => (
                    <View key={idx} style={styles.skillGapItem}>
                      <View style={styles.skillGapHeader}>
                        <Text style={styles.skillGapName}>{gap.skill}</Text>
                        <View style={[
                          styles.priorityBadge,
                          gap.priority === 'high' && styles.priorityBadgeHigh,
                          gap.priority === 'medium' && styles.priorityBadgeMedium,
                        ]}>
                          <Text style={styles.priorityBadgeText}>
                            {gap.priority.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.skillGapReasoning}>{gap.reasoning}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Compatibility Breakdown (AI Mode) */}
              {mode === 'ai' && coach.scoreBreakdown && (
                <View style={styles.compatibilityBreakdown}>
                  <Text style={styles.breakdownTitle}>Compatibility Breakdown:</Text>
                  <View style={styles.breakdownGrid}>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Experience</Text>
                      <Text style={styles.breakdownScore}>
                        {coach.scoreBreakdown.experienceMatch}%
                      </Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Specialty</Text>
                      <Text style={styles.breakdownScore}>
                        {coach.scoreBreakdown.specialtyAlignment}%
                      </Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Success Rate</Text>
                      <Text style={styles.breakdownScore}>
                        {coach.scoreBreakdown.successRateRelevance}%
                      </Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Value</Text>
                      <Text style={styles.breakdownScore}>
                        {coach.scoreBreakdown.valueScore}%
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Recommendations (AI Mode) */}
              {mode === 'ai' && coach.recommendations && coach.recommendations.length > 0 && (
                <View style={styles.recommendations}>
                  <Text style={styles.recommendationsLabel}>Next Steps:</Text>
                  {coach.recommendations.slice(0, 2).map((rec, idx) => (
                    <Text key={idx} style={styles.recommendationItem}>
                      ✓ {rec}
                    </Text>
                  ))}
                </View>
              )}

              {/* Regular Mode Content */}
              {coach.bio && mode !== 'ai' && (
                <Text style={styles.bio} numberOfLines={2}>
                  {coach.bio}
                </Text>
              )}

              {coach.specialties && coach.specialties.length > 0 && mode !== 'ai' && (
                <View style={styles.specialtiesContainer}>
                  {coach.specialties.slice(0, 3).map((specialty, index) => (
                    <View key={index} style={styles.specialtyTag}>
                      <Text style={styles.specialtyText}>
                        {specialty.replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                  {coach.specialties.length > 3 && (
                    <Text style={styles.moreSpecialties}>
                      +{coach.specialties.length - 3} more
                    </Text>
                  )}
                </View>
              )}

              {coach.based_at && mode !== 'ai' && (
                <Text style={styles.location}>📍 {coach.based_at}</Text>
              )}

              {/* Quick Stats Bar (Manual Mode) */}
              {mode !== 'ai' && (
                <View style={styles.quickStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{coach.total_sessions || 0}</Text>
                    <Text style={styles.statLabel}>Sessions</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {coach.average_rating?.toFixed(1) || '0.0'}★
                    </Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{coach.total_clients || 0}</Text>
                    <Text style={styles.statLabel}>Clients</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons (Manual Mode) */}
              {mode !== 'ai' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.viewProfileButton}
                    onPress={() => router.push(`/coach/${coach.id}`)}
                  >
                    <Text style={styles.viewProfileText}>View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bookNowButton}
                    onPress={() => router.push(`/coach/${coach.id}?action=book`)}
                  >
                    <Text style={styles.bookNowText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
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
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  aiContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  aiTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aiDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  aiMatchButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  aiMatchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aiMatchingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterItem: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  ratingButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  ratingButtonText: {
    fontSize: 14,
    color: '#666',
  },
  ratingButtonTextActive: {
    color: '#FFFFFF',
  },
  coachList: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 32,
  },
  coachCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  coachCardAI: {
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStars: {
    fontSize: 16,
    color: '#FFB800',
    marginRight: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  sessionCount: {
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  hourlyRate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  specialtyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 12,
    color: '#007AFF',
    textTransform: 'capitalize',
  },
  moreSpecialties: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'center',
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  specialtyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  specialtyChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  specialtyChipText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  specialtyChipTextActive: {
    color: '#FFFFFF',
  },
  applyFiltersButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    zIndex: 1,
    alignItems: 'center',
  },
  compatibilityScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  compatibilityLabel: {
    fontSize: 10,
    color: '#E9D5FF',
    marginTop: 2,
  },
  matchReasoningContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  matchReasoningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 6,
  },
  matchReasoning: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  skillGapsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  skillGapsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  skillGapItem: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  skillGapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillGapName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  priorityBadgeHigh: {
    backgroundColor: '#DC2626',
  },
  priorityBadgeMedium: {
    backgroundColor: '#F59E0B',
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skillGapReasoning: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
  },
  compatibilityBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  breakdownItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  breakdownScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  recommendations: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  recommendationsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  recommendationItem: {
    fontSize: 13,
    color: '#16A34A',
    lineHeight: 20,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  viewProfileButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  bookNowButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  bookNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
