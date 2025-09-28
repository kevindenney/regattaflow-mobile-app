import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { getDashboardRoute, shouldCompleteOnboarding, getOnboardingRoute } from '@/src/lib/utils/userTypeRouting';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [debugLogs, setDebugLogs] = useState<any>(null);
  const { signIn, signInWithGoogle, signInWithApple, loading, userProfile, userType } = useAuth();

  // Check for OAuth debug logs on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const logs = localStorage.getItem('oauth_debug_log');
      if (logs) {
        setDebugLogs(JSON.parse(logs));
        console.log('🔍 [LOGIN] OAuth Debug Logs Found:', JSON.parse(logs));
      }
    }
  }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const routeAfterAuth = () => {
    console.log('🔍 [LOGIN] Determining post-auth route:', {
      userProfile: !!userProfile,
      userType,
      needsOnboarding: shouldCompleteOnboarding(userProfile)
    });

    if (shouldCompleteOnboarding(userProfile)) {
      console.log('🔍 [LOGIN] Routing to onboarding');
      router.replace(getOnboardingRoute());
    } else {
      const dashboardRoute = getDashboardRoute(userType);
      console.log('🔍 [LOGIN] Routing to dashboard:', dashboardRoute);
      router.replace(dashboardRoute);
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await signIn(email, password);
      routeAfterAuth();
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('🔍 [LOGIN] Google sign-in button clicked');
    try {
      console.log('🔍 [LOGIN] Calling signInWithGoogle()');
      await signInWithGoogle();
      console.log('🔍 [LOGIN] Google sign-in succeeded - AuthContext will handle routing');
      // Don't call routeAfterAuth here - let the AuthContext handle routing after profile loads
    } catch (error: any) {
      console.error('🔍 [LOGIN] Google sign-in failed:', error);
      Alert.alert('Google Sign-In Failed', error.message);
    }
  };

  const handleAppleSignIn = async () => {
    console.log('🔍 [LOGIN] Apple sign-in button clicked');
    try {
      console.log('🔍 [LOGIN] Calling signInWithApple()');
      await signInWithApple();
      console.log('🔍 [LOGIN] Apple sign-in succeeded - AuthContext will handle routing');
      // Don't call routeAfterAuth here - let the AuthContext handle routing after profile loads
    } catch (error: any) {
      console.error('🔍 [LOGIN] Apple sign-in failed:', error);
      Alert.alert('Apple Sign-In Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={[styles.content, isWeb && width > 768 && styles.webContent]}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, isWeb && width > 768 && styles.webScrollContent]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="boat" size={32} color="#0066CC" />
              <ThemedText style={styles.logoText}>RegattaFlow</ThemedText>
            </View>
            <ThemedText style={styles.title}>Welcome Back</ThemedText>
            <ThemedText style={styles.subtitle}>Sign in to RegattaFlow</ThemedText>
          </View>

          {/* Social Sign In Options */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
            >
              <View style={styles.socialButtonContent}>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <ThemedText style={styles.socialButtonText}>Google</ThemedText>
              </View>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleAppleSignIn}
              >
                <View style={styles.socialButtonContent}>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <ThemedText style={[styles.socialButtonText, styles.appleButtonText]}>Apple</ThemedText>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or continue with</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#999"
                />
              </View>
              {errors.email && <ThemedText style={styles.errorText}>{errors.email}</ThemedText>}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <ThemedText style={styles.errorText}>{errors.password}</ThemedText>}
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>Sign In</ThemedText>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <TouchableOpacity
              style={styles.signUpContainer}
              onPress={() => router.push('/(auth)/signup')}
            >
              <ThemedText style={styles.signUpText}>
                Don't have an account? <ThemedText style={styles.signUpLink}>Sign up</ThemedText>
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Debug Logs Display */}
          {debugLogs && (
            <View style={styles.debugContainer}>
              <ThemedText style={styles.debugTitle}>OAuth Debug Log:</ThemedText>
              <ScrollView style={styles.debugScroll} horizontal>
                <ThemedText style={styles.debugText}>
                  {JSON.stringify(debugLogs, null, 2)}
                </ThemedText>
              </ScrollView>
              <TouchableOpacity
                style={styles.clearDebugButton}
                onPress={() => {
                  localStorage.removeItem('oauth_debug_log');
                  setDebugLogs(null);
                }}
              >
                <ThemedText style={styles.clearDebugText}>Clear Debug Log</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Features */}
          <View style={styles.features}>
            <ThemedText style={styles.featuresTitle}>⚡ Fast & Secure Authentication</ThemedText>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={16} color="#0066CC" />
                <ThemedText style={styles.featureText}>Fast & Secure Authentication</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="boat" size={16} color="#0066CC" />
                <ThemedText style={styles.featureText}>Start racing smarter today</ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  webContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  webScrollContent: {
    maxWidth: 440,
    width: '100%',
    paddingTop: 60,
    paddingBottom: 60,
  },
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
    fontSize: 24,
    fontWeight: '700',
    color: '#0066CC',
    marginLeft: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  socialContainer: {
    marginBottom: 24,
    gap: 12,
  },
  socialButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 12,
  },
  appleButtonText: {
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 14,
    paddingHorizontal: 16,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  primaryButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  signUpText: {
    fontSize: 16,
    color: '#64748B',
  },
  signUpLink: {
    color: '#0066CC',
    fontWeight: '600',
  },
  features: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  debugContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  debugScroll: {
    maxHeight: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  debugText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#374151',
  },
  clearDebugButton: {
    backgroundColor: '#EF4444',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  clearDebugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});