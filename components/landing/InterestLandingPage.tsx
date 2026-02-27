import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { SimpleLandingNav } from './SimpleLandingNav';
import { Footer } from './Footer';
import { ScrollFix } from './ScrollFix';

interface InterestLandingPageProps {
  name: string;
  slug: string;
  color: string;
  icon: string;
  tagline: string;
  description: string;
  phases: {
    plan: { title: string; bullets: string[] };
    do_: { title: string; bullets: string[] };
    review: { title: string; bullets: string[] };
  };
  audiences?: { title: string; description: string }[];
  features: { title: string; description: string; icon: string }[];
}

export function InterestLandingPage({
  name,
  slug,
  color,
  icon,
  tagline,
  description,
  phases,
  audiences,
  features,
}: InterestLandingPageProps) {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);
  const { enterGuestMode } = useAuth();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;

  return (
    <View style={styles.container}>
      <ScrollFix />
      <SimpleLandingNav />

      {/* Hero */}
      <LinearGradient
        colors={[color, adjustColor(color, 30), color]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
          <Text style={styles.heroEyebrow}>— {name.toUpperCase()}</Text>
          <Text style={[styles.heroHeadline, isDesktop && styles.heroHeadlineDesktop]}>
            {tagline}
          </Text>
          <Text style={styles.heroDescription}>{description}</Text>

          <View style={[styles.ctaRow, isDesktop && styles.ctaRowDesktop]}>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={[styles.primaryCtaText, { color }]}>
                Get Started Free
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryCta}
              onPress={() => enterGuestMode()}
            >
              <Text style={styles.secondaryCtaText}>Explore the App</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Three Phases for this interest */}
      <View style={styles.section}>
        <View style={styles.sectionInner}>
          <Text style={styles.eyebrow}>— PLAN \u2192 DO \u2192 REVIEW</Text>
          <Text style={[styles.sectionHeading, isDesktop && styles.sectionHeadingDesktop]}>
            How {name.toLowerCase()} works on BetterAt
          </Text>

          <View style={[styles.phaseGrid, isDesktop && styles.phaseGridDesktop]}>
            {[
              { num: '01', ...phases.plan },
              { num: '02', ...phases.do_ },
              { num: '03', ...phases.review },
            ].map((phase, i) => (
              <View
                key={phase.num}
                style={[
                  styles.phaseCard,
                  { borderTopColor: color, borderTopWidth: 3 },
                ]}
              >
                <Text style={[styles.phaseNum, { color }]}>{phase.num}</Text>
                <Text style={styles.phaseTitle}>{phase.title}</Text>
                {phase.bullets.map((b, j) => (
                  <View key={j} style={styles.phaseBullet}>
                    <View style={[styles.phaseDot, { backgroundColor: color }]} />
                    <Text style={styles.phaseBulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={[styles.section, { backgroundColor: '#FAF8F5' }]}>
        <View style={styles.sectionInner}>
          <Text style={styles.eyebrow}>— FEATURES</Text>
          <Text style={[styles.sectionHeading, isDesktop && styles.sectionHeadingDesktop]}>
            Built for {name.toLowerCase()}
          </Text>

          <View style={[styles.featureGrid, isDesktop && styles.featureGridDesktop]}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* CTA */}
      <LinearGradient colors={[color, adjustColor(color, 20)]} style={styles.ctaSection}>
        <View style={styles.ctaSectionInner}>
          <Text style={[styles.ctaHeadline, isDesktop && styles.ctaHeadlineDesktop]}>
            Ready to get better at {name.toLowerCase()}?
          </Text>
          <Text style={styles.ctaSubtitle}>
            Join the community. Start with Plan \u2192 Do \u2192 Review.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={[styles.ctaButtonText, { color }]}>Get started free</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Footer />
    </View>
  );
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Hero
  hero: {
    paddingTop: 120,
    paddingBottom: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroContent: {
    maxWidth: 700,
    width: '100%',
  },
  heroContentDesktop: {
    maxWidth: 800,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  heroHeadline: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 44,
  },
  heroHeadlineDesktop: {
    fontSize: 52,
    lineHeight: 60,
  },
  heroDescription: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 28,
    marginBottom: 32,
    maxWidth: 560,
  },

  ctaRow: {
    flexDirection: 'column',
    gap: 12,
    maxWidth: 340,
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
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryCta: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  },
  secondaryCtaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Sections
  section: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  sectionInner: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    color: '#9B9B9B',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 40,
    lineHeight: 40,
  },
  sectionHeadingDesktop: {
    fontSize: 40,
    lineHeight: 48,
  },

  // Phases
  phaseGrid: {
    gap: 20,
  },
  phaseGridDesktop: {
    flexDirection: 'row',
  },
  phaseCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  phaseNum: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 8,
  },
  phaseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  phaseBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  phaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  phaseBulletText: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 22,
    flex: 1,
  },

  // Features
  featureGrid: {
    gap: 16,
  },
  featureGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 22,
  },

  // Bottom CTA
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaSectionInner: {
    maxWidth: 600,
    alignItems: 'center',
  },
  ctaHeadline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaHeadlineDesktop: {
    fontSize: 40,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 32,
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
