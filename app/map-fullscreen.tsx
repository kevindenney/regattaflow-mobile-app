import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { TacticalMapView } from '@/components/racing-console/PreStartConsole/TacticalMapView';

export default function MapFullscreenScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-900">
      {/* Live tactical map */}
      <View className="flex-1">
        <TacticalMapView />
      </View>

      {/* Close Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 right-4 bg-white rounded-full p-3 shadow-lg"
      >
        <X size={24} color="#1F2937" />
      </TouchableOpacity>

      {/* Course Info */}
      <View className="absolute bottom-8 left-4 bg-white rounded-xl p-4 shadow-lg">
        <Text className="text-gray-800 font-bold mb-1">Tactical Map</Text>
        <Text className="text-gray-500 text-sm">Live pre-start overlays</Text>
      </View>
    </View>
  );
}
