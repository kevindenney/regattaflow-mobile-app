import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, GraduationCap, Star, MapPin, Calendar } from 'lucide-react-native';

export default function CoachingScreen() {
  const router = useRouter();

  const coaches = [
    {
      name: 'David Martinez',
      specialty: 'Dragon Class Expert',
      rating: 4.9,
      location: 'Hong Kong',
      price: '$150/hour',
      image: null
    },
    {
      name: 'Emma Thompson',
      specialty: 'Tactical Strategy',
      rating: 4.8,
      location: 'Hong Kong',
      price: '$120/hour',
      image: null
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Coaching</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* My Sessions */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Upcoming Sessions</Text>
          <View className="bg-blue-50 rounded-lg p-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-800 font-semibold">Tactical Training</Text>
              <View className="flex-row items-center">
                <Calendar size={14} color="#6B7280" />
                <Text className="text-gray-600 text-sm ml-1">Oct 15, 2024</Text>
              </View>
            </View>
            <Text className="text-gray-600 text-sm">with David Martinez</Text>
          </View>
        </View>

        {/* Find a Coach */}
        <Text className="text-lg font-bold text-gray-800 mb-3">Available Coaches</Text>

        {coaches.map((coach, index) => (
          <View key={index} className="bg-white rounded-xl p-4 mb-3">
            <View className="flex-row items-start mb-3">
              <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mr-3">
                <GraduationCap size={32} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">{coach.name}</Text>
                <Text className="text-gray-500 mb-1">{coach.specialty}</Text>
                <View className="flex-row items-center">
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text className="text-gray-600 text-sm ml-1">{coach.rating}</Text>
                  <View className="flex-row items-center ml-3">
                    <MapPin size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-1">{coach.location}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
              <Text className="text-blue-600 font-bold text-lg">{coach.price}</Text>
              <TouchableOpacity className="bg-blue-600 py-2 px-6 rounded-lg">
                <Text className="text-white font-medium">Book Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
