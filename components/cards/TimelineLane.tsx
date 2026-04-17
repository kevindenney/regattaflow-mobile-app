/**
 * TimelineLane — A single horizontal row in a swim-lane layout.
 *
 *   [ Label gutter ] [ Horizontal tile strip — positioned by ordinal index ]
 *
 * The lane's x-axis is **sequence**, not time. Tiles lay out at
 * `index * (tileWidth + tileSpacing)`, where `index` reflects the provided
 * order (caller sorts by `sort_order`). Dates are metadata shown on tiles
 * when present, not a positioning signal — most timeline steps are dateless,
 * so forcing a date axis was the wrong abstraction.
 *
 * Used in two contexts:
 *   - `me`        → a single lane for the user's own timeline.
 *   - `blueprint` → inside a BlueprintPanel, one row for the curriculum plus
 *                   one collapsed-by-default row per peer. All rows in the
 *                   same panel share a scrollOffsetX so they stay aligned.
 *   - `peer`      → as above, inside a BlueprintPanel.
 *
 * Scroll sync is *opt-in per panel*: pass a `scrollOffsetX` SharedValue to
 * group rows that should scroll together. Lanes across different panels use
 * different SharedValues and scroll independently — their x-axes are not
 * the same thing.
 */

import React, { useCallback, useMemo } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { MiniTile, MiniTileStatus } from './MiniTile';

export type LaneKind = 'me' | 'blueprint' | 'peer';

export interface TimelineLaneTile {
  id: string;
  title: string;
  /** Optional date badge for the tile (e.g. 'Mar 10', 'Due 3d'). */
  dateLabel?: string;
  status: MiniTileStatus;
  /** Optional action for this tile (e.g. adopt a blueprint step). */
  actionLabel?: string;
  actionIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onAction?: () => void;
  onPress?: () => void;
}

export interface TimelineLaneProps {
  laneKind: LaneKind;
  laneId: string;
  label: string;
  /** Avatar emoji OR the first-letter-initials fallback. */
  avatarEmoji?: string;
  progress?: { done: number; total: number };

  /** Tiles in display order — caller sorts by sort_order beforehand. */
  tiles: TimelineLaneTile[];

  /**
   * Optional shared scroll offset. When two or more lanes share the same
   * SharedValue, scrolling one drives the others. Omit for independent lanes.
   */
  scrollOffsetX?: SharedValue<number>;
  /** True if this lane is the scroll driver; followers render Animated.View instead of ScrollView. */
  isScrollDriver?: boolean;

  /** Gutter width on the left for the lane label/avatar. */
  gutterWidth?: number;

  /** Lane itself can be collapsed (peer lanes default to this). */
  laneCollapsed?: boolean;
  onToggleLane?: () => void;

  /** Tile dimensions. */
  tileHeight?: number;
  tileWidth?: number;
  tileSpacing?: number;

  /** Optional trailing header action (icon button on the right of the gutter). */
  onHeaderAction?: () => void;
  headerActionIcon?: React.ComponentProps<typeof Ionicons>['name'];

  testID?: string;
}

const DEFAULT_TILE_WIDTH = 140;
const DEFAULT_TILE_HEIGHT = 96;
const DEFAULT_TILE_SPACING = 8;

export function TimelineLane({
  laneKind,
  label,
  avatarEmoji,
  progress,
  tiles,
  scrollOffsetX,
  isScrollDriver = true,
  gutterWidth = 120,
  laneCollapsed = false,
  onToggleLane,
  tileHeight = DEFAULT_TILE_HEIGHT,
  tileWidth = DEFAULT_TILE_WIDTH,
  tileSpacing = DEFAULT_TILE_SPACING,
  onHeaderAction,
  headerActionIcon,
  testID,
}: TimelineLaneProps) {
  const stride = tileWidth + tileSpacing;
  const contentWidth = Math.max(stride, tiles.length * stride);

  // Position each tile at its ordinal index on the sequence axis.
  const positionedTiles = useMemo(
    () => tiles.map((tile, i) => ({ ...tile, left: i * stride })),
    [tiles, stride],
  );

  // Sync scroll offset → shared value. Plain onScroll (not useAnimatedScrollHandler)
  // so the same handler works on web where animated-scroll isn't bridged.
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (scrollOffsetX) {
        scrollOffsetX.value = e.nativeEvent.contentOffset.x;
      }
    },
    [scrollOffsetX],
  );

  // Follower lanes read the shared value → translate their content layer.
  const followStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollOffsetX ? -scrollOffsetX.value : 0 }],
  }));

  const renderHeader = () => {
    const initials = label
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <Pressable
        style={[styles.gutter, { width: gutterWidth }]}
        onPress={onToggleLane}
        disabled={!onToggleLane}
      >
        <View style={styles.gutterRow}>
          {laneKind !== 'me' && onToggleLane ? (
            <Ionicons
              name={laneCollapsed ? 'chevron-forward' : 'chevron-down'}
              size={12}
              color="#8E8E93"
              style={styles.chevron}
            />
          ) : null}
          {laneKind !== 'me' ? (
            <View
              style={[
                styles.avatar,
                laneKind === 'blueprint' && styles.avatarBlueprint,
              ]}
            >
              {laneKind === 'blueprint' ? (
                <Ionicons name="library-outline" size={12} color="#FFFFFF" />
              ) : (
                <Text style={styles.avatarText}>{avatarEmoji || initials}</Text>
              )}
            </View>
          ) : null}
          <Text
            style={[
              styles.label,
              laneKind === 'blueprint' && styles.labelBlueprint,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
        </View>
        {progress ? (
          <Text style={styles.progress}>
            {progress.done}/{progress.total}
          </Text>
        ) : null}
        {onHeaderAction && headerActionIcon ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onHeaderAction();
            }}
            hitSlop={6}
            style={styles.headerAction}
          >
            <Ionicons name={headerActionIcon} size={14} color="#8E8E93" />
          </Pressable>
        ) : null}
      </Pressable>
    );
  };

  const laneContainerStyle = [
    styles.lane,
    laneKind === 'blueprint' && styles.laneBlueprint,
  ];

  if (laneCollapsed) {
    // Header-only row: reveals the tile strip when toggled.
    return (
      <View style={laneContainerStyle} testID={testID}>
        {renderHeader()}
      </View>
    );
  }

  // "me" lane uses taller tiles; peer/blueprint use compact MiniTile.
  const laneHeight = laneKind === 'me' ? Math.max(tileHeight, 120) : tileHeight;

  const tileNodes = positionedTiles.map((tile) => (
    <View
      key={tile.id}
      style={[
        styles.tileWrapper,
        { left: tile.left, width: tileWidth, height: laneHeight },
      ]}
    >
      <MiniTile
        id={tile.id}
        title={tile.title}
        status={tile.status}
        dateLabel={tile.dateLabel}
        onPress={tile.onPress}
        actionLabel={tile.actionLabel}
        actionIcon={tile.actionIcon as any}
        onAction={tile.onAction}
        width={tileWidth}
      />
    </View>
  ));

  return (
    <View style={[laneContainerStyle, { minHeight: laneHeight + 8 }]} testID={testID}>
      {renderHeader()}
      <View style={styles.viewport}>
        {isScrollDriver ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={scrollOffsetX ? handleScroll : undefined}
            scrollEventThrottle={16}
            style={styles.scroll}
            contentContainerStyle={{ width: contentWidth, height: laneHeight }}
          >
            {tileNodes}
          </ScrollView>
        ) : (
          // Follower lane — no scroll of its own, translated by the shared value.
          <Animated.View
            style={[
              styles.scroll,
              { width: contentWidth, height: laneHeight },
              followStyle,
            ]}
          >
            {tileNodes}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lane: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E4E1',
  },
  // Curriculum/blueprint row — tinted background + thicker bottom border
  // to visually separate it from the peer rows that follow it in the panel.
  laneBlueprint: {
    backgroundColor: '#F5F3FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD6FE',
  },
  gutter: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    gap: 4,
  },
  gutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevron: {
    width: 12,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Blueprint/curriculum avatar — purple fill with a book icon inside,
  // reading visually as "this is the master plan" vs a person's initials.
  avatarBlueprint: {
    backgroundColor: '#7C3AED',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3C3C43',
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  labelBlueprint: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4C1D95',
  },
  progress: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginLeft: 18,
  },
  headerAction: {
    position: 'absolute',
    right: 4,
    top: 6,
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  tileWrapper: {
    position: 'absolute',
    top: 4,
  },
});
