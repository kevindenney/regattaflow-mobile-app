import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Check, Edit, Trash2, Clock, Flag } from 'lucide-react-native';
import { createLogger } from '@/lib/utils/logger';

type MethodType = 'manual' | 'finishlynx' | 'mobile';
type ScoringCode = 'DNS' | 'DNF' | 'DSQ' | 'OCS' | 'RAF' | null;

interface FinishRecord {
  id: string;
  position: number;
  sailNumber: string;
  helmsman: string;
  finishTime: string;
  scoringCode: ScoringCode;
}

const logger = createLogger('record-finishes');
const RecordFinishesScreen = () => {
  const [selectedMethod, setSelectedMethod] = useState<MethodType>('manual');
  const [sailNumber, setSailNumber] = useState('');
  const [finishTime, setFinishTime] = useState('');
  const [finishes, setFinishes] = useState<FinishRecord[]>([
    { id: '1', position: 1, sailNumber: '1234', helmsman: 'John Smith', finishTime: '01:23:45', scoringCode: null },
    { id: '2', position: 2, sailNumber: '5678', helmsman: 'Sarah Johnson', finishTime: '01:24:12', scoringCode: null },
    { id: '3', position: 3, sailNumber: '9012', helmsman: 'Mike Williams', finishTime: '01:25:03', scoringCode: null },
  ]);
  const [remainingBoats, setRemainingBoats] = useState(12);
  const [timeRemaining, setTimeRemaining] = useState('01:30:00');
  const [countdown, setCountdown] = useState('6:15');

  const methods = [
    { id: 'manual', name: 'Manual Entry', description: 'Sail # + Time' },
    { id: 'finishlynx', name: 'FinishLynx', description: 'Auto-detect' },
    { id: 'mobile', name: 'Mobile App', description: 'Finish judge input' },
  ];

  const scoringCodes: ScoringCode[] = ['DNS', 'DNF', 'DSQ', 'OCS', 'RAF'];

  const handleAddFinish = () => {
    if (sailNumber && finishTime) {
      const newFinish: FinishRecord = {
        id: `${finishes.length + 1}`,
        position: finishes.length + 1,
        sailNumber,
        helmsman: 'Helmsman Name', // In a real app, this would be looked up from a database
        finishTime,
        scoringCode: null,
      };
      
      setFinishes([...finishes, newFinish]);
      setSailNumber('');
      setFinishTime('');
      setRemainingBoats(prev => prev - 1);
    }
  };

  const handleEditFinish = (id: string) => {
    // In a real app, this would open an edit modal
    logger.debug('Edit finish with id:', id);
  };

  const handleRemoveFinish = (id: string) => {
    setFinishes(finishes.filter(finish => finish.id !== id));
    setRemainingBoats(prev => prev + 1);
  };

  const handleAssignScoringCode = (id: string, code: ScoringCode) => {
    setFinishes(finishes.map(finish => 
      finish.id === id ? { ...finish, scoringCode: code } : finish
    ));
  };

  const renderFinishItem = ({ item }: { item: FinishRecord }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <View className="bg-blue-100 w-8 h-8 rounded-full items-center justify-center mr-3">
            <Text className="text-blue-600 font-bold">{item.position}</Text>
          </View>
          <View>
            <Text className="font-bold text-gray-800">#{item.sailNumber}</Text>
            <Text className="text-gray-600 text-sm">{item.helmsman}</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          {item.scoringCode ? (
            <View className="bg-red-100 px-2 py-1 rounded mr-2">
              <Text className="text-red-600 font-medium">{item.scoringCode}</Text>
            </View>
          ) : (
            <View className="flex-row items-center mr-2">
              <Clock size={16} color="#6B7280" className="mr-1" />
              <Text className="text-gray-600">{item.finishTime}</Text>
            </View>
          )}
          <Check size={20} color="#10B981" />
        </View>
      </View>
      
      <View className="flex-row justify-between mt-2">
        <View className="flex-row">
          {scoringCodes.map(code => (
            <TouchableOpacity
              key={code}
              className="bg-gray-100 px-2 py-1 rounded mr-2"
              onPress={() => handleAssignScoringCode(item.id, code)}
            >
              <Text className="text-gray-700">{code}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View className="flex-row">
          <TouchableOpacity 
            className="mr-3"
            onPress={() => handleEditFinish(item.id)}
          >
            <Edit size={20} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleRemoveFinish(item.id)}
          >
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 p-4">
        <Text className="text-white text-2xl font-bold">Record Finishes</Text>
        <Text className="text-blue-100">Race Series #1 - Fleet A</Text>
      </View>
      
      {/* Method Selection */}
      <View className="p-4 bg-white m-4 rounded-xl shadow-sm">
        <Text className="font-bold text-gray-800 mb-3">Method Selection</Text>
        <View className="flex-row bg-gray-100 rounded-lg p-1">
          {methods.map((method) => (
            <TouchableOpacity
              key={method.id}
              className={`flex-1 py-3 px-2 rounded-md items-center ${
                selectedMethod === method.id ? 'bg-white shadow-sm' : ''
              }`}
              onPress={() => setSelectedMethod(method.id as MethodType)}
            >
              <Text className={`font-medium ${
                selectedMethod === method.id ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {method.name}
              </Text>
              <Text className={`text-xs ${
                selectedMethod === method.id ? 'text-blue-500' : 'text-gray-500'
              }`}>
                {method.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Finishes Recorded */}
      <View className="flex-1 px-4">
        <Text className="font-bold text-gray-800 mb-2">Finishes Recorded</Text>
        <FlatList
          data={finishes}
          renderItem={renderFinishItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          className="flex-1"
        />
      </View>
      
      {/* Next Boat Input */}
      <View className="p-4 bg-white m-4 rounded-xl shadow-sm">
        <Text className="font-bold text-gray-800 mb-3">Next Boat</Text>
        <View className="flex-row items-center mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-gray-600 text-sm mb-1">Sail Number</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-lg"
              placeholder="Enter sail number"
              value={sailNumber}
              onChangeText={setSailNumber}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1 ml-2">
            <Text className="text-gray-600 text-sm mb-1">Finish Time</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-lg"
              placeholder="HH:MM:SS"
              value={finishTime}
              onChangeText={setFinishTime}
              keyboardType="numeric"
            />
          </View>
        </View>
        <TouchableOpacity 
          className="bg-blue-600 rounded-lg py-3 items-center"
          onPress={handleAddFinish}
        >
          <Text className="text-white font-bold text-lg">Add Finish</Text>
        </TouchableOpacity>
      </View>
      
      {/* Pending Finishes & Time Limit */}
      <View className="px-4 mb-4">
        <View className="bg-white rounded-xl p-4 shadow-sm mb-3">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Pending Finishes</Text>
            <Text className="font-bold text-gray-800">{remainingBoats} boats</Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Time Limit</Text>
            <Text className="font-bold text-gray-800">{timeRemaining} ({countdown} remaining)</Text>
          </View>
          
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View 
              className="h-full bg-blue-500" 
              style={{ width: '75%' }} // This would be calculated based on time remaining in a real app
            />
          </View>
        </View>
        
        {/* Scoring Codes */}
        <View className="flex-row flex-wrap mb-4">
          <Text className="w-full text-gray-600 mb-2">Scoring Codes</Text>
          {scoringCodes.map(code => (
            <TouchableOpacity
              key={code}
              className="bg-gray-100 px-3 py-2 rounded-lg mr-2 mb-2"
            >
              <Text className="text-gray-700">{code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Bottom Actions */}
      <View className="flex-row p-4 bg-white border-t border-gray-200">
        <TouchableOpacity className="flex-1 bg-gray-200 rounded-lg py-3 items-center mr-2">
          <Text className="text-gray-800 font-bold">Save Finishes</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-green-500 rounded-lg py-3 items-center ml-2">
          <Text className="text-white font-bold">Provisional Results</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RecordFinishesScreen;