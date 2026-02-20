import React from 'react';
import { View, StyleSheet } from 'react-native';

import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { Footer } from '@/components/landing/Footer';

export function SimpleLandingPage() {
  return (
    <View style={styles.container}>
      <HeroSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
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
