/**
 * How It Works — The BetterAt model explained.
 * Three Phases, Vocabulary table, featured interest examples.
 * Web-only page; native redirects to signup.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SimpleLandingNav } from '@/components/landing/SimpleLandingNav';
import { ThreePhasesSection } from '@/components/landing/ThreePhasesSection';
import { VocabularySection } from '@/components/landing/VocabularySection';
import { InterestCardsSection } from '@/components/landing/InterestCardsSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { Footer } from '@/components/landing/Footer';

export default function HowItWorksPage() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDesktop = mounted && width > 768;

  // Native: redirect to signup — this is a web marketing page
  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/(auth)/signup');
    }
  }, []);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <SimpleLandingNav />

      {/* Page header */}
      <View style={styles.header}>
        <Text style={[styles.heading, isDesktop && styles.headingDesktop]}>
          How BetterAt Works
        </Text>
        <Text style={styles.subheading}>
          One engine. Any discipline. Plan, Do, Review.
        </Text>
      </View>

      <ThreePhasesSection />
      <VocabularySection />
      <InterestCardsSection />
      <FinalCtaSection />
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    minHeight: '100vh' as any,
  },
  header: {
    paddingTop: 120,
    paddingBottom: 48,
    paddingHorizontal: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  heading: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  headingDesktop: {
    fontSize: 52,
  },
  subheading: {
    fontSize: 18,
    color: '#BFDBFE',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 480,
  },
});
