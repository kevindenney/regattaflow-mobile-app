/**
 * Payment Setup Banner Component
 * Displays a prominent reminder for coaches who haven't completed Stripe Connect setup
 * Can be dismissed temporarily but will reappear after a period
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';

const BANNER_DISMISS_KEY = '@coach_payment_banner_dismissed';
const DISMISS_DURATION_HOURS = 24; // Reappear after 24 hours

interface PaymentSetupBannerProps {
  style?: any;
  variant?: 'full' | 'compact';
  onDismiss?: () => void;
}

interface PaymentStatus {
  needsSetup: boolean;
  skipped: boolean;
  profileId: string | null;
}

export function PaymentSetupBanner({
  style,
  variant = 'full',
  onDismiss,
}: PaymentSetupBannerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    needsSetup: false,
    skipped: false,
    profileId: null,
  });
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    checkPaymentStatus();
  }, [user]);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const checkPaymentStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if banner was recently dismissed
      const dismissedAt = await AsyncStorage.getItem(BANNER_DISMISS_KEY);
      if (dismissedAt) {
        const dismissedTime = new Date(dismissedAt).getTime();
        const now = Date.now();
        const hoursSinceDismiss = (now - dismissedTime) / (1000 * 60 * 60);
        
        if (hoursSinceDismiss < DISMISS_DURATION_HOURS) {
          setLoading(false);
          return;
        }
      }

      // Check coach profile payment status
      const { data: profile, error } = await supabase
        .from('coach_profiles')
        .select('id, stripe_onboarding_complete, stripe_onboarding_skipped, stripe_account_id, profile_published')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        setLoading(false);
        return;
      }

      // Only show banner if profile is published but payments not set up
      const needsSetup = profile.profile_published && !profile.stripe_onboarding_complete;
      const skipped = profile.stripe_onboarding_skipped || false;

      setPaymentStatus({
        needsSetup,
        skipped,
        profileId: profile.id,
      });

      if (needsSetup) {
        setVisible(true);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPayments = () => {
    router.push('/(auth)/coach-onboarding-payment-setup');
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(BANNER_DISMISS_KEY, new Date().toISOString());
      
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        onDismiss?.();
      });
    } catch (error) {
      console.error('Error dismissing banner:', error);
    }
  };

  if (loading || !visible || !paymentStatus.needsSetup) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <Animated.View style={[styles.compactContainer, { opacity: fadeAnim }, style]}>
        <TouchableOpacity
          style={styles.compactContent}
          onPress={handleSetupPayments}
          activeOpacity={0.8}
        >
          <View style={styles.compactIconContainer}>
            <Ionicons name="card-outline" size={18} color="#EA580C" />
          </View>
          <Text style={styles.compactText} numberOfLines={1}>
            {paymentStatus.skipped ? 'Complete payment setup' : 'Set up payments to get paid'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#EA580C" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.compactDismiss} onPress={handleDismiss}>
          <Ionicons name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={paymentStatus.skipped ? "alert-circle" : "card"} 
          size={28} 
          color={paymentStatus.skipped ? "#D97706" : "#EA580C"} 
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {paymentStatus.skipped 
            ? "Payment Setup Incomplete" 
            : "Start Earning from Coaching"}
        </Text>
        <Text style={styles.description}>
          {paymentStatus.skipped 
            ? "You skipped payment setup. Complete it now to accept paid bookings from sailors."
            : "Set up Stripe to receive payments when sailors book your coaching sessions."}
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.setupButton,
              paymentStatus.skipped ? styles.setupButtonWarning : styles.setupButtonPrimary
            ]}
            onPress={handleSetupPayments}
          >
            <Ionicons name="card-outline" size={18} color="#FFFFFF" />
            <Text style={styles.setupButtonText}>
              {paymentStatus.skipped ? "Complete Setup" : "Set Up Payments"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <Text style={styles.dismissButtonText}>Remind me later</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
        <Ionicons name="close" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    paddingRight: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C2410C',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#9A3412',
    lineHeight: 20,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  setupButtonPrimary: {
    backgroundColor: '#EA580C',
  },
  setupButtonWarning: {
    backgroundColor: '#D97706',
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  dismissButtonText: {
    color: '#9A3412',
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  
  // Compact variant styles
  compactContainer: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
    overflow: 'hidden',
  },
  compactContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  compactIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#C2410C',
  },
  compactDismiss: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#FED7AA',
  },
});

export default PaymentSetupBanner;

