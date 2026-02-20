import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { isAppleSignInAvailable } from '@/lib/auth/nativeOAuth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { showAlert } from '@/lib/utils/crossPlatformAlert';

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

type PersonaRole = 'sailor' | 'coach' | 'club';

export default function SignUp() {
  const { signUp, signInWithGoogle, signInWithApple, loading: authLoading, enterGuestMode } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [persona] = useState<PersonaRole>('sailor');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(Platform.OS === 'web');

  const isLoading = loading || authLoading;

  useEffect(() => {
    if (Platform.OS === 'ios') {
      isAppleSignInAvailable().then(setAppleSignInAvailable);
    }
  }, []);

  const getButtonText = () => {
    if (isLoading) return 'Creating account...';
    return 'Create Account';
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

      if (persona === 'sailor') {
        // All new users go through name-only onboarding, then get 14-day Pro trial
        router.replace('/onboarding/profile/name-photo');
      } else if (persona === 'coach') {
        router.replace('/(auth)/coach-onboarding-welcome');
      } else if (persona === 'club') {
        router.replace('/(auth)/club-onboarding-chat');
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
    } catch (error: any) {
      console.error('[Signup] Apple sign-up error:', error);
      const friendlyMessage = getSignupErrorMessage(error);
      setErrorMessage(friendlyMessage);
      showAlert('Apple sign-up failed', friendlyMessage);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header with close button */}
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

          <Text testID="signup-title" style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Start with 14 days of full Pro access — no card required</Text>

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
