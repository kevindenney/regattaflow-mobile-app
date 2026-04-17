import React from 'react';
import { View, StyleSheet } from 'react-native';

import { HeroSection } from '@/components/landing/HeroSection';
import { InterestCatalogSection } from '@/components/landing/InterestCatalogSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { Footer } from '@/components/landing/Footer';

export function SimpleLandingPage() {
  return (
    <View style={styles.container}>
      <HeroSection />
      <InterestCatalogSection />
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
