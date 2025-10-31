import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';

export default function Login() {
  const { signIn, signInWithGoogle, loading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const onEmailLogin = async () => {

    if (!identifier || !password) {
      Alert.alert('Error', 'Please enter your username (or email) and password');
      return;
    }
    try {
      await signIn(identifier, password);
    } catch (e: any) {
      console.error('🔍 [LOGIN] Sign in failed:', e);
      Alert.alert('Sign in failed', e?.message || 'Please try again');
    }
  };

  const onGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('Google sign-in failed', e?.message || 'Please try again');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text accessibilityRole="header" accessibilityLabel="login-title" style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue to RegattaFlow</Text>

        {/* Google Sign-in */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="google-sign-in"
          onPress={onGoogleLogin}
          disabled={loading}
          style={[styles.socialButton, loading && styles.buttonDisabled]}
        >
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

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
        />

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="submit-sign-in"
          onPress={onEmailLogin}
          disabled={loading}
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
        </TouchableOpacity>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC'
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'web' ? 0.06 : 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#E5E7EB'
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
  socialButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  socialButtonText: {
    color: '#0F172A',
    fontWeight: '600'
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
  marketingText: {
    marginTop: 20,
    color: '#475569',
    fontSize: 12,
    lineHeight: 18
  }
});
