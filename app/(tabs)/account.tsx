/**
 * Account Screen
 *
 * Unified Tufte-style account management screen.
 * Combines Profile + Settings into single dense layout.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/providers/AuthProvider';
import { createSailorSampleData } from '@/services/onboarding/SailorSampleDataService';
import { supabase } from '@/services/supabase';
import { sailorBoatService } from '@/services/SailorBoatService';
import { getCurrentLocale, localeConfig } from '@/lib/i18n';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';
import { useUserSettings } from '@/hooks/useUserSettings';

import {
  TufteProfileHeader,
  TufteAccountSection,
  TufteSettingRow,
  TufteDataRow,
  TufteToggleRow,
  TufteBoatRow,
  tufteAccountStyles as styles,
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

export default function AccountScreen() {
  const { user, userProfile, signOut, updateUserProfile, isDemoSession } = useAuth();
  const { t } = useTranslation(['settings', 'common']);

  // User settings (tips, learning links)
  const { settings: userSettings, updateSetting } = useUserSettings();

  // State
  const [darkMode, setDarkMode] = useState(false);
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

  const sailingIdentity = useMemo(() => {
    return {
      primaryClass: userProfile?.primary_class || 'Not set',
      sailNumber: userProfile?.sail_number || 'Not set',
      homeClub: userProfile?.home_club || 'Not set',
      homeVenue: userProfile?.home_venue || 'Not set',
    };
  }, [userProfile]);

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
      // Show all boats (boat management moved here from dedicated tab)
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

  // Early return for unauthenticated
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <TufteProfileHeader
          name={userProfile?.full_name || 'User'}
          email={user?.email}
          memberSince={userProfile?.created_at}
          onEditPress={() => router.push('/settings/edit-profile')}
        />

        {/* Sailing Identity */}
        <TufteAccountSection title="Sailing Identity" action="Edit" onActionPress={() => router.push('/settings/edit-profile')}>
          <TufteDataRow label="Primary Class" value={sailingIdentity.primaryClass} />
          <TufteDataRow label="Sail Number" value={sailingIdentity.sailNumber} />
          <TufteDataRow label="Home Club" value={sailingIdentity.homeClub} />
          <TufteDataRow label="Home Venue" value={sailingIdentity.homeVenue} isLast />
        </TufteAccountSection>

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
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No boats added yet</Text>
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
          <TufteDataRow label="Plan" value={subscriptionTier} />
          <TufteDataRow
            label="Status"
            value={userProfile?.subscription_status === 'active' ? 'Active' : 'Inactive'}
            status={userProfile?.subscription_status === 'active' ? 'active' : 'inactive'}
          />
          <TufteSettingRow
            label="Manage Subscription"
            onPress={() => router.push('/subscription')}
            isLast
          />
        </TufteAccountSection>

        {/* Preferences */}
        <TufteAccountSection title="Preferences">
          <TufteSettingRow
            label={t('settings:preferences.language')}
            value={currentLanguageName}
            onPress={() => setLanguageVisible(true)}
          />
          <TufteToggleRow label="Dark Mode" value={darkMode} onValueChange={setDarkMode} />
          <TufteToggleRow
            label="Show Quick Tips"
            value={userSettings.showQuickTips}
            onValueChange={(value) => updateSetting('showQuickTips', value)}
          />
          <TufteSettingRow
            label="Notifications"
            onPress={() => router.push('/settings/notifications')}
            isLast
          />
        </TufteAccountSection>

        {/* Account Actions */}
        <TufteAccountSection title="Account">
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
          <TufteSettingRow
            label="Change Password"
            onPress={() => router.push('/settings/change-password')}
          />
          <TufteSettingRow
            label="Privacy Policy"
            onPress={() => Alert.alert('Coming Soon', 'Privacy policy link will be available soon!')}
          />
          <TufteSettingRow
            label="Terms of Service"
            onPress={() => Alert.alert('Coming Soon', 'Terms of service link will be available soon!')}
          />
          {userProfile?.user_type === 'sailor' && (
            <TufteSettingRow
              label="Reset Sample Data"
              onPress={handleResetSampleData}
            />
          )}
          <TufteSettingRow
            label="Help & Support"
            onPress={() => Alert.alert('Support', 'Email us at support@regattaflow.com')}
            isLast
          />
        </TufteAccountSection>

        {/* Danger Zone */}
        <TufteAccountSection title="Account Actions">
          <TufteSettingRow
            label="Sign Out"
            onPress={handleSignOut}
            danger
            showChevron={false}
            isLast
          />
        </TufteAccountSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>RegattaFlow v1.0.0</Text>
          <Text style={styles.appInfoText}>2024 RegattaFlow Inc.</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Claim Your Workspace</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
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

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Password</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Min 6 characters"
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                secureTextEntry
                value={claimPassword}
                onChangeText={setClaimPassword}
                editable={!claimLoading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Confirm Password</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Confirm password"
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                secureTextEntry
                value={claimPasswordConfirm}
                onChangeText={setClaimPasswordConfirm}
                editable={!claimLoading}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleClaimWorkspace}
              disabled={claimLoading}
            >
              {claimLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Set Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
