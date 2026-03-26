import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SimpleLandingNav } from './SimpleLandingNav';
import { ScrollFix } from './ScrollFix';
import { SearchBar } from './SearchBar';
import { SAMPLE_INTERESTS } from '@/lib/landing/sampleData';

const HOW_IT_WORKS_STEPS = [
  {
    number: '1',
    title: 'Pick Your Interest',
    description:
      'Choose from any skill or discipline — running, design, golf, nursing, or anything else you want to master.',
  },
  {
    number: '2',
    title: 'Build Your Structure',
    description:
      'Organize your practice with groups, organizations, people, and timelines that mirror how you actually learn.',
  },
  {
    number: '3',
    title: 'Track & Improve',
    description:
      'Review your progress over time with a universal model designed for deliberate, measurable growth.',
  },
];

export function DataBrowserLandingPage() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDesktop = mounted && width > 768;

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && <ScrollFix />}
      <SimpleLandingNav />

      {/* Hero section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroBadge}>
            {'✦  DELIBERATE PRACTICE PLATFORM'}
          </Text>
          <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
            BetterAt
          </Text>
          <Text style={styles.heroSubtitle}>
            One universal model for deliberate practice. Every interest uses the same
            structure — organizations, groups, people, and timelines — so you can track
            progress wherever you're working to improve.
          </Text>

          {/* Search Bar */}
          <View style={styles.searchBarWrap}>
            <SearchBar />
          </View>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howItWorks}>
        <Text style={styles.howItWorksLabel}>HOW IT WORKS</Text>
        <Text style={[styles.howItWorksTitle, !isDesktop && styles.howItWorksTitleMobile]}>
          Three steps to mastery
        </Text>
        <View style={[styles.stepsRow, !isDesktop && styles.stepsRowMobile]}>
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <React.Fragment key={step.number}>
              {index > 0 && isDesktop && (
                <View style={styles.stepConnector}>
                  <View style={styles.stepConnectorLine} />
                </View>
              )}
              <View style={[styles.stepCard, !isDesktop && styles.stepCardMobile]}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>{step.number}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Interest Grid */}
      <View style={styles.gridSection}>
        <View style={styles.gridHeader}>
          <Text style={styles.gridTitle}>Explore Interests</Text>
          <Text style={styles.gridSubtitle}>
            From athletics to arts, sciences to crafts — find your path and start
            practicing with purpose.
          </Text>
        </View>
        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          {SAMPLE_INTERESTS.map((interest) => (
            <TouchableOpacity
              key={interest.slug}
              style={[styles.interestCard, isDesktop && styles.interestCardDesktop]}
              onPress={() => router.push(`/${interest.slug}` as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: interest.color + '15' }]}>
                <Ionicons name={(interest.icon + '-outline') as any} size={28} color={interest.color} />
              </View>
              <Text style={styles.interestName}>{interest.name}</Text>
              <View style={styles.orgLinks}>
                {interest.organizations.map((org) => (
                  <TouchableOpacity
                    key={org.slug}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      router.push(`/${interest.slug}/${org.slug}` as any);
                    }}
                  >
                    <Text style={[styles.orgLink, { color: interest.color }]} numberOfLines={1}>
                      {org.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.exploreLink, { color: interest.color }]}>
                {'Explore \u2192'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.viewAllWrap}>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push('/interests' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All Interests</Text>
            <Ionicons name="arrow-forward" size={16} color="#334155" />
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Hero
  hero: {
    backgroundColor: '#1A1A1A',
    paddingTop: 100,
    paddingBottom: 64,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  heroContent: {
    maxWidth: 700,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 28,
  },
  heroBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3E92CC',
    letterSpacing: 3,
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
  },
  heroTitleDesktop: {
    fontSize: 80,
    letterSpacing: -2,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 30,
  },
  searchBarWrap: {
    width: '100%',
    marginTop: 28,
  },

  // How It Works
  howItWorks: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 48,
  },
  howItWorksLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3E92CC',
    letterSpacing: 3,
    textAlign: 'center',
  },
  howItWorksTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: -24,
  },
  howItWorksTitleMobile: {
    fontSize: 28,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: 1100,
    width: '100%',
  },
  stepsRowMobile: {
    flexDirection: 'column',
    gap: 32,
    alignItems: 'center',
  },
  stepCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
  },
  stepCardMobile: {
    maxWidth: 400,
  },
  stepCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3E92CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepConnector: {
    width: 48,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  stepConnectorLine: {
    width: 48,
    height: 0,
    borderTopWidth: 2,
    borderTopColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Interest Grid
  gridSection: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 72,
    paddingHorizontal: 24,
  },
  gridHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 48,
  },
  gridTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  gridSubtitle: {
    fontSize: 17,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 26,
  },
  grid: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    gap: 16,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  interestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 16,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      } as any,
    }),
  },
  interestCardDesktop: {
    width: '31%' as any,
    flexGrow: 1,
    flexBasis: 320,
    maxWidth: 400,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  orgLinks: {
    gap: 6,
  },
  orgLink: {
    fontSize: 14,
    fontWeight: '500',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  exploreLink: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  viewAllWrap: {
    alignItems: 'center',
    marginTop: 48,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      } as any,
    }),
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
});
