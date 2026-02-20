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

export function FinalCtaSection() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);
  const { enterGuestMode } = useAuth();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;

  return (
    <LinearGradient
      colors={['#0A2463', '#1E3A6E']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={[styles.headline, isDesktop && styles.headlineDesktop]}>
          Ready to Race Smarter?
        </Text>
        <Text style={styles.subtitle}>
          Join competitive sailors using AI to prepare, race, and improve.
        </Text>

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

        <Text style={styles.trustLine}>
          Free forever on the Starter plan. No credit card required.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  content: {
    maxWidth: 600,
    width: '100%',
    alignItems: 'center',
  },

  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  headlineDesktop: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#BFDBFE',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
    maxWidth: 480,
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
    color: '#0A2463',
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
    textAlign: 'center',
  },
});
