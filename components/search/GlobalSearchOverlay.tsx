/**
 * GlobalSearchOverlay - Full-screen search modal overlay
 *
 * Slides up from the bottom with auto-focused search input.
 * Searches races, sailors, venues, and boat classes via GlobalSearchService.
 */

import { IOS_COLORS } from '@/lib/design-tokens-ios';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// ── Suggested searches ──────────────────────────────────────────────

interface SearchSuggestion {
  label: string;
  query: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SUGGESTED_SEARCHES: { category: string; icon: keyof typeof Ionicons.glyphMap; color: string; suggestions: SearchSuggestion[] }[] = [
  {
    category: 'Races',
    icon: 'flag-outline',
    color: IOS_COLORS.systemBlue,
    suggestions: [
      { label: 'Weekend regattas', query: 'regatta', icon: 'flag-outline' },
      { label: 'Frostbite series', query: 'frostbite', icon: 'flag-outline' },
      { label: 'Club championships', query: 'championship', icon: 'flag-outline' },
    ],
  },
  {
    category: 'Venues',
    icon: 'location-outline',
    color: IOS_COLORS.systemGreen,
    suggestions: [
      { label: 'Local sailing clubs', query: 'yacht club', icon: 'location-outline' },
      { label: 'Harbor venues', query: 'harbor', icon: 'location-outline' },
    ],
  },
  {
    category: 'Boat Classes',
    icon: 'boat-outline',
    color: IOS_COLORS.systemOrange,
    suggestions: [
      { label: 'Laser / ILCA', query: 'laser', icon: 'boat-outline' },
      { label: 'J/24', query: 'J/24', icon: 'boat-outline' },
      { label: '420', query: '420', icon: 'boat-outline' },
    ],
  },
];

function SearchSuggestions({ onSuggestionPress }: { onSuggestionPress: (query: string) => void }) {
  return (
    <ScrollView
      style={suggestStyles.container}
      contentContainerStyle={suggestStyles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={suggestStyles.heading}>Try searching for</Text>

      {SUGGESTED_SEARCHES.map((group) => (
        <View key={group.category} style={suggestStyles.group}>
          <View style={suggestStyles.groupHeader}>
            <Ionicons name={group.icon} size={14} color={group.color} />
            <Text style={[suggestStyles.groupTitle, { color: group.color }]}>
              {group.category.toUpperCase()}
            </Text>
          </View>
          {group.suggestions.map((item) => (
            <Pressable
              key={item.query}
              style={({ pressed }) => [
                suggestStyles.suggestion,
                pressed && suggestStyles.suggestionPressed,
              ]}
              onPress={() => onSuggestionPress(item.query)}
            >
              <Ionicons
                name="search"
                size={16}
                color={IOS_COLORS.systemGray2}
                style={suggestStyles.suggestionIcon}
              />
              <Text style={suggestStyles.suggestionText}>{item.label}</Text>
              <Ionicons
                name="arrow-up-outline"
                size={14}
                color={IOS_COLORS.systemGray3}
                style={{ transform: [{ rotate: '-45deg' }] }}
              />
            </Pressable>
          ))}
        </View>
      ))}

      <View style={suggestStyles.browseSection}>
        <Text style={suggestStyles.browseTitle}>Browse by category</Text>
        <View style={suggestStyles.browsePills}>
          {(['Races', 'Sailors', 'Venues', 'Boat Classes'] as const).map((cat) => {
            const meta = {
              Races: { icon: 'flag-outline' as const, color: IOS_COLORS.systemBlue },
              Sailors: { icon: 'people-outline' as const, color: IOS_COLORS.systemPurple },
              Venues: { icon: 'location-outline' as const, color: IOS_COLORS.systemGreen },
              'Boat Classes': { icon: 'boat-outline' as const, color: IOS_COLORS.systemOrange },
            }[cat];
            return (
              <Pressable
                key={cat}
                style={({ pressed }) => [
                  suggestStyles.browsePill,
                  { borderColor: `${meta.color}30` },
                  pressed && { backgroundColor: `${meta.color}10` },
                ]}
                onPress={() => onSuggestionPress(cat === 'Boat Classes' ? 'class' : cat.toLowerCase().slice(0, -1))}
              >
                <Ionicons name={meta.icon} size={16} color={meta.color} />
                <Text style={[suggestStyles.browsePillText, { color: meta.color }]}>{cat}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const suggestStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 60,
  },
  heading: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  group: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  suggestionPressed: {
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 8,
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 17,
    color: IOS_COLORS.label,
  },
  browseSection: {
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  browseTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  browsePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  browsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  browsePillText: {
    fontSize: 15,
    fontWeight: '500',
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
  }, [query, user?.id]);

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
          router.push('/(tabs)/venue' as any);
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
              placeholder="Search races, sailors, venues..."
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
            <SearchSuggestions
              onSuggestionPress={(suggestion) => setQuery(suggestion)}
            />
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
