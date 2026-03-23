/**
 * Institutional Pricing Page
 *
 * Three-tier org pricing: Starter ($500/yr), Department ($15/seat/yr), Enterprise (custom)
 * Matches the design language of app/pricing.tsx
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { SimpleLandingNav } from '@/components/landing/SimpleLandingNav';
import { ScrollFix } from '@/components/landing/ScrollFix';
import { ORG_PLAN_LIST, type OrgPlanDefinition } from '@/lib/subscriptions/orgTiers';

export default function InstitutionPricingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuth();
  const [seatCount, setSeatCount] = useState(50);
  const seatOptions = [50, 100, 250, 500];

  const isDesktop = width >= 768;

  const handleSelectPlan = (plan: OrgPlanDefinition) => {
    if (plan.ctaAction === 'contact') {
      Linking.openURL('mailto:institutions@betterat.com?subject=Enterprise Plan Inquiry');
      return;
    }

    if (isGuest) {
      router.push('/(auth)/signup?plan=org_' + plan.id);
    } else {
      // TODO: Wire to create-org-checkout-session
      router.push('/organization/billing');
    }
  };

  const getDisplayPrice = (plan: OrgPlanDefinition) => {
    if (plan.id === 'department') {
      return `$${(seatCount * 15).toLocaleString()}`;
    }
    return plan.price;
  };

  const getPriceDetail = (plan: OrgPlanDefinition) => {
    if (plan.id === 'department') {
      return `/year for ${seatCount} seats`;
    }
    if (plan.id === 'enterprise') {
      return 'Tailored to your needs';
    }
    return plan.priceDetail;
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && <ScrollFix />}
      <SimpleLandingNav />
      {/* Dark header */}
      <View style={[styles.header, { paddingTop: insets.top + 80 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Institutional Plans</Text>
          <Text style={styles.headerSubtitle}>
            Give your students, faculty, or members access to powerful learning tools — billed centrally to your organization.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Seat count selector for Department plan */}
        <View style={styles.seatSelector}>
          <Text style={styles.seatLabel}>How many seats do you need?</Text>
          <View style={styles.seatOptions}>
            {seatOptions.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.seatOption,
                  seatCount === count && styles.seatOptionActive,
                ]}
                onPress={() => setSeatCount(count)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.seatOptionText,
                    seatCount === count && styles.seatOptionTextActive,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Plans grid */}
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {ORG_PLAN_LIST.map((plan) => (
              <View
                key={plan.id}
                style={[
                  styles.card,
                  isDesktop && styles.cardDesktop,
                  plan.isPopular && styles.cardHighlighted,
                ]}
              >
                {/* Card header */}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: plan.accentColor + '15' },
                    ]}
                  >
                    <Ionicons
                      name={plan.iconName as any}
                      size={24}
                      color={plan.accentColor}
                    />
                  </View>
                  {plan.isPopular && (
                    <View
                      style={[
                        styles.badgePill,
                        { backgroundColor: plan.accentColor + '15' },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: plan.accentColor }]}
                      >
                        MOST POPULAR
                      </Text>
                    </View>
                  )}
                </View>

                {/* Plan name */}
                <Text style={styles.cardName}>{plan.name}</Text>

                {/* Price */}
                <View style={styles.priceRow}>
                  <Text style={styles.priceAmount}>{getDisplayPrice(plan)}</Text>
                </View>
                <Text style={styles.priceDetail}>{getPriceDetail(plan)}</Text>

                <Text style={styles.cardDescription}>{plan.description}</Text>

                {/* Seats range */}
                <View style={styles.seatsInfo}>
                  <Ionicons name="people-outline" size={16} color={plan.accentColor} />
                  <Text style={styles.seatsText}>
                    {plan.maxSeats === Infinity
                      ? `${plan.minSeats}+ seats`
                      : `${plan.minSeats}–${plan.maxSeats} seats`}
                  </Text>
                </View>

                {/* Member tier badge */}
                <View style={[styles.tierBadge, { borderColor: plan.accentColor + '40' }]}>
                  <Ionicons name="star" size={14} color={plan.accentColor} />
                  <Text style={[styles.tierBadgeText, { color: plan.accentColor }]}>
                    Members get {plan.memberTier === 'pro' ? 'Pro' : 'Individual'} tier
                  </Text>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Features */}
                <View style={styles.featuresList}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={plan.accentColor}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA button */}
                <TouchableOpacity
                  style={[
                    styles.ctaButton,
                    plan.isPopular
                      ? { backgroundColor: plan.accentColor }
                      : { borderColor: plan.accentColor + '40' },
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.ctaText,
                      plan.isPopular
                        ? styles.ctaTextHighlighted
                        : { color: plan.accentColor },
                    ]}
                  >
                    {plan.cta}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ / Trust */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All institutional plans include centralized billing and member management.
          </Text>
          <Text style={styles.footerText}>
            Need a custom plan? Contact us at institutions@betterat.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1A1A1A',
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    maxWidth: 600,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  seatSelector: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  seatLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 12,
  },
  seatOptions: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  seatOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  seatOptionActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      } as any,
    }),
  },
  seatOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  seatOptionTextActive: {
    color: '#1A1A1A',
  },
  section: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    padding: 24,
  },
  sectionDesktop: {
    padding: 40,
  },
  grid: {
    gap: 16,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        cursor: 'default',
        transition: 'box-shadow 0.2s, transform 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      } as any,
    }),
  },
  cardDesktop: {
    flex: 1,
    flexBasis: 300,
    maxWidth: 380,
  },
  cardHighlighted: {
    borderColor: '#7C3AED',
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(124,58,237,0.15)',
      } as any,
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  priceDetail: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  seatsText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  featuresList: {
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  ctaButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    marginTop: 'auto',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
  },
  ctaTextHighlighted: {
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
