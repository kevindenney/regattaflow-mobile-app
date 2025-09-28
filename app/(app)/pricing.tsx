/**
 * Pricing Screen
 * Marine-grade subscription pricing with WatchDuty + OnX Maps inspired design
 * Professional sailing platform subscription management
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';
import { SubscriptionProduct } from '@/lib/subscriptions/subscriptionService';

export default function PricingScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);

  const {\n    products,\n    status,\n    loading,\n    purchaseProduct,\n    restorePurchases,\n  } = useSubscription();

  // Filter products by selected period
  const filteredProducts = products.filter(p => p.billingPeriod === selectedPeriod);

  const handlePurchase = async (productId: string) => {
    try {
      setPurchasingProductId(productId);
      const result = await purchaseProduct(productId);

      if (result.success) {
        // Navigate back to main app
        router.back();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setPurchasingProductId(null);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
    } catch (error) {
      console.error('Restore failed:', error);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <ThemedText style={styles.loadingText}>Loading subscription options...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Ionicons name="boat" size={32} color="#0ea5e9" />
            <ThemedText style={styles.title}>Upgrade to Pro</ThemedText>
            <ThemedText style={styles.subtitle}>
              Professional sailing platform for competitive racers
            </ThemedText>
          </View>
        </View>

        {/* Current Status */}
        {status && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons
                name={status.isActive ? "checkmark-circle" : "information-circle"}
                size={20}
                color={status.isActive ? "#22c55e" : "#f59e0b"}
              />
              <ThemedText style={styles.statusTitle}>
                Current Plan: {status.tier.replace('_', ' ').toUpperCase()}
              </ThemedText>
            </View>
            {status.isActive && status.expiresAt && (
              <ThemedText style={styles.statusText}>
                {status.isTrialing ? 'Trial' : 'Subscription'} expires on{' '}
                {new Date(status.expiresAt).toLocaleDateString()}
              </ThemedText>
            )}
          </View>
        )}

        {/* Period Toggle */}
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'monthly' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('monthly')}
          >
            <ThemedText style={[
              styles.periodButtonText,
              selectedPeriod === 'monthly' && styles.periodButtonTextActive
            ]}>
              Monthly
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'yearly' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('yearly')}
          >
            <ThemedText style={[
              styles.periodButtonText,
              selectedPeriod === 'yearly' && styles.periodButtonTextActive
            ]}>
              Yearly
            </ThemedText>
            <View style={styles.saveBadge}>
              <ThemedText style={styles.saveBadgeText}>Save 25%</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Subscription Cards */}
        <View style={styles.subscriptionCards}>
          {filteredProducts.map((product, index) => (
            <SubscriptionCard
              key={product.id}
              product={product}
              isRecommended={product.isPopular}
              onPurchase={() => handlePurchase(product.id)}
              isPurchasing={purchasingProductId === product.id}
              isCurrentPlan={status?.productId === product.id}
            />
          ))}
        </View>

        {/* Features Comparison */}
        <View style={styles.featuresSection}>
          <ThemedText style={styles.featuresTitle}>What's Included</ThemedText>

          <View style={styles.featuresList}>
            <FeatureItem
              icon="boat"
              title="Unlimited Race Tracking"
              description="Track all your races with GPS precision and AI analysis"
            />
            <FeatureItem
              icon="globe"
              title="Global Venue Intelligence"
              description="147+ sailing venues with local conditions and tactics"
            />
            <FeatureItem
              icon="analytics"
              title="AI Race Strategy"
              description="Monte Carlo simulations and tactical recommendations"
            />
            <FeatureItem
              icon="cloud-offline"
              title="Offline Capabilities"
              description="Full functionality without internet connection"
            />
            <FeatureItem
              icon="settings"
              title="Equipment Optimization"
              description="Boat setup guides for every condition"
            />
            <FeatureItem
              icon="trending-up"
              title="Performance Analytics"
              description="Track improvement across venues and conditions"
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
          >
            <ThemedText style={styles.restoreButtonText}>
              Restore Previous Purchases
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.legalText}>
            <ThemedText style={styles.legalLine}>
              Subscriptions auto-renew unless cancelled 24 hours before renewal.
            </ThemedText>
            <ThemedText style={styles.legalLine}>
              Cancel anytime in your device settings.
            </ThemedText>
          </View>

          <View style={styles.securityFooter}>
            <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
            <ThemedText style={styles.securityText}>
              Secure payments • Cancel anytime • Marine-grade reliability
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

interface SubscriptionCardProps {
  product: SubscriptionProduct;
  isRecommended?: boolean;
  onPurchase: () => void;
  isPurchasing: boolean;
  isCurrentPlan: boolean;
}

function SubscriptionCard({
  product,
  isRecommended,
  onPurchase,
  isPurchasing,
  isCurrentPlan,
}: SubscriptionCardProps) {
  return (
    <View style={[
      styles.subscriptionCard,
      isRecommended && styles.recommendedCard,
      isCurrentPlan && styles.currentPlanCard,
    ]}>
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <ThemedText style={styles.recommendedBadgeText}>Most Popular</ThemedText>
        </View>
      )}

      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardTitle}>{product.title}</ThemedText>
        <ThemedText style={styles.cardDescription}>{product.description}</ThemedText>
      </View>

      <View style={styles.priceContainer}>
        <ThemedText style={styles.price}>{product.price}</ThemedText>
        {product.trialPeriod && (
          <ThemedText style={styles.trialText}>
            {product.trialPeriod}-day free trial
          </ThemedText>
        )}
      </View>

      <View style={styles.featuresContainer}>
        {product.features.slice(0, 4).map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons name="checkmark" size={16} color="#22c55e" />
            <ThemedText style={styles.featureText}>{feature}</ThemedText>
          </View>
        ))}
        {product.features.length > 4 && (
          <ThemedText style={styles.moreFeatures}>
            +{product.features.length - 4} more features
          </ThemedText>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.purchaseButton,
          isRecommended && styles.recommendedButton,
          isCurrentPlan && styles.currentPlanButton,
        ]}
        onPress={onPurchase}
        disabled={isPurchasing || isCurrentPlan}
      >
        {isPurchasing ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <ThemedText style={[
            styles.purchaseButtonText,
            isCurrentPlan && styles.currentPlanButtonText,
          ]}>
            {isCurrentPlan ? 'Current Plan' : `Start ${product.trialPeriod}-Day Trial`}
          </ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
}

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon as any} size={24} color="#0ea5e9" />
      </View>
      <View style={styles.featureContent}>
        <ThemedText style={styles.featureTitle}>{title}</ThemedText>
        <ThemedText style={styles.featureDescription}>{description}</ThemedText>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#cbd5e1',
    fontSize: 16,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Status Card
  statusCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    borderRadius: 12,
    padding: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  statusText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },

  // Period Toggle
  periodToggle: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    position: 'relative',
  },
  periodButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#22c55e',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Subscription Cards
  subscriptionCards: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  subscriptionCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 16,
    padding: 24,
    position: 'relative',
  },
  recommendedCard: {
    borderColor: '#0ea5e9',
    borderWidth: 2,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  currentPlanCard: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  recommendedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  trialText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#e2e8f0',
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  purchaseButton: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  recommendedButton: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  currentPlanButton: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  currentPlanButtonText: {
    color: '#ffffff',
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
  },
  restoreButton: {
    padding: 12,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  legalText: {
    alignItems: 'center',
    gap: 4,
  },
  legalLine: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  securityText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});