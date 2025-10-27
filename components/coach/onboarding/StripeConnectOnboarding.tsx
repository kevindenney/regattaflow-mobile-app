/**
 * Stripe Connect Onboarding Component for Coaches
 * Handles Stripe Connect account creation and verification for coach payouts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

interface StripeConnectStatus {
  connected: boolean;
  accountId?: string;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  needsOnboarding?: boolean;
  requirements?: any;
}

interface StripeConnectOnboardingProps {
  coachId: string;
  onComplete?: () => void;
  style?: any;
}

export const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({
  coachId,
  onComplete,
  style,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);

  useEffect(() => {
    checkStripeStatus();
  }, [coachId]);

  const checkStripeStatus = async () => {
    if (!user || !coachId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/stripe/connect/onboard?coachId=${coachId}&userId=${user.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        console.error('Failed to check Stripe status');
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async () => {
    if (!user || !coachId) return;

    setConnecting(true);
    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          coachId,
          returnUrl: `${window.location.origin}/coach/onboard/complete`,
          refreshUrl: `${window.location.origin}/coach/onboard/refresh`,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();

        // Open Stripe onboarding in the same window for web
        if (typeof window !== 'undefined') {
          window.location.href = url;
        } else {
          // For mobile, use Linking
          await Linking.openURL(url);
        }
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to start onboarding');
      }
    } catch (error: any) {
      console.error('Error starting onboarding:', error);
      Alert.alert('Error', 'Failed to start onboarding process');
    } finally {
      setConnecting(false);
    }
  };

  const openStripeDashboard = async () => {
    if (!user || !coachId) return;

    try {
      const response = await fetch('/api/stripe/connect/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          coachId,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();

        if (typeof window !== 'undefined') {
          window.open(url, '_blank');
        } else {
          await Linking.openURL(url);
        }
      } else {
        Alert.alert('Error', 'Failed to open Stripe dashboard');
      }
    } catch (error) {
      console.error('Error opening dashboard:', error);
      Alert.alert('Error', 'Failed to open Stripe dashboard');
    }
  };

  const renderConnectButton = () => (
    <TouchableOpacity
      style={[styles.connectButton, connecting && styles.connectButtonDisabled]}
      onPress={startOnboarding}
      disabled={connecting}
    >
      {connecting ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name="card-outline" size={24} color="#FFFFFF" />
          <Text style={styles.connectButtonText}>Connect with Stripe</Text>
        </>
      )}
    </TouchableOpacity>
  );

  const renderIncompleteStatus = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusHeader}>
        <Ionicons name="warning" size={24} color="#FF9500" />
        <Text style={styles.statusTitle}>Complete Stripe Setup</Text>
      </View>

      <Text style={styles.statusDescription}>
        You need to complete your Stripe account setup to receive payments from students.
      </Text>

      {status?.requirements && (
        <View style={styles.requirementsSection}>
          <Text style={styles.requirementsTitle}>Required Information:</Text>
          {status.requirements.currently_due?.map((requirement: string, index: number) => (
            <View key={index} style={styles.requirementItem}>
              <Ionicons name="ellipse" size={8} color="#666" />
              <Text style={styles.requirementText}>
                {formatRequirement(requirement)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.continueButton}
        onPress={startOnboarding}
        disabled={connecting}
      >
        {connecting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.continueButtonText}>Continue Setup</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderConnectedStatus = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusHeader}>
        <Ionicons name="checkmark-circle" size={24} color="#00AA33" />
        <Text style={styles.statusTitle}>Stripe Connected</Text>
      </View>

      <Text style={styles.statusDescription}>
        Your Stripe account is set up and ready to receive payments!
      </Text>

      <View style={styles.capabilitiesSection}>
        <View style={styles.capabilityItem}>
          <Ionicons
            name={status?.chargesEnabled ? "checkmark-circle" : "close-circle"}
            size={20}
            color={status?.chargesEnabled ? "#00AA33" : "#FF3B30"}
          />
          <Text style={styles.capabilityText}>Accept Payments</Text>
        </View>

        <View style={styles.capabilityItem}>
          <Ionicons
            name={status?.payoutsEnabled ? "checkmark-circle" : "close-circle"}
            size={20}
            color={status?.payoutsEnabled ? "#00AA33" : "#FF3B30"}
          />
          <Text style={styles.capabilityText}>Receive Payouts</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.dashboardButton} onPress={openStripeDashboard}>
        <Ionicons name="stats-chart" size={20} color="#0066CC" />
        <Text style={styles.dashboardButtonText}>View Stripe Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Checking Stripe status...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, style]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="card" size={32} color="#0066CC" />
        <Text style={styles.title}>Payment Setup</Text>
        <Text style={styles.subtitle}>
          Connect with Stripe to receive payments from your coaching sessions
        </Text>
      </View>

      {!status?.connected && renderConnectButton()}

      {status?.connected && !status.detailsSubmitted && renderIncompleteStatus()}

      {status?.connected && status.detailsSubmitted && renderConnectedStatus()}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Why Stripe?</Text>
        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark" size={20} color="#00AA33" />
          <Text style={styles.infoText}>Secure and trusted payment processing</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="flash" size={20} color="#FF9500" />
          <Text style={styles.infoText}>Fast payouts to your bank account</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="globe" size={20} color="#0066CC" />
          <Text style={styles.infoText}>Accept payments from around the world</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const formatRequirement = (requirement: string): string => {
  // Format Stripe requirement strings for better readability
  return requirement
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  connectButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  requirementsSection: {
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
  },
  continueButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  capabilitiesSection: {
    marginBottom: 20,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  capabilityText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  dashboardButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  dashboardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  infoSection: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default StripeConnectOnboarding;