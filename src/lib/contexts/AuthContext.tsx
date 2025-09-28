import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase, queryWithRetry } from '@/src/services/supabase';
import { User, Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useGoogleAuth, useAppleAuth } from '@/src/lib/auth/useOAuth';
import * as biometricService from '@/src/lib/auth/biometric';
import * as secureStorage from '@/src/lib/auth/secureStorage';
import { getDashboardRoute, shouldCompleteOnboarding, getOnboardingRoute } from '@/src/lib/utils/userTypeRouting';

type UserType = 'sailor' | 'club' | 'coach';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType;
  onboarding_completed: boolean;
  subscription_status: string;
  subscription_tier: string;
  stripe_customer_id?: string;
  created_at: string;
}

interface AuthContextType {
  // Core auth state - never blocks on profile
  ready: boolean;
  signedIn: boolean;
  user: User | null;
  session: Session | null;

  // Profile state - separate from auth readiness
  userProfile: UserProfile | null;
  userType: UserType | null;
  profileLoading: boolean;
  profileError: Error | null;

  // Device capabilities
  biometricAvailable: boolean;
  biometricEnabled: boolean;

  // Auth methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, userType: UserType) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // OAuth methods
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;

  // Biometric methods
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  signInWithBiometric: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Core auth state - never blocks on profile
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Profile state - separate from auth readiness
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);

  // Device capabilities
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // OAuth hooks
  const { signInWithGoogle: googleSignIn } = useGoogleAuth();
  const { signInWithApple: appleSignIn } = useAppleAuth();

  // Load profile with deadline and finally block - never blocks auth
  const loadUserProfile = async (userId: string) => {
    console.log('🔍 [PROFILE] Starting profile load for user:', userId);
    const start = Date.now();

    setProfileLoading(true);
    setProfileError(null);

    let cancelled = false;

    try {
      // 8s watchdog - if exceeded, we surface UI but don't block app
      const deadline = Date.now() + 8000;

      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data as UserProfile;
      };

      let lastError: any;
      let profile: UserProfile | null = null;

      // Retry loop with deadline
      while (Date.now() < deadline && !cancelled) {
        try {
          profile = await queryWithRetry(fetchProfile, 2, 700); // Shorter retry for profile
          lastError = undefined;
          break;
        } catch (e) {
          lastError = e;
          console.warn('⚠️ [PROFILE] Profile fetch attempt failed:', e);
        }
      }

      if (lastError && !cancelled) {
        throw lastError;
      }

      if (profile && !cancelled) {
        console.log('✅ [PROFILE] Profile loaded successfully:', profile);
        setUserProfile(profile);
        setUserType(profile.user_type);
      }

    } catch (error: any) {
      console.warn('⚠️ [PROFILE] Profile load failed:', error.message);
      if (!cancelled) {
        setProfileError(error);
      }
    } finally {
      console.log('⏱️ [PROFILE] Profile load completed in:', Date.now() - start, 'ms');
      if (!cancelled) {
        setProfileLoading(false); // CRITICAL: Always clears loading state
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('🔄 [AUTH] Initializing auth provider...');

      try {
        // Check biometric capabilities first
        const capabilities = await biometricService.getBiometricCapabilities();
        if (mounted) setBiometricAvailable(capabilities.isAvailable);

        const isEnabled = await biometricService.isBiometricAuthEnabled();
        if (mounted) setBiometricEnabled(isEnabled);

        // Get initial session state
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        console.log('🔍 [AUTH] Initial session check:', {
          hasSession: !!data?.session,
          userId: data?.session?.user?.id
        });

        // Set auth state immediately - don't wait for profile
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setSignedIn(!!data.session);
        setReady(true); // Auth is ready regardless of profile state

        // Load profile separately if user exists
        if (data.session?.user) {
          loadUserProfile(data.session.user.id);
        }

      } catch (error) {
        console.error('❌ [AUTH] Auth initialization error:', error);
        if (mounted) {
          setReady(true); // Still mark as ready even on error
        }
      }
    };

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 [AUTH] Auth state change:', event, !!session);

      if (!mounted) return;

      // Update auth state immediately
      setSession(session);
      setUser(session?.user ?? null);
      setSignedIn(!!session);

      // Load profile separately if signed in
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        // Clear profile state when signed out
        setUserProfile(null);
        setUserType(null);
        setProfileLoading(false);
        setProfileError(null);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Auth state will be updated by the listener
      // Store auth tokens securely
      if (data.session?.access_token && data.session?.refresh_token) {
        await secureStorage.storeAuthTokens(
          data.session.access_token,
          data.session.refresh_token
        );
      }

      // Prompt for biometric setup if available and not already enabled
      if (biometricAvailable && !biometricEnabled && data.user) {
        const shouldSetup = await biometricService.showBiometricSetupPrompt();
        if (shouldSetup) {
          await enableBiometric();
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, fullName: string, userType: UserType) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          },
        },
      });

      if (error) throw error;

      // Insert user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            user_type: userType,
            onboarding_completed: false,
            subscription_status: 'trialing',
            subscription_tier: 'free',
          });

        if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
          console.error('Profile creation error:', profileError);
        }
      }

      // Auth state will be updated by the listener
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      loadUserProfile(user.id);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('User must be authenticated to update profile');
    }

    console.log('🔍 [AUTH] Updating user profile:', {
      userId: user.id,
      updates,
      timestamp: new Date().toISOString()
    });

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('🔴 [AUTH] Profile update error:', error);
        throw error;
      }

      console.log('✅ [AUTH] Profile updated successfully:', data);

      // Update local state
      setUserProfile(data as UserProfile);
      if (updates.user_type) {
        setUserType(updates.user_type);
      }

      return data;
    } catch (error: any) {
      console.error('🔴 [AUTH] Failed to update user profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear all secure storage
      await secureStorage.clearAuthData();

      // Auth state will be cleared by the listener
      setBiometricEnabled(false);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'regattaflow://auth/reset-password', // Use deep link for mobile
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset email');
    }
  };

  // OAuth Authentication Methods - simplified
  const signInWithGoogle = async () => {
    console.log('🔍 [AUTH] Starting Google sign-in...');
    try {
      await googleSignIn();
      console.log('✅ [AUTH] Google sign-in initiated - auth listener will handle state');
    } catch (error: any) {
      console.error('🔴 [AUTH] Google sign-in failed:', error);
      throw new Error(error.message || 'Google sign-in failed');
    }
  };

  const signInWithApple = async () => {
    console.log('🔍 [AUTH] Starting Apple sign-in...');
    try {
      await appleSignIn();
      console.log('✅ [AUTH] Apple sign-in initiated - auth listener will handle state');
    } catch (error: any) {
      console.error('🔴 [AUTH] Apple sign-in failed:', error);
      throw new Error(error.message || 'Apple sign-in failed');
    }
  };

  // Biometric Authentication Methods
  const enableBiometric = async () => {
    try {
      if (!user || !session?.access_token) {
        throw new Error('User must be logged in to enable biometric authentication');
      }

      const result = await biometricService.enableBiometricAuth(
        user.id,
        session.access_token
      );

      if (result.success) {
        setBiometricEnabled(true);
        if (result.warning) {
          Alert.alert('Biometric Enabled', result.warning);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to enable biometric authentication');
    }
  };

  const disableBiometric = async () => {
    try {
      const result = await biometricService.disableBiometricAuth();
      if (result.success) {
        setBiometricEnabled(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to disable biometric authentication');
    }
  };

  const signInWithBiometric = async () => {
    try {
      const result = await biometricService.biometricLogin();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Note: In a real implementation, you would validate the stored token
      // and potentially refresh the session with Supabase
      console.log('✅ [AUTH] Biometric authentication successful');

    } catch (error: any) {
      throw new Error(error.message || 'Biometric authentication failed');
    }
  };

  // Debug logging for auth state
  React.useEffect(() => {
    console.log('🔍 [AUTH] Context state change:', {
      ready,
      signedIn,
      user: user?.email || 'null',
      userProfile: userProfile?.full_name || 'null',
      userType,
      profileLoading,
      sessionExists: !!session
    });
  }, [ready, signedIn, user, userProfile, userType, profileLoading, session]);

  const value = {
    // Core auth state
    ready,
    signedIn,
    user,
    session,

    // Profile state
    userProfile,
    userType,
    profileLoading,
    profileError,

    // Device capabilities
    biometricAvailable,
    biometricEnabled,

    // Auth methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUserProfile,
    updateUserProfile,
    signInWithGoogle,
    signInWithApple,
    enableBiometric,
    disableBiometric,
    signInWithBiometric,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      if (Platform.OS === 'web') {
        // Web: Navigate using window.location
        window.location.href = '/login';
      } else {
        // Mobile: Navigate using Expo Router
        router.replace('/(auth)/login');
      }
    }
  }, [auth.loading, auth.user]);

  return auth;
}