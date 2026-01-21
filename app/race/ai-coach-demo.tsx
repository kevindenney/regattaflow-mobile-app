/**
 * AI Coach Demo Screen
 * Showcases the SmartRaceCoach integration with all features
 *
 * Navigate to this screen to test: router.push('/race/ai-coach-demo')
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Sparkles, ArrowLeft, Settings } from 'lucide-react-native';
import { SmartRaceCoach } from '@/components/coaching/SmartRaceCoach';
import { QuickSkillButtons } from '@/components/coaching/QuickSkillButtons';

export default function AICoachDemoScreen() {
  const router = useRouter();

  // Demo race data
  const [raceData, setRaceData] = useState({
    id: 'demo-race-1',
    name: 'Spring Championship 2025',
    date_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    fleet_size: 45,
    location: {
      name: 'San Francisco Bay',
      lat: 37.8199,
      lon: -122.4783
    },
    course: {
      type: 'windward-leeward',
      marks: [
        {
          name: 'Start',
          type: 'start',
          coordinates: { lat: 37.8199, lon: -122.4783 }
        },
        {
          name: 'Windward',
          type: 'windward',
          coordinates: { lat: 37.8299, lon: -122.4783 }
        },
        {
          name: 'Leeward',
          type: 'leeward',
          coordinates: { lat: 37.8199, lon: -122.4783 }
        }
      ]
    },
    weather: {
      windSpeed: 12,
      windDirection: 270,
      forecast: 'NW 10-15 knots'
    }
  });

  // AI Coach settings
  const [coachEnabled, setCoachEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [minimalMode, setMinimalMode] = useState(false);

  // GPS simulation
  const [simulateGPS, setSimulateGPS] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lon: number } | undefined>();

  const handleSkillInvoked = (skillId: string, advice: any) => {
    // You could show a toast or update UI here
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'AI Coach Demo',
          headerShown: true,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2">
              <ArrowLeft size={24} color="#111827" />
            </Pressable>
          )
        }}
      />

      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
          <View className="flex-row items-center gap-3">
            <Sparkles size={32} color="white" />
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">
                AI Race Coach
              </Text>
              <Text className="text-purple-200 text-sm">
                Context-aware tactical guidance powered by Claude Skills
              </Text>
            </View>
          </View>
        </View>

        {/* Demo Info */}
        <View className="bg-blue-50 border border-blue-200 m-4 p-4 rounded-xl">
          <Text className="text-blue-900 font-semibold mb-2">
            🎯 Demo Mode
          </Text>
          <Text className="text-blue-700 text-sm">
            This screen demonstrates the SmartRaceCoach component with simulated race data.
            Try adjusting the settings below to see how the AI coach responds to different scenarios.
          </Text>
        </View>

        {/* Race Info */}
        <View className="bg-white mx-4 mb-4 p-4 rounded-xl shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Race Information
          </Text>

          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Name:</Text>
              <Text className="font-medium">{raceData.name}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Fleet Size:</Text>
              <Text className="font-medium">{raceData.fleet_size} boats</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Location:</Text>
              <Text className="font-medium">{raceData.location.name}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Wind:</Text>
              <Text className="font-medium">{raceData.weather.forecast}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Starts in:</Text>
              <Text className="font-medium">
                {Math.round((new Date(raceData.date_time).getTime() - Date.now()) / 1000 / 60)} minutes
              </Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View className="bg-white mx-4 mb-4 p-4 rounded-xl shadow-sm">
          <View className="flex-row items-center gap-2 mb-3">
            <Settings size={20} color="#111827" />
            <Text className="text-lg font-bold text-gray-900">
              Coach Settings
            </Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-gray-700">Enable AI Coach</Text>
              <Switch
                value={coachEnabled}
                onValueChange={setCoachEnabled}
                trackColor={{ false: '#d1d5db', true: '#9333ea' }}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center justify-between py-2">
              <Text className="text-gray-700">Auto-refresh on phase change</Text>
              <Switch
                value={autoRefresh}
                onValueChange={setAutoRefresh}
                trackColor={{ false: '#d1d5db', true: '#9333ea' }}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center justify-between py-2">
              <Text className="text-gray-700">Minimal mode</Text>
              <Switch
                value={minimalMode}
                onValueChange={setMinimalMode}
                trackColor={{ false: '#d1d5db', true: '#9333ea' }}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center justify-between py-2">
              <Text className="text-gray-700">Simulate GPS position</Text>
              <Switch
                value={simulateGPS}
                onValueChange={setSimulateGPS}
                trackColor={{ false: '#d1d5db', true: '#9333ea' }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        {/* Quick Skill Buttons */}
        <View className="mb-4">
          <QuickSkillButtons
            raceData={raceData}
            onSkillInvoked={handleSkillInvoked}
          />
        </View>

        {/* Smart Race Coach */}
        {coachEnabled && (
          <View className="mx-4 mb-6">
            <SmartRaceCoach
              raceId={raceData.id}
              raceData={raceData}
              position={simulateGPS ? position : undefined}
              minimal={minimalMode}
              autoRefresh={autoRefresh}
            />
          </View>
        )}

        {/* Instructions */}
        <View className="bg-gray-100 mx-4 mb-6 p-4 rounded-xl">
          <Text className="text-gray-900 font-semibold mb-2">
            💡 How to Use
          </Text>
          <View className="space-y-2">
            <Text className="text-gray-700 text-sm">
              • The AI Coach automatically detects the race phase (pre-race, start, beat, etc.)
            </Text>
            <Text className="text-gray-700 text-sm">
              • It selects the appropriate skill based on the current phase
            </Text>
            <Text className="text-gray-700 text-sm">
              • Tap Quick Skill buttons to get instant advice on specific topics
            </Text>
            <Text className="text-gray-700 text-sm">
              • Toggle settings above to see different UI modes
            </Text>
            <Text className="text-gray-700 text-sm">
              • Enable "Simulate GPS" to trigger phase changes based on position
            </Text>
          </View>
        </View>

        {/* Integration Code */}
        <View className="bg-gray-900 mx-4 mb-6 p-4 rounded-xl">
          <Text className="text-green-400 font-mono text-xs mb-2">
            // Integration Example
          </Text>
          <Text className="text-gray-300 font-mono text-xs">
            {`import { SmartRaceCoach } from '@/components/coaching/SmartRaceCoach';

<SmartRaceCoach
  raceId={raceId}
  raceData={race}
  position={gpsPosition}
  minimal={false}
  autoRefresh={true}
/>`}
          </Text>
        </View>

        {/* Skills Reference */}
        <View className="bg-white mx-4 mb-6 p-4 rounded-xl shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Available Skills
          </Text>
          <View className="space-y-2">
            {[
              { name: 'Starting Line Mastery', phase: 'Pre-race & Start' },
              { name: 'Upwind Strategic Positioning', phase: 'First Beat' },
              { name: 'Upwind Tactical Combat', phase: 'Final Beat' },
              { name: 'Downwind Speed & Position', phase: 'Reaches & Runs' },
              { name: 'Mark Rounding Execution', phase: 'All Marks' },
              { name: 'Tidal Opportunism Analyst', phase: 'All Phases' }
            ].map((skill, i) => (
              <View key={i} className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">{skill.name}</Text>
                  <Text className="text-xs text-gray-600">{skill.phase}</Text>
                </View>
                <View className="bg-purple-100 px-2 py-1 rounded">
                  <Text className="text-xs text-purple-900 font-medium">Active</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
