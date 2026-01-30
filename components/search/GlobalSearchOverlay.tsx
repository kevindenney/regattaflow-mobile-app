/**
 * GlobalSearchOverlay - Full-screen search modal overlay
 *
 * Slides up from the bottom with auto-focused search input.
 * Searches races, sailors, venues, and boat classes via GlobalSearchService.
 *
 * Empty state organised by user behavior (WWDC25 Discoverable Design):
 *   1. "Try searching for..." — concrete example queries
 *   2. "Quick Access" — behavior-based chip strip
 *   3. "Recent" — conditional recents (progressive disclosure)
 */

import { useRecentSearches } from '@/hooks/useRecentSearches';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { useAuth } from '@/providers/AuthProvider';
import {
  GlobalSearchService,
  type BoatClassSearchResult,
  type RaceSearchResult,
  type SailorSearchResult,
  type SearchResults,
  type VenueSearchResult,
} from '@/services/search/GlobalSearchService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SuggestedSailorsSection } from './SuggestedSailorsSection';
import { InviteFriendsBanner } from './InviteFriendsBanner';

interface GlobalSearchOverlayProps {
  visible: boolean;
  onClose: () => void;
}

// ── Section helpers ─────────────────────────────────────────────────

type SearchCategory = 'races' | 'sailors' | 'venues' | 'boatClasses';

interface SectionData {
  key: SearchCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  data: (RaceSearchResult | SailorSearchResult | VenueSearchResult | BoatClassSearchResult)[];
}

const CATEGORY_META: Record<SearchCategory, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  races: { label: 'Races', icon: 'flag-outline' },
  sailors: { label: 'Sailors', icon: 'people-outline' },
  venues: { label: 'Venues', icon: 'location-outline' },
  boatClasses: { label: 'Boat Classes', icon: 'boat-outline' },
};

function buildSections(results: SearchResults): SectionData[] {
  const order: SearchCategory[] = ['races', 'sailors', 'venues', 'boatClasses'];
  return order
    .filter((cat) => results[cat].length > 0)
    .map((cat) => ({
      key: cat,
      label: CATEGORY_META[cat].label,
      icon: CATEGORY_META[cat].icon,
      data: results[cat],
    }));
}

// ── Empty-state data ────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  'Frostbite Series',
  'Royal Hong Kong YC',
  'ILCA 7',
  'Jane Smith',
];

const QUICK_ACCESS_CHIPS: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; query: string }[] = [
  { label: 'Upcoming races', icon: 'calendar-outline', color: IOS_COLORS.systemBlue, query: 'upcoming' },
  { label: 'Nearby venues', icon: 'navigate-outline', color: IOS_COLORS.systemGreen, query: 'nearby' },
  { label: 'My fleet', icon: 'boat-outline', color: IOS_COLORS.systemOrange, query: 'fleet' },
  { label: 'Popular classes', icon: 'trophy-outline', color: IOS_COLORS.systemPurple, query: 'popular class' },
];

// ── Empty-state sub-sections ────────────────────────────────────────

function SearchExamples({ onPress }: { onPress: (query: string) => void }) {
  return (
    <View style={emptyStyles.section}>
      <Text style={emptyStyles.sectionLabel}>TRY SEARCHING FOR&hellip;</Text>
      <View style={emptyStyles.card}>
        {EXAMPLE_QUERIES.map((example, index) => (
          <React.Fragment key={example}>
            {index > 0 && <View style={emptyStyles.insetSeparator} />}
            <TouchableOpacity
              style={emptyStyles.exampleRow}
              activeOpacity={0.6}
              onPress={() => onPress(example)}
            >
              <View style={emptyStyles.iconWrap}>
                <Ionicons name="search" size={16} color={IOS_COLORS.systemGray} />
              </View>
              <Text style={emptyStyles.exampleText}>{example}</Text>
              <Ionicons name="arrow-forward" size={15} color={IOS_COLORS.tertiaryLabel} />
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

function QuickAccessChips({ onPress }: { onPress: (query: string) => void }) {
  return (
    <View style={emptyStyles.chipSection}>
      <Text style={emptyStyles.chipSectionLabel}>QUICK ACCESS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={emptyStyles.chipStrip}
      >
        {QUICK_ACCESS_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip.label}
            style={emptyStyles.chip}
            activeOpacity={0.7}
            onPress={() => onPress(chip.query)}
          >
            <Ionicons name={chip.icon} size={16} color={chip.color} />
            <Text style={emptyStyles.chipLabel}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function RecentSearches({
  recents,
  onPress,
  onClear,
}: {
  recents: string[];
  onPress: (query: string) => void;
  onClear: () => void;
}) {
  if (recents.length === 0) return null;

  return (
    <View style={emptyStyles.section}>
      <View style={emptyStyles.sectionHeaderRow}>
        <Text style={emptyStyles.sectionLabel}>RECENT</Text>
        <Pressable onPress={onClear} hitSlop={8}>
          <Text style={emptyStyles.clearButton}>Clear</Text>
        </Pressable>
      </View>
      <View style={emptyStyles.card}>
        {recents.map((q, index) => (
          <React.Fragment key={q}>
            {index > 0 && <View style={emptyStyles.insetSeparator} />}
            <TouchableOpacity
              style={emptyStyles.exampleRow}
              activeOpacity={0.6}
              onPress={() => onPress(q)}
            >
              <View style={emptyStyles.iconWrap}>
                <Ionicons name="time-outline" size={16} color={IOS_COLORS.systemGray} />
              </View>
              <Text style={emptyStyles.exampleText}>{q}</Text>
              <Ionicons name="chevron-forward" size={15} color={IOS_COLORS.tertiaryLabel} />
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ── Empty-state styles ──────────────────────────────────────────────

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 60,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  chipSection: {
    marginBottom: 24,
    marginHorizontal: -16, // let horizontal ScrollView bleed to screen edges
  },
  chipSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 20, // 16 (parent negative offset) + 4 (original inset)
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 4,
  },
  clearButton: {
    fontSize: 15,
    color: IOS_COLORS.systemBlue,
    fontWeight: '400',
  },

  // Inset grouped card
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 10,
    overflow: 'hidden',
  },
  insetSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 44,
  },

  // Example / recent rows
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    minHeight: 44,
  },
  iconWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleText: {
    flex: 1,
    fontSize: 17,
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },

  // Chip strip
  chipStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 20,
    paddingRight: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },

  // Sailor suggestions
  suggestionsSection: {
    marginTop: IOS_SPACING.md,
  },
});

// ── Component ───────────────────────────────────────────────────────

export default function GlobalSearchOverlay({
  visible,
  onClose,
}: GlobalSearchOverlayProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { recentSearches, addRecentSearch, clearRecent } = useRecentSearches();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Auto-focus when modal opens
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
      setResults(null);
      setSearched(false);
      setLoading(false);
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults(null);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await GlobalSearchService.search(query, user?.id ?? '');
        setResults(res);
        addRecentSearch(query);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, user?.id, addRecentSearch]);

  const handleClose = useCallback(() => {
    inputRef.current?.blur();
    onClose();
  }, [onClose]);

  // Navigation on row tap
  const handlePress = useCallback(
    (category: SearchCategory, item: { id: string }) => {
      handleClose();
      switch (category) {
        case 'races':
          router.push(`/(tabs)/race/scrollable/${item.id}` as any);
          break;
        case 'sailors':
          router.push('/(tabs)/discover' as any);
          break;
        case 'venues':
          router.push(`/venue/${item.id}` as any);
          break;
        case 'boatClasses':
          // Navigate to discover as a safe fallback
          router.push('/(tabs)/discover' as any);
          break;
      }
    },
    [handleClose, router],
  );

  // ── Render helpers ────────────────────────────────────────────────

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={section.icon} size={14} color={IOS_COLORS.secondaryLabel} />
      <Text style={styles.sectionHeaderText}>
        {section.label.toUpperCase()} ({section.data.length})
      </Text>
    </View>
  );

  const renderItem = ({
    item,
    section,
  }: {
    item: RaceSearchResult | SailorSearchResult | VenueSearchResult | BoatClassSearchResult;
    section: SectionData;
  }) => {
    const iconName = CATEGORY_META[section.key].icon;

    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => handlePress(section.key, item)}
      >
        <View style={styles.rowIcon}>
          <Ionicons name={iconName} size={22} color={IOS_COLORS.systemBlue} />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {'subtitle' in item && item.subtitle ? (
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={IOS_COLORS.systemGray3}
        />
      </Pressable>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  // ── Content area ──────────────────────────────────────────────────

  const sections = results ? buildSections(results) : [];
  const hasResults = sections.length > 0;
  const showEmpty = query.trim().length === 0;
  const showNoResults = searched && !loading && !hasResults && !showEmpty;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Search header */}
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={18}
              color={IOS_COLORS.systemGray}
              style={styles.searchIcon}
            />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Race name, club, or boat class..."
              placeholderTextColor={IOS_COLORS.systemGray2}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </Pressable>
        </View>

        {/* Results area */}
        <View style={styles.content}>
          {showEmpty ? (
            <ScrollView
              style={emptyStyles.container}
              contentContainerStyle={emptyStyles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <SearchExamples onPress={(q) => setQuery(q)} />
              <QuickAccessChips onPress={(q) => setQuery(q)} />
              <RecentSearches
                recents={recentSearches}
                onPress={(q) => setQuery(q)}
                onClear={clearRecent}
              />
              {/* Sailor suggestions for discovery */}
              <View style={emptyStyles.suggestionsSection}>
                <SuggestedSailorsSection onSailorPress={handleClose} />
              </View>
              {/* Invite friends CTA */}
              <InviteFriendsBanner />
            </ScrollView>
          ) : loading && !hasResults ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
            </View>
          ) : showNoResults ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={48}
                color={IOS_COLORS.systemGray4}
              />
              <Text style={styles.emptySubtitle}>
                No results for &ldquo;{query.trim()}&rdquo;
              </Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader as any}
              ItemSeparatorComponent={renderSeparator}
              stickySectionHeadersEnabled={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
    ...Platform.select({
      web: {
        backgroundColor: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(20px)',
      } as any,
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: IOS_COLORS.label,
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
      default: {},
    }),
  },
  cancelButton: {
    fontSize: 17,
    color: IOS_COLORS.systemBlue,
    fontWeight: '400',
  },
  content: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  listContent: {
    paddingBottom: 32,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 16,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 52,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  rowPressed: {
    backgroundColor: IOS_COLORS.systemGray6,
  },
  rowIcon: {
    width: 36,
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  rowSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 56,
  },

  // Empty / loading states
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
});
