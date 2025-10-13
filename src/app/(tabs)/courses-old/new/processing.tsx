// src/app/(tabs)/courses/new/processing.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react-native';
import { DocumentProcessingAgent } from '@/src/services/agents/DocumentProcessingAgent';
import * as FileSystem from 'expo-file-system';
import { Button, ButtonText } from '@/src/components/ui/button';

type ProcessingStep =
  | 'reading'
  | 'extracting'
  | 'parsing'
  | 'validating'
  | 'complete'
  | 'error';

interface StepStatus {
  key: ProcessingStep;
  label: string;
  description: string;
}

const PROCESSING_STEPS: StepStatus[] = [
  {
    key: 'reading',
    label: 'Reading document',
    description: 'Analyzing document structure and content'
  },
  {
    key: 'extracting',
    label: 'Extracting course data',
    description: 'Identifying marks, coordinates, and sequences'
  },
  {
    key: 'parsing',
    label: 'Parsing race details',
    description: 'Understanding time controls and rules'
  },
  {
    key: 'validating',
    label: 'Validating information',
    description: 'Checking coordinate accuracy and completeness'
  },
];

export default function ProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('reading');
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [estimatedTime, setEstimatedTime] = useState(25);

  useEffect(() => {
    processDocument();
  }, []);

  // Countdown timer for estimated time
  useEffect(() => {
    if (currentStep === 'complete' || currentStep === 'error') return;

    const interval = setInterval(() => {
      setEstimatedTime(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep]);

  const processDocument = async () => {
    try {
      const { fileUri, fileName } = params;

      if (!fileUri) {
        throw new Error('No file provided');
      }

      // Step 1: Reading
      setCurrentStep('reading');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const documentText = await FileSystem.readAsStringAsync(
        fileUri as string,
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      // Step 2: Extracting
      setCurrentStep('extracting');
      const agent = new DocumentProcessingAgent();
      const result = await agent.processSailingInstructions(
        documentText,
        fileName as string,
        undefined
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to process document');
      }

      // Step 3: Parsing
      setCurrentStep('parsing');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const toolResults = result.toolResults || [];
      const extractionTool = toolResults.find(
        (t: any) => t.toolName === 'extract_race_course_from_si'
      );

      if (!extractionTool?.result?.success) {
        throw new Error('Failed to extract course information');
      }

      // Step 4: Validating
      setCurrentStep('validating');
      await new Promise(resolve => setTimeout(resolve, 800));

      const extraction = extractionTool.result.extraction;

      // Transform to usable format
      const marks = extraction.marks
        .filter((m: any) => m.coordinates?.lat && m.coordinates?.lng)
        .map((m: any, index: number) => ({
          id: `mark-${index}`,
          name: m.name,
          type: m.type || 'mark',
          coordinates: {
            latitude: m.coordinates.lat,
            longitude: m.coordinates.lng,
          },
        }));

      setExtractedData({
        marks,
        courseName: extraction.courseName || 'Unnamed Course',
        totalMarks: marks.length,
        rawExtraction: extraction,
      });

      // Complete
      setCurrentStep('complete');

      // Auto-advance after showing success
      setTimeout(() => {
        router.push({
          pathname: '/courses/new/visualize',
          params: {
            courseData: JSON.stringify({ marks }),
          },
        });
      }, 1500);

    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Unknown error occurred');
      setCurrentStep('error');
    }
  };

  const handleRetry = () => {
    setError(null);
    setCurrentStep('reading');
    setEstimatedTime(25);
    processDocument();
  };

  const handleManualEntry = () => {
    router.push('/courses/new/manual');
  };

  const getStepStatus = (step: ProcessingStep): 'pending' | 'active' | 'complete' | 'error' => {
    const stepIndex = PROCESSING_STEPS.findIndex(s => s.key === step);
    const currentIndex = PROCESSING_STEPS.findIndex(s => s.key === currentStep);

    if (currentStep === 'error') return 'error';
    if (currentStep === 'complete') return 'complete';
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Status Card */}
        <View className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
          <View className="flex-row items-start mb-4">
            <View className="w-14 h-14 bg-purple-100 rounded-full items-center justify-center mr-4">
              {currentStep === 'error' ? (
                <AlertCircle size={32} color="#EF4444" />
              ) : currentStep === 'complete' ? (
                <CheckCircle size={32} color="#10B981" />
              ) : (
                <View className="relative">
                  <Sparkles size={32} color="#7C3AED" />
                  <View className="absolute -top-1 -right-1">
                    <ActivityIndicator size="small" color="#7C3AED" />
                  </View>
                </View>
              )}
            </View>

            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {currentStep === 'error'
                  ? 'Processing Failed'
                  : currentStep === 'complete'
                  ? 'Processing Complete!'
                  : 'AI Processing Document'
                }
              </Text>
              <Text className="text-sm text-gray-600">
                {currentStep === 'error'
                  ? error
                  : currentStep === 'complete'
                  ? `Successfully extracted ${extractedData?.totalMarks || 0} course marks`
                  : 'Analyzing sailing instructions with DocumentProcessingAgent'
                }
              </Text>
            </View>
          </View>

          {/* Estimated Time (only during processing) */}
          {currentStep !== 'error' && currentStep !== 'complete' && (
            <View className="pt-4 border-t border-purple-100">
              <Text className="text-xs text-gray-500">
                Estimated time remaining: ~{estimatedTime} seconds
              </Text>
              <View className="mt-2 h-1 bg-purple-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-purple-600 rounded-full"
                  style={{
                    width: `${Math.max(10, 100 - (estimatedTime / 25 * 100))}%`
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Processing Steps */}
        <View className="bg-white rounded-xl p-5 mb-6">
          <Text className="font-semibold text-gray-900 mb-4">
            Processing Steps
          </Text>

          <View className="space-y-4">
            {PROCESSING_STEPS.map((step, index) => {
              const status = getStepStatus(step.key);
              const isActive = status === 'active';
              const isComplete = status === 'complete';
              const isError = status === 'error';

              return (
                <View key={step.key} className="flex-row items-start">
                  {/* Status Icon */}
                  <View className="mr-3 pt-0.5">
                    {isComplete ? (
                      <CheckCircle size={20} color="#10B981" />
                    ) : isActive ? (
                      <ActivityIndicator size={20} color="#2563EB" />
                    ) : isError ? (
                      <AlertCircle size={20} color="#EF4444" />
                    ) : (
                      <View className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </View>

                  {/* Step Info */}
                  <View className="flex-1">
                    <Text
                      className={`font-semibold ${
                        isActive ? 'text-blue-600' :
                        isComplete ? 'text-gray-700' :
                        'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-0.5">
                      {step.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Error Actions */}
        {currentStep === 'error' && (
          <View className="space-y-3">
            <Button
              action="negative"
              variant="solid"
              size="lg"
              className="w-full"
              onPress={handleRetry}
            >
              <ButtonText>Try Again</ButtonText>
            </Button>

            <Button
              action="secondary"
              variant="outline"
              size="lg"
              className="w-full"
              onPress={handleManualEntry}
            >
              <ButtonText>Enter Manually Instead</ButtonText>
            </Button>
          </View>
        )}

        {/* What's Happening Info */}
        {currentStep !== 'error' && currentStep !== 'complete' && (
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <View className="flex-row items-start">
              <Sparkles size={20} color="#2563EB" className="mt-0.5 mr-3" />
              <View className="flex-1">
                <Text className="font-semibold text-blue-900 text-sm mb-1">
                  What's happening?
                </Text>
                <Text className="text-xs text-blue-700 leading-relaxed">
                  Our AI is reading your sailing instructions and extracting key information
                  like mark coordinates, course sequences, and racing rules. This process
                  typically takes 15-30 seconds.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
