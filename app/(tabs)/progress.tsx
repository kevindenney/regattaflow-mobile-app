/**
 * Progress Screen (Tufte-Style)
 *
 * Data-dense document showing Excellence Framework metrics.
 * No cards, no decorations - typography hierarchy and data only.
 *
 * Tufte principles:
 * - High data-ink ratio
 * - Integrated header with summary statistics
 * - Hairline dividers instead of card containers
 * - Dense, scannable layout
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useExcellenceMetrics } from '@/hooks/useExcellenceMetrics';
import { useLearnableEvents, useLearningInsights } from '@/hooks/useAdaptiveLearning';
import { useSeasonSelection } from '@/hooks/useSailorProfile';
import { useCurrentSeason, useUserSeasons } from '@/hooks/useSeason';
import { sparkline, trendArrow } from '@/lib/tufte';

import {
  PhaseMasteryChart,
  OutcomeTrendCard,
  FocusRecommendations,
  RecentLearnings,
  SeasonHistorySection,
  PastRaceList,
} from '@/components/progress';
import { SeasonSettingsModal } from '@/components/seasons/SeasonSettingsModal';
import { SeasonArchive } from '@/components/seasons/SeasonArchive';

export default function ProgressScreen() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSeasonSettings, setShowSeasonSettings] = useState(false);
  const [showFullArchive, setShowFullArchive] = useState(false);

  // Get current season (if available)
  const { currentSeason } = useSeasonSelection?.() || { currentSeason: null };

  // Season data for history section
  const { data: activeSeason, refetch: refetchCurrentSeason } = useCurrentSeason();
  const { data: userSeasons = [], isLoading: loadingSeasons, refetch: refetchSeasons } = useUserSeasons();

  // Build SeasonWithSummary list for slope graph (from seasons that have summary data)
  const seasonsWithSummary = (userSeasons as any[]).filter(
    (s) => s.summary?.user_standing
  );

  // Load excellence metrics
  const {
    metrics,
    phaseMastery,
    frameworkScores,
    outcomes,
    focusRecommendations,
    overallScore,
    isLoading,
    isRefreshing: isMetricsRefreshing,
    refresh: refreshMetrics,
  } = useExcellenceMetrics(currentSeason?.id);

  // Load learnable events
  const { events: learningEvents, isLoading: eventsLoading } = useLearnableEvents({
    limit: 10,
  });

  // Load learning insights
  const { insights } = useLearningInsights();

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMetrics();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate summary sparkline from recent results
  const generateSummarySparkline = () => {
    if (!outcomes.recentResults || outcomes.recentResults.length < 2) return '';
    const positions = outcomes.recentResults.map((r) => r.position);
    const maxPos = Math.max(...positions, 1);
    // Invert so lower position = higher bar
    const inverted = positions.map((p) => maxPos - p + 1);
    return sparkline(inverted, { width: 10 });
  };

  // Get trend indicator
  const getTrendDisplay = () => {
    switch (outcomes.positionTrend) {
      case 'improving':
        return { text: 'improving', arrow: '↑' };
      case 'declining':
        return { text: 'declining', arrow: '↓' };
      default:
        return { text: 'stable', arrow: '→' };
    }
  };

  // Loading state
  if (isLoading && !metrics) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#64748B" />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const trend = getTrendDisplay();
  const summarySparkline = generateSummarySparkline();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || isMetricsRefreshing}
            onRefresh={handleRefresh}
            tintColor="#64748B"
          />
        }
      >
        {/* Tufte-style header: Title with season in marginalia */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Progress</Text>
            <TouchableOpacity
              onPress={() => setShowSeasonSettings(true)}
              activeOpacity={0.6}
            >
              <Text style={styles.seasonText}>
                {currentSeason?.name || activeSeason?.name || 'No season ›'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Integrated summary line with sparkline */}
          <Text style={styles.summaryLine}>
            <Text style={styles.summaryValue}>{overallScore}%</Text>
            <Text style={styles.summaryLabel}> overall</Text>
            <Text style={styles.summarySeparator}> · </Text>
            <Text style={styles.summaryValue}>{outcomes.racesCompleted}</Text>
            <Text style={styles.summaryLabel}> races</Text>
            {summarySparkline && (
              <>
                <Text style={styles.summarySeparator}> · </Text>
                <Text style={styles.summaryTrend}>
                  {trend.text} {summarySparkline}
                </Text>
              </>
            )}
          </Text>
        </View>

        <View style={styles.mainDivider} />

        {/* Phase Mastery Section */}
        <View style={styles.section}>
          <PhaseMasteryChart mastery={phaseMastery} highlightLowest={2} />
        </View>

        <View style={styles.sectionDivider} />

        {/* Results Section */}
        <View style={styles.section}>
          <OutcomeTrendCard outcomes={outcomes} />
        </View>

        <View style={styles.sectionDivider} />

        {/* Focus Recommendations Section */}
        <View style={styles.section}>
          <FocusRecommendations
            recommendations={focusRecommendations}
            onDrillPress={(drill) => {
              router.push('/(tabs)/learn');
            }}
          />
        </View>

        <View style={styles.sectionDivider} />

        {/* Learnings Section */}
        <View style={styles.section}>
          <RecentLearnings
            events={learningEvents}
            limit={5}
            onViewAll={() => {
              // Future: navigate to full learnings list
            }}
          />
        </View>

        {/* Season History Section */}
        {userSeasons.length > 0 && (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.section}>
              <SeasonHistorySection
                seasonsWithSummary={seasonsWithSummary}
                seasons={userSeasons}
                limit={5}
                onSeasonPress={(seasonId) => {
                  // Future: navigate to season detail
                }}
                onViewAll={() => setShowFullArchive(true)}
              />
            </View>
          </>
        )}

        {/* Past Races Section */}
        {outcomes.recentResults && outcomes.recentResults.length > 0 && (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.section}>
              <PastRaceList
                races={outcomes.recentResults}
                limit={8}
                onRacePress={(raceId) => {
                  // Future: navigate to race detail
                }}
              />
            </View>
          </>
        )}

        {/* Footer spacer */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Season Settings Modal */}
      <SeasonSettingsModal
        visible={showSeasonSettings}
        season={activeSeason ?? null}
        onClose={() => setShowSeasonSettings(false)}
        onSeasonCreated={() => {
          setShowSeasonSettings(false);
          refetchCurrentSeason();
          refetchSeasons();
        }}
        onSeasonUpdated={() => {
          setShowSeasonSettings(false);
          refetchCurrentSeason();
          refetchSeasons();
        }}
        onSeasonEnded={() => {
          refetchCurrentSeason();
          refetchSeasons();
        }}
      />

      {/* Full Season Archive Modal */}
      <Modal
        visible={showFullArchive}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFullArchive(false)}
      >
        <SeasonArchive
          seasons={userSeasons}
          isLoading={loadingSeasons}
          onRefresh={() => refetchSeasons()}
          onSeasonPress={(seasonId) => {
            setShowFullArchive(false);
          }}
          onBackPress={() => setShowFullArchive(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  // Tufte-style header
  header: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  seasonText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  // Summary line - inline with sparkline
  summaryLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryValue: {
    fontWeight: '600',
    color: '#1a1a1a',
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontWeight: '400',
    color: '#6b7280',
  },
  summarySeparator: {
    color: '#d1d5db',
  },
  summaryTrend: {
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -0.5,
  },
  // Dividers
  mainDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 20,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  // Sections - no backgrounds, no padding
  section: {
    // No background, no padding - let child components handle layout
  },
  footerSpacer: {
    height: Platform.OS === 'ios' ? 100 : 80,
  },
});
