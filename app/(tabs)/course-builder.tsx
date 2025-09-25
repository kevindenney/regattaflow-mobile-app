import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { DocumentProcessingService } from '../../src/services/ai/DocumentProcessingService';

interface Document {
  id: string;
  name: string;
  uri: string;
  type: string;
  size?: number;
  uploadedAt: Date;
}

export default function CourseBuilderScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [documentProcessor] = useState(() => new DocumentProcessingService());

  const handleDocumentPick = async () => {
    try {
      setIsUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const newDocument: Document = {
          id: Date.now().toString(),
          name: file.name,
          uri: file.uri,
          type: file.mimeType || 'unknown',
          size: file.size,
          uploadedAt: new Date(),
        };

        setDocuments(prev => [...prev, newDocument]);
        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraPick = async () => {
    try {
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos of sailing instructions.');
        return;
      }

      setIsUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];
        const newDocument: Document = {
          id: Date.now().toString(),
          name: `Photo_${new Date().toISOString().split('T')[0]}.jpg`,
          uri: image.uri,
          type: 'image/jpeg',
          size: image.fileSize,
          uploadedAt: new Date(),
        };

        setDocuments(prev => [...prev, newDocument]);
        Alert.alert('Success', 'Photo captured successfully!');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const processDocument = async (document: Document) => {
    try {
      Alert.alert('Processing...', 'AI is parsing your sailing instructions. This may take a moment.');

      // Read the document file
      const fileInfo = await FileSystem.getInfoAsync(document.uri);
      if (!fileInfo.exists) {
        throw new Error('Document file not found');
      }

      // Read file as base64
      const fileContent = await FileSystem.readAsStringAsync(document.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert to ArrayBuffer
      const binaryString = atob(fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Prepare document upload
      const documentUpload = {
        filename: document.name,
        type: document.type.startsWith('image/') ? 'image' as const : 'pdf' as const,
        data: bytes.buffer as ArrayBuffer
      };

      // Process with AI
      const analysis = await documentProcessor.uploadDocument(documentUpload);

      Alert.alert(
        'Parsing Complete!',
        `Successfully analyzed ${document.name}\n\n` +
        `Document Type: ${analysis.documentClass}\n` +
        `Key Insights: ${analysis.insights.length}\n\n` +
        `${analysis.summary}\n\n` +
        'Next: 3D course visualization will be implemented.'
      );

      console.log('Document analysis:', analysis);

    } catch (error) {
      console.error('Error processing document:', error);
      Alert.alert(
        'Processing Failed',
        'Unable to parse the sailing instructions. Please try again.\n\n' +
        (error instanceof Error ? error.message : 'Unknown error occurred')
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Course Builder</Text>
          <Text style={styles.subtitle}>Upload sailing instructions to build your race course</Text>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Upload Documents</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.uploadButton, styles.documentButton]}
              onPress={handleDocumentPick}
              disabled={isUploading}
            >
              <Ionicons name="document-text" size={24} color="#0066CC" />
              <Text style={styles.buttonText}>Choose File</Text>
              <Text style={styles.buttonSubtext}>PDF, Images</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.uploadButton, styles.cameraButton]}
              onPress={handleCameraPick}
              disabled={isUploading}
            >
              <Ionicons name="camera" size={24} color="#0066CC" />
              <Text style={styles.buttonText}>Take Photo</Text>
              <Text style={styles.buttonSubtext}>Sailing Instructions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {documents.length > 0 && (
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Uploaded Documents</Text>

            {documents.map((document) => (
              <View key={document.id} style={styles.documentCard}>
                <View style={styles.documentInfo}>
                  <Ionicons
                    name={document.type.startsWith('image/') ? 'image' : 'document'}
                    size={20}
                    color="#0066CC"
                  />
                  <View style={styles.documentDetails}>
                    <Text style={styles.documentName}>{document.name}</Text>
                    <Text style={styles.documentMeta}>
                      {document.size ? `${(document.size / 1024 / 1024).toFixed(2)} MB` : ''} •
                      {document.uploadedAt.toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.documentActions}>
                  <TouchableOpacity
                    style={styles.processButton}
                    onPress={() => processDocument(document)}
                  >
                    <Text style={styles.processButtonText}>Parse</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeDocument(document.id)}
                  >
                    <Ionicons name="trash" size={16} color="#FF6B35" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {documents.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No documents uploaded yet</Text>
            <Text style={styles.emptySubtext}>
              Upload sailing instructions to get started with AI course building
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  uploadSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  cameraButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#00A6FB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  buttonSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  documentsSection: {
    marginBottom: 24,
  },
  documentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  documentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: 12,
    color: '#999',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  processButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  processButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
});