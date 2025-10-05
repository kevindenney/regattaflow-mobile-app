import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Trophy, 
  BarChart3, 
  Menu,
  Home,
  Settings,
  Bell,
  User,
  Search,
  Filter,
  Plus
} from 'lucide-react-native';

const ClubDashboardScreen = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data for demonstration
  const upcomingEvents = [
    { id: 1, name: 'Summer Series Regatta', date: 'May 15, 2023', type: 'Race' },
    { id: 2, name: 'Junior Training Session', date: 'May 18, 2023', type: 'Training' },
    { id: 3, name: 'Membership Meeting', date: 'May 20, 2023', type: 'Meeting' },
  ];

  const recentEntries = [
    { id: 1, sailor: 'Alex Morgan', boat: 'Dragon 1234', class: 'Dragon', status: 'Confirmed' },
    { id: 2, sailor: 'Jamie Smith', boat: 'Laser 5678', class: 'Laser', status: 'Pending' },
    { id: 3, sailor: 'Taylor Johnson', boat: 'J/24 9012', class: 'J/24', status: 'Confirmed' },
  ];

  const recentResults = [
    { id: 1, race: 'Spring Series R1', class: 'Laser', position: '1st', participants: 12 },
    { id: 2, race: 'Spring Series R2', class: 'J/24', position: '3rd', participants: 8 },
    { id: 3, race: 'Dragon Open', class: 'Dragon', position: '5th', participants: 15 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-navy-900 py-4 px-6 flex-row items-center justify-between">
        <Text className="text-white text-xl font-bold">Royal Yacht Club</Text>
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4">
            <Bell color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center mr-2">
              <User color="white" size={16} />
            </View>
            <Text className="text-white">Admin</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 flex-row">
        {/* Desktop Sidebar Navigation */}
        <View className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-lg font-bold text-navy-900">Race Office</Text>
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
              className={`flex-row items-center px-6 py-4 ${activeTab === 'calendar' ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
              onPress={() => setActiveTab('calendar')}
            >
              <Calendar color={activeTab === 'calendar' ? '#3b82f6' : '#6b7280'} size={20} />
              <Text className={`ml-3 font-medium ${activeTab === 'calendar' ? 'text-blue-600' : 'text-gray-700'}`}>Calendar</Text>
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
            <Text className="text-lg font-bold text-navy-900">Race Office</Text>
            <TouchableOpacity>
              <Menu color="#1e3a8a" size={24} />
            </TouchableOpacity>
          </View>

          {/* Content based on active tab */}
          <ScrollView className="flex-1 p-4">
            {/* Dashboard Tab Content */}
            {activeTab === 'dashboard' && (
              <View>
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
                  <View className="flex-row">
                    <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg mr-2">
                      <Text className="text-white font-medium">New Event</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="border border-gray-300 px-4 py-2 rounded-lg">
                      <Text className="text-gray-700 font-medium">Reports</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <Text className="text-lg font-bold text-gray-900 mb-4">Quick Stats</Text>
                  <View className="flex-row justify-between">
                    <View className="items-center">
                      <Text className="text-3xl font-bold text-blue-600">24</Text>
                      <Text className="text-gray-600">Active Events</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-3xl font-bold text-green-500">142</Text>
                      <Text className="text-gray-600">Total Entries</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-3xl font-bold text-amber-500">8</Text>
                      <Text className="text-gray-600">Pending Payments</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-3xl font-bold text-red-500">3</Text>
                      <Text className="text-gray-600">Issues</Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row mb-6">
                  <View className="flex-1 bg-white rounded-xl shadow-sm p-6 mr-3">
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-lg font-bold text-gray-900">Upcoming Events</Text>
                      <TouchableOpacity>
                        <Text className="text-blue-600">View All</Text>
                      </TouchableOpacity>
                    </View>
                    {upcomingEvents.map(event => (
                      <View key={event.id} className="py-3 border-b border-gray-100">
                        <Text className="font-medium text-gray-900">{event.name}</Text>
                        <View className="flex-row justify-between mt-1">
                          <Text className="text-gray-600">{event.date}</Text>
                          <Text className="text-blue-600 text-sm">{event.type}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View className="flex-1 bg-white rounded-xl shadow-sm p-6">
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-lg font-bold text-gray-900">Recent Entries</Text>
                      <TouchableOpacity>
                        <Text className="text-blue-600">View All</Text>
                      </TouchableOpacity>
                    </View>
                    {recentEntries.map(entry => (
                      <View key={entry.id} className="py-3 border-b border-gray-100">
                        <Text className="font-medium text-gray-900">{entry.sailor}</Text>
                        <View className="flex-row justify-between mt-1">
                          <Text className="text-gray-600">{entry.boat} ({entry.class})</Text>
                          <Text className={`text-sm ${entry.status === 'Confirmed' ? 'text-green-600' : 'text-amber-600'}`}>
                            {entry.status}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Calendar Tab Content */}
            {activeTab === 'calendar' && (
              <View>
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-2xl font-bold text-gray-900">Calendar</Text>
                  <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg">
                    <Text className="text-white font-medium">New Event</Text>
                  </TouchableOpacity>
                </View>
                <View className="bg-white rounded-xl shadow-sm p-6">
                  <Text className="text-lg font-bold text-gray-900 mb-4">May 2023</Text>
                  <View className="flex-row mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <View key={day} className="flex-1 items-center py-2">
                        <Text className="font-medium text-gray-700">{day}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Calendar grid would go here */}
                  <View className="h-96 items-center justify-center">
                    <Text className="text-gray-500">Calendar view would be displayed here</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Entries Tab Content */}
            {activeTab === 'entries' && (
              <View>
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-2xl font-bold text-gray-900">Entries</Text>
                  <View className="flex-row">
                    <TouchableOpacity className="border border-gray-300 px-4 py-2 rounded-lg mr-2">
                      <Text className="text-gray-700 font-medium">Filters</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg">
                      <Text className="text-white font-medium">New Entry</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="bg-white rounded-xl shadow-sm p-6">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-bold text-gray-900">All Entries</Text>
                    <View className="flex-row">
                      <View className="border border-gray-300 rounded-lg flex-row items-center px-3 py-1 mr-2">
                        <Search color="#6b7280" size={16} />
                        <Text className="text-gray-600 ml-2">Search entries...</Text>
                      </View>
                      <TouchableOpacity className="border border-gray-300 rounded-lg px-3 py-1">
                        <Filter color="#6b7280" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View className="h-96 items-center justify-center">
                    <Text className="text-gray-500">Entries list would be displayed here</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Races Tab Content */}
            {activeTab === 'races' && (
              <View>
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-2xl font-bold text-gray-900">Races</Text>
                  <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg">
                    <Text className="text-white font-medium">New Race</Text>
                  </TouchableOpacity>
                </View>
                <View className="bg-white rounded-xl shadow-sm p-6">
                  <Text className="text-lg font-bold text-gray-900 mb-4">Active Races</Text>
                  <View className="h-96 items-center justify-center">
                    <Text className="text-gray-500">Race management interface would be displayed here</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Results Tab Content */}
            {activeTab === 'results' && (
              <View>
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-2xl font-bold text-gray-900">Results</Text>
                  <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg">
                    <Text className="text-white font-medium">Publish Results</Text>
                  </TouchableOpacity>
                </View>
                <View className="bg-white rounded-xl shadow-sm p-6">
                  <Text className="text-lg font-bold text-gray-900 mb-4">Recent Results</Text>
                  <View className="h-96 items-center justify-center">
                    <Text className="text-gray-500">Results would be displayed here</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Settings Tab Content */}
            {activeTab === 'settings' && (
              <View>
                <Text className="text-2xl font-bold text-gray-900 mb-6">Settings</Text>
                <View className="bg-white rounded-xl shadow-sm p-6">
                  <Text className="text-lg font-bold text-gray-900 mb-4">Club Configuration</Text>
                  <View className="h-96 items-center justify-center">
                    <Text className="text-gray-500">Settings interface would be displayed here</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

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
              className={`flex-1 items-center py-2 ${activeTab === 'calendar' ? 'text-blue-600' : 'text-gray-500'}`}
              onPress={() => setActiveTab('calendar')}
            >
              <Calendar color={activeTab === 'calendar' ? '#3b82f6' : '#6b7280'} size={20} />
              <Text className={`text-xs mt-1 ${activeTab === 'calendar' ? 'text-blue-600' : 'text-gray-500'}`}>Calendar</Text>
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
    </SafeAreaView>
  );
};

export default ClubDashboardScreen;