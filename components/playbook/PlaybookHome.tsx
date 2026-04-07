/**
 * PlaybookHome — top-level screen for the Playbook feature.
 *
 * Composes the Vision card, Ask-your-Playbook card, pending-suggestions bar,
 * the 5-tab section nav (Concepts / Resources / Patterns / Reviews / Q&A),
 * Recent debriefs, and the right sidebar (queued suggestions, raw inbox,
 * shared with, inherited from, quick capture).
 *
 * One playbook per (user, interest). The active interest comes from
 * `useInterest().currentInterest`; the playbook row is auto-created on first
 * load via `usePlaybook` → `PlaybookService.getOrCreatePlaybook`.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import { useInterest } from '@/providers/InterestProvider';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePlaybook,
  usePlaybookSectionCounts,
  usePlaybookPendingSuggestionCount,
  usePlaybookReviews,
  usePlaybookSuggestions,
} from '@/hooks/usePlaybook';
import { PlaybookAIService } from '@/services/ai/PlaybookAIService';
import { VisionCard } from './VisionCard';
import { AskYourPlaybook } from './AskYourPlaybook';
import { SuggestionsBar } from './SuggestionsBar';
import { SectionTabs } from './SectionTabs';
import { RecentDebriefs } from './RecentDebriefs';
import { QueuedSuggestionsPreview } from './sidebar/QueuedSuggestionsPreview';
import { RawInboxCard } from './sidebar/RawInboxCard';
import { SharedWithCard } from './sidebar/SharedWithCard';
import { InheritedFromCard } from './sidebar/InheritedFromCard';
import { SharedWithMeCard } from './sidebar/SharedWithMeCard';
import { SuggestionDrawer } from './suggestions/SuggestionDrawer';
import { InviteCoachModal } from './shares/InviteCoachModal';
import { QuickCaptureModal } from './QuickCaptureModal';
import { FeatureErrorBoundary } from '@/components/ui/FeatureErrorBoundary';

const SIDEBAR_BREAKPOINT = 1000;

export function PlaybookHome() {
  const { currentInterest, loading: interestLoading } = useInterest();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const twoColumn = width >= SIDEBAR_BREAKPOINT;

  const interestId = currentInterest?.id;
  const interestName = currentInterest?.name ?? 'this interest';

  const {
    data: playbook,
    isLoading: playbookLoading,
    error: playbookError,
  } = usePlaybook(interestId);
  const playbookId = playbook?.id;

  const { data: counts } = usePlaybookSectionCounts(playbookId, interestId);
  const { data: pendingCount = 0 } = usePlaybookPendingSuggestionCount(playbookId);
  const { data: reviews } = usePlaybookReviews(playbookId);
  const { data: suggestions } = usePlaybookSuggestions(playbookId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);

  // Auto-trigger weekly review if >7 days since last review (or none exists)
  // AND no pending/accepted weekly_review suggestion already in the queue.
  const weeklyReviewFiredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!playbookId || reviews === undefined || suggestions === undefined) return;
    if (weeklyReviewFiredRef.current.has(playbookId)) return;

    // Skip if there's already a pending or recently-accepted weekly_review suggestion
    const hasWeeklyReview = suggestions.some(
      (s) => s.kind === 'weekly_review' && (s.status === 'pending' || s.status === 'accepted'),
    );
    if (hasWeeklyReview) return;

    const lastReviewEnd = reviews?.[0]?.period_end;
    const daysSince = lastReviewEnd
      ? Math.floor((Date.now() - new Date(lastReviewEnd).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSince > 7) {
      weeklyReviewFiredRef.current.add(playbookId);
      PlaybookAIService.generateWeeklyReview(playbookId)
        .then(() => {
          queryClient.invalidateQueries({
            predicate: (query) => {
              const first = query.queryKey[0];
              return typeof first === 'string' && first.startsWith('playbook');
            },
          });
        })
        .catch((err) => {
          console.warn('[PlaybookHome] Auto weekly review failed:', err);
        });
    }
  }, [playbookId, reviews, suggestions, queryClient]);

  if (interestLoading || playbookLoading) {
    return (
      <View style={styles.fullMessage}>
        <Text style={styles.messageText}>Loading your Playbook…</Text>
      </View>
    );
  }

  if (!currentInterest) {
    return (
      <View style={styles.fullMessage}>
        <Ionicons name="compass-outline" size={48} color={IOS_COLORS.tertiaryLabel} />
        <Text style={styles.messageTitle}>Pick an interest</Text>
        <Text style={styles.messageText}>
          Your Playbook is scoped per interest. Choose one from the interest
          switcher to get started.
        </Text>
        <SharedWithMeCard />
      </View>
    );
  }

  if (playbookError) {
    return (
      <View style={styles.fullMessage}>
        <Ionicons name="warning-outline" size={48} color={IOS_COLORS.systemRed} />
        <Text style={styles.messageTitle}>Playbook unavailable</Text>
        <Text style={styles.messageText}>{playbookError.message}</Text>
        <SharedWithMeCard />
      </View>
    );
  }

  const main = (
    <View style={styles.mainColumn}>
      <SuggestionsBar pendingCount={pendingCount} onPress={() => setDrawerOpen(true)} />

      <View style={twoColumn ? styles.twoUp : styles.stack}>
        <View style={twoColumn ? styles.half : styles.full}>
          <VisionCard interestId={currentInterest.id} interestName={interestName} />
        </View>
        <View style={twoColumn ? styles.half : styles.full}>
          <AskYourPlaybook interestName={interestName} playbookId={playbookId} />
        </View>
      </View>

      <SectionTabs counts={counts} />

      <RecentDebriefs interestId={interestId} playbookId={playbookId} />
    </View>
  );

  const sidebar = (
    <View style={styles.sidebar}>
      <QueuedSuggestionsPreview
        playbookId={playbookId}
        onOpen={() => setDrawerOpen(true)}
      />
      <RawInboxCard playbookId={playbookId} onOpenSuggestions={() => setDrawerOpen(true)} />
      <SharedWithCard playbookId={playbookId} />
      <InheritedFromCard
        playbookId={playbookId}
        interestId={interestId}
        interestName={interestName}
      />
      <SharedWithMeCard />
    </View>
  );

  return (
    <FeatureErrorBoundary fallbackMessage="Something went wrong loading your playbook.">
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: toolbarHeight + IOS_SPACING.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {twoColumn ? (
          <View style={styles.grid}>
            {main}
            {sidebar}
          </View>
        ) : (
          <View style={styles.stack}>
            {main}
            {sidebar}
          </View>
        )}
      </ScrollView>
      <TabScreenToolbar
        title="Playbook"
        subtitle={interestName}
        topInset={insets.top}
        onMeasuredHeight={setToolbarHeight}
        actions={[
          {
            icon: 'share-outline',
            sfSymbol: 'square.and.arrow.up',
            label: 'Share Playbook',
            onPress: () => setShareOpen(true),
          },
          {
            icon: 'add',
            sfSymbol: 'plus',
            label: 'Quick capture',
            onPress: () => setQuickCaptureOpen(true),
          },
        ]}
      />
      <InviteCoachModal
        visible={shareOpen}
        playbookId={playbookId}
        onClose={() => setShareOpen(false)}
      />
      <QuickCaptureModal
        visible={quickCaptureOpen}
        playbookId={playbookId}
        onClose={() => setQuickCaptureOpen(false)}
      />
      <SuggestionDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        playbookId={playbookId}
      />
    </View>
    </FeatureErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.xl,
  },
  grid: {
    flexDirection: 'row',
    gap: IOS_SPACING.lg,
    alignItems: 'flex-start',
  },
  stack: {
    gap: IOS_SPACING.lg,
  },
  mainColumn: {
    flex: 1,
    gap: IOS_SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  topLeft: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: IOS_COLORS.systemIndigo,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginTop: 2,
  },
  twoUp: {
    flexDirection: 'row',
    gap: IOS_SPACING.lg,
  },
  half: {
    flex: 1,
  },
  full: {
    width: '100%',
  },
  sidebar: {
    width: 320,
    gap: IOS_SPACING.md,
  },
  fullMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: IOS_SPACING.xl,
    gap: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  messageText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    maxWidth: 360,
  },
});
