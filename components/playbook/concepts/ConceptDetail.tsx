/**
 * ConceptDetail — read view for a single concept with Edit (personal/forked),
 * Fork (inherited baselines), and Pull-latest (forked rows with upstream drift).
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { useInterest } from '@/providers/InterestProvider';
import {
  usePlaybook,
  usePlaybookConceptBySlug,
  useForkConcept,
  usePullLatestConcept,
  useDeletePlaybookConcept,
} from '@/hooks/usePlaybook';
import { getConceptById } from '@/services/PlaybookService';
import { ConceptEditor } from './ConceptEditor';
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';
import type { PlaybookConceptRecord, ConceptOrigin } from '@/types/playbook';

interface ConceptDetailProps {
  slug: string;
}

const ORIGIN_LABEL: Record<ConceptOrigin, string> = {
  platform_baseline: 'Platform baseline',
  pathway_baseline: 'Pathway baseline',
  personal: 'Personal',
  forked: 'Forked from baseline',
};

export function ConceptDetail({ slug }: ConceptDetailProps) {
  const { currentInterest } = useInterest();
  const interestId = currentInterest?.id;
  const { data: playbook } = usePlaybook(interestId);
  const {
    data: concept,
    isLoading,
  } = usePlaybookConceptBySlug(playbook?.id, interestId, slug);

  const [editing, setEditing] = useState(false);
  const [upstream, setUpstream] = useState<PlaybookConceptRecord | null>(null);

  const forkMutation = useForkConcept();
  const pullMutation = usePullLatestConcept();
  const deleteMutation = useDeletePlaybookConcept();

  useEffect(() => {
    let cancelled = false;
    if (concept?.source_concept_id) {
      getConceptById(concept.source_concept_id)
        .then((src) => {
          if (!cancelled) setUpstream(src);
        })
        .catch(() => undefined);
    } else {
      setUpstream(null);
    }
    return () => {
      cancelled = true;
    };
  }, [concept?.source_concept_id]);

  if (isLoading) {
    return (
      <View style={styles.full}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!concept || !playbook) {
    return (
      <View style={styles.full}>
        <Ionicons name="search-outline" size={36} color={IOS_COLORS.tertiaryLabel} />
        <Text style={styles.title}>Concept not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isBaseline =
    concept.origin === 'platform_baseline' || concept.origin === 'pathway_baseline';
  const canEdit = !isBaseline;
  const canFork = isBaseline;
  const canDelete = concept.origin === 'personal' || concept.origin === 'forked';
  const hasUpstreamUpdate =
    concept.origin === 'forked' &&
    upstream !== null &&
    new Date(upstream.updated_at) > new Date(concept.updated_at);

  const handleFork = async () => {
    try {
      const forked = await forkMutation.mutateAsync({
        playbookId: playbook.id,
        sourceConceptId: concept.id,
      });
      showAlert('Forked', 'You can now edit your personal copy.');
      router.replace(`/playbook/concepts/${forked.slug}` as any);
    } catch (err) {
      showAlert('Fork failed', (err as Error).message);
    }
  };

  const handlePullLatest = () => {
    showConfirm(
      'Pull latest?',
      'This overwrites the body of your forked concept with the upstream version. Your title stays yours. Continue?',
      async () => {
        try {
          await pullMutation.mutateAsync({
            conceptId: concept.id,
            playbookId: playbook.id,
          });
        } catch (err) {
          showAlert('Pull failed', (err as Error).message);
        }
      },
    );
  };

  const handleDelete = () => {
    showConfirm(
      'Delete concept?',
      'This removes the concept from your Playbook. Forked concepts can be re-forked from the baseline later.',
      async () => {
        try {
          await deleteMutation.mutateAsync({
            conceptId: concept.id,
            playbookId: playbook.id,
          });
          router.back();
        } catch (err) {
          showAlert('Delete failed', (err as Error).message);
        }
      },
      { destructive: true },
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={16} color={IOS_COLORS.systemBlue} />
        <Text style={styles.backLinkText}>Concepts</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.origin}>{ORIGIN_LABEL[concept.origin]}</Text>
          <Text style={styles.title}>{concept.title}</Text>
        </View>
      </View>

      {hasUpstreamUpdate ? (
        <View style={styles.updateBanner}>
          <Ionicons name="cloud-download-outline" size={16} color={IOS_COLORS.systemOrange} />
          <Text style={styles.updateBannerText}>
            Upstream baseline has new content since your fork.
          </Text>
          <Pressable onPress={handlePullLatest} style={styles.bannerAction}>
            <Text style={styles.bannerActionText}>Pull latest</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        {canEdit ? (
          <Pressable
            onPress={() => setEditing(true)}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Ionicons name="create-outline" size={16} color={IOS_COLORS.systemBlue} />
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
        ) : null}
        {canFork ? (
          <Pressable
            onPress={handleFork}
            disabled={forkMutation.isPending}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Ionicons name="git-branch-outline" size={16} color={IOS_COLORS.systemBlue} />
            <Text style={styles.actionText}>
              {forkMutation.isPending ? 'Forking…' : 'Fork'}
            </Text>
          </Pressable>
        ) : null}
        {canDelete ? (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Ionicons name="trash-outline" size={16} color={IOS_COLORS.systemRed} />
            <Text style={[styles.actionText, { color: IOS_COLORS.systemRed }]}>
              Delete
            </Text>
          </Pressable>
        ) : null}
      </View>

      {concept.body_md ? (
        <View style={styles.bodyCard}>
          <Text style={styles.body}>{concept.body_md}</Text>
        </View>
      ) : (
        <Text style={styles.empty}>No body yet.</Text>
      )}

      <Text style={styles.meta}>
        Updated {new Date(concept.updated_at).toLocaleString()}
      </Text>

      {editing ? (
        <ConceptEditor
          mode="edit"
          concept={concept}
          playbookId={playbook.id}
          onClose={() => setEditing(false)}
        />
      ) : null}
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
  full: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: IOS_SPACING.xl,
    gap: IOS_SPACING.md,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  origin: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: IOS_COLORS.systemIndigo,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: IOS_SPACING.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  pressed: {
    opacity: 0.6,
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    padding: IOS_SPACING.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
  },
  updateBannerText: {
    flex: 1,
    fontSize: 12,
    color: IOS_COLORS.label,
  },
  bannerAction: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.systemOrange,
  },
  bannerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  bodyCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 14,
    padding: IOS_SPACING.lg,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: IOS_COLORS.label,
  },
  empty: {
    fontSize: 13,
    fontStyle: 'italic',
    color: IOS_COLORS.tertiaryLabel,
  },
  meta: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
  },
  backButton: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.systemBlue,
  },
  backText: {
    color: '#fff',
    fontWeight: '700',
  },
});
