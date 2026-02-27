/**
 * Connect Tab — People + Forums
 *
 * Two top-level segments:
 * - People (default): Discover peers, manage follows, view activity posts
 * - Forums: Community feed, browse and join communities
 *
 * Follow/join state is lifted here so it survives tab switches.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';

import { FollowContent } from '@/components/connect/FollowContent';
import { DiscussContent } from '@/components/connect/DiscussContent';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

type ConnectSegment = 'follow' | 'discuss';

const CONNECT_SEGMENTS = [
  { value: 'follow' as const, label: 'People' },
  { value: 'discuss' as const, label: 'Forums' },
];

const STORAGE_KEY = 'regattaflow_connect_segment';
const FOLLOWED_IDS_KEY = 'regattaflow_connect_followed_ids';
const JOINED_IDS_KEY = 'regattaflow_connect_joined_ids';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ConnectTab() {
  const params = useLocalSearchParams<{ segment?: string }>();
  const insets = useSafeAreaInsets();
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll } = useScrollToolbarHide();
  const [activeSegment, setActiveSegment] = useState<ConnectSegment>('follow');

  // Shared follow/join state (lifted so it survives People↔Forums tab switches)
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const toggleFollow = useCallback((id: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Persist
      AsyncStorage.setItem(FOLLOWED_IDS_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, []);

  const toggleJoin = useCallback((id: string) => {
    setJoinedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Persist
      AsyncStorage.setItem(JOINED_IDS_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, []);

  const routeSegment = params.segment === 'discuss' ? 'discuss' : params.segment === 'follow' ? 'follow' : null;

  // Load persisted state on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'follow' || stored === 'discuss') {
        setActiveSegment(stored);
      }
    }).catch(() => {});

    AsyncStorage.getItem(FOLLOWED_IDS_KEY).then((stored) => {
      if (stored) {
        try { setFollowedIds(new Set(JSON.parse(stored))); } catch {}
      }
    }).catch(() => {});

    AsyncStorage.getItem(JOINED_IDS_KEY).then((stored) => {
      if (stored) {
        try { setJoinedIds(new Set(JSON.parse(stored))); } catch {}
      }
    }).catch(() => {});
  }, []);

  // Allow deep links / bridge redirects to force a starting segment.
  useEffect(() => {
    if (routeSegment) {
      setActiveSegment(routeSegment);
      AsyncStorage.setItem(STORAGE_KEY, routeSegment).catch(() => {});
    }
  }, [routeSegment]);

  // Save segment on change
  const handleSegmentChange = (segment: ConnectSegment) => {
    setActiveSegment(segment);
    AsyncStorage.setItem(STORAGE_KEY, segment).catch(() => {});
  };

  return (
    <View style={styles.container}>
      {/* Fixed status bar background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Content */}
      {activeSegment === 'follow' ? (
        <FollowContent
          toolbarOffset={toolbarHeight}
          onScroll={handleScroll}
          onGoToDiscuss={() => handleSegmentChange('discuss')}
          followedIds={followedIds}
          onToggleFollow={toggleFollow}
        />
      ) : (
        <DiscussContent
          toolbarOffset={toolbarHeight}
          onScroll={handleScroll}
          joinedIds={joinedIds}
          onToggleJoin={toggleJoin}
        />
      )}

      {/* Toolbar */}
      <TabScreenToolbar
        title="Connect"
        topInset={insets.top}
        actions={[]}
        onMeasuredHeight={setToolbarHeight}
        hidden={toolbarHidden}
        backgroundColor="rgba(242, 242, 247, 0.94)"
      >
        <View style={styles.segmentContainer}>
          <IOSSegmentedControl
            segments={CONNECT_SEGMENTS}
            selectedValue={activeSegment}
            onValueChange={handleSegmentChange}
          />
        </View>
      </TabScreenToolbar>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: 'rgba(242, 242, 247, 0.94)',
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
});
