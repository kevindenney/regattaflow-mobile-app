/**
 * ReviewsList — newest-first list of weekly AI-generated review cards.
 * Each card shows the week range, summary markdown, and an optional
 * focus_suggestion block. "Generate weekly review" button triggers the
 * playbook-weekly-review edge function (Phase 7).
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { useInterest } from '@/providers/InterestProvider';
import { usePlaybook, usePlaybookReviews } from '@/hooks/usePlaybook';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import { PlaybookAIService } from '@/services/ai/PlaybookAIService';

function formatRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}, ${e.getFullYear()}`;
}

export function ReviewsList() {
  const { currentInterest } = useInterest();
  const { data: playbook } = usePlaybook(currentInterest?.id);
  const { data: reviews = [], isLoading } = usePlaybookReviews(playbook?.id);
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!playbook || generating) return;
    setGenerating(true);
    try {
      const res = await PlaybookAIService.generateWeeklyReview(playbook.id);
      await queryClient.invalidateQueries({ queryKey: ['playbook'] });
      showAlert(
        'Review queued',
        `${res.suggestions_created} suggestion${res.suggestions_created === 1 ? '' : 's'} added. Accept them to publish the review.`,
      );
    } catch (err) {
      showAlert('Generate failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Reviews</Text>
        <Pressable
          onPress={handleGenerate}
          disabled={generating}
          style={({ pressed }) => [
            styles.runButton,
            generating && styles.runButtonDisabled,
            pressed && !generating && styles.pressed,
          ]}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="sparkles" size={14} color="#fff" />
          )}
          <Text style={styles.runText}>{generating ? 'Generating…' : 'Generate'}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : reviews.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={36} color={IOS_COLORS.tertiaryLabel} />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptyText}>
            Weekly reviews compile your debriefs, concept edits, and new resources
            into a short summary + "focus next week" suggestion. Tap Generate
            once you've got a week's worth of steps.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {reviews.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.week}>{formatRange(r.period_start, r.period_end)}</Text>
              <Text style={styles.summary}>{r.summary_md}</Text>
              {r.focus_suggestion_md ? (
                <View style={styles.focusBlock}>
                  <View style={styles.focusHeader}>
                    <Ionicons name="flag-outline" size={14} color={IOS_COLORS.systemOrange} />
                    <Text style={styles.focusTitle}>Focus next week</Text>
                  </View>
                  <Text style={styles.focusText}>{r.focus_suggestion_md}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  content: {
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.systemPurple,
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  pressed: {
    opacity: 0.6,
  },
  loading: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  list: {
    gap: IOS_SPACING.md,
  },
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 14,
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },
  week: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: IOS_COLORS.systemIndigo,
  },
  summary: {
    fontSize: 14,
    lineHeight: 21,
    color: IOS_COLORS.label,
  },
  focusBlock: {
    padding: IOS_SPACING.md,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    gap: 4,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  focusTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: IOS_COLORS.systemOrange,
  },
  focusText: {
    fontSize: 13,
    lineHeight: 18,
    color: IOS_COLORS.label,
  },
  empty: {
    alignItems: 'center',
    padding: IOS_SPACING.xl,
    gap: IOS_SPACING.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  emptyText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 18,
  },
});
