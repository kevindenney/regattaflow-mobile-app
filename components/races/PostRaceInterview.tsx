/**
 * PostRaceInterview Component
 * Freeform race description form after GPS tracking completes
 * Collects sailor's race experience for AI analysis
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { RaceAnalysisAgent } from '@/services/agents/RaceAnalysisAgent';

interface PostRaceInterviewProps {
  visible: boolean;
  sessionId: string;
  raceName: string;
  onClose: () => void;
  onComplete: () => void;
}

interface RaceDescription {
  overallExperience: string;
  startPosition: 'port' | 'starboard' | 'middle' | '';
  upwindLeg: string;
  downwindLeg: string;
  markRoundings: string;
  violations: string;
}

export function PostRaceInterview({
  visible,
  sessionId,
  raceName,
  onClose,
  onComplete,
}: PostRaceInterviewProps) {
  const router = useRouter();
  const [description, setDescription] = useState<RaceDescription>({
    overallExperience: '',
    startPosition: '',
    upwindLeg: '',
    downwindLeg: '',
    markRoundings: '',
    violations: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.overallExperience.trim()) {
      Alert.alert('Required', 'Please describe how the race went.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine all answers into a single description
      const fullDescription = `
Overall: ${description.overallExperience}

Start Position: ${description.startPosition || 'Not specified'}

Upwind Leg: ${description.upwindLeg || 'Not specified'}

Downwind Leg: ${description.downwindLeg || 'Not specified'}

Mark Roundings: ${description.markRoundings || 'None noted'}

Violations/Penalties: ${description.violations || 'None'}
      `.trim();

      // Save to database
      const { error } = await supabase
        .from('race_timer_sessions')
        .update({
          user_race_description: fullDescription,
        })
        .eq('id', sessionId);

      if (error) throw error;

      console.log('✅ Race description saved');

      // Trigger AI analysis in background
      const analysisAgent = new RaceAnalysisAgent();
      analysisAgent.analyzeRace({ timerSessionId: sessionId })
        .then((result) => {
          console.log('✅ AI analysis complete:', result.success ? 'Success' : 'Failed');
          if (!result.success) {
            console.error('AI analysis error:', result.error);
          }
        })
        .catch((error) => {
          console.error('Error triggering AI analysis:', error);
        });

      // Close and trigger completion callback
      onComplete();
      onClose();

      // Navigate to race session detail to view analysis
      router.push(`/(tabs)/race-session/${sessionId}`);

      // Reset form
      setDescription({
        overallExperience: '',
        startPosition: '',
        upwindLeg: '',
        downwindLeg: '',
        markRoundings: '',
        violations: '',
      });
    } catch (error: any) {
      console.error('Error saving race description:', error);
      Alert.alert('Error', 'Failed to save race description. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        {/* Header */}
        <View className="bg-sky-600 pt-12 pb-4 px-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Race Complete! 🏁</Text>
            <Text className="text-white/90 text-sm mt-1">{raceName}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <X size={28} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          <Text className="text-gray-800 text-lg font-semibold mb-4">
            Tell us about your race
          </Text>
          <Text className="text-gray-600 text-sm mb-6">
            Your answers will be analyzed by AI to provide personalized coaching insights.
          </Text>

          {/* Overall Experience */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">
              How did the race go? *
            </Text>
            <TextInput
              value={description.overallExperience}
              onChangeText={(text) =>
                setDescription({ ...description, overallExperience: text })
              }
              placeholder="Describe your overall race experience..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              className="bg-gray-100 rounded-lg p-4 text-base min-h-[100px]"
              textAlignVertical="top"
            />
          </View>

          {/* Start Position */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">
              Where did you start?
            </Text>
            <View className="flex-row gap-2">
              {(['port', 'middle', 'starboard'] as const).map((position) => (
                <TouchableOpacity
                  key={position}
                  onPress={() =>
                    setDescription({ ...description, startPosition: position })
                  }
                  className={`flex-1 py-3 rounded-lg border-2 ${
                    description.startPosition === position
                      ? 'bg-sky-100 border-sky-600'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      description.startPosition === position
                        ? 'text-sky-900'
                        : 'text-gray-600'
                    }`}
                  >
                    {position.charAt(0).toUpperCase() + position.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Upwind Leg */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">
              Describe the upwind leg
            </Text>
            <TextInput
              value={description.upwindLeg}
              onChangeText={(text) =>
                setDescription({ ...description, upwindLeg: text })
              }
              placeholder="Wind shifts, boat speed, tactics..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              className="bg-gray-100 rounded-lg p-4 text-base min-h-[80px]"
              textAlignVertical="top"
            />
          </View>

          {/* Downwind Leg */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">
              Describe the downwind leg
            </Text>
            <TextInput
              value={description.downwindLeg}
              onChangeText={(text) =>
                setDescription({ ...description, downwindLeg: text })
              }
              placeholder="Angles, gybes, speed..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              className="bg-gray-100 rounded-lg p-4 text-base min-h-[80px]"
              textAlignVertical="top"
            />
          </View>

          {/* Mark Roundings */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">
              Any mark rounding issues?
            </Text>
            <TextInput
              value={description.markRoundings}
              onChangeText={(text) =>
                setDescription({ ...description, markRoundings: text })
              }
              placeholder="Describe any issues at marks..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={2}
              className="bg-gray-100 rounded-lg p-4 text-base min-h-[60px]"
              textAlignVertical="top"
            />
          </View>

          {/* Violations */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">
              Rules violations, protests, or penalties?
            </Text>
            <TextInput
              value={description.violations}
              onChangeText={(text) =>
                setDescription({ ...description, violations: text })
              }
              placeholder="Describe any incidents..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={2}
              className="bg-gray-100 rounded-lg p-4 text-base min-h-[60px]"
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || !description.overallExperience.trim()}
            className={`py-4 rounded-lg flex-row items-center justify-center gap-2 ${
              description.overallExperience.trim() && !isSubmitting
                ? 'bg-sky-600'
                : 'bg-gray-300'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Send size={20} color="white" />
                <Text className="text-center text-base font-bold text-white">
                  Submit & Get AI Analysis
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-gray-500 text-center mt-4">
            * Required field
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
