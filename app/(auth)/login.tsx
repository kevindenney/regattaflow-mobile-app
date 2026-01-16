import { Link, router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ViewStyle } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../services/supabase';
import { isAppleSignInAvailable } from '@/lib/auth/nativeOAuth';
import * as AppleAuthentication from 'expo-apple-authentication';

const cardShadowStyle: ViewStyle =
  Platform.OS === 'web'
    ? {
        boxShadow: '0px 18px 35px rgba(15, 23, 42, 0.08)',
      }
    : {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      };

// Helper to get user-friendly error messages
const getAuthErrorMessage = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code || '';

  if (message.includes('invalid login credentials') || code === 'invalid_credentials') {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (message.includes('email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.';
  }
  if (message.includes('too many requests') || code === 'over_request_limit') {
    return 'Too many sign-in attempts. Please wait a moment and try again.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your internet connection.';
  }
  if (message.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }
  return error?.message || 'Sign in failed. Please try again.';
};

export default function Login() {
  const { signIn, signInWithGoogle, signInWithApple, loading, enterGuestMode } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Apple Sign In is available on web and iOS, not Android
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(Platform.OS === 'web');

  useEffect(() => {
    // Check Apple Sign In availability on iOS
    if (Platform.OS === 'ios') {
      isAppleSignInAvailable().then(setAppleSignInAvailable);
    }
  }, []);

  const onEmailLogin = async () => {
    setErrorMessage(null); // Clear previous errors

    if (!identifier || !password) {
      setErrorMessage('Please enter your email and password');
      return;
    }
    try {
      await signIn(identifier, password);
    } catch (e: any) {
      console.error('[LOGIN] Sign in failed:', e);
      const friendlyMessage = getAuthErrorMessage(e);
      setErrorMessage(friendlyMessage);
      // Also show alert on mobile for better visibility
      if (Platform.OS !== 'web') {
        Alert.alert('Sign in failed', friendlyMessage);
      }
    }
  };

  const onGoogleLogin = async () => {
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      console.error('[LOGIN] Google sign in failed:', e);
      const friendlyMessage = getAuthErrorMessage(e);
      setErrorMessage(friendlyMessage);
      if (Platform.OS !== 'web') {
        Alert.alert('Google sign-in failed', friendlyMessage);
      }
    }
  };

  const onAppleLogin = async () => {
    setErrorMessage(null);
    try {
      await signInWithApple();
    } catch (e: any) {
      console.error('[LOGIN] Apple sign in failed:', e);
      const friendlyMessage = getAuthErrorMessage(e);
      setErrorMessage(friendlyMessage);
      if (Platform.OS !== 'web') {
        Alert.alert('Apple sign-in failed', friendlyMessage);
      }
    }
  };

  const onForgotPassword = async () => {
    const email = identifier.includes('@') ? identifier : '';

    if (Platform.OS === 'web') {
      // Web: use window.prompt/confirm since Alert.alert doesn't work
      let emailToReset = email;
      if (!emailToReset) {
        emailToReset = window.prompt('Enter your email address to reset your password:') || '';
      }

      if (!emailToReset || !emailToReset.includes('@')) {
        setErrorMessage('Please enter a valid email address');
        return;
      }

      const confirmed = window.confirm(`Send password reset link to ${emailToReset}?`);
      if (confirmed) {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
            redirectTo: `${window.location.origin}/(auth)/reset-password`,
          });
          if (error) throw error;
          setErrorMessage(null);
          window.alert('Password reset link sent! Check your email.');
        } catch (error: any) {
          setErrorMessage(error?.message || 'Failed to send reset link');
        }
      }
    } else {
      // Mobile: use Alert.alert
      Alert.alert(
        'Reset Password',
        email ? `Send password reset link to ${email}?` : 'Enter your email address',
        email ? [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Link',
            onPress: async () => {
              try {
                await supabase.auth.resetPasswordForEmail(email);
                Alert.alert('Success', 'Password reset link sent to your email');
              } catch (error) {
                Alert.alert('Error', 'Failed to send reset link');
              }
            }
          }
        ] : [{ text: 'OK' }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header with close button */}
          <View style={styles.cardHeader}>
            <View style={styles.headerSpacer} />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close sign in"
              onPress={() => enterGuestMode()}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text accessibilityRole="header" accessibilityLabel="login-title" style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue to RegattaFlow</Text>

          {/* Error Message Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity onPress={() => setErrorMessage(null)} style={styles.errorDismiss}>
                <Text style={styles.errorDismissText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Social Sign-in Buttons */}
          <View style={styles.socialButtonsContainer}>
            {/* Google Sign-in */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="google-sign-in"
              onPress={onGoogleLogin}
              disabled={loading}
              style={[styles.socialButton, styles.googleButton, loading && styles.buttonDisabled]}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Apple Sign-in - iOS native button or web fallback, hidden on Android */}
            {appleSignInAvailable && (
              Platform.OS === 'ios' ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={10}
                  style={[styles.appleNativeButton, loading && styles.buttonDisabled]}
                  onPress={onAppleLogin}
                />
              ) : (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="apple-sign-in"
                  onPress={onAppleLogin}
                  disabled={loading}
                  style={[styles.socialButton, styles.appleButton, loading && styles.buttonDisabled]}
                >
                  <Text style={styles.appleIcon}></Text>
                  <Text style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Login Form */}
          <View
            accessible={true}
            accessibilityLabel="Login form"
          >
            {/* Username or Email */}
            <TextInput
              accessibilityLabel="identifier-input"
              style={styles.input}
              placeholder="Username or email"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="default"
              editable={!loading}
              textContentType="username"
              importantForAccessibility="yes"
            />

            {/* Password */}
            <TextInput
              accessibilityLabel="password-input"
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              textContentType="password"
              importantForAccessibility="yes"
            />

            {/* Forgot Password Link */}
            <TouchableOpacity onPress={onForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="submit-sign-in"
              onPress={onEmailLogin}
              disabled={loading}
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              importantForAccessibility="yes"
            >
              <Text style={styles.primaryButtonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Create one</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Marketing blurb */}
          <Text style={styles.marketingText}>
            Manage regattas, get AI race strategy, book coaches, and sync results — all in one place.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: -8,
    marginRight: -8,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingVertical: 48,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#E5E7EB',
    ...cardShadowStyle
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16
  },
  socialButtonsContainer: {
    marginBottom: 8,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 14,
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
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 15,
  },
  appleButtonText: {
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB'
  },
  dividerText: {
    marginHorizontal: 8,
    color: '#94A3B8'
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF'
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8
  },
  buttonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12
  },
  footerText: { color: '#64748B' },
  linkText: { color: '#3B82F6', fontWeight: '600', marginLeft: 6 },
  forgotPasswordText: {
    color: '#3B82F6',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 8,
  },
  marketingText: {
    marginTop: 20,
    color: '#475569',
    fontSize: 12,
    lineHeight: 18
  },
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
