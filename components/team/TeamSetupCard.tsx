/**
 * TeamSetupCard
 *
 * Card for setting up team racing collaboration.
 * Allows creating a new team or joining an existing one.
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Users, UserPlus, Sailboat, ArrowRight } from 'lucide-react-native';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  teal: '#0D9488',
};

type SetupMode = 'choice' | 'create' | 'join';

interface TeamSetupCardProps {
  raceName: string;
  onCreateTeam: (teamName: string) => Promise<void>;
  onJoinTeam: (inviteCode: string) => Promise<void>;
  isCreating?: boolean;
  isJoining?: boolean;
  error?: string | null;
}

export function TeamSetupCard({
  raceName,
  onCreateTeam,
  onJoinTeam,
  isCreating = false,
  isJoining = false,
  error,
}: TeamSetupCardProps) {
  const [mode, setMode] = useState<SetupMode>('choice');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error || localError;
  const isLoading = isCreating || isJoining;

  /**
   * Handle team creation
   */
  const handleCreate = useCallback(async () => {
    if (!teamName.trim()) {
      setLocalError('Please enter a team name');
      return;
    }

    setLocalError(null);
    try {
      await onCreateTeam(teamName.trim());
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create team');
    }
  }, [teamName, onCreateTeam]);

  /**
   * Handle team join
   */
  const handleJoin = useCallback(async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code || code.length < 6) {
      setLocalError('Please enter a valid invite code');
      return;
    }

    setLocalError(null);
    try {
      await onJoinTeam(code);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to join team');
    }
  }, [inviteCode, onJoinTeam]);

  /**
   * Reset to choice mode
   */
  const handleBack = useCallback(() => {
    setMode('choice');
    setTeamName('');
    setInviteCode('');
    setLocalError(null);
  }, []);

  // Choice mode - Create or Join
  if (mode === 'choice') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Users size={24} color={IOS_COLORS.teal} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Team Racing</Text>
            <Text style={styles.subtitle}>
              Coordinate with your teammates for {raceName}
            </Text>
          </View>
        </View>

        <View style={styles.options}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setMode('create')}
          >
            <View style={styles.optionIcon}>
              <Sailboat size={20} color={IOS_COLORS.teal} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Create Team</Text>
              <Text style={styles.optionDescription}>
                Start a new team and invite others
              </Text>
            </View>
            <ArrowRight size={20} color={IOS_COLORS.gray3} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setMode('join')}
          >
            <View style={styles.optionIcon}>
              <UserPlus size={20} color={IOS_COLORS.blue} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Join Team</Text>
              <Text style={styles.optionDescription}>
                Enter an invite code from a teammate
              </Text>
            </View>
            <ArrowRight size={20} color={IOS_COLORS.gray3} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Create team mode
  if (mode === 'create') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.formTitle}>Create Team</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>TEAM NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Team Velocity"
              placeholderTextColor={IOS_COLORS.gray}
              value={teamName}
              onChangeText={setTeamName}
              autoCapitalize="words"
              autoFocus
              editable={!isLoading}
            />

            {displayError && (
              <Text style={styles.errorText}>{displayError}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                !teamName.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!teamName.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Team</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Join team mode
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.formTitle}>Join Team</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.form}>
          <Text style={styles.inputLabel}>INVITE CODE</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="ABCD1234"
            placeholderTextColor={IOS_COLORS.gray}
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            maxLength={8}
            editable={!isLoading}
          />

          {displayError && (
            <Text style={styles.errorText}>{displayError}</Text>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              styles.joinButton,
              inviteCode.length < 6 && styles.submitButtonDisabled,
            ]}
            onPress={handleJoin}
            disabled={inviteCode.length < 6 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Join Team</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Ask your teammate for the invite code to join their team.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${IOS_COLORS.teal}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  subtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  options: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  optionDescription: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 50,
  },
  backButtonText: {
    fontSize: 15,
    color: IOS_COLORS.blue,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  form: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
    marginBottom: -4,
  },
  input: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: IOS_COLORS.label,
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorText: {
    fontSize: 13,
    color: IOS_COLORS.red,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: IOS_COLORS.teal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: IOS_COLORS.blue,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpText: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default TeamSetupCard;
