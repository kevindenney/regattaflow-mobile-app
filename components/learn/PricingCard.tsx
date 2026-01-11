/**
 * Pricing Card Component
 * Tufte-inspired: tightened with inline metadata
 * Displays individual pricing tier information
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PricingTier } from '@/services/CourseCatalogService';

interface PricingCardProps {
  tier: PricingTier;
  isDesktop?: boolean;
  isFeatured?: boolean;
  compact?: boolean;
  onSelect?: () => void;
}

export function PricingCard({ tier, isDesktop = false, isFeatured = false, compact = false, onSelect }: PricingCardProps) {
  const getPriceDisplay = () => {
    if (tier.price.cents === 0) {
      return { amount: 'FREE', period: '', monthly: '' };
    }
    if (tier.price.yearly) {
      const yearlyAmount = tier.price.yearly.cents / 100;
      const monthlyEquiv = (yearlyAmount / 12).toFixed(0);
      return {
        amount: `$${yearlyAmount.toFixed(0)}`,
        period: '/yr',
        monthly: `~$${monthlyEquiv}/mo`,
      };
    }
    const amount = (tier.price.cents || 0) / 100;
    return {
      amount: `$${amount.toFixed(0)}`,
      period: tier.price.period === 'year' ? '/yr' : '/mo',
      monthly: '',
    };
  };

  const priceDisplay = getPriceDisplay();
  const isFree = tier.price.cents === 0;

  return (
    <View style={[
      styles.card,
      compact && styles.cardCompact,
      isFeatured && styles.cardFeatured,
    ]}>
      {/* Header: Name + Price inline */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={[styles.tierName, compact && styles.tierNameCompact]}>
            {tier.name}
          </Text>
          {isFeatured ? (
            <Text style={styles.featuredLabel}>Recommended</Text>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          <Text style={[
            styles.price,
            compact && styles.priceCompact,
            isFree && styles.priceFree,
          ]}>
            {priceDisplay.amount}
          </Text>
          {priceDisplay.period ? (
            <Text style={styles.pricePeriod}>{priceDisplay.period}</Text>
          ) : null}
        </View>
      </View>

      {/* Monthly equivalent */}
      {priceDisplay.monthly ? (
        <Text style={styles.monthlyEquiv}>{priceDisplay.monthly}</Text>
      ) : null}

      {/* Features: Compact list */}
      <View style={styles.featuresList}>
        {tier.includes.slice(0, compact ? 4 : 6).map((feature, idx) => (
          <View key={idx} style={styles.featureItem}>
            <Ionicons name="checkmark" size={14} color="#10B981" />
            <Text style={styles.featureText} numberOfLines={1}>{feature}</Text>
          </View>
        ))}
        {tier.includes.length > (compact ? 4 : 6) ? (
          <Text style={styles.moreFeatures}>
            +{tier.includes.length - (compact ? 4 : 6)} more
          </Text>
        ) : null}
      </View>

      {/* Excludes hint (if any) */}
      {tier.excludes && tier.excludes.length > 0 ? (
        <Text style={styles.excludesHint}>
          {tier.excludes.length} limitation{tier.excludes.length > 1 ? 's' : ''}
        </Text>
      ) : null}

      {/* CTA - Always outline style for Tufte consistency */}
      <TouchableOpacity
        style={styles.ctaButton}
        activeOpacity={0.8}
        onPress={onSelect}
      >
        <Text style={styles.ctaText}>
          {isFree ? 'Start Free' : 'Get Started'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      } as unknown,
      default: {
        elevation: 1,
      },
    }),
  },
  cardCompact: {
    padding: 14,
    marginBottom: 0,
  },
  cardFeatured: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  // Header with name and price inline
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  tierNameCompact: {
    fontSize: 16,
  },
  featuredLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  priceCompact: {
    fontSize: 20,
  },
  priceFree: {
    color: '#10B981',
  },
  pricePeriod: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 2,
  },
  monthlyEquiv: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  // Feature list
  featuresList: {
    gap: 6,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
  },
  moreFeatures: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginLeft: 20,
  },
  excludesHint: {
    fontSize: 11,
    color: '#D1D5DB',
    marginBottom: 12,
  },
  // CTA button - always outline for Tufte consistency
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});
