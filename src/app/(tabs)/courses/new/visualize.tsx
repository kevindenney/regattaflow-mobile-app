// src/app/(tabs)/courses/new/visualize.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Map, Ruler, Clock, CheckCircle, Sparkles } from 'lucide-react-native';
import { Button, ButtonText, ButtonIcon } from '@/src/components/ui/button';
import { Badge, BadgeText } from '@/src/components/ui/badge';
import CourseMapView from '@/src/components/courses/CourseMapView';

export default function VisualizeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [courseData, setCourseData] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [showPredictionDetails, setShowPredictionDetails] = useState(false);

  useEffect(() => {
    // Parse course data from params
    if (params.courseData) {
      const data = JSON.parse(params.courseData as string);
      setCourseData(data);

      // Simulate course prediction
      // In reality, this would call CoursePredictionAgent
      setTimeout(() => {
        setPrediction({
          courseName: 'Windward-Leeward',
          confidence: 0.87,
          alternatives: [
            { name: 'Triangle Course', confidence: 0.12 },
            { name: 'Trapezoid', confidence: 0.01 },
          ],
        });
      }, 1500);
    }
  }, [params.courseData]);

  const handleGenerateStrategy = () => {
    router.push({
      pathname: '/courses/new/strategy',
      params: {
        courseData: params.courseData,
        prediction: JSON.stringify(prediction),
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  if (!courseData) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading course data...</Text>
      </View>
    );
  }

  const totalMarks = courseData.marks?.length || 0;
  const estimatedDistance = totalMarks * 0.5; // Rough estimate
  const estimatedTime = Math.round(estimatedDistance * 12); // minutes

  return (
    <View className="flex-1 bg-gray-50">
      {/* Map View */}
      <View className="h-96 bg-gray-200">
        <CourseMapView
          courseMarks={courseData.marks}
          prediction={prediction}
        />
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* AI Course Prediction */}
        {prediction ? (
          <View className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-5 mb-4 border-2 border-purple-200">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Sparkles size={24} color="#7C3AED" />
                <Text className="text-lg font-bold text-purple-900 ml-2">
                  AI Course Prediction
                </Text>
              </View>
              <Badge action="success" variant="solid">
                <BadgeText>{Math.round(prediction.confidence * 100)}% confident</BadgeText>
              </Badge>
            </View>

            <View className="bg-white rounded-xl p-4 mb-3">
              <Text className="text-sm text-gray-600 mb-1">Predicted Course Type</Text>
              <Text className="text-2xl font-bold text-gray-900">
                {prediction.courseName}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowPredictionDetails(!showPredictionDetails)}
              className="flex-row items-center"
            >
              <Text className="text-purple-700 font-semibold text-sm">
                {showPredictionDetails ? 'Hide' : 'Show'} alternative predictions
              </Text>
            </TouchableOpacity>

            {showPredictionDetails && (
              <View className="mt-3 space-y-2">
                {prediction.alternatives.map((alt: any, index: number) => (
                  <View key={index} className="bg-white bg-opacity-60 rounded-lg p-3 flex-row justify-between">
                    <Text className="text-gray-700">{alt.name}</Text>
                    <Text className="text-gray-500">{Math.round(alt.confidence * 100)}%</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View className="bg-purple-50 rounded-xl p-4 mb-4 flex-row items-center">
            <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
              <Sparkles size={20} color="#7C3AED" className="animate-pulse" />
            </View>
            <Text className="flex-1 text-purple-900 font-medium">
              AI analyzing course layout...
            </Text>
          </View>
        )}

        {/* Course Summary */}
        <View className="bg-white rounded-xl p-5 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Course Summary
          </Text>

          <View className="space-y-3">
            {/* Total Marks */}
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-3">
                  <Map size={20} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-sm text-gray-600">Course Marks</Text>
                  <Text className="text-lg font-bold text-gray-900">{totalMarks} marks</Text>
                </View>
              </View>
              <CheckCircle size={20} color="#10B981" />
            </View>

            {/* Estimated Distance */}
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-3">
                  <Ruler size={20} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-sm text-gray-600">Total Distance</Text>
                  <Text className="text-lg font-bold text-gray-900">
                    ~{estimatedDistance.toFixed(1)} nm
                  </Text>
                </View>
              </View>
            </View>

            {/* Estimated Time */}
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-3">
                  <Clock size={20} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-sm text-gray-600">Estimated Time</Text>
                  <Text className="text-lg font-bold text-gray-900">
                    ~{estimatedTime} minutes
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Mark List */}
        <View className="bg-white rounded-xl p-5 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Course Marks
          </Text>
          {courseData.marks.map((mark: any, index: number) => (
            <View
              key={mark.id}
              className="flex-row items-center py-3 border-b border-gray-100 last:border-0"
            >
              <View className="w-8 h-8 bg-blue-600 rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold text-sm">{index + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{mark.name}</Text>
                <Text className="text-xs text-gray-500">
                  {mark.coordinates.latitude.toFixed(5)}, {mark.coordinates.longitude.toFixed(5)}
                </Text>
              </View>
              <Badge action="info" variant="outline">
                <BadgeText className="text-xs">{mark.type}</BadgeText>
              </Badge>
            </View>
          ))}
        </View>

        {/* Next Steps Info */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <Text className="font-semibold text-blue-900 mb-2">
            Ready for Race Strategy?
          </Text>
          <Text className="text-sm text-blue-700 leading-relaxed">
            The course has been successfully extracted and visualized. Continue to generate
            AI-powered race strategy including start tactics, upwind/downwind approaches,
            and Monte Carlo simulations.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="bg-white border-t border-gray-200 p-4">
        <View className="flex-row gap-3">
          <Button
            action="secondary"
            variant="outline"
            size="lg"
            className="flex-1"
            onPress={handleBack}
          >
            <ButtonText>Back</ButtonText>
          </Button>

          <Button
            action="primary"
            variant="solid"
            size="lg"
            className="flex-1"
            onPress={handleGenerateStrategy}
            disabled={!prediction}
          >
            <ButtonIcon as={Sparkles} />
            <ButtonText>Generate Strategy</ButtonText>
          </Button>
        </View>
      </View>
    </View>
  );
}
