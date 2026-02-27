import React from 'react';
import { View, StyleSheet } from 'react-native';

import { HeroSection } from '@/components/landing/HeroSection';
import { ThreePhasesSection } from '@/components/landing/ThreePhasesSection';
import { VocabularySection } from '@/components/landing/VocabularySection';
import { InterestCardsSection } from '@/components/landing/InterestCardsSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { Footer } from '@/components/landing/Footer';

export function SimpleLandingPage() {
  return (
    <View style={styles.container}>
      <HeroSection />
      <ThreePhasesSection />
      <VocabularySection />
      <InterestCardsSection />
      <FinalCtaSection />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
