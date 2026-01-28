/**
 * AccountModalContent
 *
 * Apple HIG-style account screen presented as a modal.
 * Features a drag handle, Done button, profile banner, and grouped sections.
 * All business logic ported from app/(tabs)/account.tsx.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/providers/AuthProvider';
import { TOUR_STORAGE_KEYS } from '@/hooks/useOnboardingTour';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSailorSampleData } from '@/services/onboarding/SailorSampleDataService';
import { supabase } from '@/services/supabase';
import { sailorBoatService } from '@/services/SailorBoatService';
import { getCurrentLocale, localeConfig } from '@/lib/i18n';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { IOS_COLORS } from '@/components/cards/constants';
import { useUserSettings } from '@/hooks/useUserSettings';

import {
  TufteProfileHeader,
  TufteAccountSection,
  TufteSettingRow,
  TufteDataRow,
  TufteToggleRow,
  TufteBoatRow,
  tufteAccountStyles,
} from '@/components/account';

// Types
interface UserBoat {
  id: string;
  boat_name: string;
  boat_class_name: string;
  sail_number?: string;
  status: 'active' | 'stored' | 'sold' | 'retired';
  is_primary?: boolean;
}

interface ProfileUpdates {
  full_name?: string;
  home_club?: string;
  home_venue?: string;
}

export default function AccountModalContent() {
  const { user, userProfile, signOut, updateUserProfile, isDemoSession, capabilities } = useAuth();
  const { t } = useTranslation(['settings', 'common']);

  // User settings (tips, learning links)
  const { settings: userSettings, updateSetting } = useUserSettings();

  // State
  const [languageVisible, setLanguageVisible] = useState(false);
  const [claimVisible, setClaimVisible] = useState(false);
  const [claimPassword, setClaimPassword] = useState('');
  const [claimPasswordConfirm, setClaimPasswordConfirm] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [boats, setBoats] = useState<UserBoat[]>([]);
  const [boatsLoading, setBoatsLoading] = useState(true);
  const [resetSampleLoading, setResetSampleLoading] = useState(false);

  // Derived state
  const currentLocale = getCurrentLocale();
  const currentLanguageName = localeConfig[currentLocale]?.nativeName || 'English';

  const isDemoProfile = useMemo(
    () => isDemoSession || (userProfile?.onboarding_step ?? '').toString().startsWith('demo'),
    [isDemoSession, userProfile?.onboarding_step]
  );

  const subscriptionTier = useMemo(() => {
    const tier = userProfile?.subscription_tier || 'free';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }, [userProfile?.subscription_tier]);

  // Load boats on mount
  React.useEffect(() => {
    if (user?.id) {
      loadBoats();
    }
  }, [user?.id]);

  const loadBoats = useCallback(async () => {
    if (!user?.id) return;
    setBoatsLoading(true);
    try {
      const userBoats = await sailorBoatService.listBoatsForSailor(user.id);
      setBoats(
        userBoats.map((b) => ({
          id: b.id,
          boat_name: b.name || b.boat_class?.name || 'Unnamed Boat',
          boat_class_name: b.boat_class?.name || 'Unknown Class',
          sail_number: b.sail_number,
          status: (b.status as UserBoat['status']) || 'active',
          is_primary: b.is_primary,
        }))
      );
    } catch (error) {
      console.error('[Account] Failed to load boats:', error);
    } finally {
      setBoatsLoading(false);
    }
  }, [user?.id]);

  // Inline profile save handler
  const handleProfileSave = useCallback(async (updates: ProfileUpdates) => {
    try {
      await updateUserProfile(updates);
    } catch (error) {
      console.error('[Account] Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
      throw error;
    }
  }, [updateUserProfile]);

  // Handlers
  const handleSignOut = useCallback(async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('[Account] Sign out error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  }, [signOut]);

  const handleClaimWorkspace = useCallback(async () => {
    if (claimPassword.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (claimPassword !== claimPasswordConfirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    const fallbackEmail =
      userProfile?.email || user?.email || `regatta-${user?.id ?? 'demo'}@demo.regattaflow.io`;

    setClaimLoading(true);
    try {
      const updatePayload: { email?: string; password: string; data?: Record<string, unknown> } = {
        password: claimPassword,
        data: { full_name: userProfile?.full_name || undefined },
      };
      if (!user?.email && fallbackEmail) {
        updatePayload.email = fallbackEmail;
      }

      const { error } = await supabase.auth.updateUser(updatePayload);
      if (error) throw error;

      await updateUserProfile({
        onboarding_step: 'claimed',
        demo_converted_at: new Date().toISOString(),
      });

      Alert.alert('Workspace claimed', 'Your password is set.', [
        { text: 'Great!', onPress: () => setClaimVisible(false) },
      ]);
    } catch (error: any) {
      Alert.alert('Unable to claim workspace', error?.message || 'Please try again.');
    } finally {
      setClaimLoading(false);
      setClaimPassword('');
      setClaimPasswordConfirm('');
    }
  }, [claimPassword, claimPasswordConfirm, user, userProfile, updateUserProfile]);

  const handleResetSampleData = useCallback(async () => {
    Alert.alert(
      'Reset Sample Data',
      'This will create sample races to help you explore the app. Any existing sample races will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            setResetSampleLoading(true);
            try {
              const result = await createSailorSampleData({
                userId: user!.id,
                userName: userProfile?.full_name || 'Sailor',
                force: true,
              });
              if (result.success) {
                Alert.alert('Success', 'Sample races have been created! Check your races list.');
              } else {
                Alert.alert('Error', result.error || 'Failed to create sample data.');
              }
            } catch (error: any) {
              console.error('[Account] Reset sample data error:', error);
              Alert.alert('Error', 'Failed to create sample data. Please try again.');
            } finally {
              setResetSampleLoading(false);
            }
          },
        },
      ]
    );
  }, [user, userProfile]);

  const handleReplayTour = useCallback(async () => {
    Alert.alert(
      'Replay Tour',
      'This will restart the onboarding tour the next time you open the Races tab.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replay',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(TOUR_STORAGE_KEYS.sailor);
              Alert.alert('Success', 'The onboarding tour will play when you open the Races tab.');
            } catch (error) {
              console.error('[Account] Failed to reset tour:', error);
              Alert.alert('Error', 'Failed to reset tour. Please try again.');
            }
          },
        },
      ]
    );
  }, []);

  const handleDone = useCallback(() => {
    router.back();
  }, []);

  // Early return for unauthenticated
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <View style={styles.dragHandle} />
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }} />
            <Text style={styles.headerTitle}>Account</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <TouchableOpacity onPress={handleDone} hitSlop={8}>
                <Text style={styles.doneButton}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 14, color: IOS_COLORS.secondaryLabel, textAlign: 'center' }}>
            Sign in to manage your account.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modal Header: drag handle + Done button */}
      <View style={styles.modalHeader}>
        <View style={styles.dragHandle} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          <Text style={styles.headerTitle}>Account</Text>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={handleDone} hitSlop={8}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={tufteAccountStyles.scrollContent}>
        {/* Profile Header - with inline editing */}
        <TufteProfileHeader
          name={userProfile?.full_name || 'User'}
          email={user?.email}
          homeClub={userProfile?.home_club}
          homeVenue={userProfile?.home_venue}
          memberSince={userProfile?.created_at}
          onSave={handleProfileSave}
        />

        {/* Boats */}
        <TufteAccountSection
          title="Boats"
          action="Add Boat"
          onActionPress={() => router.push('/(tabs)/boat/add')}
        >
          {boatsLoading ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={IOS_COLORS.gray} />
            </View>
          ) : boats.length === 0 ? (
            <View style={tufteAccountStyles.emptyState}>
              <Text style={tufteAccountStyles.emptyText}>No boats added yet</Text>
            </View>
          ) : (
            boats.map((boat, index) => (
              <TufteBoatRow
                key={boat.id}
                name={boat.boat_name}
                boatClass={boat.boat_class_name}
                sailNumber={boat.sail_number}
                status={boat.status === 'sold' || boat.status === 'retired' ? 'inactive' : boat.status}
                isPrimary={boat.is_primary}
                onPress={() => router.push(`/(tabs)/boat/${boat.id}`)}
                isLast={index === boats.length - 1}
              />
            ))
          )}
        </TufteAccountSection>

        {/* Subscription */}
        <TufteAccountSection title="Subscription">
          <TufteDataRow label="Plan" value={`${subscriptionTier} Plan`} />
          {userProfile?.subscription_tier && userProfile.subscription_tier !== 'free' && (
            <TufteDataRow
              label="Status"
              value={userProfile?.subscription_status === 'active' ? 'Active' : 'Expired'}
              status={userProfile?.subscription_status === 'active' ? 'active' : 'warning'}
            />
          )}
          <TufteSettingRow
            label={userProfile?.subscription_tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
            onPress={() => router.push('/subscription')}
            isLast
          />
        </TufteAccountSection>

        {/* Settings */}
        <TufteAccountSection title="Settings">
          <TufteSettingRow
            label={t('settings:preferences.language')}
            value={currentLanguageName}
            onPress={() => setLanguageVisible(true)}
          />
          <TufteToggleRow
            label="Show Quick Tips"
            value={userSettings.showQuickTips}
            onValueChange={(value) => updateSetting('showQuickTips', value)}
          />
          <TufteSettingRow
            label="Notifications"
            onPress={() => router.push('/settings/notifications')}
          />
          <TufteSettingRow
            label="Change Password"
            onPress={() => router.push('/settings/change-password')}
          />
          {!userProfile?.onboarding_completed && userProfile?.user_type === 'sailor' && (
            <TufteSettingRow
              label="Complete Onboarding"
              onPress={() => router.push('/(auth)/sailor-onboarding-comprehensive')}
            />
          )}
          {isDemoProfile && (
            <TufteSettingRow
              label="Claim Workspace"
              onPress={() => setClaimVisible(true)}
            />
          )}
          {userProfile?.user_type === 'sailor' && !capabilities?.hasCoaching && (
            <TufteSettingRow
              label="Become a Coach"
              onPress={() => router.push('/(auth)/coach-onboarding-welcome')}
            />
          )}
          {capabilities?.hasCoaching && (
            <TufteSettingRow
              label="Coach Profile"
              value={capabilities.coachingProfile?.profile_published ? 'Published' : 'Draft'}
              onPress={() => router.push('/(auth)/coach-onboarding-welcome')}
            />
          )}
          {userProfile?.user_type === 'sailor' && (
            <TufteSettingRow
              label="Reset Sample Data"
              onPress={handleResetSampleData}
            />
          )}
          <TufteSettingRow
            label="Replay Onboarding Tour"
            onPress={handleReplayTour}
          />
          <TufteSettingRow
            label="Help & Support"
            onPress={() => Alert.alert('Support', 'Email us at support@regattaflow.com')}
            isLast
          />
        </TufteAccountSection>

        {/* Sign Out */}
        <TufteAccountSection>
          <TufteSettingRow
            label="Sign Out"
            onPress={handleSignOut}
            danger
            showChevron={false}
            isLast
          />
        </TufteAccountSection>

        {/* App Info */}
        <View style={tufteAccountStyles.appInfo}>
          <Text style={tufteAccountStyles.appInfoText}>RegattaFlow v1.0.0</Text>
          <Text style={tufteAccountStyles.appInfoText}>2024 RegattaFlow Inc.</Text>
        </View>
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector visible={languageVisible} onClose={() => setLanguageVisible(false)} />

      {/* Claim Workspace Modal */}
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
        <View style={tufteAccountStyles.modalOverlay}>
          <View style={tufteAccountStyles.modalContent}>
            <View style={tufteAccountStyles.modalHeader}>
              <Text style={tufteAccountStyles.modalTitle}>Claim Your Workspace</Text>
              <TouchableOpacity
                style={tufteAccountStyles.modalCloseButton}
                onPress={() => {
                  if (!claimLoading) {
                    setClaimVisible(false);
                    setClaimPassword('');
                    setClaimPasswordConfirm('');
                  }
                }}
              >
                <Ionicons name="close" size={24} color={IOS_COLORS.gray} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: IOS_COLORS.secondaryLabel, marginBottom: 16 }}>
              Set a password so you can sign back in and keep your progress.
            </Text>

            <View style={tufteAccountStyles.formGroup}>
              <Text style={tufteAccountStyles.formLabel}>Password</Text>
              <TextInput
                style={tufteAccountStyles.formInput}
                placeholder="Min 6 characters"
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                secureTextEntry
                value={claimPassword}
                onChangeText={setClaimPassword}
                editable={!claimLoading}
              />
            </View>

            <View style={tufteAccountStyles.formGroup}>
              <Text style={tufteAccountStyles.formLabel}>Confirm Password</Text>
              <TextInput
                style={tufteAccountStyles.formInput}
                placeholder="Confirm password"
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                secureTextEntry
                value={claimPasswordConfirm}
                onChangeText={setClaimPasswordConfirm}
                editable={!claimLoading}
              />
            </View>

            <TouchableOpacity
              style={tufteAccountStyles.primaryButton}
              onPress={handleClaimWorkspace}
              disabled={claimLoading}
            >
              {claimLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={tufteAccountStyles.primaryButtonText}>Set Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  modalHeader: {
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: IOS_COLORS.systemGray4,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
});
