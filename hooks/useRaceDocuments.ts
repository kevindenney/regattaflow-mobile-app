/**
 * Race Documents Hook
 *
 * Encapsulates race document CRUD operations.
 * Provides document list, upload handlers, and type selection.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import type { RaceDocumentType, RaceDocumentWithDetails } from '@/services/RaceDocumentService';
import { raceDocumentService } from '@/services/RaceDocumentService';
import { documentStorageService } from '@/services/documentStorageService';
import { useLogger } from '@/hooks/useLogger';

export interface RaceDocumentsCardDocument {
  id: string;
  name: string;
  type: RaceDocumentType;
  url: string;
  uploadedAt?: string;
  status?: 'pending' | 'processing' | 'ready' | 'failed';
  extractionProgress?: number;
}

export interface UseRaceDocumentsOptions {
  /** Race ID to load documents for */
  raceId?: string | null;
  /** User ID for upload operations */
  userId?: string | null;
  /** Whether in demo session (disables loading) */
  isDemoSession?: boolean;
  /** Key to trigger reload */
  reloadKey?: number;
}

export interface UseRaceDocumentsReturn {
  /** List of race documents */
  documents: RaceDocumentWithDetails[];
  /** Formatted documents for display */
  documentsForDisplay: RaceDocumentsCardDocument[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether currently uploading */
  isUploading: boolean;
  /** Whether document type picker is visible */
  typePickerVisible: boolean;
  /** Refresh documents */
  refresh: () => void;
  /** Upload a new document */
  upload: () => Promise<void>;
  /** Select document type (for picker) */
  selectType: (type: RaceDocumentType) => void;
  /** Dismiss document type picker */
  dismissTypePicker: () => void;
  /** Delete a document */
  deleteDocument: (documentId: string) => Promise<boolean>;
}

/**
 * Hook for managing race documents
 */
export function useRaceDocuments(
  options: UseRaceDocumentsOptions
): UseRaceDocumentsReturn {
  const { raceId, userId, isDemoSession = false, reloadKey = 0 } = options;
  const logger = useLogger('useRaceDocuments');

  // State
  const [documents, setDocuments] = useState<RaceDocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [internalReloadKey, setInternalReloadKey] = useState(0);

  // Ref for type selection promise
  const typeResolverRef = useRef<((type: RaceDocumentType | null) => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeResolverRef.current) {
        typeResolverRef.current(null);
        typeResolverRef.current = null;
      }
    };
  }, []);

  // Load documents
  useEffect(() => {
    let isActive = true;

    if (!raceId || isDemoSession) {
      setDocuments([]);
      setError(null);
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    const loadDocuments = async () => {
      setLoading(true);
      setError(null);

      try {
        const docs = await raceDocumentService.getRaceDocuments(raceId);
        if (!isActive) return;
        setDocuments(docs);
      } catch (err) {
        if (!isActive) return;
        logger.warn('Unable to load race documents', { error: err, raceId });
        setDocuments([]);
        setError('Unable to load race documents');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadDocuments();

    return () => {
      isActive = false;
    };
  }, [raceId, reloadKey, internalReloadKey, isDemoSession, logger]);

  // Format documents for display
  const documentsForDisplay: RaceDocumentsCardDocument[] = documents.map((doc) => {
    const baseDoc: RaceDocumentsCardDocument = {
      id: doc.id,
      name: doc.document?.name || 'Document',
      type: doc.document_type || 'other',
      url: doc.document?.url || '',
      uploadedAt: doc.created_at,
    };

    // Add extraction status if available
    const extraction = doc.document?.extraction;
    if (extraction) {
      baseDoc.status =
        extraction.status === 'completed'
          ? 'ready'
          : extraction.status === 'failed'
            ? 'failed'
            : extraction.status === 'processing'
              ? 'processing'
              : 'pending';
      baseDoc.extractionProgress = extraction.progress;
    }

    return baseDoc;
  });

  // Refresh documents
  const refresh = useCallback(() => {
    setInternalReloadKey((prev) => prev + 1);
  }, []);

  // Request document type selection
  const requestTypeSelection = useCallback(() => {
    return new Promise<RaceDocumentType | null>((resolve) => {
      typeResolverRef.current = resolve;
      setTypePickerVisible(true);
    });
  }, []);

  // Handle type selection
  const selectType = useCallback((type: RaceDocumentType) => {
    typeResolverRef.current?.(type);
    typeResolverRef.current = null;
    setTypePickerVisible(false);
  }, []);

  // Dismiss type picker
  const dismissTypePicker = useCallback(() => {
    typeResolverRef.current?.(null);
    typeResolverRef.current = null;
    setTypePickerVisible(false);
  }, []);

  // Upload document
  const upload = useCallback(async () => {
    if (isUploading) return;

    if (isDemoSession) {
      Alert.alert('Unavailable in demo mode', 'Sign in to upload race documents.');
      return;
    }

    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to upload documents.');
      return;
    }

    if (!raceId) {
      Alert.alert('Select a race', 'Choose a race to attach documents to.');
      return;
    }

    const documentType = await requestTypeSelection();
    if (!documentType) {
      logger.debug('Document upload cancelled before selecting type');
      return;
    }

    setIsUploading(true);
    try {
      const uploadResult = await documentStorageService.pickAndUploadDocument(userId);

      if (!uploadResult.success || !uploadResult.document) {
        const errorMessage = uploadResult.error || 'Unable to upload document. Please try again.';
        const isUserCancel = errorMessage.toLowerCase().includes('cancel');

        if (isUserCancel) {
          logger.debug('Document picker cancelled by user');
        } else {
          Alert.alert('Upload failed', errorMessage);
        }
        return;
      }

      const linked = await raceDocumentService.linkDocumentToRace({
        regattaId: raceId,
        documentId: uploadResult.document.id,
        userId,
        documentType,
      });

      if (!linked) {
        Alert.alert('Upload failed', 'We uploaded the file but could not attach it to this race.');
        return;
      }

      // Refresh to show new document
      refresh();
    } catch (err) {
      logger.error('Error uploading document', { error: err });
      Alert.alert('Upload failed', 'An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, isDemoSession, userId, raceId, requestTypeSelection, refresh, logger]);

  // Delete document
  const deleteDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      if (isDemoSession) {
        Alert.alert('Unavailable in demo mode', 'Sign in to delete documents.');
        return false;
      }

      try {
        const success = await raceDocumentService.unlinkDocumentFromRace(documentId);
        if (success) {
          refresh();
        }
        return success;
      } catch (err) {
        logger.error('Error deleting document', { error: err });
        return false;
      }
    },
    [isDemoSession, refresh, logger]
  );

  return {
    documents,
    documentsForDisplay,
    loading,
    error,
    isUploading,
    typePickerVisible,
    refresh,
    upload,
    selectType,
    dismissTypePicker,
    deleteDocument,
  };
}
