import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export function HeroSection() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);
  const { enterGuestMode } = useAuth();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;

  return (
    <LinearGradient
      colors={['#1A1A1A', '#2D3748', '#1A1A1A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        <Text style={[styles.headline, isDesktop && styles.headlineDesktop]}>
          Get better at{'\n'}what matters to you.
        </Text>
        <Text style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}>
          BetterAt gives you the structure, tools, and coaching to improve —
          whatever your discipline. Plan. Do. Review.
        </Text>

        {/* CTAs */}
        <View style={[styles.ctaRow, isDesktop && styles.ctaRowDesktop]}>
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={() => router.push('/(auth)/signup')}
            accessibilityRole="button"
            accessibilityLabel="Get Started Free"
          >
            <Text style={styles.primaryCtaText}>Get Started Free</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={() => enterGuestMode()}
            accessibilityRole="button"
            accessibilityLabel="Explore the App"
          >
            <Text style={styles.secondaryCtaText}>Explore the App</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.trustLine}>No credit card required</Text>

        {/* Interest pills */}
        <View style={styles.personaPills}>
          {[
            { name: 'Sail Racing', slug: 'sail-racing', color: '#003DA5' },
            { name: 'Nursing', slug: 'nursing', color: '#0097A7' },
            { name: 'Drawing', slug: 'drawing', color: '#E64A19' },
            { name: 'Health & Fitness', slug: 'health-and-fitness', color: '#2E7D32' },
          ].map((interest) => (
            <TouchableOpacity
              key={interest.slug}
              style={[styles.personaPill, { borderColor: `${interest.color}80`, backgroundColor: `${interest.color}20` }]}
              onPress={() => router.push(`/${interest.slug}` as any)}
            >
              <Text style={styles.personaPillText}>{interest.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign-in link */}
        <View style={styles.signInRow}>
          <Text style={styles.signInLabel}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.signInLink}> Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 120,
    paddingBottom: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  content: {
    maxWidth: 700,
    width: '100%',
    alignItems: 'center',
  },
  contentDesktop: {
    maxWidth: 800,
  },

  headline: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  headlineDesktop: {
    fontSize: 56,
  },
  subtitle: {
    fontSize: 18,
    color: '#BFDBFE',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 560,
    marginBottom: 32,
  },
  subtitleDesktop: {
    fontSize: 20,
    lineHeight: 30,
  },

  ctaRow: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
  },
  ctaRowDesktop: {
    flexDirection: 'row',
    maxWidth: 420,
  },

  primaryCta: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  secondaryCta: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  secondaryCtaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  trustLine: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },

  personaPills: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  personaPill: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'background-color 0.2s' },
    }),
  },
  personaPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
});
