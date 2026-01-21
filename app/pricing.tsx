/**
 * Pricing Page - Tufte-Style Design
 *
 * Clean, minimal presentation following Edward Tufte principles:
 * - High data-ink ratio: every element conveys information
 * - No chartjunk: no decorative gradients, badges, or visual noise
 * - Typography hierarchy: let text do the work
 * - Generous whitespace: room to breathe
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
  background: '#F0EDE8',
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
    id: 'basic',
    name: 'Basic',
    price: '$120',
    period: '/year',
    description: 'Essential tools for club racers',
    features: [
      'Unlimited races',
      '20 AI queries per month',
      'Automatic weather updates',
      'Race checklists & prep tools',
      'Document storage',
      'Cloud backup & sync',
    ],
    cta: 'Go Basic',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$360',
    period: '/year',
    description: 'Full features for serious sailors',
    features: [
      'Everything in Basic',
      'Unlimited AI queries',
      'AI strategy analysis',
      'Team sharing & collaboration',
      'Historical race data',
      'Offline mode',
      'Advanced analytics',
    ],
    cta: 'Go Pro',
    highlighted: true,
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
  },
  {
    id: 'learn-bundle',
    name: 'All Modules',
    price: '$100',
    period: '/year',
    description: 'Complete racing education',
    features: [
      'All learning modules',
      'Interactive simulations',
      'Progress tracking',
      'Certificates on completion',
      'New modules as released',
      'Best value',
    ],
    cta: 'Get All Modules',
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
        // TODO: Connect to Stripe payment flow
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
    marginBottom: 8,
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
