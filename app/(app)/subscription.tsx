/**
 * Subscription Management Screen
 * Marine-grade subscription settings and management interface
 * Professional sailing platform subscription control center
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';

export default function SubscriptionScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const {
    status,
    loading,
    refreshStatus,
    cancelSubscription,
    restorePurchases,
    daysLeftInTrial,
    isInTrial,
  } = useSubscription();

  useEffect(() => {
    // Refresh status when screen loads
    refreshStatus();
  }, []);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      await refreshStatus();
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/(app)/pricing');
  };

  const handleManageSubscription = () => {
    Alert.alert(
      '🔧 Manage Subscription',
      'To manage your subscription, billing, or payment method, please visit your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            // This would open device-specific subscription settings
            console.log('Opening subscription settings...');
          },
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      '⚠️ Cancel Subscription',
      'Are you sure you want to cancel your RegattaFlow Pro subscription? You\'ll lose access to all premium features.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            await cancelSubscription();
          },
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
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
          <ThemedText style={styles.loadingText}>Loading subscription details...</ThemedText>
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
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Ionicons name="card" size={32} color="#0ea5e9" />
            <ThemedText style={styles.title}>Subscription</ThemedText>
            <ThemedText style={styles.subtitle}>
              Manage your RegattaFlow subscription
            </ThemedText>
          </View>
        </View>

        {/* Current Subscription Status */}
        <View style={styles.statusSection}>
          <View style={[
            styles.statusCard,
            status?.isActive ? styles.activeStatusCard : styles.inactiveStatusCard
          ]}>
            <View style={styles.statusHeader}>
              <View style={styles.statusIcon}>
                <Ionicons
                  name={status?.isActive ? "checkmark-circle" : "information-circle"}
                  size={24}
                  color={status?.isActive ? "#22c55e" : "#f59e0b"}
                />
              </View>
              <View style={styles.statusInfo}>
                <ThemedText style={styles.statusTitle}>
                  {status?.tier.replace('_', ' ').toUpperCase() || 'FREE'}
                </ThemedText>
                <ThemedText style={styles.statusSubtitle}>
                  {status?.isActive ? 'Active Subscription' : 'Free Plan'}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefreshStatus}
                disabled={refreshing}
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color="#0ea5e9"
                  style={refreshing ? { opacity: 0.5 } : {}}
                />
              </TouchableOpacity>
            </View>

            {/* Trial Status */}
            {isInTrial && (
              <View style={styles.trialBanner}>
                <Ionicons name="time" size={16} color="#f59e0b" />
                <ThemedText style={styles.trialText}>
                  {daysLeftInTrial} days left in trial
                </ThemedText>
              </View>
            )}

            {/* Subscription Details */}
            {status?.isActive && status.expiresAt && (
              <View style={styles.subscriptionDetails}>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    {isInTrial ? 'Trial Ends' : 'Renews'}
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {new Date(status.expiresAt).toLocaleDateString()}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Platform</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {status.platform.toUpperCase()}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Auto-Renewal</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {status.willRenew ? 'Enabled' : 'Disabled'}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {!status?.isActive && (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Ionicons name="rocket" size={20} color="#ffffff" />
              <ThemedText style={styles.upgradeButtonText}>
                Upgrade to Pro
              </ThemedText>
            </TouchableOpacity>
          )}

          {status?.isActive && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleManageSubscription}
            >
              <Ionicons name="settings" size={20} color="#0ea5e9" />
              <ThemedText style={styles.manageButtonText}>
                Manage Subscription
              </ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
          >
            <Ionicons name="refresh-circle" size={20} color="#64748b" />
            <ThemedText style={styles.restoreButtonText}>
              Restore Purchases
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Features Overview */}
        <View style={styles.featuresSection}>
          <ThemedText style={styles.featuresTitle}>
            {status?.isActive ? 'Your Premium Features' : 'Premium Features'}
          </ThemedText>

          <View style={styles.featuresList}>
            <FeatureItem
              icon="boat"
              title="Unlimited Race Tracking"
              description="Track all your races with AI analysis"
              hasAccess={status?.isActive}
            />
            <FeatureItem
              icon="globe"
              title="Global Venue Intelligence"
              description="147+ sailing venues with local insights"
              hasAccess={status?.isActive}
            />
            <FeatureItem
              icon="analytics"
              title="AI Race Strategy"
              description="Monte Carlo simulations and tactics"
              hasAccess={status?.isActive}
            />
            <FeatureItem
              icon="cloud-offline"
              title="Offline Capabilities"
              description="Full functionality without internet"
              hasAccess={status?.isActive}
            />
            <FeatureItem
              icon="trending-up"
              title="Performance Analytics"
              description="Track improvement across venues"
              hasAccess={status?.isActive}
            />
          </View>
        </View>

        {/* Danger Zone */}
        {status?.isActive && (
          <View style={styles.dangerZone}>
            <ThemedText style={styles.dangerTitle}>Subscription Management</ThemedText>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
            >
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <ThemedText style={styles.cancelButtonText}>
                Cancel Subscription
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.cancelNote}>
              You'll retain access until your current billing period ends
            </ThemedText>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.supportInfo}>
            <Ionicons name="help-circle" size={16} color="#94a3b8" />
            <ThemedText style={styles.supportText}>
              Need help? Contact support at hello@regattaflow.app
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
  hasAccess?: boolean;
}

function FeatureItem({ icon, title, description, hasAccess }: FeatureItemProps) {
  return (
    <View style={[
      styles.featureItem,
      !hasAccess && styles.featureItemLocked
    ]}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon as any}
          size={20}
          color={hasAccess ? "#0ea5e9" : "#64748b"}
        />
      </View>
      <View style={styles.featureContent}>
        <ThemedText style={[
          styles.featureTitle,
          !hasAccess && styles.featureTitleLocked
        ]}>
          {title}
        </ThemedText>
        <ThemedText style={[
          styles.featureDescription,
          !hasAccess && styles.featureDescriptionLocked
        ]}>
          {description}
        </ThemedText>
      </View>
      {!hasAccess && (
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={16} color="#64748b" />
        </View>
      )}
    </View>
  );
}

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
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
  },

  // Status Section
  statusSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statusCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
  },
  activeStatusCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
  },
  inactiveStatusCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  refreshButton: {
    padding: 8,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  trialText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  subscriptionDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '500',
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  restoreButtonText: {
    fontSize: 14,
    color: '#64748b',
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  featureItemLocked: {
    opacity: 0.6,
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderRadius: 20,
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
  featureTitleLocked: {
    color: '#94a3b8',
  },
  featureDescription: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  featureDescriptionLocked: {
    color: '#64748b',
  },
  lockIcon: {
    marginLeft: 8,
  },

  // Danger Zone
  dangerZone: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  cancelNote: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  supportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});