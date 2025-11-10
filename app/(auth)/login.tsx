import { Link } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';

type DemoPersona = 'sailor' | 'club' | 'coach' | 'sarah' | 'marcus' | 'emma' | 'james' | 'coachSarah' | 'coachJimmy';

const DEFAULT_DEMO_IDENTIFIERS: Record<DemoPersona, string> = {
  sailor: 'demo-sailor@regattaflow.app',
  club: 'demo-club@regattaflow.app',
  coach: 'demo-coach@regattaflow.app',
  // New mock users with clubs/fleets
  sarah: 'sarah.chen@sailing.com',
  marcus: 'mike.thompson@racing.com',
  emma: 'emma.wilson@yacht.club',
  james: 'james.rodriguez@fleet.com',
  coachSarah: 'coach.anderson@sailing.com',
  coachJimmy: 'coachkdenney@icloud.com',
};

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

export default function Login() {
  const { signIn, signInWithGoogle, loading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const demoAccounts = useMemo(
    () => ({
      sailor: {
        label: 'Demo Sailor',
        identifier:
          process.env.EXPO_PUBLIC_DEMO_SAILOR_IDENTIFIER ?? DEFAULT_DEMO_IDENTIFIERS.sailor,
        password: process.env.EXPO_PUBLIC_DEMO_SAILOR_PASSWORD ?? 'Demo123!',
      },
      club: {
        label: 'Demo Club Manager',
        identifier:
          process.env.EXPO_PUBLIC_DEMO_CLUB_IDENTIFIER ?? DEFAULT_DEMO_IDENTIFIERS.club,
        password: process.env.EXPO_PUBLIC_DEMO_CLUB_PASSWORD ?? 'Demo123!',
      },
      coach: {
        label: 'Demo Coach',
        identifier:
          process.env.EXPO_PUBLIC_DEMO_COACH_IDENTIFIER ?? DEFAULT_DEMO_IDENTIFIERS.coach,
        password: process.env.EXPO_PUBLIC_DEMO_COACH_PASSWORD ?? 'Demo123!',
      },
      sarah: {
        label: 'Sarah Chen (RHKYC, Dragon/J70)',
        identifier: DEFAULT_DEMO_IDENTIFIERS.sarah,
        password: 'sailing123',
      },
      marcus: {
        label: 'Mike Thompson (SFYC, Dragon/420)',
        identifier: DEFAULT_DEMO_IDENTIFIERS.marcus,
        password: 'sailing123',
      },
      emma: {
        label: 'Emma Wilson (RSYS, Laser/Opti)',
        identifier: DEFAULT_DEMO_IDENTIFIERS.emma,
        password: 'sailing123',
      },
      james: {
        label: 'James Rodriguez (MYC, J70)',
        identifier: DEFAULT_DEMO_IDENTIFIERS.james,
        password: 'sailing123',
      },
      coachSarah: {
        label: 'Coach Anderson (Multi-club)',
        identifier: DEFAULT_DEMO_IDENTIFIERS.coachSarah,
        password: 'sailing123',
      },
      coachJimmy: {
        label: 'Coach: Jimmy Wilson',
        identifier: DEFAULT_DEMO_IDENTIFIERS.coachJimmy,
        password: 'password123',
      },
    }),
    []
  );

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

  const onDemoLogin = async (persona: DemoPersona) => {
    const demo = demoAccounts[persona];
    if (!demo.password) {
      Alert.alert(
        'Demo credentials missing',
        `Set EXPO_PUBLIC_DEMO_${persona.toUpperCase()}_PASSWORD in your environment to enable this shortcut.`
      );
      return;
    }

    try {
      setIdentifier(demo.identifier);
      setPassword(demo.password);
      await signIn(demo.identifier, demo.password);
    } catch (e: any) {
      console.error(`[LOGIN] Demo ${persona} sign in failed:`, e);
      Alert.alert('Demo sign in failed', e?.message || 'Please try again');
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

        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>Quick demo access</Text>
          <View style={styles.demoButtonRow}>
            {(['sailor', 'club', 'coach'] as DemoPersona[]).map((persona) => {
              const demo = demoAccounts[persona];
              const isConfigured = Boolean(demo.password);
              return (
                <TouchableOpacity
                  key={persona}
                  accessibilityRole="button"
                  accessibilityLabel={`demo-login-${persona}`}
                  onPress={() => onDemoLogin(persona)}
                  disabled={loading || !isConfigured}
                  style={[
                    styles.demoButton,
                    (!isConfigured || loading) && styles.demoButtonDisabled,
                  ]}
                >
                  <Text style={styles.demoButtonTitle}>{demo.label}</Text>
                  <Text style={styles.demoButtonSubtitle}>
                    {demo.identifier}
                  </Text>
                  {!isConfigured && (
                    <Text style={styles.demoMissingPassword}>Set password env to enable</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>Fleet Members</Text>
          <View style={styles.demoButtonRow}>
            {(['sarah', 'marcus', 'emma', 'james'] as DemoPersona[]).map((persona) => {
              const demo = demoAccounts[persona];
              const isConfigured = Boolean(demo.password);
              return (
                <TouchableOpacity
                  key={persona}
                  accessibilityRole="button"
                  accessibilityLabel={`demo-login-${persona}`}
                  onPress={() => onDemoLogin(persona)}
                  disabled={loading || !isConfigured}
                  style={[
                    styles.demoButton,
                    (!isConfigured || loading) && styles.demoButtonDisabled,
                  ]}
                >
                  <Text style={styles.demoButtonTitle}>{demo.label}</Text>
                  <Text style={styles.demoButtonSubtitle}>
                    {demo.identifier}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>Coaches (for testing)</Text>
          <View style={styles.demoButtonRow}>
            {(['coachSarah', 'coachJimmy'] as DemoPersona[]).map((persona) => {
              const demo = demoAccounts[persona];
              const isConfigured = Boolean(demo.password);
              return (
                <TouchableOpacity
                  key={persona}
                  accessibilityRole="button"
                  accessibilityLabel={`demo-login-${persona}`}
                  onPress={() => onDemoLogin(persona)}
                  disabled={loading || !isConfigured}
                  style={[
                    styles.demoButton,
                    styles.coachDemoButton,
                    (!isConfigured || loading) && styles.demoButtonDisabled,
                  ]}
                >
                  <Text style={styles.demoButtonTitle}>{demo.label}</Text>
                  <Text style={styles.demoButtonSubtitle}>
                    {demo.identifier}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
  demoSection: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase'
  },
  demoButtonRow: {
    flexDirection: 'column',
  },
  demoButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 10,
  },
  demoButtonDisabled: {
    opacity: 0.6,
  },
  coachDemoButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  demoButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  demoButtonSubtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  demoMissingPassword: {
    marginTop: 4,
    fontSize: 11,
    color: '#DC2626',
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
