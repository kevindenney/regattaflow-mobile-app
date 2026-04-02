/**
 * InterestSelection — Fullscreen onboarding modal for first-time users.
 *
 * Shown when a user has no preferred interest set. Presents a grid of
 * available interests and lets the user pick one before continuing into
 * the app. The selection is committed via `switchInterest()` from the
 * InterestProvider only when the user taps "Continue".
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInterest, type Interest } from '@/providers/InterestProvider';

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
  const { allInterests, groupedInterests, switchInterest, addInterest, loading: interestsLoading } = useInterest();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  // Responsive column count
  const numColumns = screenWidth >= 768 ? 4 : 2;
  const gap = 12;
  const containerPadding = 20;
  const cardWidth = (screenWidth - containerPadding * 2 - gap * (numColumns - 1)) / numColumns;

  const handleSelect = useCallback((slug: string) => {
    setSelectedSlug(slug);
  }, []);

  const handleContinue = useCallback(async () => {
    if (!selectedSlug || committing) return;

    setCommitting(true);
    try {
      await addInterest(selectedSlug);
      await switchInterest(selectedSlug);
      onComplete();
    } catch (error) {
      console.warn('[InterestSelection] Failed to switch interest:', error);
    } finally {
      setCommitting(false);
    }
  }, [selectedSlug, committing, addInterest, switchInterest, onComplete]);

  const renderInterestCard = (interest: Interest) => {
    const isSelected = selectedSlug === interest.slug;
    const accentColor = interest.accent_color || '#2563EB';
    const tagline = interest.hero_tagline || interest.description || '';

    return (
      <Pressable
        key={interest.id}
        style={({ pressed }) => [
          styles.card,
          { width: cardWidth, borderLeftColor: accentColor },
          isSelected && styles.cardSelected,
          isSelected && { borderColor: accentColor },
          pressed && styles.cardPressed,
        ]}
        onPress={() => handleSelect(interest.slug)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${interest.name}. ${tagline}`}
      >
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
  };

  const showDomainHeaders = groupedInterests.length > 1;

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
        ) : showDomainHeaders ? (
          <ScrollView
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          >
            {groupedInterests.map((group) => {
              if (group.interests.length === 0) return null;
              return (
                <View key={group.domain.slug} style={styles.domainSection}>
                  <View style={styles.domainHeaderRow}>
                    <View style={[styles.domainAccent, { backgroundColor: group.domain.accent_color }]} />
                    <Text style={styles.domainHeaderText}>{group.domain.name}</Text>
                  </View>
                  <View style={[styles.cardGrid, { gap }]}>
                    {group.interests.map(renderInterestCard)}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.cardGrid, { gap }]}>
              {allInterests.map(renderInterestCard)}
            </View>
          </ScrollView>
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

  // Domain sections
  domainSection: {
    marginBottom: 20,
  },
  domainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 8,
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
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Card
  card: {
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
