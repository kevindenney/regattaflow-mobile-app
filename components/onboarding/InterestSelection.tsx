/**
 * InterestSelection — Fullscreen onboarding modal for first-time users.
 *
 * Shown when a user has no preferred interest set. Presents a grid of
 * available interests and lets the user pick one before continuing into
 * the app. The selection is committed via `switchInterest()` from the
 * InterestProvider only when the user taps "Continue".
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInterest, type Interest } from '@/providers/InterestProvider';

// A union type for flat list items: either a domain header or an interest card
type GridItem =
  | { type: 'domain-header'; id: string; name: string; accentColor: string }
  | { type: 'interest'; id: string; interest: Interest };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface InterestSelectionProps {
  /** Whether to show the modal */
  visible: boolean;
  /** Called after an interest has been selected and persisted */
  onComplete: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InterestSelection({ visible, onComplete }: InterestSelectionProps) {
  const { userInterests, groupedInterests, switchInterest, loading: interestsLoading } = useInterest();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  // Responsive column count: 4 on wide screens (tablet/web), 2 on mobile
  const isWide = screenWidth >= 768;
  const numColumns = isWide ? 4 : 2;

  // Build a flat list with domain header items interspersed.
  // FlatList with numColumns can't use SectionList, so we insert
  // full-width header items and pad with invisible spacers.
  const gridItems = useMemo<GridItem[]>(() => {
    // If only 1 domain group, skip headers
    if (groupedInterests.length <= 1) {
      return userInterests.map((i) => ({ type: 'interest' as const, id: i.id, interest: i }));
    }

    const items: GridItem[] = [];
    for (const group of groupedInterests) {
      const matching = group.interests.filter((gi) =>
        userInterests.some((ui) => ui.slug === gi.slug),
      );
      if (matching.length === 0) continue;

      // Domain header + (numColumns - 1) spacer slots to fill the row
      items.push({
        type: 'domain-header',
        id: `header-${group.domain.slug}`,
        name: group.domain.name,
        accentColor: group.domain.accent_color,
      });
      // Pad remaining columns in header row with invisible spacers
      for (let i = 1; i < numColumns; i++) {
        items.push({
          type: 'domain-header',
          id: `header-${group.domain.slug}-spacer-${i}`,
          name: '',
          accentColor: 'transparent',
        });
      }

      for (const interest of matching) {
        items.push({ type: 'interest', id: interest.id, interest });
      }
    }

    return items;
  }, [userInterests, groupedInterests, numColumns]);

  // ------ Handlers ------

  const handleSelect = useCallback((slug: string) => {
    setSelectedSlug(slug);
  }, []);

  const handleContinue = useCallback(async () => {
    if (!selectedSlug || committing) return;

    setCommitting(true);
    try {
      await switchInterest(selectedSlug);
      onComplete();
    } catch (error) {
      console.warn('[InterestSelection] Failed to switch interest:', error);
    } finally {
      setCommitting(false);
    }
  }, [selectedSlug, committing, switchInterest, onComplete]);

  // ------ Render helpers ------

  const renderItem = useCallback(
    ({ item }: { item: GridItem }) => {
      if (item.type === 'domain-header') {
        // The first item in each header row shows the label; spacers are invisible
        if (!item.name) return <View style={styles.card} />;
        return (
          <View style={styles.domainHeaderRow}>
            <View style={[styles.domainAccent, { backgroundColor: item.accentColor }]} />
            <Text style={styles.domainHeaderText}>{item.name}</Text>
          </View>
        );
      }

      const interest = item.interest;
      const isSelected = selectedSlug === interest.slug;
      const accentColor = interest.accent_color || '#2563EB';
      const tagline = interest.hero_tagline || interest.description || '';

      return (
        <Pressable
          style={({ pressed }) => [
            styles.card,
            { borderLeftColor: accentColor },
            isSelected && styles.cardSelected,
            isSelected && { borderColor: accentColor },
            pressed && styles.cardPressed,
          ]}
          onPress={() => handleSelect(interest.slug)}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={`${interest.name}. ${tagline}`}
        >
          {/* Checkmark overlay */}
          {isSelected && (
            <View style={[styles.checkBadge, { backgroundColor: accentColor }]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}

          <Text style={styles.cardName} numberOfLines={1}>
            {interest.name}
          </Text>

          {tagline ? (
            <Text style={styles.cardTagline} numberOfLines={2}>
              {tagline}
            </Text>
          ) : null}
        </Pressable>
      );
    },
    [selectedSlug, handleSelect],
  );

  const keyExtractor = useCallback((item: GridItem) => item.id, []);

  // ------ Main render ------

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => {
        // Android back-button: no-op because we require a selection
      }}
    >
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What are you{'\n'}getting better at?</Text>
          <Text style={styles.subtitle}>You can always change this later.</Text>
        </View>

        {/* Interest grid */}
        {interestsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#64748B" />
          </View>
        ) : (
          <FlatList
            key={`grid-${numColumns}`}
            data={gridItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={numColumns}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Continue button */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              !selectedSlug && styles.continueButtonDisabled,
              pressed && selectedSlug ? styles.continueButtonPressed : null,
            ]}
            onPress={handleContinue}
            disabled={!selectedSlug || committing}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityState={{ disabled: !selectedSlug || committing }}
          >
            {committing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.continueButtonText,
                  !selectedSlug && styles.continueButtonTextDisabled,
                ]}
              >
                Continue
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 20,
  },

  // Header
  header: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 38,
    letterSpacing: -0.3,
    marginBottom: 8,
    ...Platform.select({
      ios: { fontFamily: 'Manrope-Bold' },
      android: { fontFamily: 'Manrope-Bold' },
      web: { fontFamily: 'Manrope, system-ui, sans-serif', fontWeight: '700' as const },
    }),
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 22,
    ...Platform.select({
      ios: { fontFamily: 'Manrope-Regular' },
      android: { fontFamily: 'Manrope-Regular' },
      web: { fontFamily: 'Manrope, system-ui, sans-serif' },
    }),
  },

  // Domain header
  domainHeaderRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  domainAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  domainHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    ...Platform.select({
      ios: { fontFamily: 'Manrope-Bold' },
      android: { fontFamily: 'Manrope-Bold' },
      web: { fontFamily: 'Manrope, system-ui, sans-serif', fontWeight: '700' as const },
    }),
  },

  // Grid
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    paddingBottom: 16,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 16,
    minHeight: 96,
    justifyContent: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: '#FAFCFF',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    ...Platform.select({
      ios: { fontFamily: 'Manrope-Bold' },
      android: { fontFamily: 'Manrope-Bold' },
      web: { fontFamily: 'Manrope, system-ui, sans-serif', fontWeight: '700' as const },
    }),
  },
  cardTagline: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    ...Platform.select({
      ios: { fontFamily: 'Manrope-Regular' },
      android: { fontFamily: 'Manrope-Regular' },
      web: { fontFamily: 'Manrope, system-ui, sans-serif' },
    }),
  },

  // Checkmark badge
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Footer
  footer: {
    paddingTop: 12,
  },
  continueButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    ...Platform.select({
      ios: { fontFamily: 'Manrope-Bold' },
      android: { fontFamily: 'Manrope-Bold' },
      web: { fontFamily: 'Manrope, system-ui, sans-serif', fontWeight: '700' as const },
    }),
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

export default InterestSelection;
