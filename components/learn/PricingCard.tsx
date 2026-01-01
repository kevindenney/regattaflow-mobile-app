/**
 * Pricing Card Component
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
  onSelect?: () => void;
}

export function PricingCard({ tier, isDesktop = false, isFeatured = false, onSelect }: PricingCardProps) {
  const getPriceDisplay = () => {
    if (tier.price.cents === 0) {
      return { amount: 'FREE', period: '' };
    }
    if (tier.price.monthly && tier.price.yearly) {
      return {
        amount: `$${(tier.price.yearly.cents / 100).toFixed(0)}`,
        period: '/year',
        monthly: `$${(tier.price.monthly.cents / 100).toFixed(0)}/month`,
      };
    }
    return {
      amount: `$${((tier.price.cents || 0) / 100).toFixed(0)}`,
      period: tier.price.period === 'year' ? '/year' : '/month',
    };
  };

  const priceDisplay = getPriceDisplay();

  return (
    <View style={[styles.pricingCard, isFeatured && styles.pricingCardFeatured]}>
      {isFeatured && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </View>
      )}

      <Text style={styles.tierName}>{tier.name}</Text>

      <View style={styles.tierPriceContainer}>
        {tier.price.cents === 0 ? (
          <Text style={styles.tierPriceFree}>FREE</Text>
        ) : (
          <>
            <Text style={styles.tierPrice}>{priceDisplay.amount}</Text>
            <Text style={styles.tierPriceLabel}>{priceDisplay.period}</Text>
            {priceDisplay.monthly && (
              <Text style={styles.tierPriceMonthly}>{priceDisplay.monthly}</Text>
            )}
          </>
        )}
      </View>

      <View style={styles.tierFeaturesList}>
        {tier.includes.map((item, idx) => (
          <View key={idx} style={styles.tierFeatureItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.tierFeatureText}>{item}</Text>
          </View>
        ))}
      </View>

      {tier.excludes && tier.excludes.length > 0 && (
        <View style={styles.tierExcludesList}>
          {tier.excludes.map((item, idx) => (
            <View key={idx} style={styles.tierExcludeItem}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              <Text style={styles.tierExcludeText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.tierButton, isFeatured && styles.tierButtonFeatured]}
        activeOpacity={0.8}
        onPress={onSelect}
      >
        <Text
          style={[styles.tierButtonText, isFeatured && styles.tierButtonTextFeatured]}
        >
          {tier.price.cents === 0 ? 'Start Free' : 'Get Started'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  pricingCardDesktop: {
    width: '22%',
    minWidth: 280,
  },
  pricingCardFeatured: {
    borderColor: '#8B5CF6',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(139, 92, 246, 0.2)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -60,
    backgroundColor: '#8B5CF6',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tierName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  tierPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  tierPrice: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1F2937',
  },
  tierPriceLabel: {
    fontSize: 18,
    color: '#6B7280',
    marginLeft: 6,
  },
  tierPriceFree: {
    fontSize: 48,
    fontWeight: '800',
    color: '#10B981',
  },
  tierPriceMonthly: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  tierFeaturesList: {
    gap: 12,
    marginBottom: 24,
  },
  tierFeatureItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  tierFeatureText: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
  },
  tierExcludesList: {
    gap: 8,
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tierExcludeItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  tierExcludeText: {
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
  },
  tierButton: {
    paddingVertical: 14,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  tierButtonFeatured: {
    backgroundColor: '#8B5CF6',
  },
  tierButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  tierButtonTextFeatured: {
    color: '#FFFFFF',
  },
});

