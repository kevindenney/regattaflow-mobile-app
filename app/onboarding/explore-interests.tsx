/**
 * Explore Interests Screen
 *
 * "Interested in anything else?" — shown near the end of onboarding.
 * Lets users discover and add additional interests before entering the app.
 * Completely skippable — a discovery moment, not a gate.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useInterest, type Interest } from '@/providers/InterestProvider';
import { getOnboardingContext } from '@/lib/onboarding/interestContext';

export default function ExploreInterestsScreen() {
  const router = useRouter();
  const { allInterests, userInterests, setInterestVisibility, switchInterest } = useInterest();

  const [interestSlug, setInterestSlug] = useState<string | null>(null);
  const [addedSlugs, setAddedSlugs] = useState<Set<string>>(new Set());

  // Initialize with only the primary onboarding interest as selected
  useEffect(() => {
    AsyncStorage.getItem('onboarding_interest_slug').then((slug) => {
      console.log('[ExploreInterests] loaded onboarding_interest_slug from AsyncStorage:', JSON.stringify(slug));
      setInterestSlug(slug);
      if (slug) {
        setAddedSlugs(new Set([slug]));
      }
    });
  }, []);

  const ctx = getOnboardingContext(interestSlug || undefined);
  const accentColor = ctx.color !== '#1A1A1A' ? ctx.color : '#2563EB';

  // Show public, active interests — exclude the domain-level parents
  const browsableInterests = useMemo(() => {
    return allInterests.filter(
      (i) =>
        i.status === 'active' &&
        i.visibility === 'public' &&
        i.type !== 'domain',
    );
  }, [allInterests]);

  const handleToggleInterest = useCallback(
    (interest: Interest) => {
      const isAdded = addedSlugs.has(interest.slug);

      // Don't allow removing the primary interest they signed up with
      if (isAdded && interest.slug === interestSlug) return;

      setAddedSlugs((prev) => {
        const next = new Set(prev);
        if (isAdded) {
          next.delete(interest.slug);
        } else {
          next.add(interest.slug);
        }
        return next;
      });
    },
    [addedSlugs, interestSlug],
  );

  const handleContinue = useCallback(async () => {
    console.log('[ExploreInterests] handleContinue called', {
      interestSlug,
      addedSlugs: Array.from(addedSlugs),
      browsableCount: browsableInterests.length,
    });

    // Set primary interest FIRST — before hiding others — so the InterestProvider's
    // auto-set effect doesn't pick the first alphabetical interest (e.g. Drawing) when
    // activeSlug is null for new users.
    if (interestSlug) {
      console.log('[ExploreInterests] calling switchInterest with:', interestSlug);
      await switchInterest(interestSlug);
      console.log('[ExploreInterests] switchInterest completed');
    } else {
      console.warn('[ExploreInterests] interestSlug is NULL — cannot set primary interest!');
    }

    // Compute visible/hidden slug arrays up front — single batch call avoids stale closure issues
    const visibleSlugs = browsableInterests.filter(i => addedSlugs.has(i.slug)).map(i => i.slug);
    const hiddenSlugs = browsableInterests.filter(i => !addedSlugs.has(i.slug)).map(i => i.slug);
    console.log('[ExploreInterests] visibility:', { visibleSlugs, hiddenSlugs: hiddenSlugs.length });
    await setInterestVisibility(visibleSlugs, hiddenSlugs);

    // Store ordered interest slugs so manifesto screen can loop through them
    // Primary interest first
    const primaryFirst = [interestSlug, ...visibleSlugs.filter(s => s !== interestSlug)].filter(Boolean);
    console.log('[ExploreInterests] writing onboarding_interest_order:', JSON.stringify(primaryFirst));
    await AsyncStorage.setItem('onboarding_interest_order', JSON.stringify(primaryFirst));

    // Continue to manifesto screen (skippable — handles its own nav to main app)
    router.replace('/onboarding/manifesto');
  }, [router, browsableInterests, addedSlugs, setInterestVisibility, switchInterest, interestSlug]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Headline */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500).springify()}
            style={styles.headlineContainer}
          >
            <Text style={styles.headline}>Interested in anything else?</Text>
            <Text style={styles.subheadline}>
              BetterAt supports many interests. You can always add or remove these later.
            </Text>
          </Animated.View>

          {/* Interest Grid */}
          <Animated.View
            entering={FadeIn.delay(300).duration(400)}
            style={styles.grid}
          >
            {browsableInterests.map((interest, index) => {
              const isAdded = addedSlugs.has(interest.slug);
              const isPrimary = interest.slug === interestSlug;
              const chipColor = interest.accent_color || '#64748B';

              return (
                <Animated.View
                  key={interest.id}
                  entering={FadeIn.delay(350 + index * 40).duration(300)}
                >
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      isAdded && { backgroundColor: chipColor + '15', borderColor: chipColor },
                    ]}
                    onPress={() => handleToggleInterest(interest)}
                    activeOpacity={0.7}
                    disabled={isPrimary}
                  >
                    {interest.icon_name && (
                      <Ionicons
                        name={(interest.icon_name as keyof typeof Ionicons.glyphMap) || 'compass'}
                        size={16}
                        color={isAdded ? chipColor : '#94A3B8'}
                      />
                    )}
                    <Text
                      style={[
                        styles.chipText,
                        isAdded && { color: chipColor, fontWeight: '600' },
                      ]}
                    >
                      {interest.name}
                    </Text>
                    {isAdded && (
                      <Ionicons
                        name={isPrimary ? 'star' : 'checkmark-circle'}
                        size={16}
                        color={chipColor}
                      />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <Animated.View
          entering={FadeIn.delay(500).duration(300)}
          style={styles.footer}
        >
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: accentColor, shadowColor: accentColor }]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 24,
  },
  headlineContainer: {
    marginBottom: 32,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subheadline: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  chipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 24 : 36,
  },
  continueButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
