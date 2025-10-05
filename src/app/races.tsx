import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { 
  Calendar, Search, Plus, X, Check, ChevronLeft, ChevronRight,
  Users, MapPin, Clock, Anchor, Trophy
} from 'lucide-react-native';

// Mock data for clubs and their races
const mockClubs = [
  {
    id: '1',
    name: 'Royal Ocean Sailing Club',
    races: [
      { id: 'r1', name: 'Summer Series', date: '2023-07-15', type: 'series' },
      { id: 'r2', name: 'Wednesday Night Race', date: '2023-07-19', type: 'race' },
      { id: 'r3', name: 'Weekend Regatta', date: '2023-07-22', type: 'regatta' },
    ]
  },
  {
    id: '2',
    name: 'Marina Bay Sailing Association',
    races: [
      { id: 'r4', name: 'Friday Fleet Race', date: '2023-07-21', type: 'race' },
      { id: 'r5', name: 'Annual Championship', date: '2023-08-05', type: 'regatta' },
    ]
  },
  {
    id: '3',
    name: 'Harbor Yacht Club',
    races: [
      { id: 'r6', name: 'Beginner Series', date: '2023-07-25', type: 'series' },
    ]
  }
];

// Mock suggestions for free-form race entry
const raceSuggestions = [
  'Laser Open Championship',
  'America\'s Cup Qualifier',
  'Local Fleet Race',
  'Offshore Adventure Series',
  'Youth Sailing Cup',
  'Vintage Yacht Regatta',
  'Women\'s Sailing Series',
  'Corporate Sailing Challenge',
  'Solo Transatlantic Race',
  'Coastal Navigation Series'
];

export default function RaceSelectionScreen() {
  const [selectedRaces, setSelectedRaces] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  // Initialize with some selected races for demo
  useEffect(() => {
    const initialRaces = [
      { id: 'r1', name: 'Summer Series', club: 'Royal Ocean Sailing Club', date: '2023-07-15', type: 'series' },
      { id: 'r4', name: 'Friday Fleet Race', club: 'Marina Bay Sailing Association', date: '2023-07-21', type: 'race' }
    ];
    setSelectedRaces(initialRaces);
  }, []);

  // Filter suggestions based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = raceSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const toggleRaceSelection = (race: any, clubName?: string) => {
    const isSelected = selectedRaces.some(r => r.id === race.id);
    
    if (isSelected) {
      // Remove race
      setSelectedRaces(selectedRaces.filter(r => r.id !== race.id));
    } else {
      // Add race
      const raceToAdd = {
        ...race,
        club: clubName || 'Custom Race',
        date: race.date || new Date().toISOString().split('T')[0],
        type: race.type || 'race'
      };
      setSelectedRaces([...selectedRaces, raceToAdd]);
    }
  };

  const addCustomRace = () => {
    if (searchQuery.trim() === '') return;
    
    const newRace = {
      id: `custom-${Date.now()}`,
      name: searchQuery,
      club: 'Custom Race',
      date: new Date().toISOString().split('T')[0],
      type: 'race'
    };
    
    setSelectedRaces([...selectedRaces, newRace]);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const removeRace = (id: string) => {
    setSelectedRaces(selectedRaces.filter(race => race.id !== id));
  };

  const isSelected = (raceId: string) => {
    return selectedRaces.some(r => r.id === raceId);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-4 pt-12 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold">Step 4 of 5</Text>
          <Text className="text-white text-sm">2:30 remaining</Text>
        </View>
        
        {/* Progress Bar */}
        <View className="h-2 bg-blue-400 rounded-full">
          <View className="w-4/5 h-2 bg-white rounded-full" />
        </View>
        
        <Text className="text-2xl font-bold text-white mt-4">
          Select Your Races
        </Text>
        <Text className="text-blue-100 mt-1">
          Choose races from your clubs or add custom events
        </Text>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-4 py-6">
        {/* Search and Add Custom Race */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Add Custom Race
          </Text>
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
            <Search size={20} color="#6B7280" className="mr-2" />
            <TextInput
              className="flex-1 text-gray-800"
              placeholder="Search or add a race..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
            />
            <TouchableOpacity 
              className="bg-blue-600 rounded-full p-2 ml-2"
              onPress={addCustomRace}
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <View className="bg-white rounded-lg mt-2 shadow-sm border border-gray-200 max-h-40">
              <FlatList
                data={filteredSuggestions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    className="px-4 py-3 border-b border-gray-100 last:border-0"
                    onPress={() => {
                      setSearchQuery(item);
                      setShowSuggestions(false);
                    }}
                  >
                    <Text className="text-gray-800">{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Selected Races Summary */}
        {selectedRaces.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-gray-800">
                Your Selected Races ({selectedRaces.length})
              </Text>
              <TouchableOpacity onPress={() => setSelectedRaces([])}>
                <Text className="text-blue-600 font-medium">Clear All</Text>
              </TouchableOpacity>
            </View>
            
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              {selectedRaces.map((race) => (
                <View 
                  key={race.id} 
                  className="flex-row items-center py-3 border-b border-gray-100 last:border-0"
                >
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">{race.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <Users size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-sm ml-1">{race.club}</Text>
                      {race.date && (
                        <>
                          <Text className="text-gray-500 text-sm mx-2">•</Text>
                          <Clock size={14} color="#6B7280" />
                          <Text className="text-gray-500 text-sm ml-1">{formatDate(race.date)}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeRace(race.id)}>
                    <X size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Clubs and Their Races */}
        <Text className="text-lg font-bold text-gray-800 mb-3">
          Races from Your Clubs
        </Text>
        
        {mockClubs.map((club) => (
          <View key={club.id} className="mb-5">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Trophy size={20} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-bold">{club.name}</Text>
                <Text className="text-gray-500 text-sm">{club.races.length} races available</Text>
              </View>
            </View>
            
            <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {club.races.map((race) => (
                <TouchableOpacity
                  key={race.id}
                  className={`flex-row items-center p-4 border-b border-gray-100 last:border-0 ${isSelected(race.id) ? 'bg-blue-50' : ''}`}
                  onPress={() => toggleRaceSelection(race, club.name)}
                >
                  <View className="mr-3">
                    {isSelected(race.id) ? (
                      <Check size={24} color="#10B981" />
                    ) : (
                      <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
                    )}
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">{race.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <Calendar size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-sm ml-1">
                        {formatDate(race.date)}
                      </Text>
                      <Text className="text-gray-500 text-sm mx-2">•</Text>
                      {race.type === 'regatta' && <Trophy size={14} color="#6B7280" />}
                      {race.type === 'series' && <Anchor size={14} color="#6B7280" />}
                      {race.type === 'race' && <Clock size={14} color="#6B7280" />}
                      <Text className="text-gray-500 text-sm ml-1 capitalize">{race.type}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        <TouchableOpacity 
          className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center"
          onPress={() => {
            // In a real app, this would navigate to the next screen
            Alert.alert(
              'Races Selected', 
              `You've selected ${selectedRaces.length} races. Proceeding to review.`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Text className="text-white font-semibold text-lg">
            Continue to Review
          </Text>
          <ChevronRight size={20} color="white" className="ml-2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}