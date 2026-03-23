import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { isAppleSignInAvailable } from '@/lib/auth/nativeOAuth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import { normalizePersonaParam, type PersonaRole } from '@/lib/auth/signupPersona';
import { getOnboardingContext } from '@/lib/onboarding/interestContext';
import { SAMPLE_INTERESTS } from '@/lib/landing/sampleData';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to get user-friendly error messages for signup
const getSignupErrorMessage = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code || '';

  if (message.includes('registered') || message.includes('duplicate') || message.includes('already') || code === 'user_already_exists') {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (message.includes('invalid email') || message.includes('email')) {
    return 'Please enter a valid email address.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your internet connection.';
  }
  if (message.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }
  return error?.message || 'Unable to create your account. Please try again.';
};

type SignupStep = 'interest' | 'persona';

export default function SignUp() {
  const { signUp, signInWithGoogle, signInWithApple, loading: authLoading, enterGuestMode } = useAuth();
  const params = useLocalSearchParams<{
    persona?: string;
    interest?: string;
    inviteToken?: string;
    plan?: string;
  }>();

  // If interest comes from URL, skip the interest picker step
  const paramInterest = params.interest || undefined;
  const inviteToken = params.inviteToken || undefined;

  const [selectedInterest, setSelectedInterest] = useState<string | undefined>(paramInterest);
  const [step, setStep] = useState<SignupStep>(paramInterest ? 'persona' : 'interest');

  const interestCtx = getOnboardingContext(selectedInterest);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [persona, setPersona] = useState<PersonaRole>(normalizePersonaParam(params.persona));
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(Platform.OS === 'web');

  const isLoading = loading || authLoading;

  useEffect(() => {
    if (Platform.OS === 'ios') {
      isAppleSignInAvailable().then(setAppleSignInAvailable);
    }
  }, []);

  useEffect(() => {
    setPersona(normalizePersonaParam(params.persona));
  }, [params.persona]);

  const personaLabels = interestCtx.personaLabels;
  const personaSubtitles = interestCtx.personaSubtitles;

  const getSubtitle = () => personaSubtitles[persona];

  const getButtonText = () => {
    if (isLoading) return 'Creating account...';
    return 'Create Account';
  };

  const handleSelectInterest = (slug: string) => {
    setSelectedInterest(slug);
    setStep('persona');
  };

  const handleSignUp = async () => {
    setErrorMessage(null);
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!trimmedUsername) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (trimmedUsername.length < 3) {
      setErrorMessage('Name must be at least 3 characters long.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(trimmedEmail, trimmedUsername, password, persona);

      // Store interest context for onboarding steps to read
      if (selectedInterest) {
        await AsyncStorage.setItem('onboarding_interest_slug', selectedInterest);
      }

      // Store invite token for post-signup acceptance
      if (inviteToken) {
        await AsyncStorage.setItem('pending_invite_token', inviteToken);
        router.replace(`/invite/${inviteToken}` as any);
        return;
      }

      if (persona === 'sailor') {
        // All new users go through name-only onboarding, then get 14-day Pro trial
        router.replace('/onboarding/profile/name-photo');
      } else if (persona === 'coach') {
        router.replace('/(auth)/coach-onboarding-welcome');
      } else if (persona === 'club') {
        const chatRoute = selectedInterest
          ? `/(auth)/club-onboarding-chat?interest=${selectedInterest}`
          : '/(auth)/club-onboarding-chat';
        router.replace(chatRoute as any);
      }
    } catch (error: any) {
      console.error('[Signup] Account creation error:', error);
      const friendlyMessage = getSignupErrorMessage(error);
      setErrorMessage(friendlyMessage);
      showAlert('Signup error', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    try {
      await signInWithGoogle(persona);
      if (inviteToken) {
        await AsyncStorage.setItem('pending_invite_token', inviteToken);
      }
    } catch (error: any) {
      console.error('[Signup] Google sign-up error:', error);
      const friendlyMessage = getSignupErrorMessage(error);
      setErrorMessage(friendlyMessage);
      showAlert('Google sign-up failed', friendlyMessage);
    }
  };

  const handleAppleSignUp = async () => {
    setErrorMessage(null);
    try {
      await signInWithApple(persona);
      if (inviteToken) {
        await AsyncStorage.setItem('pending_invite_token', inviteToken);
      }
    } catch (error: any) {
      console.error('[Signup] Apple sign-up error:', error);
      const friendlyMessage = getSignupErrorMessage(error);
      setErrorMessage(friendlyMessage);
      showAlert('Apple sign-up failed', friendlyMessage);
    }
  };

  // ---- Interest Picker Step ----
  if (step === 'interest') {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.cardHeader}>
              <View style={styles.headerSpacer} />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close sign up"
                onPress={() => enterGuestMode()}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text testID="signup-title" style={styles.title}>What are you working on?</Text>
            <Text style={styles.subtitle}>
              Pick an interest to get started. You can add more later.
            </Text>

            <View style={styles.interestGrid}>
              {SAMPLE_INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest.slug}
                  style={styles.interestCard}
                  onPress={() => handleSelectInterest(interest.slug)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${interest.name}`}
                >
                  <View style={[styles.interestIcon, { backgroundColor: interest.color + '18' }]}>
                    <Ionicons
                      name={(interest.icon + '-outline') as any}
                      size={24}
                      color={interest.color}
                    />
                  </View>
                  <Text style={styles.interestName}>{interest.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setStep('persona')}
            >
              <Text style={styles.skipButtonText}>Skip — I'll choose later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="signup-signin-link"
              style={styles.linkButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.linkText}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---- Persona + Form Step ----
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header with close/back buttons */}
          <View style={styles.cardHeader}>
            {!paramInterest && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Back to interest picker"
                onPress={() => { setStep('interest'); setSelectedInterest(undefined); }}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={20} color="#64748B" />
              </TouchableOpacity>
            )}
            <View style={styles.headerSpacer} />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close sign up"
              onPress={() => enterGuestMode()}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Interest badge */}
          {selectedInterest && (
            <View style={styles.interestBadgeRow}>
              <View style={[styles.interestBadge, { backgroundColor: interestCtx.color + '18', borderColor: interestCtx.color + '40' }]}>
                <Text style={[styles.interestBadgeText, { color: interestCtx.color }]}>
                  {interestCtx.interestName}
                </Text>
              </View>
            </View>
          )}

          <Text testID="signup-title" style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>{getSubtitle()}</Text>

          {/* Persona Picker */}
          <View style={styles.personaPicker}>
            {(['sailor', 'coach', 'club'] as PersonaRole[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.personaPill,
                  persona === p && styles.personaPillActive,
                ]}
                onPress={() => setPersona(p)}
                accessibilityRole="button"
                accessibilityLabel={`Sign up as ${personaLabels[p]}`}
              >
                <Text
                  style={[
                    styles.personaPillText,
                    persona === p && styles.personaPillTextActive,
                  ]}
                >
                  {personaLabels[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Error Message Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity onPress={() => setErrorMessage(null)} style={styles.errorDismiss}>
                <Text style={styles.errorDismissText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Social Sign-up Options (above form) */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              testID="signup-google-button"
              style={[styles.socialButton, styles.googleButton, isLoading && styles.buttonDisabled]}
              onPress={handleGoogleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {appleSignInAvailable && (
              Platform.OS === 'ios' ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={10}
                  style={[styles.appleNativeButton, isLoading && styles.buttonDisabled]}
                  onPress={handleAppleSignUp}
                />
              ) : (
                <TouchableOpacity
                  style={[styles.socialButton, styles.appleButton, isLoading && styles.buttonDisabled]}
                  onPress={handleAppleSignUp}
                  disabled={isLoading}
                >
                  <Text style={styles.appleIcon}>{'\uF8FF'}</Text>
                  <Text style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or sign up with email</Text>
            <View style={styles.divider} />
          </View>

          {/* Form Fields */}
          <Text style={styles.sectionLabel}>Full Name *</Text>
          <TextInput
            testID="signup-name-input"
            style={styles.input}
            placeholder="Your name"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="name"
            editable={!isLoading}
          />

          <Text style={styles.sectionLabel}>Email *</Text>
          <TextInput
            testID="signup-email-input"
            style={styles.input}
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!isLoading}
          />

          <Text style={styles.sectionLabel}>Password *</Text>
          <TextInput
            testID="signup-password-input"
            style={styles.input}
            placeholder="Minimum 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            editable={!isLoading}
          />

          {/* Submit Button */}
          <TouchableOpacity
            testID="signup-submit-button"
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {getButtonText()}
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Login Link */}
          <TouchableOpacity
            testID="signup-signin-link"
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/login')}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },

  // Interest Picker
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  interestCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  interestIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Interest Badge (persona step)
  interestBadgeRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  interestBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  interestBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Persona Picker
  personaPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  personaPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  personaPillActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  personaPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  personaPillTextActive: {
    color: '#2563EB',
  },

  // Social Buttons
  socialContainer: {
    marginBottom: 4,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  appleNativeButton: {
    width: '100%',
    height: 48,
    marginTop: 8,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 12,
  },
  appleIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  appleButtonText: {
    color: '#FFFFFF',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#94A3B8',
  },

  // Form
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Terms
  termsText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: '#2563EB',
    fontWeight: '500',
  },

  // Link
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },

  // Error Banner
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  errorDismiss: {
    marginLeft: 12,
    padding: 4,
  },
  errorDismissText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
