/**
 * Messages Screen
 *
 * WhatsApp-style messaging hub with filter tabs, search, and FAB.
 * Supports light and dark mode via useIOSColors hook.
 */

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, X, Pencil } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useCrewThreads } from '@/hooks/useCrewThreads';
import { useIOSColors } from '@/hooks/useIOSColors';
import { CrewThreadList } from '@/components/crew/CrewThreadList';
import { NewChatSheet } from '@/components/crew/NewChatSheet';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import type { CrewThread } from '@/services/CrewThreadService';

// =============================================================================
// TYPES
// =============================================================================

type FilterTab = 'all' | 'unread' | 'groups';
type IOSColorsType = typeof IOS_COLORS;

// =============================================================================
// FILTER TABS
// =============================================================================

function FilterTabs({
  activeTab,
  onTabChange,
  unreadCount,
  colors,
}: {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  unreadCount: number;
  colors: IOSColorsType;
}) {
  const tabs: { key: FilterTab; label: string; badge?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread', badge: unreadCount > 0 ? unreadCount : undefined },
    { key: 'groups', label: 'Groups' },
  ];

  return (
    <View
      style={[
        staticStyles.tabsContainer,
        {
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderBottomColor: colors.separator,
        },
      ]}
    >
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          style={[
            staticStyles.tab,
            { backgroundColor: colors.tertiarySystemFill },
            activeTab === tab.key && { backgroundColor: colors.systemBlue },
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text
            style={[
              staticStyles.tabText,
              { color: colors.secondaryLabel },
              activeTab === tab.key && staticStyles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
          {tab.badge !== undefined && (
            <View style={[staticStyles.tabBadge, { backgroundColor: colors.systemRed }]}>
              <Text style={staticStyles.tabBadgeText}>
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

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useIOSColors();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatSheet, setShowNewChatSheet] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const {
    threads,
    isLoading,
    refetch,
  } = useCrewThreads();

  // Calculate total unread count
  const totalUnreadCount = useMemo(() => {
    return threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
  }, [threads]);

  // Filter threads based on active tab
  const filteredThreads = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return threads.filter((t) => t.unreadCount > 0);
      case 'groups':
        return threads.filter((t) => t.threadType !== 'direct');
      default:
        return threads;
    }
  }, [threads, activeTab]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  const handleNewChat = useCallback(() => {
    // Light haptic feedback on compose button tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNewChatSheet(true);
  }, []);

  const handleThreadCreated = useCallback((threadId: string) => {
    // Success haptic feedback on thread creation
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowNewChatSheet(false);
    router.push(`/crew-thread/${threadId}`);
  }, [router]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <View style={staticStyles.screenWrapper}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[staticStyles.container, { backgroundColor: colors.systemGroupedBackground }]}>
        {/* Header */}
        <View
          style={[
            staticStyles.header,
            { paddingTop: insets.top, backgroundColor: colors.secondarySystemGroupedBackground },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              staticStyles.backButton,
              pressed && { backgroundColor: colors.quaternarySystemFill },
            ]}
            onPress={handleBack}
          >
            <ChevronLeft size={24} color={colors.systemBlue} />
          </Pressable>

          <Text style={[staticStyles.title, { color: colors.label }]}>Messages</Text>

          <Pressable
            style={({ pressed }) => [
              staticStyles.composeButton,
              pressed && { backgroundColor: colors.quaternarySystemFill },
            ]}
            onPress={handleNewChat}
          >
            <Pencil size={22} color={colors.systemBlue} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View
          style={[
            staticStyles.searchContainer,
            { backgroundColor: colors.secondarySystemGroupedBackground },
          ]}
        >
          <View
            style={[
              staticStyles.searchInputWrapper,
              { backgroundColor: colors.tertiarySystemFill },
              isSearchFocused && { borderWidth: 1, borderColor: colors.systemBlue },
            ]}
          >
            <Search size={16} color={colors.secondaryLabel} />
            <TextInput
              style={[staticStyles.searchInput, { color: colors.label }]}
              placeholder="Search conversations..."
              placeholderTextColor={colors.tertiaryLabel}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable style={staticStyles.clearButton} onPress={clearSearch}>
                <X size={16} color={colors.secondaryLabel} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <FilterTabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            Haptics.selectionAsync();
            setActiveTab(tab);
          }}
          unreadCount={totalUnreadCount}
          colors={colors}
        />

        {/* Thread List */}
        <CrewThreadList
          threads={filteredThreads}
          isLoading={isLoading}
          onRefresh={refetch}
          onCreateThread={handleNewChat}
          showCreateButton={false}
          searchQuery={searchQuery}
        />
      </View>

      {/* New Chat Action Sheet */}
      <NewChatSheet
        isOpen={showNewChatSheet}
        onClose={() => setShowNewChatSheet(false)}
        onThreadCreated={handleThreadCreated}
      />
    </View>
  );
}

// =============================================================================
// STATIC STYLES (non-color dependent)
// =============================================================================

const staticStyles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.sm,
  },
  backButton: {
    padding: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
  },
  composeButton: {
    padding: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
  },
  title: {
    ...IOS_TYPOGRAPHY.headline,
  },

  // Search
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: IOS_SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.xs,
    borderRadius: IOS_RADIUS.lg,
    gap: 4,
  },
  tabText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
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
