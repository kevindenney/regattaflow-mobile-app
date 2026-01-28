/**
 * RaceDetailContent - Reusable race detail rendering
 *
 * Extracted from app/race/[id].tsx so it can be used both:
 * 1. As a full-screen route (wrapped by app/race/[id].tsx)
 * 2. In the detail pane of MasterDetailLayout on web
 *
 * Accepts a raceId prop instead of reading route params.
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Share,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
} from '@/lib/design-tokens-ios';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { IOSSegmentedControl } from '@/components/ui/ios';
import { RaceDetailHeroHeader } from '@/components/races/RaceDetailHeroHeader';
import { CollaborationPopover } from '@/components/races/CollaborationPopover';
import { RaceCrewChat } from '@/components/races/RaceCrewChat';
import {
  DaysBeforeContent,
  OnWaterContent,
  AfterRaceContent,
} from '@/components/cards/content/phases';
import { usePhaseCompletionCounts } from '@/hooks/usePhaseCompletionCounts';
import { useRaceCollaborators } from '@/hooks/useRaceCollaborators';
import { useRaceMessages } from '@/hooks/useRaceMessages';
import { useRacePresence } from '@/hooks/useRacePresence';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import type { CardRaceData } from '@/components/cards/types';
import type { RacePhase } from '@/components/cards/types';

const logger = createLogger('RaceDetailContent');

// =============================================================================
// TYPES
// =============================================================================

type PhaseTab = 'prep' | 'race' | 'review';

const PHASE_SEGMENTS: { value: PhaseTab; label: string }[] = [
  { value: 'prep', label: 'Prep' },
  { value: 'race', label: 'Race' },
  { value: 'review', label: 'Review' },
];

// =============================================================================
// PROPS
// =============================================================================

interface RaceDetailContentProps {
  /** The race ID to display */
  raceId: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RaceDetailContent({ raceId }: RaceDetailContentProps) {
  const { user } = useAuth();

  const [raceData, setRaceData] = useState<CardRaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<PhaseTab>('prep');

  // Collaboration UI state
  const [showCollabPopover, setShowCollabPopover] = useState(false);
  const [showCrewChat, setShowCrewChat] = useState(false);

  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------

  const fetchRace = useCallback(async () => {
    if (!raceId || raceId === '[id]') return;

    try {
      // Try regattas table first
      const { data, error } = await supabase
        .from('regattas')
        .select('*')
        .eq('id', raceId)
        .single();

      if (!error && data) {
        setRaceData({
          id: data.id,
          name: data.race_name || data.name || 'Unnamed Race',
          venue: data.venue_name || data.venue,
          date: data.start_date || data.date || new Date().toISOString(),
          startTime: data.start_time || data.startTime,
          boatClass: data.boat_class || data.boatClass,
          vhf_channel: data.vhf_channel,
          race_type: data.race_type || 'fleet',
          time_limit_hours: data.time_limit_hours,
          created_by: data.created_by,
        });
        return;
      }

      // Fallback to race_events table
      const { data: raceEventData, error: raceEventError } = await supabase
        .from('race_events')
        .select('*')
        .eq('id', raceId)
        .single();

      if (!raceEventError && raceEventData) {
        setRaceData({
          id: raceEventData.id,
          name: raceEventData.name || 'Unnamed Race',
          venue: raceEventData.venue_name || raceEventData.venue,
          date: raceEventData.start_time || raceEventData.event_date || new Date().toISOString(),
          startTime: raceEventData.start_time_of_day,
          boatClass: raceEventData.boat_class,
          race_type: raceEventData.race_type || 'fleet',
          created_by: raceEventData.user_id,
        });
        return;
      }

      logger.warn('[RaceDetailContent] Race not found:', raceId);
    } catch (err) {
      logger.error('[RaceDetailContent] Error fetching race:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [raceId]);

  useEffect(() => {
    // Reset state when raceId changes
    setLoading(true);
    setRaceData(null);
    setSelectedPhase('prep');
    setShowCollabPopover(false);
    setShowCrewChat(false);
    fetchRace();
  }, [fetchRace]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRace();
  }, [fetchRace]);

  // ---------------------------------------------------------------------------
  // COLLABORATION HOOKS
  // ---------------------------------------------------------------------------

  const { collaborators } = useRaceCollaborators(raceId || null);

  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    deleteMessage,
    isSending,
  } = useRaceMessages({
    regattaId: raceId,
    realtime: FEATURE_FLAGS.ENABLE_RACE_CREW_CHAT,
  });

  const { presentUserIds } = useRacePresence({
    regattaId: raceId,
    userId: user?.id,
    displayName: user?.user_metadata?.full_name,
    enabled: FEATURE_FLAGS.ENABLE_RACE_PRESENCE,
  });

  // ---------------------------------------------------------------------------
  // PHASE COMPLETION
  // ---------------------------------------------------------------------------

  const { counts: phaseCounts, isLoading: countsLoading } = usePhaseCompletionCounts({
    regattaId: raceId || '',
    raceType: (raceData?.race_type as any) || 'fleet',
    enabled: !!raceId && !!raceData,
  });

  const prepProgress = useMemo(() => {
    if (countsLoading || !phaseCounts) return null;
    const totalCompleted =
      phaseCounts.days_before.completed +
      phaseCounts.on_water.completed +
      phaseCounts.after_race.completed;
    const totalItems =
      phaseCounts.days_before.total +
      phaseCounts.on_water.total +
      phaseCounts.after_race.total;
    return totalItems > 0 ? totalCompleted / totalItems : 0;
  }, [phaseCounts, countsLoading]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const selectedIndex = PHASE_SEGMENTS.findIndex((s) => s.value === selectedPhase);

  const handleSegmentChange = useCallback((index: number) => {
    setSelectedPhase(PHASE_SEGMENTS[index].value);
  }, []);

  const handleCollaboratorPress = useCallback(() => {
    if (FEATURE_FLAGS.ENABLE_COLLABORATION_POPOVER) {
      setShowCollabPopover(true);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // LOADING / ERROR STATES
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
      </View>
    );
  }

  if (!raceData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Race not found</Text>
        <Text style={styles.errorSubtitle}>This race may have been deleted.</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={IOS_COLORS.systemBlue}
          />
        }
      >
        {/* Hero Header with collaborator avatars */}
        <RaceDetailHeroHeader
          race={raceData}
          prepProgress={prepProgress}
          presentUserIds={presentUserIds}
          onCollaboratorPress={handleCollaboratorPress}
        />

        {/* Phase Segmented Control */}
        <View style={styles.segmentContainer}>
          <IOSSegmentedControl
            segments={PHASE_SEGMENTS.map((s) => s.label)}
            selectedIndex={selectedIndex}
            onSelect={handleSegmentChange}
          />
        </View>

        {/* Phase Content */}
        <View style={styles.phaseContent}>
          {selectedPhase === 'prep' && (
            <DaysBeforeContent
              race={raceData}
              isExpanded={true}
            />
          )}
          {selectedPhase === 'race' && (
            <OnWaterContent
              race={raceData}
              isExpanded={true}
            />
          )}
          {selectedPhase === 'review' && (
            <AfterRaceContent
              race={raceData}
              userId={user?.id}
              isExpanded={true}
            />
          )}
        </View>
      </ScrollView>

      {/* Collaboration Popover */}
      {FEATURE_FLAGS.ENABLE_COLLABORATION_POPOVER && (
        <CollaborationPopover
          visible={showCollabPopover}
          onClose={() => setShowCollabPopover(false)}
          collaborators={collaborators}
          presentUserIds={presentUserIds}
          recentMessages={messages}
          currentUserId={user?.id}
          onOpenChat={() => setShowCrewChat(true)}
        />
      )}

      {/* Crew Chat Bottom Sheet */}
      {FEATURE_FLAGS.ENABLE_RACE_CREW_CHAT && (
        <RaceCrewChat
          visible={showCrewChat}
          onClose={() => setShowCrewChat(false)}
          messages={messages}
          currentUserId={user?.id}
          onSendMessage={sendMessage}
          onDeleteMessage={deleteMessage}
          isSending={isSending}
          isLoading={messagesLoading}
        />
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  segmentContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  phaseContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    padding: IOS_SPACING.xxxl,
    gap: IOS_SPACING.sm,
  },
  errorTitle: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
  },
  errorSubtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});
