import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { 
  Clock, 
  Navigation, 
  Wind, 
  User, 
  CheckCircle2,
  AlertTriangle,
  Flag,
  MapPin,
  Trophy,
  Anchor
} from 'lucide-react-native';

export default function RaceInProgressScreen() {
  const [elapsedTime, setElapsedTime] = useState(2601); // 43 minutes 21 seconds
  const [finishers, setFinishers] = useState(0);
  const [incidents, setIncidents] = useState([
    { id: 1, time: "00:12:45", description: "Boat #555 touched Mark 1 (protest potential)" }
  ]);
  const [windDirection, setWindDirection] = useState(45);
  const [currentDirection, setCurrentDirection] = useState(225);

  // Simulate elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time for display (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format time for display (MM:SS)
  const formatTimeMMSS = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add a new incident
  const addIncident = () => {
    const newIncident = {
      id: incidents.length + 1,
      time: formatTime(elapsedTime),
      description: "Boat #321 overstood start line"
    };
    setIncidents(prev => [...prev, newIncident]);
  };

  // Leader data
  const leaders = [
    { position: 1, boat: "#892", name: "David Lee", status: "near Mark 1", lengths: "0" },
    { position: 2, boat: "#1104", name: "Emma Wilson", status: "2 lengths back", lengths: "2" },
    { position: 3, boat: "#1247", name: "Bram Van Olsen", status: "5 lengths", lengths: "5" }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* HEADER */}
      <View className="bg-blue-600 py-4 px-4">
        <Text className="text-white text-2xl font-bold">RACE IN PROGRESS</Text>
        <Text className="text-blue-100 text-lg mt-1">Dragon Class • Race 1</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* RACE TIMER */}
        <View className="bg-white rounded-xl shadow p-4 mb-4">
          <View className="items-center py-2">
            <Text className="text-5xl font-bold text-blue-900">
              {formatTime(elapsedTime)}
            </Text>
            <Text className="text-lg text-gray-600 mt-1">
              Beat to Mark 1 (Lap 2)
            </Text>
          </View>
        </View>

        {/* LIVE MAP */}
        <View className="bg-white rounded-xl shadow p-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-800">Live Course Map</Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-1"></View>
              <Text className="text-xs text-gray-600">15 boats on course</Text>
            </View>
          </View>
          
          <View className="bg-blue-50 rounded-lg h-64 justify-center items-center relative">
            {/* Simplified map representation */}
            <View className="absolute top-4 left-4 w-8 h-8 bg-red-500 rounded-full items-center justify-center">
              <MapPin color="white" size={16} />
            </View>
            
            <View className="absolute top-16 right-8 w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">1</Text>
            </View>
            
            <View className="absolute bottom-20 left-10 w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">2</Text>
            </View>
            
            <View className="absolute bottom-8 right-16 w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">3</Text>
            </View>
            
            <View className="absolute top-1/2 left-1/2 w-10 h-10 bg-green-500 rounded-full items-center justify-center">
              <Flag color="white" size={20} />
            </View>
            
            {/* Additional boats */}
            <View className="absolute top-24 left-20 w-4 h-4 bg-gray-400 rounded-full"></View>
            <View className="absolute top-32 right-20 w-4 h-4 bg-gray-400 rounded-full"></View>
            <View className="absolute bottom-32 left-16 w-4 h-4 bg-gray-400 rounded-full"></View>
            <View className="absolute bottom-24 right-10 w-4 h-4 bg-gray-400 rounded-full"></View>
            <View className="absolute top-10 right-32 w-4 h-4 bg-gray-400 rounded-full"></View>
            <View className="absolute bottom-10 left-32 w-4 h-4 bg-gray-400 rounded-full"></View>
            <View className="absolute top-1/3 left-1/3 w-4 h-4 bg-gray-400 rounded-full"></View>
            <View className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-gray-400 rounded-full"></View>
            <View className="absolute top-2/3 left-1/4 w-4 h-4 bg-gray-400 rounded-full"></View>
            <View className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-gray-400 rounded-full"></View>
            <View className="absolute top-1/4 left-3/4 w-4 h-4 bg-gray-400 rounded-full"></View>
            <View className="absolute bottom-3/4 right-3/4 w-4 h-4 bg-gray-400 rounded-full"></View>
          </View>
          
          <View className="mt-3">
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-green-500 rounded-full mr-2"></View>
              <Text className="text-xs text-gray-600">All boats accounted for</Text>
            </View>
          </View>
        </View>

        {/* ESTIMATED LEADERS */}
        <View className="bg-white rounded-xl shadow p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Current Leaders</Text>
          <View className="space-y-3">
            {leaders.map((leader) => (
              <View key={leader.position} className="flex-row items-center">
                <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${leader.position === 1 ? 'bg-yellow-400' : leader.position === 2 ? 'bg-gray-300' : 'bg-amber-800'}`}>
                  <Text className={`font-bold ${leader.position === 1 ? 'text-yellow-900' : 'text-gray-700'}`}>
                    {leader.position}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="font-bold mr-2">{leader.boat}</Text>
                    <Text className="text-gray-600">{leader.name}</Text>
                  </View>
                  <Text className="text-xs text-gray-500">{leader.status}</Text>
                </View>
                {leader.position === 1 ? (
                  <Trophy color="#f59e0b" size={20} />
                ) : (
                  <Text className="text-gray-500 text-sm">{leader.lengths} lengths</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* FINISHERS COUNTER */}
        <View className="bg-white rounded-xl shadow p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">Finishers</Text>
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-blue-900 mr-2">
              {finishers} of 15
            </Text>
            <View className="flex-1 h-3 bg-gray-200 rounded-full ml-2">
              <View 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${(finishers / 15) * 100}%` }}
              ></View>
            </View>
          </View>
        </View>

        {/* INCIDENTS LOG */}
        <View className="bg-white rounded-xl shadow p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Incidents Log</Text>
          {incidents.length > 0 ? (
            <View className="space-y-2">
              {incidents.map((incident) => (
                <View key={incident.id} className="flex-row items-start p-2 bg-red-50 rounded-lg">
                  <AlertTriangle color="#ef4444" size={16} className="mt-1 mr-2" />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-800">
                      {incident.time} - {incident.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-gray-500 italic">No other incidents logged</Text>
          )}
        </View>

        {/* CONDITIONS */}
        <View className="bg-white rounded-xl shadow p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Conditions</Text>
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Wind color="#6B7280" size={20} className="mr-2" />
                <Text className="text-gray-600">Wind:</Text>
              </View>
              <Text className="font-semibold">12 knots NE</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Navigation color="#6B7280" size={20} className="mr-2" />
                <Text className="text-gray-600">Current:</Text>
              </View>
              <Text className="font-semibold">0.8 knots SW</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ACTION BUTTONS */}
      <View className="px-4 pb-6">
        <View className="flex-row gap-3 mb-3">
          <TouchableOpacity 
            className="flex-1 bg-green-600 rounded-xl py-3 items-center justify-center shadow"
            onPress={() => setFinishers(prev => Math.min(prev + 1, 15))}
          >
            <Text className="text-white font-bold">Record Finish</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 bg-yellow-500 rounded-xl py-3 items-center justify-center shadow"
            onPress={addIncident}
          >
            <Text className="text-gray-900 font-bold">Log Incident</Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row gap-3">
          <TouchableOpacity className="flex-1 bg-orange-500 rounded-xl py-3 items-center justify-center shadow">
            <Text className="text-white font-bold">Shorten Course</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-1 bg-red-600 rounded-xl py-3 items-center justify-center shadow">
            <Text className="text-white font-bold">Abandon Race</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}