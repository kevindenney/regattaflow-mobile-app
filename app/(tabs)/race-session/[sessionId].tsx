/**
 * Race Session Detail Screen
 * View completed race with GPS track and AI analysis
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Clock, Navigation } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { RaceAnalysisView } from '@/components/races/RaceAnalysisView';

interface RaceSession {
  id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  track_points: any[];
  notes: string;
  regattas: {
    name: string;
    location: string | null;
  } | null;
}

export default function RaceSessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<RaceSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('race_timer_sessions')
        .select(`
          *,
          regattas(name, location)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      setSession(data);
    } catch (error: any) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0284c7" />
          <Text className="text-gray-600 mt-4">Loading race session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-900 text-xl font-bold mb-2">
            Race Session Not Found
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            The race session you're looking for doesn't exist or has been deleted.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-sky-600 rounded-lg px-6 py-3"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const durationMinutes = Math.floor((session.duration_seconds || 0) / 60);
  const durationSeconds = (session.duration_seconds || 0) % 60;
  const raceName = session.regattas?.name || 'Race Session';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
          >
            <ArrowLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-gray-900 text-lg font-bold">
              {raceName}
            </Text>
            {session.regattas?.venue && (
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#6b7280" />
                <Text className="text-gray-600 text-sm ml-1">
                  {session.regattas.venue}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Session Stats */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <View className="flex-row justify-around">
          <View className="items-center">
            <Clock size={20} color="#0284c7" />
            <Text className="text-gray-900 font-bold text-lg mt-1">
              {durationMinutes}:{durationSeconds.toString().padStart(2, '0')}
            </Text>
            <Text className="text-gray-600 text-xs">Duration</Text>
          </View>
          <View className="items-center">
            <Navigation size={20} color="#10b981" />
            <Text className="text-gray-900 font-bold text-lg mt-1">
              {session.track_points?.length || 0}
            </Text>
            <Text className="text-gray-600 text-xs">GPS Points</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-900 font-bold text-lg">
              {new Date(session.start_time).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text className="text-gray-600 text-xs">Race Date</Text>
          </View>
        </View>
      </View>

      {/* AI Analysis */}
      <RaceAnalysisView sessionId={sessionId!} raceName={raceName} />
    </SafeAreaView>
  );
}
