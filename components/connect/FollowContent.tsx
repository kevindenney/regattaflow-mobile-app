/**
 * FollowContent — Follow segment for the Connect tab
 *
 * Two sub-tabs:
 * - Following (default): Discover peers and manage follows
 * - Posts: Activity timeline from followed peers
 *
 * For sailing: uses live data (SuggestedSailorsSection, WatchFeed).
 * For other interests: renders config-driven demo peers and posts.
 */

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
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
import { useInterestEventConfig } from '@/hooks/useInterestEventConfig';
import { getConnectDemoData } from '@/configs/connectDemoData';
import { DemoPeerCard, DemoPostCard } from './DemoCards';

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
  /** Callback to switch to Discuss segment */
  onGoToDiscuss?: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FollowContent({ toolbarOffset, onScroll, onGoToDiscuss: _onGoToDiscuss }: FollowContentProps) {
  const { isGuest } = useAuth();
  const eventConfig = useInterestEventConfig();
  const isSailingInterest = eventConfig.interestSlug === 'sail-racing';
  const demoData = useMemo(() => getConnectDemoData(eventConfig.interestSlug), [eventConfig.interestSlug]);

  const [feedSubTab, setFeedSubTab] = useState<FeedSubTab>('following');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // Track local follow state for demo peers
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const toggleFollow = useCallback((id: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Sailing-specific hooks (only used when sailing is active)
  const { hasFollowing } = useFollowActivityFeed();
  const showDiscoveryFeed = isGuest || !hasFollowing;
  const { suggestions } = useSailorSuggestions();
  const showSearch = suggestions.length >= SEARCH_THRESHOLD;

  useEffect(() => {
    if (isGuest && isSailingInterest) {
      setFeedSubTab((prev) => (prev === 'posts' ? 'following' : prev));
    }
  }, [isGuest, isSailingInterest]);

  const handleSubTabChange = (tab: FeedSubTab) => {
    setFeedSubTab(tab);
    if (tab !== 'following') setSearchQuery('');
  };

  // ----- Non-sailing interests: render demo data -----
  if (!isSailingInterest && demoData) {
    const filteredPeers = searchQuery
      ? demoData.peers.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : demoData.peers;

    return (
      <View style={styles.container}>
        <View style={[styles.segmentContainer, { marginTop: toolbarOffset }]}>
          <IOSSegmentedControl<FeedSubTab>
            segments={FEED_SEGMENTS}
            selectedValue={feedSubTab}
            onValueChange={handleSubTabChange}
          />
        </View>

        {feedSubTab === 'following' ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
          >
            {/* Search */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color={IOS_COLORS.secondaryLabel} style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder={demoData.searchPlaceholder}
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

            {/* Header */}
            <View style={s.peerHeader}>
              <Text style={s.peerHeaderText}>
                {filteredPeers.length} {demoData.peersHeader}
              </Text>
            </View>

            {/* Peer cards */}
            {filteredPeers.map((peer) => (
              <DemoPeerCard
                key={peer.id}
                peer={peer}
                isFollowing={followedIds.has(peer.id)}
                onToggleFollow={toggleFollow}
              />
            ))}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16, paddingTop: 8 }]}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {demoData.posts.map((post) => (
              <DemoPostCard key={post.id} post={post} />
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  // ----- Sailing: live data -----
  return (
    <View style={styles.container}>
      <View style={[styles.segmentContainer, { marginTop: toolbarOffset }]}>
        <IOSSegmentedControl<FeedSubTab>
          segments={FEED_SEGMENTS}
          selectedValue={feedSubTab}
          onValueChange={handleSubTabChange}
        />
      </View>

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
                <Ionicons name="search" size={16} color={IOS_COLORS.secondaryLabel} style={styles.searchIcon} />
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
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  watchFeedContainer: { flex: 1 },
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
  searchIcon: { marginRight: IOS_SPACING.xs },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: IOS_COLORS.label,
    paddingVertical: 0,
  },
});

/** Demo-specific styles */
const s = StyleSheet.create({
  peerHeader: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.sm,
  },
  peerHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
  },
});
