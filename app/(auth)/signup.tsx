import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { roleHome } from '@/lib/gates';
import { useAuth } from '../../providers/AuthProvider';

type PersonaRole = 'sailor' | 'coach' | 'club';

type PersonaOption = {
  value: PersonaRole;
  label: string;
  description: string;
};

export default function SignUp() {
  const { signUp } = useAuth();
  const personaOptions = useMemo<PersonaOption[]>(
    () => [
      { value: 'sailor', label: 'Sailor', description: 'Track races and improve performance' },
      { value: 'coach', label: 'Coach', description: 'Manage clients and coaching sessions' },
      { value: 'club', label: 'Club', description: 'Organize regattas and member programs' },
    ],
    []
  );

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [persona, setPersona] = useState<PersonaRole>('sailor');
  const [loading, setLoading] = useState(false);
  const lastPersonaValue = personaOptions[personaOptions.length - 1]?.value;

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    // Validate email
    if (!trimmedEmail) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    // Validate username
    if (!trimmedUsername) {
      Alert.alert('Missing username', 'Choose a username to continue.');
      return;
    }

    if (trimmedUsername.length < 3) {
      Alert.alert('Username too short', 'Username must be at least 3 characters long.');
      return;
    }

    // Validate password
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signUp(trimmedEmail, trimmedUsername, password, persona);
      router.replace(roleHome(persona));
    } catch (error: any) {
      console.error('[Signup] Account creation error:', error);
      const message = (error?.message ?? '').toString();
      const lower = message.toLowerCase();

      if (lower.includes('registered') || lower.includes('duplicate') || lower.includes('already')) {
        Alert.alert('Account exists', 'An account with this email or username already exists. Try signing in instead.');
      } else {
        Alert.alert('Signup error', message || 'Unable to create your account right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Pick a role, enter your details, and start sailing.</Text>

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
          editable={!loading}
        />

        <Text style={styles.sectionLabel}>Username *</Text>
        <TextInput
          style={styles.input}
          placeholder="racecaptain"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          editable={!loading}
        />

        <Text style={styles.sectionLabel}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimum 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <Text style={styles.sectionLabel}>How will you use RegattaFlow?</Text>
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
                disabled={loading}
                testID={`choose-${option.value}`}
              >
                <Text style={[styles.personaLabel, selected && styles.personaLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={[styles.personaDescription, selected && styles.personaDescriptionSelected]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/(auth)/login')}
          disabled={loading}
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
  personaButtonLast: {
    marginBottom: 0,
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
    marginBottom: 28,
    lineHeight: 22,
  },
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
    marginBottom: 20,
    fontSize: 16,
  },
  personaRow: {
    flexDirection: 'column',
    marginBottom: 24,
  },
  personaButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  personaButtonSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  personaLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  personaLabelSelected: {
    color: '#1D4ED8',
  },
  personaDescription: {
    fontSize: 13,
    color: '#475569',
  },
  personaDescriptionSelected: {
    color: '#1E3A8A',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
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
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
});
