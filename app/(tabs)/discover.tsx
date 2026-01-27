/**
 * Discover Tab Screen
 *
 * Find and follow fellow sailors. Discover:
 * - Class experts (top performers in your boat class)
 * - Fleet activity (fleet mates preparing for races)
 * - Sailors in the same upcoming races
 *
 * Feature flag USE_GROUPED_DISCOVER_LIST toggles between:
 * - Grouped vertical list (new) — scannable sections
 * - TikTok-style vertical pager (legacy) — full-screen cards
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiscoverScreen } from '@/components/discover';
import { SailorsGroupedList } from '@/components/discover/SailorsGroupedList';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import GlobalSearchOverlay from '@/components/search/GlobalSearchOverlay';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

export default function DiscoverTab() {
  const insets = useSafeAreaInsets();
  const [searchVisible, setSearchVisible] = useState(false);

  const handleSearchOpen = useCallback(() => {
    setSearchVisible(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchVisible(false);
  }, []);

  return (
    <View style={styles.container}>
      <TabScreenToolbar
        title="Sailors"
        topInset={insets.top}
        actions={[
          {
            icon: 'search-outline',
            label: 'Search sailors',
            onPress: handleSearchOpen,
          },
        ]}
      />
      {FEATURE_FLAGS.USE_GROUPED_DISCOVER_LIST ? (
        <SailorsGroupedList />
      ) : (
        <DiscoverScreen />
      )}
      <GlobalSearchOverlay
        visible={searchVisible}
        onClose={handleSearchClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
});
