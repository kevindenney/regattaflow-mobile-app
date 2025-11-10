import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SailorVenueData {
  venueId: string;
  venueName: string;
  venueAddress: string;
  latitude?: number;
  longitude?: number;
  confidence?: number;
}

export interface SailorBoatData {
  boatName: string;
  boatClass: string;
  sailNumber?: string;
  yearBuilt?: string;
  hullColor?: string;
  ownership: 'own' | 'crew' | 'charter';
}

export interface SailorCrewMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  communicationMethods?: string[];
  hasAccess?: boolean;
}

export interface SailorCrewData {
  crewMembers: SailorCrewMember[];
  lookingForCrew: boolean;
  crewRoles: string[];
}

export interface SailorCoachesData {
  interestedInCoaching: boolean;
  coachingBudget?: string;
  preferredCoachingStyle?: string;
  selectedCoachIds: string[];
}

export interface SailorOnboardingState {
  venue: SailorVenueData | null;
  boat: SailorBoatData | null;
  crew: SailorCrewData | null;
  coaches: SailorCoachesData | null;
  currentStep: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const STORAGE_KEY = '@sailor_onboarding_state';

export const useSailorOnboardingState = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SailorOnboardingState>({
    venue: null,
    boat: null,
    crew: null,
    coaches: null,
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
  }, [state.venue, state.boat, state.crew, state.coaches, state.currentStep]);

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
          .from('sailor_profiles')
          .select('*, sailor_boats(*), sailor_crew_preferences(*)')
          .eq('user_id', user.id)
          .maybeSingle();  // Use maybeSingle() to return null instead of throwing on 0 rows

        if (profile) {
          const normalizeCrewMembers = (
            members: Array<Partial<SailorCrewMember>> | null | undefined
          ): SailorCrewMember[] => {
            if (!Array.isArray(members)) return [];

            return members.map((member, index) => ({
              id:
                member.id ||
                `crew-${index}-${member.email || member.name || Date.now().toString()}`,
              name: member.name || 'Crew Member',
              email: member.email || undefined,
              phone: member.phone || undefined,
              role: member.role || 'Crew',
              communicationMethods: Array.isArray(member.communicationMethods)
                ? member.communicationMethods
                : [],
              hasAccess: Boolean(member.hasAccess),
            }));
          };

          // Merge Supabase data with current state
          setState(prev => ({
            ...prev,
            venue: profile.home_venue_id ? {
              venueId: profile.home_venue_id,
              venueName: profile.home_venue_name || '',
              venueAddress: profile.home_venue_address || '',
            } : null,
            boat: profile.sailor_boats && profile.sailor_boats.length > 0 ? {
              boatName: profile.sailor_boats[0].name,
              boatClass: profile.sailor_boats[0].class_id,
              sailNumber: profile.sailor_boats[0].sail_number || undefined,
              yearBuilt: profile.sailor_boats[0].year_built?.toString() || undefined,
              hullColor: profile.sailor_boats[0].hull_material || undefined,
              ownership: profile.sailor_boats[0].ownership_type || 'own',
            } : null,
            crew: profile.sailor_crew_preferences ? {
              crewMembers: normalizeCrewMembers(profile.sailor_crew_preferences.crew_members),
              lookingForCrew: profile.sailor_crew_preferences.looking_for_crew || false,
              crewRoles: profile.sailor_crew_preferences.crew_roles || [],
            } : null,
            loading: false,
          }));
        }
      }

      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Error loading sailor onboarding state:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to load onboarding state' }));
    }
  };

  const saveStateToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        venue: state.venue,
        boat: state.boat,
        crew: state.crew,
        coaches: state.coaches,
        currentStep: state.currentStep,
      }));
    } catch (error) {
      console.error('Error saving state to storage:', error);
    }
  };

  const updateVenue = useCallback((data: SailorVenueData) => {
    setState(prev => ({ ...prev, venue: data, currentStep: Math.max(prev.currentStep, 1) }));
  }, []);

  const updateBoat = useCallback((data: SailorBoatData) => {
    setState(prev => ({ ...prev, boat: data, currentStep: Math.max(prev.currentStep, 2) }));
  }, []);

  const updateCrew = useCallback((data: SailorCrewData) => {
    setState(prev => ({ ...prev, crew: data, currentStep: Math.max(prev.currentStep, 3) }));
  }, []);

  const updateCoaches = useCallback((data: SailorCoachesData) => {
    setState(prev => ({ ...prev, coaches: data, currentStep: Math.max(prev.currentStep, 4) }));
  }, []);

  const saveToSupabase = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (!state.venue) {
      return { success: false, error: 'Venue selection required' };
    }

    setState(prev => ({ ...prev, saving: true, error: null }));

    try {
      // 1. Create or update sailor profile
      const { data: profile, error: profileError } = await supabase
        .from('sailor_profiles')
        .upsert({
          user_id: user.id,
          home_venue_id: state.venue.venueId,
          home_venue_name: state.venue.venueName,
          home_venue_address: state.venue.venueAddress,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Failed to create sailor profile');

      // 2. Create or update boat if provided
      if (state.boat) {
        const { error: boatError } = await supabase
          .from('sailor_boats')
          .upsert({
            sailor_id: profile.id,
            name: state.boat.boatName,
            class_id: state.boat.boatClass,
            sail_number: state.boat.sailNumber || null,
            year_built: state.boat.yearBuilt ? parseInt(state.boat.yearBuilt) : null,
            hull_material: state.boat.hullColor || null,
            ownership_type: state.boat.ownership,
            updated_at: new Date().toISOString(),
          });

        if (boatError) throw boatError;
      }

      // 3. Create or update crew preferences if provided
      if (state.crew) {
        const { error: crewError } = await supabase
          .from('sailor_crew_preferences')
          .upsert({
            sailor_id: profile.id,
            crew_members: state.crew.crewMembers,
            looking_for_crew: state.crew.lookingForCrew,
            crew_roles: state.crew.crewRoles,
            updated_at: new Date().toISOString(),
          });

        if (crewError) throw crewError;
      }

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
      console.error('Error saving sailor onboarding data:', error);
      setState(prev => ({ ...prev, saving: false, error: error.message || 'Failed to save onboarding data' }));
      return { success: false, error: error.message || 'Failed to save onboarding data' };
    }
  }, [user, state.venue, state.boat, state.crew]);

  const clearState = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({
      venue: null,
      boat: null,
      crew: null,
      coaches: null,
      currentStep: 0,
      loading: false,
      saving: false,
      error: null,
    });
  }, []);

  return {
    state,
    updateVenue,
    updateBoat,
    updateCrew,
    updateCoaches,
    saveToSupabase,
    clearState,
    loading: state.loading,
    saving: state.saving,
    error: state.error,
  };
};
