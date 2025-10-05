import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  Upload,
  Map,
  Zap,
  BarChart2,
  TrendingUp,
  X,
  FileText,
  Sparkles,
  Play,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react-native';
import CourseMapView from '@/src/components/courses/CourseMapView';
import { EmptyState } from '@/src/components/ui/empty';
import { useSailorDashboardData } from '@/src/hooks';
import { useSailingDocuments } from '@/src/hooks/useSailingDocuments';
import { DocumentProcessingAgent } from '@/src/services/agents/DocumentProcessingAgent';
import { CoursePredictionAgent } from '@/src/services/agents/CoursePredictionAgent';
import { raceStrategyEngine } from '@/src/services/ai/RaceStrategyEngine';
import { monteCarloService } from '@/src/services/monteCarloService';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/providers/AuthProvider';

type WorkflowStep = 'map' | 'upload' | 'extract' | 'visualize' | 'strategy' | 'race' | 'analysis';

interface CourseMark {
  id: string;
  name: string;
  type: 'start' | 'mark' | 'gate' | 'finish';
  coordinates: { latitude: number; longitude: number };
}

export default function CoursesScreen() {
  // Real data hooks
  const { user } = useAuth();
  const { races, documents, strategies, loading: racesLoading, error: racesError } = useSailorDashboardData();
  const { documents: sailingDocuments, loading: docsLoading } = useSailingDocuments();

  const [currentStep, setCurrentStep] = useState<WorkflowStep>('map');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [uploadedDocument, setUploadedDocument] = useState<any>(null);
  const [extractedCourse, setExtractedCourse] = useState<any>(null);
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null);
  const [monteCarloResults, setMonteCarloResults] = useState<any>(null);
  const [savedStrategyId, setSavedStrategyId] = useState<string | null>(null);
  const [coursePrediction, setCoursePrediction] = useState<any>(null);
  const [predictionCacheInfo, setPredictionCacheInfo] = useState<{
    cached: boolean;
    cacheAge?: string;
    accuracy?: number;
  } | null>(null);

  // Agent processing state
  const [processingStatus, setProcessingStatus] = useState<{
    step: 'upload' | 'extract' | 'visualize' | 'strategy' | 'save' | 'complete';
    message: string;
  }>({ step: 'upload', message: 'Ready to upload' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Extract course marks from real document data
  const getCourseMarks = (): CourseMark[] => {
    // Priority 1: Check manually uploaded/extracted course
    if (extractedCourse?.marks) {
      return extractedCourse.marks;
    }

    // Priority 2: Check sailing documents for extracted course data
    const docWithCourse = sailingDocuments.find(doc => {
      if (doc.type !== 'sailing_instructions') return false;

      // Check if document has been processed and has course marks
      const metadata = doc.metadata as any;
      return metadata?.courseMarks && Array.isArray(metadata.courseMarks);
    });

    if (docWithCourse) {
      const metadata = docWithCourse.metadata as any;
      return metadata.courseMarks;
    }

    // Priority 3: Check dashboard documents for AI-extracted course data
    const dashboardDoc = documents.find(doc => {
      if (doc.type !== 'sailing_instructions') return false;
      return doc.processed; // Only use processed documents
    });

    if (dashboardDoc) {
      // Parse extracted content for course marks
      // This would come from DocumentProcessingAgent analysis
      try {
        // Placeholder: In production, this would parse AI analysis results
        // stored in the documents table's analysis_data or metadata field
        console.log('Found processed document:', dashboardDoc.name);
      } catch (error) {
        console.error('Error parsing course data:', error);
      }
    }

    // No course data available - return empty array for empty state
    return [];
  };

  const courseMarks = getCourseMarks();

  // Get the next race with strategy
  const nextRaceWithStrategy = races.find(race => race.hasStrategy && race.status === 'upcoming');

  /**
   * Handle document upload and processing with DocumentProcessingAgent
   */
  const handleDocumentUpload = async () => {
    try {
      // Step 1: Pick document
      setProcessingStatus({ step: 'upload', message: 'Selecting document...' });

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // Step 2: Read file content
      setCurrentStep('extract');
      setIsProcessing(true);
      setProcessingError(null);
      setProcessingStatus({ step: 'extract', message: 'Reading document...' });

      let documentText = '';

      if (Platform.OS === 'web') {
        // Web: file.uri is a blob URL
        const response = await fetch(file.uri);
        const blob = await response.blob();
        documentText = await blob.text();
      } else {
        // Native: Read from file system
        documentText = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      // Step 3: Process with DocumentProcessingAgent
      setProcessingStatus({ step: 'extract', message: 'AI extracting course data...' });

      const agent = new DocumentProcessingAgent();
      const agentResult = await agent.processSailingInstructions(
        documentText,
        file.name,
        undefined // No venue hint for now
      );

      if (!agentResult.success) {
        throw new Error(agentResult.error || 'Failed to process document');
      }

      // Step 4: Extract data from agent response
      setProcessingStatus({ step: 'visualize', message: 'Generating 3D visualization...' });

      const agentOutput = agentResult.result;

      // Parse agent output for course data
      // Agent returns natural language - we need to extract structured data from tool results
      const toolResults = agentResult.toolResults || [];

      const extractionTool = toolResults.find((t: any) => t.toolName === 'extract_race_course_from_si');
      const visualizationTool = toolResults.find((t: any) => t.toolName === 'generate_3d_course_visualization');
      const strategyTool = toolResults.find((t: any) => t.toolName === 'analyze_race_strategy');
      const savedTool = toolResults.find((t: any) => t.toolName === 'save_to_knowledge_base');

      if (!extractionTool?.result?.success) {
        throw new Error('Failed to extract course information from document');
      }

      const extraction = extractionTool.result.extraction;
      const visualization = visualizationTool?.result;
      const strategy = strategyTool?.result?.analysis;

      // Step 5: Transform to CourseMark format
      const marks: CourseMark[] = extraction.marks
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

      if (marks.length === 0) {
        throw new Error('No course marks with GPS coordinates found. Please check the sailing instructions.');
      }

      setExtractedCourse({
        marks,
        visualization: visualization?.geoJSON,
        strategy,
      });

      // Step 6: Save to database
      setProcessingStatus({ step: 'save', message: 'Saving to database...' });

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data: analysisData, error: dbError } = await supabase
        .from('ai_analyses')
        .insert({
          user_id: user.id,
          analysis_type: 'course_extraction',
          source_document: file.name,
          course_data: extraction,
          course_marks: marks,
          visualization_geojson: visualization?.geoJSON,
          strategy_data: strategy,
          confidence_score: extraction.confidence || 0.5,
          status: 'completed',
          model_used: 'claude-sonnet-4-5 + gemini-1.5-pro',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database save error:', dbError);
        throw new Error(`Failed to save analysis: ${dbError.message}`);
      }

      // Step 7: Predict race course with caching (if we have regatta and venue data)
      // This runs in the background and doesn't block visualization
      if (nextRaceWithStrategy?.regattaId && extraction.venue_id && user?.id) {
        setProcessingStatus({ step: 'complete', message: 'Predicting optimal course...' });

        try {
          const predictionAgent = new CoursePredictionAgent();
          const predictionResult = await predictionAgent.getCoursePrediction(
            nextRaceWithStrategy.regattaId, // raceId
            user.id, // userId for caching
            {
              regattaId: nextRaceWithStrategy.regattaId,
              venueId: extraction.venue_id,
              clubId: extraction.club_id,
              raceDate: nextRaceWithStrategy.startTime || new Date().toISOString(),
            }
          );

          setCoursePrediction(predictionResult.prediction);
          setPredictionCacheInfo({
            cached: predictionResult.cached,
            cacheAge: predictionResult.cacheAge,
            accuracy: predictionResult.accuracy,
          });

          console.log(
            `✅ Course prediction ${predictionResult.cached ? 'loaded from cache' : 'generated'}:`,
            predictionResult.prediction
          );

          if (predictionResult.accuracy) {
            console.log(`📊 Historical prediction accuracy: ${predictionResult.accuracy}%`);
          }
        } catch (predictionError) {
          console.error('Course prediction failed (non-blocking):', predictionError);
          // Don't show error to user - this is optional enhancement
        }
      }

      // Success!
      setProcessingStatus({ step: 'complete', message: 'Processing complete!' });
      setIsProcessing(false);

      // Show visualization
      setTimeout(() => {
        setCurrentStep('visualize');
      }, 1000);

    } catch (error: any) {
      console.error('Document processing error:', error);
      setProcessingError(error.message || 'Unknown error occurred');
      setIsProcessing(false);
      setCurrentStep('upload');

      Alert.alert(
        'Processing Failed',
        error.message || 'Failed to process sailing instructions. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Generate race strategy using RaceStrategyEngine
   * Called after course extraction or manually from visualization modal
   */
  const handleGenerateStrategy = async () => {
    try {
      if (!extractedCourse?.marks || extractedCourse.marks.length === 0) {
        Alert.alert('No Course Data', 'Please upload and extract sailing instructions first.');
        return;
      }

      setIsProcessing(true);
      setProcessingError(null);
      setProcessingStatus({ step: 'strategy', message: 'Generating AI race strategy...' });
      setCurrentStep('extract'); // Show processing modal

      // Mock race conditions (in production, get from weather service or user input)
      const mockConditions = {
        wind: {
          speed: 12,
          direction: 45,
          forecast: {
            nextHour: { speed: 13, direction: 50 },
            nextThreeHours: { speed: 14, direction: 55 },
          },
          confidence: 0.85,
        },
        current: {
          speed: 0.5,
          direction: 180,
          tidePhase: 'ebb' as const,
        },
        waves: {
          height: 0.8,
          period: 4,
          direction: 90,
        },
        visibility: 10,
        temperature: 24,
        weatherRisk: 'low' as const,
      };

      // Mock sailing instructions text (in production, get from document)
      const instructionsText = extractedCourse.strategy?.summary || 'Standard windward-leeward course with gate finish.';

      // Generate comprehensive strategy using AI
      const strategy = await raceStrategyEngine.generateRaceStrategy(
        instructionsText,
        mockConditions,
        'hong-kong', // Default venue (in production, detect from GPS or user selection)
        {
          raceName: 'Race 1',
          fleetSize: 20,
          boatType: 'Dragon',
          importance: 'series',
        }
      );

      console.log('✅ Strategy generated:', strategy.id);
      setGeneratedStrategy(strategy);

      // Save strategy to database
      setProcessingStatus({ step: 'save', message: 'Saving strategy...' });

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data: savedStrategy, error: saveError } = await supabase
        .from('race_strategies')
        .insert({
          user_id: user.id,
          race_name: strategy.raceName,
          venue_id: strategy.venue.id,
          venue_name: strategy.venue.name,

          // Conditions
          wind_speed: strategy.conditions.wind.speed,
          wind_direction: strategy.conditions.wind.direction,
          current_speed: strategy.conditions.current.speed,
          current_direction: strategy.conditions.current.direction,
          wave_height: strategy.conditions.waves.height,

          // Strategy details
          overall_approach: strategy.strategy.overallApproach,
          start_strategy: strategy.strategy.startStrategy,
          beat_strategy: strategy.strategy.beatStrategy,
          run_strategy: strategy.strategy.runStrategy,
          finish_strategy: strategy.strategy.finishStrategy,
          mark_roundings: strategy.strategy.markRoundings,

          // Contingencies
          contingencies: strategy.contingencies,

          // Insights
          insights: strategy.insights,
          confidence: strategy.confidence,

          // Course data
          course_extraction: strategy.courseExtraction,
          course_marks: extractedCourse.marks,

          // Simulation results (already included in strategy)
          simulation_results: strategy.simulationResults,

          generated_at: strategy.generatedAt,
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving strategy:', saveError);
        throw new Error(`Failed to save strategy: ${saveError.message}`);
      }

      setSavedStrategyId(savedStrategy.id);
      setMonteCarloResults(strategy.simulationResults);

      setProcessingStatus({ step: 'complete', message: 'Strategy generation complete!' });
      setIsProcessing(false);

      // Show strategy modal
      setTimeout(() => {
        setCurrentStep('strategy');
      }, 1000);

    } catch (error: any) {
      console.error('Strategy generation error:', error);
      setProcessingError(error.message || 'Failed to generate strategy');
      setIsProcessing(false);

      Alert.alert(
        'Strategy Generation Failed',
        error.message || 'Failed to generate race strategy. Please try again.',
        [{ text: 'OK', onPress: () => setCurrentStep('visualize') }]
      );
    }
  };

  const renderQuickActions = () => (
    <View className="absolute bottom-6 left-4 right-4">
      <View className="bg-white rounded-2xl shadow-lg p-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold">Quick Actions</Text>
          <TouchableOpacity onPress={() => setShowQuickActions(!showQuickActions)}>
            <X color="#6B7280" size={20} />
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <TouchableOpacity
            className="bg-blue-600 flex-1 min-w-[45%] py-3 rounded-lg items-center"
            onPress={() => setCurrentStep('upload')}
          >
            <Upload color="white" size={20} />
            <Text className="text-white font-bold mt-1">Upload Docs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-purple-600 flex-1 min-w-[45%] py-3 rounded-lg items-center"
            onPress={() => setCurrentStep('strategy')}
          >
            <Sparkles color="white" size={20} />
            <Text className="text-white font-bold mt-1">AI Strategy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-green-600 flex-1 min-w-[45%] py-3 rounded-lg items-center"
            onPress={() => setCurrentStep('race')}
          >
            <Play color="white" size={20} />
            <Text className="text-white font-bold mt-1">Race Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-orange-600 flex-1 min-w-[45%] py-3 rounded-lg items-center"
            onPress={() => setCurrentStep('analysis')}
          >
            <BarChart2 color="white" size={20} />
            <Text className="text-white font-bold mt-1">Analysis</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // PHASE 3: Document Upload Modal
  const renderUploadModal = () => (
    <Modal
      visible={currentStep === 'upload'}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setCurrentStep('map')}
    >
      <View className="flex-1 bg-gray-50">
        <View className="bg-blue-600 pt-12 pb-4 px-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-xl font-bold">Upload Sailing Instructions</Text>
            <TouchableOpacity onPress={() => setCurrentStep('map')} className="bg-blue-700 p-2 rounded-full">
              <X color="white" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Upload Options */}
          <TouchableOpacity
            className="bg-white rounded-xl p-6 mb-4 shadow-sm"
            onPress={handleDocumentUpload}
            disabled={isProcessing}
          >
            <View className="items-center">
              <FileText color={isProcessing ? "#9CA3AF" : "#2563EB"} size={48} />
              <Text className="text-lg font-bold mt-3">Upload PDF</Text>
              <Text className="text-gray-600 text-center mt-1">
                Select sailing instructions from your device
              </Text>
              {isProcessing && (
                <ActivityIndicator size="small" color="#2563EB" className="mt-2" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white rounded-xl p-6 mb-4 shadow-sm">
            <View className="items-center">
              <Upload color="#2563EB" size={48} />
              <Text className="text-lg font-bold mt-3">Take Photo</Text>
              <Text className="text-gray-600 text-center mt-1">
                Capture notice board or printed instructions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white rounded-xl p-6 shadow-sm">
            <View className="items-center">
              <Map color="#2563EB" size={48} />
              <Text className="text-lg font-bold mt-3">Manual Entry</Text>
              <Text className="text-gray-600 text-center mt-1">
                Draw course marks directly on map
              </Text>
            </View>
          </TouchableOpacity>

          {/* Recent Documents */}
          <Text className="text-lg font-bold mt-6 mb-3">Recent Documents</Text>
          {[
            { name: 'RHKYC Spring Series - Sailing Instructions.pdf', date: '2 days ago', status: 'processed' },
            { name: 'Dragon World Championship NOR.pdf', date: '1 week ago', status: 'processed' },
          ].map((doc, index) => (
            <TouchableOpacity key={index} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-bold mb-1">{doc.name}</Text>
                  <Text className="text-gray-600 text-sm">{doc.date}</Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-green-800 text-xs font-bold">✓ Processed</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  // PHASE 3: AI Extraction Loading
  const renderExtractionModal = () => {
    const steps = [
      { key: 'upload', label: 'Document uploaded', completed: processingStatus.step !== 'upload' },
      { key: 'extract', label: 'Extracting course data', completed: ['visualize', 'strategy', 'save', 'complete'].includes(processingStatus.step) },
      { key: 'visualize', label: 'Generating 3D visualization', completed: ['strategy', 'save', 'complete'].includes(processingStatus.step) },
      { key: 'strategy', label: 'Analyzing race strategy', completed: ['save', 'complete'].includes(processingStatus.step) },
      { key: 'save', label: 'Saving to database', completed: processingStatus.step === 'complete' },
    ];

    return (
      <Modal visible={currentStep === 'extract'} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center p-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-md items-center">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
              {processingError ? (
                <AlertCircle color="#EF4444" size={40} />
              ) : (
                <Sparkles color="#2563EB" size={40} />
              )}
            </View>

            <Text className="text-2xl font-bold mb-2">
              {processingError ? 'Processing Failed' : 'AI Processing'}
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              {processingError || processingStatus.message}
            </Text>

            <View className="w-full space-y-3">
              {steps.map((step, index) => {
                const isActive = processingStatus.step === step.key;
                const isCompleted = step.completed;

                return (
                  <View key={step.key} className="flex-row items-center">
                    {isCompleted ? (
                      <CheckCircle color="#10B981" size={20} />
                    ) : isActive ? (
                      <ActivityIndicator size="small" color="#F59E0B" />
                    ) : (
                      <AlertCircle color="#9CA3AF" size={20} />
                    )}
                    <Text className={`ml-3 ${isCompleted ? 'text-gray-700' : isActive ? 'text-gray-700 font-semibold' : 'text-gray-500'}`}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {processingError && (
              <TouchableOpacity
                className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
                onPress={() => {
                  setProcessingError(null);
                  setCurrentStep('upload');
                }}
              >
                <Text className="text-white font-bold">Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // PHASE 4: 3D Visualization
  const renderVisualizationModal = () => (
    <Modal
      visible={currentStep === 'visualize'}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setCurrentStep('map')}
    >
      <View className="flex-1">
        <View className="bg-blue-600 pt-12 pb-4 px-4 z-10">
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-xl font-bold">Course Visualization</Text>
            <TouchableOpacity onPress={() => setCurrentStep('map')} className="bg-blue-700 p-2 rounded-full">
              <X color="white" size={20} />
            </TouchableOpacity>
          </View>
          <Text className="text-blue-200 mt-1">AI-extracted from sailing instructions</Text>
        </View>

        <CourseMapView courseMarks={courseMarks} prediction={coursePrediction} />

        <View className="absolute bottom-6 left-4 right-4">
          <View className="bg-white rounded-2xl shadow-lg p-4">
            {/* Course Prediction Card (if available) */}
            {coursePrediction && (
              <View className="bg-purple-50 p-3 rounded-lg mb-4 border border-purple-200">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Sparkles color="#9333EA" size={16} />
                    <Text className="font-bold text-purple-900 ml-2">AI Course Prediction</Text>
                  </View>
                  <View className="bg-purple-600 px-2 py-1 rounded">
                    <Text className="text-white text-xs font-bold">
                      {coursePrediction.prediction_confidence || coursePrediction.confidence || 0}% confident
                    </Text>
                  </View>
                </View>

                {/* Cache and Accuracy Indicators */}
                {predictionCacheInfo && (
                  <View className="flex-row items-center mb-2 gap-2">
                    {predictionCacheInfo.cached && (
                      <View className="bg-amber-100 px-2 py-1 rounded">
                        <Text className="text-amber-800 text-xs font-semibold">
                          📦 Cached {predictionCacheInfo.cacheAge}
                        </Text>
                      </View>
                    )}
                    {predictionCacheInfo.accuracy !== undefined && predictionCacheInfo.accuracy > 0 && (
                      <View className="bg-green-100 px-2 py-1 rounded">
                        <Text className="text-green-800 text-xs font-semibold">
                          📊 {predictionCacheInfo.accuracy}% accuracy
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <Text className="text-purple-800 text-sm mb-2">
                  {coursePrediction.prediction_reasoning || coursePrediction.reasoning || 'Analyzing weather patterns and course options...'}
                </Text>
                {coursePrediction.alternative_courses && coursePrediction.alternative_courses.length > 0 && (
                  <View className="mt-2 pt-2 border-t border-purple-200">
                    <Text className="text-xs font-bold text-purple-700 mb-1">Alternative Courses:</Text>
                    {coursePrediction.alternative_courses.slice(0, 2).map((alt: any, idx: number) => (
                      <Text key={idx} className="text-xs text-purple-700">
                        • {alt.course_name} ({alt.probability}%)
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            <Text className="font-bold mb-3">Course Summary</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Total Distance</Text>
              <Text className="font-bold">5.2 NM</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Estimated Time</Text>
              <Text className="font-bold">62 minutes</Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text className="text-gray-600">Course Type</Text>
              <Text className="font-bold">Windward-Leeward with Gate</Text>
            </View>

            <TouchableOpacity
              className="bg-blue-600 py-3 rounded-lg items-center"
              onPress={handleGenerateStrategy}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold">Generate Race Strategy →</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // PHASE 4: AI Strategy Generation
  const renderStrategyModal = () => {
    // Show loading state if no strategy generated yet
    if (!generatedStrategy) {
      return (
        <Modal
          visible={currentStep === 'strategy'}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setCurrentStep('map')}
        >
          <View className="flex-1 bg-gray-50 justify-center items-center p-6">
            <Sparkles color="#9333EA" size={64} />
            <Text className="text-xl font-bold mt-4">Generate Strategy First</Text>
            <Text className="text-gray-600 text-center mt-2">
              Upload sailing instructions and extract the course, then generate an AI-powered race strategy.
            </Text>
            <TouchableOpacity
              className="bg-purple-600 px-6 py-3 rounded-lg mt-6"
              onPress={() => setCurrentStep('visualize')}
            >
              <Text className="text-white font-bold">Go to Course Visualization</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      );
    }

    const { strategy, simulationResults } = generatedStrategy;

    return (
      <Modal
        visible={currentStep === 'strategy'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCurrentStep('map')}
      >
        <View className="flex-1 bg-gray-50">
          <View className="bg-purple-600 pt-12 pb-4 px-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-white text-xl font-bold">AI Race Strategy</Text>
              <TouchableOpacity onPress={() => setCurrentStep('map')} className="bg-purple-700 p-2 rounded-full">
                <X color="white" size={20} />
              </TouchableOpacity>
            </View>
            <Text className="text-purple-200 mt-1">
              Confidence: {Math.round(generatedStrategy.confidence * 100)}%
            </Text>
          </View>

          <ScrollView className="flex-1 p-4">
            {/* Course Prediction (if available) */}
            {coursePrediction && (
              <View className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Sparkles color="white" size={20} />
                    <Text className="text-white text-lg font-bold ml-2">Course Prediction</Text>
                  </View>
                  <View className="bg-white/20 px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">
                      {coursePrediction.prediction_confidence || coursePrediction.confidence || 0}% confident
                    </Text>
                  </View>
                </View>

                {coursePrediction.predicted_course_name && (
                  <View className="bg-white/10 rounded-lg p-3 mb-2">
                    <Text className="text-purple-100 text-xs mb-1">Most Likely Course</Text>
                    <Text className="text-white font-bold text-lg">{coursePrediction.predicted_course_name}</Text>
                  </View>
                )}

                <Text className="text-purple-100 mb-3">
                  {coursePrediction.prediction_reasoning || coursePrediction.reasoning || 'Based on forecasted wind conditions and venue patterns'}
                </Text>

                {coursePrediction.forecast_wind_direction && coursePrediction.forecast_wind_speed && (
                  <View className="flex-row items-center bg-white/10 rounded-lg p-2 mb-2">
                    <Wind color="white" size={16} />
                    <Text className="text-white text-sm ml-2">
                      Forecast: {Math.round(coursePrediction.forecast_wind_speed)}kt @ {Math.round(coursePrediction.forecast_wind_direction)}°
                    </Text>
                  </View>
                )}

                {coursePrediction.alternative_courses && coursePrediction.alternative_courses.length > 0 && (
                  <View className="bg-white/10 rounded-lg p-3 mt-2">
                    <Text className="text-white font-bold text-xs mb-2">Alternative Courses:</Text>
                    {coursePrediction.alternative_courses.map((alt: any, idx: number) => (
                      <View key={idx} className="flex-row justify-between items-center mb-1">
                        <Text className="text-purple-100 text-sm">{alt.course_name}</Text>
                        <View className="bg-white/20 px-2 py-0.5 rounded">
                          <Text className="text-white text-xs font-bold">{alt.probability}%</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Overall Approach */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-lg font-bold mb-3">Overall Approach</Text>
              <Text className="text-gray-700">{strategy.overallApproach}</Text>
            </View>

            {/* Start Strategy */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-lg font-bold mb-3">Start Strategy</Text>
              <View className="bg-purple-50 p-3 rounded-lg mb-2">
                <Text className="font-bold text-purple-800 mb-1">
                  {strategy.startStrategy.priority === 'critical' ? '⚡' : '→'} {strategy.startStrategy.action}
                </Text>
                <Text className="text-gray-700 mb-2">{strategy.startStrategy.rationale}</Text>
                <Text className="text-sm text-gray-600">
                  Risk Level: {strategy.startStrategy.riskLevel}
                </Text>
              </View>
              {strategy.startStrategy.alternatives && strategy.startStrategy.alternatives.length > 0 && (
                <View className="bg-gray-50 p-3 rounded-lg">
                  <Text className="font-medium text-gray-700 mb-1">Alternatives:</Text>
                  {strategy.startStrategy.alternatives.map((alt: string, idx: number) => (
                    <Text key={idx} className="text-gray-600 text-sm">• {alt}</Text>
                  ))}
                </View>
              )}
            </View>

            {/* Beat Strategy */}
            {strategy.beatStrategy.length > 0 && (
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <Text className="text-lg font-bold mb-3">Upwind Tactics</Text>
                {strategy.beatStrategy.map((tactic: any, idx: number) => (
                  <View key={idx} className="bg-blue-50 p-3 rounded-lg mb-2">
                    <Text className="font-bold text-blue-800 mb-1">{tactic.action}</Text>
                    <Text className="text-gray-700">{tactic.rationale}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Downwind Strategy */}
            {strategy.runStrategy.length > 0 && (
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <Text className="text-lg font-bold mb-3">Downwind Tactics</Text>
                {strategy.runStrategy.map((tactic: any, idx: number) => (
                  <View key={idx} className="bg-green-50 p-3 rounded-lg mb-2">
                    <Text className="font-bold text-green-800 mb-1">{tactic.action}</Text>
                    <Text className="text-gray-700">{tactic.rationale}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Monte Carlo Simulation Results */}
            {simulationResults && (
              <View className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 mb-4">
                <Text className="text-white text-lg font-bold mb-3">📊 Monte Carlo Simulation</Text>
                <Text className="text-purple-100 mb-4">
                  Based on {simulationResults.totalIterations || 1000} race simulations
                </Text>

                <View className="bg-white/10 rounded-lg p-3 mb-3">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-white">Expected Finish:</Text>
                    <Text className="text-white font-bold">
                      {Math.round(simulationResults.averageFinish || 0)}th
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-white">Win Probability:</Text>
                    <Text className="text-white font-bold">
                      {Math.round((simulationResults.winProbability || 0) * 100)}%
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-white">Podium Probability:</Text>
                    <Text className="text-white font-bold">
                      {Math.round((simulationResults.topThreeProbability || 0) * 100)}%
                    </Text>
                  </View>
                </View>

                {simulationResults.keyRiskFactors && simulationResults.keyRiskFactors.length > 0 && (
                  <View className="bg-white/10 rounded-lg p-3">
                    <Text className="text-white font-bold mb-2">⚠️ Key Risk Factors:</Text>
                    {simulationResults.keyRiskFactors.map((risk: string, idx: number) => (
                      <Text key={idx} className="text-purple-100 text-sm">• {risk}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Save/Share Options */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-lg font-bold mb-3">Strategy Options</Text>
              <TouchableOpacity className="bg-blue-600 py-3 rounded-lg items-center mb-2">
                <Text className="text-white font-bold">Save to Race Day</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-gray-200 py-3 rounded-lg items-center">
                <Text className="text-gray-800 font-bold">Share with Crew</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // PHASE 6: Race Day Mode (Simplified for now)
  const renderRaceModal = () => (
    <Modal
      visible={currentStep === 'race'}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setCurrentStep('map')}
    >
      <View className="flex-1 bg-gray-900">
        <View className="bg-green-600 pt-12 pb-4 px-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-xl font-bold">Race Day Tactical</Text>
            <TouchableOpacity onPress={() => setCurrentStep('map')} className="bg-green-700 p-2 rounded-full">
              <X color="white" size={20} />
            </TouchableOpacity>
          </View>
          <Text className="text-green-200 mt-1">Live tactical guidance</Text>
        </View>

        <View className="flex-1 items-center justify-center p-6">
          <Play color="#10B981" size={64} />
          <Text className="text-white text-2xl font-bold mt-4 mb-2">Race Mode</Text>
          <Text className="text-gray-400 text-center">
            Live tactical overlay, real-time wind updates, and strategic guidance during the race
          </Text>
          <TouchableOpacity className="bg-green-600 px-6 py-3 rounded-lg mt-6">
            <Text className="text-white font-bold">Start Race Timer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // PHASE 7: Post-Race Analysis
  const renderAnalysisModal = () => (
    <Modal
      visible={currentStep === 'analysis'}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setCurrentStep('map')}
    >
      <View className="flex-1 bg-gray-50">
        <View className="bg-orange-600 pt-12 pb-4 px-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-xl font-bold">Post-Race Analysis</Text>
            <TouchableOpacity onPress={() => setCurrentStep('map')} className="bg-orange-700 p-2 rounded-full">
              <X color="white" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold mb-3">Performance Overview</Text>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600">Final Position</Text>
              <Text className="text-2xl font-bold text-blue-600">3rd</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600">VMG Efficiency</Text>
              <Text className="font-bold text-green-600">92%</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Strategy Execution</Text>
              <Text className="font-bold text-purple-600">85%</Text>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-bold mb-3">AI Insights</Text>
            <View className="bg-blue-50 p-3 rounded-lg mb-2">
              <Text className="font-bold text-blue-800 mb-1">✓ Start execution: Excellent</Text>
              <Text className="text-gray-700">Pin-end start gained 3 boat lengths</Text>
            </View>
            <View className="bg-yellow-50 p-3 rounded-lg mb-2">
              <Text className="font-bold text-yellow-800 mb-1">⚠ First beat: Lost position</Text>
              <Text className="text-gray-700">Tacked 3 times more than fleet average</Text>
            </View>
            <View className="bg-green-50 p-3 rounded-lg">
              <Text className="font-bold text-green-800 mb-1">✓ Downwind: Strong</Text>
              <Text className="text-gray-700">Gained 2 positions with gate choice</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Loading state
  if (racesLoading || docsLoading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-4">Loading race data...</Text>
      </View>
    );
  }

  // Error state
  if (racesError) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center px-6">
        <AlertCircle color="#EF4444" size={48} />
        <Text className="text-gray-800 text-lg font-semibold mt-4">Failed to load race data</Text>
        <Text className="text-gray-600 mt-2 text-center">{racesError}</Text>
      </View>
    );
  }

  // Show course map even if no races, but with appropriate empty states
  const hasNoCourseData = courseMarks.length === 0;
  const hasNoRaces = races.length === 0;

  if (hasNoRaces && hasNoCourseData) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-blue-600 pt-12 pb-4 px-4">
          <Text className="text-white text-2xl font-bold">Race Course</Text>
          <Text className="text-blue-200">AI-powered course visualization & strategy</Text>
        </View>
        <EmptyState
          variant="zero"
          icon={Map}
          title="No races yet"
          message="Upload sailing instructions to extract course data and generate AI strategy"
          actionLabel="Upload Documents"
          onAction={() => setCurrentStep('upload')}
        />
      </View>
    );
  }

  if (!hasNoRaces && hasNoCourseData) {
    // Has races but no course data - show prompt to upload documents
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-blue-600 pt-12 pb-4 px-4">
          <Text className="text-white text-2xl font-bold">Race Course</Text>
          <Text className="text-blue-200">You have {races.length} race(s) scheduled</Text>
        </View>
        <EmptyState
          variant="zero"
          icon={FileText}
          title="No course data extracted"
          message="Upload sailing instructions for your races to visualize the course and get AI-powered strategy"
          actionLabel="Upload Sailing Instructions"
          onAction={() => setCurrentStep('upload')}
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Main Map View */}
      <CourseMapView
        courseMarks={courseMarks}
        prediction={coursePrediction}
        onMarkPress={(mark) => {
          console.log('Mark pressed:', mark);
        }}
      />

      {/* Quick Actions */}
      {showQuickActions && currentStep === 'map' && renderQuickActions()}

      {/* Workflow Modals */}
      {renderUploadModal()}
      {renderExtractionModal()}
      {renderVisualizationModal()}
      {renderStrategyModal()}
      {renderRaceModal()}
      {renderAnalysisModal()}
    </View>
  );
}
