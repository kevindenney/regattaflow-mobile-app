import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import {
  Wind,
  Thermometer,
  Eye,
  Waves,
  Navigation,
  Clock,
  MapPin,
  Users,
  Calendar,
  ChevronRight,
  Play,
  Flag,
  Anchor,
  Zap,
  CloudRain,
  Sun,
  Moon
} from 'lucide-react-native';

const RaceStrategyScreen = () => {
  const [activeTab, setActiveTab] = useState('strategy');
  
  // Mock data for weather conditions
  const weatherData = {
    windSpeed: '12-15 knots',
    windDirection: 'NW',
    temperature: '22°C',
    visibility: '10 km',
    waveHeight: '1.2m',
    tide: 'High at 14:30'
  };

  // Mock data for crew assignments
  const crewAssignments = [
    { id: 1, name: 'Alex Morgan', role: 'Skipper', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dXNlcnxlbnwwfHwwfHx8MA%3D%3D' },
    { id: 2, name: 'Jamie Smith', role: 'Navigator', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fHVzZXJ8ZW58MHx8MHx8fDA%3D' },
    { id: 3, name: 'Taylor Johnson', role: 'Tactician', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fHVzZXJ8ZW58MHx8MHx8fDA%3D' },
    { id: 4, name: 'Jordan Lee', role: 'Trimmer', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fHVzZXJ8ZW58MHx8MHx8fDA%3D' }
  ];

  // Mock data for strategy points
  const strategyPoints = [
    { id: 1, title: 'Start Line Approach', description: 'Approach from the committee boat side with 2 boat lengths clearance', time: '08:45' },
    { id: 2, title: 'First Beat', description: 'Sail at 45° to windward mark, avoid other boats', time: '09:00' },
    { id: 3, title: 'Upwind Strategy', description: 'Tack on shifts, stay in pressure', time: '09:30' },
    { id: 4, title: 'Downwind', description: 'Bear away to gybe angles, maximize VMG', time: '10:15' },
    { id: 5, title: 'Final Approach', description: 'Set spinnaker early, avoid overstanding', time: '11:00' }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 p-4 pt-12 pb-6">
        <Text className="text-white text-2xl font-bold">Race Strategy</Text>
        <Text className="text-blue-100 mt-1">Plan and execute your race tactics</Text>
      </View>

      {/* Event Info Card */}
      <View className="bg-white m-4 rounded-xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row items-center mb-3">
          <View className="bg-blue-100 p-2 rounded-lg">
            <Calendar color="#2563EB" size={20} />
          </View>
          <Text className="text-gray-800 font-bold text-lg ml-3">Annual Regatta Challenge</Text>
        </View>
        
        <View className="flex-row items-center mb-2 ml-1">
          <MapPin color="#6B7280" size={18} />
          <Text className="text-gray-600 ml-2">Marina Bay Yacht Club</Text>
        </View>
        
        <View className="flex-row items-center ml-1">
          <Clock color="#6B7280" size={18} />
          <Text className="text-gray-600 ml-2">June 15, 2023 • 09:00 AM</Text>
        </View>
      </View>

      {/* Weather Summary */}
      <View className="mx-4 mb-4">
        <View className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-4 shadow-md">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-lg font-bold">Current Conditions</Text>
              <Text className="text-blue-100 mt-1">Updated 10 minutes ago</Text>
            </View>
            <Sun color="#FCD34D" size={32} />
          </View>
          
          <View className="flex-row mt-4 justify-between">
            <View className="flex-row items-center">
              <Wind color="white" size={20} />
              <Text className="text-white ml-2 font-medium">{weatherData.windSpeed}</Text>
              <Text className="text-blue-100 ml-1">NW</Text>
            </View>
            
            <View className="flex-row items-center">
              <Thermometer color="white" size={20} />
              <Text className="text-white ml-2 font-medium">{weatherData.temperature}</Text>
            </View>
            
            <View className="flex-row items-center">
              <Eye color="white" size={20} />
              <Text className="text-white ml-2 font-medium">{weatherData.visibility}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row bg-white mx-4 rounded-xl p-1 mb-4 shadow-sm">
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'strategy' ? 'bg-blue-100' : ''}`}
          onPress={() => setActiveTab('strategy')}
        >
          <Text className={`font-bold ${activeTab === 'strategy' ? 'text-blue-600' : 'text-gray-500'}`}>Strategy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'crew' ? 'bg-blue-100' : ''}`}
          onPress={() => setActiveTab('crew')}
        >
          <Text className={`font-bold ${activeTab === 'crew' ? 'text-blue-600' : 'text-gray-500'}`}>Crew</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'course' ? 'bg-blue-100' : ''}`}
          onPress={() => setActiveTab('course')}
        >
          <Text className={`font-bold ${activeTab === 'course' ? 'text-blue-600' : 'text-gray-500'}`}>Course</Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {activeTab === 'strategy' && (
          <View>
            {/* Strategy Overview */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Navigation color="#2563EB" size={20} />
                </View>
                <Text className="text-gray-800 font-bold text-lg ml-3">Tactical Plan</Text>
              </View>
              
              <Text className="text-gray-600 mb-4">
                Optimal strategy based on current conditions and previous race data. 
                Focus on clean starts and efficient mark roundings.
              </Text>
              
              <TouchableOpacity className="flex-row items-center bg-blue-50 p-3 rounded-lg">
                <Play color="#2563EB" size={20} />
                <Text className="text-blue-600 font-bold ml-2">View Tactical Video</Text>
              </TouchableOpacity>
            </View>
            
            {/* Strategy Points */}
            <View className="mb-4">
              <Text className="text-gray-800 text-lg font-bold mb-3">Execution Plan</Text>
              
              {strategyPoints.map((point, index) => (
                <View 
                  key={point.id} 
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                >
                  <View className="flex-row items-start">
                    <View className="bg-blue-100 w-8 h-8 rounded-full items-center justify-center mt-1">
                      <Text className="text-blue-600 font-bold">{index + 1}</Text>
                    </View>
                    
                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-gray-800 font-bold">{point.title}</Text>
                        <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-full">
                          <Clock color="#6B7280" size={14} />
                          <Text className="text-gray-600 text-xs ml-1">{point.time}</Text>
                        </View>
                      </View>
                      
                      <Text className="text-gray-600 mt-2">{point.description}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {activeTab === 'crew' && (
          <View>
            {/* Crew Assignments */}
            <View className="mb-4">
              <Text className="text-gray-800 text-lg font-bold mb-3">Crew Assignments</Text>
              
              {crewAssignments.map((member) => (
                <View 
                  key={member.id} 
                  className="bg-white rounded-xl p-4 mb-3 flex-row shadow-sm border border-gray-100"
                >
                  <Image 
                    source={{ uri: member.avatar }} 
                    className="w-14 h-14 rounded-full"
                  />
                  
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-800 font-bold text-base">{member.name}</Text>
                    <Text className="text-blue-600 font-medium">{member.role}</Text>
                    
                    <View className="flex-row mt-2">
                      <TouchableOpacity className="bg-green-100 px-3 py-1 rounded-full mr-2">
                        <Text className="text-green-700 text-xs font-bold">CONFIRMED</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity className="bg-blue-100 px-3 py-1 rounded-full">
                        <Text className="text-blue-700 text-xs font-bold">VIEW DUTIES</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <TouchableOpacity>
                    <ChevronRight color="#6B7280" size={20} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            {/* Communication Plan */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Users color="#2563EB" size={20} />
                </View>
                <Text className="text-gray-800 font-bold text-lg ml-3">Communication</Text>
              </View>
              
              <Text className="text-gray-600 mb-3">
                Establish clear communication protocols before race start:
              </Text>
              
              <View className="ml-2">
                <Text className="text-gray-700 mb-1">• Pre-race briefing at 08:00 AM</Text>
                <Text className="text-gray-700 mb-1">• Radio check on channel 16</Text>
                <Text className="text-gray-700">• Emergency signals: 3 short blasts</Text>
              </View>
            </View>
          </View>
        )}
        
        {activeTab === 'course' && (
          <View>
            {/* Course Overview */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Flag color="#2563EB" size={20} />
                </View>
                <Text className="text-gray-800 font-bold text-lg ml-3">Course Layout</Text>
              </View>
              
              <View className="items-center my-4">
                <View className="bg-gray-200 border-2 border-dashed rounded-xl w-64 h-48 items-center justify-center">
                  <Text className="text-gray-500">Course Diagram</Text>
                  <Text className="text-gray-400 text-sm mt-2">Triangle & Run Course</Text>
                </View>
              </View>
              
              <View className="flex-row justify-between mt-4">
                <View className="items-center">
                  <Anchor color="#2563EB" size={24} />
                  <Text className="text-gray-600 mt-1 text-center">Start Line</Text>
                </View>
                
                <View className="items-center">
                  <Flag color="#10B981" size={24} />
                  <Text className="text-gray-600 mt-1 text-center">Windward Mark</Text>
                </View>
                
                <View className="items-center">
                  <Zap color="#F59E0B" size={24} />
                  <Text className="text-gray-600 mt-1 text-center">Leeward Gate</Text>
                </View>
                
                <View className="items-center">
                  <Flag color="#EF4444" size={24} />
                  <Text className="text-gray-600 mt-1 text-center">Finish Line</Text>
                </View>
              </View>
            </View>
            
            {/* Mark Information */}
            <View className="mb-4">
              <Text className="text-gray-800 text-lg font-bold mb-3">Mark Details</Text>
              
              <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-800 font-bold">Windward Mark</Text>
                  <Text className="text-blue-600 font-bold">Port Rounding</Text>
                </View>
                <Text className="text-gray-600 mt-1">Orange flag with red top mark</Text>
              </View>
              
              <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-800 font-bold">Leeward Gate</Text>
                  <Text className="text-blue-600 font-bold">Either Mark</Text>
                </View>
                <Text className="text-gray-600 mt-1">Yellow flags, choose either side</Text>
              </View>
              
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-800 font-bold">Finish Line</Text>
                  <Text className="text-blue-600 font-bold">Cross Between Marks</Text>
                </View>
                <Text className="text-gray-600 mt-1">White and red pennants</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      <View className="p-4 bg-white border-t border-gray-100">
        <TouchableOpacity className="bg-blue-600 rounded-xl py-4 items-center shadow-md">
          <Text className="text-white font-bold text-lg">Finalize Strategy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RaceStrategyScreen;