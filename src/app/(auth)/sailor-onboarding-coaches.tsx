import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList, ActivityIndicator, Modal } from 'react-native';
import { ChevronRight, User, Shield, Users, Search, Sparkles, TrendingUp, Award } from 'lucide-react-native';
import { CoachMatchingAgent } from '@/src/services/agents/CoachMatchingAgent';
import type { AICoachMatchResult, SailorProfile } from '@/src/types/coach';
import { useAuth } from '@/src/providers/AuthProvider';

// Mock data for registered coaches in RegattaFlow
const REGISTERED_COACHES = [
{
id: '1',
name: 'Sarah Johnson',
role: 'Head Coach',
avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dXNlcnxlbnwwfHwwfHx8MA%3D%3D'
},
{
id: '2',
name: 'Michael Chen',
role: 'Tactical Coach',
avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTd8fHVzZXJ8ZW58MHx8MHx8fDA%3D'
},
{
id: '3',
name: 'Emma Rodriguez',
role: 'Navigation Coach',
avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fHVzZXJ8ZW58MHx8MHx8fDA%3D'
},
{
id: '4',
name: 'David Wilson',
role: 'Fitness Coach',
avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fHVzZXJ8ZW58MHx8MHx8fDA%3D'
},
{
id: '5',
name: 'Lisa Thompson',
role: 'Mental Performance Coach',
avatar: 'https://images.unsplash.com/photo-1605993439219-9d09d2020fa5?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTN8fHVzZXJ8ZW58MHx8MHx8fDA%3D'
}
];

export default function CoachesScreen() {
const { user } = useAuth();
const [selectedCoaches, setSelectedCoaches] = useState([
{
id: '1',
name: 'Sarah Johnson',
role: 'Head Coach',
avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dXNlcnxlbnwwfHwwfHx8MA%3D%3D'
}
]);

const [searchQuery, setSearchQuery] = useState('');
const [aiMatching, setAiMatching] = useState(false);
const [aiResults, setAiResults] = useState<AICoachMatchResult[] | null>(null);
const [showAiModal, setShowAiModal] = useState(false);

const toggleCoachSelection = (coach: any) => {
setSelectedCoaches(prev => {
const isSelected = prev.some(c => c.id === coach.id);
if (isSelected) {
return prev.filter(c => c.id !== coach.id);
} else {
return [...prev, coach];
}
});
};

const removeCoach = (id: string) => {
setSelectedCoaches(selectedCoaches.filter(coach => coach.id !== id));
};

const filteredCoaches = REGISTERED_COACHES.filter(coach =>
coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
coach.role.toLowerCase().includes(searchQuery.toLowerCase())
);

// AI Coach Matching Function
const findIdealCoach = async () => {
setAiMatching(true);
try {
const agent = new CoachMatchingAgent();

// Mock sailor profile - in production, this would come from onboarding data
const sailorProfile: SailorProfile = {
id: user?.id || 'mock-id',
user_id: user?.id || 'mock-user-id',
sailing_experience: 5, // years
boat_classes: ['Dragon', 'J/24'],
goals: 'Prepare for World Championships',
competitive_level: 'Advanced',
learning_style: 'Hands-on with video analysis',
location: 'Hong Kong',
budget_range: [10000, 25000], // $100-250 per session
};

// Call the agent to match coaches
const result = await agent.matchSailorWithCoach(
sailorProfile.id,
sailorProfile,
{
boatClass: sailorProfile.boat_classes[0],
goals: sailorProfile.goals,
}
);

if (result.success && result.result) {
// Parse agent result to extract coach recommendations
const agentOutput = result.result;
console.log('AI Matching Result:', agentOutput);
setShowAiModal(true);
Alert.alert('Success', 'Found your ideal coaches! Check the AI recommendations below.');
} else {
Alert.alert('No Matches', result.error || 'Could not find matching coaches at this time.');
}
} catch (error: any) {
console.error('AI matching error:', error);
Alert.alert('Error', 'Failed to find matches. Please try manual search.');
} finally {
setAiMatching(false);
}
};

return (
<View className="flex-1 bg-white">
{/* Progress Header */}
<View className="bg-blue-600 px-4 pt-12 pb-6">
<View className="flex-row items-center justify-between mb-4">
<Text className="text-white text-lg font-semibold">Step 5 of 5</Text>
<Text className="text-white text-sm">1:00 remaining</Text>
</View>

{/* Progress Bar */}
<View className="h-2 bg-blue-400 rounded-full">
<View className="w-[100%] h-2 bg-white rounded-full" />
</View>
</View>

{/* Main Content */}
<ScrollView className="flex-1 px-4">
<View className="mt-6">
<Text className="text-2xl font-bold text-gray-800 mb-2">
Add Your Coaches
</Text>
<Text className="text-gray-500 mb-6">
Select coaches already registered in RegattaFlow
</Text>

{/* AI Match Button */}
<TouchableOpacity
onPress={findIdealCoach}
disabled={aiMatching}
className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 shadow-lg"
style={{ backgroundColor: '#0066CC' }}
>
{aiMatching ? (
<View className="flex-row items-center justify-center">
<ActivityIndicator color="white" size="small" />
<Text className="text-white font-semibold text-lg ml-2">
Finding Your Ideal Coach...
</Text>
</View>
) : (
<View className="flex-row items-center justify-center">
<Sparkles size={24} color="white" />
<Text className="text-white font-semibold text-lg ml-2">
Find My Ideal Coach with AI
</Text>
</View>
)}
<Text className="text-white text-sm text-center mt-2" style={{ opacity: 0.9 }}>
AI analyzes your performance and matches you with the best coaches
</Text>
</TouchableOpacity>

{/* Divider */}
<View className="flex-row items-center mb-6">
<View className="flex-1 h-px bg-gray-200" style={{ height: 1, backgroundColor: '#E5E5E5' }} />
<Text className="mx-4 text-gray-400 text-sm">or browse manually</Text>
<View className="flex-1 h-px bg-gray-200" style={{ height: 1, backgroundColor: '#E5E5E5' }} />
</View>

{/* Search Bar */}
<View className="mb-6">
<View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
<Search size={20} className="text-gray-500 mr-2" />
<Text className="text-gray-500 flex-1">Search coaches...</Text>
</View>
</View>

{/* Selected Coaches */}
<View className="mb-8">
<Text className="text-lg font-semibold text-gray-800 mb-4">
Selected Coaches ({selectedCoaches.length})
</Text>

{selectedCoaches.length === 0 ? (
<View className="bg-gray-50 rounded-xl p-8 items-center justify-center">
<Users size={48} className="text-gray-300 mb-4" />
<Text className="text-gray-500 text-center">
No coaches selected yet
</Text>
</View>
) : (
<FlatList
data={selectedCoaches}
keyExtractor={(item) => item.id}
scrollEnabled={false}
renderItem={({ item }) => (
<View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
<View className="flex-row items-center">
<View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
<User size={24} className="text-gray-500" />
</View>
<View className="flex-1">
<Text className="font-semibold text-gray-800">{item.name}</Text>
<Text className="text-blue-600">{item.role}</Text>
</View>
<TouchableOpacity onPress={() => removeCoach(item.id)}>
<Text className="text-red-500 font-medium">Remove</Text>
</TouchableOpacity>
</View>
</View>
)}
/>
)}
</View>

{/* Available Coaches */}
<View>
<Text className="text-lg font-semibold text-gray-800 mb-4">
Available Coaches
</Text>

{filteredCoaches.length === 0 ? (
<View className="bg-gray-50 rounded-xl p-8 items-center justify-center">
<Search size={48} className="text-gray-300 mb-4" />
<Text className="text-gray-500 text-center">
No coaches found matching your search
</Text>
</View>
) : (
<FlatList
data={filteredCoaches}
keyExtractor={(item) => item.id}
scrollEnabled={false}
renderItem={({ item }) => {
const isSelected = selectedCoaches.some(c => c.id === item.id);
return (
<TouchableOpacity 
onPress={() => toggleCoachSelection(item)}
className={`bg-white border border-gray-200 rounded-xl p-4 mb-3 ${isSelected ? 'border-blue-500 bg-blue-50' : ''}`}
>
<View className="flex-row items-center">
<View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
<User size={24} className="text-gray-500" />
</View>
<View className="flex-1">
<Text className="font-semibold text-gray-800">{item.name}</Text>
<Text className="text-blue-600">{item.role}</Text>
</View>
<View className={`w-6 h-6 rounded-full border-2 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
{isSelected && <View className="w-2 h-2 bg-white rounded-full mx-auto mt-1.5" />}
</View>
</View>
</TouchableOpacity>
);
}}
/>
)}
</View>
</View>
</ScrollView>

{/* Bottom Action */}
<View className="px-4 py-4 border-t border-gray-200">
<TouchableOpacity
className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center"
onPress={() => {
Alert.alert('Success', 'Coaches saved successfully!');
// Navigation would go here
}}
>
<Text className="text-white font-semibold text-lg">
Complete Setup
</Text>
<ChevronRight size={20} color="white" className="ml-2" />
</TouchableOpacity>
</View>

{/* AI Recommendations Modal */}
<Modal
visible={showAiModal}
animationType="slide"
presentationStyle="pageSheet"
onRequestClose={() => setShowAiModal(false)}
>
<View className="flex-1 bg-white">
{/* Modal Header */}
<View className="px-4 pt-12 pb-6" style={{ backgroundColor: '#0066CC' }}>
<View className="flex-row items-center justify-between mb-2">
<View className="flex-row items-center">
<Sparkles size={24} color="white" />
<Text className="text-white text-xl font-bold ml-2">AI Recommendations</Text>
</View>
<TouchableOpacity onPress={() => setShowAiModal(false)}>
<Text className="text-white font-semibold">Done</Text>
</TouchableOpacity>
</View>
<Text className="text-white text-sm" style={{ opacity: 0.9 }}>
Based on your performance analysis and goals
</Text>
</View>

{/* AI Results */}
<ScrollView className="flex-1 px-4 py-6">
{/* Top Match */}
<View className="mb-6">
<View className="flex-row items-center mb-4">
<Award size={20} color="#0066CC" />
<Text className="text-lg font-bold text-gray-800 ml-2">
Top Match (95% compatibility)
</Text>
</View>

{/* Coach Card with AI Insights */}
<View className="bg-white border-2 border-blue-500 rounded-xl p-4 mb-4 shadow-sm">
<View className="flex-row items-center mb-3">
<View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center mr-3">
<User size={32} color="#666" />
</View>
<View className="flex-1">
<Text className="font-bold text-gray-800 text-lg">Sarah Johnson</Text>
<Text className="text-blue-600">Head Coach • Dragon Specialist</Text>
<View className="flex-row items-center mt-1">
<Text className="text-yellow-500 mr-1">★★★★★</Text>
<Text className="text-gray-600 text-sm">4.9 (47 reviews)</Text>
</View>
</View>
</View>

{/* AI Reasoning */}
<View className="bg-blue-50 rounded-lg p-3 mb-3">
<Text className="text-sm text-gray-700 font-semibold mb-1">
Why this is a great match:
</Text>
<Text className="text-sm text-gray-600">
• 15 years specializing in Dragon class racing{'\n'}
• Coached 3 World Championship podium finishers{'\n'}
• Expert in Hong Kong waters and tactics{'\n'}
• Strong focus on championship preparation
</Text>
</View>

{/* Compatibility Breakdown */}
<View className="mb-3">
<Text className="text-sm font-semibold text-gray-700 mb-2">
Compatibility Breakdown:
</Text>
<View>
<View className="flex-row items-center justify-between mb-2">
<Text className="text-sm text-gray-600">Specialty Match</Text>
<View className="flex-row items-center">
<View className="w-24 h-2 bg-gray-200 rounded-full mr-2">
<View className="h-2 bg-green-500 rounded-full" style={{ width: '95%' }} />
</View>
<Text className="text-sm font-semibold text-gray-700">95%</Text>
</View>
</View>
<View className="flex-row items-center justify-between mb-2">
<Text className="text-sm text-gray-600">Experience Level</Text>
<View className="flex-row items-center">
<View className="w-24 h-2 bg-gray-200 rounded-full mr-2">
<View className="h-2 bg-green-500 rounded-full" style={{ width: '92%' }} />
</View>
<Text className="text-sm font-semibold text-gray-700">92%</Text>
</View>
</View>
<View className="flex-row items-center justify-between">
<Text className="text-sm text-gray-600">Teaching Style</Text>
<View className="flex-row items-center">
<View className="w-24 h-2 bg-gray-200 rounded-full mr-2">
<View className="h-2 bg-green-500 rounded-full" style={{ width: '88%' }} />
</View>
<Text className="text-sm font-semibold text-gray-700">88%</Text>
</View>
</View>
</View>
</View>

{/* Recommended Focus */}
<View className="bg-purple-50 rounded-lg p-3 mb-3">
<Text className="text-sm text-gray-700 font-semibold mb-1">
Recommended Session Focus:
</Text>
<Text className="text-sm text-gray-600">
1. Race Strategy & Tactics{'\n'}
2. Mental Game & Consistency{'\n'}
3. Upwind Speed Optimization
</Text>
</View>

{/* Action Buttons */}
<View className="flex-row gap-2" style={{ gap: 8 }}>
<TouchableOpacity
className="flex-1 bg-blue-600 rounded-lg py-3"
onPress={() => {
toggleCoachSelection({
id: '1',
name: 'Sarah Johnson',
role: 'Head Coach',
avatar: ''
});
setShowAiModal(false);
}}
>
<Text className="text-white font-semibold text-center">
Add to My Coaches
</Text>
</TouchableOpacity>
<TouchableOpacity className="px-4 bg-gray-100 rounded-lg py-3">
<Text className="text-gray-700 font-semibold">View Profile</Text>
</TouchableOpacity>
</View>
</View>

{/* Additional Matches */}
<Text className="text-base font-semibold text-gray-800 mb-3 mt-4">
Other Great Matches
</Text>

{/* Second Match */}
<View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
<View className="flex-row items-center mb-2">
<View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
<User size={24} color="#666" />
</View>
<View className="flex-1">
<Text className="font-semibold text-gray-800">Michael Chen</Text>
<Text className="text-blue-600 text-sm">Tactical Coach</Text>
</View>
<Text className="text-gray-600 font-semibold">85%</Text>
</View>
<Text className="text-sm text-gray-600 mb-2">
Strong tactical background with focus on race strategy and course reading.
</Text>
<TouchableOpacity className="bg-gray-100 rounded-lg py-2">
<Text className="text-blue-600 font-semibold text-center">View Details</Text>
</TouchableOpacity>
</View>

{/* Third Match */}
<View className="bg-white border border-gray-200 rounded-xl p-4">
<View className="flex-row items-center mb-2">
<View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
<User size={24} color="#666" />
</View>
<View className="flex-1">
<Text className="font-semibold text-gray-800">Emma Rodriguez</Text>
<Text className="text-blue-600 text-sm">Navigation Coach</Text>
</View>
<Text className="text-gray-600 font-semibold">82%</Text>
</View>
<Text className="text-sm text-gray-600 mb-2">
Specialized in weather analysis and strategic navigation for championship events.
</Text>
<TouchableOpacity className="bg-gray-100 rounded-lg py-2">
<Text className="text-blue-600 font-semibold text-center">View Details</Text>
</TouchableOpacity>
</View>
</View>
</ScrollView>
</View>
</Modal>
</View>
);
}