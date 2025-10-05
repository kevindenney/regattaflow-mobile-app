import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Trophy, Users, Flag, Timer, ChartBar, Smartphone, Award } from 'lucide-react-native';

export default function ClubsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Banner */}
      <View className="bg-blue-500 px-4 py-2">
        <Text className="text-white text-center text-sm">
          🎉 Join 10,000+ sailors using AI-powered race strategy • Free 14-day trial
        </Text>
      </View>

      {/* Navigation */}
      <View className="flex-row justify-center gap-2 py-4">
        <TouchableOpacity className="px-4 py-2 rounded-full">
          <Text className="text-gray-600">For Sailors</Text>
        </TouchableOpacity>
        <TouchableOpacity className="px-4 py-2 rounded-full bg-blue-500">
          <Text className="text-white">For Yacht Clubs</Text>
        </TouchableOpacity>
        <TouchableOpacity className="px-4 py-2 rounded-full">
          <Text className="text-gray-600">For Coaches</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Header Section */}
        <View className="px-4 py-6">
          <View className="bg-blue-50 self-start px-3 py-1 rounded-full mb-4">
            <Text className="text-blue-600 text-sm">Race Management Platform</Text>
          </View>
          
          <Text className="text-3xl font-bold text-gray-900 mb-4">
            Complete Regatta{'\n'}Management Suite
          </Text>
          
          <Text className="text-gray-600 mb-6">
            From registration to results publication
          </Text>

          <View className="flex-row gap-4 mb-8">
            <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-xl">
              <Text className="text-white font-semibold">Manage Your Events →</Text>
            </TouchableOpacity>
            <TouchableOpacity className="border border-gray-200 px-6 py-3 rounded-xl">
              <Text className="text-blue-500">View Club Demo</Text>
            </TouchableOpacity>
          </View>

          {/* Race Management Dashboard */}
          <View className="bg-emerald-800 rounded-2xl p-4 mb-8">
            <View className="flex-row justify-between mb-4">
              <View className="bg-white/90 rounded-xl p-3">
                <Text className="text-gray-600 text-xs mb-1">RACE STATUS</Text>
                <Text className="text-emerald-500 font-semibold">Race 3 Active</Text>
                <Text className="text-gray-500 text-xs">24 boats racing</Text>
              </View>
              
              <View className="bg-white/90 rounded-xl p-3">
                <Text className="text-gray-600 text-xs mb-1">CONDITIONS</Text>
                <Text className="text-emerald-500 font-semibold">Perfect</Text>
                <Text className="text-gray-500 text-xs">15kt SW, Flat</Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="bg-white/90 rounded-xl p-3">
                <Text className="text-gray-600 text-xs mb-1">LEADERBOARD</Text>
                <View className="gap-1">
                  <Text className="text-gray-800">USA 123    1st</Text>
                  <Text className="text-gray-800">GBR 456   2nd</Text>
                  <Text className="text-gray-800">AUS 789    3rd</Text>
                </View>
              </View>
              
              <View className="bg-emerald-500 rounded-xl p-3">
                <Text className="text-white text-xs mb-1">COURSE ACTIVE</Text>
                <Text className="text-white font-semibold">Windward/Leeward</Text>
                <Text className="text-white/80 text-xs">2 Turn course</Text>
              </View>
            </View>
          </View>

          {/* Features Section */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-center text-gray-900 mb-2">
              Complete regatta management in your pocket
            </Text>
            <Text className="text-center text-gray-600 mb-8">
              Run professional regattas from setup to results publication
            </Text>

            <View className="gap-6">
              <View className="flex-row gap-4 items-start">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Users className="text-blue-600" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 mb-1">Entry Management</Text>
                  <Text className="text-gray-600">Handle registrations, payments, and sailor communications all in one place.</Text>
                </View>
              </View>

              <View className="flex-row gap-4 items-start">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Flag className="text-blue-600" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 mb-1">Race Committee Tools</Text>
                  <Text className="text-gray-600">Start sequences, timing systems, and real-time race management dashboard.</Text>
                </View>
              </View>

              <View className="flex-row gap-4 items-start">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <ChartBar className="text-blue-600" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 mb-1">Live Results</Text>
                  <Text className="text-gray-600">Instant scoring and live leaderboards that update automatically during races.</Text>
                </View>
              </View>

              <View className="flex-row gap-4 items-start">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Smartphone className="text-blue-600" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 mb-1">Mobile Race Control</Text>
                  <Text className="text-gray-600">Full race committee functionality on mobile devices for on-water management.</Text>
                </View>
              </View>

              <View className="flex-row gap-4 items-start">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Trophy className="text-blue-600" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 mb-1">Awards Ceremony</Text>
                  <Text className="text-gray-600">Automated trophy calculations and professional ceremony management.</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}