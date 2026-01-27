/**
 * SailorsGroupedList - Grouped vertical list for the Sailors tab
 *
 * Replaces the TikTok-style full-screen vertical pager with a scannable
 * SectionList organized into meaningful sections:
 * - Following: Races from followed users (high prominence header)
 * - Fleet Activity: Races from fleet mates (medium prominence)
 * - Class Experts: Top performers in user's boat class (medium prominence)
 * - Discover: Public races (low prominence — plain text header)
 *
 * Apple iOS HIG: Structure, Navigation, Content, Visual Design
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  Anchor,
  Trophy,
  Compass,
  Info,
} from 'lucide-react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { getInitials } from '@/components/account/accountStyles';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_LIST_INSETS,
  IOS_SHADOWS,
  IOS_TOUCH,
} from '@/lib/design-tokens-ios';
import { IOSInlineEmptyState } from '@/components/ui/ios';
import { SailorRaceRow, type SailorRaceRowData } from './SailorRaceRow';
import { ExpertRow } from './ExpertRow';
import {
  useGroupedDiscoverSections,
  type SectionKey,
  type EmptyStateConfig,
} from '@/hooks/useGroupedDiscoverSections';
import type { ClassExpert } from '@/hooks/useClassExperts';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// SECTION CONFIG
// =============================================================================

type Prominence = 'high' | 'medium' | 'low';

interface SectionMeta {
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  prominence: Prominence;
  subtitle?: string;
}

const SECTION_META: Record<SectionKey, SectionMeta> = {
  following: {
    icon: Users,
    color: IOS_COLORS.systemBlue,
    prominence: 'high',
    subtitle: 'Races from people you follow',
  },
  fleet: { icon: Anchor, color: IOS_COLORS.systemTeal, prominence: 'medium' },
  experts: { icon: Trophy, color: IOS_COLORS.systemOrange, prominence: 'medium' },
  discover: { icon: Compass, color: IOS_COLORS.systemPurple, prominence: 'low' },
};

// =============================================================================
// SECTION LIST DATA TYPE
// =============================================================================

interface SectionData {
  key: SectionKey;
  title: string;
  count: number;
  emptyMessage?: string;
  emptyState?: EmptyStateConfig;
  peekItems?: (SailorRaceRowData | ClassExpert)[];
  reasonLabel?: string;
  data: (SailorRaceRowData | ClassExpert)[];
}

// =============================================================================
// AVATAR HELPERS (shared with SailorRaceRow)
// =============================================================================

const AVATAR_COLORS = [
  IOS_COLORS.systemBlue,
  IOS_COLORS.systemGreen,
  IOS_COLORS.systemOrange,
  IOS_COLORS.systemRed,
  IOS_COLORS.systemPurple,
  IOS_COLORS.systemPink,
  IOS_COLORS.systemTeal,
  IOS_COLORS.systemIndigo,
  IOS_COLORS.systemMint,
  IOS_COLORS.systemCyan,
  IOS_COLORS.systemBrown,
  IOS_COLORS.systemYellow,
] as const;

const DEFAULT_EMOJI = '\u26F5';

function getAvatarColor(userId: string): string {
  return AVATAR_COLORS[userId.charCodeAt(0) % AVATAR_COLORS.length];
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SailorsGroupedList() {
  const router = useRouter();
  const {
    sections,
    isLoading,
    refresh,
    loadMore,
    isLoadingMore,
    toggleFollow: _toggleFollow,
    toggleExpertFollow,
    collapsedSections,
    toggleSectionCollapsed,
    className,
    dismissRace,
  } = useGroupedDiscoverSections();

  // Build SectionList data — collapsed sections get empty data arrays
  const sectionListData: SectionData[] = useMemo(() => {
    return sections.map((section) => {
      const collapsed = collapsedSections[section.key];
      return {
        key: section.key,
        title: section.title,
        count: section.count,
        emptyMessage: section.emptyMessage,
        emptyState: section.emptyState,
        peekItems: section.peekItems,
        reasonLabel: section.reasonLabel,
        data: collapsed ? [] : (section.data as (SailorRaceRowData | ClassExpert)[]),
      };
    });
  }, [sections, collapsedSections]);

  // Navigation
  const handleRaceRowPress = useCallback(
    (data: SailorRaceRowData) => {
      router.push(`/sailor-journey/${data.userId}/${data.id}`);
    },
    [router]
  );

  // Dismiss (not interested) — only for discover section items
  const handleDismissRace = useCallback(
    (data: SailorRaceRowData) => {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          200,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.opacity
        )
      );
      dismissRace(data.id);
    },
    [dismissRace]
  );

  const handleExpertPress = useCallback(
    (expert: ClassExpert) => {
      // Navigate to expert's most recent race journey if available
      if (expert.recentRaces && expert.recentRaces.length > 0) {
        router.push(`/sailor-journey/${expert.userId}/${expert.recentRaces[0].id}`);
      } else {
        // Navigate to general profile or discovery page
        router.push(`/sailor-journey/${expert.userId}/latest`);
      }
    },
    [router]
  );

  // Section header toggle
  const handleSectionHeaderPress = useCallback(
    (key: SectionKey) => {
      // Discover is not collapsible
      if (key === 'discover') return;

      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          250,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.opacity
        )
      );
      toggleSectionCollapsed(key);
    },
    [toggleSectionCollapsed]
  );

  // Render section header with prominence levels
  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => {
      const meta = SECTION_META[section.key];
      const IconComponent = meta.icon;
      const isCollapsible = section.key !== 'discover';
      const collapsed = collapsedSections[section.key];
      const ChevronIcon = collapsed ? ChevronRight : ChevronDown;

      // LOW prominence: plain floating text header (like Settings.app section titles)
      if (meta.prominence === 'low') {
        return (
          <View style={styles.sectionHeaderLow}>
            <Text style={styles.sectionTitleLow} maxFontSizeMultiplier={1.5}>
              {section.title.toUpperCase()}
            </Text>
          </View>
        );
      }

      // HIGH prominence: larger icon container, subtitle
      const isHigh = meta.prominence === 'high';
      const iconSize = isHigh ? 32 : 28;
      const iconInner = isHigh ? 18 : 16;

      // Determine subtitle: use reasonLabel for personalization context,
      // fall back to static subtitle for high-prominence sections
      const subtitleText = section.reasonLabel || (isHigh ? meta.subtitle : undefined);

      return (
        <Pressable
          onPress={() => handleSectionHeaderPress(section.key)}
          style={({ pressed }) => [
            styles.sectionHeader,
            pressed && isCollapsible && styles.sectionHeaderPressed,
          ]}
          disabled={!isCollapsible}
          accessibilityRole={isCollapsible ? 'button' : undefined}
          accessibilityState={isCollapsible ? { expanded: !collapsed } : undefined}
          accessibilityHint={isCollapsible ? 'Double tap to expand or collapse section' : undefined}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { width: iconSize, height: iconSize, borderRadius: isHigh ? 8 : 7, backgroundColor: `${meta.color}15` }]}>
              <IconComponent size={iconInner} color={meta.color} />
            </View>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.5}>
                {section.title}
              </Text>
              {subtitleText && (
                <Text style={styles.sectionSubtitle} numberOfLines={1} maxFontSizeMultiplier={1.5}>
                  {subtitleText}
                </Text>
              )}
            </View>
            {section.count > 0 && (
              <View style={[styles.countBadge, { backgroundColor: `${meta.color}18` }]}>
                <Text style={[styles.countBadgeText, { color: meta.color }]} maxFontSizeMultiplier={1.5}>
                  {section.count}
                </Text>
              </View>
            )}
          </View>
          {isCollapsible && (
            <ChevronIcon size={16} color={IOS_COLORS.systemGray2} />
          )}
        </Pressable>
      );
    },
    [collapsedSections, handleSectionHeaderPress]
  );

  // Render item
  const renderItem = useCallback(
    ({ item, section, index }: { item: SailorRaceRowData | ClassExpert; section: SectionData; index: number }) => {
      const isLast = index === section.data.length - 1;

      if (section.key === 'experts') {
        return (
          <ExpertRow
            expert={item as ClassExpert}
            className={className || undefined}
            onPress={handleExpertPress}
            onToggleFollow={toggleExpertFollow}
            showSeparator={!isLast}
            isLast={isLast}
          />
        );
      }

      // Only show dismiss button for Discover section items
      const showDismiss = section.key === 'discover';

      return (
        <SailorRaceRow
          data={item as SailorRaceRowData}
          onPress={handleRaceRowPress}
          onDismiss={showDismiss ? handleDismissRace : undefined}
          showSeparator={!isLast}
          isLast={isLast}
        />
      );
    },
    [className, handleExpertPress, handleRaceRowPress, handleDismissRace, toggleExpertFollow]
  );

  // Render section footer — show empty message, peek preview, or bottom radius
  const renderSectionFooter = useCallback(
    ({ section }: { section: SectionData }) => {
      const collapsed = collapsedSections[section.key];
      const meta = SECTION_META[section.key];

      // Show inline empty if expanded but no data
      if (!collapsed && section.data.length === 0 && section.emptyState) {
        return (
          <View style={styles.sectionEmptyContainer}>
            <IOSInlineEmptyState
              message={section.emptyState.message}
              actionLabel={section.emptyState.actionLabel}
              onAction={
                section.emptyState.actionRoute
                  ? () => router.push(section.emptyState!.actionRoute! as any)
                  : undefined
              }
            />
          </View>
        );
      }

      if (!collapsed && section.data.length === 0 && section.emptyMessage) {
        return (
          <View style={styles.sectionEmptyContainer}>
            <IOSInlineEmptyState message={section.emptyMessage} />
          </View>
        );
      }

      // Collapsed peek preview — visual mini-rows with avatars
      if (collapsed && section.peekItems && section.peekItems.length > 0) {
        return (
          <View style={styles.peekContainer}>
            {section.peekItems.map((item, i) => {
              const name = 'userName' in item ? item.userName : '';
              const userId = 'userId' in item ? item.userId : '';
              const avatarEmoji = 'avatarEmoji' in item ? item.avatarEmoji : undefined;
              const avatarColor = 'avatarColor' in item ? item.avatarColor : undefined;
              const showEmoji = avatarEmoji && avatarEmoji !== DEFAULT_EMOJI;
              const avatarBg = showEmoji
                ? (avatarColor || IOS_COLORS.systemGray5)
                : getAvatarColor(userId);
              const initials = getInitials(name);

              // Secondary info: race name or expertise for experts
              const secondaryText = 'name' in item && 'boatClass' in item
                ? [item.boatClass, (item as SailorRaceRowData).name].filter(Boolean).join(' \u00B7 ')
                : 'expertScore' in item
                  ? `Top ${className || 'class'} sailor`
                  : '';

              const isLastPeek = i === section.peekItems!.length - 1;

              return (
                <View key={i} style={styles.peekRow}>
                  <View style={[styles.peekAvatar, { backgroundColor: avatarBg }]}>
                    {showEmoji ? (
                      <Text style={styles.peekAvatarEmoji}>{avatarEmoji}</Text>
                    ) : (
                      <Text style={styles.peekAvatarInitials}>{initials}</Text>
                    )}
                  </View>
                  <View style={styles.peekRowContent}>
                    <Text
                      style={styles.peekRowName}
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.5}
                    >
                      {name}
                    </Text>
                    {secondaryText ? (
                      <Text
                        style={styles.peekRowDetail}
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.5}
                      >
                        {secondaryText}
                      </Text>
                    ) : null}
                  </View>
                  {!isLastPeek && <View style={styles.peekRowSeparator} />}
                </View>
              );
            })}
            <Pressable
              onPress={() => handleSectionHeaderPress(section.key)}
              style={styles.peekShowAllRow}
            >
              <Text style={styles.peekShowAll} maxFontSizeMultiplier={1.5}>
                {section.count > 3 ? `Show all ${section.count}` : 'Show all'}
              </Text>
            </Pressable>
            <View style={styles.sectionSpacer} />
          </View>
        );
      }

      // Bottom spacing between sections
      return <View style={styles.sectionSpacer} />;
    },
    [collapsedSections, handleSectionHeaderPress, router]
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: SailorRaceRowData | ClassExpert, _index: number) => {
      if ('expertScore' in item) {
        return `expert_${item.userId}`;
      }
      return `race_${(item as SailorRaceRowData).id}_${(item as SailorRaceRowData).userId}`;
    },
    []
  );

  // End reached — load more discover races
  const handleEndReached = useCallback(() => {
    if (!isLoadingMore) {
      loadMore();
    }
  }, [isLoadingMore, loadMore]);

  // Refreshing
  const [refreshing, setRefreshing] = React.useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // List footer — loading indicator
  const renderListFooter = useCallback(() => {
    if (!isLoadingMore) return <View style={styles.listFooter} />;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={IOS_COLORS.systemGray} />
      </View>
    );
  }, [isLoadingMore]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
      </View>
    );
  }

  return (
    <SectionList
      sections={sectionListData}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      renderSectionFooter={renderSectionFooter}
      keyExtractor={keyExtractor}
      stickySectionHeadersEnabled={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      ListFooterComponent={renderListFooter}
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={11}
    />
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.xxxxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- High / Medium prominence section headers ---
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: IOS_LIST_INSETS.insetGrouped.marginHorizontal,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    minHeight: IOS_TOUCH.listItemHeight,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderTopLeftRadius: IOS_RADIUS.md,
    borderTopRightRadius: IOS_RADIUS.md,
    marginTop: 0,
    ...IOS_SHADOWS.sm,
  },
  sectionHeaderPressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },
  sectionHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.md,
  },
  sectionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleGroup: {
    flex: 1,
  },
  sectionTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  sectionSubtitle: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
  },

  // --- Low prominence section header (Discover) ---
  sectionHeaderLow: {
    marginHorizontal: IOS_LIST_INSETS.insetGrouped.marginHorizontal,
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.sm,
  },
  sectionTitleLow: {
    ...IOS_TYPOGRAPHY.footnote,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },

  // --- Empty state ---
  sectionEmptyContainer: {
    marginHorizontal: IOS_LIST_INSETS.insetGrouped.marginHorizontal,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.xl,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
  },

  // --- Peek preview for collapsed sections (visual mini-rows) ---
  peekContainer: {
    marginHorizontal: IOS_LIST_INSETS.insetGrouped.marginHorizontal,
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.xs,
    paddingBottom: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
  },
  peekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  peekAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: IOS_SPACING.sm,
  },
  peekAvatarEmoji: {
    fontSize: 13,
  },
  peekAvatarInitials: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  peekRowContent: {
    flex: 1,
  },
  peekRowName: {
    ...IOS_TYPOGRAPHY.footnote,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  peekRowDetail: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 1,
  },
  peekRowSeparator: {
    position: 'absolute',
    left: 28 + IOS_SPACING.sm,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
  },
  peekShowAllRow: {
    paddingTop: IOS_SPACING.xs,
    paddingBottom: IOS_SPACING.xs,
  },
  peekShowAll: {
    ...IOS_TYPOGRAPHY.footnote,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },

  // --- Section spacing ---
  sectionSpacer: {
    height: IOS_SPACING.xl,
  },

  // --- Footer ---
  loadingFooter: {
    paddingVertical: IOS_SPACING.xl,
    alignItems: 'center',
  },
  listFooter: {
    height: IOS_SPACING.xl,
  },
});
