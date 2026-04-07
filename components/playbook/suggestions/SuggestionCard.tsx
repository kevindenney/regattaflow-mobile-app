/**
 * SuggestionCard — one pending suggestion with Accept/Edit/Reject actions.
 *
 * Payload shape depends on `kind` — see PlaybookSuggestionService for the
 * contract of each kind. This card shows a human-readable preview and
 * provenance chips, then routes the action to the mutation hooks.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import {
  useAcceptSuggestion,
  useEditSuggestion,
  useRejectSuggestion,
} from '@/hooks/usePlaybook';
import type { PlaybookSuggestionRecord, SuggestionKind } from '@/types/playbook';

interface SuggestionCardProps {
  suggestion: PlaybookSuggestionRecord;
}

function kindLabel(kind: SuggestionKind): string {
  switch (kind) {
    case 'concept_update':
      return 'Concept update';
    case 'concept_create':
      return 'New concept';
    case 'pattern_detected':
      return 'Pattern detected';
    case 'weekly_review':
      return 'Weekly review';
    case 'focus_suggestion':
      return 'Focus suggestion';
    case 'cross_interest_idea':
      return 'Cross-interest idea';
  }
}

function getTitle(s: PlaybookSuggestionRecord): string {
  const p = s.payload as Record<string, unknown>;
  return (
    (p.title as string) ||
    (p.summary_md as string)?.slice(0, 80) ||
    (p.focus_md as string)?.slice(0, 80) ||
    kindLabel(s.kind)
  );
}

function getBody(s: PlaybookSuggestionRecord): string | null {
  const p = s.payload as Record<string, unknown>;
  return (
    (p.body_md as string) ||
    (p.summary_md as string) ||
    (p.focus_md as string) ||
    null
  );
}

function provenanceChips(s: PlaybookSuggestionRecord): string[] {
  const prov = s.provenance as Record<string, unknown>;
  const chips: string[] = [];
  const stepIds = (prov?.source_step_ids as string[]) ?? [];
  const resourceIds = (prov?.source_resource_ids as string[]) ?? [];
  const conceptIds = (prov?.source_concept_ids as string[]) ?? [];
  const inboxIds = (prov?.source_inbox_item_ids as string[]) ?? [];
  if (stepIds.length) chips.push(`${stepIds.length} step${stepIds.length === 1 ? '' : 's'}`);
  if (resourceIds.length) chips.push(`${resourceIds.length} resource${resourceIds.length === 1 ? '' : 's'}`);
  if (conceptIds.length) chips.push(`${conceptIds.length} concept${conceptIds.length === 1 ? '' : 's'}`);
  if (inboxIds.length) chips.push(`${inboxIds.length} inbox item${inboxIds.length === 1 ? '' : 's'}`);
  return chips;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(
    (suggestion.payload.title as string) ?? '',
  );
  const [draftBody, setDraftBody] = useState(getBody(suggestion) ?? '');

  const accept = useAcceptSuggestion();
  const edit = useEditSuggestion();
  const reject = useRejectSuggestion();

  const busy = accept.isPending || edit.isPending || reject.isPending;
  const chips = provenanceChips(suggestion);
  const body = getBody(suggestion);

  const handleAccept = () => accept.mutate({ suggestion });
  const handleReject = () =>
    reject.mutate({
      suggestionId: suggestion.id,
      playbookId: suggestion.playbook_id,
    });
  const handleSaveEdit = () => {
    const nextPayload: Record<string, unknown> = { ...suggestion.payload };
    if (draftTitle) nextPayload.title = draftTitle;
    if (draftBody) {
      // Choose the body field that originally existed.
      const p = suggestion.payload as Record<string, unknown>;
      if ('body_md' in p) nextPayload.body_md = draftBody;
      else if ('summary_md' in p) nextPayload.summary_md = draftBody;
      else if ('focus_md' in p) nextPayload.focus_md = draftBody;
      else nextPayload.body_md = draftBody;
    }
    edit.mutate(
      {
        suggestionId: suggestion.id,
        payload: nextPayload,
        playbookId: suggestion.playbook_id,
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.kind}>{kindLabel(suggestion.kind)}</Text>
        {chips.length > 0 && (
          <View style={styles.chips}>
            {chips.map((c) => (
              <View key={c} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {editing ? (
        <>
          <TextInput
            value={draftTitle}
            onChangeText={setDraftTitle}
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
          />
          <TextInput
            value={draftBody}
            onChangeText={setDraftBody}
            style={styles.bodyInput}
            placeholder="Body"
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            multiline
          />
        </>
      ) : (
        <>
          <Text style={styles.title}>{getTitle(suggestion)}</Text>
          {body && (
            <Text style={styles.body} numberOfLines={6}>
              {body}
            </Text>
          )}
        </>
      )}

      <View style={styles.actions}>
        {editing ? (
          <>
            <Pressable
              onPress={() => setEditing(false)}
              style={[styles.btn, styles.btnGhost]}
              disabled={busy}
            >
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveEdit}
              style={[styles.btn, styles.btnPrimary]}
              disabled={busy}
            >
              <Text style={styles.btnPrimaryText}>Save edit</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={handleReject}
              style={[styles.btn, styles.btnGhost]}
              disabled={busy}
            >
              <Ionicons name="close" size={14} color={IOS_COLORS.secondaryLabel} />
              <Text style={styles.btnGhostText}>Reject</Text>
            </Pressable>
            <Pressable
              onPress={() => setEditing(true)}
              style={[styles.btn, styles.btnGhost]}
              disabled={busy}
            >
              <Ionicons name="create-outline" size={14} color={IOS_COLORS.secondaryLabel} />
              <Text style={styles.btnGhostText}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={handleAccept}
              style={[styles.btn, styles.btnPrimary]}
              disabled={busy}
            >
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={styles.btnPrimaryText}>Accept</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 14,
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(175, 82, 222, 0.18)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: IOS_SPACING.sm,
  },
  kind: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: IOS_COLORS.systemPurple,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  chipText: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  body: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  titleInput: {
    fontSize: 15,
    fontWeight: '700',
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderRadius: 8,
    padding: IOS_SPACING.sm,
  },
  bodyInput: {
    fontSize: 13,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderRadius: 8,
    padding: IOS_SPACING.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: IOS_SPACING.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnGhost: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  btnGhostText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  btnPrimary: {
    backgroundColor: IOS_COLORS.systemPurple,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
