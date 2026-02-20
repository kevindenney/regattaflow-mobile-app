/**
 * FollowContent — Follow segment for the Connect tab
 *
 * Two sub-tabs:
 * - Following (default): SuggestedSailorsSection — discover and manage follows
 * - Posts: WatchFeed — race activity timeline from followed sailors
 *
 * Extracted from app/(tabs)/follow.tsx to be composed inside Connect tab.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

import { WatchFeed, DiscoveryFeed } from '@/components/follow';
import { useFollowActivityFeed } from '@/hooks/useFollowActivityFeed';
import { SuggestedSailorsSection } from '@/components/search/SuggestedSailorsSection';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';

import { useSailorSuggestions } from '@/hooks/useSailorSuggestions';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import { useAuth } from '@/providers/AuthProvider';

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

type FeedSubTab = 'posts' | 'following';

const FEED_SEGMENTS: { value: FeedSubTab; label: string }[] = [
  { value: 'posts', label: 'Posts' },
  { value: 'following', label: 'Following' },
];

/** Show search bar when follower count reaches this threshold */
const SEARCH_THRESHOLD = 20;

// =============================================================================
// PROPS
// =============================================================================

interface FollowContentProps {
  toolbarOffset: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Callback to switch to Discuss segment (replaces old router.push to community) */
  onGoToDiscuss?: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FollowContent({ toolbarOffset, onScroll, onGoToDiscuss: _onGoToDiscuss }: FollowContentProps) {
  const { isGuest } = useAuth();

  const [feedSubTab, setFeedSubTab] = useState<FeedSubTab>(isGuest ? 'following' : 'posts');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // Check if user follows anyone (for discovery vs personalized feed)
  const { hasFollowing } = useFollowActivityFeed();
  const showDiscoveryFeed = isGuest || !hasFollowing;

  // Use hook to get total count for threshold check (no search filter applied)
  const { suggestions } = useSailorSuggestions();
  const showSearch = suggestions.length >= SEARCH_THRESHOLD;

  useEffect(() => {
    if (isGuest) {
      setFeedSubTab((prev) => (prev === 'posts' ? 'following' : prev));
    }
  }, [isGuest]);

  // Clear search when switching tabs
  const handleSubTabChange = (tab: FeedSubTab) => {
    setFeedSubTab(tab);
    if (tab !== 'following') {
      setSearchQuery('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Segment control */}
      <View style={[styles.segmentContainer, { marginTop: toolbarOffset }]}>
        <IOSSegmentedControl<FeedSubTab>
          segments={FEED_SEGMENTS}
          selectedValue={feedSubTab}
          onValueChange={handleSubTabChange}
        />
      </View>

      {/* Content */}
      {feedSubTab === 'following' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {showSearch && (
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons
                  name="search"
                  size={16}
                  color={IOS_COLORS.secondaryLabel}
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder="Search sailors"
                  placeholderTextColor={IOS_COLORS.secondaryLabel}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  returnKeyType="search"
                />
              </View>
            </View>
          )}
          <SuggestedSailorsSection searchQuery={searchQuery} />
        </ScrollView>
      ) : (
        <View style={styles.watchFeedContainer}>
          {showDiscoveryFeed ? (
            <DiscoveryFeed onScroll={onScroll} />
          ) : (
            <WatchFeed hideEmptySuggestions />
          )}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  watchFeedContainer: {
    flex: 1,
  },
  segmentContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.xs,
    paddingBottom: IOS_SPACING.sm,
  },
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    borderRadius: IOS_RADIUS.sm,
    paddingHorizontal: IOS_SPACING.sm,
    height: 36,
  },
  searchIcon: {
    marginRight: IOS_SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: IOS_COLORS.label,
    paddingVertical: 0,
  },
});
