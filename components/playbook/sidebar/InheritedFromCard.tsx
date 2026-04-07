/**
 * InheritedFromCard — lists baseline sources visible to this playbook:
 * the platform interest baseline plus any pathway baselines the user is
 * subscribed to. Concept counts come from `usePlaybookConcepts`, grouped
 * client-side by origin.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { usePlaybookConcepts } from '@/hooks/usePlaybook';
import type { PlaybookConceptRecord, ConceptOrigin } from '@/types/playbook';

interface InheritedFromCardProps {
  playbookId: string | undefined;
  interestId: string | undefined;
  interestName: string;
}

interface BaselineGroup {
  key: string;
  label: string;
  origin: ConceptOrigin;
  count: number;
}

function groupBaselines(
  concepts: PlaybookConceptRecord[],
  interestName: string,
): BaselineGroup[] {
  const byOrigin = new Map<string, BaselineGroup>();

  for (const concept of concepts) {
    if (concept.origin !== 'platform_baseline' && concept.origin !== 'pathway_baseline') {
      continue;
    }
    const key = concept.origin === 'platform_baseline'
      ? 'platform'
      : `pathway:${concept.pathway_id ?? 'unknown'}`;
    const existing = byOrigin.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byOrigin.set(key, {
        key,
        origin: concept.origin,
        label:
          concept.origin === 'platform_baseline'
            ? `${interestName} baseline`
            : 'Pathway baseline',
        count: 1,
      });
    }
  }

  return Array.from(byOrigin.values());
}

export function InheritedFromCard({
  playbookId,
  interestId,
  interestName,
}: InheritedFromCardProps) {
  const { data: concepts = [] } = usePlaybookConcepts(playbookId, interestId);
  const baselines = useMemo(
    () => groupBaselines(concepts, interestName),
    [concepts, interestName],
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="git-branch-outline" size={16} color={IOS_COLORS.systemIndigo} />
        <Text style={styles.title}>Inherited from</Text>
      </View>
      {baselines.length === 0 ? (
        <Text style={styles.empty}>
          No baselines yet. When platform interests and pathways publish
          concepts, they'll show up here with counts.
        </Text>
      ) : (
        <View style={styles.list}>
          {baselines.map((b) => (
            <View key={b.key} style={styles.item}>
              <Text style={styles.itemTitle}>{b.label}</Text>
              <Text style={styles.itemMeta}>
                {b.count} concept{b.count === 1 ? '' : 's'}
              </Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.footnote}>
        When upstream updates, you'll see "pull latest" on affected concepts.
        Your edits are preserved.
      </Text>
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
    fontSize: 15,
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
    padding: IOS_SPACING.sm,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  itemMeta: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  footnote: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
