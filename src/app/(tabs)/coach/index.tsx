import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '@/src/providers/AuthProvider';

export default function CoachDashboard() {
  const { user } = useAuth();

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-primary-500 pt-12 pb-4 px-4">
        <Text className="text-white text-2xl font-bold">Coach Dashboard</Text>
      </View>
      <ScrollView className="px-4 py-4">
        <Text className="text-lg">Welcome, {user?.email}</Text>
        <Text className="text-gray-600 mt-2">Coach features coming soon...</Text>
      </ScrollView>
    </View>
  );
}
