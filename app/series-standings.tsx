import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';

export default function SeriesStandings() {
  const [activeTab, setActiveTab] = useState('overall');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpansion = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  // Mock data for standings
  const standings = [
    {
      place: 1,
      sailNumber: 'USA 1234',
      helmsman: 'James Wilson',
      total: 12,
      drop: 3,
      races: [
        { race: 1, place: 1, points: 1 },
        { race: 2, place: 2, points: 2 },
        { race: 3, place: 3, points: 3 },
        { race: 4, place: 6, points: 6 },
      ],
    },
    {
      place: 2,
      sailNumber: 'CAN 5678',
      helmsman: 'Sarah Johnson',
      total: 15,
      drop: 4,
      races: [
        { race: 1, place: 3, points: 3 },
        { race: 2, place: 1, points: 1 },
        { race: 3, place: 5, points: 5 },
        { race: 4, place: 6, points: 6 },
      ],
    },
    {
      place: 3,
      sailNumber: 'GBR 9012',
      helmsman: 'Michael Brown',
      total: 18,
      drop: 5,
      races: [
        { race: 1, place: 2, points: 2 },
        { race: 2, place: 4, points: 4 },
        { race: 3, place: 6, points: 6 },
        { race: 4, place: 6, points: 6 },
      ],
    },
    {
      place: 4,
      sailNumber: 'AUS 3456',
      helmsman: 'Emma Davis',
      total: 22,
      drop: 0,
      races: [
        { race: 1, place: 5, points: 5 },
        { race: 2, place: 3, points: 3 },
        { race: 3, place: 7, points: 7 },
        { race: 4, place: 7, points: 7 },
      ],
    },
    {
      place: 5,
      sailNumber: 'NZL 7890',
      helmsman: 'David Miller',
      total: 25,
      drop: 0,
      races: [
        { race: 1, place: 6, points: 6 },
        { race: 2, place: 5, points: 5 },
        { race: 3, place: 8, points: 8 },
        { race: 4, place: 6, points: 6 },
      ],
    },
    {
      place: 6,
      sailNumber: 'FRA 2468',
      helmsman: 'Sophie Laurent',
      total: 30,
      drop: 0,
      races: [
        { race: 1, place: 7, points: 7 },
        { race: 2, place: 6, points: 6 },
        { race: 3, place: 9, points: 9 },
        { race: 4, place: 8, points: 8 },
      ],
    },
    {
      place: 7,
      sailNumber: 'GER 1357',
      helmsman: 'Hans Mueller',
      total: 35,
      drop: 0,
      races: [
        { race: 1, place: 8, points: 8 },
        { race: 2, place: 7, points: 7 },
        { race: 3, place: 10, points: 10 },
        { race: 4, place: 10, points: 10 },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 p-4">
        <Text className="text-white text-xl font-bold mb-1">SERIES STANDINGS</Text>
        <Text className="text-blue-100 text-base">Spring Series 2025 • Dragon Class</Text>
      </View>

      {/* Series Info */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Races completed:</Text>
          <Text className="font-medium">2 of 8</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Scoring system:</Text>
          <Text className="font-medium">Low Point (1 drop after R4)</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-600">Minimum races to qualify:</Text>
          <Text className="font-medium">2</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity 
          className={`flex-1 py-3 items-center ${activeTab === 'overall' ? 'border-b-2 border-blue-600' : ''}`}
          onPress={() => setActiveTab('overall')}
        >
          <Text className={`font-medium ${activeTab === 'overall' ? 'text-blue-600' : 'text-gray-600'}`}>
            Overall Standings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 items-center ${activeTab === 'races' ? 'border-b-2 border-blue-600' : ''}`}
          onPress={() => setActiveTab('races')}
        >
          <Text className={`font-medium ${activeTab === 'races' ? 'text-blue-600' : 'text-gray-600'}`}>
            View Each Race
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 items-center ${activeTab === 'compare' ? 'border-b-2 border-blue-600' : ''}`}
          onPress={() => setActiveTab('compare')}
        >
          <Text className={`font-medium ${activeTab === 'compare' ? 'text-blue-600' : 'text-gray-600'}`}>
            Compare Races
          </Text>
        </TouchableOpacity>
      </View>

      {/* Standings Table */}
      <ScrollView className="flex-1">
        <View className="m-4 bg-white rounded-lg shadow">
          {/* Table Header */}
          <View className="flex-row bg-gray-100 p-3 rounded-t-lg">
            <Text className="flex-1 font-bold text-gray-700">Place</Text>
            <Text className="flex-1 font-bold text-gray-700">Sail #</Text>
            <Text className="flex-2 font-bold text-gray-700">Helmsman</Text>
            <Text className="flex-1 font-bold text-gray-700 text-right">Total</Text>
          </View>

          {/* Table Rows */}
          {standings.map((entry, index) => (
            <View key={index}>
              <TouchableOpacity 
                className={`flex-row p-3 items-center border-b border-gray-100 ${index < 3 ? 'bg-blue-50' : ''}`}
                onPress={() => toggleRowExpansion(index)}
              >
                <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : index === 2 ? 'bg-amber-700' : 'bg-gray-100'}`}>
                  <Text className={`font-bold ${index < 3 ? 'text-white' : 'text-gray-700'}`}>{entry.place}</Text>
                </View>
                <Text className="flex-1 font-medium">{entry.sailNumber}</Text>
                <Text className="flex-2">{entry.helmsman}</Text>
                <Text className="flex-1 text-right font-medium">
                  {entry.total} 
                  {entry.drop > 0 && <Text className="text-gray-500 text-sm"> ({entry.drop})</Text>}
                </Text>
                <View className="ml-2">
                  {expandedRows.has(index) ? 
                    <ChevronDown size={20} color="#6B7280" /> : 
                    <ChevronRight size={20} color="#6B7280" />
                  }
                </View>
              </TouchableOpacity>

              {/* Expanded Race Details */}
              {expandedRows.has(index) && (
                <View className="bg-gray-50 p-3 border-b border-gray-100">
                  <View className="flex-row flex-wrap">
                    {entry.races.map((race, raceIndex) => (
                      <View key={raceIndex} className="w-1/2 flex-row mb-1">
                        <Text className="text-gray-600 mr-1">R{race.race}:</Text>
                        <Text className="font-medium">{race.place}</Text>
                        <Text className="text-gray-500 text-sm ml-1">({race.points} pts)</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Export Options */}
      <View className="bg-white p-4 border-t border-gray-200">
        <Text className="font-bold text-gray-800 mb-2">Export Options</Text>
        <View className="flex-row flex-wrap gap-2">
          <TouchableOpacity className="bg-blue-100 px-3 py-2 rounded-full">
            <Text className="text-blue-700 text-sm font-medium">Export Standings</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-blue-100 px-3 py-2 rounded-full">
            <Text className="text-blue-700 text-sm font-medium">Publish to Website</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-blue-100 px-3 py-2 rounded-full">
            <Text className="text-blue-700 text-sm font-medium">Email to Fleet</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-blue-100 px-3 py-2 rounded-full">
            <Text className="text-blue-700 text-sm font-medium">Print</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}