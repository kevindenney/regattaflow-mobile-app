import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [profile, setProfile] = React.useState({
    name: '',
    phone: '',
    bio: '',
    location: '',
    yacht_club: '',
    sail_number: '',
    preferred_boat_class: ''
  });

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

      if (data) {
        setProfile({
          name: data.name || '',
          phone: data.phone || '',
          bio: data.bio || '',
          location: data.location || '',
          yacht_club: data.yacht_club || '',
          sail_number: data.sail_number || '',
          preferred_boat_class: data.preferred_boat_class || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!profile.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profile.name.trim(),
          phone: profile.phone.trim(),
          bio: profile.bio.trim(),
          location: profile.location.trim(),
          yacht_club: profile.yacht_club.trim(),
          sail_number: profile.sail_number.trim(),
          preferred_boat_class: profile.preferred_boat_class.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Edit Profile</Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={18} color="#FFFFFF" />
                <Text className="text-white font-semibold ml-2">Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Basic Information */}
        <View className="bg-white mt-4 px-4 py-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Basic Information
          </Text>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Full Name *</Text>
            <TextInput
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Enter your name"
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Email</Text>
            <TextInput
              value={user?.email || ''}
              editable={false}
              className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-500"
            />
            <Text className="text-gray-400 text-xs mt-1">
              Email cannot be changed here
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Phone</Text>
            <TextInput
              value={profile.phone}
              onChangeText={(text) => setProfile({ ...profile, phone: text })}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Location</Text>
            <TextInput
              value={profile.location}
              onChangeText={(text) => setProfile({ ...profile, location: text })}
              placeholder="e.g., San Francisco, CA"
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-2">Bio</Text>
            <TextInput
              value={profile.bio}
              onChangeText={(text) => setProfile({ ...profile, bio: text })}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>
        </View>

        {/* Sailing Information */}
        <View className="bg-white mt-4 px-4 py-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Sailing Information
          </Text>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Yacht Club</Text>
            <TextInput
              value={profile.yacht_club}
              onChangeText={(text) => setProfile({ ...profile, yacht_club: text })}
              placeholder="Enter your yacht club"
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Sail Number</Text>
            <TextInput
              value={profile.sail_number}
              onChangeText={(text) => setProfile({ ...profile, sail_number: text })}
              placeholder="Enter your sail number"
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-2">Preferred Boat Class</Text>
            <TextInput
              value={profile.preferred_boat_class}
              onChangeText={(text) => setProfile({ ...profile, preferred_boat_class: text })}
              placeholder="e.g., J/70, Dragon, Swan 47"
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
