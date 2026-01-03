import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { roleHome } from '@/lib/gates';
import { useAuth } from '../../providers/AuthProvider';

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
  if (message.includes('weak password') || message.includes('password')) {
    return 'Password must be at least 6 characters long.';
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

type PersonaOption = {
  value: PersonaRole;
  label: string;
  description: string;
  icon: string;
};

export default function SignUp() {
  const { signUp, signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();
  const personaOptions = useMemo<PersonaOption[]>(
    () => [
      { value: 'sailor', label: 'Sailor', description: 'Track races and improve performance', icon: '⛵' },
      { value: 'coach', label: 'Coach', description: 'Manage clients and coaching sessions', icon: '🎯' },
      { value: 'club', label: 'Club', description: 'Organize regattas and member programs', icon: '🏠' },
    ],
    []
  );

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [persona, setPersona] = useState<PersonaRole>('sailor');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastPersonaValue = personaOptions[personaOptions.length - 1]?.value;

  const isLoading = loading || authLoading;

  const handleSignUp = async () => {
    setErrorMessage(null);
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    // Validate email
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Validate username
    if (!trimmedUsername) {
      setErrorMessage('Please choose a username to continue.');
      return;
    }

    if (trimmedUsername.length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }

    // Validate password
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signUp(trimmedEmail, trimmedUsername, password, persona);
      
      // Route to appropriate onboarding based on persona
      // Sailors skip onboarding and go directly to the main app
      if (persona === 'sailor') {
        router.replace('/(tabs)/races');
      } else if (persona === 'coach') {
        router.replace('/(auth)/coach-onboarding-welcome');
      } else if (persona === 'club') {
        router.replace('/(auth)/club-onboarding-chat');
      } else {
        router.replace(roleHome(persona));
      }
    } catch (error: any) {
      console.error('[Signup] Account creation error:', error);
      const friendlyMessage = getSignupErrorMessage(error);
      setErrorMessage(friendlyMessage);
      if (Platform.OS !== 'web') {
        Alert.alert('Signup error', friendlyMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    try {
      // Pass the selected persona to Google sign-in
      await signInWithGoogle(persona);
      // After Google auth, user will be redirected to callback which handles routing
    } catch (error: any) {
      console.error('[Signup] Google sign-up error:', error);
      const friendlyMessage = getSignupErrorMessage(error);
      setErrorMessage(friendlyMessage);
      if (Platform.OS !== 'web') {
        Alert.alert('Google sign-up failed', friendlyMessage);
      }
    }
  };

  const handleAppleSignUp = async () => {
    setErrorMessage(null);
    try {
      // Pass the selected persona to Apple sign-in
      await signInWithApple(persona);
      // After Apple auth, user will be redirected to callback which handles routing
    } catch (error: any) {
      console.error('[Signup] Apple sign-up error:', error);
      const friendlyMessage = getSignupErrorMessage(error);
      setErrorMessage(friendlyMessage);
      if (Platform.OS !== 'web') {
        Alert.alert('Apple sign-up failed', friendlyMessage);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Start your sailing journey with RegattaFlow</Text>

        {/* Error Message Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setErrorMessage(null)} style={styles.errorDismiss}>
              <Text style={styles.errorDismissText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Persona Selection */}
        <Text style={styles.sectionLabel}>I am a...</Text>
        <View style={styles.personaRow}>
          {personaOptions.map((option) => {
            const selected = persona === option.value;
            const isLast = option.value === lastPersonaValue;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.personaButton,
                  selected && styles.personaButtonSelected,
                  isLast && styles.personaButtonLast,
                ]}
                onPress={() => setPersona(option.value)}
                disabled={isLoading}
                testID={`choose-${option.value}`}
              >
                <View style={styles.personaContent}>
                  <Text style={styles.personaIcon}>{option.icon}</Text>
                  <View style={styles.personaTextContainer}>
                    <Text style={[styles.personaLabel, selected && styles.personaLabelSelected]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.personaDescription, selected && styles.personaDescriptionSelected]}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                {selected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Form Fields */}
        <Text style={styles.sectionLabel}>Full Name *</Text>
        <TextInput
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
          style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Creating account…' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        {/* Social Sign-up Options */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {(Platform.OS === 'ios' || Platform.OS === 'web') && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton, isLoading && styles.buttonDisabled]}
              onPress={handleAppleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.appleIcon}></Text>
              <Text style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Terms */}
        <Text style={styles.termsText}>
          By signing up, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>

        {/* Login Link */}
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/(auth)/login')}
          disabled={isLoading}
        >
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    paddingVertical: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  
  // Social Buttons
  socialContainer: {
    marginBottom: 16,
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
    marginTop: 20,
    marginBottom: 20,
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
  
  // Persona Selection
  personaRow: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  personaButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personaButtonSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  personaButtonLast: {
    marginBottom: 0,
  },
  personaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personaIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  personaTextContainer: {
    flex: 1,
  },
  personaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  personaLabelSelected: {
    color: '#1D4ED8',
  },
  personaDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  personaDescriptionSelected: {
    color: '#3B82F6',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    marginTop: 8,
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
