/**
 * Connect Tab — Merged Follow + Discuss
 *
 * Two top-level segments:
 * - Follow (default): Discover sailors, manage follows, view activity posts
 * - Discuss: Community feed, browse and join communities
 *
 * Follows the Learn tab pattern with IOSSegmentedControl + conditional render.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  { value: 'follow' as const, label: 'Follow' },
  { value: 'discuss' as const, label: 'Discuss' },
];

const STORAGE_KEY = 'regattaflow_connect_segment';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ConnectTab() {
  const insets = useSafeAreaInsets();
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll } = useScrollToolbarHide();
  const [activeSegment, setActiveSegment] = useState<ConnectSegment>('follow');

  // Load persisted segment on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'follow' || stored === 'discuss') {
        setActiveSegment(stored);
      }
    }).catch(() => {});
  }, []);

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
        />
      ) : (
        <DiscussContent
          toolbarOffset={toolbarHeight}
          onScroll={handleScroll}
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
