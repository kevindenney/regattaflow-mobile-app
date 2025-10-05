import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { 
  Clock, 
  Wind, 
  Navigation, 
  Thermometer, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Flag
} from 'lucide-react-native';

export default function RaceControlDashboard() {
  const [countdown, setCountdown] = useState('05:00');
  const [windDirection, setWindDirection] = useState(45);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Simulate countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      // In a real app, this would connect to the actual race timer
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Section */}
      <View className="bg-blue-600 py-4 px-4">
        <Text className="text-white text-2xl font-bold">RACE CONTROL</Text>
        <Text className="text-blue-100 text-lg mt-1">Spring Series R1 • Dragon Class</Text>
        
        <View className="flex-row items-center mt-3">
          <View className="bg-blue-500 rounded-full p-1 mr-2">
            <Clock color="white" size={16} />
          </View>
          <Text className="text-white font-semibold">Pre-Race Sequence</Text>
        </View>
        
        <View className="flex-row items-center mt-2">
          <Text className="text-white font-bold">Next Warning: </Text>
          <Text className="text-yellow-300 font-bold">{formatTime(currentTime)} (T-{countdown})</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Course Map Section */}
        <View className="bg-white rounded-xl shadow p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Course Map</Text>
          <View className="bg-gray-200 rounded-lg h-64 justify-center items-center">
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1627923316244-f4da80d8f281?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fEJvYXQlMjBzaGlwJTIwc2FpbGluZyUyMHdhdGVyJTIwbWFyaW5lfGVufDB8fDB8fHww' }} 
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          </View>
          
          <View className="flex-row flex-wrap mt-3 gap-2">
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-green-500 rounded-full mr-1"></View>
              <Text className="text-xs">Start Line</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-red-500 rounded-full mr-1"></View>
              <Text className="text-xs">Mark 1 (Windward)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></View>
              <Text className="text-xs">Mark 2 (Leeward)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-blue-500 rounded-full mr-1"></View>
              <Text className="text-xs">Finish Line</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-purple-500 rounded-full mr-1"></View>
              <Text className="text-xs">RC Boat</Text>
            </View>
          </View>
        </View>

        {/* Fleet Status */}
        <View className="bg-white rounded-xl shadow p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Fleet Status</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Total Entered:</Text>
            <Text className="font-semibold">15 boats</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">On Water:</Text>
            <View className="flex-row items-center">
              <Text className="font-semibold text-green-600 mr-1">15 boats</Text>
              <CheckCircle2 color="#10B981" size={16} />
            </View>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">DNS:</Text>
            <Text className="font-semibold">0</Text>
          </View>
        </View>

        {/* Conditions */}
        <View className="bg-white rounded-xl shadow p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Conditions (Live)</Text>
          <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center">
              <Wind color="#6B7280" size={20} className="mr-2" />
              <Text className="text-gray-600">Wind:</Text>
            </View>
            <Text className="font-semibold">12 knots NE</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center">
              <Navigation color="#6B7280" size={20} className="mr-2" />
              <Text className="text-gray-600">Current:</Text>
            </View>
            <Text className="font-semibold">0.8 knots SW</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center">
              <Thermometer color="#6B7280" size={20} className="mr-2" />
              <Text className="text-gray-600">Temperature:</Text>
            </View>
            <Text className="font-semibold">18°C</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Start Line Bias:</Text>
            <Text className="font-semibold text-green-600">Neutral</Text>
          </View>
        </View>

        {/* Race Committee */}
        <View className="bg-white rounded-xl shadow p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Race Committee</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">PRO:</Text>
            <View className="flex-row items-center">
              <Text className="font-semibold mr-2">John Smith</Text>
              <View className="bg-green-100 px-2 py-1 rounded-full">
                <Text className="text-green-800 text-xs">ON STATION</Text>
              </View>
            </View>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Mark Boat:</Text>
            <Text className="font-semibold text-green-600">Active</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Finish Boat:</Text>
            <Text className="font-semibold text-green-600">Active</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Safety Boat:</Text>
            <Text className="font-semibold text-green-600">Active</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="px-4 pb-6">
        <TouchableOpacity className="bg-green-600 rounded-xl py-4 mb-3 items-center justify-center shadow">
          <Text className="text-white text-lg font-bold">START SEQUENCE</Text>
        </TouchableOpacity>
        
        <View className="flex-row gap-3">
          <TouchableOpacity className="bg-yellow-500 flex-1 rounded-xl py-3 items-center justify-center shadow">
            <Text className="text-gray-900 font-bold">Postpone</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-red-600 flex-1 rounded-xl py-3 items-center justify-center shadow">
            <Text className="text-white font-bold">Abandon</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}