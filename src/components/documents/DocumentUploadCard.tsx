/**
 * Document Upload Card Component
 * Handles document upload and AI processing for sailing documents
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { documentStorageService } from '@/src/services/storage/DocumentStorageService';
import { DocumentProcessingService } from '@/src/services/ai/DocumentProcessingService';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import type { StoredDocument } from '@/src/services/storage/DocumentStorageService';
import type { DocumentAnalysis } from '@/src/lib/types/ai-knowledge';

interface DocumentUploadCardProps {
  onDocumentUploaded?: (document: StoredDocument) => void;
  onAnalysisComplete?: (analysis: DocumentAnalysis) => void;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  onDocumentUploaded,
  onAnalysisComplete
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<StoredDocument[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<DocumentAnalysis | null>(null);

  const documentProcessor = new DocumentProcessingService();

  const handleUploadDocument = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to upload documents');
      return;
    }

    setIsUploading(true);
    try {
      const result = await documentStorageService.pickAndUploadDocument(user.id);

      if (result.success && result.document) {
        setUploadedDocuments(prev => [result.document!, ...prev]);
        onDocumentUploaded?.(result.document);

        // Start AI processing
        await processDocument(result.document);
      } else if (result.error) {
        Alert.alert('Upload Failed', result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to upload document');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [user, onDocumentUploaded]);

  const processDocument = async (document: StoredDocument) => {
    setIsProcessing(true);
    try {
      // Download document content
      const blob = await documentStorageService.downloadDocument(document.id, user!.id);
      if (!blob) {
        throw new Error('Failed to download document');
      }

      // Convert to ArrayBuffer for processing
      const arrayBuffer = await blob.arrayBuffer();

      // Process with AI
      const analysis = await documentProcessor.uploadDocument({
        filename: document.filename,
        type: document.file_type.includes('pdf') ? 'pdf' : 'image',
        data: arrayBuffer
      });

      setCurrentAnalysis(analysis);

      // Save analysis to database
      await documentStorageService.updateDocumentAnalysis(document.id, analysis);

      onAnalysisComplete?.(analysis);

    } catch (error: any) {
      console.error('Processing error:', error);
      Alert.alert('Processing Failed', 'Unable to analyze document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await documentStorageService.deleteDocument(documentId, user.id);
            if (success) {
              setUploadedDocuments(prev => prev.filter(d => d.id !== documentId));
            } else {
              Alert.alert('Error', 'Failed to delete document');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Race Documents</Text>
        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={handleUploadDocument}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {isProcessing && (
        <View style={styles.processingCard}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>Analyzing document with AI...</Text>
        </View>
      )}

      {currentAnalysis && (
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>Document Analysis</Text>
          <Text style={styles.analysisClass}>Type: {currentAnalysis.documentClass}</Text>
          <Text style={styles.analysisSummary}>{currentAnalysis.summary}</Text>

          {currentAnalysis.insights.length > 0 && (
            <View style={styles.insightsContainer}>
              <Text style={styles.insightsTitle}>Key Insights:</Text>
              {currentAnalysis.insights.slice(0, 3).map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <ScrollView style={styles.documentsList}>
        {uploadedDocuments.map((doc) => (
          <View key={doc.id} style={styles.documentCard}>
            <View style={styles.documentInfo}>
              <Ionicons
                name={doc.file_type.includes('pdf') ? 'document' : 'image'}
                size={24}
                color="#007AFF"
              />
              <View style={styles.documentDetails}>
                <Text style={styles.documentName}>{doc.filename}</Text>
                <Text style={styles.documentMeta}>
                  {(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteDocument(doc.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  processingCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  processingText: {
    marginTop: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  analysisCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  analysisClass: {
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 8,
  },
  analysisSummary: {
    color: '#666',
    lineHeight: 20,
  },
  insightsContainer: {
    marginTop: 12,
  },
  insightsTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  insightItem: {
    marginBottom: 8,
    paddingLeft: 12,
  },
  insightTitle: {
    fontWeight: '500',
    color: '#333',
  },
  insightDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  documentsList: {
    maxHeight: 300,
  },
  documentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  documentName: {
    fontWeight: '500',
    color: '#333',
  },
  documentMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
});