/**
 * Document Checklist Component
 * Displays required documents and handles uploads
 */

import React, { useState, useEffect } from 'react';
import { View, Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  Card,
  Spinner,
} from '@/components/ui';
import { CheckCircle, Upload, FileText, AlertCircle } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { raceRegistrationService, DocumentRequirement } from '@/services/RaceRegistrationService';

interface DocumentChecklistProps {
  entryId: string;
  regattaId: string;
  onComplete?: () => void;
}

interface DocumentStatus {
  requirement: DocumentRequirement;
  submitted: boolean;
  url?: string;
  filename?: string;
  submitted_at?: string;
}

export function DocumentChecklistComponent({
  entryId,
  regattaId,
  onComplete,
}: DocumentChecklistProps) {
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadDocumentRequirements();
  }, [entryId, regattaId]);

  const loadDocumentRequirements = async () => {
    try {
      setLoading(true);

      // Get document requirements
      const { data: requirements, error: reqError } = await supabase
        .from('regatta_document_requirements')
        .select('*')
        .eq('regatta_id', regattaId);

      if (reqError) throw reqError;

      // Get submitted documents
      const { data: entry, error: entryError } = await supabase
        .from('race_entries')
        .select('documents_submitted')
        .eq('id', entryId)
        .single();

      if (entryError) throw entryError;

      const submittedDocs = entry?.documents_submitted || [];

      // Merge requirements with submitted status
      const documentStatus: DocumentStatus[] = (requirements || []).map((req) => {
        const submitted = submittedDocs.find((doc: any) => doc.type === req.document_type);
        return {
          requirement: req,
          submitted: !!submitted,
          url: submitted?.url,
          filename: submitted?.filename,
          submitted_at: submitted?.submitted_at,
        };
      });

      setDocuments(documentStatus);
    } catch (error) {
      console.error('Failed to load document requirements:', error);
      Alert.alert('Error', 'Failed to load document requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (documentType: string) => {
    try {
      setUploading(documentType);

      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setUploading(null);
        return;
      }

      const file = result.assets[0];

      // Check file size (max 10MB)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 10MB');
        setUploading(null);
        return;
      }

      // Create blob from file URI
      let blob: Blob;
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        blob = await response.blob();
      } else {
        const response = await fetch(file.uri);
        blob = await response.blob();
      }

      // Upload document
      const uploadResult = await raceRegistrationService.uploadDocument(
        entryId,
        documentType,
        blob,
        file.name
      );

      if (uploadResult.success) {
        Alert.alert('Success', 'Document uploaded successfully');
        await loadDocumentRequirements(); // Reload to show updated status

        // Check if all documents are now complete
        checkAllDocumentsComplete();
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const checkAllDocumentsComplete = () => {
    const allRequired = documents.filter((doc) => doc.requirement.required);
    const allSubmitted = allRequired.every((doc) => doc.submitted);

    if (allSubmitted && onComplete) {
      onComplete();
    }
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Spinner size="large" />
      </View>
    );
  }

  const requiredDocs = documents.filter((doc) => doc.requirement.required);
  const optionalDocs = documents.filter((doc) => !doc.requirement.required);
  const completedCount = requiredDocs.filter((doc) => doc.submitted).length;

  return (
    <VStack space="lg" padding="$4">
      {/* Progress Summary */}
      <Card>
        <VStack space="sm" padding="$4">
          <HStack justifyContent="space-between" alignItems="center">
            <Text size="lg" weight="bold">
              Document Checklist
            </Text>
            <Badge
              variant={completedCount === requiredDocs.length ? 'success' : 'warning'}
            >
              {completedCount} / {requiredDocs.length}
            </Badge>
          </HStack>
          {completedCount === requiredDocs.length ? (
            <HStack space="sm" alignItems="center">
              <Icon as={CheckCircle} size="sm" color="$success600" />
              <Text color="$success600">All required documents submitted</Text>
            </HStack>
          ) : (
            <Text size="sm" color="$gray600">
              {requiredDocs.length - completedCount} required document(s) remaining
            </Text>
          )}
        </VStack>
      </Card>

      {/* Required Documents */}
      {requiredDocs.length > 0 && (
        <VStack space="md">
          <Text size="md" weight="semibold">
            Required Documents
          </Text>
          {requiredDocs.map((doc) => (
            <Card key={doc.requirement.id}>
              <VStack space="sm" padding="$4">
                <HStack justifyContent="space-between" alignItems="flex-start">
                  <VStack flex={1} space="xs">
                    <HStack space="sm" alignItems="center">
                      <Icon
                        as={doc.submitted ? CheckCircle : AlertCircle}
                        size="sm"
                        color={doc.submitted ? '$success600' : '$error600'}
                      />
                      <Text weight="semibold">
                        {doc.requirement.display_name}
                      </Text>
                    </HStack>
                    {doc.requirement.description && (
                      <Text size="sm" color="$gray600">
                        {doc.requirement.description}
                      </Text>
                    )}
                    {doc.requirement.deadline && (
                      <Text
                        size="xs"
                        color={isOverdue(doc.requirement.deadline) ? '$error600' : '$gray500'}
                      >
                        Deadline: {new Date(doc.requirement.deadline).toLocaleDateString()}
                      </Text>
                    )}
                    {doc.submitted && doc.filename && (
                      <HStack space="xs" alignItems="center" marginTop="$2">
                        <Icon as={FileText} size="xs" color="$gray500" />
                        <Text size="xs" color="$gray500">
                          {doc.filename}
                        </Text>
                        <Text size="xs" color="$gray400">
                          • {new Date(doc.submitted_at!).toLocaleDateString()}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                  {!doc.submitted && (
                    <Button
                      size="sm"
                      onPress={() => handleUploadDocument(doc.requirement.document_type)}
                      isDisabled={uploading === doc.requirement.document_type}
                    >
                      {uploading === doc.requirement.document_type ? (
                        <Spinner size="sm" color="white" />
                      ) : (
                        <HStack space="xs" alignItems="center">
                          <Icon as={Upload} size="xs" color="white" />
                          <Text color="white" size="sm">Upload</Text>
                        </HStack>
                      )}
                    </Button>
                  )}
                  {doc.submitted && (
                    <Badge variant="success">
                      <Text size="xs">Submitted</Text>
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </Card>
          ))}
        </VStack>
      )}

      {/* Optional Documents */}
      {optionalDocs.length > 0 && (
        <VStack space="md">
          <Text size="md" weight="semibold">
            Optional Documents
          </Text>
          {optionalDocs.map((doc) => (
            <Card key={doc.requirement.id}>
              <VStack space="sm" padding="$4">
                <HStack justifyContent="space-between" alignItems="center">
                  <VStack flex={1} space="xs">
                    <Text weight="semibold">
                      {doc.requirement.display_name}
                    </Text>
                    {doc.requirement.description && (
                      <Text size="sm" color="$gray600">
                        {doc.requirement.description}
                      </Text>
                    )}
                  </VStack>
                  {!doc.submitted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => handleUploadDocument(doc.requirement.document_type)}
                      isDisabled={uploading === doc.requirement.document_type}
                    >
                      {uploading === doc.requirement.document_type ? (
                        <Spinner size="sm" />
                      ) : (
                        <HStack space="xs" alignItems="center">
                          <Icon as={Upload} size="xs" />
                          <Text size="sm">Upload</Text>
                        </HStack>
                      )}
                    </Button>
                  )}
                  {doc.submitted && (
                    <Badge variant="success">
                      <Text size="xs">Submitted</Text>
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </Card>
          ))}
        </VStack>
      )}

      {/* Instructions */}
      <Card backgroundColor="$blue50">
        <VStack space="sm" padding="$4">
          <Text size="sm" weight="semibold" color="$blue900">
            Document Guidelines
          </Text>
          <Text size="xs" color="$blue800">
            • Accepted formats: PDF, JPG, PNG, DOC, DOCX
          </Text>
          <Text size="xs" color="$blue800">
            • Maximum file size: 10MB
          </Text>
          <Text size="xs" color="$blue800">
            • Ensure all information is clearly visible
          </Text>
        </VStack>
      </Card>
    </VStack>
  );
}
