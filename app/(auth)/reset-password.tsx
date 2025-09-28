/**
 * Password Reset Screen
 * Marine-grade password recovery with professional sailing platform design
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword, loading } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('📧 Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('📧 Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      await resetPassword(email);
      setIsSubmitted(true);

      Alert.alert(
        '🌊 Reset Link Sent',
        'Check your email for password reset instructions. The link will expire in 1 hour.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('🔴 Reset Failed', error.message);
    }
  };

  const handleBackToLogin = () => {
    router.back();
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Ionicons name="arrow-back" size={24} color="#0ea5e9" />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Ionicons name="lock-open" size={48} color="#0ea5e9" />
              <ThemedText style={styles.title}>Reset Password</ThemedText>
              <ThemedText style={styles.subtitle}>
                Enter your email address and we'll send you a link to reset your password
              </ThemedText>
            </View>
          </View>

          {/* Reset form */}
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
                  editable={!isSubmitted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.resetButton,
                (loading || isSubmitted) && styles.buttonDisabled
              ]}
              onPress={handleResetPassword}
              disabled={loading || isSubmitted}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={isSubmitted ? "checkmark-circle" : "send"}
                    size={20}
                    color="#ffffff"
                  />
                  <ThemedText style={styles.resetButtonText}>
                    {isSubmitted ? 'Reset Link Sent' : 'Send Reset Link'}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>

            {isSubmitted && (
              <View style={styles.successMessage}>
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                <ThemedText style={styles.successText}>
                  Reset instructions sent to {email}
                </ThemedText>
                <ThemedText style={styles.successSubtext}>
                  Check your email and follow the instructions to reset your password.
                  Don't forget to check your spam folder.
                </ThemedText>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={handleBackToLogin}
            >
              <Ionicons name="arrow-back" size={16} color="#0ea5e9" />
              <ThemedText style={styles.backToLoginText}>Back to Sign In</ThemedText>
            </TouchableOpacity>

            {/* Security note */}
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
              <ThemedText style={styles.securityText}>
                Your account security is protected with marine-grade encryption
              </ThemedText>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');

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
    marginBottom: 48,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 12,
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Form styles
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 32,
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

  // Reset button
  resetButton: {
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
  resetButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Success message
  successMessage: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  successText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 24,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backToLoginText: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Security note
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  securityText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 8,
    textAlign: 'center',
  },
});