/**
 * FromOtherPlaybooks — renders pending `cross_interest_idea` suggestions that
 * target this step. Each card shows the AI's rationale for why an item from
 * another Playbook might be relevant, with Adopt (accept → writes a
 * step_playbook_links row) and Dismiss (reject) actions.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import {
  useCrossInterestSuggestionsForStep,
  useAcceptSuggestion,
  useRejectSuggestion,
} from '@/hooks/usePlaybook';
import type { PlaybookSuggestionRecord } from '@/types/playbook';

interface Props {
  stepId: string;
}

export function FromOtherPlaybooks({ stepId }: Props) {
  const { data: suggestions = [], isLoading } = useCrossInterestSuggestionsForStep(stepId);
  const accept = useAcceptSuggestion();
  const reject = useRejectSuggestion();

  if (isLoading || suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={14} color={IOS_COLORS.systemPurple} />
        <Text style={styles.headerText}>From your other Playbooks</Text>
      </View>
      {suggestions.map((s) => {
        const payload = (s.payload ?? {}) as {
          rationale?: string;
          item_type?: string;
          item_id?: string;
        };
        const busy =
          (accept.isPending && accept.variables?.suggestion.id === s.id) ||
          (reject.isPending && reject.variables?.suggestionId === s.id);
        return (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {payload.item_type ?? 'item'}
                </Text>
              </View>
            </View>
            {payload.rationale ? (
              <Text style={styles.rationale}>{payload.rationale}</Text>
            ) : null}
            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, styles.btnAdopt]}
                disabled={busy}
                onPress={() => handleAccept(accept, s)}
              >
                {busy && accept.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={14} color="#fff" />
                    <Text style={styles.btnAdoptText}>Adopt</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={styles.btnDismiss}
                disabled={busy}
                onPress={() => handleReject(reject, s)}
              >
                <Text style={styles.btnDismissText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function handleAccept(
  accept: ReturnType<typeof useAcceptSuggestion>,
  suggestion: PlaybookSuggestionRecord,
) {
  accept.mutate({ suggestion });
}

function handleReject(
  reject: ReturnType<typeof useRejectSuggestion>,
  suggestion: PlaybookSuggestionRecord,
) {
  reject.mutate({
    suggestionId: suggestion.id,
    playbookId: suggestion.playbook_id,
  });
}

const styles = StyleSheet.create({
  container: {
    marginTop: IOS_SPACING.md,
    gap: IOS_SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: IOS_COLORS.systemPurple,
  },
  card: {
    backgroundColor: 'rgba(175, 82, 222, 0.06)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.systemPurple,
    padding: IOS_SPACING.md,
    gap: IOS_SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(175, 82, 222, 0.15)',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: IOS_COLORS.systemPurple,
  },
  rationale: {
    fontSize: 13,
    lineHeight: 19,
    color: IOS_COLORS.label,
  },
  actions: {
    flexDirection: 'row',
    gap: IOS_SPACING.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnAdopt: {
    backgroundColor: IOS_COLORS.systemPurple,
  },
  btnAdoptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  btnDismiss: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 6,
  },
  btnDismissText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
});
