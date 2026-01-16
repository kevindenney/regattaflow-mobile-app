import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CoachWelcomeData {
  fullName: string;
  professionalTitle: string;
  experience: string;
  organization?: string;
  phone?: string;
  languages: string[];
}

export interface CoachAvailabilityData {
  // Weekly availability
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;

  // Time of day
  morning: boolean;
  afternoon: boolean;
  evening: boolean;

  // Location preferences
  locationPreference: 'in-person' | 'remote';
  remoteCoaching: boolean;
  maxDistance: number;

  // Group sizes
  individualSessions: boolean;
  smallGroup: boolean;
  largeGroup: boolean;
}

export interface CoachPricingData {
  pricingModel: 'hourly' | 'packages';
  currency: string;
  hourlyRate?: string;
  sessionDuration?: string;
  packagePrices?: {
    single: string;
    five: string;
    ten: string;
  };
}

export interface CoachExpertiseData {
  areas: string[]; // e.g., ['match_racing', 'boat_handling', 'tactics']
  specialties: string[]; // e.g., ['dragon', 'swan', 'j_boats']
}

export interface CoachPaymentSetupData {
  stripeOnboardingStarted: boolean;
  stripeOnboardingComplete: boolean;
  stripeOnboardingSkipped: boolean;
  stripeAccountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

export interface CoachOnboardingState {
  welcome: CoachWelcomeData | null;
  expertise: CoachExpertiseData | null;
  availability: CoachAvailabilityData | null;
  pricing: CoachPricingData | null;
  paymentSetup: CoachPaymentSetupData | null;
  currentStep: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const STORAGE_KEY = '@coach_onboarding_state';

export const useCoachOnboardingState = () => {
  const { user } = useAuth();
  const [state, setState] = useState<CoachOnboardingState>({
    welcome: null,
    expertise: null,
    availability: null,
    pricing: null,
    paymentSetup: null,
    currentStep: 0,
    loading: true,
    saving: false,
    error: null,
  });

  // Load state from AsyncStorage and Supabase on mount
  useEffect(() => {
    loadState();
  }, [user]);

  // Save state to AsyncStorage whenever it changes
  useEffect(() => {
    if (!state.loading) {
      saveStateToStorage();
    }
  }, [state.welcome, state.expertise, state.availability, state.pricing, state.paymentSetup, state.currentStep]);

  const loadState = async () => {
    try {
      // First, try to load from AsyncStorage (for partial progress)
      const storedState = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedState) {
        const parsed = JSON.parse(storedState);
        setState(prev => ({ ...prev, ...parsed, loading: false }));
      }

      // Then, try to load from Supabase (if already saved)
      if (user) {
        const { data: profile } = await supabase
          .from('coach_profiles')
          .select('*, coach_availability(*), coach_services(*)')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          // Merge Supabase data with current state
          setState(prev => ({
            ...prev,
            welcome: {
              fullName: profile.full_name,
              professionalTitle: profile.professional_title,
              experience: profile.experience_level,
              organization: profile.organization || undefined,
              phone: profile.phone || undefined,
              languages: profile.languages || [],
            },
            expertise: {
              areas: profile.specializations || [],
              specialties: [], // Stored together in specializations field
            },
            availability: profile.coach_availability ? {
              monday: profile.coach_availability.monday,
              tuesday: profile.coach_availability.tuesday,
              wednesday: profile.coach_availability.wednesday,
              thursday: profile.coach_availability.thursday,
              friday: profile.coach_availability.friday,
              saturday: profile.coach_availability.saturday,
              sunday: profile.coach_availability.sunday,
              morning: profile.coach_availability.morning,
              afternoon: profile.coach_availability.afternoon,
              evening: profile.coach_availability.evening,
              locationPreference: profile.coach_availability.location_preference,
              remoteCoaching: profile.coach_availability.remote_coaching,
              maxDistance: profile.coach_availability.max_distance_km,
              individualSessions: profile.coach_availability.individual_sessions,
              smallGroup: profile.coach_availability.small_group,
              largeGroup: profile.coach_availability.large_group,
            } : null,
            pricing: profile.coach_services ? {
              pricingModel: profile.coach_services.pricing_model,
              currency: profile.coach_services.currency,
              hourlyRate: profile.coach_services.hourly_rate?.toString(),
              sessionDuration: profile.coach_services.session_duration_minutes?.toString(),
              packagePrices: {
                single: profile.coach_services.single_session_price?.toString() || '',
                five: profile.coach_services.five_session_price?.toString() || '',
                ten: profile.coach_services.ten_session_price?.toString() || '',
              },
            } : null,
            paymentSetup: {
              stripeOnboardingStarted: !!profile.stripe_account_id,
              stripeOnboardingComplete: profile.stripe_onboarding_complete || false,
              stripeOnboardingSkipped: profile.stripe_onboarding_skipped || false,
              stripeAccountId: profile.stripe_account_id || undefined,
              chargesEnabled: profile.stripe_charges_enabled || false,
              payoutsEnabled: profile.stripe_payouts_enabled || false,
            },
            loading: false,
          }));
        }
      }

      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Error loading coach onboarding state:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to load onboarding state' }));
    }
  };

  const saveStateToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        welcome: state.welcome,
        expertise: state.expertise,
        availability: state.availability,
        pricing: state.pricing,
        paymentSetup: state.paymentSetup,
        currentStep: state.currentStep,
      }));
    } catch (error) {
      console.error('Error saving state to storage:', error);
    }
  };

  const updateWelcome = useCallback((data: CoachWelcomeData) => {
    setState(prev => ({ ...prev, welcome: data, currentStep: Math.max(prev.currentStep, 1) }));
  }, []);

  const updateExpertise = useCallback((data: CoachExpertiseData) => {
    setState(prev => ({ ...prev, expertise: data, currentStep: Math.max(prev.currentStep, 2) }));
  }, []);

  const updateAvailability = useCallback((data: CoachAvailabilityData) => {
    setState(prev => ({ ...prev, availability: data, currentStep: Math.max(prev.currentStep, 3) }));
  }, []);

  const updatePricing = useCallback((data: CoachPricingData) => {
    setState(prev => ({ ...prev, pricing: data, currentStep: Math.max(prev.currentStep, 4) }));
  }, []);

  const updatePaymentSetup = useCallback((data: Partial<CoachPaymentSetupData>) => {
    setState(prev => ({
      ...prev,
      paymentSetup: {
        stripeOnboardingStarted: data.stripeOnboardingStarted ?? prev.paymentSetup?.stripeOnboardingStarted ?? false,
        stripeOnboardingComplete: data.stripeOnboardingComplete ?? prev.paymentSetup?.stripeOnboardingComplete ?? false,
        stripeOnboardingSkipped: data.stripeOnboardingSkipped ?? prev.paymentSetup?.stripeOnboardingSkipped ?? false,
        stripeAccountId: data.stripeAccountId ?? prev.paymentSetup?.stripeAccountId,
        chargesEnabled: data.chargesEnabled ?? prev.paymentSetup?.chargesEnabled,
        payoutsEnabled: data.payoutsEnabled ?? prev.paymentSetup?.payoutsEnabled,
      },
      currentStep: Math.max(prev.currentStep, 5),
    }));
  }, []);

  const saveToSupabase = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (!state.welcome || !state.expertise || !state.availability || !state.pricing) {
      return { success: false, error: 'Incomplete onboarding data' };
    }

    setState(prev => ({ ...prev, saving: true, error: null }));

    try {
      // Combine expertise areas and specialties into specializations array
      const specializations = [...state.expertise.areas, ...state.expertise.specialties];

      // 1. Create or update coach profile
      const { data: profile, error: profileError } = await supabase
        .from('coach_profiles')
        .upsert({
          user_id: user.id,
          full_name: state.welcome.fullName,
          professional_title: state.welcome.professionalTitle,
          experience_level: state.welcome.experience,
          organization: state.welcome.organization || null,
          phone: state.welcome.phone || null,
          languages: state.welcome.languages,
          specializations: specializations,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Failed to create coach profile');

      // 2. Create or update coach availability
      const { error: availabilityError } = await supabase
        .from('coach_availability')
        .upsert({
          coach_id: profile.id,
          monday: state.availability.monday,
          tuesday: state.availability.tuesday,
          wednesday: state.availability.wednesday,
          thursday: state.availability.thursday,
          friday: state.availability.friday,
          saturday: state.availability.saturday,
          sunday: state.availability.sunday,
          morning: state.availability.morning,
          afternoon: state.availability.afternoon,
          evening: state.availability.evening,
          location_preference: state.availability.locationPreference,
          remote_coaching: state.availability.remoteCoaching,
          max_distance_km: state.availability.maxDistance,
          individual_sessions: state.availability.individualSessions,
          small_group: state.availability.smallGroup,
          large_group: state.availability.largeGroup,
          updated_at: new Date().toISOString(),
        });

      if (availabilityError) throw availabilityError;

      // 3. Create or update coach services
      const { error: servicesError } = await supabase
        .from('coach_services')
        .upsert({
          coach_id: profile.id,
          pricing_model: state.pricing.pricingModel,
          currency: state.pricing.currency,
          hourly_rate: state.pricing.hourlyRate ? parseFloat(state.pricing.hourlyRate) : null,
          session_duration_minutes: state.pricing.sessionDuration ? parseInt(state.pricing.sessionDuration) : null,
          single_session_price: state.pricing.packagePrices?.single ? parseFloat(state.pricing.packagePrices.single) : null,
          five_session_price: state.pricing.packagePrices?.five ? parseFloat(state.pricing.packagePrices.five) : null,
          ten_session_price: state.pricing.packagePrices?.ten ? parseFloat(state.pricing.packagePrices.ten) : null,
          updated_at: new Date().toISOString(),
        });

      if (servicesError) throw servicesError;

      // 4. Update user record to mark onboarding as complete
      const { error: userError } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (userError) throw userError;

      // Clear AsyncStorage after successful save
      await AsyncStorage.removeItem(STORAGE_KEY);

      setState(prev => ({ ...prev, saving: false }));
      return { success: true };
    } catch (error: any) {
      console.error('Error saving coach onboarding data:', error);
      setState(prev => ({ ...prev, saving: false, error: error.message || 'Failed to save onboarding data' }));
      return { success: false, error: error.message || 'Failed to save onboarding data' };
    }
  }, [user, state.welcome, state.availability, state.pricing]);

  const publishProfile = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // First, save all data
    const saveResult = await saveToSupabase();
    if (!saveResult.success) {
      return saveResult;
    }

    try {
      // Mark profile as published
      const { error: publishError } = await supabase
        .from('coach_profiles')
        .update({ profile_published: true })
        .eq('user_id', user.id);

      if (publishError) throw publishError;

      // Add coaching capability to enable coach features
      // Uses upsert so it's safe if capability already exists
      const { error: capabilityError } = await supabase
        .from('user_capabilities')
        .upsert({
          user_id: user.id,
          capability_type: 'coaching',
          is_active: true,
          activated_at: new Date().toISOString(),
          metadata: { source: 'coach_onboarding', published_at: new Date().toISOString() },
        }, {
          onConflict: 'user_id,capability_type',
        });

      if (capabilityError) {
        console.warn('Failed to add coaching capability:', capabilityError);
        // Don't fail the whole operation for capability error
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error publishing coach profile:', error);
      return { success: false, error: error.message || 'Failed to publish profile' };
    }
  }, [user, saveToSupabase]);

  const clearState = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({
      welcome: null,
      expertise: null,
      availability: null,
      pricing: null,
      paymentSetup: null,
      currentStep: 0,
      loading: false,
      saving: false,
      error: null,
    });
  }, []);

  return {
    state,
    updateWelcome,
    updateExpertise,
    updateAvailability,
    updatePricing,
    updatePaymentSetup,
    saveToSupabase,
    publishProfile,
    clearState,
    loading: state.loading,
    saving: state.saving,
    error: state.error,
  };
};
