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
import { SearchBar } from './SearchBar';

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

        {/* Search */}
        <View style={styles.searchWrapper}>
          <SearchBar />
        </View>

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

        {/* Sign-in + how it works */}
        <View style={styles.signInRow}>
          <Text style={styles.signInLabel}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.signInLink}> Log In</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.howItWorksLink}
          onPress={() => router.push('/how-it-works' as any)}
        >
          <Text style={styles.howItWorksText}>See how it works →</Text>
        </TouchableOpacity>
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
    marginBottom: 28,
  },
  subtitleDesktop: {
    fontSize: 20,
    lineHeight: 30,
  },

  searchWrapper: {
    width: '100%',
    marginBottom: 28,
    zIndex: 50,
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

  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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

  howItWorksLink: {
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  howItWorksText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
