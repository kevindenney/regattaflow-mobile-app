import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type Audience = 'sailors' | 'coaches' | 'clubs';

export function PricingSection() {
  const [activeTab, setActiveTab] = useState<Audience>('sailors');
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <View style={styles.container}>
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sailors' && styles.tabActive]}
            onPress={() => setActiveTab('sailors')}
          >
            <Ionicons
              name="water-outline"
              size={20}
              color={activeTab === 'sailors' ? '#3E92CC' : '#6B7280'}
            />
            <Text style={[styles.tabText, activeTab === 'sailors' && styles.tabTextActive]}>
              Sailors
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'clubs' && styles.tabActive]}
            onPress={() => setActiveTab('clubs')}
          >
            <Ionicons
              name="trophy-outline"
              size={20}
              color={activeTab === 'clubs' ? '#10B981' : '#6B7280'}
            />
            <Text style={[styles.tabText, activeTab === 'clubs' && styles.tabTextActive]}>
              Clubs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'coaches' && styles.tabActive]}
            onPress={() => setActiveTab('coaches')}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={activeTab === 'coaches' ? '#8B5CF6' : '#6B7280'}
            />
            <Text style={[styles.tabText, activeTab === 'coaches' && styles.tabTextActive]}>
              Coaches
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'sailors' && <SailorsPricing isDesktop={isDesktop} />}
        {activeTab === 'clubs' && <ClubsPricing isDesktop={isDesktop} />}
        {activeTab === 'coaches' && <CoachesPricing isDesktop={isDesktop} />}
      </View>
    </View>
  );
}

function SailorsPricing({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={[styles.pricingContent, isDesktop && styles.pricingContentDesktop]}>
      {/* Free */}
      <View style={styles.pricingCard}>
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
            <Text style={styles.featureText}>5 documents/mo</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Basic maps</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaButtonOutline]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonOutlineText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      {/* Sailor Pro */}
      <View style={[styles.pricingCard, styles.pricingCardFeatured]}>
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>POPULAR</Text>
        </View>
        <Text style={[styles.tierName, { color: '#3E92CC' }]}>Sailor Pro</Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: '#3E92CC' }]}>$29</Text>
          <Text style={styles.pricePeriod}>/mo</Text>
        </View>
        <Text style={styles.tierTagline}>Full features for racers</Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Unlimited docs</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>AI course viz</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Full strategy</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Performance analytics</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: '#3E92CC' }]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonText}>Start Free Trial</Text>
        </TouchableOpacity>
      </View>

      {/* Championship */}
      <View style={styles.pricingCard}>
        <Text style={styles.tierName}>Championship</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>$49</Text>
          <Text style={styles.pricePeriod}>/mo</Text>
        </View>
        <Text style={styles.tierTagline}>Advanced AI for champions</Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>AI strategy</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Venue intel</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Multi-model forecast</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color="#3E92CC" />
            <Text style={styles.featureText}>Priority support</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaButtonOutline]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonOutlineText}>Start Trial</Text>
        </TouchableOpacity>
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

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 48,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  tabActive: {
    backgroundColor: '#F3F4F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1F2937',
  },

  // Pricing Content
  pricingContent: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  pricingContentDesktop: {
    flexWrap: 'nowrap',
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
      },
      default: {
        elevation: 2,
      },
    }),
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
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
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
});
