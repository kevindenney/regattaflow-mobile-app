/**
 * Enhanced Sailor Onboarding Flow
 * Beautiful multi-step onboarding for sailors with:
 * - Profile setup
 * - Home venue selection (GPS auto-detect)
 * - Boat information
 * - Value demo (AI features)
 * - Subscription choice
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { OnboardingProgress } from '@/components/onboarding';
import { SailorSubscriptionChoice } from '@/components/onboarding/SailorSubscriptionChoice';
import * as Location from 'expo-location';

// ============================================================================
// TYPES
// ============================================================================

type OnboardingStep = 
  | 'welcome'
  | 'profile'
  | 'venue'
  | 'boat'
  | 'value_demo'
  | 'subscription';

interface VenueData {
  id: string;
  name: string;
  country: string;
  region: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

interface BoatClassData {
  id: string;
  name: string;
}

interface OnboardingState {
  // Profile
  fullName: string;
  
  // Venue
  selectedVenue: VenueData | null;
  venueSearchQuery: string;
  nearbyVenues: VenueData[];
  
  // Boat
  boatClass: BoatClassData | null;
  boatClassSearch: string;
  boatName: string;
  sailNumber: string;
  
  // Progress
  currentStep: OnboardingStep;
  isLoading: boolean;
}

const STEP_ORDER: OnboardingStep[] = ['welcome', 'profile', 'venue', 'boat', 'value_demo', 'subscription'];
const STEP_LABELS = ['Welcome', 'Profile', 'Venue', 'Boat', 'Demo', 'Plan'];

// ============================================================================
// COMPONENT
// ============================================================================

export default function SailorOnboardingEnhanced() {
  const { user, updateUserProfile, userProfile } = useAuth();
  
  const [state, setState] = useState<OnboardingState>({
    fullName: userProfile?.full_name || user?.user_metadata?.full_name || '',
    selectedVenue: null,
    venueSearchQuery: '',
    nearbyVenues: [],
    boatClass: null,
    boatClassSearch: '',
    boatName: '',
    sailNumber: '',
    currentStep: 'welcome',
    isLoading: false,
  });
  
  const [boatClasses, setBoatClasses] = useState<BoatClassData[]>([]);
  const [venueResults, setVenueResults] = useState<VenueData[]>([]);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  // Load boat classes on mount
  useEffect(() => {
    loadBoatClasses();
  }, []);

  // Auto-detect location on venue step
  useEffect(() => {
    if (state.currentStep === 'venue') {
      detectNearbyVenues();
    }
  }, [state.currentStep]);

  const loadBoatClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('boat_classes')
        .select('id, name')
        .order('name');
      
      if (data && !error) {
        setBoatClasses(data);
      }
    } catch (error) {
      console.error('Error loading boat classes:', error);
    }
  };

  const detectNearbyVenues = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status !== 'granted') return;
      
      setState(s => ({ ...s, isLoading: true }));
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // Search for nearby venues
      const { data, error } = await supabase
        .from('sailing_venues')
        .select('id, name, country, region, coordinates_lat, coordinates_lng')
        .limit(5);
      
      if (data && !error) {
        // Sort by distance (simple calculation)
        const sorted = data.sort((a, b) => {
          const distA = Math.sqrt(
            Math.pow(a.coordinates_lat - location.coords.latitude, 2) +
            Math.pow(a.coordinates_lng - location.coords.longitude, 2)
          );
          const distB = Math.sqrt(
            Math.pow(b.coordinates_lat - location.coords.latitude, 2) +
            Math.pow(b.coordinates_lng - location.coords.longitude, 2)
          );
          return distA - distB;
        });
        
        setState(s => ({ ...s, nearbyVenues: sorted }));
      }
    } catch (error) {
      console.error('Error detecting location:', error);
    } finally {
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  const searchVenues = async (query: string) => {
    if (query.length < 2) {
      setVenueResults([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .select('id, name, country, region, coordinates_lat, coordinates_lng')
        .ilike('name', `%${query}%`)
        .limit(10);
      
      if (data && !error) {
        setVenueResults(data);
      }
    } catch (error) {
      console.error('Error searching venues:', error);
    }
  };

  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep);

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setState(s => ({ ...s, currentStep: STEP_ORDER[nextIndex] }));
    }
  };

  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setState(s => ({ ...s, currentStep: STEP_ORDER[prevIndex] }));
    }
  };

  const saveProgress = async () => {
    if (!user) return;
    
    try {
      // Save sailor profile
      const profileData: any = {
        user_type: 'sailor',
        full_name: state.fullName,
      };
      
      if (state.selectedVenue) {
        profileData.home_venue_id = state.selectedVenue.id;
        profileData.home_venue_name = state.selectedVenue.name;
      }
      
      await updateUserProfile(profileData);
      
      // Save boat if provided
      if (state.boatClass && state.boatName) {
        await supabase.from('sailor_boats').upsert({
          sailor_id: user.id,
          class_id: state.boatClass.id,
          name: state.boatName,
          sail_number: state.sailNumber || null,
          is_primary: true,
          status: 'active',
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleComplete = async (selectedPlan: string) => {
    try {
      await saveProgress();
      
      await updateUserProfile({
        onboarding_completed: true,
        subscription_tier: selectedPlan,
      });
      
      // Navigate to dashboard
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.replace('/(tabs)/dashboard');
    }
  };

  // ============================================================================
  // RENDER STEPS
  // ============================================================================

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeIconContainer}>
        <Text style={styles.welcomeIcon}>⛵</Text>
      </View>
      
      <Text style={styles.welcomeTitle}>Welcome to RegattaFlow</Text>
      <Text style={styles.welcomeSubtitle}>
        AI-powered racing intelligence for sailors who want to win
      </Text>
      
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🎯</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>AI Race Analysis</Text>
            <Text style={styles.featureDescription}>Get strategic recommendations from your race documents</Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🌍</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Venue Intelligence</Text>
            <Text style={styles.featureDescription}>Local conditions, wind patterns, and tidal info</Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📊</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Performance Analytics</Text>
            <Text style={styles.featureDescription}>Track your progress and find improvement areas</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.trialBadge}>
        <Text style={styles.trialBadgeText}>🎁 7-Day Free Trial • Full Access</Text>
      </View>
      
      <TouchableOpacity style={styles.primaryButton} onPress={goToNextStep}>
        <Text style={styles.primaryButtonText}>Let's Get Started</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfileStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What should we call you?</Text>
      <Text style={styles.stepSubtitle}>This will be shown to your crew and competitors</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={state.fullName}
          onChangeText={(text) => setState(s => ({ ...s, fullName: text }))}
          autoCapitalize="words"
          autoFocus
        />
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={goToPrevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryButton, styles.flexButton, !state.fullName.trim() && styles.buttonDisabled]} 
          onPress={goToNextStep}
          disabled={!state.fullName.trim()}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVenueStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Where do you sail?</Text>
      <Text style={styles.stepSubtitle}>We'll customize conditions and intelligence for your home waters</Text>
      
      {state.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>Detecting nearby venues...</Text>
        </View>
      ) : (
        <>
          {state.nearbyVenues.length > 0 && (
            <View style={styles.nearbySection}>
              <Text style={styles.sectionLabel}>📍 Nearby Venues</Text>
              {state.nearbyVenues.map((venue) => (
                <TouchableOpacity
                  key={venue.id}
                  style={[
                    styles.venueCard,
                    state.selectedVenue?.id === venue.id && styles.venueCardSelected
                  ]}
                  onPress={() => setState(s => ({ ...s, selectedVenue: venue }))}
                >
                  <Text style={[
                    styles.venueName,
                    state.selectedVenue?.id === venue.id && styles.venueNameSelected
                  ]}>
                    {venue.name}
                  </Text>
                  <Text style={styles.venueLocation}>{venue.region}, {venue.country}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <View style={styles.searchSection}>
            <Text style={styles.sectionLabel}>🔍 Search Venues</Text>
            <TextInput
              style={styles.input}
              placeholder="Search by name..."
              value={state.venueSearchQuery}
              onChangeText={(text) => {
                setState(s => ({ ...s, venueSearchQuery: text }));
                searchVenues(text);
              }}
            />
            
            {venueResults.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={[
                  styles.venueCard,
                  state.selectedVenue?.id === venue.id && styles.venueCardSelected
                ]}
                onPress={() => setState(s => ({ ...s, selectedVenue: venue }))}
              >
                <Text style={[
                  styles.venueName,
                  state.selectedVenue?.id === venue.id && styles.venueNameSelected
                ]}>
                  {venue.name}
                </Text>
                <Text style={styles.venueLocation}>{venue.region}, {venue.country}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={goToPrevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryButton, styles.flexButton]} 
          onPress={goToNextStep}
        >
          <Text style={styles.primaryButtonText}>
            {state.selectedVenue ? 'Continue' : 'Skip for now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBoatStep = () => {
    const filteredClasses = boatClasses.filter(bc =>
      bc.name.toLowerCase().includes(state.boatClassSearch.toLowerCase())
    ).slice(0, 8);
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Tell us about your boat</Text>
        <Text style={styles.stepSubtitle}>This helps us provide class-specific guidance</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Boat Class</Text>
          <TextInput
            style={styles.input}
            placeholder="Search boat classes..."
            value={state.boatClassSearch}
            onChangeText={(text) => setState(s => ({ ...s, boatClassSearch: text }))}
          />
          
          {filteredClasses.length > 0 && state.boatClassSearch && (
            <View style={styles.classResults}>
              {filteredClasses.map((bc) => (
                <TouchableOpacity
                  key={bc.id}
                  style={[
                    styles.classOption,
                    state.boatClass?.id === bc.id && styles.classOptionSelected
                  ]}
                  onPress={() => setState(s => ({ 
                    ...s, 
                    boatClass: bc,
                    boatClassSearch: bc.name,
                  }))}
                >
                  <Text style={[
                    styles.classOptionText,
                    state.boatClass?.id === bc.id && styles.classOptionTextSelected
                  ]}>
                    {bc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Boat Name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Dragonfly"
            value={state.boatName}
            onChangeText={(text) => setState(s => ({ ...s, boatName: text }))}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Sail Number (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., HKG 123"
            value={state.sailNumber}
            onChangeText={(text) => setState(s => ({ ...s, sailNumber: text }))}
            autoCapitalize="characters"
          />
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={goToPrevStep}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.primaryButton, styles.flexButton]} 
            onPress={goToNextStep}
          >
            <Text style={styles.primaryButtonText}>
              {state.boatClass ? 'Continue' : 'Skip for now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderValueDemoStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.demoHeader}>
        <Text style={styles.demoIcon}>🤖</Text>
        <Text style={styles.stepTitle}>See AI in Action</Text>
        <Text style={styles.stepSubtitle}>
          Here's a preview of what RegattaFlow can do for your racing
        </Text>
      </View>
      
      <View style={styles.demoCard}>
        <View style={styles.demoCardHeader}>
          <Text style={styles.demoCardTitle}>AI Race Analysis</Text>
          <Text style={styles.demoBadge}>PRO FEATURE</Text>
        </View>
        
        <View style={styles.demoContent}>
          <Text style={styles.demoText}>
            Upload your Notice of Race or Sailing Instructions, and our AI will:
          </Text>
          <View style={styles.demoList}>
            <Text style={styles.demoListItem}>✓ Identify key strategic considerations</Text>
            <Text style={styles.demoListItem}>✓ Highlight important rule changes</Text>
            <Text style={styles.demoListItem}>✓ Suggest optimal mark rounding tactics</Text>
            <Text style={styles.demoListItem}>✓ Integrate weather forecasts</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.demoCard}>
        <View style={styles.demoCardHeader}>
          <Text style={styles.demoCardTitle}>Venue Intelligence</Text>
          <Text style={styles.demoBadge}>PRO FEATURE</Text>
        </View>
        
        <View style={styles.demoContent}>
          <Text style={styles.demoText}>
            {state.selectedVenue 
              ? `For ${state.selectedVenue.name}, you'll get:`
              : 'For your sailing venue, you\'ll get:'
            }
          </Text>
          <View style={styles.demoList}>
            <Text style={styles.demoListItem}>✓ Local wind patterns and shifts</Text>
            <Text style={styles.demoListItem}>✓ Tidal current information</Text>
            <Text style={styles.demoListItem}>✓ Historical conditions data</Text>
            <Text style={styles.demoListItem}>✓ Local fleet insights</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={goToPrevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryButton, styles.flexButton]} 
          onPress={goToNextStep}
        >
          <Text style={styles.primaryButtonText}>Choose Your Plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSubscriptionStep = () => (
    <SailorSubscriptionChoice onComplete={handleComplete} showSkip />
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress Bar */}
      {state.currentStep !== 'subscription' && (
        <View style={styles.progressContainer}>
          <OnboardingProgress
            currentStep={currentStepIndex}
            totalSteps={STEP_ORDER.length}
            stepLabels={STEP_LABELS}
            color="#0EA5E9"
            showStepLabels={false}
          />
        </View>
      )}
      
      {/* Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {state.currentStep === 'welcome' && renderWelcomeStep()}
        {state.currentStep === 'profile' && renderProfileStep()}
        {state.currentStep === 'venue' && renderVenueStep()}
        {state.currentStep === 'boat' && renderBoatStep()}
        {state.currentStep === 'value_demo' && renderValueDemoStep()}
        {state.currentStep === 'subscription' && renderSubscriptionStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  
  // Step Container
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 22,
  },
  
  // Welcome
  welcomeIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeIcon: {
    fontSize: 64,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featureList: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  trialBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  trialBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  
  // Inputs
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0F172A',
  },
  
  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 24,
  },
  primaryButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  flexButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Loading
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  
  // Venue
  nearbySection: {
    marginBottom: 24,
  },
  searchSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  venueCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  venueCardSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  venueNameSelected: {
    color: '#0369A1',
  },
  venueLocation: {
    fontSize: 14,
    color: '#64748B',
  },
  
  // Boat Classes
  classResults: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classOption: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  classOptionSelected: {
    backgroundColor: '#0EA5E9',
  },
  classOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  classOptionTextSelected: {
    color: '#FFFFFF',
  },
  
  // Demo
  demoHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  demoIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  demoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  demoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  demoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  demoBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0EA5E9',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  demoContent: {
    padding: 16,
  },
  demoText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 20,
  },
  demoList: {
    gap: 8,
  },
  demoListItem: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
});

