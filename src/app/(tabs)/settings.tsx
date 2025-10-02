import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';

export default function SettingsScreen() {
  const { user, userProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    console.log('⚙️ [SETTINGS] ===== FALLBACK SIGN OUT BUTTON PRESSED =====');
    console.log('⚙️ [SETTINGS] Current URL before alert:', typeof window !== 'undefined' ? window.location.href : 'N/A');

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
              console.log('⚙️ [SETTINGS] User confirmed sign out via Settings');
              console.log('⚙️ [SETTINGS] About to call signOut() function');

              await signOut();

              console.log('⚙️ [SETTINGS] signOut() completed successfully');
              // AuthProvider will handle navigation via auth state change - no need for manual redirect
            } catch (error) {
              console.error('⚙️ [SETTINGS] Fallback sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
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
              title="Language"
              subtitle="English"
              onPress={() => Alert.alert('Coming Soon', 'Language settings will be available soon!')}
            />
            <SettingItem
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Currently disabled"
              onPress={() => Alert.alert('Coming Soon', 'Dark mode will be available soon!')}
            />
          </View>
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
});