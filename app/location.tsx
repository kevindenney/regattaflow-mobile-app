import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Dimensions, Platform, type ViewStyle } from 'react-native';
import { Image } from '@/components/ui';
import { Search, MapPin, Navigation, Wifi, Navigation2, ChevronRight, RefreshCw } from 'lucide-react-native';

const screenWidth = Dimensions.get("window").width;

export default function LocationScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState({
    name: '',
    confidence: 0,
    address: ''
  });
  const [recentLocations, setRecentLocations] = useState([
    { id: 1, name: 'Royal Hong Kong Yacht Club', address: 'Repulse Bay, Hong Kong Island', confidence: 95 },
    { id: 2, name: 'Aberdeen Marina Club', address: 'Aberdeen Harbour, Hong Kong Island', confidence: 88 },
    { id: 3, name: 'Discovery Bay Marina', address: 'Discovery Bay, Lantau Island', confidence: 76 },
  ]);

  // Simulate GPS detection
  const detectLocation = () => {
    setIsDetecting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setDetectedLocation({
        name: 'Royal Hong Kong Yacht Club',
        confidence: 92,
        address: 'Repulse Bay, Hong Kong Island'
      });
      setIsDetecting(false);
    }, 2000);
  };

  useEffect(() => {
    // Auto-detect on component mount
    detectLocation();
  }, []);

  const refreshIconStyle = isDetecting
    ? [
        { transform: [{ rotate: '360deg' }] },
        Platform.OS === 'web' ? ({ transition: 'transform 1s linear' } as ViewStyle) : null,
      ]
    : undefined;

  return (
    <View className="flex-1 bg-white">
      {/* Progress Header */}
      <View className="bg-blue-600 px-4 pt-12 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold">Step 1 of 5</Text>
          <Text className="text-white text-sm">1:59 remaining</Text>
        </View>
        
        {/* Progress Bar */}
        <View className="h-2 bg-blue-400 rounded-full">
          <View className="w-[20%] h-2 bg-white rounded-full" />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-4">
        <View className="mt-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Where do you sail?
          </Text>
          <Text className="text-gray-500 mb-6">
            We'll use your location to find relevant sailing venues and fleets
          </Text>

          {/* GPS Detection Card */}
          <View className="bg-blue-50 rounded-xl p-5 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-blue-600 font-semibold text-lg">Auto-Detect Location</Text>
              <TouchableOpacity 
                onPress={detectLocation}
                disabled={isDetecting}
                className={`p-2 rounded-full ${isDetecting ? 'bg-gray-200' : 'bg-blue-100'}`}
              >
                <RefreshCw 
                  size={20} 
                  className={isDetecting ? "text-gray-400" : "text-blue-600"} 
                  style={refreshIconStyle}
                />
              </TouchableOpacity>
            </View>
            
            {isDetecting ? (
              <View className="items-center py-6">
                <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
                  <Navigation2 size={32} className="text-blue-600" />
                </View>
                <Text className="text-gray-600 text-center">Detecting your location...</Text>
                <Text className="text-gray-500 text-sm text-center mt-1">Using GPS and nearby venues</Text>
              </View>
            ) : detectedLocation.name ? (
              <View className="bg-white rounded-lg border border-blue-200 p-4">
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <MapPin size={20} className="text-blue-600" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold text-lg">{detectedLocation.name}</Text>
                    <Text className="text-gray-600 text-sm mt-1">{detectedLocation.address}</Text>
                    <View className="flex-row items-center mt-2">
                      <View className="h-2 flex-1 bg-gray-200 rounded-full mr-2">
                        <View 
                          className="h-2 bg-green-500 rounded-full" 
                          style={{ width: `${detectedLocation.confidence}%` }}
                        />
                      </View>
                      <Text className="text-gray-500 text-sm">{detectedLocation.confidence}% match</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity className="mt-4 bg-blue-600 rounded-lg py-3 items-center">
                  <Text className="text-white font-semibold">Use This Location</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center py-4">
                <Text className="text-gray-500 text-center">Location detection failed</Text>
                <TouchableOpacity 
                  onPress={detectLocation}
                  className="mt-3 bg-blue-600 rounded-lg py-2 px-4"
                >
                  <Text className="text-white font-semibold">Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl p-3 mb-6">
            <Search size={20} className="text-gray-400 mr-2" />
            <TextInput
              placeholder="Search for sailing venues..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-base text-gray-800"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Recent Locations */}
          {recentLocations.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-4">Recent Locations</Text>
              
              {recentLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4 mb-3"
                >
                  <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mr-3">
                    <MapPin size={20} className="text-blue-600" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold">{location.name}</Text>
                    <Text className="text-gray-500 text-sm mt-1">{location.address}</Text>
                    <View className="flex-row items-center mt-1">
                      <Wifi size={12} className="text-green-500 mr-1" />
                      <Text className="text-green-600 text-xs">{location.confidence}% confidence</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} className="text-gray-400" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Manual Entry */}
          <TouchableOpacity className="flex-row items-center justify-center bg-white border border-gray-200 rounded-xl p-4">
            <Text className="text-blue-600 font-semibold">Enter Location Manually</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-4 py-4 border-t border-gray-200">
        <TouchableOpacity 
          className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center opacity-50"
          disabled={true}
        >
          <Text className="text-white font-semibold text-lg">
            Continue to Boats
          </Text>
          <ChevronRight size={20} color="white" className="ml-2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
