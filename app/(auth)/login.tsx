import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {
    signIn,
    signInWithGoogle,
    signInWithApple,
    signInWithBiometric,
    loading,
    biometricAvailable,
    biometricEnabled
  } = useAuth();

  // Check for biometric login on component mount
  useEffect(() => {
    if (biometricAvailable && biometricEnabled) {
      // Show biometric login option immediately
      handleBiometricLogin();
    }
  }, [biometricAvailable, biometricEnabled]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('🌊 Authentication Required', 'Please enter both email and password to access your sailing data.');
      return;
    }

    try {
      await signIn(email, password);
      router.replace('/(tabs)/map');
    } catch (error: any) {
      Alert.alert('🔴 Login Failed', error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      router.replace('/(tabs)/map');
    } catch (error: any) {
      Alert.alert('🔴 Google Sign-In Failed', error.message);
    }
  };

  const handleAppleLogin = async () => {
    try {
      await signInWithApple();
      router.replace('/(tabs)/map');
    } catch (error: any) {
      Alert.alert('🔴 Apple Sign-In Failed', error.message);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await signInWithBiometric();
      router.replace('/(tabs)/map');
    } catch (error: any) {
      // Don't show alert for biometric failures, just fall back to regular login
      console.log('Biometric login failed, showing regular login');
    }
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']} // Marine-grade dark gradient
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Marine-themed header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="boat" size={48} color="#0ea5e9" />
              <ThemedText style={styles.logoText}>RegattaFlow</ThemedText>
            </View>
            <ThemedText style={styles.welcomeText}>Welcome Back</ThemedText>
            <ThemedText style={styles.subtitleText}>Professional Sailing Platform</ThemedText>
          </View>

          {/* Biometric login option */}
          {biometricAvailable && biometricEnabled && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={loading}
            >
              <Ionicons name="finger-print" size={24} color="#0ea5e9" />
              <ThemedText style={styles.biometricText}>Use Biometric Authentication</ThemedText>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or continue with</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          {/* OAuth buttons */}
          <View style={styles.oauthContainer}>
            <TouchableOpacity
              style={[styles.oauthButton, styles.googleButton]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#ffffff" />
                  <ThemedText style={styles.oauthButtonText}>Continue with Google</ThemedText>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.oauthButton, styles.appleButton]}
              onPress={handleAppleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="#ffffff" />
                  <ThemedText style={styles.oauthButtonText}>Continue with Apple</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Email/Password form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email Address</ThemedText>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="captain@yacht.club"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor="#64748b"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/reset-password')}
            >
              <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="log-in" size={20} color="#ffffff" />
                  <ThemedText style={styles.primaryButtonText}>Sign In</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign up link */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => router.push('/(auth)/signup')}
            >
              <ThemedText style={styles.signupText}>
                New to sailing? <ThemedText style={styles.signupLinkText}>Create Account</ThemedText>
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Marine safety footer */}
          <View style={styles.safetyFooter}>
            <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
            <ThemedText style={styles.safetyText}>Marine-grade security for professional sailors</ThemedText>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },

  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0ea5e9',
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
  },

  // Biometric authentication
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    minHeight: 56, // Marine-grade touch target
  },
  biometricText: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#475569',
  },
  dividerText: {
    color: '#94a3b8',
    fontSize: 14,
    marginHorizontal: 16,
  },

  // OAuth buttons
  oauthContainer: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 32,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56, // Marine-grade touch target
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  googleButton: {
    backgroundColor: '#dc2626', // Google red
    shadowColor: '#dc2626',
  },
  appleButton: {
    backgroundColor: '#000000', // Apple black
    shadowColor: '#000000',
  },
  oauthButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
    textAlign: 'center',
  },

  // Form styles
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#f8fafc',
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    paddingVertical: 16,
    paddingLeft: 48, // Space for icon
    paddingRight: 16,
    fontSize: 16,
    color: '#f8fafc',
    minHeight: 56, // Marine-grade touch target
  },
  passwordInput: {
    paddingRight: 48, // Space for toggle button
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    padding: 8,
  },
  forgotPasswordText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '500',
  },

  // Primary button
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 24,
    minHeight: 56, // Marine-grade touch target
    shadowColor: '#0ea5e9',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  signupLink: {
    padding: 12,
  },
  signupText: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
  },
  signupLinkText: {
    color: '#0ea5e9',
    fontWeight: '600',
  },

  // Safety footer
  safetyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  safetyText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 8,
    textAlign: 'center',
  },
});