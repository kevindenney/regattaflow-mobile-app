/**
 * PricingTable Component
 * Tufte-inspired comparison table for pricing tiers
 * Shows all tiers side-by-side for easy comparison (desktop only)
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PricingTier } from '@/services/CourseCatalogService';

// Design tokens
const TOKENS = {
  colors: {
    headerBg: '#F9FAFB',
    border: '#E5E7EB',
    title: '#111827',
    subtitle: '#6B7280',
    price: '#111827',
    priceSubtext: '#9CA3AF',
    featureText: '#374151',
    checkmark: '#10B981',
    cross: '#D1D5DB',
    ctaText: '#FFFFFF',
    ctaBg: '#007AFF',
    featuredBorder: '#8B5CF6',
    featuredBg: '#FAF5FF',
  },
};

interface PricingTableProps {
  tiers: PricingTier[];
  featuredTierId?: string;
  onSelectTier?: (tier: PricingTier) => void;
}

/**
 * Format price for display
 */
function formatPrice(tier: PricingTier): { main: string; period: string; monthly?: string } {
  const cents = tier.price.yearly?.cents ?? tier.price.cents;
  const period = tier.price.yearly?.period ?? tier.price.period ?? 'year';

  if (cents === 0) {
    return { main: 'FREE', period: '' };
  }

  const dollars = Math.floor(cents / 100);
  const monthlyCents = tier.price.monthly?.cents;
  const monthlyDollars = monthlyCents ? Math.floor(monthlyCents / 100) : Math.floor(dollars / 12);

  return {
    main: `$${dollars}`,
    period: `/${period}`,
    monthly: `~$${monthlyDollars.toFixed(2)}/mo`,
  };
}

/**
 * Collect all unique features from all tiers
 */
function collectAllFeatures(tiers: PricingTier[]): string[] {
  const featureSet = new Set<string>();

  tiers.forEach(tier => {
    tier.includes.forEach(feature => featureSet.add(feature));
  });

  // Sort to group similar features together
  return Array.from(featureSet).sort((a, b) => {
    // Prioritize course-related features first
    const aIsCourse = a.toLowerCase().includes('course');
    const bIsCourse = b.toLowerCase().includes('course');
    if (aIsCourse && !bIsCourse) return -1;
    if (!aIsCourse && bIsCourse) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Check if a tier includes a feature
 */
function tierHasFeature(tier: PricingTier, feature: string): boolean {
  return tier.includes.some(f => f.toLowerCase() === feature.toLowerCase());
}

export function PricingTable({
  tiers,
  featuredTierId = 'pro',
  onSelectTier,
}: PricingTableProps) {
  const allFeatures = collectAllFeatures(tiers);

  return (
    <View style={styles.container}>
      {/* Header row with tier names and prices */}
      <View style={styles.headerRow}>
        {/* Empty cell for feature column */}
        <View style={styles.featureCell} />

        {/* Tier headers */}
        {tiers.map(tier => {
          const price = formatPrice(tier);
          const isFeatured = tier.id === featuredTierId;

          return (
            <View
              key={tier.id}
              style={[
                styles.tierHeader,
                isFeatured && styles.tierHeaderFeatured,
              ]}
            >
              {isFeatured ? (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>RECOMMENDED</Text>
                </View>
              ) : null}
              <Text style={styles.tierName}>{tier.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.priceMain, price.main === 'FREE' && styles.priceFree]}>
                  {price.main}
                </Text>
                {price.period ? (
                  <Text style={styles.pricePeriod}>{price.period}</Text>
                ) : null}
              </View>
              {price.monthly ? (
                <Text style={styles.priceMonthly}>{price.monthly}</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Feature rows */}
      {allFeatures.map((feature, index) => (
        <View
          key={feature}
          style={[
            styles.featureRow,
            index % 2 === 0 && styles.featureRowAlt,
          ]}
        >
          {/* Feature name */}
          <View style={styles.featureCell}>
            <Text style={styles.featureText} numberOfLines={2}>
              {feature}
            </Text>
          </View>

          {/* Tier checkmarks */}
          {tiers.map(tier => {
            const hasFeature = tierHasFeature(tier, feature);
            const isFeatured = tier.id === featuredTierId;

            return (
              <View
                key={tier.id}
                style={[
                  styles.checkCell,
                  isFeatured && styles.checkCellFeatured,
                ]}
              >
                {hasFeature ? (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={TOKENS.colors.checkmark}
                  />
                ) : (
                  <Text style={styles.crossMark}>—</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}

      {/* CTA row */}
      <View style={styles.ctaRow}>
        <View style={styles.featureCell} />
        {tiers.map(tier => {
          const isFeatured = tier.id === featuredTierId;
          const isFree = tier.price.cents === 0;

          return (
            <View
              key={tier.id}
              style={[
                styles.ctaCell,
                isFeatured && styles.ctaCellFeatured,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  isFeatured && styles.ctaButtonFeatured,
                ]}
                onPress={() => onSelectTier?.(tier)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.ctaButtonText,
                    isFeatured && styles.ctaButtonTextFeatured,
                  ]}
                >
                  {isFree ? 'Start Free' : 'Get Started'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.colors.border,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      } as unknown,
      default: {
        elevation: 1,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: TOKENS.colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.colors.border,
  },
  featureCell: {
    flex: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  tierHeader: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: TOKENS.colors.border,
  },
  tierHeaderFeatured: {
    backgroundColor: TOKENS.colors.featuredBg,
  },
  featuredBadge: {
    backgroundColor: TOKENS.colors.featuredBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '600',
    color: TOKENS.colors.title,
    marginBottom: 8,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceMain: {
    fontSize: 28,
    fontWeight: '700',
    color: TOKENS.colors.price,
  },
  priceFree: {
    fontSize: 24,
    color: TOKENS.colors.checkmark,
  },
  pricePeriod: {
    fontSize: 14,
    color: TOKENS.colors.priceSubtext,
    marginLeft: 2,
  },
  priceMonthly: {
    fontSize: 12,
    color: TOKENS.colors.priceSubtext,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: 'row',
    minHeight: 44,
  },
  featureRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  featureText: {
    fontSize: 14,
    color: TOKENS.colors.featureText,
    lineHeight: 18,
  },
  checkCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: TOKENS.colors.border,
  },
  checkCellFeatured: {
    backgroundColor: 'rgba(139, 92, 246, 0.03)',
  },
  crossMark: {
    fontSize: 14,
    color: TOKENS.colors.cross,
  },
  ctaRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: TOKENS.colors.border,
    paddingVertical: 16,
  },
  ctaCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderLeftColor: TOKENS.colors.border,
  },
  ctaCellFeatured: {
    backgroundColor: TOKENS.colors.featuredBg,
  },
  ctaButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TOKENS.colors.ctaBg,
    backgroundColor: 'transparent',
  },
  ctaButtonFeatured: {
    backgroundColor: TOKENS.colors.featuredBorder,
    borderColor: TOKENS.colors.featuredBorder,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.colors.ctaBg,
  },
  ctaButtonTextFeatured: {
    color: '#FFFFFF',
  },
});

export default PricingTable;
