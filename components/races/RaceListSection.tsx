/**
 * RaceListSection - Grouped vertical list of races
 *
 * SectionList wrapper that groups races by time proximity:
 * - Today / Tomorrow: hero-sized RaceListRow
 * - This Week: standard rows
 * - Later: compact rows
 * - Past: dimmed rows, collapsed by default
 *
 * Sticky section headers follow iOS grouped list conventions.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Pressable,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react-native';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  REGATTA_SEMANTIC_COLORS,
} from '@/lib/design-tokens-ios';
import { RaceListRow, type RaceRowVariant } from './RaceListRow';
import type { CardRaceData } from '@/components/cards/types';
import type { RaceFilterSegment } from './RacesFloatingHeader';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// TYPES
// =============================================================================

interface RaceSection {
  title: string;
  key: string;
  variant: RaceRowVariant;
  dimmed: boolean;
  collapsedByDefault: boolean;
  data: CardRaceData[];
}

interface RaceListSectionProps {
  /** Array of race data to display */
  races: CardRaceData[];
  /** Current filter from segmented control */
  filterSegment?: RaceFilterSegment;
  /** Called when a race row is tapped */
  onRacePress?: (raceId: string) => void;
  /** Pull-to-refresh handler */
  onRefresh?: () => void;
  /** Whether refreshing is in progress */
  refreshing?: boolean;
  /** Optional prep progress lookup (raceId -> 0-1 progress) */
  prepProgressMap?: Record<string, number>;
}

// =============================================================================
// HELPERS
// =============================================================================

function categorizeRace(race: CardRaceData): {
  section: 'today' | 'tomorrow' | 'thisWeek' | 'later' | 'past';
} {
  const now = new Date();
  const raceDate = new Date(race.date);

  // Normalize to day boundaries
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const raceDayStart = new Date(raceDate);
  raceDayStart.setHours(0, 0, 0, 0);

  if (raceDayStart < today) {
    return { section: 'past' };
  }
  if (raceDayStart.getTime() === today.getTime()) {
    return { section: 'today' };
  }
  if (raceDayStart.getTime() === tomorrow.getTime()) {
    return { section: 'tomorrow' };
  }
  if (raceDayStart < endOfWeek) {
    return { section: 'thisWeek' };
  }
  return { section: 'later' };
}

const SECTION_CONFIG: Record<
  string,
  { title: string; variant: RaceRowVariant; dimmed: boolean; collapsedByDefault: boolean; order: number }
> = {
  today: { title: 'Today', variant: 'hero', dimmed: false, collapsedByDefault: false, order: 0 },
  tomorrow: { title: 'Tomorrow', variant: 'hero', dimmed: false, collapsedByDefault: false, order: 1 },
  thisWeek: { title: 'This Week', variant: 'standard', dimmed: false, collapsedByDefault: false, order: 2 },
  later: { title: 'Coming Up', variant: 'compact', dimmed: false, collapsedByDefault: false, order: 3 },
  past: { title: 'Past', variant: 'compact', dimmed: true, collapsedByDefault: true, order: 4 },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function RaceListSection({
  races,
  filterSegment = 'upcoming',
  onRacePress,
  onRefresh,
  refreshing = false,
  prepProgressMap,
}: RaceListSectionProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    past: true,
  });

  // Build sections from races
  const sections: RaceSection[] = useMemo(() => {
    // Group races by time category
    const groups: Record<string, CardRaceData[]> = {};

    for (const race of races) {
      const { section } = categorizeRace(race);

      // Apply filter
      if (filterSegment === 'upcoming' && section === 'past') continue;
      if (filterSegment === 'past' && section !== 'past') continue;

      if (!groups[section]) groups[section] = [];
      groups[section].push(race);
    }

    // Sort races within each group by date
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        // Past races: newest first; upcoming: soonest first
        return key === 'past' ? dateB - dateA : dateA - dateB;
      });
    }

    // Build section array in order
    return Object.entries(groups)
      .map(([key, data]) => {
        const config = SECTION_CONFIG[key];
        return {
          title: config.title,
          key,
          variant: config.variant,
          dimmed: config.dimmed,
          collapsedByDefault: config.collapsedByDefault,
          data: collapsedSections[key] ? [] : data,
        };
      })
      .sort((a, b) => {
        const orderA = SECTION_CONFIG[a.key]?.order ?? 99;
        const orderB = SECTION_CONFIG[b.key]?.order ?? 99;
        return orderA - orderB;
      });
  }, [races, filterSegment, collapsedSections]);

  // Count of items in collapsed sections (for disclosure label)
  const collapsedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const race of races) {
      const { section } = categorizeRace(race);
      if (filterSegment === 'upcoming' && section === 'past') continue;
      if (filterSegment === 'past' && section !== 'past') continue;
      counts[section] = (counts[section] || 0) + 1;
    }
    return counts;
  }, [races, filterSegment]);

  const toggleSection = useCallback((key: string) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        250,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: RaceSection }) => {
      const isCollapsed = collapsedSections[section.key];
      const count = collapsedCounts[section.key] || 0;
      const ChevronIcon = isCollapsed ? ChevronRight : ChevronDown;

      return (
        <Pressable
          onPress={() => toggleSection(section.key)}
          style={styles.sectionHeader}
          accessibilityRole="button"
          accessibilityState={{ expanded: !isCollapsed }}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {isCollapsed && count > 0 && (
            <Text style={styles.sectionCount}>
              {count} {count === 1 ? 'race' : 'races'}
            </Text>
          )}
          <ChevronIcon size={16} color={IOS_COLORS.systemGray2} />
        </Pressable>
      );
    },
    [collapsedSections, collapsedCounts, toggleSection],
  );

  // Render row
  const renderItem = useCallback(
    ({ item, section }: { item: CardRaceData; section: RaceSection }) => {
      return (
        <RaceListRow
          race={item}
          variant={section.variant}
          dimmed={section.dimmed}
          prepProgress={prepProgressMap?.[item.id] ?? null}
          onPress={onRacePress}
        />
      );
    },
    [onRacePress, prepProgressMap],
  );

  // Row separator
  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  // Section separator
  const renderSectionSeparator = useCallback(
    () => <View style={styles.sectionSeparator} />,
    [],
  );

  // Empty state
  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Calendar size={40} color={IOS_COLORS.systemGray3} />
        <Text style={styles.emptyTitle}>No Races</Text>
        <Text style={styles.emptySubtitle}>
          {filterSegment === 'past'
            ? 'No past races to show'
            : 'Add a race to get started with your preparation'}
        </Text>
      </View>
    ),
    [filterSegment],
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ItemSeparatorComponent={renderSeparator}
      SectionSeparatorComponent={renderSectionSeparator}
      ListEmptyComponent={renderEmpty}
      stickySectionHeadersEnabled={true}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={IOS_COLORS.systemBlue}
          />
        ) : undefined
      }
      style={styles.list}
    />
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  contentContainer: {
    paddingBottom: IOS_SPACING.xxxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg + 16, // 16 for inset margin
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    gap: IOS_SPACING.sm,
  },
  sectionTitle: {
    ...IOS_TYPOGRAPHY.footnote,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  sectionCount: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.systemGray,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: IOS_SPACING.lg + 48 + IOS_SPACING.md, // Align with text after countdown
  },
  sectionSeparator: {
    height: IOS_SPACING.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: IOS_SPACING.xxxl,
    gap: IOS_SPACING.md,
  },
  emptyTitle: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
  },
  emptySubtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});
