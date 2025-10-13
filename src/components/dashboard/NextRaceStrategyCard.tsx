/**
 * Next Race Strategy Card
 * Primary mobile interface showing weather-driven race strategy
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, MapPin, Wind, Waves, Clock, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface NextRaceStrategyCardProps {
  race?: {
    name: string;
    race_date: string;
    start_time: string;
    location: string;
  };
  weather?: {
    wind_speed: number;
    wind_direction: string;
    wave_height: number;
    tide: string;
  };
  strategy?: {
    hull_setup: string;
    rig_tuning: string;
    tactical_notes: string;
  };
  loading?: boolean;
}

export function NextRaceStrategyCard({ race, weather, strategy, loading }: NextRaceStrategyCardProps) {
  const router = useRouter();

  // If no race data, show prompt to complete profile
  if (!race) {
    return (
      <View className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-4">
        <View className="flex-row items-center gap-3 mb-3">
          <AlertTriangle size={28} color="#f59e0b" />
          <Text className="text-lg font-bold text-amber-900 flex-1">
            Complete Your Profile
          </Text>
        </View>
        <Text className="text-base text-amber-800 mb-4">
          Add your next race details to get personalized weather forecasts and race strategy recommendations.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/add-next-race-chat')}
          className="bg-amber-600 py-3 px-4 rounded-lg active:bg-amber-700"
        >
          <Text className="text-white font-semibold text-center">Add Next Race</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => router.push('/race-strategy')}
      className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-xl p-6 mb-4"
      activeOpacity={0.9}
    >
      {/* Race Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <Text className="text-white text-xs font-medium mb-1 uppercase tracking-wide">
            YOUR NEXT RACE
          </Text>
          <Text className="text-white text-xl font-bold">{race.name}</Text>
        </View>
        <ChevronRight size={24} color="white" />
      </View>

      {/* Race Details */}
      <View className="bg-white/20 rounded-lg p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-2">
          <Calendar size={16} color="white" />
          <Text className="text-white font-medium">
            {new Date(race.race_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 mb-2">
          <Clock size={16} color="white" />
          <Text className="text-white font-medium">Start: {race.start_time}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <MapPin size={16} color="white" />
          <Text className="text-white font-medium">{race.location}</Text>
        </View>
      </View>

      {/* Weather Forecast */}
      {loading ? (
        <View className="py-4">
          <ActivityIndicator color="white" />
          <Text className="text-white text-center mt-2 text-sm">Loading weather forecast...</Text>
        </View>
      ) : weather ? (
        <View>
          <Text className="text-white font-semibold mb-2">📍 Race Day Forecast</Text>
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white/20 rounded-lg p-3">
              <Wind size={20} color="white" className="mb-1" />
              <Text className="text-white text-xs opacity-80">Wind</Text>
              <Text className="text-white font-bold">{weather.wind_speed} kts</Text>
              <Text className="text-white text-xs">{weather.wind_direction}</Text>
            </View>
            <View className="flex-1 bg-white/20 rounded-lg p-3">
              <Waves size={20} color="white" className="mb-1" />
              <Text className="text-white text-xs opacity-80">Waves</Text>
              <Text className="text-white font-bold">{weather.wave_height}m</Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="bg-white/20 rounded-lg p-3 mb-4">
          <Text className="text-white text-sm">Weather forecast will be available closer to race day</Text>
        </View>
      )}

      {/* Strategy Recommendations */}
      {strategy && (
        <View className="bg-white rounded-lg p-4">
          <Text className="text-gray-900 font-bold mb-3">🎯 Recommended Setup</Text>

          <View className="mb-3">
            <Text className="text-gray-700 font-semibold text-sm mb-1">Hull Tuning</Text>
            <Text className="text-gray-900">{strategy.hull_setup}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-gray-700 font-semibold text-sm mb-1">Rig Setup</Text>
            <Text className="text-gray-900">{strategy.rig_tuning}</Text>
          </View>

          {strategy.tactical_notes && (
            <View>
              <Text className="text-gray-700 font-semibold text-sm mb-1">Tactical Notes</Text>
              <Text className="text-gray-900">{strategy.tactical_notes}</Text>
            </View>
          )}
        </View>
      )}

      {/* CTA */}
      <View className="flex-row items-center justify-center mt-4 py-2">
        <Text className="text-white font-semibold mr-2">View Full Strategy</Text>
        <ChevronRight size={20} color="white" />
      </View>
    </TouchableOpacity>
  );
}
