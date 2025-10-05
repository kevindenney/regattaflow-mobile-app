import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Calendar, Users, Trophy, MessageCircle } from 'lucide-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/services/supabase';

interface NotificationPreferences {
  race_reminders: boolean;
  weather_alerts: boolean;
  crew_messages: boolean;
  race_results: boolean;
  coaching_updates: boolean;
  fleet_activity: boolean;
  venue_intelligence: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

interface NotificationSettingProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const NotificationSetting: React.FC<NotificationSettingProps> = ({
  icon: Icon,
  title,
  description,
  value,
  onValueChange
}) => (
  <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
    <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
      <Icon size={20} color="#2563EB" />
    </View>
    <View className="flex-1 ml-3">
      <Text className="text-gray-800 font-medium">{title}</Text>
      <Text className="text-gray-500 text-sm mt-0.5">{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
      thumbColor="#FFFFFF"
    />
  </View>
);

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [preferences, setPreferences] = React.useState<NotificationPreferences>({
    race_reminders: true,
    weather_alerts: true,
    crew_messages: true,
    race_results: true,
    coaching_updates: true,
    fleet_activity: true,
    venue_intelligence: true,
    email_notifications: true,
    push_notifications: true
  });

  React.useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.notification_preferences) {
        setPreferences({
          ...preferences,
          ...data.notification_preferences
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Save to database
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          notification_preferences: newPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Revert on error
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to save preference');
    } finally {
      setSaving(false);
    }
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
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Notifications</Text>
          </View>
          {saving && <ActivityIndicator size="small" color="#2563EB" />}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Master Controls */}
        <View className="bg-white mt-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
            Master Controls
          </Text>
          <NotificationSetting
            icon={Bell}
            title="Push Notifications"
            description="Enable push notifications on this device"
            value={preferences.push_notifications}
            onValueChange={(value) => updatePreference('push_notifications', value)}
          />
          <NotificationSetting
            icon={MessageCircle}
            title="Email Notifications"
            description="Receive notifications via email"
            value={preferences.email_notifications}
            onValueChange={(value) => updatePreference('email_notifications', value)}
          />
        </View>

        {/* Racing & Events */}
        <View className="bg-white mt-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
            Racing & Events
          </Text>
          <NotificationSetting
            icon={Calendar}
            title="Race Reminders"
            description="Reminders before scheduled races"
            value={preferences.race_reminders}
            onValueChange={(value) => updatePreference('race_reminders', value)}
          />
          <NotificationSetting
            icon={Trophy}
            title="Race Results"
            description="Updates when race results are posted"
            value={preferences.race_results}
            onValueChange={(value) => updatePreference('race_results', value)}
          />
          <NotificationSetting
            icon={Bell}
            title="Weather Alerts"
            description="Important weather updates for races"
            value={preferences.weather_alerts}
            onValueChange={(value) => updatePreference('weather_alerts', value)}
          />
        </View>

        {/* Social & Community */}
        <View className="bg-white mt-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
            Social & Community
          </Text>
          <NotificationSetting
            icon={Users}
            title="Crew Messages"
            description="Messages from your crew members"
            value={preferences.crew_messages}
            onValueChange={(value) => updatePreference('crew_messages', value)}
          />
          <NotificationSetting
            icon={Users}
            title="Fleet Activity"
            description="Updates from your sailing fleets"
            value={preferences.fleet_activity}
            onValueChange={(value) => updatePreference('fleet_activity', value)}
          />
        </View>

        {/* Professional Services */}
        <View className="bg-white mt-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
            Professional Services
          </Text>
          <NotificationSetting
            icon={Bell}
            title="Coaching Updates"
            description="Updates from your coaches and sessions"
            value={preferences.coaching_updates}
            onValueChange={(value) => updatePreference('coaching_updates', value)}
          />
          <NotificationSetting
            icon={Bell}
            title="Venue Intelligence"
            description="AI insights about sailing venues"
            value={preferences.venue_intelligence}
            onValueChange={(value) => updatePreference('venue_intelligence', value)}
          />
        </View>

        {/* Info */}
        <View className="bg-blue-50 mx-4 mt-4 p-4 rounded-lg border border-blue-200">
          <Text className="text-blue-900 font-semibold mb-1">
            About Notifications
          </Text>
          <Text className="text-blue-700 text-sm">
            You can customize which notifications you receive. Changes are saved automatically.
            Some critical safety notifications may still be sent even if you disable certain categories.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
