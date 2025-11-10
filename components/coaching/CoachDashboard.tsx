import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { coachStrategyService, type SharedStrategy } from '@/services/CoachStrategyService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CoachDashboard');

export function CoachDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [sharedStrategies, setSharedStrategies] = useState<SharedStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<SharedStrategy | null>(null);

  useEffect(() => {
    loadCoachData();
  }, [user?.id]);

  const loadCoachData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get coach profile
      const profile = await coachStrategyService.getCoachProfileByUserId(user.id);
      setCoachProfile(profile);

      if (profile) {
        // Get shared strategies
        const strategies = await coachStrategyService.getSharedStrategies(profile.id);
        setSharedStrategies(strategies);
      }
    } catch (error) {
      logger.error('Error loading coach data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCoachData();
    setRefreshing(false);
  }, [user?.id]);

  const handleViewStrategy = (strategy: SharedStrategy) => {
    setSelectedStrategy(strategy);
  };

  const handleBackToList = () => {
    setSelectedStrategy(null);
  };

  const handleAddFeedback = async (strategy: SharedStrategy) => {
    Alert.prompt(
      'Add Feedback',
      'Provide feedback on this pre-race strategy:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (feedback) => {
            if (!feedback || !coachProfile?.id) return;

            const success = await coachStrategyService.addCoachFeedback(
              strategy.id,
              coachProfile.id,
              feedback
            );

            if (success) {
              Alert.alert('Success', 'Feedback saved successfully');
              await loadCoachData();
            } else {
              Alert.alert('Error', 'Failed to save feedback');
            }
          },
        },
      ],
      'plain-text',
      strategy.coach_feedback || ''
    );
  };

  const handleMarkReviewed = async (strategy: SharedStrategy) => {
    if (!coachProfile?.id) return;

    const success = await coachStrategyService.markAsReviewed(
      strategy.id,
      coachProfile.id
    );

    if (success) {
      Alert.alert('Success', 'Strategy marked as reviewed');
      await loadCoachData();
    } else {
      Alert.alert('Error', 'Failed to mark as reviewed');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading coaching dashboard...</Text>
        </View>
      </View>
    );
  }

  if (!coachProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-off" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Not a Coach</Text>
          <Text style={styles.emptyText}>
            This account is not registered as a coach. Please contact support if you believe this is an error.
          </Text>
        </View>
      </View>
    );
  }

  if (selectedStrategy) {
    return (
      <StrategyDetailView
        strategy={selectedStrategy}
        coachProfile={coachProfile}
        onBack={handleBackToList}
        onAddFeedback={handleAddFeedback}
        onMarkReviewed={handleMarkReviewed}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Coaching Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back, {coachProfile.display_name}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{sharedStrategies.length}</Text>
            <Text style={styles.statLabel}>Shared</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>
              {sharedStrategies.filter(s => !s.coach_reviewed_at).length}
            </Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sharedStrategies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-off" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Shared Strategies</Text>
            <Text style={styles.emptyText}>
              When sailors share their pre-race strategies with you, they'll appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.strategiesList}>
            {sharedStrategies.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onPress={() => handleViewStrategy(strategy)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StrategyCard({
  strategy,
  onPress,
}: {
  strategy: SharedStrategy;
  onPress: () => void;
}) {
  const isReviewed = !!strategy.coach_reviewed_at;
  const hasFeedback = !!strategy.coach_feedback;

  const strategyCount = [
    strategy.start_strategy,
    strategy.upwind_strategy,
    strategy.downwind_strategy,
    strategy.windward_mark_strategy,
    strategy.leeward_mark_strategy,
  ].filter(Boolean).length;

  return (
    <TouchableOpacity style={styles.strategyCard} onPress={onPress}>
      <View style={styles.strategyHeader}>
        <View style={styles.strategyTitleRow}>
          <MaterialCommunityIcons name="sail-boat" size={24} color="#3B82F6" />
          <View style={styles.strategyInfo}>
            <Text style={styles.strategyRace}>{strategy.race_name}</Text>
            <Text style={styles.strategySailor}>
              Sailor: {strategy.sailor_name}
            </Text>
          </View>
        </View>
        {!isReviewed && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>

      <View style={styles.strategyMeta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="calendar" size={16} color="#64748B" />
          <Text style={styles.metaText}>
            {new Date(strategy.race_date).toLocaleDateString()}
          </Text>
        </View>
        {strategy.venue_name && (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#64748B" />
            <Text style={styles.metaText}>{strategy.venue_name}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="file-document" size={16} color="#64748B" />
          <Text style={styles.metaText}>{strategyCount} sections</Text>
        </View>
      </View>

      <View style={styles.strategyFooter}>
        <View style={styles.statusIndicators}>
          {hasFeedback && (
            <View style={styles.statusBadge}>
              <MaterialCommunityIcons name="comment-check" size={14} color="#10B981" />
              <Text style={styles.statusText}>Feedback Added</Text>
            </View>
          )}
          {isReviewed && (
            <View style={styles.statusBadge}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#3B82F6" />
              <Text style={styles.statusText}>Reviewed</Text>
            </View>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );
}

function StrategyDetailView({
  strategy,
  coachProfile,
  onBack,
  onAddFeedback,
  onMarkReviewed,
}: {
  strategy: SharedStrategy;
  coachProfile: any;
  onBack: () => void;
  onAddFeedback: (strategy: SharedStrategy) => void;
  onMarkReviewed: (strategy: SharedStrategy) => void;
}) {
  const isReviewed = !!strategy.coach_reviewed_at;

  const strategyPhases = [
    { title: 'Start Strategy', content: strategy.start_strategy, icon: 'flag-checkered' },
    { title: 'Upwind Strategy', content: strategy.upwind_strategy, icon: 'arrow-up-bold' },
    { title: 'Windward Mark', content: strategy.windward_mark_strategy, icon: 'flag-triangle' },
    { title: 'Downwind Strategy', content: strategy.downwind_strategy, icon: 'arrow-down-bold' },
    { title: 'Leeward Mark', content: strategy.leeward_mark_strategy, icon: 'flag-variant' },
  ].filter(phase => phase.content);

  return (
    <View style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.detailHeaderInfo}>
          <Text style={styles.detailRaceName}>{strategy.race_name}</Text>
          <Text style={styles.detailSailorName}>by {strategy.sailor_name}</Text>
        </View>
      </View>

      <ScrollView style={styles.detailScrollView}>
        <View style={styles.detailMeta}>
          <View style={styles.detailMetaItem}>
            <MaterialCommunityIcons name="calendar" size={20} color="#64748B" />
            <Text style={styles.detailMetaText}>
              {new Date(strategy.race_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          {strategy.venue_name && (
            <View style={styles.detailMetaItem}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#64748B" />
              <Text style={styles.detailMetaText}>{strategy.venue_name}</Text>
            </View>
          )}
          <View style={styles.detailMetaItem}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
            <Text style={styles.detailMetaText}>
              Shared {new Date(strategy.shared_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {strategyPhases.map((phase, index) => (
          <View key={index} style={styles.phaseCard}>
            <View style={styles.phaseHeader}>
              <MaterialCommunityIcons name={phase.icon as any} size={20} color="#3B82F6" />
              <Text style={styles.phaseTitle}>{phase.title}</Text>
            </View>
            <Text style={styles.phaseContent}>{phase.content}</Text>
          </View>
        ))}

        {strategy.coach_feedback && (
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <MaterialCommunityIcons name="comment-text" size={20} color="#10B981" />
              <Text style={styles.feedbackTitle}>Your Feedback</Text>
            </View>
            <Text style={styles.feedbackContent}>{strategy.coach_feedback}</Text>
            {strategy.coach_reviewed_at && (
              <Text style={styles.feedbackTimestamp}>
                Added {new Date(strategy.coach_reviewed_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => onAddFeedback(strategy)}
          >
            <MaterialCommunityIcons name="comment-edit" size={20} color="white" />
            <Text style={styles.feedbackButtonText}>
              {strategy.coach_feedback ? 'Edit Feedback' : 'Add Feedback'}
            </Text>
          </TouchableOpacity>

          {!isReviewed && (
            <TouchableOpacity
              style={styles.reviewedButton}
              onPress={() => onMarkReviewed(strategy)}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color="white" />
              <Text style={styles.reviewedButtonText}>Mark as Reviewed</Text>
            </TouchableOpacity>
          )}

          {isReviewed && (
            <View style={styles.reviewedIndicator}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.reviewedIndicatorText}>
                Reviewed on {new Date(strategy.coach_reviewed_at!).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  strategiesList: {
    padding: 16,
  },
  strategyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  strategyTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyRace: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  strategySailor: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  strategyMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
  },
  strategyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  detailHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailRaceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailSailorName: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  detailScrollView: {
    flex: 1,
  },
  detailMeta: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 2,
  },
  detailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailMetaText: {
    fontSize: 14,
    color: '#64748B',
  },
  phaseCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 2,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  phaseContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  feedbackCard: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    marginTop: 8,
    marginBottom: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  feedbackContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  feedbackTimestamp: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  feedbackButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  feedbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewedButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  reviewedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  reviewedIndicatorText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
});
