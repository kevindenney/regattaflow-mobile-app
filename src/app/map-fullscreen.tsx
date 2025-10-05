import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Layers, Navigation, Compass } from 'lucide-react-native';

export default function MapFullscreenScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-900">
      {/* Map Placeholder */}
      <View className="flex-1 bg-blue-900 items-center justify-center">
        <Compass size={64} color="#60A5FA" />
        <Text className="text-white text-lg mt-4">3D Map View</Text>
        <Text className="text-blue-300 mt-2">MapLibre GL integration coming soon</Text>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 right-4 bg-white rounded-full p-3 shadow-lg"
      >
        <X size={24} color="#1F2937" />
      </TouchableOpacity>

      {/* Map Controls */}
      <View className="absolute bottom-8 right-4">
        <TouchableOpacity className="bg-white rounded-full p-3 mb-3 shadow-lg">
          <Layers size={24} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity className="bg-white rounded-full p-3 shadow-lg">
          <Navigation size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Course Info */}
      <View className="absolute bottom-8 left-4 bg-white rounded-xl p-4 shadow-lg">
        <Text className="text-gray-800 font-bold mb-1">RHKYC Course Alpha</Text>
        <Text className="text-gray-500 text-sm">Windward-Leeward • 3 Laps</Text>
      </View>
    </View>
  );
}
