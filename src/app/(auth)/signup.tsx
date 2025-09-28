import React, { useState } from 'react';
import { StyleSheet, View, Alert, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { getDashboardRoute, shouldCompleteOnboarding, getOnboardingRoute } from '@/src/lib/utils/userTypeRouting';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { signUp, signInWithGoogle, signInWithApple, loading, userProfile, userType } = useAuth();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      await signUp(email, password, fullName);
      Alert.alert(
        'Success!',
        'Account created successfully. Please check your email for verification.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    }
  };

  const routeAfterAuth = () => {
    console.log('🔍 [SIGNUP] Determining post-auth route:', {
      userProfile: !!userProfile,
      userType,
      needsOnboarding: shouldCompleteOnboarding(userProfile)
    });

    if (shouldCompleteOnboarding(userProfile)) {
      console.log('🔍 [SIGNUP] Routing to onboarding');
      router.replace(getOnboardingRoute());
    } else {
      const dashboardRoute = getDashboardRoute(userType);
      console.log('🔍 [SIGNUP] Routing to dashboard:', dashboardRoute);
      router.replace(dashboardRoute);
    }
  };

  const handleGoogleSignup = async () => {
    console.log('🔍 [SIGNUP] Google signup button clicked');
    try {
      console.log('🔍 [SIGNUP] Calling signInWithGoogle()');
      await signInWithGoogle();
      console.log('🔍 [SIGNUP] Google sign-in succeeded, determining route');
      routeAfterAuth();
    } catch (error: any) {
      console.error('🔍 [SIGNUP] Google sign-up failed:', error);
      Alert.alert('Google Sign Up Failed', error.message);
    }
  };

  const handleAppleSignup = async () => {
    console.log('🔍 [SIGNUP] Apple signup button clicked');
    try {
      console.log('🔍 [SIGNUP] Calling signInWithApple()');
      await signInWithApple();
      console.log('🔍 [SIGNUP] Apple sign-in succeeded, determining route');
      routeAfterAuth();
    } catch (error: any) {
      console.error('🔍 [SIGNUP] Apple sign-up failed:', error);
      Alert.alert('Apple Sign Up Failed', error.message);
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
            <ThemedText style={styles.title}>Join RegattaFlow</ThemedText>
            <ThemedText style={styles.subtitle}>Start your sailing strategy journey</ThemedText>
          </View>

          {/* Social Sign Up Options */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignup}
            >
              <View style={styles.socialButtonContent}>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <ThemedText style={styles.socialButtonText}>Continue with Google</ThemedText>
              </View>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleAppleSignup}
              >
                <View style={styles.socialButtonContent}>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <ThemedText style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</ThemedText>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Full Name</ThemedText>
              <View style={[styles.inputWrapper, errors.fullName && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errors.fullName) {
                      setErrors(prev => ({ ...prev, fullName: '' }));
                    }
                  }}
                  autoCapitalize="words"
                  placeholderTextColor="#999"
                />
              </View>
              {errors.fullName && <ThemedText style={styles.errorText}>{errors.fullName}</ThemedText>}
            </View>

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
                  placeholder="Create a password"
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

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirm Password</ThemedText>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>}
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>Create Account</ThemedText>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <TouchableOpacity
              style={styles.signInContainer}
              onPress={() => router.push('/(auth)/login')}
            >
              <ThemedText style={styles.signInText}>
                Already have an account? <ThemedText style={styles.signInLink}>Sign in</ThemedText>
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <ThemedText style={styles.featuresTitle}>What you'll get:</ThemedText>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="map" size={16} color="#0066CC" />
                <ThemedText style={styles.featureText}>3D nautical maps</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="brain" size={16} color="#0066CC" />
                <ThemedText style={styles.featureText}>AI race strategy</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="cloudy" size={16} color="#0066CC" />
                <ThemedText style={styles.featureText}>Real-time weather data</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="location" size={16} color="#0066CC" />
                <ThemedText style={styles.featureText}>GPS race tracking</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="people" size={16} color="#0066CC" />
                <ThemedText style={styles.featureText}>Crew collaboration</ThemedText>
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
  signInContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  signInText: {
    fontSize: 16,
    color: '#64748B',
  },
  signInLink: {
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
});