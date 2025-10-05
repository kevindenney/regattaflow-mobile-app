import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { 
AlertTriangle, 
Trophy, 
Calendar, 
Users, 
AlertCircle,
LayoutDashboard,
FileText,
BarChart3,
Settings,
Menu,
Home
} from 'lucide-react-native';

export default function ResultsScoring() {
const [activeTab, setActiveTab] = useState('results');
const [filter, setFilter] = useState('All');

// Mock data for pending scoring races
const pendingRaces = [
{
id: '1',
name: 'Saturday Morning Series',
date: '2023-06-17',
class: 'Laser Radial',
boatCount: 12,
status: 'Provisional - 1 protest',
hasProtest: true
},
{
id: '2',
name: 'Youth Championship Qualifier',
date: '2023-06-16',
class: 'Optimist',
boatCount: 18,
status: 'Ready to score',
hasProtest: false
}
];

// Mock data for series standings
const seriesStandings = [
{
id: '1',
name: 'Summer Championship Series',
racesCompleted: 2,
totalRaces: 8,
leader: 'Sarah Johnson',
points: 18,
lastUpdated: '2023-06-15'
},
{
id: '2',
name: 'Wednesday Night Racing',
racesCompleted: 5,
totalRaces: 10,
leader: 'Michael Chen',
points: 42,
lastUpdated: '2023-06-14'
}
];

const filterOptions = ['All', 'Pending', 'Published', 'Series'];

return (
<View className="flex-1 bg-gray-50">
{/* Header */}
<View className="bg-blue-900 py-4 px-6 flex-row items-center justify-between">
<Text className="text-white text-xl font-bold">Royal Yacht Club</Text>
<View className="flex-row items-center">
<TouchableOpacity className="mr-4">
<Text className="text-white">🔔</Text>
</TouchableOpacity>
<TouchableOpacity className="flex-row items-center">
<View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center mr-2">
<Text className="text-white text-xs">A</Text>
</View>
<Text className="text-white">Admin</Text>
</TouchableOpacity>
</View>
</View>

{/* Main Content */}
<View className="flex-1 flex-row">
{/* Desktop Sidebar Navigation - Hidden on mobile */}
<View className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
<View className="p-4 border-b border-gray-200">
<Text className="text-lg font-bold text-blue-900">Race Office</Text>
</View>

<ScrollView className="flex-1">
<TouchableOpacity 
className={`flex-row items-center px-6 py-4 ${activeTab === 'dashboard' ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
onPress={() => setActiveTab('dashboard')}
>
<Home color={activeTab === 'dashboard' ? '#3b82f6' : '#6b7280'} size={20} />
<Text className={`ml-3 font-medium ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-700'}`}>Dashboard</Text>
</TouchableOpacity>

<TouchableOpacity 
className={`flex-row items-center px-6 py-4 ${activeTab === 'entries' ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
onPress={() => setActiveTab('entries')}
>
<FileText color={activeTab === 'entries' ? '#3b82f6' : '#6b7280'} size={20} />
<Text className={`ml-3 font-medium ${activeTab === 'entries' ? 'text-blue-600' : 'text-gray-700'}`}>Entries</Text>
</TouchableOpacity>

<TouchableOpacity 
className={`flex-row items-center px-6 py-4 ${activeTab === 'races' ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
onPress={() => setActiveTab('races')}
>
<Trophy color={activeTab === 'races' ? '#3b82f6' : '#6b7280'} size={20} />
<Text className={`ml-3 font-medium ${activeTab === 'races' ? 'text-blue-600' : 'text-gray-700'}`}>Races</Text>
</TouchableOpacity>

<TouchableOpacity 
className={`flex-row items-center px-6 py-4 ${activeTab === 'results' ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
onPress={() => setActiveTab('results')}
>
<BarChart3 color={activeTab === 'results' ? '#3b82f6' : '#6b7280'} size={20} />
<Text className={`ml-3 font-medium ${activeTab === 'results' ? 'text-blue-600' : 'text-gray-700'}`}>Results</Text>
</TouchableOpacity>

<View className="mt-auto">
<TouchableOpacity 
className={`flex-row items-center px-6 py-4 ${activeTab === 'settings' ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
onPress={() => setActiveTab('settings')}
>
<Settings color={activeTab === 'settings' ? '#3b82f6' : '#6b7280'} size={20} />
<Text className={`ml-3 font-medium ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-700'}`}>Settings</Text>
</TouchableOpacity>
</View>
</ScrollView>
</View>

{/* Main Content Area */}
<View className="flex-1">
{/* Mobile/Tablet Top Navigation Bar */}
<View className="md:hidden bg-white border-b border-gray-200 flex-row justify-between items-center px-4 py-3">
<Text className="text-lg font-bold text-blue-900">Race Office</Text>
<TouchableOpacity>
<Menu color="#1e3a8a" size={24} />
</TouchableOpacity>
</View>

{/* Results & Scoring Content */}
<View className="flex-1">
<View className="bg-white p-4 shadow-sm">
<View className="flex-row justify-between items-center mb-4">
<Text className="text-2xl font-bold text-gray-900">Results & Scoring</Text>
<TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg">
<Text className="text-white font-medium">+ Score New Race</Text>
</TouchableOpacity>
</View>

{/* Filter Tabs */}
<View className="flex-row bg-gray-100 rounded-lg p-1">
{filterOptions.map((option) => (
<TouchableOpacity
key={option}
className={`flex-1 py-2 rounded-md items-center ${
filter === option ? 'bg-white shadow-sm' : ''
}`}
onPress={() => setFilter(option)}
>
<Text
className={`font-medium ${
filter === option ? 'text-blue-600' : 'text-gray-600'
}`}
>
{option}
</Text>
</TouchableOpacity>
))}
</View>
</View>

{/* Content */}
<ScrollView className="flex-1 px-4 py-4">
{/* Pending Scoring Section */}
<View className="mb-8">
<View className="flex-row justify-between items-center mb-3">
<Text className="text-lg font-bold text-gray-900">PENDING SCORING (2)</Text>
</View>

{pendingRaces.map((race) => (
<View 
key={race.id} 
className="bg-white rounded-xl shadow-sm mb-4 border border-gray-200"
>
<View className="p-4">
<View className="flex-row justify-between items-start mb-2">
<View className="flex-1">
<View className="flex-row items-center mb-1">
<Text className="text-lg font-bold text-gray-900 mr-2">
{race.name}
</Text>
{race.hasProtest && (
<AlertTriangle color="#F59E0B" size={18} />
)}
</View>
<View className="flex-row items-center">
<Calendar color="#6B7280" size={14} />
<Text className="text-gray-600 ml-1">{race.date}</Text>
</View>
</View>
</View>

<View className="flex-row justify-between items-center mt-3">
<View className="flex-row items-center">
<Users color="#6B7280" size={14} />
<Text className="text-gray-600 ml-1">
{race.class} • {race.boatCount} boats
</Text>
</View>
<View className="flex-row items-center">
{race.hasProtest ? (
<View className="flex-row items-center bg-amber-100 px-2 py-1 rounded-full">
<AlertCircle color="#F59E0B" size={14} />
<Text className="text-amber-800 text-xs font-medium ml-1">
Protest
</Text>
</View>
) : (
<View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full">
<Text className="text-green-800 text-xs font-medium">
Ready to score
</Text>
</View>
)}
</View>
</View>

<Text className="text-gray-500 text-sm mt-2">
{race.status}
</Text>

<View className="flex-row mt-4 gap-2">
<TouchableOpacity className="flex-1 bg-blue-600 py-2 rounded-lg items-center">
<Text className="text-white font-medium">Score Results</Text>
</TouchableOpacity>
<TouchableOpacity className="flex-1 bg-white border border-gray-300 py-2 rounded-lg items-center">
<Text className="text-gray-700 font-medium">Resolve Protest</Text>
</TouchableOpacity>
</View>
</View>
</View>
))}
</View>

{/* Series Standings Section */}
<View>
<Text className="text-lg font-bold text-gray-900 mb-3">SERIES STANDINGS</Text>

{seriesStandings.map((series) => (
<View 
key={series.id} 
className="bg-white rounded-xl shadow-sm mb-4 border border-gray-200"
>
<View className="p-4">
<View className="flex-row items-center mb-3">
<Trophy color="#F59E0B" size={20} />
<Text className="text-lg font-bold text-gray-900 ml-2">
{series.name}
</Text>
</View>

<View className="flex-row justify-between mb-3">
<View>
<Text className="text-gray-600">
Races: {series.racesCompleted} of {series.totalRaces} completed
</Text>
<Text className="text-gray-500 text-sm mt-1">
Last updated: {series.lastUpdated}
</Text>
</View>
<View className="items-end">
<Text className="font-bold text-gray-900">{series.leader}</Text>
<Text className="text-gray-600 text-sm">Leader: {series.points} pts</Text>
</View>
</View>

<View className="flex-row mt-2 gap-2">
<TouchableOpacity className="flex-1 bg-blue-600 py-2 rounded-lg items-center">
<Text className="text-white font-medium">View Standings</Text>
</TouchableOpacity>
<TouchableOpacity className="flex-1 bg-white border border-gray-300 py-2 rounded-lg items-center">
<Text className="text-gray-700 font-medium">Update</Text>
</TouchableOpacity>
</View>
</View>
</View>
))}
</View>
</ScrollView>

{/* Bottom Actions */}
<View className="flex-row p-4 bg-white border-t border-gray-200">
<TouchableOpacity className="flex-1 bg-blue-600 py-3 rounded-lg items-center mr-2">
<Text className="text-white font-medium">+ Score New Race</Text>
</TouchableOpacity>
<TouchableOpacity className="flex-1 bg-white border border-gray-300 py-3 rounded-lg items-center ml-2">
<Text className="text-gray-700 font-medium">Export Results</Text>
</TouchableOpacity>
</View>
</View>

{/* Bottom Tab Navigation for Mobile/Tablet */}
<View className="md:hidden flex-row bg-white border-t border-gray-200 py-2">
<TouchableOpacity 
className={`flex-1 items-center py-2 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500'}`}
onPress={() => setActiveTab('dashboard')}
>
<LayoutDashboard color={activeTab === 'dashboard' ? '#3b82f6' : '#6b7280'} size={20} />
<Text className={`text-xs mt-1 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500'}`}>Dashboard</Text>
</TouchableOpacity>

<TouchableOpacity 
className={`flex-1 items-center py-2 ${activeTab === 'entries' ? 'text-blue-600' : 'text-gray-500'}`}
onPress={() => setActiveTab('entries')}
>
<FileText color={activeTab === 'entries' ? '#3b82f6' : '#6b7280'} size={20} />
<Text className={`text-xs mt-1 ${activeTab === 'entries' ? 'text-blue-600' : 'text-gray-500'}`}>Entries</Text>
</TouchableOpacity>

<TouchableOpacity 
className={`flex-1 items-center py-2 ${activeTab === 'races' ? 'text-blue-600' : 'text-gray-500'}`}
onPress={() => setActiveTab('races')}
>
<Trophy color={activeTab === 'races' ? '#3b82f6' : '#6b7280'} size={20} />
<Text className={`text-xs mt-1 ${activeTab === 'races' ? 'text-blue-600' : 'text-gray-500'}`}>Races</Text>
</TouchableOpacity>

<TouchableOpacity 
className={`flex-1 items-center py-2 ${activeTab === 'results' ? 'text-blue-600' : 'text-gray-500'}`}
onPress={() => setActiveTab('results')}
>
<BarChart3 color={activeTab === 'results' ? '#3b82f6' : '#6b7280'} size={20} />
<Text className={`text-xs mt-1 ${activeTab === 'results' ? 'text-blue-600' : 'text-gray-500'}`}>Results</Text>
</TouchableOpacity>

<TouchableOpacity 
className={`flex-1 items-center py-2 ${activeTab === 'more' ? 'text-blue-600' : 'text-gray-500'}`}
onPress={() => setActiveTab('more')}
>
<Menu color={activeTab === 'more' ? '#3b82f6' : '#6b7280'} size={20} />
<Text className={`text-xs mt-1 ${activeTab === 'more' ? 'text-blue-600' : 'text-gray-500'}`}>More</Text>
</TouchableOpacity>
</View>
</View>
</View>
</View>
);
}