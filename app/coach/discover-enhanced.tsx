import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { coachingService, CoachProfile } from '@/services/CoachingService';
import { CoachMatchingAgent } from '@/services/agents/CoachMatchingAgent';
import { useAuth } from '@/providers/AuthProvider';
import { useSailorDashboardData } from '@/hooks/useSailorDashboardData';
import { supabase } from '@/services/supabase';
import type { SailorProfile as MatchingSailorProfile } from '@/types/coach';

interface CoachWithMatch extends CoachProfile {
  display_name?: string | null;
  profile_photo_url?: string | null;
  matchScore?: number;
  matchReasoning?: string;
  recommendations?: string[];
  compatibilityBreakdown?: {
    experienceMatch?: number;
    teachingStyleMatch?: number;
    specialtyAlignment?: number;
    successRateRelevance?: number;
    availabilityMatch?: number;
    locationConvenience?: number;
    valueScore?: number;
  };
  skillGapInsights?: Array<{
    skill: string;
    priority?: string;
    reasoning?: string;
  }>;
}

type SortOption = 'compatibility' | 'rating' | 'price' | 'sessions';

const formatBreakdownLabel = (label: string) =>
  label
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function EnhancedCoachDiscoveryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const sailorDashboard = useSailorDashboardData();

  const [loading, setLoading] = useState(true);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [coaches, setCoaches] = useState<CoachWithMatch[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('compatibility');
  const [expandedCoach, setExpandedCoach] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    location: '',
    minRating: 0,
    maxHourlyRate: 0,
    specialties: [] as string[],
  });
  const { classes, venues, performance } = sailorDashboard;
  const recentResults = useMemo(
    () => performance?.recentResults ?? [],
    [performance]
  );
  const fallbackBoatClasses = useMemo(
    () =>
      classes
        .map((sailorClass) => sailorClass.name)
        .filter((name): name is string => Boolean(name)),
    [classes]
  );
  const currentVenueId = venues.currentVenue?.id;

  const loadCoachesWithMatching = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setMatchingInProgress(false);
      return;
    }

    try {
      setLoading(true);
      setMatchingInProgress(true);

      // 1. Load coaches from database
      const results = await coachingService.discoverCoaches({
        minRating: filters.minRating > 0 ? filters.minRating : undefined,
        maxHourlyRate: filters.maxHourlyRate > 0 ? filters.maxHourlyRate : undefined,
        location: filters.location || undefined,
        specializations: filters.specialties.length > 0 ? filters.specialties : undefined,
      });

      // 2. Load sailor profile data to feed the matching agent
      const { data: sailorProfileData, error: sailorProfileError } = await supabase
        .from('sailor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (sailorProfileError) {
        console.warn(
          'Unable to load sailor profile for coach matching:',
          sailorProfileError.message
        );
      }

      const profileBoatClasses =
        (Array.isArray(sailorProfileData?.boat_classes)
          ? (sailorProfileData?.boat_classes as string[])
          : []) || [];

      const sailorProfile: MatchingSailorProfile = {
        id: sailorProfileData?.id ?? user.id,
        user_id: user.id,
        sailing_experience: sailorProfileData?.sailing_experience ?? 5,
        boat_classes:
          profileBoatClasses.length > 0
            ? profileBoatClasses
            : fallbackBoatClasses,
        goals: sailorProfileData?.goals ?? 'Improve racing performance',
        competitive_level: sailorProfileData?.competitive_level ?? 'intermediate',
        learning_style: sailorProfileData?.learning_style ?? undefined,
        location: sailorProfileData?.location ?? sailorProfileData?.home_port ?? undefined,
        budget_range: sailorProfileData?.budget_range ?? undefined,
      };

      // 3. Run AI matching agent
      const matchingAgent = new CoachMatchingAgent();
      const matchResult = await matchingAgent.matchSailorWithCoach(
        user.id,
        sailorProfile,
        {
          boatClass:
            sailorProfile.boat_classes[0] ||
            user.primary_boat_class ||
            fallbackBoatClasses[0],
          venueId: currentVenueId,
          goals: sailorProfile.goals,
        }
      );

      if (matchResult.success && matchResult.result) {
        const agentOutput = matchResult.result;
        const scores = Array.isArray(agentOutput.scores)
          ? agentOutput.scores
          : [];
        const skillGapInsights = Array.isArray(agentOutput.skillGaps)
          ? agentOutput.skillGaps
          : [];

        const coachesWithMatches: CoachWithMatch[] = results.map((coach) => {
          const score = scores.find((entry: any) => entry.coachId === coach.id);

          return {
            ...coach,
            matchScore: score ? score.overallScore / 100 : undefined,
            matchReasoning: score?.reasoning,
            recommendations: score?.recommendations,
            compatibilityBreakdown: score?.breakdown,
            skillGapInsights,
          };
        });

        if (scores.length > 0) {
          const { error: matchSaveError } = await supabase
            .from('coach_match_scores')
            .upsert(
              scores.map((score: any) => ({
                user_id: user.id,
                coach_id: score.coachId,
                compatibility_score: score.overallScore / 100,
                skill_gap_analysis: skillGapInsights,
                match_reasoning: score.reasoning ?? null,
                score_breakdown: score.breakdown ?? null,
                performance_data_used: {
                  trends: agentOutput.trends ?? {},
                  recentResults: agentOutput.recentResults ?? [],
                  recentRaceCount: recentResults.length,
                },
              })),
              { onConflict: 'user_id,coach_id' }
            );

          if (matchSaveError) {
            console.warn('Failed to persist coach match scores:', matchSaveError.message);
          }
        }

        setCoaches(coachesWithMatches);
      } else {
        // Fallback: Show coaches without match scores
        setCoaches(results.map((coach) => ({ ...coach, matchScore: undefined })));
      }
    } catch (error) {
      console.error('Error loading coaches:', error);
    } finally {
      setLoading(false);
      setMatchingInProgress(false);
    }
  }, [
    currentVenueId,
    fallbackBoatClasses,
    filters.location,
    filters.maxHourlyRate,
    filters.minRating,
    filters.specialties,
    recentResults.length,
    user?.id,
    user?.primary_boat_class,
  ]);

  useEffect(() => {
    if (!user?.id || sailorDashboard.loading) {
      return;
    }

    loadCoachesWithMatching();
  }, [loadCoachesWithMatching, sailorDashboard.loading, user?.id]);

  const sortedCoaches = [...coaches].sort((a, b) => {
    switch (sortBy) {
      case 'compatibility':
        // Sort by match score (highest first), fallback to rating
        const scoreA = a.matchScore ?? 0;
        const scoreB = b.matchScore ?? 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return (b.average_rating ?? 0) - (a.average_rating ?? 0);

      case 'rating':
        return (b.average_rating ?? 0) - (a.average_rating ?? 0);

      case 'price':
        return (a.hourly_rate ?? 999999) - (b.hourly_rate ?? 999999);

      case 'sessions':
        return (b.total_sessions ?? 0) - (a.total_sessions ?? 0);

      default:
        return 0;
    }
  });

  const getMatchBadge = (score?: number) => {
    if (!score) return null;

    const percentage = Math.round(score * 100);

    if (percentage >= 95) {
      return { label: 'Excellent Match', color: '#10B981', icon: '🏆' };
    } else if (percentage >= 85) {
      return { label: 'Great Match', color: '#3B82F6', icon: '⭐' };
    } else if (percentage >= 75) {
      return { label: 'Good Match', color: '#8B5CF6', icon: '✓' };
    } else if (percentage >= 60) {
      return { label: 'Potential Match', color: '#F59E0B', icon: '○' };
    }
    return null;
  };

  const toggleExpanded = (coachId: string) => {
    setExpandedCoach(expandedCoach === coachId ? null : coachId);
  };

  const handleBookSession = (coachId: string) => {
    router.push(`/coach/book?coachId=${coachId}`);
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

  const formatHourlyRate = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}/hr`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {matchingInProgress ? 'Finding your perfect match...' : 'Loading coaches...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Perfect Coach</Text>
        <Text style={styles.subtitle}>
          AI-matched coaches based on your performance
        </Text>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'compatibility' as SortOption, label: 'Best Match', icon: '🎯' },
            { key: 'rating' as SortOption, label: 'Rating', icon: '⭐' },
            { key: 'price' as SortOption, label: 'Price', icon: '💰' },
            { key: 'sessions' as SortOption, label: 'Experience', icon: '📊' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortButton,
                sortBy === option.key && styles.sortButtonActive,
              ]}
              onPress={() => setSortBy(option.key)}
            >
              <Text style={styles.sortIcon}>{option.icon}</Text>
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === option.key && styles.sortButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filters */}
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
            onSubmitEditing={loadCoachesWithMatching}
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

        {/* Apply Filters Button */}
        <TouchableOpacity
          style={styles.applyFiltersButton}
          onPress={loadCoachesWithMatching}
        >
          <Text style={styles.applyFiltersText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Coach List */}
      <ScrollView style={styles.coachList}>
        {sortedCoaches.length === 0 ? (
          <Text style={styles.emptyText}>
            No coaches found. Try adjusting your filters.
          </Text>
        ) : (
          sortedCoaches.map((coach, index) => {
            const badge = getMatchBadge(coach.matchScore);
            const isExpanded = expandedCoach === coach.id;
            const displayName =
              coach.display_name ||
              coach.based_at ||
              `Coach ${index + 1}`;
            const avatarInitial = displayName.charAt(0).toUpperCase();

            return (
              <View key={coach.id} style={styles.coachCard}>
                {/* Match Badge */}
                {badge && (
                  <View style={[styles.matchBadge, { backgroundColor: badge.color }]}>
                    <Text style={styles.matchBadgeIcon}>{badge.icon}</Text>
                    <Text style={styles.matchBadgeText}>{badge.label}</Text>
                    <Text style={styles.matchBadgeScore}>
                      {Math.round((coach.matchScore ?? 0) * 100)}%
                    </Text>
                  </View>
                )}

                {/* Coach Header */}
                <TouchableOpacity
                  style={styles.coachHeader}
                  onPress={() => router.push(`/coach/${coach.id}`)}
                >
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
                </TouchableOpacity>

                {coach.bio && (
                  <Text style={styles.bio} numberOfLines={2}>
                    {coach.bio}
                  </Text>
                )}

                {coach.specialties && coach.specialties.length > 0 && (
                  <View style={styles.specialtiesContainer}>
                    {coach.specialties.slice(0, 3).map((specialty, idx) => (
                      <View key={idx} style={styles.specialtyTag}>
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

                {coach.based_at && (
                  <Text style={styles.location}>📍 {coach.based_at}</Text>
                )}

                {/* Expandable Reasoning Section */}
                {coach.matchReasoning && (
                  <View style={styles.reasoningContainer}>
                    <TouchableOpacity
                      style={styles.reasoningToggle}
                      onPress={() => toggleExpanded(coach.id)}
                    >
                      <Text style={styles.reasoningToggleText}>
                        Why this match? {isExpanded ? '▼' : '▶'}
                      </Text>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.reasoningContent}>
                        <Text style={styles.reasoningText}>
                          {coach.matchReasoning}
                        </Text>

                        {coach.skillGapInsights && coach.skillGapInsights.length > 0 && (
                          <View style={styles.analysisSection}>
                            <Text style={styles.analysisSectionTitle}>
                              🎯 Focus areas:
                            </Text>
                            {coach.skillGapInsights.map((gap, idx) => (
                              <Text key={idx} style={styles.analysisItem}>
                                • {gap.skill}
                                {gap.priority ? ` (${gap.priority})` : ''}
                                {gap.reasoning ? ` – ${gap.reasoning}` : ''}
                              </Text>
                            ))}
                          </View>
                        )}

                        {coach.recommendations && coach.recommendations.length > 0 && (
                          <View style={styles.analysisSection}>
                            <Text style={styles.analysisSectionTitle}>
                              📋 Recommended next steps:
                            </Text>
                            {coach.recommendations.map((rec, idx) => (
                              <Text key={idx} style={styles.analysisItem}>
                                • {rec}
                              </Text>
                            ))}
                          </View>
                        )}

                        {coach.compatibilityBreakdown && (
                          <View style={styles.breakdownContainer}>
                            <Text style={styles.analysisSectionTitle}>Match breakdown</Text>
                            <View style={styles.breakdownGrid}>
                              {Object.entries(coach.compatibilityBreakdown).map(([key, value]) => (
                                <View key={key} style={styles.breakdownItem}>
                                  <Text style={styles.breakdownLabel}>
                                    {formatBreakdownLabel(key)}
                                  </Text>
                                  <Text style={styles.breakdownValue}>
                                    {value ?? 0}%
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Quick Actions */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleBookSession(coach.id)}
                  >
                    <Text style={styles.bookButtonText}>📅 Book Session</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewProfileButton}
                    onPress={() => router.push(`/coach/${coach.id}`)}
                  >
                    <Text style={styles.viewProfileButtonText}>View Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  },
  sortContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
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
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  matchBadgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  matchBadgeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  matchBadgeScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
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
    paddingHorizontal: 16,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    marginBottom: 12,
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
  reasoningContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 8,
  },
  reasoningToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reasoningToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  reasoningContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  reasoningText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  analysisSection: {
    marginTop: 12,
  },
  analysisSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  analysisItem: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginLeft: 8,
  },
  breakdownContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  breakdownItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  viewProfileButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewProfileButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
