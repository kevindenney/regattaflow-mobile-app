import React, { useState } from 'react';
import { StyleSheet, View, Alert, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/src/lib/contexts/AuthContext';

type UserType = 'sailor' | 'club' | 'coach';

interface UserTypeOption {
  type: UserType;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

const userTypeOptions: UserTypeOption[] = [
  {
    type: 'sailor',
    title: 'Sailor',
    description: 'Individual racer seeking AI-powered strategy and performance tracking',
    icon: '⛵',
    features: ['AI Race Strategy', 'Equipment Tracking', 'Performance Analytics', 'Coach Marketplace']
  },
  {
    type: 'club',
    title: 'Yacht Club',
    description: 'Racing organization managing events, members, and race operations',
    icon: '🏁',
    features: ['Event Management', 'Race Committee Tools', 'Results Publishing', 'Member Management']
  },
  {
    type: 'coach',
    title: 'Coach',
    description: 'Professional instructor offering services and performance analysis',
    icon: '👨‍🏫',
    features: ['Client Management', 'Marketplace Profile', 'Performance Analysis', 'Session Booking']
  }
];

export default function SignupScreen() {
  const [step, setStep] = useState<'userType' | 'details'>('userType');
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, loading } = useAuth();

  const handleUserTypeSelection = (userType: UserType) => {
    setSelectedUserType(userType);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('userType');
    }
  };

  const handleSignup = async () => {
    if (!selectedUserType) {
      Alert.alert('Error', 'Please select your user type');
      return;
    }

    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await signUp(email, password, fullName, selectedUserType);
      Alert.alert(
        'Success!',
        'Account created successfully. Please check your email for verification.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    }
  };

  if (step === 'userType') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title">Welcome to RegattaFlow</ThemedText>
            <ThemedText type="subtitle">Choose your role to get started</ThemedText>
          </View>

          <ScrollView style={styles.userTypeContainer}>
            {userTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.userTypeCard,
                  selectedUserType === option.type && styles.userTypeCardSelected
                ]}
                onPress={() => handleUserTypeSelection(option.type)}
              >
                <View style={styles.userTypeHeader}>
                  <ThemedText style={styles.userTypeIcon}>{option.icon}</ThemedText>
                  <View style={styles.userTypeTitle}>
                    <ThemedText type="subtitle">{option.title}</ThemedText>
                    <ThemedText style={styles.userTypeDescription}>{option.description}</ThemedText>
                  </View>
                </View>

                <View style={styles.userTypeFeatures}>
                  {option.features.map((feature, index) => (
                    <ThemedText key={index} style={styles.userTypeFeature}>
                      • {feature}
                    </ThemedText>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText} onPress={() => router.push('/(auth)/login')}>
              🔑 Already have an account? Sign in
            </ThemedText>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title">Create Your Account</ThemedText>
          <ThemedText type="subtitle">
            {selectedUserType === 'sailor' && 'Join as a Sailor ⛵'}
            {selectedUserType === 'club' && 'Join as a Yacht Club 🏁'}
            {selectedUserType === 'coach' && 'Join as a Coach 👨‍🏫'}
          </ThemedText>
        </View>

        <ScrollView style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.buttonText}>Create Account</ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.features}>
          <ThemedText type="subtitle">What you'll get as a {selectedUserType}:</ThemedText>
          {userTypeOptions.find(opt => opt.type === selectedUserType)?.features.map((feature, index) => (
            <ThemedText key={index} type="default">✓ {feature}</ThemedText>
          ))}
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
  },

  // User Type Selection Styles
  userTypeContainer: {
    flex: 1,
    marginBottom: 20,
  },
  userTypeCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  userTypeCardSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#F0F7FF',
  },
  userTypeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userTypeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  userTypeTitle: {
    flex: 1,
  },
  userTypeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 20,
  },
  userTypeFeatures: {
    marginTop: 8,
  },
  userTypeFeature: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
  },

  // Form Styles
  form: {
    gap: 16,
    marginBottom: 32,
  },
  features: {
    alignItems: 'center',
    gap: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});