// src/app/(tabs)/courses/new/upload.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Upload, Camera, FileText, Clock } from 'lucide-react-native';
import { Button, ButtonText, ButtonIcon } from '@/src/components/ui/button';

export default function UploadScreen() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [recentDocuments, setRecentDocuments] = useState([
    { id: '1', name: 'Notice of Race - Spring Regatta.pdf', date: '2 days ago' },
    { id: '2', name: 'Sailing Instructions - Winter Series.pdf', date: '1 week ago' },
  ]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        alert('Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handleContinue = () => {
    if (!selectedFile) return;

    // Pass file data to next screen via router params or context
    router.push({
      pathname: '/courses/new/processing',
      params: {
        fileName: selectedFile.name || 'photo.jpg',
        fileUri: selectedFile.uri,
      },
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Instructions */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <Text className="text-blue-900 font-semibold mb-2">
            Upload Sailing Instructions
          </Text>
          <Text className="text-blue-700 text-sm leading-relaxed">
            Upload a PDF of your sailing instructions or take a photo of the notice board.
            Our AI will extract the course layout, marks, and racing rules.
          </Text>
        </View>

        {/* Selected File Preview */}
        {selectedFile && (
          <View className="bg-white rounded-xl p-4 mb-4 border border-green-200">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-green-50 rounded-lg items-center justify-center mr-3">
                  <FileText size={24} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900" numberOfLines={1}>
                    {selectedFile.name || 'Photo'}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {selectedFile.size
                      ? `${(selectedFile.size / 1024).toFixed(0)} KB`
                      : 'Ready to process'
                    }
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedFile(null)}
                className="ml-2"
              >
                <Text className="text-red-600 font-semibold">Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Upload Options */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Choose Upload Method
          </Text>

          {/* PDF Upload */}
          <TouchableOpacity
            className="bg-white rounded-xl p-6 mb-4 active:bg-gray-50"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={handlePickDocument}
            accessibilityRole="button"
            accessibilityLabel="Upload PDF document"
          >
            <View className="flex-row items-center">
              <View className="w-14 h-14 bg-blue-50 rounded-full items-center justify-center mr-4">
                <Upload size={28} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 mb-1">
                  Upload PDF
                </Text>
                <Text className="text-sm text-gray-600">
                  Select sailing instructions from your files
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Photo Capture */}
          <TouchableOpacity
            className="bg-white rounded-xl p-6 mb-4 active:bg-gray-50"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={handleTakePhoto}
            accessibilityRole="button"
            accessibilityLabel="Take photo of notice board"
          >
            <View className="flex-row items-center">
              <View className="w-14 h-14 bg-purple-50 rounded-full items-center justify-center mr-4">
                <Camera size={28} color="#7C3AED" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 mb-1">
                  Take Photo
                </Text>
                <Text className="text-sm text-gray-600">
                  Capture notice board or printed instructions
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Manual Entry - Future Feature */}
          <TouchableOpacity
            className="bg-white rounded-xl p-6 opacity-50"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
            disabled
          >
            <View className="flex-row items-center">
              <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center mr-4">
                <FileText size={28} color="#9CA3AF" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-400 mb-1">
                  Manual Entry
                </Text>
                <Text className="text-sm text-gray-400">
                  Coming soon - Enter course details manually
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Documents */}
        {recentDocuments.length > 0 && !selectedFile && (
          <View>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Recent Documents
            </Text>
            {recentDocuments.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                className="bg-white rounded-lg p-4 mb-2 flex-row items-center"
                onPress={() => {
                  // Load recent document
                  setSelectedFile({ name: doc.name, uri: `cached://${doc.id}` });
                }}
              >
                <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
                  <FileText size={20} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900" numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <View className="flex-row items-center mt-0.5">
                    <Clock size={12} color="#9CA3AF" />
                    <Text className="text-xs text-gray-500 ml-1">{doc.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="bg-white border-t border-gray-200 p-4">
        <Button
          action="primary"
          variant="solid"
          size="lg"
          className="w-full"
          onPress={handleContinue}
          disabled={!selectedFile}
          accessibilityLabel="Continue to processing"
        >
          <ButtonText>Continue</ButtonText>
          <ButtonIcon as={Upload} />
        </Button>

        {!selectedFile && (
          <Text className="text-center text-gray-500 text-sm mt-3">
            Select a document to continue
          </Text>
        )}
      </View>
    </View>
  );
}
