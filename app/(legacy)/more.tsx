import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter, Href } from 'expo-router';
import {
  Sailboat,
  Users,
  MapPin,
  Book,
  User,
  Settings as SettingsIcon,
  Building2,
  ChevronRight,
  Sparkles
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';

interface MenuItemProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string;
  badgeColor?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon: Icon,
  title,
  subtitle,
  onPress,
  badge,
  badgeColor = 'bg-red-500'
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center bg-white p-4 mb-2 rounded-xl active:bg-gray-50"
    style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    }}
    accessibilityRole="button"
    accessibilityLabel={`${title}. ${subtitle}`}
  >
    <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center">
      <Icon size={24} color="#2563EB" />
    </View>

    <View className="flex-1 ml-4">
      <Text className="text-base font-semibold text-gray-900">{title}</Text>
      <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>
    </View>

    {badge && (
      <View className={`${badgeColor} px-2 py-1 rounded-full mr-2`}>
        <Text className="text-white text-xs font-bold">{badge}</Text>
      </View>
    )}

    <ChevronRight size={20} color="#9CA3AF" />
  </TouchableOpacity>
);

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, children }) => (
  <View className="mb-6">
    <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
      {title}
    </Text>
    {children}
  </View>
);

export default function MoreScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-primary-500 pt-12 pb-6 px-4">
        <Text className="text-white text-2xl font-bold">More</Text>
        <Text className="text-blue-100 mt-1">Additional tools and settings</Text>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Racing & Training Section */}
        <MenuSection title="Racing & Training">
          <MenuItem
            icon={Sailboat}
            title="Fleets"
            subtitle="Join and manage your fleets"
            onPress={() => router.push('/fleet')}
          />

          <MenuItem
            icon={MapPin}
            title="Venue Intelligence"
            subtitle="Global venue analysis and insights"
            onPress={() => router.push('/venue')}
            badge="AI"
            badgeColor="bg-purple-500"
          />

          <MenuItem
            icon={Users}
            title="Crew Management"
            subtitle="Manage your crew roster"
            onPress={() => router.push('/crew')}
          />

          <MenuItem
            icon={Sparkles}
            title="Coaching Marketplace"
            subtitle="Book race-day coaching and strategy"
            onPress={() => router.push('/(tabs)/coaching')}
            badge="NEW"
            badgeColor="bg-green-500"
          />

          <MenuItem
            icon={Book}
            title="Tuning Guides"
            subtitle="Boat-specific tuning resources"
            onPress={() => router.push('/tuning-guides')}
          />
        </MenuSection>

        {/* Club & Community Section */}
        <MenuSection title="Club & Community">
          <MenuItem
            icon={Building2}
            title="Your Club"
            subtitle="Club events and membership"
            onPress={() => router.push('/(tabs)/club' as Href)}
          />
        </MenuSection>

        {/* Account Section */}
        <MenuSection title="Account">
          <MenuItem
            icon={User}
            title="Profile"
            subtitle="Edit your sailing profile"
            onPress={() => router.push('/profile')}
          />

          <MenuItem
            icon={SettingsIcon}
            title="Settings"
            subtitle="App preferences and privacy"
            onPress={() => router.push('/settings')}
          />
        </MenuSection>

        {/* Version Info */}
        <Text className="text-center text-gray-400 text-xs mt-4 mb-4">
          RegattaFlow v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
