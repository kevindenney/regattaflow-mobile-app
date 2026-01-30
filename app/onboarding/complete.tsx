/**
 * Onboarding Complete Screen
 * Shows summary of setup and finishes onboarding
 */

import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';
import { createSailorSampleData } from '@/services/onboarding/SailorSampleDataService';
import { FleetDiscoveryService } from '@/services/FleetDiscoveryService';
import { ClubDiscoveryService } from '@/services/ClubDiscoveryService';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface SetupSummary {
  boatClass?: string;
  homeClub?: string;
  fleet?: string;
  racesCount: number;
  experienceLevel?: string;
}

export default function CompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; avatarUrl?: string }>();
  const { user: authUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [summary, setSummary] = useState<SetupSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const userName = params.name ? decodeURIComponent(params.name) : 'Sailor';
  const firstName = userName.split(' ')[0];

  // Process onboarding completion
  useEffect(() => {
    const completeOnboarding = async () => {
      try {
        // Get user from auth or session
        let userId = authUser?.id;
        if (!userId) {
          const { data: { session } } = await supabase.auth.getSession();
          userId = session?.user?.id;
        }

        if (!userId) {
          throw new Error('No authenticated user found');
        }

        // Get preferences
        const preferences = await OnboardingStateService.getPreferences();
        const isQuickStart = preferences.setupPath === 'quick';

        // Build summary
        const summaryData: SetupSummary = {
          boatClass: preferences.boatClass?.name,
          homeClub: preferences.homeClub?.name,
          fleet: preferences.primaryFleet?.name,
          racesCount: preferences.selectedRaces?.length || 0,
          experienceLevel: preferences.experienceLevel,
        };
        setSummary(summaryData);

        // Create boat if user selected a boat class
        if (preferences.boatClass && !preferences.hasNoBoat) {
          await createBoatForUser(userId, preferences.boatClass.id, preferences.boatClass.name);
        }

        // Join club if user selected one
        if (preferences.homeClub && !preferences.hasNoClub) {
          await ClubDiscoveryService.addYachtClubMembership(userId, preferences.homeClub.id, true);
        }

        // Join fleet if user selected one
        if (preferences.primaryFleet && !preferences.hasNoFleet) {
          await FleetDiscoveryService.joinFleet(userId, preferences.primaryFleet.id, false);
        }

        // Update sailor profile with experience level
        if (preferences.experienceLevel) {
          await updateSailorProfile(userId, preferences.experienceLevel);
        }

        // Create sample data (for quick start or if no boat class selected)
        if (isQuickStart || preferences.hasNoBoat) {
          await createSailorSampleData({
            userId,
            userName,
          });
        }

        // Mark onboarding as complete
        await supabase
          .from('users')
          .update({
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        // Clear onboarding state
        await OnboardingStateService.clearState();

        // Refresh session
        await supabase.auth.refreshSession();

        // Fade in success state
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } catch (err: any) {
        console.error('Error completing onboarding:', err);
        setError(err.message || 'Failed to complete setup');
      } finally {
        setIsProcessing(false);
      }
    };

    completeOnboarding();
  }, [authUser, userName, fadeAnim]);

  const handleGetStarted = useCallback(() => {
    router.replace('/(tabs)/races');
  }, [router]);

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.processingTitle}>Setting up your account...</Text>
            <Text style={styles.processingSubtitle}>
              Creating your personalized racing experience
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Ionicons name="warning" size={48} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleGetStarted}>
              <Text style={styles.retryButtonText}>Continue Anyway</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Success header */}
            <View style={styles.successHeader}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={72} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>You're all set, {firstName}!</Text>
              <Text style={styles.successSubtitle}>
                Your RegattaFlow account is ready. Here's what we've set up for you:
              </Text>
            </View>

            {/* Summary cards */}
            <View style={styles.summaryContainer}>
              {summary?.boatClass && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryIcon}>
                    <Ionicons name="boat" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryLabel}>Boat Class</Text>
                    <Text style={styles.summaryValue}>{summary.boatClass}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              )}

              {summary?.homeClub && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryIcon}>
                    <Ionicons name="flag" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryLabel}>Home Club</Text>
                    <Text style={styles.summaryValue}>{summary.homeClub}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              )}

              {summary?.fleet && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryIcon}>
                    <Ionicons name="people" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryLabel}>Fleet</Text>
                    <Text style={styles.summaryValue}>{summary.fleet}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              )}

              {summary && summary.racesCount > 0 && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryIcon}>
                    <Ionicons name="calendar" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryLabel}>Upcoming Races</Text>
                    <Text style={styles.summaryValue}>
                      {summary.racesCount} race{summary.racesCount > 1 ? 's' : ''} added
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              )}

              {/* Default card for quick start */}
              {!summary?.boatClass && !summary?.homeClub && !summary?.fleet && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryIcon}>
                    <Ionicons name="flash" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryLabel}>Quick Start</Text>
                    <Text style={styles.summaryValue}>Sample data created</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              )}
            </View>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>What's Next</Text>
              <View style={styles.tipRow}>
                <Ionicons name="arrow-forward-circle" size={18} color="#3B82F6" />
                <Text style={styles.tipText}>Add your first race to start preparing</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="arrow-forward-circle" size={18} color="#3B82F6" />
                <Text style={styles.tipText}>Explore the Learn tab for racing tips</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="arrow-forward-circle" size={18} color="#3B82F6" />
                <Text style={styles.tipText}>Customize your profile in Settings</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedButtonText}>Let's Go!</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Helper functions
async function createBoatForUser(userId: string, classId: string, className: string) {
  try {
    // Check if user already has ANY boat
    const { data: existingBoats } = await supabase
      .from('sailor_boats')
      .select('id, class_id, is_primary')
      .eq('sailor_id', userId);

    if (existingBoats && existingBoats.length > 0) {
      console.log('User already has a boat, skipping creation');
      return; // User already has a boat
    }

    // Also check for primary boat with this specific class (unique constraint)
    const { data: existingClassPrimary } = await supabase
      .from('sailor_boats')
      .select('id')
      .eq('sailor_id', userId)
      .eq('class_id', classId)
      .eq('is_primary', true)
      .maybeSingle();

    if (existingClassPrimary) {
      console.log('User already has a primary boat for this class');
      return;
    }

    // Generate a sail number
    const sailNumber = `${className.substring(0, 3).toUpperCase()} ${100 + Math.floor(Math.random() * 900)}`;

    const { error } = await supabase.from('sailor_boats').insert({
      sailor_id: userId,
      class_id: classId,
      name: 'My Boat',
      sail_number: sailNumber,
      is_primary: true,
      status: 'active',
      ownership_type: 'owned',
    });

    // Handle duplicate key gracefully
    if (error && (error.message?.includes('duplicate') || error.code === '23505')) {
      console.log('Boat already exists (duplicate key), skipping');
      return;
    }

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn('Could not create boat:', error);
  }
}

async function updateSailorProfile(userId: string, experienceLevel: string) {
  try {
    // Check if profile exists
    const { data: existing } = await supabase
      .from('sailor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('sailor_profiles')
        .update({ experience_level: experienceLevel })
        .eq('user_id', userId);
    } else {
      await supabase.from('sailor_profiles').insert({
        user_id: userId,
        experience_level: experienceLevel,
      });
    }
  } catch (error) {
    console.warn('Could not update sailor profile:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 8,
  },
  processingSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
  },
  errorText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  content: {},
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  summaryContainer: {
    gap: 12,
    marginBottom: 32,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  tipsContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
