import { ClubAiAssistant } from '@/components/ai/ClubAiAssistant';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { getCurrentLocale, localeConfig } from '@/lib/i18n';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const { user, userProfile, clubProfile, signOut, updateUserProfile, isDemoSession } = useAuth();
  const { t } = useTranslation(['settings', 'common']);
  const [claimVisible, setClaimVisible] = useState(false);
  const [claimPassword, setClaimPassword] = useState('');
  const [claimPasswordConfirm, setClaimPasswordConfirm] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [languageVisible, setLanguageVisible] = useState(false);

  // Get current language display name
  const currentLocale = getCurrentLocale();
  const currentLanguageName = localeConfig[currentLocale]?.nativeName || 'English';

  const isDemoProfile = useMemo(
    () =>
      isDemoSession || (userProfile?.onboarding_step ?? '').toString().startsWith('demo'),
    [isDemoSession, userProfile?.onboarding_step]
  );

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // AuthProvider will handle navigation via auth state change - no need for manual redirect
            } catch (error) {
              console.error('[SETTINGS] Fallback sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleClaimWorkspace = async () => {
    if (claimPassword.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    if (claimPassword !== claimPasswordConfirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    const fallbackEmail =
      userProfile?.email ||
      user?.email ||
      `regatta-${user?.id ?? 'demo'}@demo.regattaflow.io`;

    setClaimLoading(true);
    try {
      const updatePayload: {
        email?: string;
        password: string;
        data?: Record<string, unknown>;
      } = {
        password: claimPassword,
        data: {
          full_name: userProfile?.full_name || undefined,
          name: userProfile?.full_name || undefined,
        },
      };

      if (!user?.email && fallbackEmail) {
        updatePayload.email = fallbackEmail;
      }

      const { error } = await supabase.auth.updateUser(updatePayload);
      if (error) {
        throw error;
      }

      await updateUserProfile({
        onboarding_step: 'claimed',
        demo_converted_at: new Date().toISOString(),
      });

      Alert.alert(
        'Workspace claimed',
        'Your password is set. Check your email for any verification requests.',
        [{ text: 'Great!', onPress: () => setClaimVisible(false) }]
      );
    } catch (error: any) {
      console.error('[Settings] Claim workspace error:', error);
      Alert.alert(
        'Unable to claim workspace',
        error?.message || 'Please try again or contact support.'
      );
    } finally {
      setClaimLoading(false);
      setClaimPassword('');
      setClaimPasswordConfirm('');
    }
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    danger = false
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, danger && styles.dangerIcon]}>
          <Ionicons name={icon} size={20} color={danger ? '#EF4444' : '#3B82F6'} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile?.full_name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profileType}>
                {userProfile?.user_type?.charAt(0).toUpperCase() + userProfile?.user_type?.slice(1) || 'Sailor'}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsGroup}>
            {!userProfile?.onboarding_completed && userProfile?.user_type === 'sailor' && (
              <SettingItem
                icon="checkmark-circle-outline"
                title="Complete Onboarding"
                subtitle="Finish setting up your sailing profile"
                onPress={() => router.push('/(auth)/sailor-onboarding-comprehensive')}
              />
            )}
            {isDemoProfile && (
              <SettingItem
                icon="flag-outline"
                title="Claim Workspace"
                subtitle="Set a password and keep your data"
                onPress={() => setClaimVisible(true)}
              />
            )}
            <SettingItem
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
            />
            <SettingItem
              icon="key-outline"
              title="Change Password"
              subtitle="Update your password"
              onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon!')}
            />
            <SettingItem
              icon="card-outline"
              title="Subscription"
              subtitle={`Current plan: ${userProfile?.subscription_tier?.charAt(0).toUpperCase() + userProfile?.subscription_tier?.slice(1) || 'Free'}`}
              onPress={() => Alert.alert('Coming Soon', 'Subscription management will be available soon!')}
            />
          </View>
        </View>

        {/* My Learning */}
        {userProfile?.user_type === 'sailor' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Learning</Text>
            <View style={styles.settingsGroup}>
              <SettingItem
                icon="analytics-outline"
                title="Race Learning Insights"
                subtitle="View personalized coaching and practice recommendations"
                onPress={() => router.push('/my-learning')}
              />
            </View>
          </View>
        )}

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Configure your notification preferences"
              onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon!')}
            />
            <SettingItem
              icon="language-outline"
              title={t('settings:preferences.language')}
              subtitle={currentLanguageName}
              onPress={() => setLanguageVisible(true)}
            />
            <SettingItem
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Currently disabled"
              onPress={() => Alert.alert('Coming Soon', 'Dark mode will be available soon!')}
            />
          </View>
        </View>

        {/* Claude Assistant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claude Assistant</Text>
          <Text style={styles.sectionHelper}>
            Ask Claude to draft communications, plan events, or answer member questions using your club data.
          </Text>
          <ClubAiAssistant
            clubId={clubProfile?.id ?? null}
            compact
            style={styles.aiAssistantContainer}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={() => Alert.alert('Support', 'Email us at support@regattaflow.com')}
            />
            <SettingItem
              icon="document-text-outline"
              title="Privacy Policy"
              subtitle="Read our privacy policy"
              onPress={() => Alert.alert('Coming Soon', 'Privacy policy link will be available soon!')}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Terms of Service"
              subtitle="Read our terms of service"
              onPress={() => Alert.alert('Coming Soon', 'Terms of service link will be available soon!')}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="log-out-outline"
              title="Sign Out"
              subtitle="Sign out of your account"
              onPress={handleSignOut}
              showArrow={false}
              danger={true}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>RegattaFlow v1.0.0</Text>
          <Text style={styles.appInfoText}>© 2024 RegattaFlow Inc.</Text>
        </View>
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={languageVisible}
        onClose={() => setLanguageVisible(false)}
      />

      <Modal
        visible={claimVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!claimLoading) {
            setClaimVisible(false);
            setClaimPassword('');
            setClaimPasswordConfirm('');
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Claim Your Workspace</Text>
            <Text style={styles.modalSubtitle}>
              Set a password so you can sign back in and keep the progress you’ve made in demo mode.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="New password (min 6 characters)"
              secureTextEntry
              value={claimPassword}
              onChangeText={setClaimPassword}
              editable={!claimLoading}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm password"
              secureTextEntry
              value={claimPasswordConfirm}
              onChangeText={setClaimPasswordConfirm}
              editable={!claimLoading}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  if (!claimLoading) {
                    setClaimVisible(false);
                    setClaimPassword('');
                    setClaimPasswordConfirm('');
                  }
                }}
                disabled={claimLoading}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleClaimWorkspace}
                disabled={claimLoading}
              >
                {claimLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Set Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionHelper: {
    fontSize: 13,
    color: '#6B7280',
    paddingHorizontal: 4,
    marginBottom: 12,
    lineHeight: 18,
  },
  aiAssistantContainer: {
    minHeight: 360,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 1px',
    elevation: 1,
    gap: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    boxShadow: '0px 1px',
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIcon: {
    backgroundColor: '#FEF2F2',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  dangerText: {
    color: '#EF4444',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  appInfoText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#E2E8F0',
  },
  modalButtonSecondaryText: {
    color: '#1E293B',
    fontWeight: '600',
  },
  modalButtonPrimary: {
    backgroundColor: '#2563EB',
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
