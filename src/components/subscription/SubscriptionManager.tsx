/**
 * Subscription Manager Component
 * Handles subscription display, upgrade, and management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stripeService, SubscriptionPlan, SubscriptionStatus } from '@/src/services/payments/StripeService';
import { useAuth } from '@/src/lib/contexts/AuthContext';

export const SubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({ active: false });

  useEffect(() => {
    loadSubscriptionStatus();
  }, [user]);

  const loadSubscriptionStatus = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const status = await stripeService.getSubscriptionStatus(user.id);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to subscribe');
      return;
    }

    if (plan.price === 0) {
      // Free plan
      Alert.alert('Free Plan', 'You are currently on the free plan');
      return;
    }

    if (subscriptionStatus.plan?.id === plan.id) {
      // Already on this plan
      Alert.alert('Current Plan', 'You are already subscribed to this plan');
      return;
    }

    setProcessingPlan(plan.id);
    try {
      const result = await stripeService.createCheckoutSession(
        user.id,
        plan.priceId
      );

      if ('url' in result) {
        if (Platform.OS === 'web') {
          window.location.href = result.url;
        } else {
          // For mobile, you'd typically use a WebView or in-app browser
          Alert.alert('Checkout', 'Opening payment page...');
        }
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to start checkout process');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const result = await stripeService.createPortalSession(user.id);

      if ('url' in result) {
        if (Platform.OS === 'web') {
          window.location.href = result.url;
        } else {
          Alert.alert('Billing Portal', 'Opening billing management...');
        }
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will retain access until the end of the billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;

            setLoading(true);
            const result = await stripeService.cancelSubscription(user.id);

            if (result.success) {
              Alert.alert('Subscription Cancelled', 'Your subscription will end at the current period');
              await loadSubscriptionStatus();
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel subscription');
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  const handleResumeSubscription = async () => {
    if (!user?.id) return;

    setLoading(true);
    const result = await stripeService.resumeSubscription(user.id);

    if (result.success) {
      Alert.alert('Subscription Resumed', 'Your subscription has been reactivated');
      await loadSubscriptionStatus();
    } else {
      Alert.alert('Error', result.error || 'Failed to resume subscription');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Current Subscription Status */}
      {subscriptionStatus.active && subscriptionStatus.plan && (
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanHeader}>
            <Text style={styles.currentPlanTitle}>Current Plan</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ACTIVE</Text>
            </View>
          </View>
          <Text style={styles.currentPlanName}>{subscriptionStatus.plan.name}</Text>
          <Text style={styles.currentPlanPrice}>${subscriptionStatus.plan.price}/month</Text>

          {subscriptionStatus.currentPeriodEnd && (
            <Text style={styles.periodEnd}>
              {subscriptionStatus.cancelAtPeriodEnd
                ? `Ends: ${subscriptionStatus.currentPeriodEnd.toLocaleDateString()}`
                : `Renews: ${subscriptionStatus.currentPeriodEnd.toLocaleDateString()}`}
            </Text>
          )}

          <View style={styles.currentPlanActions}>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleManageBilling}
            >
              <Text style={styles.manageButtonText}>Manage Billing</Text>
            </TouchableOpacity>

            {subscriptionStatus.cancelAtPeriodEnd ? (
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={handleResumeSubscription}
              >
                <Text style={styles.resumeButtonText}>Resume Subscription</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSubscription}
              >
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Plans Grid */}
      <View style={styles.plansContainer}>
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        {stripeService.plans.map((plan) => {
          const isCurrentPlan = subscriptionStatus.plan?.id === plan.id;
          const isProcessing = processingPlan === plan.id;

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.popular && styles.popularCard,
                isCurrentPlan && styles.currentCard
              ]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}

              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>${plan.price}</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  isCurrentPlan && styles.currentButton,
                  isProcessing && styles.processingButton
                ]}
                onPress={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[
                    styles.selectButtonText,
                    isCurrentPlan && styles.currentButtonText
                  ]}>
                    {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Features Comparison */}
      <View style={styles.comparisonContainer}>
        <Text style={styles.sectionTitle}>Feature Comparison</Text>
        <View style={styles.comparisonTable}>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonFeature}>Document Uploads</Text>
            <Text style={styles.comparisonValue}>3/mo</Text>
            <Text style={styles.comparisonValue}>Unlimited</Text>
            <Text style={styles.comparisonValue}>Unlimited</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonFeature}>AI Analysis</Text>
            <Ionicons name="close" size={20} color="#FF3B30" />
            <Ionicons name="checkmark" size={20} color="#4CAF50" />
            <Ionicons name="checkmark" size={20} color="#4CAF50" />
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonFeature}>Team Features</Text>
            <Ionicons name="close" size={20} color="#FF3B30" />
            <Ionicons name="close" size={20} color="#FF3B30" />
            <Ionicons name="checkmark" size={20} color="#4CAF50" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentPlanCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPlanTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  currentPlanPrice: {
    fontSize: 18,
    color: '#007AFF',
    marginTop: 4,
  },
  periodEnd: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  currentPlanActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  manageButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  resumeButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  plansContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  currentCard: {
    backgroundColor: '#F0F8FF',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    color: '#333',
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentButton: {
    backgroundColor: '#E0E0E0',
  },
  processingButton: {
    opacity: 0.6,
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  currentButtonText: {
    color: '#666',
  },
  comparisonContainer: {
    padding: 16,
  },
  comparisonTable: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  comparisonFeature: {
    flex: 2,
    fontWeight: '500',
  },
  comparisonValue: {
    flex: 1,
    textAlign: 'center',
    color: '#666',
  },
});