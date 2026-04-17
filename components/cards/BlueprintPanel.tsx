/**
 * BlueprintPanel — A single subscribed blueprint rendered as a swim-lane group.
 *
 *   ┌─────────── Blueprint header (title • progress • menu) ───────────┐
 *   │  [ curriculum row — MiniTiles at curator's sort_order ]           │
 *   │  [ peer row 1 — same axis, aligned under curriculum tiles ]       │
 *   │  [ peer row 2 — collapsed by default ]                            │
 *   └────────────────────────────────────────────────────────────────────┘
 *
 * All rows inside a single panel share one `scrollOffsetX` so they scroll
 * together — they share the blueprint's curriculum axis. Different panels
 * own different SharedValues; they do NOT scroll together because their
 * x-axes are different blueprints.
 *
 * The panel is purely presentational — parents fetch blueprint steps, peer
 * timelines, and my adopted-step set, and pass them in.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { TimelineLane, TimelineLaneTile } from './TimelineLane';
import type { TimelineStepRecord } from '@/types/timeline-steps';
import type { PeerTimeline } from '@/types/blueprint';

export interface BlueprintPanelProps {
  blueprintId: string;
  blueprintTitle: string;
  authorName?: string | null;

  /** Curator's curriculum steps (sorted by sort_order). */
  curriculumSteps: TimelineStepRecord[];

  /** My adopted timeline steps — used to determine which curriculum steps I've already pulled in. */
  myAdoptedSteps?: TimelineStepRecord[] | null;

  /** Peer subscribers for this blueprint. */
  peers?: PeerTimeline[];

  onAdoptStep?: (curriculumStepId: string) => void;
  onOpenPeer?: (peerId: string) => void;
  onOpenBlueprint?: () => void;

  tileWidth?: number;
  tileSpacing?: number;
  gutterWidth?: number;
}

/** Map a TimelineStepRecord status → MiniTile visual status. */
function mapStepStatus(status: TimelineStepRecord['status']): TimelineLaneTile['status'] {
  if (status === 'completed') return 'done';
  if (status === 'in_progress') return 'now';
  return 'upcoming';
}

/** Format an optional date string (ISO) as a short label for the tile badge. */
function formatDateLabel(step: Pick<TimelineStepRecord, 'starts_at' | 'due_at' | 'completed_at'>): string | undefined {
  const iso = step.completed_at ?? step.starts_at ?? step.due_at;
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (step.completed_at) return `Done ${label}`;
  if (step.due_at && !step.starts_at) return `Due ${label}`;
  return label;
}

export function BlueprintPanel({
  blueprintId,
  blueprintTitle,
  curriculumSteps,
  myAdoptedSteps,
  peers = [],
  onAdoptStep,
  onOpenPeer,
  onOpenBlueprint,
  tileWidth,
  tileSpacing,
  gutterWidth,
}: BlueprintPanelProps) {
  // Panel-local shared scroll offset — curriculum + peer rows stay in sync.
  const scrollOffsetX = useSharedValue(0);

  // Peers collapsed by default — without this, every subscribed blueprint
  // floods the screen with N follower rows on first load. User taps
  // "Following · N" to expand.
  const [peersExpanded, setPeersExpanded] = useState(false);

  // Set of curriculum step IDs the user has already adopted.
  const adoptedCurriculumIds = useMemo(() => {
    const set = new Set<string>();
    for (const step of myAdoptedSteps ?? []) {
      if (step.source_blueprint_id === blueprintId && step.source_id) {
        set.add(step.source_id);
      }
    }
    return set;
  }, [myAdoptedSteps, blueprintId]);

  // Curriculum row tiles — sorted by sort_order (caller may already sort).
  const curriculumTiles: TimelineLaneTile[] = useMemo(() => {
    const sorted = [...curriculumSteps].sort((a, b) => a.sort_order - b.sort_order);
    return sorted.map((step) => {
      const isAdopted = adoptedCurriculumIds.has(step.id);
      return {
        id: step.id,
        title: step.title,
        status: isAdopted ? 'done' : 'upcoming',
        dateLabel: formatDateLabel(step),
        actionLabel: isAdopted ? undefined : 'Adopt',
        actionIcon: isAdopted ? undefined : 'add-circle-outline',
        onAction: isAdopted || !onAdoptStep ? undefined : () => onAdoptStep(step.id),
      };
    });
  }, [curriculumSteps, adoptedCurriculumIds, onAdoptStep]);

  const totalCurriculumSteps = curriculumTiles.length;
  const myDoneCount = adoptedCurriculumIds.size;

  // For each peer, map their steps by a stable key so we can align them
  // to the curriculum x-axis. PeerTimelineStep.id is a peer's timeline-step id,
  // not a curriculum step id, so we fall back to title-matching — the backend
  // serializes peers' adopted steps preserving title.
  // (If a stronger linkage becomes available — e.g. source_id — prefer that.)
  const peerLanes = useMemo(() => {
    return peers.map((peer) => {
      const peerStepByTitle = new Map<string, PeerTimeline['steps'][number]>();
      for (const s of peer.steps) peerStepByTitle.set(s.title, s);

      const tiles: TimelineLaneTile[] = curriculumTiles.map((currTile, i) => {
        const curr = curriculumSteps[i];
        const peerStep = peerStepByTitle.get(curr.title);
        if (!peerStep) {
          return {
            id: `${peer.subscriber_id}:${curr.id}`,
            title: curr.title,
            status: 'upcoming' as const,
          };
        }
        const status: TimelineLaneTile['status'] =
          peerStep.status === 'completed'
            ? 'done'
            : peerStep.status === 'in_progress'
              ? 'now'
              : 'upcoming';
        return {
          id: `${peer.subscriber_id}:${curr.id}`,
          title: curr.title,
          status,
          dateLabel: peerStep.completed_at
            ? `Done ${new Date(peerStep.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
            : undefined,
        };
      });

      return { peer, tiles };
    });
  }, [peers, curriculumTiles, curriculumSteps]);

  return (
    <View style={styles.panel}>
      {/* Curriculum row — drives scroll. */}
      <TimelineLane
        laneKind="blueprint"
        laneId={blueprintId}
        label={blueprintTitle}
        progress={{ done: myDoneCount, total: totalCurriculumSteps }}
        tiles={curriculumTiles}
        scrollOffsetX={scrollOffsetX}
        isScrollDriver
        tileWidth={tileWidth}
        tileSpacing={tileSpacing}
        gutterWidth={gutterWidth}
        onHeaderAction={onOpenBlueprint}
        headerActionIcon={onOpenBlueprint ? 'open-outline' : undefined}
      />
      {/* "Following" section header — tappable toggle for the peer rows
          below. Collapsed by default so a single panel doesn't flood the
          screen when a user follows many peers. */}
      {peerLanes.length > 0 ? (
        <Pressable
          style={styles.followingHeader}
          onPress={() => setPeersExpanded((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={`${peersExpanded ? 'Collapse' : 'Expand'} ${peerLanes.length} follower${peerLanes.length === 1 ? '' : 's'}`}
        >
          <Ionicons
            name={peersExpanded ? 'chevron-down' : 'chevron-forward'}
            size={12}
            color="#8E8E93"
            style={styles.followingChevron}
          />
          <Text style={styles.followingLabel}>
            Following · {peerLanes.length}
          </Text>
        </Pressable>
      ) : null}
      {/* Peer rows — follow curriculum scroll. Only rendered when expanded. */}
      {peersExpanded
        ? peerLanes.map(({ peer, tiles }) => (
            <TimelineLane
              key={peer.subscriber_id}
              laneKind="peer"
              laneId={peer.subscriber_id}
              label={peer.subscriber_name ?? 'Peer'}
              avatarEmoji={peer.subscriber_avatar_emoji ?? undefined}
              progress={{ done: peer.completed_count, total: peer.total_count }}
              tiles={tiles}
              scrollOffsetX={scrollOffsetX}
              isScrollDriver={false}
              tileWidth={tileWidth}
              tileSpacing={tileSpacing}
              gutterWidth={gutterWidth}
              onHeaderAction={onOpenPeer ? () => onOpenPeer(peer.subscriber_id) : undefined}
              headerActionIcon={onOpenPeer ? 'person-circle-outline' : undefined}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E4E1',
    overflow: 'hidden',
  },
  followingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E4E1',
  },
  followingChevron: {
    width: 12,
  },
  followingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
