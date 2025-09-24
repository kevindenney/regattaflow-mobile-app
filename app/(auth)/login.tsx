import React, { useState } from 'react';
import { StyleSheet, View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/src/lib/contexts/AuthContextMock';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      await signIn(email, password);
      router.replace('/(tabs)/map');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">Welcome Back</ThemedText>
          <ThemedText type="subtitle">Sign in to RegattaFlow</ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText type="default">🚧 Login form coming soon</ThemedText>
          <ThemedText type="default">Email: {email || 'user@example.com'}</ThemedText>
          <ThemedText type="default">Password: {'•'.repeat(password.length || 8)}</ThemedText>

          <View style={styles.buttonPlaceholder}>
            <ThemedText type="default">
              {loading ? '⏳ Signing in...' : '🔑 Sign In Button'}
            </ThemedText>
          </View>

          <View style={styles.buttonPlaceholder}>
            <ThemedText type="default" onPress={() => router.push('/(auth)/signup')}>
              📝 Don't have an account? Sign up
            </ThemedText>
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText type="default">⚡ Fast & Secure Authentication</ThemedText>
          <ThemedText type="default">🌊 Start racing smarter today</ThemedText>
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
    marginBottom: 40,
  },
  form: {
    gap: 16,
    marginBottom: 40,
  },
  buttonPlaceholder: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 8,
  },
});