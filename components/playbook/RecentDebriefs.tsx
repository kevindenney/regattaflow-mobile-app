/**
 * RecentDebriefs — lists the last 5 timeline_steps for this interest that have
 * a populated `metadata.review` object. Each row shows title + relative date
 * and an "AI read this" badge when at least one `playbook_suggestions` row
 * cites that step in its `provenance` (future signal — currently always off
 * until Phase 7 edge functions start writing provenance).
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import {
  usePlaybookRecentDebriefs,
  usePlaybookSuggestions,
} from '@/hooks/usePlaybook';
import type { PlaybookSuggestionRecord } from '@/types/playbook';

interface RecentDebriefsProps {
  interestId: string | undefined;
  playbookId: string | undefined;
}

function relativeDate(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/** Collect step ids referenced by any suggestion's `provenance.step_ids`. */
function extractCitedStepIds(suggestions: PlaybookSuggestionRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const s of suggestions) {
    const prov = s.provenance as Record<string, unknown> | null;
    if (!prov) continue;
    const stepIds = prov.step_ids;
    if (Array.isArray(stepIds)) {
      for (const id of stepIds) {
        if (typeof id === 'string') ids.add(id);
      }
    }
    const singleId = prov.step_id;
    if (typeof singleId === 'string') ids.add(singleId);
  }
  return ids;
}

export function RecentDebriefs({ interestId, playbookId }: RecentDebriefsProps) {
  const { data: debriefs = [] } = usePlaybookRecentDebriefs(interestId);
  const { data: suggestions = [] } = usePlaybookSuggestions(playbookId);

  const citedStepIds = useMemo(
    () => extractCitedStepIds(suggestions),
    [suggestions],
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={16} color={IOS_COLORS.systemTeal} />
        <Text style={styles.title}>Recent debriefs</Text>
      </View>
      {debriefs.length === 0 ? (
        <Text style={styles.empty}>
          When you write a reflection on a step, it shows up here and feeds the
          AI suggestions queue.
        </Text>
      ) : (
        <View style={styles.list}>
          {debriefs.map((d) => {
            const wasRead = citedStepIds.has(d.id);
            return (
              <Pressable
                key={d.id}
                onPress={() => router.push(`/step/${d.id}` as any)}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {d.title ?? 'Untitled step'}
                  </Text>
                  <Text style={styles.itemMeta}>{relativeDate(d.step_date ?? d.created_at)}</Text>
                </View>
                {wasRead ? (
                  <View style={styles.tag}>
                    <Ionicons name="sparkles" size={10} color={IOS_COLORS.systemPurple} />
                    <Text style={styles.tagText}>AI read this</Text>
                  </View>
                ) : null}
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={IOS_COLORS.tertiaryLabel}
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 14,
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  empty: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  list: {
    gap: IOS_SPACING.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    padding: IOS_SPACING.md,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  itemPressed: {
    opacity: 0.6,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  itemMeta: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(175, 82, 222, 0.12)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: IOS_COLORS.systemPurple,
  },
});
