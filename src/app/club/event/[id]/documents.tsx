/**
 * Event Document Publishing Screen
 * Upload and manage event documents (NOR, SIs, results, etc.)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import EventService, { EventDocument, DocumentType } from '@/src/services/eventService';
import { format } from 'date-fns';

export default function EventDocumentsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id as string;

  const [documents, setDocuments] = useState<EventDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [eventId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await EventService.getEventDocuments(eventId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (documentType: DocumentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      setUploading(true);

      // Create File object from URI (for web compatibility)
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const fileObj = new File([blob], file.name, { type: file.mimeType || 'application/pdf' });

      const title = await new Promise<string>((resolve) => {
        Alert.prompt(
          'Document Title',
          'Enter a title for this document:',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve('') },
            { text: 'Upload', onPress: (text) => resolve(text || file.name) },
          ],
          'plain-text',
          file.name
        );
      });

      if (!title) {
        setUploading(false);
        return;
      }

      await EventService.uploadDocument(
        eventId,
        fileObj,
        documentType,
        title,
        undefined,
        false // Default to private
      );

      await loadDocuments();
      Alert.alert('Success', 'Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async (documentId: string) => {
    Alert.alert(
      'Publish Document',
      'Are you sure you want to make this document public?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            try {
              await EventService.publishDocument(documentId);
              await loadDocuments();
              Alert.alert('Success', 'Document published');
            } catch (error) {
              console.error('Error publishing document:', error);
              Alert.alert('Error', 'Failed to publish document');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await EventService.deleteDocument(documentId);
              await loadDocuments();
              Alert.alert('Success', 'Document deleted');
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'nor':
        return 'document-text-outline';
      case 'si':
        return 'list-outline';
      case 'results':
        return 'trophy-outline';
      case 'course_map':
        return 'map-outline';
      case 'amendment':
        return 'create-outline';
      case 'notice':
        return 'megaphone-outline';
      default:
        return 'document-outline';
    }
  };

  const getDocumentTypeName = (type: DocumentType) => {
    switch (type) {
      case 'nor':
        return 'Notice of Race';
      case 'si':
        return 'Sailing Instructions';
      case 'results':
        return 'Results';
      case 'course_map':
        return 'Course Map';
      case 'amendment':
        return 'Amendment';
      case 'notice':
        return 'Notice';
      default:
        return 'Other';
    }
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = [];
    }
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<DocumentType, EventDocument[]>);

  const documentTypes: DocumentType[] = ['nor', 'si', 'course_map', 'amendment', 'notice', 'results', 'other'];

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Event Documents</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Upload</ThemedText>
          <View style={styles.uploadGrid}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUpload('nor')}
              disabled={uploading}
            >
              <Ionicons name="document-text-outline" size={28} color="#007AFF" />
              <ThemedText style={styles.uploadButtonText}>Notice of Race</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUpload('si')}
              disabled={uploading}
            >
              <Ionicons name="list-outline" size={28} color="#007AFF" />
              <ThemedText style={styles.uploadButtonText}>Sailing Instructions</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUpload('course_map')}
              disabled={uploading}
            >
              <Ionicons name="map-outline" size={28} color="#007AFF" />
              <ThemedText style={styles.uploadButtonText}>Course Map</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUpload('results')}
              disabled={uploading}
            >
              <Ionicons name="trophy-outline" size={28} color="#007AFF" />
              <ThemedText style={styles.uploadButtonText}>Results</ThemedText>
            </TouchableOpacity>
          </View>

          {uploading && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
              <ThemedText style={styles.uploadingText}>Uploading...</ThemedText>
            </View>
          )}
        </View>

        {documentTypes.map((type) => {
          const docs = groupedDocuments[type];
          if (!docs || docs.length === 0) return null;

          return (
            <View key={type} style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                {getDocumentTypeName(type)}
              </ThemedText>

              {docs.map((doc) => (
                <View key={doc.id} style={styles.documentCard}>
                  <View style={styles.documentHeader}>
                    <View style={styles.documentInfo}>
                      <Ionicons
                        name={getDocumentIcon(doc.document_type) as any}
                        size={24}
                        color="#007AFF"
                      />
                      <View style={styles.documentText}>
                        <ThemedText style={styles.documentTitle}>{doc.title}</ThemedText>
                        <ThemedText style={styles.documentMeta}>
                          {doc.file_name} • v{doc.version}
                        </ThemedText>
                        <ThemedText style={styles.documentDate}>
                          {doc.published_at
                            ? `Published ${format(new Date(doc.published_at), 'MMM dd, yyyy')}`
                            : 'Not published'}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.documentStatus}>
                      {doc.is_public ? (
                        <View style={[styles.badge, styles.badgePublic]}>
                          <ThemedText style={styles.badgeTextPublic}>Public</ThemedText>
                        </View>
                      ) : (
                        <View style={[styles.badge, styles.badgePrivate]}>
                          <ThemedText style={styles.badgeTextPrivate}>Private</ThemedText>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.documentActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        // Open document in browser/viewer
                        if (Platform.OS === 'web') {
                          window.open(doc.file_url, '_blank');
                        }
                      }}
                    >
                      <Ionicons name="eye-outline" size={18} color="#007AFF" />
                      <ThemedText style={styles.actionButtonText}>View</ThemedText>
                    </TouchableOpacity>

                    {!doc.is_public && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handlePublish(doc.id)}
                      >
                        <Ionicons name="globe-outline" size={18} color="#10B981" />
                        <ThemedText style={[styles.actionButtonText, { color: '#10B981' }]}>
                          Publish
                        </ThemedText>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(doc.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      <ThemedText style={[styles.actionButtonText, { color: '#EF4444' }]}>
                        Delete
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {documents.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={48} color="#CBD5E1" />
            <ThemedText style={styles.emptyText}>No documents uploaded yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Upload NOR, SIs, and other event documents
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  uploadButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#007AFF',
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  documentText: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  documentStatus: {
    marginLeft: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePublic: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextPublic: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  badgePrivate: {
    backgroundColor: '#F1F5F9',
  },
  badgeTextPrivate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
});
