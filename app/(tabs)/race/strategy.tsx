import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { Image } from '@/components/ui';
import {
  Wind,
  Thermometer,
  Eye,
  Waves,
  Navigation,
  Clock,
  MapPin,
  Users,
  Calendar,
  ChevronRight,
  Play,
  Flag,
  Anchor,
  Zap,
  CloudRain,
  Sun,
  Moon,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Edit
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { DocumentProcessingAgent } from '@/services/agents/DocumentProcessingAgent';
import { PDFExtractionService } from '@/services/PDFExtractionService';
import { PDFExtractionProgress, PDFTextPreview } from '@/components/documents';
import { TimeBasedEnvironmentalVisualization } from '@/components/race-strategy';
import { SmartRaceCoach } from '@/components/coaching/SmartRaceCoach';
import { QuickSkillButtons } from '@/components/coaching/QuickSkillButtons';

const RaceStrategyScreen = () => {
  const [activeTab, setActiveTab] = useState('strategy');

  // AI Document Processing State
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [documentResults, setDocumentResults] = useState<any>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // PDF Extraction State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionPage, setExtractionPage] = useState(0);
  const [extractionTotalPages, setExtractionTotalPages] = useState(0);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extractedFileName, setExtractedFileName] = useState<string>('');
  const [showTextPreview, setShowTextPreview] = useState(false);
  
  // Mock data for weather conditions
  const weatherData = {
    windSpeed: '12-15 knots',
    windDirection: 'NW',
    temperature: '22°C',
    visibility: '10 km',
    waveHeight: '1.2m',
    tide: 'High at 14:30'
  };

  // Mock data for crew assignments
  const crewAssignments = [
    { id: 1, name: 'Alex Morgan', role: 'Skipper', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dXNlcnxlbnwwfHwwfHx8MA%3D%3D' },
    { id: 2, name: 'Jamie Smith', role: 'Navigator', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fHVzZXJ8ZW58MHx8MHx8fDA%3D' },
    { id: 3, name: 'Taylor Johnson', role: 'Tactician', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fHVzZXJ8ZW58MHx8MHx8fDA%3D' },
    { id: 4, name: 'Jordan Lee', role: 'Trimmer', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fHVzZXJ8ZW58MHx8MHx8fDA%3D' }
  ];

  // Mock data for strategy points
  const strategyPoints = [
    { id: 1, title: 'Start Line Approach', description: 'Approach from the committee boat side with 2 boat lengths clearance', time: '08:45' },
    { id: 2, title: 'First Beat', description: 'Sail at 45° to windward mark, avoid other boats', time: '09:00' },
    { id: 3, title: 'Upwind Strategy', description: 'Tack on shifts, stay in pressure', time: '09:30' },
    { id: 4, title: 'Downwind', description: 'Bear away to gybe angles, maximize VMG', time: '10:15' },
    { id: 5, title: 'Final Approach', description: 'Set spinnaker early, avoid overstanding', time: '11:00' }
  ];

  // Handle document upload and AI processing
  const handleDocumentUpload = async () => {
    try {
      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setExtractedFileName(file.name);

      // Extract text based on file type
      let documentText = '';

      if (file.mimeType === 'text/plain') {
        // Plain text - direct read
        documentText = await FileSystem.readAsStringAsync(file.uri);
        setExtractedText(documentText);
        setShowTextPreview(true);
      } else if (file.mimeType === 'application/pdf') {
        // PDF - use extraction service
        setIsExtracting(true);
        setExtractionProgress(0);

        const extractionResult = await PDFExtractionService.extractText(file.uri, {
          onProgress: (progress, currentPage, totalPages) => {
            setExtractionProgress(progress);
            setExtractionPage(currentPage);
            setExtractionTotalPages(totalPages);
          },
          maxPages: 50, // Limit to first 50 pages
        });

        setIsExtracting(false);

        if (extractionResult.success && extractionResult.text) {
          setExtractedText(extractionResult.text);
          setShowTextPreview(true);
        } else {
          Alert.alert(
            'Extraction Failed',
            extractionResult.error || 'Could not extract text from PDF. Please try a different file or use the web version.'
          );
        }
      } else if (file.mimeType?.startsWith('image/')) {
        // Image - would need OCR (future enhancement)
        Alert.alert(
          'Image Processing',
          'Image OCR is not yet implemented. Please upload a PDF or text file.'
        );
      } else {
        Alert.alert('Unsupported File Type', 'Please upload a PDF or text file.');
      }
    } catch (error: any) {
      setIsExtracting(false);
      setIsProcessingDocument(false);
      Alert.alert('Error', error.message || 'Failed to upload document');
    }
  };

  // Process extracted text with AI
  const handleProcessExtractedText = async () => {
    if (!extractedText) return;

    try {
      setShowTextPreview(false);
      setIsProcessingDocument(true);

      // Call DocumentProcessingAgent
      const agent = new DocumentProcessingAgent();
      const agentResult = await agent.processSailingInstructions(
        extractedText,
        extractedFileName,
        'Hong Kong Victoria Harbor' // venue hint
      );


      setIsProcessingDocument(false);

      if (agentResult.success) {
        setDocumentResults(agentResult.result);
        setShowResultsModal(true);
      } else {
        Alert.alert('Processing Failed', agentResult.error || 'Could not process document');
      }
    } catch (error: any) {
      setIsProcessingDocument(false);
      Alert.alert('Error', error.message || 'Failed to process document');
    }
  };

  // Cancel text preview
  const handleCancelPreview = () => {
    setShowTextPreview(false);
    setExtractedText(null);
    setExtractedFileName('');
  };

  // Handle manual adjustment of AI results
  const handleManualAdjust = () => {
    setShowResultsModal(false);
    Alert.alert('Manual Adjustment', 'Manual course editing feature coming soon!');
  };

  // Approve and use AI results
  const handleApproveResults = () => {
    setShowResultsModal(false);
    Alert.alert('Success', 'Race course data saved! You can now use it for strategy planning.');
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 p-4 pt-12 pb-6">
        <Text className="text-white text-2xl font-bold">Race Strategy</Text>
        <Text className="text-blue-100 mt-1">Plan and execute your race tactics</Text>
      </View>

      {/* Event Info Card */}
      <View className="bg-white m-4 rounded-xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row items-center mb-3">
          <View className="bg-blue-100 p-2 rounded-lg">
            <Calendar color="#2563EB" size={20} />
          </View>
          <Text className="text-gray-800 font-bold text-lg ml-3">Annual Regatta Challenge</Text>
        </View>
        
        <View className="flex-row items-center mb-2 ml-1">
          <MapPin color="#6B7280" size={18} />
          <Text className="text-gray-600 ml-2">Marina Bay Yacht Club</Text>
        </View>
        
        <View className="flex-row items-center ml-1">
          <Clock color="#6B7280" size={18} />
          <Text className="text-gray-600 ml-2">June 15, 2023 • 09:00 AM</Text>
        </View>
      </View>

      {/* Weather Summary */}
      <View className="mx-4 mb-4">
        <View className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-4 shadow-md">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-lg font-bold">Current Conditions</Text>
              <Text className="text-blue-100 mt-1">Updated 10 minutes ago</Text>
            </View>
            <Sun color="#FCD34D" size={32} />
          </View>
          
          <View className="flex-row mt-4 justify-between">
            <View className="flex-row items-center">
              <Wind color="white" size={20} />
              <Text className="text-white ml-2 font-medium">{weatherData.windSpeed}</Text>
              <Text className="text-blue-100 ml-1">NW</Text>
            </View>
            
            <View className="flex-row items-center">
              <Thermometer color="white" size={20} />
              <Text className="text-white ml-2 font-medium">{weatherData.temperature}</Text>
            </View>
            
            <View className="flex-row items-center">
              <Eye color="white" size={20} />
              <Text className="text-white ml-2 font-medium">{weatherData.visibility}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row bg-white mx-4 rounded-xl p-1 mb-4 shadow-sm">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'strategy' ? 'bg-blue-100' : ''}`}
          onPress={() => setActiveTab('strategy')}
        >
          <Text className={`font-bold text-xs ${activeTab === 'strategy' ? 'text-blue-600' : 'text-gray-500'}`}>Strategy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'crew' ? 'bg-blue-100' : ''}`}
          onPress={() => setActiveTab('crew')}
        >
          <Text className={`font-bold text-xs ${activeTab === 'crew' ? 'text-blue-600' : 'text-gray-500'}`}>Crew</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'course' ? 'bg-blue-100' : ''}`}
          onPress={() => setActiveTab('course')}
        >
          <Text className={`font-bold text-xs ${activeTab === 'course' ? 'text-blue-600' : 'text-gray-500'}`}>Course</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'environment' ? 'bg-blue-100' : ''}`}
          onPress={() => setActiveTab('environment')}
        >
          <Text className={`font-bold text-xs ${activeTab === 'environment' ? 'text-blue-600' : 'text-gray-500'}`}>Environment</Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {activeTab === 'strategy' && (
          <View>
            {/* AI Document Upload */}
            <View className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-4 mb-4 shadow-md">
              <View className="flex-row items-center mb-2">
                <FileText color="white" size={24} />
                <Text className="text-white font-bold text-lg ml-3">AI Document Processing</Text>
              </View>
              <Text className="text-white/90 mb-4">
                Upload sailing instructions and let AI extract race course, marks, and strategy
              </Text>
              <TouchableOpacity
                className="flex-row items-center justify-center bg-white p-3 rounded-lg"
                onPress={handleDocumentUpload}
                disabled={isProcessingDocument || isExtracting}
              >
                {isProcessingDocument ? (
                  <ActivityIndicator color="#2563EB" />
                ) : (
                  <>
                    <Upload color="#2563EB" size={20} />
                    <Text className="text-blue-600 font-bold ml-2">Upload Sailing Instructions</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* PDF Extraction Progress */}
            {isExtracting && (
              <View className="mb-4">
                <PDFExtractionProgress
                  progress={extractionProgress}
                  currentPage={extractionPage}
                  totalPages={extractionTotalPages}
                  fileName={extractedFileName}
                />
              </View>
            )}

            {/* Text Preview Modal */}
            {showTextPreview && extractedText && (
              <View className="mb-4">
                <PDFTextPreview
                  text={extractedText}
                  fileName={extractedFileName}
                  pages={extractionTotalPages}
                  onApprove={handleProcessExtractedText}
                  onCancel={handleCancelPreview}
                />
              </View>
            )}

            {/* AI Coach - Quick Skill Buttons */}
            <View className="mb-4">
              <QuickSkillButtons
                raceData={{
                  name: 'Next Race',
                  startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                }}
                onSkillInvoked={(skillId, advice) => {
                  console.log('Strategy screen - Skill invoked:', skillId, advice);
                }}
              />
            </View>

            {/* AI Coach - Smart Race Coach */}
            <View className="mb-4">
              <SmartRaceCoach
                raceId="strategy-planning"
                raceData={{
                  name: 'Race Strategy Planning',
                  startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                }}
                autoRefresh={true}
              />
            </View>

            {/* Strategy Overview */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Navigation color="#2563EB" size={20} />
                </View>
                <Text className="text-gray-800 font-bold text-lg ml-3">Tactical Plan</Text>
              </View>

              <Text className="text-gray-600 mb-4">
                Optimal strategy based on current conditions and previous race data.
                Focus on clean starts and efficient mark roundings.
              </Text>

              <TouchableOpacity className="flex-row items-center bg-blue-50 p-3 rounded-lg">
                <Play color="#2563EB" size={20} />
                <Text className="text-blue-600 font-bold ml-2">View Tactical Video</Text>
              </TouchableOpacity>
            </View>
            
            {/* Strategy Points */}
            <View className="mb-4">
              <Text className="text-gray-800 text-lg font-bold mb-3">Execution Plan</Text>
              
              {strategyPoints.map((point, index) => (
                <View 
                  key={point.id} 
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                >
                  <View className="flex-row items-start">
                    <View className="bg-blue-100 w-8 h-8 rounded-full items-center justify-center mt-1">
                      <Text className="text-blue-600 font-bold">{index + 1}</Text>
                    </View>
                    
                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-gray-800 font-bold">{point.title}</Text>
                        <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-full">
                          <Clock color="#6B7280" size={14} />
                          <Text className="text-gray-600 text-xs ml-1">{point.time}</Text>
                        </View>
                      </View>
                      
                      <Text className="text-gray-600 mt-2">{point.description}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {activeTab === 'crew' && (
          <View>
            {/* Crew Assignments */}
            <View className="mb-4">
              <Text className="text-gray-800 text-lg font-bold mb-3">Crew Assignments</Text>
              
              {crewAssignments.map((member) => (
                <View 
                  key={member.id} 
                  className="bg-white rounded-xl p-4 mb-3 flex-row shadow-sm border border-gray-100"
                >
                  <Image 
                    source={{ uri: member.avatar }} 
                    className="w-14 h-14 rounded-full"
                  />
                  
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-800 font-bold text-base">{member.name}</Text>
                    <Text className="text-blue-600 font-medium">{member.role}</Text>
                    
                    <View className="flex-row mt-2">
                      <TouchableOpacity className="bg-green-100 px-3 py-1 rounded-full mr-2">
                        <Text className="text-green-700 text-xs font-bold">CONFIRMED</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity className="bg-blue-100 px-3 py-1 rounded-full">
                        <Text className="text-blue-700 text-xs font-bold">VIEW DUTIES</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <TouchableOpacity>
                    <ChevronRight color="#6B7280" size={20} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            {/* Communication Plan */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Users color="#2563EB" size={20} />
                </View>
                <Text className="text-gray-800 font-bold text-lg ml-3">Communication</Text>
              </View>
              
              <Text className="text-gray-600 mb-3">
                Establish clear communication protocols before race start:
              </Text>
              
              <View className="ml-2">
                <Text className="text-gray-700 mb-1">• Pre-race briefing at 08:00 AM</Text>
                <Text className="text-gray-700 mb-1">• Radio check on channel 16</Text>
                <Text className="text-gray-700">• Emergency signals: 3 short blasts</Text>
              </View>
            </View>
          </View>
        )}
        
        {activeTab === 'course' && (
          <View>
            {/* Course Overview */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Flag color="#2563EB" size={20} />
                </View>
                <Text className="text-gray-800 font-bold text-lg ml-3">Course Layout</Text>
              </View>
              
              <View className="items-center my-4">
                <View className="bg-gray-200 border-2 border-dashed rounded-xl w-64 h-48 items-center justify-center">
                  <Text className="text-gray-500">Course Diagram</Text>
                  <Text className="text-gray-400 text-sm mt-2">Triangle & Run Course</Text>
                </View>
              </View>
              
              <View className="flex-row justify-between mt-4">
                <View className="items-center">
                  <Anchor color="#2563EB" size={24} />
                  <Text className="text-gray-600 mt-1 text-center">Start Line</Text>
                </View>
                
                <View className="items-center">
                  <Flag color="#10B981" size={24} />
                  <Text className="text-gray-600 mt-1 text-center">Windward Mark</Text>
                </View>
                
                <View className="items-center">
                  <Zap color="#F59E0B" size={24} />
                  <Text className="text-gray-600 mt-1 text-center">Leeward Gate</Text>
                </View>
                
                <View className="items-center">
                  <Flag color="#EF4444" size={24} />
                  <Text className="text-gray-600 mt-1 text-center">Finish Line</Text>
                </View>
              </View>
            </View>
            
            {/* Mark Information */}
            <View className="mb-4">
              <Text className="text-gray-800 text-lg font-bold mb-3">Mark Details</Text>
              
              <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-800 font-bold">Windward Mark</Text>
                  <Text className="text-blue-600 font-bold">Port Rounding</Text>
                </View>
                <Text className="text-gray-600 mt-1">Orange flag with red top mark</Text>
              </View>
              
              <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-800 font-bold">Leeward Gate</Text>
                  <Text className="text-blue-600 font-bold">Either Mark</Text>
                </View>
                <Text className="text-gray-600 mt-1">Yellow flags, choose either side</Text>
              </View>
              
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-800 font-bold">Finish Line</Text>
                  <Text className="text-blue-600 font-bold">Cross Between Marks</Text>
                </View>
                <Text className="text-gray-600 mt-1">White and red pennants</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'environment' && (
          <View>
            {/* Environmental Forecast Section */}
            <TimeBasedEnvironmentalVisualization
              venue={{
                id: 'rhkyc-clearwater',
                name: 'Royal Hong Kong Yacht Club - Clearwater Bay',
                coordinates: { lat: 22.2650, lng: 114.2620 },
                region: 'asia-pacific' as const,
                country: 'HK'
              }}
              racingArea={{
                type: 'Polygon',
                coordinates: [[
                  [114.2600, 22.2630], // Southwest
                  [114.2640, 22.2630], // Southeast
                  [114.2640, 22.2670], // Northeast
                  [114.2600, 22.2670], // Northwest
                  [114.2600, 22.2630], // Close polygon
                ]]
              }}
              startTime={new Date('2023-06-15T09:00:00')} // Race start time from mock data
              forecastDuration={24}
              enableOfflineCache={true}
              cacheZoomLevels={[8, 9, 10, 11, 12]}
              onLayersUpdate={(layers) => {

              }}
            />
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      <View className="p-4 bg-white border-t border-gray-100">
        <TouchableOpacity className="bg-blue-600 rounded-xl py-4 items-center shadow-md">
          <Text className="text-white font-bold text-lg">Finalize Strategy</Text>
        </TouchableOpacity>
      </View>

      {/* AI Results Modal */}
      <Modal
        visible={showResultsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <CheckCircle color="#10B981" size={28} />
                <Text className="text-gray-800 font-bold text-xl ml-3">AI Extraction Complete</Text>
              </View>
              <TouchableOpacity onPress={() => setShowResultsModal(false)}>
                <Text className="text-gray-500 text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Confidence Score */}
            {documentResults?.confidence && (
              <View className="bg-green-50 rounded-lg p-3 mb-4">
                <Text className="text-green-800 font-medium">
                  Confidence: {(documentResults.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            )}

            <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
              {/* Extracted Course Data */}
              {documentResults?.extraction && (
                <View className="mb-4">
                  <Text className="text-gray-800 font-bold text-lg mb-2">Race Course</Text>
                  <View className="bg-gray-50 rounded-lg p-3">
                    <Text className="text-gray-700 mb-2">
                      <Text className="font-bold">Layout:</Text> {documentResults.extraction.courseLayout?.type || 'Unknown'}
                    </Text>
                    <Text className="text-gray-700">
                      <Text className="font-bold">Marks:</Text> {documentResults.extraction.marks?.length || 0} marks extracted
                    </Text>
                  </View>
                </View>
              )}

              {/* Extracted Marks */}
              {documentResults?.extraction?.marks && documentResults.extraction.marks.length > 0 && (
                <View className="mb-4">
                  <Text className="text-gray-800 font-bold text-lg mb-2">Course Marks</Text>
                  {documentResults.extraction.marks.map((mark: any, index: number) => (
                    <View key={index} className="bg-blue-50 rounded-lg p-3 mb-2">
                      <Text className="text-blue-900 font-bold">{mark.name}</Text>
                      {mark.coordinates && (
                        <Text className="text-blue-700 text-sm mt-1">
                          {mark.coordinates.lat.toFixed(4)}°N, {mark.coordinates.lng.toFixed(4)}°E
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* AI Analysis Summary */}
              {documentResults?.analysis && (
                <View className="mb-4">
                  <Text className="text-gray-800 font-bold text-lg mb-2">Strategic Analysis</Text>
                  <View className="bg-purple-50 rounded-lg p-3">
                    <Text className="text-purple-900">
                      {documentResults.analysis.startStrategy || 'AI is analyzing strategic recommendations...'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Agent Tools Used */}
              {documentResults?.toolsUsed && (
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2">
                    AI Tools Used: {documentResults.toolsUsed.length}
                  </Text>
                  <View className="flex-row flex-wrap">
                    {documentResults.toolsUsed.map((tool: string, index: number) => (
                      <View key={index} className="bg-gray-200 rounded-full px-3 py-1 mr-2 mb-2">
                        <Text className="text-gray-700 text-xs">{tool}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-xl py-3 items-center flex-row justify-center"
                onPress={handleManualAdjust}
              >
                <Edit color="#4B5563" size={20} />
                <Text className="text-gray-700 font-bold ml-2">Manual Adjust</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-blue-600 rounded-xl py-3 items-center flex-row justify-center"
                onPress={handleApproveResults}
              >
                <CheckCircle color="white" size={20} />
                <Text className="text-white font-bold ml-2">Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RaceStrategyScreen;