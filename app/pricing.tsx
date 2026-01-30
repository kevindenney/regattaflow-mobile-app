/**
 * Pricing Page - Tufte-Style Design
 *
 * Updated: 2026-01-30
 * New pricing: Free / Individual $120/yr / Team $480/yr
 * Learning modules: $30/yr each (purchased separately)
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';

// Tufte design tokens
const TUFTE = {
  background: '#F2F2F7',
  backgroundSecondary: '#E8E5DF',
  text: '#3D3832',
  textMuted: '#6B6560',
  textLight: '#8C8780',
  accent: '#0284c7',
  accentHover: '#0369a1',
  border: '#D4D0C8',
};

interface PlanTier {
  id: string;
  name: string;
  price: string;
  period: string;
  monthlyEquivalent?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

type PricingTab = 'strategy' | 'learning';

const STRATEGY_PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Get started with race preparation',
    features: [
      'Up to 3 races',
      'Basic race checklists',
      'Manual weather lookup',
      '5 AI queries per month',
      'Document upload',
    ],
    cta: 'Start Free',
  },
  {
    id: 'individual',
    name: 'Individual',
    price: '$120',
    period: '/year',
    monthlyEquivalent: '$10/mo',
    description: 'Full racing features for solo sailors',
    features: [
      'Unlimited races',
      'Unlimited AI queries',
      'AI strategy analysis',
      'Venue intelligence',
      'Historical race data',
      'Offline mode',
      'Advanced analytics',
    ],
    cta: 'Go Individual',
    highlighted: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$480',
    period: '/year',
    monthlyEquivalent: '$40/mo',
    description: 'Full racing features for teams',
    features: [
      'Everything in Individual',
      'Up to 5 team members',
      'Team sharing & collaboration',
      'Shared race preparation',
      'Team analytics dashboard',
      'Priority support',
    ],
    cta: 'Go Team',
  },
];

const LEARNING_PLANS: PlanTier[] = [
  {
    id: 'learn-free',
    name: 'Free Lesson',
    price: '$0',
    period: '',
    description: 'Try our learning content',
    features: [
      'Introduction to Racing',
      'Basic concepts & terminology',
      'Interactive lesson format',
      'Progress tracking',
    ],
    cta: 'Start Learning',
  },
  {
    id: 'learn-module',
    name: 'Single Module',
    price: '$30',
    period: '/year',
    description: 'Deep dive on one topic',
    features: [
      'Choose any learning module',
      'Interactive lessons',
      'Simulations & exercises',
      'Progress tracking',
      'Certificate on completion',
    ],
    cta: 'Get Module',
    highlighted: true,
  },
];

export default function PricingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const params = useLocalSearchParams<{ upgrade?: string; tab?: string }>();
  const [activeTab, setActiveTab] = React.useState<PricingTab>(
    (params.tab as PricingTab) || 'strategy'
  );

  const isWideScreen = width >= 768;
  const currentPlans = activeTab === 'strategy' ? STRATEGY_PLANS : LEARNING_PLANS;

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free' || planId === 'learn-free') {
      if (isGuest) {
        router.push('/(auth)/signup');
      } else {
        router.back();
      }
    } else {
      // For paid plans, direct to signup first if guest, then payment
      if (isGuest) {
        router.push(`/(auth)/signup?plan=${planId}`);
      } else {
        // Direct to subscription page for checkout
        router.push('/subscription');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Minimal header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={TUFTE.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            {activeTab === 'strategy'
              ? 'Race preparation tools for every sailor'
              : 'Learn to race with interactive lessons'}
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'strategy' && styles.tabActive]}
            onPress={() => setActiveTab('strategy')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'strategy' && styles.tabTextActive,
              ]}
            >
              Race Strategy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'learning' && styles.tabActive]}
            onPress={() => setActiveTab('learning')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'learning' && styles.tabTextActive,
              ]}
            >
              Learning
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plans grid */}
        <View style={[styles.plansContainer, isWideScreen && styles.plansRow]}>
          {currentPlans.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                isWideScreen && styles.planCardWide,
                plan.highlighted && styles.planCardHighlighted,
              ]}
            >
              {/* Plan header */}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  {plan.period && (
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  )}
                </View>
                {plan.monthlyEquivalent && (
                  <Text style={styles.monthlyEquivalent}>{plan.monthlyEquivalent}</Text>
                )}
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>

              {/* Divider - subtle line */}
              <View style={styles.divider} />

              {/* Features - clean list, no icons */}
              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <Text key={index} style={styles.featureItem}>
                    {feature}
                  </Text>
                ))}
              </View>

              {/* CTA button */}
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  plan.highlighted && styles.ctaButtonHighlighted,
                ]}
                onPress={() => handleSelectPlan(plan.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.ctaText,
                    plan.highlighted && styles.ctaTextHighlighted,
                  ]}
                >
                  {plan.cta}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Footer note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All plans include a 14-day money-back guarantee.
          </Text>
          <Text style={styles.footerText}>Cancel anytime.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },

  // Title section
  titleSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: TUFTE.text,
    letterSpacing: -0.5,
    marginBottom: 8,
    // Serif feel with lighter weight
    ...Platform.select({
      web: { fontFamily: 'Georgia, serif' },
      default: {},
    }),
  },
  subtitle: {
    fontSize: 16,
    color: TUFTE.textMuted,
    letterSpacing: 0.2,
  },

  // Tab navigation
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: TUFTE.border,
    backgroundColor: 'transparent',
  },
  tabActive: {
    borderColor: TUFTE.text,
    backgroundColor: TUFTE.backgroundSecondary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: TUFTE.textMuted,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: TUFTE.text,
  },

  // Plans container
  plansContainer: {
    gap: 24,
  },
  plansRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 24,
  },

  // Plan card
  planCard: {
    backgroundColor: TUFTE.backgroundSecondary,
    borderRadius: 2,
    padding: 28,
    borderWidth: 1,
    borderColor: TUFTE.border,
  },
  planCardWide: {
    flex: 1,
    minWidth: 260,
    maxWidth: 320,
  },
  planCardHighlighted: {
    borderColor: TUFTE.accent,
    borderWidth: 2,
  },

  // Plan header
  planHeader: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    color: TUFTE.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 42,
    fontWeight: '200',
    color: TUFTE.text,
    letterSpacing: -1,
  },
  planPeriod: {
    fontSize: 16,
    color: TUFTE.textLight,
    marginLeft: 4,
  },
  monthlyEquivalent: {
    fontSize: 14,
    color: TUFTE.textMuted,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 15,
    color: TUFTE.textMuted,
    lineHeight: 22,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: TUFTE.border,
    marginBottom: 20,
  },

  // Features list
  featuresList: {
    marginBottom: 24,
    gap: 10,
  },
  featureItem: {
    fontSize: 15,
    color: TUFTE.text,
    lineHeight: 22,
    paddingLeft: 12,
    // Subtle indent effect
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },

  // CTA button
  ctaButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: TUFTE.text,
    alignItems: 'center',
  },
  ctaButtonHighlighted: {
    backgroundColor: TUFTE.accent,
    borderColor: TUFTE.accent,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '500',
    color: TUFTE.text,
    letterSpacing: 0.3,
  },
  ctaTextHighlighted: {
    color: '#FFFFFF',
  },

  // Footer
  footer: {
    marginTop: 48,
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: TUFTE.textLight,
    lineHeight: 20,
  },
});
