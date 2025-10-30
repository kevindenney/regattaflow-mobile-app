import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../services/supabase';

export default function SignUp() {
  const { signUp } = useAuth();
  const params = useLocalSearchParams<{ persona?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {

      const result = await signUp(email, password, fullName);

      // Always go to the new unified onboarding with tabs

      router.replace({
        pathname: '/(auth)/onboarding-redesign',
        params: { persona: params.persona || 'sailor' }
      });
    } catch (error: any) {

      // Better error messages
      let errorMessage = error.message || 'Signup failed';
      let isAlreadyRegistered = false;

      // Check for various "already registered" error patterns
      if (errorMessage.toLowerCase().includes('already registered') ||
          errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('user already exists') ||
          errorMessage.toLowerCase().includes('duplicate')) {
        errorMessage = 'This email is already registered.';
        isAlreadyRegistered = true;
      } else if (errorMessage.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters';
      }

      // Show alert with appropriate action
      if (isAlreadyRegistered) {
        Alert.alert(
          'Account Already Exists',
          'This email is already registered. Would you like to sign in instead?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Sign In',
              onPress: () => router.push('/(auth)/login')
            }
          ]
        );
      } else {
        Alert.alert('Signup Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name (optional)"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/(auth)/login')}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            Already have an account? Sign In
          </Text>
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
  },
  content: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 40,
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
  button: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#0066CC',
    fontSize: 14,
  },
});
