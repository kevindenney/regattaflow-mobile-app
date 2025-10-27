import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Brain, Upload, FileText, Map } from 'lucide-react-native';

export default function AIStrategyScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">AI Strategy Center</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Upload Section */}
        <View className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 mb-4" style={{ backgroundColor: '#9333ea' }}>
          <View className="flex-row items-center mb-4">
            <Brain size={32} color="white" />
            <Text className="text-white text-xl font-bold ml-3">AI-Powered Race Strategy</Text>
          </View>
          <Text className="text-purple-100 mb-4" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Upload sailing instructions, race documents, or photos. Our AI will extract courses, analyze conditions, and generate winning strategies.
          </Text>
          <TouchableOpacity className="bg-white py-3 px-6 rounded-lg">
            <View className="flex-row items-center justify-center">
              <Upload size={20} color="#9333ea" />
              <Text className="text-purple-600 font-semibold ml-2">Upload Document</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Strategies */}
        <Text className="text-lg font-bold text-gray-800 mb-3">Recent Strategies</Text>

        <View className="bg-white rounded-xl p-4 mb-3">
          <View className="flex-row items-center mb-3">
            <FileText size={20} color="#2563EB" />
            <Text className="text-gray-800 font-semibold ml-2">RHKYC Summer Series</Text>
          </View>
          <Text className="text-gray-600 mb-3">
            3-lap windward-leeward course. Optimal strategy: port tack start, favor right side in first beat.
          </Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity className="flex-1 py-2 bg-blue-50 rounded-lg">
              <Text className="text-blue-600 font-medium text-center">View Strategy</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 py-2 bg-green-50 rounded-lg">
              <View className="flex-row items-center justify-center">
                <Map size={16} color="#059669" />
                <Text className="text-green-600 font-medium ml-1">3D Course</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-white rounded-xl p-4">
          <View className="flex-row items-center mb-3">
            <FileText size={20} color="#2563EB" />
            <Text className="text-gray-800 font-semibold ml-2">Dragon World Championship</Text>
          </View>
          <Text className="text-gray-600 mb-3">
            Olympic-style course. AI analysis suggests conservative approach due to high competition density.
          </Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity className="flex-1 py-2 bg-blue-50 rounded-lg">
              <Text className="text-blue-600 font-medium text-center">View Strategy</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 py-2 bg-green-50 rounded-lg">
              <View className="flex-row items-center justify-center">
                <Map size={16} color="#059669" />
                <Text className="text-green-600 font-medium ml-1">3D Course</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
