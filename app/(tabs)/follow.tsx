/**
 * Follow Tab — Discover and follow sailors, see their activity
 *
 * Two sub-tabs:
 * - Following (default): SuggestedSailorsSection — discover and manage follows
 * - Posts: WatchFeed — race activity timeline from followed sailors
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { WatchFeed } from '@/components/follow';
import { SuggestedSailorsSection } from '@/components/search/SuggestedSailorsSection';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { TabScreenToolbar, type ToolbarAction } from '@/components/ui/TabScreenToolbar';

import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
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
// MAIN COMPONENT
// =============================================================================

export default function FollowTab() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll } = useScrollToolbarHide();

  const [feedSubTab, setFeedSubTab] = useState<FeedSubTab>(isGuest ? 'following' : 'posts');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // Use hook to get total count for threshold check (no search filter applied)
  const { suggestions } = useSailorSuggestions();
  const showSearch = suggestions.length >= SEARCH_THRESHOLD;

  useEffect(() => {
    if (isGuest) {
      setFeedSubTab((prev) => (prev === 'posts' ? 'following' : prev));
    }
  }, [isGuest]);

  const toolbarActions: ToolbarAction[] = [];

  // Clear search when switching tabs
  const handleSubTabChange = (tab: FeedSubTab) => {
    setFeedSubTab(tab);
    if (tab !== 'following') {
      setSearchQuery('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed status bar background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Content */}
      {feedSubTab === 'following' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: toolbarHeight }]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
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
        <View style={[styles.watchFeedContainer, { paddingTop: toolbarHeight }]}>
          {isGuest && (
            <View style={styles.firstVisitGuide}>
              <Text style={styles.firstVisitTitle}>Start by following sailors</Text>
              <Text style={styles.firstVisitText}>
                Your posts feed fills up after you follow fleets, sailors, or clubs.
              </Text>
              <View style={styles.firstVisitActions}>
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => setFeedSubTab('following')}
                >
                  <Text style={styles.primaryActionText}>Open Following</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => router.push('/(tabs)/community')}
                >
                  <Text style={styles.secondaryActionText}>Go to Discuss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <WatchFeed hideEmptySuggestions />
        </View>
      )}

      {/* Toolbar */}
      <TabScreenToolbar
        title="Follow"
        topInset={insets.top}
        actions={toolbarActions}
        onMeasuredHeight={setToolbarHeight}
        hidden={toolbarHidden}
        backgroundColor="rgba(242, 242, 247, 0.94)"
      >
        <View style={styles.segmentContainer}>
          <IOSSegmentedControl<FeedSubTab>
            segments={FEED_SEGMENTS}
            selectedValue={feedSubTab}
            onValueChange={handleSubTabChange}
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
  firstVisitGuide: {
    marginHorizontal: IOS_SPACING.lg,
    marginTop: IOS_SPACING.md,
    marginBottom: IOS_SPACING.sm,
    padding: IOS_SPACING.md,
    borderRadius: IOS_RADIUS.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  firstVisitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  firstVisitText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#334155',
  },
  firstVisitActions: {
    marginTop: IOS_SPACING.sm,
    flexDirection: 'row',
    gap: IOS_SPACING.sm,
  },
  primaryAction: {
    backgroundColor: '#2563EB',
    borderRadius: IOS_RADIUS.sm,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryAction: {
    backgroundColor: '#DBEAFE',
    borderRadius: IOS_RADIUS.sm,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 8,
  },
  secondaryActionText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
});
