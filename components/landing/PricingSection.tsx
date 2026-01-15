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

interface PricingSectionProps {
  variant?: 'sailor' | 'coach' | 'club';
}

export function PricingSection({ variant = 'sailor' }: PricingSectionProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const isMobile = width <= 480;
  const isSmallMobile = width <= 375;

  // Show variant-specific pricing
  if (variant === 'coach') {
    return <CoachPricingSection isDesktop={isDesktop} />;
  }

  if (variant === 'club') {
    return <ClubPricingSection isDesktop={isDesktop} />;
  }

  return (
    <View id="pricing-section" style={styles.container}>
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Section Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDesktop && styles.headerTitleDesktop]}>
            Simple, Transparent Pricing
          </Text>
          <Text style={[styles.headerSubtitle, isDesktop && styles.headerSubtitleDesktop]}>
            Choose the plan that fits your racing goals
          </Text>
        </View>

        {/* Race Strategy Planner Section */}
        <View style={styles.productSection}>
          <View style={styles.productHeader}>
            <Ionicons name="navigate" size={24} color="#3E92CC" />
            <Text style={styles.productTitle}>Race Strategy Planner</Text>
          </View>
          <Text style={styles.productSubtitle}>
            AI-powered race planning & venue intelligence
          </Text>
        </View>

        {/* Sailor Pricing Tiers */}
        <SailorsPricing isDesktop={isDesktop} isMobile={isMobile} isSmallMobile={isSmallMobile} />

        {/* Racing Academy Section */}
        <View style={[styles.productSection, { marginTop: 48 }]}>
          <View style={styles.productHeader}>
            <Ionicons name="school" size={24} color="#8B5CF6" />
            <Text style={[styles.productTitle, { color: '#8B5CF6' }]}>Racing Academy</Text>
          </View>
          <Text style={styles.productSubtitle}>
            Master racing strategy with structured courses
          </Text>
        </View>

        {/* Racing Academy Pricing */}
        <RacingAcademyPricing isDesktop={isDesktop} />
      </View>
    </View>
  );
}

function SailorsPricing({ isDesktop, isMobile, isSmallMobile }: { isDesktop: boolean; isMobile?: boolean; isSmallMobile?: boolean }) {
  return (
    <View style={[
      styles.pricingContent,
      isDesktop && styles.pricingContentDesktop,
      isMobile && styles.pricingContentMobile,
    ]}>
      {/* Free */}
      <View style={[styles.pricingCard, isMobile && styles.pricingCardMobile]}>
        <Text style={styles.tierName}>Free</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>$0</Text>
        </View>
        <Text style={styles.tierTagline}>Get started with the basics</Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Race tracking</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>View venue intelligence</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>10 AI queries per month</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Basic race planning</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaButtonOutline]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonOutlineText}>Get Started Free</Text>
        </TouchableOpacity>
      </View>

      {/* Basic */}
      <View style={[styles.pricingCard, isMobile && styles.pricingCardMobile]}>
        <Text style={styles.tierName}>Basic</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>$120</Text>
          <Text style={styles.pricePeriod}>/year</Text>
        </View>
        <Text style={styles.effectiveMonthly}>$10/mo</Text>
        <Text style={styles.tierTagline}>Essential tools for club racers</Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Unlimited races</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>20 AI queries per month</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Automatic weather updates</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Race checklists & prep tools</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Cloud backup & sync</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaButtonOutline]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonOutlineText}>Get Basic</Text>
        </TouchableOpacity>
      </View>

      {/* Pro */}
      <View style={[styles.pricingCard, styles.pricingCardFeatured, isMobile && styles.pricingCardMobile]}>
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>POPULAR</Text>
        </View>
        <Text style={[styles.tierName, { color: '#3E92CC' }]}>Pro</Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: '#3E92CC' }]}>$360</Text>
          <Text style={styles.pricePeriod}>/year</Text>
        </View>
        <Text style={styles.effectiveMonthly}>$30/mo</Text>
        <Text style={styles.tierTagline}>Full features for serious sailors</Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Everything in Basic</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Unlimited AI queries</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>AI strategy analysis</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Team sharing & collaboration</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Historical race data</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Offline mode</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Priority support</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: '#3E92CC' }]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonText}>Get Pro</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RacingAcademyPricing({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={[styles.academyPricingContainer, isDesktop && styles.academyPricingContainerDesktop]}>
      {/* Single Module */}
      <View style={styles.academyCard}>
        <Ionicons name="book-outline" size={32} color="#8B5CF6" />
        <Text style={styles.academyCardTitle}>Single Module</Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { fontSize: 36, color: '#8B5CF6' }]}>$30</Text>
          <Text style={styles.pricePeriod}>/year</Text>
        </View>
        <Text style={styles.academyCardDesc}>Choose any one course</Text>
        <View style={styles.moduleList}>
          <Text style={styles.moduleItem}>Starting Line Strategy</Text>
          <Text style={styles.moduleItem}>Wind Shift Tactics</Text>
          <Text style={styles.moduleItem}>Mark Rounding Mastery</Text>
        </View>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: '#8B5CF6', marginTop: 16 }]}
          onPress={() => router.push('/learn')}
        >
          <Text style={styles.ctaButtonText}>Choose Module</Text>
        </TouchableOpacity>
      </View>

      {/* All Modules Bundle */}
      <View style={[styles.academyCard, styles.academyCardFeatured]}>
        <View style={[styles.popularBadge, { backgroundColor: '#8B5CF6' }]}>
          <Text style={styles.popularText}>BEST VALUE</Text>
        </View>
        <Ionicons name="library" size={32} color="#8B5CF6" />
        <Text style={styles.academyCardTitle}>All Modules</Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { fontSize: 36, color: '#8B5CF6' }]}>$100</Text>
          <Text style={styles.pricePeriod}>/year</Text>
        </View>
        <Text style={[styles.academyCardDesc, { color: '#10B981', fontWeight: '600' }]}>
          Best value for complete education
        </Text>
        <View style={styles.moduleList}>
          <View style={styles.moduleItemWithCheck}>
            <Ionicons name="checkmark" size={14} color="#8B5CF6" />
            <Text style={styles.moduleItem}>Starting Line Strategy</Text>
          </View>
          <View style={styles.moduleItemWithCheck}>
            <Ionicons name="checkmark" size={14} color="#8B5CF6" />
            <Text style={styles.moduleItem}>Wind Shift Tactics</Text>
          </View>
          <View style={styles.moduleItemWithCheck}>
            <Ionicons name="checkmark" size={14} color="#8B5CF6" />
            <Text style={styles.moduleItem}>Mark Rounding Mastery</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: '#8B5CF6', marginTop: 16 }]}
          onPress={() => router.push('/learn')}
        >
          <Text style={styles.ctaButtonText}>Get All Modules</Text>
        </TouchableOpacity>
      </View>

      {/* Pro Callout */}
      <View style={styles.championshipCallout}>
        <Ionicons name="gift" size={20} color="#8B5CF6" />
        <Text style={styles.championshipCalloutText}>
          Subscribe to both Race Strategy Pro and All Learning Modules for complete racing mastery
        </Text>
      </View>
    </View>
  );
}

function CoachesPricing({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={[styles.pricingContent, { justifyContent: 'center' }]}>
      <View style={[styles.pricingCard, styles.pricingCardWide]}>
        <Ionicons name="trending-up" size={48} color="#8B5CF6" />
        <Text style={[styles.tierName, { color: '#8B5CF6', fontSize: 28, marginTop: 16 }]}>
          Earn on Your Terms
        </Text>
        <Text style={[styles.tierTagline, { fontSize: 18, marginTop: 12 }]}>
          Keep 85% of your earnings
        </Text>

        <View style={styles.earningsBreakdown}>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Your Rate:</Text>
            <Text style={styles.earningsValue}>You decide</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Platform Fee:</Text>
            <Text style={[styles.earningsValue, { color: '#8B5CF6' }]}>15%</Text>
          </View>
          <View style={[styles.earningsRow, { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
            <Text style={[styles.earningsLabel, { fontWeight: '700' }]}>You Keep:</Text>
            <Text style={[styles.earningsValue, { fontWeight: '700', color: '#10B981', fontSize: 24 }]}>85%</Text>
          </View>
        </View>

        <View style={[styles.features, { marginTop: 24 }]}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
            <Text style={styles.featureText}>Built-in payment processing</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
            <Text style={styles.featureText}>Session management tools</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
            <Text style={styles.featureText}>Performance analytics for clients</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
            <Text style={styles.featureText}>Marketplace exposure</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: '#8B5CF6', marginTop: 24 }]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonText}>Join the Marketplace</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ClubsPricing({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={[styles.pricingContent, { justifyContent: 'center' }]}>
      <View style={[styles.pricingCard, styles.pricingCardWide]}>
        <Ionicons name="business" size={48} color="#10B981" />
        <Text style={[styles.tierName, { color: '#10B981', fontSize: 28, marginTop: 16 }]}>
          Enterprise Pricing
        </Text>
        <Text style={[styles.tierTagline, { fontSize: 18, marginTop: 12 }]}>
          Complete regatta management
        </Text>

        <View style={styles.clubPricingTiers}>
          <View style={styles.clubTier}>
            <Text style={styles.clubTierName}>Starter</Text>
            <Text style={[styles.price, { fontSize: 32, color: '#10B981' }]}>$299</Text>
            <Text style={styles.pricePeriod}>/month</Text>
            <Text style={styles.clubTierDesc}>Up to 500 members</Text>
          </View>

          <View style={styles.clubTierDivider} />

          <View style={styles.clubTier}>
            <Text style={styles.clubTierName}>Professional</Text>
            <Text style={[styles.price, { fontSize: 32, color: '#10B981' }]}>$599</Text>
            <Text style={styles.pricePeriod}>/month</Text>
            <Text style={styles.clubTierDesc}>Up to 2000 members</Text>
          </View>

          <View style={styles.clubTierDivider} />

          <View style={styles.clubTier}>
            <Text style={styles.clubTierName}>Enterprise</Text>
            <Text style={[styles.price, { fontSize: 32, color: '#10B981' }]}>$999</Text>
            <Text style={styles.pricePeriod}>/month</Text>
            <Text style={styles.clubTierDesc}>Unlimited members</Text>
          </View>
        </View>

        <View style={[styles.features, { marginTop: 24 }]}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.featureText}>Complete regatta management</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.featureText}>Live race scoring & results</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.featureText}>Member & event management</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.featureText}>Dedicated support</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: '#10B981', marginTop: 24 }]}
          onPress={() => {
            if (Platform.OS === 'web') {
              // Open email client or contact form
              window.location.href = 'mailto:sales@regattaflow.io?subject=Club Enterprise Inquiry';
            }
          }}
        >
          <Text style={styles.ctaButtonText}>Contact Sales</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Wrapper component for Coach-specific pricing section
function CoachPricingSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View id="pricing-section" style={styles.container}>
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDesktop && styles.headerTitleDesktop]}>
            Coach Pricing
          </Text>
          <Text style={[styles.headerSubtitle, isDesktop && styles.headerSubtitleDesktop]}>
            Keep more of what you earn
          </Text>
        </View>
        <CoachesPricing isDesktop={isDesktop} />
      </View>
    </View>
  );
}

// Wrapper component for Club-specific pricing section
function ClubPricingSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View id="pricing-section" style={styles.container}>
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDesktop && styles.headerTitleDesktop]}>
            Club Pricing
          </Text>
          <Text style={[styles.headerSubtitle, isDesktop && styles.headerSubtitleDesktop]}>
            Complete regatta and member management
          </Text>
        </View>
        <ClubsPricing isDesktop={isDesktop} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  contentDesktop: {
    // Additional desktop styles if needed
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  headerTitleDesktop: {
    fontSize: 40,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  headerSubtitleDesktop: {
    fontSize: 20,
  },

  // Pricing Content
  pricingContent: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
    ...Platform.select({
      web: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        maxWidth: 1200,
        alignSelf: 'center',
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr',
          gap: 16,
        },
      } as any,
    }),
  },
  pricingContentDesktop: {
    flexWrap: 'nowrap',
  },
  pricingContentMobile: {
    flexDirection: 'column',
    gap: 16,
    paddingHorizontal: 8,
    ...Platform.select({
      web: {
        display: 'flex',
        gridTemplateColumns: '1fr',
      } as any,
    }),
  },
  pricingCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        '@media (max-width: 768px)': {
          minWidth: 0,
          width: '100%',
        },
      } as any,
      default: {
        elevation: 2,
      },
    }),
  },
  pricingCardMobile: {
    minWidth: 0,
    width: '100%',
    padding: 24,
    marginHorizontal: 0,
  },
  pricingCardFeatured: {
    borderColor: '#3E92CC',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(62, 146, 204, 0.2)',
      },
      default: {
        elevation: 4,
      },
    }),
  },
  pricingCardWide: {
    minWidth: 400,
    maxWidth: 600,
    alignSelf: 'center',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#3E92CC',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tierName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  pricePeriod: {
    fontSize: 18,
    color: '#6B7280',
    marginLeft: 4,
  },
  tierTagline: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },

  // Features
  features: {
    gap: 12,
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },

  // CTA Button
  ctaButton: {
    paddingVertical: 16, // Increased from 14 for better mobile touch targets (minimum 44px height)
    minHeight: 48, // Ensure minimum 48px touch target (iOS HIG recommends 44px minimum)
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3E92CC',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ctaButtonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3E92CC',
  },

  // Coach-specific
  earningsBreakdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  earningsLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Club-specific
  clubPricingTiers: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
    justifyContent: 'space-around',
  },
  clubTier: {
    alignItems: 'center',
  },
  clubTierDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  clubTierName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  clubTierDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  
  // Product Section Headers
  productSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3E92CC',
  },
  productSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Effective Monthly Price
  effectiveMonthly: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },

  // Racing Academy Pricing
  academyPricingContainer: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'row',
        gap: 24,
        '@media (max-width: 768px)': {
          flexDirection: 'column',
          gap: 16,
        },
      } as any,
    }),
  },
  academyPricingContainerDesktop: {
    flexWrap: 'nowrap',
  },
  academyCard: {
    flex: 1,
    minWidth: 260,
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      } as any,
      default: {
        elevation: 2,
      },
    }),
  },
  academyCardFeatured: {
    borderColor: '#8B5CF6',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
      },
      default: {
        elevation: 4,
      },
    }),
  },
  academyCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  academyCardDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  moduleList: {
    gap: 8,
    alignItems: 'center',
  },
  moduleItem: {
    fontSize: 13,
    color: '#6B7280',
  },
  moduleItemWithCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  championshipCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  championshipCalloutText: {
    fontSize: 14,
    color: '#5B21B6',
    flex: 1,
  },
});
