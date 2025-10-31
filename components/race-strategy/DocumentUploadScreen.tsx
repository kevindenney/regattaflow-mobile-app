// @ts-nocheck

/**
 * Document Upload Screen
 *
 * Allows sailors to upload race documents (NOR, SSI, Appendices) or provide URLs
 * Triggers AI document processing workflow
 *
 * Part of vertical slice: Document Upload → AI Extraction → Visualization → Validation
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { DocumentProcessingAgent } from '@/services/agents/DocumentProcessingAgent';
import RaceEventService from '@/services/RaceEventService';
import { DocumentType, SourceDocument } from '@/types/raceEvents';

interface DocumentUploadScreenProps {
  onProcessingComplete: (raceEventId: string) => void;
}

export function DocumentUploadScreen({ onProcessingComplete }: DocumentUploadScreenProps) {
  const [raceName, setRaceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<SourceDocument[]>([]);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  /**
   * Handle document picker
   */
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv'],
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // Determine document type from filename
      let docType = DocumentType.OTHER;
      const filename = file.name.toLowerCase();

      if (filename.includes('nor') || filename.includes('notice')) {
        docType = DocumentType.NOR;
      } else if (filename.includes('ssi') || filename.includes('sailing') && filename.includes('instruction')) {
        docType = DocumentType.SSI;
      } else if (filename.includes('appendix') || filename.includes('attachment')) {
        docType = DocumentType.APPENDIX;
      } else if (filename.includes('calendar') || filename.endsWith('.csv')) {
        docType = DocumentType.CALENDAR;
      }

      const sourceDoc: SourceDocument = {
        type: docType,
        filename: file.name,
        url: file.uri
      };

      setUploadedFiles([...uploadedFiles, sourceDoc]);
      setError('');
    } catch (err) {
      console.error('Error picking document:', err);
      setError('Failed to pick document');
    }
  };

  /**
   * Process documents with AI
   */
  const handleProcessDocuments = async () => {
    if (!raceName.trim()) {
      setError('Please enter a race name');
      return;
    }

    if (uploadedFiles.length === 0 && !sourceUrl.trim()) {
      setError('Please upload documents or provide a URL');
      return;
    }

    setProcessing(true);
    setError('');
    setStatus('Creating race event...');

    try {
      // Step 1: Create race event
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 24); // Default to tomorrow

      const { data: raceEvent, error: createError } = await RaceEventService.createRaceEvent({
        race_name: raceName,
        start_time: startTime.toISOString(),
        source_url: sourceUrl || undefined,
        source_documents: uploadedFiles
      });

      if (createError || !raceEvent) {
        throw new Error(createError?.message || 'Failed to create race event');
      }

      setStatus('Processing documents with AI...');

      // Step 2: Process documents with DocumentProcessingAgent
      const agent = new DocumentProcessingAgent();

      // If we have uploaded files, read their content
      const documentsWithContent = await Promise.all(
        uploadedFiles.map(async (doc) => {
          if (doc.url && Platform.OS === 'web') {
            // For web, fetch the content
            try {
              const response = await fetch(doc.url);
              const text = await response.text();
              return { ...doc, content: text };
            } catch {
              return doc;
            }
          }
          return doc;
        })
      );

      const result = await agent.processRaceEvent({
        raceEventId: raceEvent.id,
        source: sourceUrl || '',
        raceName: raceName,
        documents: documentsWithContent
      });

      if (!result.success) {
        throw new Error(result.errors?.join(', ') || 'Processing failed');
      }

      setStatus('Extraction complete!');

      // Step 3: Update race event with extracted data
      if (result.extracted_data) {
        await RaceEventService.updateRaceEvent(raceEvent.id, {
          race_name: result.extracted_data.race_name || raceName,
          race_series: result.extracted_data.race_series,
          boat_class: result.extracted_data.boat_class,
          start_time: result.extracted_data.start_time || startTime.toISOString(),
          racing_area_name: result.extracted_data.racing_area_name,
          venue_id: result.extracted_data.venue_id,
          course_configuration: result.extracted_data.course_configuration,
          course_description: result.extracted_data.course_description,
          confidence_score: result.confidence,
          extraction_status: 'completed'
        });

        // Add extracted marks
        if (result.extracted_data.marks && result.extracted_data.marks.length > 0) {
          const marks = result.extracted_data.marks.map(mark => ({
            mark_name: mark.name,
            mark_type: mark.type,
            position: `POINT(${mark.lng} ${mark.lat})`,
            rounding_direction: mark.rounding,
            sequence_number: mark.sequence,
            mark_color: mark.color,
            mark_shape: mark.shape,
            extracted_from: 'ai_pdf',
            confidence_score: mark.confidence
          }));

          await RaceEventService.addCourseMarks(raceEvent.id, marks);
        }
      }

      // Navigate to validation screen
      setTimeout(() => {
        onProcessingComplete(raceEvent.id);
      }, 1000);

    } catch (err) {
      console.error('Error processing documents:', err);
      setError(err instanceof Error ? err.message : 'Processing failed');
      setProcessing(false);
      setStatus('');
    }
  };

  /**
   * Remove uploaded file
   */
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Race Documents</Text>
      <Text style={styles.subtitle}>
        Upload sailing instructions, notice of race, or provide club website URL
      </Text>

      {/* Race Name Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Race Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Croucher Series 3 & 4"
          value={raceName}
          onChangeText={setRaceName}
          editable={!processing}
        />
      </View>

      {/* URL Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Club Website URL (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://www.rhkyc.org.hk/sailing/classes/dragon"
          value={sourceUrl}
          onChangeText={setSourceUrl}
          editable={!processing}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>
          AI will crawl the website to find race documents
        </Text>
      </View>

      {/* Document Upload */}
      <View style={styles.section}>
        <Text style={styles.label}>Upload Documents (Optional)</Text>

        <TouchableOpacity
          style={[styles.uploadButton, processing && styles.uploadButtonDisabled]}
          onPress={handlePickDocument}
          disabled={processing}
        >
          <Text style={styles.uploadButtonText}>
            📄 Pick PDF/CSV
          </Text>
        </TouchableOpacity>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <View style={styles.filesList}>
            {uploadedFiles.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{file.filename}</Text>
                  <Text style={styles.fileType}>{file.type}</Text>
                </View>
                {!processing && (
                  <TouchableOpacity onPress={() => handleRemoveFile(index)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Status Display */}
      {processing && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#0080ff" />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}

      {/* Process Button */}
      <TouchableOpacity
        style={[styles.processButton, processing && styles.processButtonDisabled]}
        onPress={handleProcessDocuments}
        disabled={processing}
      >
        <Text style={styles.processButtonText}>
          {processing ? 'Processing...' : '🚀 Process Documents with AI'}
        </Text>
      </TouchableOpacity>

      {/* Example URLs */}
      <View style={styles.exampleSection}>
        <Text style={styles.exampleTitle}>Example (RHKYC Dragon Class):</Text>
        <TouchableOpacity
          onPress={() => {
            setSourceUrl('https://www.rhkyc.org.hk/sailing/classes/classes/dragon');
            setRaceName('Croucher Series 3 & 4');
          }}
        >
          <Text style={styles.exampleLink}>
            Load RHKYC Dragon Croucher Series
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24
  },
  section: {
    marginBottom: 24
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  uploadButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center'
  },
  uploadButtonDisabled: {
    opacity: 0.5
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#666'
  },
  filesList: {
    marginTop: 12
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8
  },
  fileInfo: {
    flex: 1
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2
  },
  fileType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase'
  },
  removeButton: {
    fontSize: 20,
    color: '#ff0000',
    padding: 4
  },
  errorContainer: {
    backgroundColor: '#fff0f0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff0000',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16
  },
  errorText: {
    color: '#cc0000',
    fontSize: 14
  },
  statusContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 16
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    color: '#0080ff',
    fontWeight: '500'
  },
  processButton: {
    backgroundColor: '#0080ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  processButtonDisabled: {
    backgroundColor: '#ccc'
  },
  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  exampleSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8
  },
  exampleTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  exampleLink: {
    fontSize: 14,
    color: '#0080ff',
    textDecorationLine: 'underline'
  }
});

export default DocumentUploadScreen;
