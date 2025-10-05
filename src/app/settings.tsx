import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  Bell,
  Globe,
  Moon,
  User,
  Key,
  CreditCard,
  HelpCircle,
  FileText,
  MessageCircle,
  LogOut,
  Trash2
} from 'lucide-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/services/supabase';

interface SettingsItemProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  rightContent?: React.ReactNode;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon: Icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  rightContent
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center px-4 py-4 border-b border-gray-100 active:bg-gray-50"
  >
    <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
      <Icon size={20} color="#2563EB" />
    </View>
    <View className="flex-1 ml-3">
      <Text className="text-gray-800 font-medium">{title}</Text>
      {subtitle && <Text className="text-gray-500 text-sm mt-0.5">{subtitle}</Text>}
    </View>
    {rightContent || (showChevron && <ChevronRight size={20} color="#9CA3AF" />)}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);
  const [darkMode, setDarkMode] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  React.useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
              router.replace('/(auth)/signin');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Type DELETE to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm Delete',
                  style: 'destructive',
                  onPress: async () => {
                    router.push('/settings/delete-account');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-800">Settings</Text>
            <Text className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Section */}
        <View className="bg-white mt-4 px-4 py-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Profile
          </Text>
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-bold text-gray-800">
                {profile?.name || 'User'}
              </Text>
              <Text className="text-gray-500 text-sm">{user?.email}</Text>
              <Text className="text-blue-500 text-sm capitalize">
                {profile?.user_type || 'Sailor'}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View className="bg-white mt-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
            Account
          </Text>
          <SettingsItem
            icon={User}
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => router.push('/settings/edit-profile')}
          />
          <SettingsItem
            icon={Key}
            title="Change Password"
            subtitle="Update your password"
            onPress={() => router.push('/settings/change-password')}
          />
          <SettingsItem
            icon={CreditCard}
            title="Subscription"
            subtitle={`Current plan: ${profile?.subscription_tier || 'Free'}`}
            onPress={() => router.push('/subscription')}
          />
        </View>

        {/* App Settings Section */}
        <View className="bg-white mt-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
            App Settings
          </Text>
          <SettingsItem
            icon={Bell}
            title="Notifications"
            subtitle="Configure your notification preferences"
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingsItem
            icon={Globe}
            title="Language"
            subtitle="English"
            onPress={() => router.push('/settings/language')}
          />
          <TouchableOpacity
            className="flex-row items-center px-4 py-4 border-b border-gray-100 active:bg-gray-50"
          >
            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
              <Moon size={20} color="#2563EB" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-gray-800 font-medium">Dark Mode</Text>
              <Text className="text-gray-500 text-sm mt-0.5">
                {darkMode ? 'Currently enabled' : 'Currently disabled'}
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View className="bg-white mt-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
            Support
          </Text>
          <SettingsItem
            icon={HelpCircle}
            title="Help Center"
            subtitle="Get help and support"
            onPress={() => router.push('/support')}
          />
          <SettingsItem
            icon={FileText}
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            onPress={() => {
              // TODO: Open privacy policy
            }}
          />
          <SettingsItem
            icon={FileText}
            title="Terms of Service"
            subtitle="Read our terms of service"
            onPress={() => {
              // TODO: Open terms of service
            }}
          />
          <SettingsItem
            icon={MessageCircle}
            title="Contact Support"
            subtitle="Get in touch with our team"
            onPress={() => {
              // TODO: Open contact support
            }}
          />
        </View>

        {/* Account Actions */}
        <View className="bg-white mt-4 mb-4">
          <SettingsItem
            icon={LogOut}
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
            showChevron={false}
          />
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="flex-row items-center px-4 py-4 active:bg-gray-50"
          >
            <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center">
              <Trash2 size={20} color="#EF4444" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-red-500 font-medium">Delete Account</Text>
              <Text className="text-gray-500 text-sm mt-0.5">Permanently delete your account</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <Text className="text-center text-gray-400 text-xs mt-4 mb-4">
          RegattaFlow v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
