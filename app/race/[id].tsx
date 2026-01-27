/**
 * Race Detail Screen - Progressive disclosure race view
 *
 * Stack-pushed full-screen detail view accessed from the grouped race list.
 * Layout:
 * 1. Hero header with large countdown, collaborator avatars, and presence
 * 2. Phase segmented control (Prep / Race / Review)
 * 3. Inset grouped sections with collapsible checklist categories
 *
 * Collaboration features (Apple-style):
 * - Share button in toolbar headerRight
 * - Crew avatar row in hero header with presence dots
 * - Collaboration popover (tap avatar row)
 * - Crew chat bottom sheet (Messages-style)
 * - Realtime presence tracking
 *
 * This screen replaces the inline card content when USE_RACE_LIST_VIEW is enabled.
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Share2, MessageCircle } from 'lucide-react-native';
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

const logger = createLogger('RaceDetailScreen');

// =============================================================================
// TYPES
// =============================================================================

type PhaseTab = 'prep' | 'race' | 'review';

const PHASE_SEGMENTS: { value: PhaseTab; label: string }[] = [
  { value: 'prep', label: 'Prep' },
  { value: 'race', label: 'Race' },
  { value: 'review', label: 'Review' },
];

const PHASE_MAP: Record<PhaseTab, RacePhase> = {
  prep: 'days_before',
  race: 'on_water',
  review: 'after_race',
};

// =============================================================================
// TOOLBAR BUTTONS
// =============================================================================

function HeaderRight({
  onSharePress,
  onChatPress,
  unreadCount,
}: {
  onSharePress: () => void;
  onChatPress: () => void;
  unreadCount: number;
}) {
  return (
    <View style={headerStyles.row}>
      {FEATURE_FLAGS.ENABLE_RACE_CREW_CHAT && (
        <Pressable
          onPress={onChatPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [pressed && headerStyles.pressed]}
        >
          <View>
            <MessageCircle size={22} color={IOS_COLORS.systemBlue} />
            {unreadCount > 0 && (
              <View style={headerStyles.badge}>
                <Text style={headerStyles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      )}
      <Pressable
        onPress={onSharePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => [pressed && headerStyles.pressed]}
      >
        <Share2 size={22} color={IOS_COLORS.systemBlue} />
      </Pressable>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.lg,
  },
  pressed: {
    opacity: 0.6,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.systemRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

// =============================================================================
// COMPONENT
// =============================================================================

export default function RaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [raceData, setRaceData] = useState<CardRaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<PhaseTab>('prep');

  // Collaboration UI state
  const [showCollabPopover, setShowCollabPopover] = useState(false);
  const [showCrewChat, setShowCrewChat] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  const actualId = Array.isArray(id) ? id[0] : id;

  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------

  const fetchRace = useCallback(async () => {
    if (!actualId || actualId === '[id]') return;

    try {
      // Try regattas table first
      const { data, error } = await supabase
        .from('regattas')
        .select('*')
        .eq('id', actualId)
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
        .eq('id', actualId)
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

      logger.warn('[RaceDetailScreen] Race not found:', actualId);
    } catch (err) {
      logger.error('[RaceDetailScreen] Error fetching race:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [actualId]);

  useEffect(() => {
    fetchRace();
  }, [fetchRace]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRace();
  }, [fetchRace]);

  // ---------------------------------------------------------------------------
  // COLLABORATION HOOKS
  // ---------------------------------------------------------------------------

  const { collaborators } = useRaceCollaborators(actualId || null);

  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    isSending,
  } = useRaceMessages({
    regattaId: actualId,
    realtime: FEATURE_FLAGS.ENABLE_RACE_CREW_CHAT,
  });

  const { presentUserIds } = useRacePresence({
    regattaId: actualId,
    userId: user?.id,
    displayName: user?.user_metadata?.full_name,
    enabled: FEATURE_FLAGS.ENABLE_RACE_PRESENCE,
  });

  // ---------------------------------------------------------------------------
  // PHASE COMPLETION
  // ---------------------------------------------------------------------------

  const { counts: phaseCounts, isLoading: countsLoading } = usePhaseCompletionCounts({
    regattaId: actualId || '',
    raceType: (raceData?.race_type as any) || 'fleet',
    enabled: !!actualId && !!raceData,
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

  const handleSharePress = useCallback(async () => {
    if (!raceData) return;
    try {
      const dateStr = new Date(raceData.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const parts = [`${raceData.name} — ${dateStr}`];
      if (raceData.venue) parts.push(raceData.venue);
      parts.push('Shared from RegattaFlow');

      await Share.share({
        message: parts.join('\n'),
        title: raceData.name,
      });
    } catch {
      // User cancelled or share failed — no-op
    }
  }, [raceData]);

  const handleChatPress = useCallback(() => {
    setShowCrewChat(true);
  }, []);

  const handleCollaboratorPress = useCallback(() => {
    if (FEATURE_FLAGS.ENABLE_COLLABORATION_POPOVER) {
      setShowCollabPopover(true);
    }
  }, []);

  // Message count for badge (simple: count of messages not from current user)
  const unreadCount = useMemo(() => {
    if (!FEATURE_FLAGS.ENABLE_RACE_CREW_CHAT) return 0;
    // Show count of text messages from others as a simple indicator
    return messages.filter(
      (m) => m.messageType === 'text' && m.userId !== user?.id
    ).length;
  }, [messages, user?.id]);

  // ---------------------------------------------------------------------------
  // LOADING / ERROR STATES
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: '', headerShown: true, headerBackTitle: 'Races' }} />
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
      </View>
    );
  }

  if (!raceData) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Race', headerShown: true, headerBackTitle: 'Races' }} />
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
      <Stack.Screen
        options={{
          title: raceData.name,
          headerShown: true,
          headerBackTitle: 'Races',
          headerLargeTitle: false,
          headerRight: () => (
            <HeaderRight
              onSharePress={handleSharePress}
              onChatPress={handleChatPress}
              unreadCount={unreadCount}
            />
          ),
        }}
      />

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
