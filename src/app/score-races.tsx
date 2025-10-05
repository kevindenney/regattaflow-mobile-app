import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { 
  Trophy, 
  AlertTriangle, 
  Check, 
  X, 
  Edit3, 
  Save, 
  FileText,
  Flag
} from 'lucide-react-native';

export default function ScoreRaceScreen() {
  const [results, setResults] = useState([
    { id: 1, place: '1', sailNumber: '123', helmsman: 'Alex Morgan', points: '1', highlight: 'gold' },
    { id: 2, place: '2', sailNumber: '456', helmsman: 'Jamie Smith', points: '2', highlight: 'silver' },
    { id: 3, place: '3', sailNumber: '789', helmsman: 'Taylor Johnson', points: '3', highlight: 'bronze' },
    { id: 4, place: '4', sailNumber: '101', helmsman: 'Jordan Lee', points: '4', highlight: '' },
    { id: 5, place: '5', sailNumber: '202', helmsman: 'Casey Brown', points: '5', highlight: '' },
    { id: 6, place: '6', sailNumber: '303', helmsman: 'Morgan Davis', points: '6', highlight: '' },
    { id: 7, place: '7', sailNumber: '404', helmsman: 'Riley Wilson', points: '7', highlight: '' },
    { id: 8, place: '8', sailNumber: '505', helmsman: 'Quinn Miller', points: '8', highlight: '' },
    { id: 9, place: '9', sailNumber: '606', helmsman: 'Avery Taylor', points: '9', highlight: '' },
    { id: 10, place: '10', sailNumber: '707', helmsman: 'Peyton Anderson', points: '10', highlight: '' },
    { id: 11, place: '11', sailNumber: '808', helmsman: 'Drew Thomas', points: '11', highlight: '' },
    { id: 12, place: 'DNF', sailNumber: '909', helmsman: 'Skyler Clark', points: '20', highlight: 'dnf' },
  ]);

  const [penalties, setPenalties] = useState([
    { id: 'ocs', label: 'Apply 20% penalty to #___ (OCS)', checked: false, sailNumber: '' },
    { id: 'dsq', label: 'Apply DSQ to #___ (protest upheld)', checked: false, sailNumber: '' },
    { id: 'redress', label: 'Apply redress to #___ (give avg points)', checked: false, sailNumber: '' },
  ]);

  const [protests, setProtests] = useState([
    { id: 1, description: '#555 vs #892 - Resolved: No penalty', resolved: true },
    { id: 2, description: '#123 vs #456 - Under review', resolved: false },
  ]);

  const togglePenalty = (id: string) => {
    setPenalties(penalties.map(penalty => 
      penalty.id === id ? { ...penalty, checked: !penalty.checked } : penalty
    ));
  };

  const updateSailNumber = (id: string, value: string) => {
    setPenalties(penalties.map(penalty => 
      penalty.id === id ? { ...penalty, sailNumber: value } : penalty
    ));
  };

  const updateResult = (id: number, field: string, value: string) => {
    setResults(results.map(result => 
      result.id === id ? { ...result, [field]: value } : result
    ));
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 py-4 px-4">
        <Text className="text-white text-2xl font-bold">SCORE RACE</Text>
        <Text className="text-blue-100 text-lg mt-1">Spring Series R1 • Dragon Class</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Scoring System Info */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">Scoring System</Text>
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600">System:</Text>
            <Text className="font-medium">Low Point (RRS Appendix A)</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Ties:</Text>
            <Text className="font-medium">RRS A8 (last race tiebreaker)</Text>
          </View>
        </View>

        {/* Results Table */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-800">Results</Text>
            <TouchableOpacity className="flex-row items-center">
              <Edit3 color="#2563EB" size={18} />
              <Text className="text-blue-600 font-medium ml-1">Edit Results</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row bg-gray-100 py-2 px-3 rounded-t-lg">
            <Text className="flex-1 font-bold text-gray-700 text-center">Place</Text>
            <Text className="flex-1 font-bold text-gray-700 text-center">Sail #</Text>
            <Text className="flex-2 font-bold text-gray-700 text-center">Helmsman</Text>
            <Text className="flex-1 font-bold text-gray-700 text-center">Points</Text>
          </View>

          <ScrollView className="max-h-96">
            {results.map((result) => (
              <View 
                key={result.id} 
                className={`flex-row py-3 px-3 border-b border-gray-100 items-center ${
                  result.highlight === 'gold' ? 'bg-yellow-50' : 
                  result.highlight === 'silver' ? 'bg-gray-100' : 
                  result.highlight === 'bronze' ? 'bg-amber-50' : 
                  result.highlight === 'dnf' ? 'bg-red-50' : 'bg-white'
                }`}
              >
                <View className="flex-1">
                  <TextInput
                    className={`text-center font-medium ${
                      result.highlight === 'gold' ? 'text-yellow-700' : 
                      result.highlight === 'silver' ? 'text-gray-600' : 
                      result.highlight === 'bronze' ? 'text-amber-700' : 
                      result.highlight === 'dnf' ? 'text-red-600' : 'text-gray-800'
                    }`}
                    value={result.place}
                    onChangeText={(text) => updateResult(result.id, 'place', text)}
                    editable={true}
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    className="text-center text-gray-800"
                    value={result.sailNumber}
                    onChangeText={(text) => updateResult(result.id, 'sailNumber', text)}
                    editable={true}
                  />
                </View>
                <View className="flex-2">
                  <TextInput
                    className="text-center text-gray-800"
                    value={result.helmsman}
                    onChangeText={(text) => updateResult(result.id, 'helmsman', text)}
                    editable={true}
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    className="text-center text-gray-800"
                    value={result.points}
                    onChangeText={(text) => updateResult(result.id, 'points', text)}
                    editable={true}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Scoring Adjustments */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Scoring Adjustments</Text>
          
          {penalties.map((penalty) => (
            <View key={penalty.id} className="mb-3">
              <View className="flex-row items-center">
                <TouchableOpacity 
                  className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                    penalty.checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}
                  onPress={() => togglePenalty(penalty.id)}
                >
                  {penalty.checked && <Check color="white" size={16} />}
                </TouchableOpacity>
                <Text className="text-gray-700 flex-1">{penalty.label.split('#___')[0]}</Text>
                <TextInput
                  className="border border-gray-300 rounded-md px-2 py-1 w-16 text-center"
                  placeholder="___"
                  value={penalty.sailNumber}
                  onChangeText={(text) => updateSailNumber(penalty.id, text)}
                  editable={penalty.checked}
                />
                <Text className="text-gray-700 ml-1">{penalty.label.split('#___')[1]}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Protests & Requests */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Protests & Requests</Text>
          
          {protests.map((protest) => (
            <View key={protest.id} className="flex-row items-center mb-2">
              {protest.resolved ? (
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Check color="#10B981" size={16} />
                </View>
              ) : (
                <View className="w-6 h-6 rounded-full bg-yellow-100 items-center justify-center mr-3">
                  <AlertTriangle color="#F59E0B" size={16} />
                </View>
              )}
              <Text className="text-gray-700 flex-1">{protest.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-4 pb-6">
        <View className="flex-row gap-3 mb-3">
          <TouchableOpacity className="flex-1 bg-white border border-gray-300 rounded-xl py-3 items-center justify-center shadow">
            <Text className="text-gray-700 font-bold">Edit Results</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-1 bg-white border border-gray-300 rounded-xl py-3 items-center justify-center shadow">
            <Text className="text-gray-700 font-bold">Apply Penalties</Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row gap-3">
          <TouchableOpacity className="flex-1 bg-blue-600 rounded-xl py-3 items-center justify-center shadow">
            <Text className="text-white font-bold">Save & Publish</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-1 bg-gray-200 rounded-xl py-3 items-center justify-center shadow">
            <Text className="text-gray-700 font-bold">Save as Draft</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}