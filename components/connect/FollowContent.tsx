/**
 * FollowContent — People segment for the Connect tab
 *
 * Single unified scroll: search → suggested people → activity from followed.
 * No sub-tabs — discovery is inline, not a separate mode.
 *
 * For sailing: uses live data (SuggestedSailorsSection, WatchFeed).
 * For other interests: renders config-driven demo peers and posts.
 */

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Pressable,
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

  // Whether to collapse the peer list (show only followed + a "show all" toggle)
  const [showAllPeers, setShowAllPeers] = useState(true);

  // Sailing-specific hooks (only used when sailing is active)
  const { hasFollowing } = useFollowActivityFeed();
  const showDiscoveryFeed = isGuest || !hasFollowing;
  const { suggestions } = useSailorSuggestions();

  // ----- Non-sailing interests: unified single scroll -----
  if (!isSailingInterest && demoData) {
    const filteredPeers = searchQuery
      ? demoData.peers.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : demoData.peers;

    // Build set of followed peer names for filtering posts
    const followedNames = new Set(
      demoData.peers.filter((p) => followedIds.has(p.id)).map((p) => p.name)
    );
    const followedPosts = demoData.posts.filter((p) => followedNames.has(p.authorName));

    // When user has follows and isn't searching, collapse unfollow'd peers
    const hasFollows = followedIds.size > 0;
    const peersToShow = (!searchQuery && hasFollows && !showAllPeers)
      ? filteredPeers.filter((p) => followedIds.has(p.id))
      : filteredPeers;

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: toolbarOffset }]}
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

          {/* People section */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionHeaderText}>
              {searchQuery ? 'SEARCH RESULTS' : demoData.peersHeader.toUpperCase()}
            </Text>
            {hasFollows && !searchQuery && (
              <Text style={s.followingCount}>
                {followedIds.size} following
              </Text>
            )}
          </View>

          {peersToShow.map((peer) => (
            <DemoPeerCard
              key={peer.id}
              peer={peer}
              isFollowing={followedIds.has(peer.id)}
              onToggleFollow={toggleFollow}
            />
          ))}

          {/* Show all / show less toggle when user has follows */}
          {hasFollows && !searchQuery && (
            <Pressable
              style={s.showToggle}
              onPress={() => setShowAllPeers((v) => !v)}
            >
              <Text style={s.showToggleText}>
                {showAllPeers
                  ? `Show only following (${followedIds.size})`
                  : `Show all ${demoData.peersHeader.toLowerCase()} (${demoData.peers.length})`}
              </Text>
              <Ionicons
                name={showAllPeers ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#2563EB"
              />
            </Pressable>
          )}

          {/* Activity section — posts from followed people */}
          {hasFollows && (
            <>
              <View style={[s.sectionHeader, { marginTop: 8 }]}>
                <Text style={s.sectionHeaderText}>RECENT ACTIVITY</Text>
              </View>

              <View style={s.activityContainer}>
                {followedPosts.length > 0 ? (
                  followedPosts.map((post) => (
                    <DemoPostCard key={post.id} post={post} />
                  ))
                ) : (
                  <View style={s.inlineEmpty}>
                    <Ionicons name="newspaper-outline" size={28} color={IOS_COLORS.tertiaryLabel} />
                    <Text style={s.inlineEmptyText}>
                      No posts from people you follow yet. Check back soon.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // ----- Sailing: live data (keep existing dual-view for now) -----
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: toolbarOffset }]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {suggestions.length > 0 && (
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

      {/* Sailing activity feed overlays below if user has follows */}
      {!isGuest && hasFollowing && (
        <View style={styles.watchFeedContainer}>
          <WatchFeed hideEmptySuggestions />
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
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.sm,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.sm,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: IOS_COLORS.secondaryLabel,
  },
  followingCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  showToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  showToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  activityContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inlineEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  inlineEmptyText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});
