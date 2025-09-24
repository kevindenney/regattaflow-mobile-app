import React, { useState } from 'react';
import { StyleSheet, View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/src/lib/contexts/AuthContextMock';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, loading } = useAuth();

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">Join RegattaFlow</ThemedText>
          <ThemedText type="subtitle">Start your sailing strategy journey</ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText type="default">🚧 Signup form coming soon</ThemedText>
          <ThemedText type="default">Full Name: {fullName || 'John Sailor'}</ThemedText>
          <ThemedText type="default">Email: {email || 'john@sailing.com'}</ThemedText>
          <ThemedText type="default">Password: {'•'.repeat(password.length || 8)}</ThemedText>
          <ThemedText type="default">Confirm: {'•'.repeat(confirmPassword.length || 8)}</ThemedText>

          <View style={styles.buttonPlaceholder}>
            <ThemedText type="default">
              {loading ? '⏳ Creating account...' : '🚀 Create Account'}
            </ThemedText>
          </View>

          <View style={styles.buttonPlaceholder}>
            <ThemedText type="default" onPress={() => router.push('/(auth)/login')}>
              🔑 Already have an account? Sign in
            </ThemedText>
          </View>
        </View>

        <View style={styles.features}>
          <ThemedText type="subtitle">What you'll get:</ThemedText>
          <ThemedText type="default">🗺️ 3D nautical maps</ThemedText>
          <ThemedText type="default">🧠 AI race strategy</ThemedText>
          <ThemedText type="default">🌊 Real-time weather data</ThemedText>
          <ThemedText type="default">📱 GPS race tracking</ThemedText>
          <ThemedText type="default">👥 Crew collaboration</ThemedText>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
    marginBottom: 32,
  },
  buttonPlaceholder: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  features: {
    alignItems: 'center',
    gap: 8,
  },
});