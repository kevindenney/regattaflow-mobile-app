import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SAILOR_TIERS } from '@/lib/subscriptions/sailorTiers';

interface PricingSectionProps {
  variant?: 'sailor' | 'coach' | 'club';
}

export function PricingSection({ variant = 'sailor' }: PricingSectionProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;

  if (variant === 'coach' || variant === 'club') {
    const audience = variant === 'coach' ? 'Coaches' : 'Clubs';

    return (
      <View id="pricing-section" style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{audience} Pricing</Text>
            <Text style={styles.headerSubtitle}>
              Coming soon. We are finalizing plans for {audience.toLowerCase()}.
            </Text>
          </View>

          <View style={styles.comingSoonCard}>
            <Ionicons name="time-outline" size={28} color="#3E92CC" />
            <Text style={styles.comingSoonTitle}>Pricing announcement in progress</Text>
            <Text style={styles.comingSoonBody}>
              Join the waitlist and we will send pricing and early access details.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (Platform.OS === 'web') {
                  window.location.href = 'mailto:hello@regattaflow.io?subject=Waitlist: ' + audience + ' pricing';
                }
              }}
            >
              <Text style={styles.primaryButtonText}>Join Waitlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View id="pricing-section" style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Simple Sailor Pricing</Text>
          <Text style={styles.headerSubtitle}>
            Based on current in-app subscription tiers and Stripe web plans.
          </Text>
        </View>

        <View style={[styles.cardsRow, isDesktop && styles.cardsRowDesktop]}>
          <PricingCard
            title={SAILOR_TIERS.free.name}
            price="$0"
            sublabel="Get started"
            features={[
              'Up to 3 races',
              '5 AI queries per month',
              'Basic race checklists',
              'Document upload',
            ]}
            cta="Get Started Free"
            outlined
          />

          <PricingCard
            title={SAILOR_TIERS.individual.name}
            price={SAILOR_TIERS.individual.priceYearly || '$120'}
            sublabel={`${SAILOR_TIERS.individual.priceMonthly || '$10'}/mo billed yearly`}
            features={SAILOR_TIERS.individual.features.slice(0, 6)}
            cta="Choose Individual"
            outlined
          />

          <PricingCard
            title={SAILOR_TIERS.team.name}
            price={SAILOR_TIERS.team.priceYearly || '$480'}
            sublabel={`${SAILOR_TIERS.team.priceMonthly || '$40'}/mo billed yearly`}
            features={SAILOR_TIERS.team.features}
            cta="Choose Team"
            featured
          />
        </View>

        <View style={styles.learnCallout}>
          <Ionicons name="school-outline" size={20} color="#6D28D9" />
          <Text style={styles.learnCalloutText}>
            Learn modules are separate and purchased individually (from $30/year per module).
          </Text>
          <TouchableOpacity style={styles.learnCalloutButton} onPress={() => router.push('/(tabs)/learn')}>
            <Text style={styles.learnCalloutButtonText}>Explore Learn</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function PricingCard({
  title,
  price,
  sublabel,
  features,
  cta,
  featured,
  outlined,
}: {
  title: string;
  price: string;
  sublabel: string;
  features: string[];
  cta: string;
  featured?: boolean;
  outlined?: boolean;
}) {
  return (
    <View style={[styles.card, featured && styles.cardFeatured]}>
      {featured && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>POPULAR</Text>
        </View>
      )}

      <Text style={[styles.cardTitle, featured && styles.cardTitleFeatured]}>{title}</Text>
      <Text style={[styles.cardPrice, featured && styles.cardPriceFeatured]}>{price}</Text>
      <Text style={styles.cardSublabel}>{sublabel}</Text>

      <View style={styles.featureList}>
        {features.map((item) => (
          <View key={`${title}-${item}`} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.ctaButton, outlined && styles.ctaButtonOutline, featured && styles.ctaButtonFeatured]}
        onPress={() => router.push('/(auth)/signup')}
      >
        <Text style={[styles.ctaText, outlined && styles.ctaTextOutline]}>{cta}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 72,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
  },
  content: {
    maxWidth: 1180,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 17,
    color: '#4B5563',
    textAlign: 'center',
  },
  cardsRow: {
    gap: 16,
    flexDirection: 'column',
  },
  cardsRowDesktop: {
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 24,
    minHeight: 420,
  },
  cardFeatured: {
    borderColor: '#3E92CC',
    borderWidth: 2,
  },
  badge: {
    alignSelf: 'flex-end',
    backgroundColor: '#3E92CC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  cardTitle: { fontSize: 26, fontWeight: '700', color: '#111827' },
  cardTitleFeatured: { color: '#3E92CC' },
  cardPrice: { fontSize: 42, fontWeight: '800', color: '#111827', marginTop: 8 },
  cardPriceFeatured: { color: '#3E92CC' },
  cardSublabel: { fontSize: 14, color: '#6B7280', marginTop: 2, marginBottom: 14 },
  featureList: { gap: 9, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: '#374151', flex: 1 },
  ctaButton: {
    marginTop: 'auto',
    borderRadius: 10,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3E92CC',
  },
  ctaButtonOutline: { backgroundColor: '#FFFFFF' },
  ctaButtonFeatured: { backgroundColor: '#3E92CC' },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  ctaTextOutline: { color: '#3E92CC' },
  learnCallout: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  learnCalloutText: {
    color: '#5B21B6',
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  learnCalloutButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E9D5FF',
  },
  learnCalloutButtonText: {
    color: '#6D28D9',
    fontSize: 13,
    fontWeight: '700',
  },
  comingSoonCard: {
    maxWidth: 760,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  comingSoonTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  comingSoonBody: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: 560,
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: '#3E92CC',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
