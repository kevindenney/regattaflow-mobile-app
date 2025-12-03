/**
 * PostRaceInterview Component
 * Freeform race description form after GPS tracking completes
 * Collects sailor's race experience for AI analysis
 * 
 * Enhanced flow:
 * 1. Form entry (current)
 * 2. AI analysis loading state
 * 3. Results preview with key insights
 * 4. Link to full analysis in race detail
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
import { X, Send, CheckCircle, ChevronRight, Sparkles, Target, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { RaceAnalysisService, type AnalysisResult } from '@/services/RaceAnalysisService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('PostRaceInterview');

interface PostRaceInterviewProps {
  visible: boolean;
  sessionId: string;
  raceName: string;
  raceId?: string; // Optional race ID for navigation to race detail
  onClose: () => void;
  onComplete: () => void;
  gpsPointCount?: number; // Optional GPS point count to display
}

interface RaceDescription {
  overallExperience: string;
  startPosition: 'port' | 'starboard' | 'middle' | '';
  upwindLeg: string;
  downwindLeg: string;
  markRoundings: string;
  violations: string;
}

type ModalState = 'form' | 'analyzing' | 'results';

export function PostRaceInterview({
  visible,
  sessionId,
  raceName,
  raceId,
  onClose,
  onComplete,
  gpsPointCount,
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
  const [modalState, setModalState] = useState<ModalState>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const resetForm = () => {
    setDescription({
      overallExperience: '',
      startPosition: '',
      upwindLeg: '',
      downwindLeg: '',
      markRoundings: '',
      violations: '',
    });
    setModalState('form');
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  const handleSkip = () => {
    onClose();
    resetForm();
  };

  const handleDone = () => {
    onComplete();
    onClose();
    resetForm();
  };

  const handleViewFullAnalysis = () => {
    onComplete();
    onClose();
    resetForm();
    
    // Navigate to race detail if raceId is available
    if (raceId) {
      router.push(`/(tabs)/race/scrollable/${raceId}`);
    }
  };

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
          notes: fullDescription,
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Switch to analyzing state
      setModalState('analyzing');
      setIsSubmitting(false);

      // Trigger AI analysis and wait for results
      logger.debug('Starting AI analysis for session:', sessionId);
      const result = await RaceAnalysisService.analyzeRaceSession(sessionId);
      
      if (result) {
        logger.debug('AI analysis complete:', result.id);
        setAnalysisResult(result);
        setModalState('results');
      } else {
        // Analysis didn't return results immediately - might be processing
        // Poll for results a few times
        let attempts = 0;
        const maxAttempts = 6;
        const pollInterval = 2000; // 2 seconds

        const pollForResults = async () => {
          attempts++;
          const polledResult = await RaceAnalysisService.getAnalysis(sessionId);
          
          if (polledResult) {
            setAnalysisResult(polledResult);
            setModalState('results');
            return true;
          }
          
          if (attempts < maxAttempts) {
            setTimeout(pollForResults, pollInterval);
            return false;
          }
          
          // Max attempts reached - show partial success
          setAnalysisError('Analysis is taking longer than expected. Check back in the race detail view.');
          setModalState('results');
          return false;
        };

        setTimeout(pollForResults, pollInterval);
      }
    } catch (error: any) {
      logger.error('Error saving race description:', error);
      setIsSubmitting(false);
      Alert.alert('Error', 'Failed to save race description. Please try again.');
    }
  };

  // Extract key insights from analysis for preview
  const getKeyInsights = (): { icon: any; text: string; type: 'success' | 'improvement' | 'tip' }[] => {
    if (!analysisResult) return [];

    const insights: { icon: any; text: string; type: 'success' | 'improvement' | 'tip' }[] = [];

    // Parse recommendations for display
    if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
      analysisResult.recommendations.slice(0, 3).forEach((rec) => {
        insights.push({
          icon: TrendingUp,
          text: rec,
          type: 'tip',
        });
      });
    }

    // Add overall summary as first insight if we have it
    if (analysisResult.overall_summary) {
      const summary = analysisResult.overall_summary.split('.')[0] + '.';
      insights.unshift({
        icon: Sparkles,
        text: summary.length > 100 ? summary.substring(0, 100) + '...' : summary,
        type: 'success',
      });
    }

    return insights.slice(0, 4); // Max 4 insights
  };

  // Render form state
  const renderForm = () => (
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
        className={`py-4 rounded-lg flex-row items-center justify-center gap-2 mb-3 ${
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

      {/* Skip Button */}
      <TouchableOpacity
        onPress={handleSkip}
        disabled={isSubmitting}
        className="py-3 rounded-lg border-2 border-gray-300"
      >
        <Text className="text-center text-base font-semibold text-gray-600">
          Skip for Now
        </Text>
      </TouchableOpacity>

      <Text className="text-xs text-gray-500 text-center mt-4">
        * Required field • GPS data already saved
      </Text>
    </ScrollView>
  );

  // Render analyzing state
  const renderAnalyzing = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="bg-sky-50 rounded-full p-6 mb-6">
        <Sparkles size={48} color="#0284c7" />
      </View>
      <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
        Analyzing Your Race
      </Text>
      <Text className="text-gray-600 text-center mb-8">
        Our AI is reviewing your race notes and GPS data to generate personalized coaching insights...
      </Text>
      <ActivityIndicator size="large" color="#0284c7" />
      <Text className="text-sm text-gray-500 mt-4">
        This usually takes 10-20 seconds
      </Text>
    </View>
  );

  // Render results state
  const renderResults = () => {
    const insights = getKeyInsights();

    return (
      <ScrollView className="flex-1 px-4 py-6">
        {/* Success Header */}
        <View className="items-center mb-6">
          <View className="bg-emerald-100 rounded-full p-4 mb-4">
            <CheckCircle size={40} color="#059669" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-1">
            {analysisResult ? 'AI Analysis Ready!' : 'Notes Saved!'}
          </Text>
          <Text className="text-gray-600 text-center">
            {analysisResult 
              ? 'Here are your key insights from this race'
              : analysisError || 'Your analysis is being processed'}
          </Text>
        </View>

        {/* Key Insights */}
        {insights.length > 0 && (
          <View className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <Sparkles size={20} color="#7c3aed" />
              <Text className="text-lg font-semibold text-gray-800">
                Key Insights
              </Text>
            </View>
            
            {insights.map((insight, index) => {
              const IconComponent = insight.icon;
              const bgColor = insight.type === 'success' ? 'bg-emerald-50' : 
                              insight.type === 'improvement' ? 'bg-amber-50' : 'bg-sky-50';
              const iconColor = insight.type === 'success' ? '#059669' : 
                               insight.type === 'improvement' ? '#d97706' : '#0284c7';
              
              return (
                <View key={index} className={`flex-row items-start gap-3 p-3 ${bgColor} rounded-lg mb-2`}>
                  <IconComponent size={18} color={iconColor} style={{ marginTop: 2 }} />
                  <Text className="flex-1 text-gray-700 text-sm leading-5">
                    {insight.text}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Confidence Score */}
        {analysisResult?.confidence_score && (
          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <Text className="text-sm text-gray-500 mb-1">Analysis Confidence</Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${analysisResult.confidence_score}%` }}
                />
              </View>
              <Text className="text-sm font-semibold text-gray-700">
                {analysisResult.confidence_score}%
              </Text>
            </View>
          </View>
        )}

        {/* View Full Analysis Button */}
        {raceId && (
          <TouchableOpacity
            onPress={handleViewFullAnalysis}
            className="bg-sky-600 py-4 rounded-lg flex-row items-center justify-center gap-2 mb-3"
          >
            <Target size={20} color="white" />
            <Text className="text-white font-bold text-base">
              View Full Analysis
            </Text>
            <ChevronRight size={20} color="white" />
          </TouchableOpacity>
        )}

        {/* Done Button */}
        <TouchableOpacity
          onPress={handleDone}
          className="py-3 rounded-lg border-2 border-gray-300"
        >
          <Text className="text-center text-base font-semibold text-gray-600">
            Done
          </Text>
        </TouchableOpacity>

        {/* Info text */}
        <Text className="text-xs text-gray-500 text-center mt-4">
          Full analysis available in the race detail view under "Post-Race Analysis"
        </Text>
      </ScrollView>
    );
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
        <View className={`pt-12 pb-4 px-4 flex-row items-center justify-between ${
          modalState === 'results' ? 'bg-emerald-600' : 'bg-sky-600'
        }`}>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              {modalState === 'form' && 'Race Complete! 🏁'}
              {modalState === 'analyzing' && 'Analyzing... 🤖'}
              {modalState === 'results' && 'Analysis Complete! ✨'}
            </Text>
            <Text className="text-white/90 text-sm mt-1">{raceName}</Text>
            {gpsPointCount !== undefined && modalState === 'form' && (
              <Text className="text-white/80 text-xs mt-1">
                ✓ Saved {gpsPointCount} GPS points
              </Text>
            )}
          </View>
          {modalState !== 'analyzing' && (
            <TouchableOpacity onPress={modalState === 'results' ? handleDone : onClose}>
              <X size={28} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Content based on state */}
        {modalState === 'form' && renderForm()}
        {modalState === 'analyzing' && renderAnalyzing()}
        {modalState === 'results' && renderResults()}
      </KeyboardAvoidingView>
    </Modal>
  );
}
