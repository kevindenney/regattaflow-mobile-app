/**
 * AccountModalContent
 *
 * Apple HIG-style unified account & settings screen presented as a modal.
 * Uses inset grouped IOSListSections with IOSListItems.
 * Merges functionality from both Account and Settings screens.
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TeamSeatManager } from '@/components/subscription/TeamSeatManager';
import { useUserSettings, UNIT_SHORT_LABELS } from '@/hooks/useUserSettings';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';
import { useAuth } from '@/providers/AuthProvider';
import { sailorBoatService } from '@/services/SailorBoatService';
import { supabase } from '@/services/supabase';

import { IOSListItem } from '@/components/ui/ios/IOSListItem';
import { IOSListSection } from '@/components/ui/ios/IOSListSection';
import { TourPricingCard } from '@/components/onboarding/TourPricingCard';
import { TufteProfileHeader } from './TufteProfileHeader';
import { accountStyles, ICON_BACKGROUNDS } from './accountStyles';

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
  avatar_url?: string;
}

export default function AccountModalContent() {
  const { user, userProfile, signOut, updateUserProfile, isDemoSession, capabilities, coachProfile } = useAuth();
  // User settings (tips, learning links, units)
  const { settings: userSettings, updateSetting } = useUserSettings();
  const insets = useSafeAreaInsets();

  // State
  const [claimVisible, setClaimVisible] = useState(false);
  const [claimPassword, setClaimPassword] = useState('');
  const [claimPasswordConfirm, setClaimPasswordConfirm] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [boats, setBoats] = useState<UserBoat[]>([]);
  const [boatsLoading, setBoatsLoading] = useState(true);

  // Settings-related state
  const [pricingVisible, setPricingVisible] = useState(false);
  const [teamManagerVisible, setTeamManagerVisible] = useState(false);
  const [allowFollowerSharing, setAllowFollowerSharing] = useState(true);
  const [sharingSettingLoading, setSharingSettingLoading] = useState(false);

  // Derived state
  const isDemoProfile = useMemo(
    () => isDemoSession || (userProfile?.onboarding_step ?? '').toString().startsWith('demo'),
    [isDemoSession, userProfile?.onboarding_step]
  );

  const subscriptionTier = useMemo(() => {
    const tier = userProfile?.subscription_tier || 'free';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }, [userProfile?.subscription_tier]);

  // Check if user has a team subscription
  const isTeamSubscriber = userProfile?.subscription_tier === 'team';

  // Load boats on mount
  useEffect(() => {
    if (user?.id) {
      loadBoats();
    }
  }, [user?.id]);

  // Load follower sharing setting on mount
  useEffect(() => {
    async function loadFollowerSharingSetting() {
      if (!user?.id) return;

      try {
        const { data } = await supabase
          .from('sailor_profiles')
          .select('allow_follower_sharing')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setAllowFollowerSharing(data.allow_follower_sharing ?? true);
        }
      } catch (error) {
        console.error('[Account] Error loading follower sharing setting:', error);
      }
    }

    loadFollowerSharingSetting();
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
      showAlert('Error', 'Failed to save changes. Please try again.');
      throw error;
    }
  }, [updateUserProfile]);

  // Handlers
  const handleSignOut = useCallback(() => {
    showConfirm(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        try {
          await signOut();
        } catch (error) {
          console.error('[Account] Sign out error:', error);
          showAlert('Error', 'Failed to sign out. Please try again.');
        }
      },
      { destructive: true, confirmText: 'Sign Out' }
    );
  }, [signOut]);

  const handleClaimWorkspace = useCallback(async () => {
    if (claimPassword.length < 6) {
      showAlert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (claimPassword !== claimPasswordConfirm) {
      showAlert('Mismatch', 'Passwords do not match.');
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

      showAlert('Workspace claimed', 'Your password is set.');
      setClaimVisible(false);
    } catch (error: any) {
      showAlert('Unable to claim workspace', error?.message || 'Please try again.');
    } finally {
      setClaimLoading(false);
      setClaimPassword('');
      setClaimPasswordConfirm('');
    }
  }, [claimPassword, claimPasswordConfirm, user, userProfile, updateUserProfile]);

  const handleDone = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/races');
    }
  }, []);

  // Save follower sharing setting
  const handleFollowerSharingChange = useCallback(async (value: boolean) => {
    setAllowFollowerSharing(value);
    setSharingSettingLoading(true);

    try {
      const { error } = await supabase
        .from('sailor_profiles')
        .update({ allow_follower_sharing: value })
        .eq('user_id', user?.id);

      if (error) {
        console.error('[Account] Error saving follower sharing setting:', error);
        setAllowFollowerSharing(!value);
        showAlert('Error', 'Failed to save privacy setting. Please try again.');
      }
    } catch (error) {
      console.error('[Account] Exception saving follower sharing setting:', error);
      setAllowFollowerSharing(!value);
    } finally {
      setSharingSettingLoading(false);
    }
  }, [user?.id]);

  const handleDeleteAccount = useCallback(() => {
    showConfirm(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      async () => {
        router.push('/settings/delete-account');
      },
      { destructive: true, confirmText: 'Continue' }
    );
  }, []);

  // ── Trailing value component helper ──────────────────────────────
  const trailingValue = (text: string) => (
    <Text style={accountStyles.trailingValueText}>{text}</Text>
  );

  // Early return for unauthenticated - show sign-in options
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 8) }]}>
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
          <Ionicons name="person-circle-outline" size={64} color={IOS_COLORS.systemGray3} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: '600', color: IOS_COLORS.label, marginBottom: 8 }}>
            Sign In
          </Text>
          <Text style={{ fontSize: 14, color: IOS_COLORS.secondaryLabel, textAlign: 'center', marginBottom: 24 }}>
            Sign in to manage your account, track your races, and sync across devices.
          </Text>
          <TouchableOpacity
            testID="account-sign-in-button"
            style={{
              backgroundColor: IOS_COLORS.systemBlue,
              paddingVertical: 14,
              paddingHorizontal: 32,
              borderRadius: 12,
              marginBottom: 12,
              minWidth: 200,
              alignItems: 'center',
            }}
            onPress={() => {
              handleDone();
              router.push('/(auth)/login');
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="account-create-account-button"
            style={{
              paddingVertical: 12,
              paddingHorizontal: 32,
            }}
            onPress={() => {
              handleDone();
              router.push('/(auth)/signup');
            }}
          >
            <Text style={{ color: IOS_COLORS.systemBlue, fontSize: 16, fontWeight: '500' }}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Modal Header: drag handle + Done button */}
      <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 8) }]}>
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={accountStyles.scrollContent}>
        {/* ── Profile Card ─────────────────────────────────────── */}
        <TufteProfileHeader
          name={userProfile?.full_name || 'User'}
          email={user?.email}
          avatarUrl={userProfile?.avatar_url}
          userId={user?.id}
          homeClub={userProfile?.home_club}
          homeVenue={userProfile?.home_venue}
          memberSince={userProfile?.created_at}
          onSave={handleProfileSave}
        />

        {/* ── Boats ────────────────────────────────────────────── */}
        <IOSListSection header="Boats">
          {boatsLoading ? (
            <View style={accountStyles.emptyState}>
              <ActivityIndicator size="small" color={IOS_COLORS.systemGray} />
            </View>
          ) : boats.length === 0 ? (
            <View style={accountStyles.emptyState}>
              <Text style={accountStyles.emptyText}>No boats added yet</Text>
            </View>
          ) : (
            boats.map((boat) => (
              <IOSListItem
                key={boat.id}
                title={`${boat.boat_name}${boat.is_primary ? ' \u00b7 Primary' : ''}`}
                subtitle={`${boat.boat_class_name}${boat.sail_number ? ` ${boat.sail_number}` : ''}`}
                leadingIcon="boat-outline"
                leadingIconBackgroundColor={ICON_BACKGROUNDS.blue}
                trailingAccessory="badge"
                badgeText={boat.status === 'active' ? 'active' : boat.status === 'stored' ? 'stored' : 'inactive'}
                badgeColor={
                  boat.status === 'active'
                    ? IOS_COLORS.systemGreen
                    : boat.status === 'stored'
                      ? IOS_COLORS.systemOrange
                      : IOS_COLORS.systemGray
                }
                onPress={() => router.push(`/(tabs)/boat/${boat.id}`)}
              />
            ))
          )}
          <IOSListItem
            title="Add Boat"
            leadingIcon="add-circle-outline"
            leadingIconBackgroundColor={ICON_BACKGROUNDS.blue}
            trailingAccessory="chevron"
            onPress={() => router.push('/(tabs)/boat/add')}
          />
        </IOSListSection>

        {/* ── Subscription ─────────────────────────────────────── */}
        <IOSListSection header="Subscription">
          <IOSListItem
            title="Plan"
            trailingAccessory="none"
            trailingComponent={trailingValue(`${subscriptionTier} Plan`)}
          />
          {userProfile?.subscription_tier && userProfile.subscription_tier !== 'free' && (
            <IOSListItem
              title="Status"
              trailingAccessory="none"
              trailingComponent={trailingValue(
                userProfile?.subscription_status === 'active' ? 'Active' : 'Expired'
              )}
            />
          )}
          <IOSListItem
            title="Plans & Pricing"
            leadingIcon="pricetags-outline"
            leadingIconBackgroundColor={ICON_BACKGROUNDS.blue}
            trailingAccessory="chevron"
            onPress={() => setPricingVisible(true)}
          />
          <IOSListItem
            title={userProfile?.subscription_tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
            leadingIcon="arrow-up-circle-outline"
            leadingIconBackgroundColor={ICON_BACKGROUNDS.purple}
            trailingAccessory="chevron"
            onPress={() => router.push('/subscription')}
          />
        </IOSListSection>

        {/* ── General ──────────────────────────────────────────── */}
        <IOSListSection header="General">
          <IOSListItem
            title="Units"
            leadingIcon="speedometer-outline"
            leadingIconBackgroundColor={ICON_BACKGROUNDS.blue}
            trailingComponent={trailingValue(UNIT_SHORT_LABELS[userSettings.units])}
            onPress={() => router.push('/settings/units')}
          />
          <IOSListItem
            title="Notifications"
            leadingIcon="notifications-outline"
            leadingIconBackgroundColor={ICON_BACKGROUNDS.red}
            trailingAccessory="chevron"
            onPress={() => router.push('/settings/notifications')}
          />
        </IOSListSection>

        {/* ── My Learning (sailors only) ─────────────────────── */}
        {userProfile?.user_type === 'sailor' && (
          <IOSListSection header="My Learning">
            <IOSListItem
              title="Race Learning Insights"
              leadingIcon="analytics-outline"
              leadingIconBackgroundColor={ICON_BACKGROUNDS.green}
              trailingAccessory="chevron"
              onPress={() => router.push('/my-learning')}
            />
            <IOSListItem
              title="Connected Devices"
              leadingIcon="bluetooth-outline"
              leadingIconBackgroundColor={ICON_BACKGROUNDS.blue}
              trailingAccessory="chevron"
              onPress={() => router.push('/settings/connected-devices')}
            />
          </IOSListSection>
        )}

        {/* ── Privacy (sailors only) ─────────────────────────── */}
        {userProfile?.user_type === 'sailor' && (
          <IOSListSection header="Privacy">
            <IOSListItem
              title="Share race prep with followers"
              leadingIcon="eye-outline"
              leadingIconBackgroundColor={ICON_BACKGROUNDS.gray}
              trailingAccessory="switch"
              switchValue={allowFollowerSharing}
              onSwitchChange={handleFollowerSharingChange}
              disabled={sharingSettingLoading}
            />
          </IOSListSection>
        )}

        {/* ── Security ─────────────────────────────────────────── */}
        <IOSListSection header="Security">
          <IOSListItem
            title="Change Password"
            leadingIcon="lock-closed-outline"
            leadingIconBackgroundColor={ICON_BACKGROUNDS.gray}
            trailingAccessory="chevron"
            onPress={() => router.push('/settings/change-password')}
          />
          {isTeamSubscriber && (
            <IOSListItem
              title="Manage Team"
              leadingIcon="people-outline"
              leadingIconBackgroundColor={ICON_BACKGROUNDS.blue}
              trailingAccessory="chevron"
              onPress={() => setTeamManagerVisible(true)}
            />
          )}
          {isDemoProfile && (
            <IOSListItem
              title="Claim Workspace"
              leadingIcon="key-outline"
              leadingIconBackgroundColor={ICON_BACKGROUNDS.orange}
              trailingAccessory="chevron"
              onPress={() => setClaimVisible(true)}
            />
          )}
          {!userProfile?.onboarding_completed && userProfile?.user_type === 'sailor' && (
            <IOSListItem
              title="Complete Onboarding"
              leadingIcon="checkmark-circle-outline"
              leadingIconBackgroundColor={ICON_BACKGROUNDS.green}
              trailingAccessory="chevron"
              onPress={() => router.push('/(auth)/sailor-onboarding-comprehensive')}
            />
          )}
        </IOSListSection>

        {/* ── Coaching ─────────────────────────────────────────── */}
        <IOSListSection header="Coaching">
          {(capabilities?.hasCoaching || coachProfile?.profile_published) ? (
            <>
              <IOSListItem
                title="Coach Dashboard"
                leadingIcon="easel-outline"
                leadingIconBackgroundColor={ICON_BACKGROUNDS.purple}
                trailingAccessory="chevron"
                onPress={() => router.push('/(tabs)/coaching')}
              />
              <IOSListItem
                title="Edit Coach Profile"
                leadingIcon="person-circle-outline"
                leadingIconBackgroundColor={ICON_BACKGROUNDS.blue}
                trailingAccessory="chevron"
                onPress={() => router.push('/coach/profile-edit')}
              />
            </>
          ) : coachProfile ? (
            // Has coach profile but not published - show resume onboarding
            <IOSListItem
              title="Complete Coach Setup"
              leadingIcon="school-outline"
              leadingIconBackgroundColor={ICON_BACKGROUNDS.orange}
              trailingAccessory="chevron"
              onPress={() => router.push('/(auth)/coach-onboarding-profile-preview')}
            />
          ) : (
            <IOSListItem
              title="Become a Coach"
              leadingIcon="school-outline"
              leadingIconBackgroundColor={ICON_BACKGROUNDS.purple}
              trailingAccessory="chevron"
              onPress={() => router.push('/(auth)/coach-onboarding-welcome')}
            />
          )}
        </IOSListSection>

        {/* ── Support ─────────────────────────────────────────── */}
        <IOSListSection header="Support">
          <IOSListItem
            title="Help & Support"
            leadingIcon="help-circle-outline"
            leadingIconBackgroundColor={ICON_BACKGROUNDS.teal}
            trailingAccessory="chevron"
            onPress={() => showAlert('Support', 'Email us at support@regattaflow.com')}
          />
          <IOSListItem
            title="Privacy Policy"
            leadingIcon="document-text-outline"
            leadingIconBackgroundColor={ICON_BACKGROUNDS.gray}
            trailingAccessory="chevron"
            onPress={() => showAlert('Coming Soon', 'Privacy policy link will be available soon!')}
          />
          <IOSListItem
            title="Terms of Service"
            leadingIcon="shield-checkmark-outline"
            leadingIconBackgroundColor={ICON_BACKGROUNDS.gray}
            trailingAccessory="chevron"
            onPress={() => showAlert('Coming Soon', 'Terms of service link will be available soon!')}
          />
        </IOSListSection>

        {/* ── Account ──────────────────────────────────────────── */}
        <IOSListSection header="Account">
          <IOSListItem
            testID="account-sign-out-button"
            title="Sign Out"
            titleStyle={accountStyles.signOutText}
            trailingAccessory="none"
            onPress={handleSignOut}
          />
          <IOSListItem
            title="Delete Account"
            leadingIcon="trash-outline"
            leadingIconBackgroundColor={ICON_BACKGROUNDS.red}
            titleStyle={accountStyles.signOutText}
            trailingAccessory="chevron"
            onPress={handleDeleteAccount}
          />
        </IOSListSection>

        {/* ── App Info Footer ──────────────────────────────────── */}
        <View style={accountStyles.appInfo}>
          <Text style={accountStyles.appInfoText}>RegattaFlow v1.0.0</Text>
          <Text style={accountStyles.appInfoText}>2024 RegattaFlow Inc.</Text>
        </View>
      </ScrollView>

      {/* Plans & Pricing Modal */}
      <Modal
        visible={pricingVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setPricingVisible(false)}
      >
        <TourPricingCard
          visible={pricingVisible}
          standalone={false}
          onStartTrial={() => {
            setPricingVisible(false);
            router.push('/subscription');
          }}
          onContinueFree={() => setPricingVisible(false)}
        />
      </Modal>

      {/* Team Manager Modal */}
      <Modal
        visible={teamManagerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTeamManagerVisible(false)}
      >
        <TeamSeatManager onClose={() => setTeamManagerVisible(false)} />
      </Modal>

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
        <View style={accountStyles.modalOverlay}>
          <View style={accountStyles.modalContent}>
            <View style={accountStyles.claimModalHeader}>
              <Text style={accountStyles.claimModalTitle}>Claim Your Workspace</Text>
              <TouchableOpacity
                style={accountStyles.claimModalCloseButton}
                onPress={() => {
                  if (!claimLoading) {
                    setClaimVisible(false);
                    setClaimPassword('');
                    setClaimPasswordConfirm('');
                  }
                }}
              >
                <Ionicons name="close" size={24} color={IOS_COLORS.systemGray} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: IOS_COLORS.secondaryLabel, marginBottom: 16 }}>
              Set a password so you can sign back in and keep your progress.
            </Text>

            <View style={accountStyles.formGroup}>
              <Text style={accountStyles.formLabel}>Password</Text>
              <TextInput
                style={accountStyles.formInput}
                placeholder="Min 6 characters"
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                secureTextEntry
                value={claimPassword}
                onChangeText={setClaimPassword}
                editable={!claimLoading}
              />
            </View>

            <View style={accountStyles.formGroup}>
              <Text style={accountStyles.formLabel}>Confirm Password</Text>
              <TextInput
                style={accountStyles.formInput}
                placeholder="Confirm password"
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                secureTextEntry
                value={claimPasswordConfirm}
                onChangeText={setClaimPasswordConfirm}
                editable={!claimLoading}
              />
            </View>

            <TouchableOpacity
              style={accountStyles.primaryButton}
              onPress={handleClaimWorkspace}
              disabled={claimLoading}
            >
              {claimLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={accountStyles.primaryButtonText}>Set Password</Text>
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
