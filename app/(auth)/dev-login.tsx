import { Link } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

// Helper to get user-friendly error messages
const getAuthErrorMessage = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code || '';

  if (message.includes('invalid login credentials') || code === 'invalid_credentials') {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (message.includes('email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.';
  }
  if (message.includes('too many requests') || code === 'over_request_limit') {
    return 'Too many sign-in attempts. Please wait a moment and try again.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your internet connection.';
  }
  if (message.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }
  return error?.message || 'Sign in failed. Please try again.';
};

export default function DevLogin() {
  const { signIn, loading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setErrorMessage(null);

    if (!identifier || !password) {
      setErrorMessage('Please enter your email and password');
      return;
    }
    try {
      await signIn(identifier, password);
    } catch (e: any) {
      console.error('[DEV-LOGIN] Sign in failed:', e);
      const friendlyMessage = getAuthErrorMessage(e);
      setErrorMessage(friendlyMessage);
      if (Platform.OS !== 'web') {
        Alert.alert('Sign in failed', friendlyMessage);
      }
    }
  };

  const onDemoLogin = async (persona: DemoPersona) => {
    setErrorMessage(null);
    const demo = demoAccounts[persona];
    if (!demo.password) {
      setErrorMessage(`Demo credentials for ${demo.label} are not configured.`);
      return;
    }

    try {
      setIdentifier(demo.identifier);
      setPassword(demo.password);
      await signIn(demo.identifier, demo.password);
    } catch (e: any) {
      console.error(`[DEV-LOGIN] Demo ${persona} sign in failed:`, e);
      const friendlyMessage = getAuthErrorMessage(e);
      setErrorMessage(friendlyMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.devBadge}>
            <Text style={styles.devBadgeText}>DEV ONLY</Text>
          </View>
          <Text accessibilityRole="header" style={styles.title}>Developer Login</Text>
          <Text style={styles.subtitle}>Quick access to test accounts</Text>

          {/* Error Message Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity onPress={() => setErrorMessage(null)} style={styles.errorDismiss}>
                <Text style={styles.errorDismissText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

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

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or manual login</Text>
            <View style={styles.divider} />
          </View>

          {/* Login Form */}
          <View
            accessibilityRole="form"
            accessible={true}
            importantForAccessibility="yes"
          >
            <TextInput
              accessibilityLabel="identifier-input"
              style={styles.input}
              placeholder="Username or email"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="default"
              editable={!loading}
              textContentType="username"
              importantForAccessibility="yes"
            />

            <TextInput
              accessibilityLabel="password-input"
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              textContentType="password"
              importantForAccessibility="yes"
            />

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="submit-sign-in"
              onPress={onEmailLogin}
              disabled={loading}
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              importantForAccessibility="yes"
            >
              <Text style={styles.primaryButtonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Back to main login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingVertical: 48,
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
  devBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  devBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB'
  },
  dividerText: {
    marginHorizontal: 8,
    color: '#94A3B8',
    fontSize: 12,
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
    marginTop: 16
  },
  linkText: { color: '#3B82F6', fontWeight: '600' },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  errorDismiss: {
    marginLeft: 12,
    padding: 4,
  },
  errorDismissText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
