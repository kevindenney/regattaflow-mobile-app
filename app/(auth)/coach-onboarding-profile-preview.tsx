/**
 * Coach Onboarding - Profile Preview (Final Review)
 *
 * Tufte-inspired design with dense summary and edit links
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { showAlert, showAlertWithButtons } from '@/lib/utils/crossPlatformAlert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCoachOnboardingState } from '@/hooks/useCoachOnboardingState';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';

// Design tokens (consistent with other screens)
const COLORS = {
  primary: '#007AFF',
  primaryLight: '#E5F1FF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#8E8E93',
  separator: '#C6C6C8',
  success: '#34C759',
  warning: '#FF9500',
  selected: '#007AFF',
  selectedBg: '#007AFF',
  unselected: '#E5E5EA',
  border: '#D1D1D6',
};

const CoachOnboardingProfilePreview = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { state, publishProfile, loading, saving } = useCoachOnboardingState();

  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    skipped: boolean;
  }>({ connected: false, skipped: false });
  const [checkingStripe, setCheckingStripe] = useState(true);

  useEffect(() => {
    checkStripeStatus();
  }, [user]);

  const checkStripeStatus = async () => {
    if (!user) {
      setCheckingStripe(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('coach_profiles')
        .select('stripe_onboarding_complete, stripe_onboarding_skipped')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setStripeStatus({
          connected: profile.stripe_onboarding_complete || state.paymentSetup?.stripeOnboardingComplete || false,
          skipped: profile.stripe_onboarding_skipped || state.paymentSetup?.stripeOnboardingSkipped || false,
        });
      } else {
        setStripeStatus({
          connected: state.paymentSetup?.stripeOnboardingComplete || false,
          skipped: state.paymentSetup?.stripeOnboardingSkipped || false,
        });
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    } finally {
      setCheckingStripe(false);
    }
  };

  // Build profile data from state
  const profileData = {
    fullName: state.welcome?.fullName || '',
    professionalTitle: state.welcome?.professionalTitle || '',
    experience: state.welcome?.experience || '',
    organization: state.welcome?.organization || '',
    languages: state.welcome?.languages || [],
    expertiseAreas: state.expertise?.areas || [],
    expertiseSpecialties: state.expertise?.specialties || [],
    availability: state.availability || null,
    pricing: state.pricing || null,
  };

  // Format availability summary
  const getAvailabilitySummary = () => {
    if (!profileData.availability) return 'Not set';

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const selectedDays = days
      .filter((day) => profileData.availability?.[day as keyof typeof profileData.availability])
      .map((day) => dayLabels[days.indexOf(day)]);

    const times = [];
    if (profileData.availability.morning) times.push('Morning');
    if (profileData.availability.afternoon) times.push('Afternoon');
    if (profileData.availability.evening) times.push('Evening');

    return `${selectedDays.join(', ')} · ${times.join(', ')}`;
  };

  const getLocationSummary = () => {
    if (!profileData.availability) return '';
    const parts = [];
    if (profileData.availability.locationPreference === 'in-person') {
      parts.push(`In-person (${profileData.availability.maxDistance}km)`);
    }
    if (profileData.availability.remoteCoaching) {
      parts.push('Remote');
    }
    return parts.join(' + ') || 'Not set';
  };

  // Format pricing summary
  const getPricingSummary = () => {
    if (!profileData.pricing) return 'Not set';

    const symbol = profileData.pricing.currency === 'USD' ? '$' :
                   profileData.pricing.currency === 'EUR' ? '\u20AC' :
                   profileData.pricing.currency === 'GBP' ? '\u00A3' :
                   profileData.pricing.currency === 'HKD' ? 'HK$' :
                   profileData.pricing.currency === 'AUD' ? 'A$' : '$';

    if (profileData.pricing.pricingModel === 'hourly') {
      const duration = profileData.pricing.sessionDuration === '60' ? '60 min' :
                       profileData.pricing.sessionDuration === '30' ? '30 min' :
                       profileData.pricing.sessionDuration === '90' ? '90 min' : '2 hr';
      return `${symbol}${profileData.pricing.hourlyRate}/hour · ${duration} sessions`;
    }
    return `Package pricing`;
  };

  // Format expertise summary
  const getExpertiseSummary = () => {
    const areas = profileData.expertiseAreas
      .slice(0, 3)
      .map((a: string) => a.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()));
    return areas.join(', ') || 'Not set';
  };

  const getClassesSummary = () => {
    return profileData.expertiseSpecialties
      .slice(0, 3)
      .map((s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()))
      .join(', ') || 'None selected';
  };

  const isFormComplete = () => {
    return (
      state.welcome !== null &&
      state.expertise !== null &&
      state.availability !== null &&
      state.pricing !== null &&
      profileData.fullName.length > 0
    );
  };

  const handlePublishProfile = async () => {
    if (!isFormComplete()) {
      showAlert('Incomplete Profile', 'Please complete all onboarding steps.');
      return;
    }

    if (!stripeStatus.connected && !stripeStatus.skipped) {
      showAlertWithButtons(
        'Payment Setup Incomplete',
        "You won't be able to accept paid bookings until you set up payments.",
        [
          { text: 'Set Up Payments', onPress: () => router.push('/(auth)/coach-onboarding-payment-setup') },
          { text: 'Continue', style: 'default', onPress: doPublishProfile },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    await doPublishProfile();
  };

  const doPublishProfile = async () => {
    try {
      const result = await publishProfile();
      if (!result.success) {
        showAlert('Error', result.error || 'Failed to publish profile.');
        return;
      }
      router.replace('/(auth)/coach-onboarding-complete');
    } catch (error: any) {
      showAlert('Error', error.message || 'An unexpected error occurred.');
    }
  };

  const navigateToStep = (step: string) => {
    router.push(`/(auth)/${step}` as any);
  };

  if (loading || checkingStripe) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.stepIndicator}>Review</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar - Full */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="checkmark-done" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Review Your Profile</Text>
          <Text style={styles.heroSubtitle}>
            Make sure everything looks good before publishing
          </Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigateToStep('coach-onboarding-welcome')}
            >
              <Text style={styles.editButtonText}>Edit</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.primaryText}>
              {profileData.fullName} · {profileData.professionalTitle}
            </Text>
            <Text style={styles.secondaryText}>
              {profileData.experience} experience
            </Text>
            {profileData.organization && (
              <Text style={styles.tertiaryText}>{profileData.organization}</Text>
            )}
            {profileData.languages.length > 0 && (
              <Text style={styles.tertiaryText}>
                {profileData.languages.join(', ')}
              </Text>
            )}
          </View>
        </View>

        {/* Expertise Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EXPERTISE</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigateToStep('coach-onboarding-expertise')}
            >
              <Text style={styles.editButtonText}>Edit</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.primaryText}>{getExpertiseSummary()}</Text>
            <Text style={styles.secondaryText}>{getClassesSummary()}</Text>
          </View>
        </View>

        {/* Availability Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AVAILABILITY</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigateToStep('coach-onboarding-availability')}
            >
              <Text style={styles.editButtonText}>Edit</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.primaryText}>{getAvailabilitySummary()}</Text>
            <Text style={styles.secondaryText}>{getLocationSummary()}</Text>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PRICING</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigateToStep('coach-onboarding-pricing')}
            >
              <Text style={styles.editButtonText}>Edit</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.primaryText}>{getPricingSummary()}</Text>
          </View>
        </View>

        {/* Payments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PAYMENTS</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigateToStep('coach-onboarding-payment-setup')}
            >
              <Text style={styles.editButtonText}>Edit</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.paymentStatus}>
              {stripeStatus.connected ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={styles.paymentStatusText}>Stripe connected</Text>
                </>
              ) : stripeStatus.skipped ? (
                <>
                  <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
                  <Text style={styles.paymentStatusTextWarning}>Setup skipped</Text>
                </>
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color={COLORS.tertiaryLabel} />
                  <Text style={styles.paymentStatusTextNeutral}>Not connected</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.publishButton,
            (!isFormComplete() || saving) && styles.publishButtonDisabled,
          ]}
          disabled={!isFormComplete() || saving}
          onPress={handlePublishProfile}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={[
                styles.publishButtonText,
                (!isFormComplete() || saving) && styles.publishButtonTextDisabled,
              ]}>
                Publish Profile
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={isFormComplete() && !saving ? '#FFFFFF' : COLORS.tertiaryLabel}
              />
            </>
          )}
        </TouchableOpacity>

        {!isFormComplete() && (
          <Text style={styles.incompleteWarning}>
            Complete all steps to publish your profile
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.secondaryLabel,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  headerRight: {
    width: 44,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.unselected,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.label,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    marginRight: 2,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  primaryText: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.label,
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    marginBottom: 2,
  },
  tertiaryText: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginTop: 4,
  },

  // Payment Status
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusText: {
    fontSize: 15,
    color: COLORS.success,
    marginLeft: 8,
    fontWeight: '500',
  },
  paymentStatusTextWarning: {
    fontSize: 15,
    color: COLORS.warning,
    marginLeft: 8,
    fontWeight: '500',
  },
  paymentStatusTextNeutral: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
    marginLeft: 8,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  publishButtonDisabled: {
    backgroundColor: COLORS.unselected,
  },
  publishButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  publishButtonTextDisabled: {
    color: COLORS.tertiaryLabel,
  },
  incompleteWarning: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default CoachOnboardingProfilePreview;
