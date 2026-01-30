/**
 * Reflect Tab - Personal Progress & Race History
 *
 * Similar to Strava's "You" tab, provides sailors with:
 * - Progress View: Weekly calendar, monthly stats, performance trends
 * - Race Log View: Searchable history of all races
 * - Profile View: User profile, statistics, venues, and boats
 *
 * Design follows Apple Human Interface Guidelines.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import { useReflectDataMock, type RaceLogEntry } from '@/hooks/useReflectData';
import { useReflectProfile } from '@/hooks/useReflectProfile';

import {
  WeeklyCalendar,
  MonthlyStatsCard,
  PerformanceTrendChart,
  RaceLogCard,
  RelativeEffortCard,
  ReflectProfileHeader,
  StatisticsSection,
  VenuesVisitedSection,
  BoatsSection,
  AchievementsSection,
  PersonalRecordsCard,
  ChallengesSection,
  // Phase 4: Social
  SocialStatsCard,
  RecentActivitySection,
  NotificationBellButton,
  // Phase 5: Goals, Insights, Comparisons, Sharing & Gear
  GoalsSection,
  InsightsCard,
  ComparisonCard,
  WeeklySummaryCard,
  GearManagementSection,
  // Phase 6: Training, Heatmap, Recap, Records, Photos, Journal
  TrainingPlansSection,
  VenueHeatmap,
  SeasonRecapCard,
  CourseRecordsSection,
  PhotoGallerySection,
  RaceJournalSection,
} from '@/components/reflect';
import type { RecentActivity } from '@/components/reflect';
import type { SeasonGoal, PerformanceInsight, BoatWithMaintenance, MaintenanceLog, TrainingPlan, CourseRecord, RaceJournalEntry } from '@/hooks/useReflectProfile';

// =============================================================================
// TYPES
// =============================================================================

type ReflectSegment = 'progress' | 'racelog' | 'profile';

const REFLECT_SEGMENTS = [
  { value: 'progress' as const, label: 'Progress' },
  { value: 'racelog' as const, label: 'Race Log' },
  { value: 'profile' as const, label: 'Profile' },
];

// =============================================================================
// PROGRESS VIEW
// =============================================================================

interface ProgressViewProps {
  toolbarHeight: number;
  onScroll: (event: any) => void;
  isDesktop: boolean;
}

function ProgressView({ toolbarHeight, onScroll, isDesktop }: ProgressViewProps) {
  const { data, loading, refresh } = useReflectDataMock();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleSeeCalendar = () => {
    Alert.alert('Coming Soon', 'Full calendar view is coming in a future update');
  };

  const handleSeeMonthStats = () => {
    Alert.alert('Coming Soon', 'Detailed monthly statistics are coming in a future update');
  };

  const handleSeePerformance = () => {
    Alert.alert('Coming Soon', 'Extended performance history is coming in a future update');
  };

  const handleSeeEffort = () => {
    Alert.alert('Coming Soon', 'Effort comparison is coming in a future update');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: toolbarHeight + 20 }]}>
        <Text style={styles.loadingText}>Loading your sailing data...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: toolbarHeight + 20 }]}>
        <Ionicons name="boat-outline" size={48} color={IOS_COLORS.systemGray3} />
        <Text style={styles.emptyTitle}>No Sailing Data Yet</Text>
        <Text style={styles.emptySubtitle}>
          Start adding races to see your progress here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: toolbarHeight },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={IOS_COLORS.systemBlue}
        />
      }
    >
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Weekly Sailing Calendar */}
        <WeeklyCalendar
          sailingDays={data.sailingDays}
          onSeeMore={handleSeeCalendar}
        />

        {/* Monthly Stats */}
        <MonthlyStatsCard
          stats={data.currentMonthStats}
          onSeeMore={handleSeeMonthStats}
        />

        {/* Performance Trend Chart */}
        <PerformanceTrendChart
          trend={data.performanceTrend}
          onSeeMore={handleSeePerformance}
        />

        {/* Relative Effort */}
        <RelativeEffortCard
          effort={data.relativeEffort}
          onSeeMore={handleSeeEffort}
        />

        {/* Year Stats Summary */}
        <View style={styles.yearStatsCard}>
          <Text style={styles.yearStatsTitle}>
            {new Date().getFullYear()} Summary
          </Text>
          <View style={styles.yearStatsGrid}>
            <View style={styles.yearStatItem}>
              <Text style={styles.yearStatValue}>
                {data.stats.totalRacesThisYear}
              </Text>
              <Text style={styles.yearStatLabel}>Races</Text>
            </View>
            <View style={styles.yearStatItem}>
              <Text style={styles.yearStatValue}>
                {data.stats.totalPodiumsThisYear}
              </Text>
              <Text style={styles.yearStatLabel}>Podiums</Text>
            </View>
            <View style={styles.yearStatItem}>
              <Text style={styles.yearStatValue}>
                {Math.round(data.stats.totalTimeOnWaterThisYear / 60)}h
              </Text>
              <Text style={styles.yearStatLabel}>On Water</Text>
            </View>
            <View style={styles.yearStatItem}>
              <Text style={styles.yearStatValue}>
                {data.stats.currentStreak}
              </Text>
              <Text style={styles.yearStatLabel}>Week Streak</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// =============================================================================
// PROFILE VIEW
// =============================================================================

interface ProfileViewProps {
  toolbarHeight: number;
  onScroll: (event: any) => void;
  isDesktop: boolean;
}

function ProfileView({ toolbarHeight, onScroll, isDesktop }: ProfileViewProps) {
  const { data, loading, refresh } = useReflectProfile();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleEditProfile = () => {
    router.push('/(tabs)/settings');
  };

  const handleSeeAllStats = () => {
    Alert.alert('Coming Soon', 'Detailed statistics view is coming in a future update');
  };

  const handleSeeAllVenues = () => {
    Alert.alert('Coming Soon', 'Full venues list is coming in a future update');
  };

  const handleAddBoat = () => {
    router.push('/(tabs)/boat');
  };

  const handleSeeAllBoats = () => {
    router.push('/(tabs)/boat');
  };

  const handleSeeAllAchievements = () => {
    Alert.alert('Coming Soon', 'Full achievements gallery is coming in a future update');
  };

  const handleAchievementPress = (achievement: any) => {
    Alert.alert(
      achievement.title,
      `${achievement.description}\n\nEarned: ${new Date(achievement.earnedAt).toLocaleDateString()}${
        achievement.relatedRegattaName ? `\n\nRace: ${achievement.relatedRegattaName}` : ''
      }`
    );
  };

  const handleSeeAllRecords = () => {
    Alert.alert('Coming Soon', 'Full personal records view is coming in a future update');
  };

  const handleSeeAllChallenges = () => {
    Alert.alert('Coming Soon', 'Full challenges view is coming in a future update');
  };

  const handleJoinChallenge = () => {
    Alert.alert('Coming Soon', 'Challenge browser is coming in a future update');
  };

  // Phase 4: Social handlers
  const handleSeeAllActivity = () => {
    router.push('/social-notifications');
  };

  const handleActivityPress = (activity: RecentActivity) => {
    // Navigate based on activity type
    if (activity.relatedRegattaId) {
      router.push(`/(tabs)/race/${activity.relatedRegattaId}`);
    } else if (activity.relatedUserId) {
      router.push(`/sailor/${activity.relatedUserId}`);
    }
  };

  // Phase 5: Goals handlers
  const handleSeeAllGoals = () => {
    Alert.alert('Coming Soon', 'Full goals management is coming in a future update');
  };

  const handleGoalPress = (goal: SeasonGoal) => {
    Alert.alert(
      goal.title,
      `${goal.description || ''}\n\nProgress: ${goal.currentValue}/${goal.targetValue} ${goal.unit}\nPeriod: ${goal.period}`
    );
  };

  const handleAddGoal = () => {
    Alert.alert('Coming Soon', 'Goal creation is coming in a future update');
  };

  // Phase 5: Insights handlers
  const handleSeeAllInsights = () => {
    Alert.alert('Coming Soon', 'Full insights view is coming in a future update');
  };

  const handleInsightPress = (insight: PerformanceInsight) => {
    Alert.alert(insight.title, insight.description);
  };

  // Phase 5: Comparison handlers
  const handleSeeAllComparisons = () => {
    Alert.alert('Coming Soon', 'Full leaderboard view is coming in a future update');
  };

  // Phase 5: Weekly Summary handlers
  const handleShareWeeklySummary = () => {
    // The WeeklySummaryCard has built-in share functionality
  };

  const handleSeeWeekDetails = () => {
    Alert.alert('Coming Soon', 'Detailed weekly breakdown is coming in a future update');
  };

  // Phase 5: Gear Management handlers
  const handleBoatMaintenancePress = (boat: BoatWithMaintenance) => {
    router.push(`/(tabs)/boat/edit/${boat.id}`);
  };

  const handleMaintenanceLogPress = (log: MaintenanceLog) => {
    Alert.alert(
      log.title,
      `${log.description || ''}\n\nType: ${log.type}\nDate: ${new Date(log.date).toLocaleDateString()}\nStatus: ${log.status}${log.cost ? `\nCost: $${log.cost}` : ''}${log.vendor ? `\nVendor: ${log.vendor}` : ''}`
    );
  };

  const handleAddMaintenance = (boatId: string) => {
    Alert.alert('Coming Soon', 'Maintenance logging is coming in a future update');
  };

  const handleSeeAllMaintenance = () => {
    Alert.alert('Coming Soon', 'Full maintenance history is coming in a future update');
  };

  // Phase 6: Training Plans handlers
  const handleStartPlan = (planId: string) => {
    Alert.alert('Coming Soon', 'Training plan management is coming in a future update');
  };

  const handleCompleteActivity = (planId: string, activityId: string) => {
    Alert.alert('Coming Soon', 'Activity completion is coming in a future update');
  };

  const handleViewPlanDetails = (planId: string) => {
    // Modal opens in the component
  };

  const handleCreatePlan = () => {
    Alert.alert('Coming Soon', 'Plan creation is coming in a future update');
  };

  // Phase 6: Venue Heatmap handlers
  const handleVenuePress = (venueId: string) => {
    Alert.alert('Coming Soon', 'Venue details are coming in a future update');
  };

  // Phase 6: Season Recap handlers
  const handleShareRecap = () => {
    // Built-in share functionality in component
  };

  const handleViewFullRecap = () => {
    // Modal opens in the component
  };

  // Phase 6: Course Records handlers
  const handleRecordPress = (recordId: string) => {
    Alert.alert('Coming Soon', 'Course record details are coming in a future update');
  };

  // Phase 6: Photo Gallery handlers
  const handlePhotoPress = (photoId: string) => {
    // Lightbox opens in the component
  };

  const handleAddPhoto = () => {
    Alert.alert('Coming Soon', 'Photo upload is coming in a future update');
  };

  // Phase 6: Race Journal handlers
  const handleJournalEntryPress = (entryId: string) => {
    // Modal opens in the component
  };

  const handleAddJournalEntry = () => {
    Alert.alert('Coming Soon', 'Journal entry creation is coming in a future update');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: toolbarHeight + 20 }]}>
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: toolbarHeight + 20 }]}>
        <Ionicons name="person-outline" size={48} color={IOS_COLORS.systemGray3} />
        <Text style={styles.emptyTitle}>Profile Not Available</Text>
        <Text style={styles.emptySubtitle}>
          Sign in to see your sailing profile
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: toolbarHeight },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={IOS_COLORS.systemBlue}
        />
      }
    >
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Profile Header */}
        <ReflectProfileHeader
          profile={data.profile}
          stats={data.stats}
          onEditProfile={handleEditProfile}
        />

        {/* Phase 4: Social Stats */}
        <SocialStatsCard
          userId={data.profile.userId}
          followersCount={data.profile.followerCount}
          followingCount={data.profile.followingCount}
          isOwnProfile={true}
        />

        {/* Phase 4: Recent Activity */}
        <RecentActivitySection
          activities={data.recentActivity}
          onSeeMore={handleSeeAllActivity}
          onActivityPress={handleActivityPress}
        />

        {/* Statistics Section */}
        <StatisticsSection
          stats={data.stats}
          onSeeMore={handleSeeAllStats}
        />

        {/* Venues Visited */}
        <VenuesVisitedSection
          venues={data.venuesVisited}
          onSeeMore={handleSeeAllVenues}
        />

        {/* Boats */}
        <BoatsSection
          boats={data.boats}
          onAddBoat={handleAddBoat}
          onSeeMore={handleSeeAllBoats}
        />

        {/* Phase 3: Achievements */}
        <AchievementsSection
          achievements={data.achievements}
          onSeeMore={handleSeeAllAchievements}
          onAchievementPress={handleAchievementPress}
        />

        {/* Phase 3: Personal Records */}
        <PersonalRecordsCard
          records={data.personalRecords}
          onSeeMore={handleSeeAllRecords}
        />

        {/* Phase 3: Challenges */}
        <ChallengesSection
          challenges={data.challenges}
          onSeeMore={handleSeeAllChallenges}
          onJoinChallenge={handleJoinChallenge}
        />

        {/* Phase 5: Weekly Summary */}
        <WeeklySummaryCard
          summary={data.weeklySummary}
          onShare={handleShareWeeklySummary}
          onSeeDetails={handleSeeWeekDetails}
        />

        {/* Phase 5: Season Goals */}
        <GoalsSection
          goals={data.goals}
          onSeeMore={handleSeeAllGoals}
          onGoalPress={handleGoalPress}
          onAddGoal={handleAddGoal}
        />

        {/* Phase 5: AI Insights */}
        <InsightsCard
          insights={data.insights}
          onSeeMore={handleSeeAllInsights}
          onInsightPress={handleInsightPress}
        />

        {/* Phase 5: Fleet & Sailor Comparisons */}
        <ComparisonCard
          fleetComparison={data.fleetComparison}
          sailorComparisons={data.sailorComparisons}
          onSeeMore={handleSeeAllComparisons}
        />

        {/* Phase 5: Gear Management */}
        <GearManagementSection
          boats={data.boatsWithMaintenance}
          onBoatPress={handleBoatMaintenancePress}
          onMaintenancePress={handleMaintenanceLogPress}
          onAddMaintenance={handleAddMaintenance}
          onSeeAllMaintenance={handleSeeAllMaintenance}
        />

        {/* Phase 6: Training Plans */}
        <TrainingPlansSection
          plans={data.trainingPlans}
          onStartPlan={handleStartPlan}
          onCompleteActivity={handleCompleteActivity}
          onViewPlanDetails={handleViewPlanDetails}
          onCreatePlan={handleCreatePlan}
        />

        {/* Phase 6: Venue Heatmap */}
        <VenueHeatmap
          venues={data.venuesWithCoordinates}
          onVenuePress={handleVenuePress}
        />

        {/* Phase 6: Season Recap */}
        <SeasonRecapCard
          recap={data.seasonRecap}
          onShare={handleShareRecap}
          onViewFullRecap={handleViewFullRecap}
        />

        {/* Phase 6: Course Records */}
        <CourseRecordsSection
          records={data.courseRecords}
          onRecordPress={handleRecordPress}
        />

        {/* Phase 6: Photo Gallery */}
        <PhotoGallerySection
          photos={data.racePhotos}
          onPhotoPress={handlePhotoPress}
          onAddPhoto={handleAddPhoto}
        />

        {/* Phase 6: Race Journal */}
        <RaceJournalSection
          entries={data.raceJournal}
          onEntryPress={handleJournalEntryPress}
          onAddEntry={handleAddJournalEntry}
        />
      </View>
    </ScrollView>
  );
}

// =============================================================================
// RACE LOG VIEW
// =============================================================================

interface RaceLogViewProps {
  toolbarHeight: number;
  onScroll: (event: any) => void;
  isDesktop: boolean;
}

function RaceLogView({ toolbarHeight, onScroll, isDesktop }: RaceLogViewProps) {
  const { data, loading, refresh } = useReflectDataMock();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const filteredRaces = useMemo(() => {
    if (!data?.raceLog) return [];
    if (!searchQuery.trim()) return data.raceLog;

    const query = searchQuery.toLowerCase();
    return data.raceLog.filter(
      (race) =>
        race.name.toLowerCase().includes(query) ||
        race.venueName?.toLowerCase().includes(query) ||
        race.boatClass?.toLowerCase().includes(query)
    );
  }, [data?.raceLog, searchQuery]);

  const handleRacePress = (race: RaceLogEntry) => {
    if (race.regattaId) {
      router.push(`/(tabs)/race/${race.regattaId}`);
    }
  };

  const renderRace = useCallback(
    ({ item }: { item: RaceLogEntry }) => (
      <RaceLogCard race={item} onPress={() => handleRacePress(item)} />
    ),
    []
  );

  const keyExtractor = useCallback((item: RaceLogEntry) => item.id, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: toolbarHeight + 20 }]}>
        <Text style={styles.loadingText}>Loading your race history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.raceLogContainer}>
      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          { marginTop: toolbarHeight + 8 },
          isDesktop && styles.searchContainerDesktop,
        ]}
      >
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={16}
            color={IOS_COLORS.secondaryLabel}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, venue, or class"
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Race Count Header */}
      <View style={[styles.raceCountHeader, isDesktop && styles.contentDesktop]}>
        <Text style={styles.raceCountText}>
          {filteredRaces.length} {filteredRaces.length === 1 ? 'race' : 'races'}
          {searchQuery ? ' found' : ''}
        </Text>
      </View>

      {/* Race List */}
      <FlatList
        data={filteredRaces}
        renderItem={renderRace}
        keyExtractor={keyExtractor}
        style={styles.raceList}
        contentContainerStyle={[
          styles.raceListContent,
          isDesktop && styles.contentDesktop,
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={IOS_COLORS.systemBlue}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Ionicons
              name="search-outline"
              size={32}
              color={IOS_COLORS.systemGray3}
            />
            <Text style={styles.emptyListText}>
              {searchQuery
                ? 'No races match your search'
                : 'No races in your history yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================

export default function ReflectScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll: handleToolbarScroll } = useScrollToolbarHide();
  const [activeSegment, setActiveSegment] = useState<ReflectSegment>('progress');

  const isDesktop = width > 768;

  const handleSettingsPress = () => {
    router.push('/(tabs)/settings');
  };

  const handleNotificationsPress = () => {
    router.push('/social-notifications');
  };

  return (
    <View style={styles.container}>
      {/* Content */}
      {activeSegment === 'progress' && (
        <ProgressView
          toolbarHeight={toolbarHeight}
          onScroll={handleToolbarScroll}
          isDesktop={isDesktop}
        />
      )}
      {activeSegment === 'racelog' && (
        <RaceLogView
          toolbarHeight={toolbarHeight}
          onScroll={handleToolbarScroll}
          isDesktop={isDesktop}
        />
      )}
      {activeSegment === 'profile' && (
        <ProfileView
          toolbarHeight={toolbarHeight}
          onScroll={handleToolbarScroll}
          isDesktop={isDesktop}
        />
      )}

      {/* Toolbar */}
      <TabScreenToolbar
        title="Reflect"
        topInset={insets.top}
        actions={[
          {
            icon: 'notifications-outline',
            label: 'Notifications',
            onPress: handleNotificationsPress,
          },
          {
            icon: 'settings-outline',
            label: 'Settings',
            onPress: handleSettingsPress,
          },
        ]}
        onMeasuredHeight={setToolbarHeight}
        hidden={toolbarHidden}
      >
        {/* Segmented Control */}
        <View style={styles.segmentedControlContainer}>
          <IOSSegmentedControl
            segments={REFLECT_SEGMENTS}
            selectedValue={activeSegment}
            onValueChange={setActiveSegment}
          />
        </View>
      </TabScreenToolbar>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  segmentedControlContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  contentDesktop: {
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  // Year Stats Card
  yearStatsCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  yearStatsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
    marginBottom: 16,
  },
  yearStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yearStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  yearStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.systemBlue,
    letterSpacing: -0.5,
  },
  yearStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Race Log View
  raceLogContainer: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchContainerDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 15,
    color: IOS_COLORS.label,
  },
  raceCountHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  raceCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  raceList: {
    flex: 1,
  },
  raceListContent: {
    paddingBottom: 120,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    maxWidth: 1200,
    alignSelf: 'center',
    width: 'calc(100% - 32px)',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyListText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});
