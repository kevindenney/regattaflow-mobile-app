/**
 * Community Tab Screen (formerly "Sailors" / "Discover")
 *
 * Three segments via iOS segmented control:
 * - Sailors: Find and follow fellow sailors
 * - Clubs: User's club memberships
 * - Fleets: User's fleet memberships
 *
 * Feature flag USE_GROUPED_DISCOVER_LIST toggles between:
 * - Grouped vertical list (new) — scannable sections
 * - TikTok-style vertical pager (legacy) — full-screen cards
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiscoverScreen } from '@/components/discover';
import { SailorsGroupedList } from '@/components/discover/SailorsGroupedList';
import { ClubsContent } from '@/components/discover/ClubsContent';
import { FleetsContent } from '@/components/discover/FleetsContent';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import { useGlobalSearch } from '@/providers/GlobalSearchProvider';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

type CommunitySegment = 'sailors' | 'clubs' | 'fleets';

const SEGMENTS = [
  { value: 'sailors' as const, label: 'Sailors' },
  { value: 'clubs' as const, label: 'Clubs' },
  { value: 'fleets' as const, label: 'Fleets' },
];

export default function DiscoverTab() {
  const insets = useSafeAreaInsets();
  const { openGlobalSearch } = useGlobalSearch();
  const [activeSegment, setActiveSegment] = useState<CommunitySegment>('sailors');

  return (
    <View style={styles.container}>
      <TabScreenToolbar
        title="Community"
        topInset={insets.top}
        onGlobalSearch={openGlobalSearch}
      >
        <View style={styles.segmentContainer}>
          <IOSSegmentedControl<CommunitySegment>
            segments={SEGMENTS}
            selectedValue={activeSegment}
            onValueChange={setActiveSegment}
          />
        </View>
      </TabScreenToolbar>

      {activeSegment === 'sailors' && (
        FEATURE_FLAGS.USE_GROUPED_DISCOVER_LIST ? (
          <SailorsGroupedList />
        ) : (
          <DiscoverScreen />
        )
      )}
      {activeSegment === 'clubs' && <ClubsContent />}
      {activeSegment === 'fleets' && <FleetsContent />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
});
