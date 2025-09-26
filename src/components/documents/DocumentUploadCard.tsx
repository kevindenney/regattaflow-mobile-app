/**
 * Document Upload Card Component
 * Handles document upload and AI processing for sailing documents
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import type { DocumentAnalysis, RaceCourseExtraction } from '@/src/lib/types/ai-knowledge';

interface DocumentUploadCardProps {
  onDocumentUploaded?: (document: StoredDocument) => void;
  onAnalysisComplete?: (analysis: DocumentAnalysis) => void;
  onCourseExtracted?: (course: RaceCourseExtraction) => void;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  onDocumentUploaded,
  onAnalysisComplete,
  onCourseExtracted
}) => {
  console.log('📄 DocumentUploadCard: Component initializing');
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<StoredDocument[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [currentCourseExtraction, setCurrentCourseExtraction] = useState<RaceCourseExtraction | null>(null);

  const documentProcessor = new DocumentProcessingService();

  // Load documents from localStorage on component mount
  useEffect(() => {
    console.log('📤 DocumentUploadCard: useEffect - Loading documents from localStorage');
    const debugUserId = '51241049-02ed-4e31-b8c6-39af7c9d4d50';
    const userIdToUse = user?.id || debugUserId;

    try {
      const storedDocs = localStorage.getItem('regattaflow_documents');
      if (storedDocs) {
        const documents = JSON.parse(storedDocs);
        // Filter by userId
        const userDocs = documents.filter((doc: StoredDocument) => doc.user_id === userIdToUse);
        console.log('📤 DocumentUploadCard: Loaded', userDocs.length, 'documents from localStorage');
        setUploadedDocuments(userDocs);
      } else {
        console.log('📤 DocumentUploadCard: No documents found in localStorage');
        setUploadedDocuments([]);
      }
    } catch (error) {
      console.error('📤 DocumentUploadCard: Error loading documents from localStorage:', error);
      setUploadedDocuments([]);
    }
  }, [user?.id]); // Only re-run when user ID changes, not when user object changes

  const handleUploadDocument = useCallback(async () => {
    console.log('📤 DocumentUploadCard: handleUploadDocument called');
    console.log('📤 DocumentUploadCard: user check:', { hasUser: !!user, userId: user?.id });

    // Debug mode - allow upload without authentication for testing
    const debugMode = true;
    const debugUserId = '51241049-02ed-4e31-b8c6-39af7c9d4d50';

    if (!user?.id && !debugMode) {
      console.log('📤 DocumentUploadCard: No user - showing sign in alert');
      // Use console.warn instead of Alert.alert for web compatibility
      console.warn('📤 DocumentUploadCard: Please sign in to upload documents');
      if (typeof window !== 'undefined') {
        window.alert('Please sign in to upload documents');
      }
      return;
    }

    const userIdToUse = user?.id || debugUserId;
    console.log('📤 DocumentUploadCard: Using user ID:', userIdToUse, user ? '(real user)' : '(debug mode)');

    // For debug/web mode, use browser alert instead of React Native Alert
    console.log('📤 DocumentUploadCard: Showing document type selection');

    if (typeof window !== 'undefined') {
      // Web-compatible alert for document type selection
      const documentTypes = [
        'Tides/Current Strategy (Perfect for your strategy book!)',
        'Sailing Instructions',
        'Racing Rules',
        'Weather Guide',
        'Other'
      ];

      const choice = window.prompt(
        'What type of sailing document are you uploading?\n' +
        documentTypes.map((type, i) => `${i + 1}. ${type}`).join('\n') +
        '\n\nEnter number (1-5):'
      );

      const choiceNum = parseInt(choice || '1');
      console.log('📤 DocumentUploadCard: User selected document type:', choiceNum);

      switch(choiceNum) {
        case 1:
          console.log('📤 DocumentUploadCard: Uploading Tides/Current Strategy');
          uploadDocumentWithType('book', 'tides_currents', 'Tides and Current Strategy Guide');
          break;
        case 2:
          uploadDocumentWithType('strategy_guide', 'tactics', 'Sailing Instructions');
          break;
        case 3:
          uploadDocumentWithType('racing_rules', 'rules', 'Racing Rules Document');
          break;
        case 4:
          uploadDocumentWithType('weather_guide', 'weather', 'Weather Strategy Guide');
          break;
        default:
          console.log('📤 DocumentUploadCard: Default to Tides/Current Strategy (user\'s preferred type)');
          uploadDocumentWithType('book', 'tides_currents', 'Tides and Current Strategy Guide');
      }
    } else {
      // Fallback for mobile - use the original React Native Alert
      Alert.alert(
        'Document Type',
        'What type of sailing document are you uploading?',
        [
          {
            text: 'Tides/Current Strategy',
            onPress: () => uploadDocumentWithType('book', 'tides_currents', 'Tides and Current Strategy Guide')
          },
          {
            text: 'Sailing Instructions',
            onPress: () => uploadDocumentWithType('strategy_guide', 'tactics', 'Sailing Instructions')
          },
          {
            text: 'Racing Rules',
            onPress: () => uploadDocumentWithType('racing_rules', 'rules', 'Racing Rules Document')
          },
          {
            text: 'Weather Guide',
            onPress: () => uploadDocumentWithType('weather_guide', 'weather', 'Weather Strategy Guide')
          },
          {
            text: 'Other',
            onPress: () => uploadDocumentWithType('strategy_guide', 'tactics', 'Sailing Document')
          }
        ],
        { cancelable: true }
      );
    }
  }, [user]);

  const uploadDocumentWithType = useCallback(async (
    type: 'book' | 'strategy_guide' | 'racing_rules' | 'weather_guide',
    category: 'tides_currents' | 'tactics' | 'rules' | 'weather',
    defaultTitle: string
  ) => {
    console.log('📤 DocumentUploadCard: uploadDocumentWithType called', { type, category, defaultTitle });

    // Use debug user ID if no real user
    const debugUserId = '51241049-02ed-4e31-b8c6-39af7c9d4d50';
    const userIdToUse = user?.id || debugUserId;
    console.log('📤 DocumentUploadCard: Using user ID for upload:', userIdToUse, user ? '(real user)' : '(debug mode)');

    console.log('📤 DocumentUploadCard: Setting isUploading to true');
    setIsUploading(true);
    try {
      console.log('📤 DocumentUploadCard: Calling documentStorageService.pickAndUploadDocument');
      const result = await documentStorageService.pickAndUploadDocument(userIdToUse);
      console.log('📤 DocumentUploadCard: Upload result:', {
        success: result.success,
        hasDocument: !!result.document,
        error: result.error
      });

      if (result.success && result.document) {
        console.log('📤 DocumentUploadCard: Upload successful, updating state');
        console.log('📤 DocumentUploadCard: Current uploadedDocuments length:', uploadedDocuments.length);

        // Load fresh documents from localStorage to ensure consistency
        const freshStoredDocs = localStorage.getItem('regattaflow_documents');
        if (freshStoredDocs) {
          const freshDocuments = JSON.parse(freshStoredDocs);
          const userDocs = freshDocuments.filter((doc: StoredDocument) => doc.user_id === userIdToUse);
          console.log('📤 DocumentUploadCard: Refreshed uploadedDocuments length:', userDocs.length);
          setUploadedDocuments(userDocs);
        }

        if (onDocumentUploaded) {
          console.log('📤 DocumentUploadCard: Calling onDocumentUploaded callback');
          onDocumentUploaded(result.document);
        }

        // Check if we're using local storage (skip processing for local files)
        const isLocalStorage = result.document.metadata?.locallyStored === true;
        console.log('📤 DocumentUploadCard: Is local storage?', isLocalStorage);

        if (!isLocalStorage) {
          console.log('📤 DocumentUploadCard: Processing document with AI (non-local storage)');

          // Use the new sailing document library for processing
          const { sailingDocumentLibrary } = await import('@/src/services/storage/SailingDocumentLibraryService');

          // Download the file for processing
          const blob = await documentStorageService.downloadDocument(result.document.id, userIdToUse);
          if (blob) {
            const sailingDoc = await sailingDocumentLibrary.uploadSailingDocument(
              blob,
              {
                title: result.document.filename || defaultTitle,
                type,
                category,
                description: `Uploaded sailing document: ${result.document.filename}`
              },
              userIdToUse
            );

            console.log('📚 Sailing document processed:', sailingDoc);
          }

          // Also run the existing processing
          await processDocument(result.document);
        } else {
          console.log('📤 DocumentUploadCard: Skipping AI processing for local storage document');
        }

        console.log('📤 DocumentUploadCard: Document upload completed successfully');
      } else if (result.error) {
        console.error('📤 DocumentUploadCard: Upload failed with error:', result.error);
        Alert.alert('Upload Failed', result.error);
      }
    } catch (error: any) {
      console.error('📤 DocumentUploadCard: Exception during upload:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      console.log('📤 DocumentUploadCard: Setting isUploading to false');
      setIsUploading(false);
    }
  }, [user, onDocumentUploaded]);

  const processDocument = async (document: StoredDocument) => {
    console.log('📄 DocumentUploadCard: processDocument called', document.id);

    // Use debug user ID if no real user
    const debugUserId = '51241049-02ed-4e31-b8c6-39af7c9d4d50';
    const userIdToUse = user?.id || debugUserId;

    setIsProcessing(true);
    try {
      // Download document content
      console.log('📄 DocumentUploadCard: Downloading document for processing');
      const blob = await documentStorageService.downloadDocument(document.id, userIdToUse);
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

      // Extract race course if this is a sailing instruction document
      if (['sailing_instructions', 'race_strategy', 'rules'].includes(analysis.documentClass)) {
        try {
          const courseExtraction = await documentProcessor.extractRaceCourse({
            filename: document.filename,
            type: document.file_type.includes('pdf') ? 'pdf' : 'image',
            data: arrayBuffer
          });

          setCurrentCourseExtraction(courseExtraction);
          onCourseExtracted?.(courseExtraction);

          console.log('🏁 Race course extracted:', {
            courseType: courseExtraction.courseLayout.type,
            marksFound: courseExtraction.marks.length,
            confidence: courseExtraction.extractionMetadata.overallConfidence
          });

        } catch (courseError) {
          console.warn('⚠️ Race course extraction failed:', courseError);
          // Continue with document analysis even if course extraction fails
        }
      }

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

      {currentCourseExtraction && (
        <View style={styles.courseExtractionCard}>
          <Text style={styles.courseTitle}>🏁 Race Course Extracted</Text>

          <View style={styles.courseHeader}>
            <Text style={styles.courseType}>Course: {currentCourseExtraction.courseLayout.type.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.confidenceScore}>
              Confidence: {(currentCourseExtraction.extractionMetadata.overallConfidence * 100).toFixed(0)}%
            </Text>
          </View>

          <Text style={styles.courseDescription}>
            {currentCourseExtraction.courseLayout.description}
          </Text>

          {currentCourseExtraction.marks.length > 0 && (
            <View style={styles.marksSection}>
              <Text style={styles.sectionTitle}>📍 Course Marks ({currentCourseExtraction.marks.length})</Text>
              {currentCourseExtraction.marks.slice(0, 4).map((mark, index) => (
                <View key={index} style={styles.markItem}>
                  <Text style={styles.markName}>{mark.name} ({mark.type.replace('_', ' ')})</Text>
                  {mark.position?.latitude && mark.position?.longitude ? (
                    <Text style={styles.markPosition}>
                      {mark.position.latitude.toFixed(6)}°, {mark.position.longitude.toFixed(6)}°
                      {mark.position.confidence < 0.8 && ' (approx)'}
                    </Text>
                  ) : (
                    <Text style={styles.markPosition}>{mark.position?.description || 'Position TBD'}</Text>
                  )}
                </View>
              ))}
              {currentCourseExtraction.marks.length > 4 && (
                <Text style={styles.moreMarks}>+{currentCourseExtraction.marks.length - 4} more marks</Text>
              )}
            </View>
          )}

          {currentCourseExtraction.schedule.startingSignal && (
            <View style={styles.scheduleSection}>
              <Text style={styles.sectionTitle}>⏰ Race Schedule</Text>
              <Text style={styles.scheduleTime}>
                Start: {currentCourseExtraction.schedule.startingSignal.toLocaleTimeString()}
              </Text>
              {currentCourseExtraction.schedule.timeLimit && (
                <Text style={styles.scheduleTime}>
                  Time Limit: {currentCourseExtraction.schedule.timeLimit} minutes
                </Text>
              )}
            </View>
          )}

          {currentCourseExtraction.startLine.bias && currentCourseExtraction.startLine.bias !== 'neutral' && (
            <View style={styles.startLineSection}>
              <Text style={styles.sectionTitle}>🚦 Start Line</Text>
              <Text style={styles.startLineBias}>
                {currentCourseExtraction.startLine.bias.toUpperCase()} end favored
              </Text>
            </View>
          )}
        </View>
      )}

      <ScrollView style={styles.documentsList}>
        {console.log('📤 DocumentUploadCard: Rendering documents list, count:', uploadedDocuments.length)}
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
  // Course extraction styles
  courseExtractionCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    flex: 1,
  },
  confidenceScore: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  courseDescription: {
    color: '#2E7D32',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  marksSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 8,
  },
  markItem: {
    backgroundColor: '#F1F8E9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  markName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
  },
  markPosition: {
    fontSize: 12,
    color: '#558B2F',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  moreMarks: {
    fontSize: 12,
    color: '#81C784',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  scheduleSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#C8E6C9',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
  startLineSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#C8E6C9',
  },
  startLineBias: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6F00',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
});