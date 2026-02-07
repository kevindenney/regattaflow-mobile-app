/**
 * Watch Tab Screen (formerly "Follow" / "Connect" / "Discover")
 *
 * Three segments:
 * - Feed: Instagram-style activity from followed sailors + follower posts
 * - Communities: Browse joined communities + discover new ones
 * - Messages: WhatsApp-style messaging hub (DMs, groups, fleet/crew threads)
 *
 * Discovery of new sailors/clubs is handled by the Search tab.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { WatchFeed, ComposePostSheet } from '@/components/follow';
import { CommunitiesBrowser } from '@/components/community/CommunitiesBrowser';
import { TabScreenToolbar, type ToolbarAction } from '@/components/ui/TabScreenToolbar';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import { useCrewThreads, useCrewThreadsUnreadCount } from '@/hooks/useCrewThreads';
import { CrewThreadList } from '@/components/crew/CrewThreadList';
import { NewChatSheet } from '@/components/crew/NewChatSheet';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';


// =============================================================================
// TYPES
// =============================================================================

type WatchSegment = 'feed' | 'communities' | 'messages';
type MessageFilterTab = 'all' | 'unread' | 'groups';

// =============================================================================
// CONSTANTS
// =============================================================================

const SEGMENTS: { value: WatchSegment; label: string; badge?: number }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'communities', label: 'Communities' },
  { value: 'messages', label: 'Messages' },
];

// =============================================================================
// MESSAGE FILTER TABS
// =============================================================================

function MessageFilterTabs({
  activeTab,
  onTabChange,
  unreadCount,
}: {
  activeTab: MessageFilterTab;
  onTabChange: (tab: MessageFilterTab) => void;
  unreadCount: number;
}) {
  const tabs: { key: MessageFilterTab; label: string; badge?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread', badge: unreadCount > 0 ? unreadCount : undefined },
    { key: 'groups', label: 'Groups' },
  ];

  return (
    <View style={messageStyles.tabsContainer}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          style={[
            messageStyles.tab,
            activeTab === tab.key && messageStyles.tabActive,
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text
            style={[
              messageStyles.tabText,
              activeTab === tab.key && messageStyles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
          {tab.badge !== undefined && (
            <View style={messageStyles.tabBadge}>
              <Text style={messageStyles.tabBadgeText}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function WatchTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll } = useScrollToolbarHide();

  // Segment state
  const [segment, setSegment] = useState<WatchSegment>('feed');

  // Messages state
  const [messageFilter, setMessageFilter] = useState<MessageFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNewChatSheet, setShowNewChatSheet] = useState(false);
  const [showComposePost, setShowComposePost] = useState(false);

  // Communities state
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [isCommunitySearchFocused, setIsCommunitySearchFocused] = useState(false);

  // Data hooks
  const { threads, isLoading: threadsLoading, refetch: refetchThreads } = useCrewThreads();
  const { unreadCount } = useCrewThreadsUnreadCount();

  // Build segments with badge
  const segmentsWithBadge = useMemo(() => {
    return SEGMENTS.map((seg) => ({
      ...seg,
      badge: seg.value === 'messages' ? unreadCount : undefined,
    }));
  }, [unreadCount]);

  // Filter threads
  const filteredThreads = useMemo(() => {
    let filtered = threads;
    switch (messageFilter) {
      case 'unread':
        filtered = threads.filter((t) => t.unreadCount > 0);
        break;
      case 'groups':
        filtered = threads.filter((t) => t.threadType !== 'direct');
        break;
    }
    return filtered;
  }, [threads, messageFilter]);

  const totalUnreadCount = useMemo(() => {
    return threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
  }, [threads]);

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  const handleDiscoverSailors = useCallback(() => {
    router.push('/(tabs)/search');
  }, [router]);

  const handleNewChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNewChatSheet(true);
  }, []);

  const handleThreadCreated = useCallback(
    (threadId: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowNewChatSheet(false);
      router.push(`/crew-thread/${threadId}`);
    },
    [router]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const clearCommunitySearch = useCallback(() => {
    setCommunitySearchQuery('');
  }, []);

  const handleCreateCommunity = useCallback(() => {
    router.push('/community/create');
  }, [router]);

  // ---------------------------------------------------------------------------
  // Toolbar actions (swap based on segment)
  // ---------------------------------------------------------------------------

  const toolbarActions: ToolbarAction[] = useMemo(() => {
    if (segment === 'messages') {
      return [
        {
          icon: 'create-outline',
          sfSymbol: 'square.and.pencil',
          label: 'New chat',
          onPress: handleNewChat,
        },
      ];
    }

    if (segment === 'communities') {
      return [
        {
          icon: 'add-circle-outline',
          sfSymbol: 'plus.circle',
          label: 'Create community',
          onPress: handleCreateCommunity,
        },
      ];
    }

    return [
      {
        icon: 'add-circle-outline',
        sfSymbol: 'plus.circle',
        label: 'New post',
        onPress: () => setShowComposePost(true),
      },
      {
        icon: 'person-add-outline',
        sfSymbol: 'person.badge.plus',
        label: 'Find sailors',
        onPress: handleDiscoverSailors,
      },
    ];
  }, [segment, handleDiscoverSailors, handleNewChat, handleCreateCommunity]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Fixed status bar background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Content */}
      {segment === 'feed' ? (
        <WatchFeed
          toolbarOffset={toolbarHeight}
          onScroll={handleScroll}
        />
      ) : segment === 'communities' ? (
        <View style={styles.communitiesContainer}>
          {/* Search Bar */}
          <View style={[messageStyles.searchContainer, { paddingTop: toolbarHeight }]}>
            <View
              style={[
                messageStyles.searchInputWrapper,
                isCommunitySearchFocused && messageStyles.searchInputFocused,
              ]}
            >
              <Search size={16} color={IOS_COLORS.secondaryLabel} />
              <TextInput
                style={messageStyles.searchInput}
                placeholder="Search communities..."
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                value={communitySearchQuery}
                onChangeText={setCommunitySearchQuery}
                onFocus={() => setIsCommunitySearchFocused(true)}
                onBlur={() => setIsCommunitySearchFocused(false)}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {communitySearchQuery.length > 0 && (
                <Pressable style={messageStyles.clearButton} onPress={clearCommunitySearch}>
                  <X size={16} color={IOS_COLORS.secondaryLabel} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Communities Browser */}
          <CommunitiesBrowser
            toolbarOffset={0}
            onScroll={handleScroll}
            searchQuery={communitySearchQuery}
            onCreateCommunity={handleCreateCommunity}
          />
        </View>
      ) : (
        <View style={styles.messagesContainer}>
          {/* Search Bar */}
          <View style={[messageStyles.searchContainer, { paddingTop: toolbarHeight }]}>
            <View
              style={[
                messageStyles.searchInputWrapper,
                isSearchFocused && messageStyles.searchInputFocused,
              ]}
            >
              <Search size={16} color={IOS_COLORS.secondaryLabel} />
              <TextInput
                style={messageStyles.searchInput}
                placeholder="Search conversations..."
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable style={messageStyles.clearButton} onPress={clearSearch}>
                  <X size={16} color={IOS_COLORS.secondaryLabel} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Filter Tabs */}
          <MessageFilterTabs
            activeTab={messageFilter}
            onTabChange={(tab) => {
              Haptics.selectionAsync();
              setMessageFilter(tab);
            }}
            unreadCount={totalUnreadCount}
          />

          {/* Thread List */}
          <CrewThreadList
            threads={filteredThreads}
            isLoading={threadsLoading}
            onRefresh={refetchThreads}
            onCreateThread={handleNewChat}
            showCreateButton={false}
            searchQuery={searchQuery}
          />
        </View>
      )}

      {/* Toolbar */}
      <TabScreenToolbar
        title="Watch"
        topInset={insets.top}
        actions={toolbarActions}
        onMeasuredHeight={setToolbarHeight}
        hidden={toolbarHidden}
        backgroundColor="rgba(242, 242, 247, 0.94)"
      >
        <View style={styles.segmentContainer}>
          <IOSSegmentedControl
            segments={segmentsWithBadge}
            selectedValue={segment}
            onValueChange={setSegment}
          />
        </View>
      </TabScreenToolbar>

      {/* New Chat Sheet */}
      <NewChatSheet
        isOpen={showNewChatSheet}
        onClose={() => setShowNewChatSheet(false)}
        onThreadCreated={handleThreadCreated}
      />

      {/* Compose Post Sheet */}
      <ComposePostSheet
        isOpen={showComposePost}
        onClose={() => setShowComposePost(false)}
      />
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
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.xs,
    paddingBottom: IOS_SPACING.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  communitiesContainer: {
    flex: 1,
  },
});

const messageStyles = StyleSheet.create({
  // Search
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    gap: 8,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
  },
  searchInputFocused: {
    borderWidth: 1,
    borderColor: IOS_COLORS.systemBlue,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: IOS_COLORS.label,
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
      default: {},
    }),
  },
  clearButton: {
    padding: 4,
  },

  // Filter tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    gap: IOS_SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.xs,
    borderRadius: IOS_RADIUS.lg,
    gap: 4,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
  },
  tabActive: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  tabText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: IOS_COLORS.systemRed,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
