import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ClubPaymentData {
  selectedPlan: 'starter' | 'professional' | 'enterprise';
  cardNumber?: string;
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
  billingAddress?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface ClubWebsiteData {
  clubName: string;
  clubWebsite?: string;
  clubDescription?: string;
  clubLogo?: string;
  clubAddress?: string;
  clubCity?: string;
  clubCountry?: string;
  verificationMethod: 'dns' | 'email' | 'manual';
  verificationStatus: 'pending' | 'verified' | 'failed';
}

export interface ClubConfirmationData {
  setupComplete: boolean;
  welcomeMessageSent: boolean;
  dashboardAccessed: boolean;
}

export interface ClubOnboardingState {
  payment: ClubPaymentData | null;
  website: ClubWebsiteData | null;
  confirmation: ClubConfirmationData | null;
  currentStep: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const STORAGE_KEY = '@club_onboarding_state';

export const useClubOnboardingState = () => {
  const { user } = useAuth();
  const [state, setState] = useState<ClubOnboardingState>({
    payment: null,
    website: null,
    confirmation: null,
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
  }, [state.payment, state.website, state.confirmation, state.currentStep]);

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
        const { data: club } = await supabase
          .from('clubs')
          .select('*, club_subscriptions(*)')
          .eq('user_id', user.id)
          .single();

        if (club) {
          // Merge Supabase data with current state
          setState(prev => ({
            ...prev,
            website: {
              clubName: club.club_name,
              clubWebsite: club.website || undefined,
              clubDescription: club.description || undefined,
              clubLogo: club.logo_url || undefined,
              clubAddress: club.address || undefined,
              clubCity: club.city || undefined,
              clubCountry: club.country || undefined,
              verificationMethod: club.verification_method || 'email',
              verificationStatus: club.verification_status || 'pending',
            },
            payment: club.club_subscriptions && club.club_subscriptions.length > 0 ? {
              selectedPlan: club.club_subscriptions[0].plan_id,
              stripeCustomerId: club.club_subscriptions[0].stripe_customer_id || undefined,
              stripeSubscriptionId: club.club_subscriptions[0].stripe_subscription_id || undefined,
            } : null,
            loading: false,
          }));
        }
      }

      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Error loading club onboarding state:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to load onboarding state' }));
    }
  };

  const saveStateToStorage = async () => {
    try {
      // Don't save sensitive payment info to local storage
      const stateToSave = {
        payment: state.payment ? {
          selectedPlan: state.payment.selectedPlan,
          stripeCustomerId: state.payment.stripeCustomerId,
          stripeSubscriptionId: state.payment.stripeSubscriptionId,
        } : null,
        website: state.website,
        confirmation: state.confirmation,
        currentStep: state.currentStep,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state to storage:', error);
    }
  };

  const updatePayment = useCallback((data: ClubPaymentData) => {
    setState(prev => ({ ...prev, payment: data, currentStep: Math.max(prev.currentStep, 1) }));
  }, []);

  const updateWebsite = useCallback((data: ClubWebsiteData) => {
    setState(prev => ({ ...prev, website: data, currentStep: Math.max(prev.currentStep, 2) }));
  }, []);

  const updateConfirmation = useCallback((data: ClubConfirmationData) => {
    setState(prev => ({ ...prev, confirmation: data, currentStep: Math.max(prev.currentStep, 3) }));
  }, []);

  const saveToSupabase = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (!state.website || !state.payment) {
      return { success: false, error: 'Incomplete onboarding data' };
    }

    setState(prev => ({ ...prev, saving: true, error: null }));

    try {
      // 1. Create or update club
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .upsert({
          user_id: user.id,
          club_name: state.website.clubName,
          website: state.website.clubWebsite || null,
          description: state.website.clubDescription || null,
          logo_url: state.website.clubLogo || null,
          address: state.website.clubAddress || null,
          city: state.website.clubCity || null,
          country: state.website.clubCountry || null,
          verification_method: state.website.verificationMethod,
          verification_status: state.website.verificationStatus,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (clubError) throw clubError;
      if (!club) throw new Error('Failed to create club');

      // 2. Create or update subscription record
      if (state.payment.stripeSubscriptionId) {
        const { error: subscriptionError } = await supabase
          .from('club_subscriptions')
          .upsert({
            club_id: club.id,
            plan_id: state.payment.selectedPlan,
            stripe_customer_id: state.payment.stripeCustomerId || null,
            stripe_subscription_id: state.payment.stripeSubscriptionId || null,
            status: 'active',
            updated_at: new Date().toISOString(),
          });

        if (subscriptionError) throw subscriptionError;
      }

      // 3. Update user record to mark onboarding as complete
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
      console.error('Error saving club onboarding data:', error);
      setState(prev => ({ ...prev, saving: false, error: error.message || 'Failed to save onboarding data' }));
      return { success: false, error: error.message || 'Failed to save onboarding data' };
    }
  }, [user, state.website, state.payment]);

  const clearState = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({
      payment: null,
      website: null,
      confirmation: null,
      currentStep: 0,
      loading: false,
      saving: false,
      error: null,
    });
  }, []);

  return {
    state,
    updatePayment,
    updateWebsite,
    updateConfirmation,
    saveToSupabase,
    clearState,
    loading: state.loading,
    saving: state.saving,
    error: state.error,
  };
};
