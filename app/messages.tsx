/**
 * Messages Screen
 *
 * WhatsApp-style messaging hub with filter tabs, search, and FAB.
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
import { useCrewThreads } from '@/hooks/useCrewThreads';
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

// =============================================================================
// FILTER TABS
// =============================================================================

function FilterTabs({
  activeTab,
  onTabChange,
  unreadCount,
}: {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  unreadCount: number;
}) {
  const tabs: { key: FilterTab; label: string; badge?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread', badge: unreadCount > 0 ? unreadCount : undefined },
    { key: 'groups', label: 'Groups' },
  ];

  return (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && styles.tabActive,
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
          {tab.badge !== undefined && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
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
    setShowNewChatSheet(true);
  }, []);

  const handleThreadCreated = useCallback((threadId: string) => {
    setShowNewChatSheet(false);
    router.push(`/crew-thread/${threadId}`);
  }, [router]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <View style={styles.screenWrapper}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleBack}
          >
            <ChevronLeft size={24} color={IOS_COLORS.systemBlue} />
          </Pressable>

          <Text style={styles.title}>Messages</Text>

          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNewChat}
          >
            <Pencil size={20} color={IOS_COLORS.systemBlue} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchInputWrapper,
              isSearchFocused && styles.searchInputWrapperFocused,
            ]}
          >
            <Search size={16} color={IOS_COLORS.secondaryLabel} />
            <TextInput
              style={styles.searchInput}
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
              <Pressable style={styles.clearButton} onPress={clearSearch}>
                <X size={16} color={IOS_COLORS.secondaryLabel} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <FilterTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadCount={totalUnreadCount}
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

      {/* Floating Action Button - outside container to avoid clipping */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 24 },
          pressed && styles.fabPressed,
        ]}
        onPress={handleNewChat}
      >
        <Pencil size={26} color="#FFFFFF" strokeWidth={2} />
      </Pressable>

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
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  backButton: {
    padding: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
  },
  editButton: {
    padding: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
  },
  buttonPressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },
  title: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },

  // Search
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    gap: 8,
  },
  searchInputWrapperFocused: {
    borderWidth: 1,
    borderColor: IOS_COLORS.systemBlue,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: IOS_COLORS.label,
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
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    gap: 4,
  },
  tabActive: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  tabText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
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

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: IOS_COLORS.systemBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
});
