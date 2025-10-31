import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Search, Anchor, ChevronRight, Trash2 } from 'lucide-react-native';

type BoatOption = {
  id: number;
  name: string;
  popularity: string;
  image?: string;
};

export default function BoatsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoats, setSelectedBoats] = useState<BoatOption[]>([]);

  const [suggestions] = useState<BoatOption[]>([
    {
      id: 1,
      name: 'Dragon',
      popularity: 'High popularity at RHKYC',
      image: 'https://example.com/dragon.jpg',
    },
    {
      id: 2,
      name: 'International Dragon',
      popularity: 'Active fleet at RHKYC',
      image: 'https://example.com/int-dragon.jpg',
    },
  ]);

  const filteredSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return suggestions;
    }
    return suggestions.filter(
      (boat) =>
        boat.name.toLowerCase().includes(query) ||
        boat.popularity.toLowerCase().includes(query)
    );
  }, [searchQuery, suggestions]);

  return (
    <View className="flex-1 bg-white">
      {/* Progress Header */}
      <View className="bg-blue-600 px-4 pt-12 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold">Step 2 of 5</Text>
          <Text className="text-white text-sm">1:45 remaining</Text>
        </View>
        
        {/* Progress Bar */}
        <View className="h-2 bg-blue-400 rounded-full">
          <View className="w-[40%] h-2 bg-white rounded-full" />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-4">
        <View className="mt-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            What boats do you sail?
          </Text>
          <Text className="text-gray-500 mb-6">
            Select your boat classes to discover relevant fleets and races
          </Text>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl p-3 mb-6">
            <Search size={20} className="text-gray-400 mr-2" />
            <TextInput
              placeholder="Search boat classes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-base text-gray-800"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Selected Boats */}
          {selectedBoats.map((boat) => (
            <View key={boat.id} className="bg-blue-50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Anchor size={24} className="text-blue-600 mr-3" />
                  <View className="flex-1">
                    <Text className="text-blue-600 font-semibold text-lg">{boat.name}</Text>
                    <Text className="text-blue-500 text-sm mt-1">Owner</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedBoats((boatsState) => boatsState.filter((b) => b.id !== boat.id));
                  }}
                >
                  <Trash2 size={20} className="text-blue-600" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Suggestions */}
          <View className="mt-4">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Popular at your location
            </Text>
            
            {filteredSuggestions.map((boat) => (
              <TouchableOpacity
                key={boat.id}
                className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4 mb-3"
                onPress={() => {
                  setSelectedBoats((prev) => {
                    if (prev.some((existing) => existing.id === boat.id)) {
                      return prev;
                    }
                    return [...prev, boat];
                  });
                }}
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-gray-100 rounded-lg mr-3 items-center justify-center">
                    <Anchor size={24} className="text-blue-600" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold text-lg">{boat.name}</Text>
                    <Text className="text-gray-500 text-sm mt-1">{boat.popularity}</Text>
                  </View>
                </View>
                <ChevronRight size={20} className="text-gray-400" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-4 py-4 border-t border-gray-200">
        <TouchableOpacity 
          className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center"
          onPress={() => {/* Navigate to next screen */}}
        >
          <Text className="text-white font-semibold text-lg">
            Continue to Fleets
          </Text>
          <ChevronRight size={20} color="white" className="ml-2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
