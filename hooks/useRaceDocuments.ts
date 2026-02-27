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
import { documentStorageService } from '@/services/storage/DocumentStorageService';
import { documentExtractionService, type ExtractionResult } from '@/services/DocumentExtractionService';
import { createLogger } from '@/lib/utils/logger';
import type { RaceDisplayDocument } from '@/types/documents';

const logger = createLogger('useRaceDocuments');

export interface RaceDocumentsCardDocument {
  id: string;
  /** The actual documents table ID (for extraction storage) */
  documentId?: string;
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
  /** Whether to include inherited club documents (default: true) */
  includeClubDocs?: boolean;
}

export interface UseRaceDocumentsReturn {
  /** List of race documents */
  documents: RaceDocumentWithDetails[];
  /** Formatted documents for display */
  documentsForDisplay: RaceDocumentsCardDocument[];
  /** Unified documents with source info (race + club) */
  displayDocuments: {
    raceDocuments: RaceDisplayDocument[];
    clubDocuments: RaceDisplayDocument[];
    allDocuments: RaceDisplayDocument[];
  };
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether currently uploading */
  isUploading: boolean;
  /** Whether AI extraction is in progress */
  isExtracting: boolean;
  /** Result of the last extraction */
  extractionResult: ExtractionResult | null;
  /** Whether stored extraction has been checked */
  storedExtractionChecked: boolean;
  /** Whether document type picker is visible */
  typePickerVisible: boolean;
  /** Refresh documents */
  refresh: () => void;
  /** Upload a new document (optionally with pre-selected type to skip picker) */
  upload: (preselectedType?: RaceDocumentType) => Promise<void>;
  /** Add a document via URL */
  addFromUrl: (url: string, documentType: RaceDocumentType, name?: string) => Promise<boolean>;
  /** Add a document from pasted text content */
  addFromText: (textContent: string, documentType: RaceDocumentType, name?: string) => Promise<boolean>;
  /** Select document type (for picker) */
  selectType: (type: RaceDocumentType) => void;
  /** Dismiss document type picker */
  dismissTypePicker: () => void;
  /** Trigger extraction for an existing document */
  triggerExtraction: (documentUrl: string, documentId: string, documentType: RaceDocumentType) => void;
  /** Clear extraction result */
  clearExtractionResult: () => void;
  /** Delete a document */
  deleteDocument: (documentId: string) => Promise<boolean>;
}

/**
 * Hook for managing race documents
 */
export function useRaceDocuments(
  options: UseRaceDocumentsOptions
): UseRaceDocumentsReturn {
  const { raceId, userId, isDemoSession = false, reloadKey = 0, includeClubDocs = true } = options;

  // State
  const [documents, setDocuments] = useState<RaceDocumentWithDetails[]>([]);
  const [displayDocuments, setDisplayDocuments] = useState<{
    raceDocuments: RaceDisplayDocument[];
    clubDocuments: RaceDisplayDocument[];
    allDocuments: RaceDisplayDocument[];
  }>({ raceDocuments: [], clubDocuments: [], allDocuments: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [storedExtractionChecked, setStoredExtractionChecked] = useState(false);
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [internalReloadKey, setInternalReloadKey] = useState(0);
  const isMountedRef = useRef(true);
  const activeRaceIdRef = useRef<string | null | undefined>(raceId);
  const activeUserIdRef = useRef<string | null | undefined>(userId);
  const documentsLoadRunIdRef = useRef(0);
  const storedExtractionRunIdRef = useRef(0);
  const extractionRunIdRef = useRef(0);

  // Ref for type selection promise
  const typeResolverRef = useRef<((type: RaceDocumentType | null) => void) | null>(null);

  // Ref to track which document we've loaded stored extraction for
  const loadedStoredExtractionForDocRef = useRef<string | null>(null);

  // Ref to track if we have valid extraction data (avoids stale closure issues)
  const hasExtractedDataRef = useRef<boolean>(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      documentsLoadRunIdRef.current += 1;
      storedExtractionRunIdRef.current += 1;
      extractionRunIdRef.current += 1;
      if (typeResolverRef.current) {
        typeResolverRef.current(null);
        typeResolverRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    activeRaceIdRef.current = raceId;
    activeUserIdRef.current = userId;
  }, [raceId, userId]);

  // Load documents
  useEffect(() => {
    const runId = ++documentsLoadRunIdRef.current;
    const targetRaceId = raceId;
    const canCommit = () =>
      isMountedRef.current &&
      runId === documentsLoadRunIdRef.current &&
      activeRaceIdRef.current === targetRaceId;

    if (!targetRaceId || isDemoSession) {
      if (!canCommit()) {
        return () => {
          documentsLoadRunIdRef.current += 1;
        };
      }
      setDocuments([]);
      setDisplayDocuments({ raceDocuments: [], clubDocuments: [], allDocuments: [] });
      setError(null);
      setLoading(false);
      return () => {
        documentsLoadRunIdRef.current += 1;
      };
    }

    const loadDocuments = async () => {
      if (!canCommit()) return;
      setLoading(true);
      setError(null);

      try {
        // Load race documents (legacy format for backward compatibility)
        const docs = await raceDocumentService.getRaceDocuments(targetRaceId);
        if (!canCommit()) return;
        setDocuments(docs);

        // Also load unified display documents (with optional club inheritance)
        const displayDocs = await raceDocumentService.getRaceDocumentsWithInheritance(targetRaceId, {
          includeClubDocs,
        });
        if (!canCommit()) return;
        setDisplayDocuments(displayDocs);
      } catch (err) {
        if (!canCommit()) return;
        logger.warn('Unable to load race documents', { error: err, raceId: targetRaceId });
        setDocuments([]);
        setDisplayDocuments({ raceDocuments: [], clubDocuments: [], allDocuments: [] });
        setError('Unable to load race documents');
      } finally {
        if (!canCommit()) return;
        setLoading(false);
      }
    };

    void loadDocuments();

    return () => {
      documentsLoadRunIdRef.current += 1;
    };
  }, [raceId, reloadKey, internalReloadKey, isDemoSession, includeClubDocs]);

  // Load stored extraction data when documents change
  useEffect(() => {
    const runId = ++storedExtractionRunIdRef.current;
    const canCommit = () =>
      isMountedRef.current && runId === storedExtractionRunIdRef.current;

    const loadStoredExtraction = async () => {
      // Find NOR or SI document that might have extraction data
      const norOrSiDoc = documents.find(
        (doc) => doc.documentType === 'nor' || doc.documentType === 'sailing_instructions'
      );

      if (!norOrSiDoc?.document?.id) {
        // No document to check, mark as checked
        if (!canCommit()) return;
        setStoredExtractionChecked(true);
        return;
      }

      const docId = norOrSiDoc.document.id;

      // Check if we already loaded for this document (using ref to avoid stale closure)
      if (loadedStoredExtractionForDocRef.current === docId) {
        if (!canCommit()) return;
        setStoredExtractionChecked(true);
        return;
      }

      // Reset check flag - we're about to load
      if (!canCommit()) return;
      setStoredExtractionChecked(false);

      try {
        const stored = await documentExtractionService.getStoredExtraction(docId);
        if (!canCommit()) return;

        // Mark this document as loaded
        loadedStoredExtractionForDocRef.current = docId;

        if (stored) {
          // Update ref FIRST (sync) - this prevents race conditions with stale closures
          hasExtractedDataRef.current = !!stored.data;
          setExtractionResult(stored);
          setStoredExtractionChecked(true);
        } else {
          hasExtractedDataRef.current = false;
          setStoredExtractionChecked(true);
        }
      } catch (err) {
        logger.warn('Error loading stored extraction', { error: err });
        if (!canCommit()) return;
        setStoredExtractionChecked(true);
      }
    };

    if (documents.length > 0 && !loading) {
      void loadStoredExtraction();
    } else if (!loading && documents.length === 0) {
      // No documents, mark as checked
      if (!canCommit()) {
        return () => {
          storedExtractionRunIdRef.current += 1;
        };
      }
      setStoredExtractionChecked(true);
    }

    return () => {
      storedExtractionRunIdRef.current += 1;
    };
  }, [documents, loading]);

  // Format documents for display
  const documentsForDisplay: RaceDocumentsCardDocument[] = documents.map((doc) => {
    const baseDoc: RaceDocumentsCardDocument = {
      id: doc.id,
      documentId: doc.document?.id, // Actual documents table ID for extraction storage
      name: doc.document?.name || doc.document?.filename || 'Document',
      type: doc.documentType || 'other',  // Use camelCase property
      url: doc.document?.url || doc.document?.storage_path || '',
      uploadedAt: doc.createdAt,  // Use camelCase property
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
    logger.debug('selectType called', { type, hasResolver: !!typeResolverRef.current });
    if (typeResolverRef.current) {
      typeResolverRef.current(type);
      typeResolverRef.current = null;
    } else {
      logger.warn('selectType called but no resolver found');
    }
    setTypePickerVisible(false);
  }, []);

  // Dismiss type picker
  const dismissTypePicker = useCallback(() => {
    typeResolverRef.current?.(null);
    typeResolverRef.current = null;
    setTypePickerVisible(false);
  }, []);

  // Upload document
  const upload = useCallback(async (preselectedType?: RaceDocumentType) => {
    const targetRaceId = raceId;
    const targetUserId = userId;
    if (isUploading) return;

    if (isDemoSession) {
      Alert.alert('Unavailable in demo mode', 'Sign in to upload race documents.');
      return;
    }

    if (!targetUserId) {
      Alert.alert('Sign in required', 'Please sign in to upload documents.');
      return;
    }

    if (!targetRaceId) {
      Alert.alert('Select a race', 'Choose a race to attach documents to.');
      return;
    }

    // Use pre-selected type if provided, otherwise show picker
    let documentType: RaceDocumentType | null = preselectedType || null;
    if (!documentType) {
      documentType = await requestTypeSelection();
      logger.debug('Document type selected', { documentType });
      if (!documentType) {
        logger.debug('Document upload cancelled before selecting type');
        return;
      }
    } else {
      logger.debug('Using pre-selected document type', { documentType });
    }

    logger.debug('Opening file picker...');
    if (!isMountedRef.current || activeRaceIdRef.current !== targetRaceId || activeUserIdRef.current !== targetUserId) return;
    setIsUploading(true);
    try {
      const uploadResult = await documentStorageService.pickAndUploadDocument(targetUserId);
      logger.debug('File picker result', { success: uploadResult.success, error: uploadResult.error });

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
        regattaId: targetRaceId,
        documentId: uploadResult.document.id,
        userId: targetUserId,
        documentType,
      });

      if (!linked) {
        Alert.alert('Upload failed', 'We uploaded the file but could not attach it to this race.');
        return;
      }

      // Refresh to show new document
      refresh();

      // Trigger AI extraction for NOR and SI documents (runs in background)
      const documentUrl = uploadResult.document.url || uploadResult.document.public_url;
      if ((documentType === 'nor' || documentType === 'sailing_instructions') && documentUrl) {
        const extractionRunId = ++extractionRunIdRef.current;
        const canCommitExtraction = () =>
          isMountedRef.current &&
          extractionRunIdRef.current === extractionRunId &&
          activeRaceIdRef.current === targetRaceId &&
          activeUserIdRef.current === targetUserId;
        if (!canCommitExtraction()) return;
        setIsExtracting(true);
        setExtractionResult(null);

        // Run extraction in background (don't await)
        documentExtractionService.extractAndUpdateRace({
          documentUrl,
          documentId: uploadResult.document.id,
          raceId: targetRaceId,
          documentType,
        }).then((extractResult) => {
          hasExtractedDataRef.current = !!extractResult.data;
          if (!canCommitExtraction()) return;
          setExtractionResult(extractResult);
          setIsExtracting(false);

          if (extractResult.success && extractResult.extractedFields) {
            refresh();
          } else if (extractResult.error) {
            logger.warn('Upload extraction failed', { error: extractResult.error });
          }
        }).catch((err) => {
          logger.error('Upload extraction error', { error: err });
          hasExtractedDataRef.current = false;
          if (!canCommitExtraction()) return;
          setExtractionResult({ success: false, error: err.message || 'Extraction failed' });
          setIsExtracting(false);
        });
      }
    } catch (err) {
      logger.error('Error uploading document', { error: err });
      Alert.alert('Upload failed', 'An unexpected error occurred.');
    } finally {
      if (isMountedRef.current && activeRaceIdRef.current === targetRaceId && activeUserIdRef.current === targetUserId) {
        setIsUploading(false);
      }
    }
  }, [isUploading, isDemoSession, userId, raceId, requestTypeSelection, refresh]);

  // Add document from URL
  const addFromUrl = useCallback(
    async (url: string, documentType: RaceDocumentType, name?: string): Promise<boolean> => {
      const targetRaceId = raceId;
      const targetUserId = userId;
      logger.debug('addFromUrl called', { url, documentType, name, userId, raceId, isDemoSession });

      if (isDemoSession) {
        Alert.alert('Unavailable in demo mode', 'Sign in to add documents.');
        return false;
      }

      if (!targetUserId) {
        Alert.alert('Sign in required', 'Please sign in to add documents.');
        return false;
      }

      if (!targetRaceId) {
        Alert.alert('Select a race', 'Choose a race to attach documents to.');
        return false;
      }

      if (!url.trim()) {
        Alert.alert('Invalid URL', 'Please enter a valid URL.');
        return false;
      }

      logger.debug('addFromUrl: Starting upload...', { url: url.trim() });
      if (!isMountedRef.current || activeRaceIdRef.current !== targetRaceId || activeUserIdRef.current !== targetUserId) return false;
      setIsUploading(true);
      try {
        // Save document from URL
        logger.debug('addFromUrl: Calling saveDocumentFromUrl...');
        const result = await documentStorageService.saveDocumentFromUrl(targetUserId, url.trim(), name);
        logger.debug('addFromUrl: saveDocumentFromUrl result', { success: result.success, error: result.error, docId: result.document?.id });

        if (!result.success || !result.document) {
          Alert.alert('Failed to add document', result.error || 'Unable to save document.');
          return false;
        }

        // Link to race
        logger.debug('addFromUrl: Calling linkDocumentToRace...', { raceId, documentId: result.document.id });
        const linked = await raceDocumentService.linkDocumentToRace({
          regattaId: targetRaceId,
          documentId: result.document.id,
          userId: targetUserId,
          documentType,
        });
        logger.debug('addFromUrl: linkDocumentToRace result', { linked });

        if (!linked) {
          Alert.alert('Failed to link document', 'Document saved but could not be linked to this race.');
          return false;
        }

        // Refresh to show new document
        refresh();

        // Trigger AI extraction for NOR and SI documents (runs in background)
        if (documentType === 'nor' || documentType === 'sailing_instructions') {
          const extractionRunId = ++extractionRunIdRef.current;
          const canCommitExtraction = () =>
            isMountedRef.current &&
            extractionRunIdRef.current === extractionRunId &&
            activeRaceIdRef.current === targetRaceId &&
            activeUserIdRef.current === targetUserId;
          if (!canCommitExtraction()) return false;
          setIsExtracting(true);
          setExtractionResult(null);

          // Run extraction in background (don't await)
          logger.info('🔍 [DEBUG] Starting extraction for SI document', {
            url: url.trim(),
            documentId: result.document.id,
            raceId,
            documentType
          });
          documentExtractionService.extractAndUpdateRace({
            documentUrl: url.trim(),
            documentId: result.document.id,
            raceId: targetRaceId,
            documentType,
          }).then((extractResult) => {
            logger.info('🔍 [DEBUG] Extraction completed', {
              success: extractResult.success,
              hasData: !!extractResult.data,
              marksCount: extractResult.data?.marks?.length ?? 0,
              confidence: extractResult.confidence,
              extractedFields: extractResult.extractedFields,
              error: extractResult.error
            });
            hasExtractedDataRef.current = !!extractResult.data;
            if (!canCommitExtraction()) return;
            setExtractionResult(extractResult);
            logger.info('🔍 [DEBUG] setExtractionResult called with:', {
              success: extractResult.success,
              marksCount: extractResult.data?.marks?.length ?? 0
            });
            setIsExtracting(false);

            if (extractResult.success && extractResult.extractedFields) {
              refresh();
            } else if (extractResult.error) {
              logger.warn('Extraction failed', { error: extractResult.error });
            }
          }).catch((err) => {
            logger.error('🔍 [DEBUG] Extraction error caught', { error: err });
            hasExtractedDataRef.current = false;
            if (!canCommitExtraction()) return;
            setExtractionResult({ success: false, error: err.message || 'Extraction failed' });
            setIsExtracting(false);
          });
        }

        return true;
      } catch (err) {
        logger.error('Error adding document from URL', { error: err });
        Alert.alert('Error', 'An unexpected error occurred.');
        return false;
      } finally {
        if (isMountedRef.current && activeRaceIdRef.current === targetRaceId && activeUserIdRef.current === targetUserId) {
          setIsUploading(false);
        }
      }
    },
    [isDemoSession, userId, raceId, refresh]
  );

  // Add document from pasted text content
  const addFromText = useCallback(
    async (textContent: string, documentType: RaceDocumentType, name?: string): Promise<boolean> => {
      const targetRaceId = raceId;
      const targetUserId = userId;
      logger.debug('addFromText called', { textLength: textContent.length, documentType, name, userId, raceId, isDemoSession });

      if (isDemoSession) {
        Alert.alert('Unavailable in demo mode', 'Sign in to add documents.');
        return false;
      }

      if (!targetUserId) {
        Alert.alert('Sign in required', 'Please sign in to add documents.');
        return false;
      }

      if (!targetRaceId) {
        Alert.alert('Select a race', 'Choose a race to attach documents to.');
        return false;
      }

      if (!textContent.trim()) {
        Alert.alert('No content', 'Please paste document text content.');
        return false;
      }

      logger.debug('addFromText: Starting save...', { textLength: textContent.trim().length });
      if (!isMountedRef.current || activeRaceIdRef.current !== targetRaceId || activeUserIdRef.current !== targetUserId) return false;
      setIsUploading(true);
      try {
        // Save document from text content
        logger.debug('addFromText: Calling saveDocumentFromText...');
        const result = await documentStorageService.saveDocumentFromText(targetUserId, textContent.trim(), name);
        logger.debug('addFromText: saveDocumentFromText result', { success: result.success, error: result.error, docId: result.document?.id });

        if (!result.success || !result.document) {
          Alert.alert('Failed to save document', result.error || 'Unable to save document.');
          return false;
        }

        // Link to race
        logger.debug('addFromText: Calling linkDocumentToRace...', { raceId, documentId: result.document.id });
        const linked = await raceDocumentService.linkDocumentToRace({
          regattaId: targetRaceId,
          documentId: result.document.id,
          userId: targetUserId,
          documentType,
        });
        logger.debug('addFromText: linkDocumentToRace result', { linked });

        if (!linked) {
          Alert.alert('Failed to link document', 'Document saved but could not be linked to this race.');
          return false;
        }

        // Refresh to show new document
        refresh();

        // Trigger AI extraction for NOR and SI documents (runs in background)
        if (documentType === 'nor' || documentType === 'sailing_instructions') {
          const extractionRunId = ++extractionRunIdRef.current;
          const canCommitExtraction = () =>
            isMountedRef.current &&
            extractionRunIdRef.current === extractionRunId &&
            activeRaceIdRef.current === targetRaceId &&
            activeUserIdRef.current === targetUserId;
          if (!canCommitExtraction()) return false;
          setIsExtracting(true);
          setExtractionResult(null);

          // Run text extraction in background (don't await)
          documentExtractionService.extractFromText({
            text: textContent.trim(),
            documentId: result.document.id,
            raceId: targetRaceId,
            documentType,
          }).then((extractResult) => {
            hasExtractedDataRef.current = !!extractResult.data;
            if (!canCommitExtraction()) return;
            setExtractionResult(extractResult);
            setIsExtracting(false);

            if (extractResult.success && extractResult.extractedFields) {
              refresh();
            } else if (extractResult.error) {
              logger.warn('Text extraction failed', { error: extractResult.error });
            }
          }).catch((err) => {
            logger.error('Text extraction error', { error: err });
            hasExtractedDataRef.current = false;
            if (!canCommitExtraction()) return;
            setExtractionResult({ success: false, error: err.message || 'Extraction failed' });
            setIsExtracting(false);
          });
        }

        return true;
      } catch (err) {
        logger.error('Error adding document from text', { error: err });
        Alert.alert('Error', 'An unexpected error occurred.');
        return false;
      } finally {
        if (isMountedRef.current && activeRaceIdRef.current === targetRaceId && activeUserIdRef.current === targetUserId) {
          setIsUploading(false);
        }
      }
    },
    [isDemoSession, userId, raceId, refresh]
  );

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
    [isDemoSession, refresh]
  );

  // Trigger extraction for an existing document
  const triggerExtraction = useCallback(
    async (documentUrl: string, documentId: string, documentType: RaceDocumentType) => {
      const targetRaceId = raceId;
      const targetUserId = userId;
      if (!targetRaceId || isExtracting) return;

      // Check ref to prevent extraction when we already have stored data
      // This avoids race conditions with stale closure values
      if (hasExtractedDataRef.current) {
        logger.debug('Skipping extraction - hasExtractedDataRef is true');
        return;
      }

      // IMPORTANT: Check for stored extraction FIRST before triggering new extraction
      // This prevents re-extraction when navigating between pages that each have their own hook instance
      try {
        logger.debug('Checking for stored extraction before triggering', { documentId });
        const storedExtraction = await documentExtractionService.getStoredExtraction(documentId);
        if (storedExtraction?.data) {
          logger.debug('Found stored extraction, skipping new extraction', {
            documentId,
            fieldsCount: storedExtraction.extractedFields?.length
          });
          hasExtractedDataRef.current = true;
          if (!isMountedRef.current || activeRaceIdRef.current !== targetRaceId || activeUserIdRef.current !== targetUserId) return;
          setExtractionResult(storedExtraction);
          return;
        }
      } catch (err) {
        logger.warn('Error checking stored extraction, proceeding with new extraction', { error: err });
      }

      logger.debug('Triggering extraction for existing document', { documentUrl, documentId, documentType });
      const extractionRunId = ++extractionRunIdRef.current;
      const canCommitExtraction = () =>
        isMountedRef.current &&
        extractionRunIdRef.current === extractionRunId &&
        activeRaceIdRef.current === targetRaceId &&
        activeUserIdRef.current === targetUserId;
      if (!canCommitExtraction()) return;
      setIsExtracting(true);
      setExtractionResult(null);
      hasExtractedDataRef.current = false; // Clear ref since we're starting fresh extraction

      documentExtractionService.extractAndUpdateRace({
        documentUrl,
        documentId,
        raceId: targetRaceId,
        documentType,
      }).then((extractResult) => {
        hasExtractedDataRef.current = !!extractResult.data;
        if (!canCommitExtraction()) return;
        setExtractionResult(extractResult);
        setIsExtracting(false);

        if (extractResult.success && extractResult.extractedFields) {
          refresh();
        } else if (extractResult.error) {
          logger.warn('Triggered extraction failed', { error: extractResult.error });
        }
      }).catch((err) => {
        logger.error('Triggered extraction error', { error: err });
        hasExtractedDataRef.current = false;
        if (!canCommitExtraction()) return;
        setExtractionResult({ success: false, error: err.message || 'Extraction failed' });
        setIsExtracting(false);
      });
    },
    [raceId, userId, isExtracting, refresh]
  );

  // Clear extraction result (for re-extraction)
  const clearExtractionResult = useCallback(() => {
    hasExtractedDataRef.current = false; // Allow new extraction
    setExtractionResult(null);
    setStoredExtractionChecked(false);
    loadedStoredExtractionForDocRef.current = null; // Allow re-loading
  }, []);

  return {
    documents,
    documentsForDisplay,
    displayDocuments,
    loading,
    error,
    isUploading,
    isExtracting,
    extractionResult,
    storedExtractionChecked,
    typePickerVisible,
    refresh,
    upload,
    addFromUrl,
    addFromText,
    selectType,
    dismissTypePicker,
    triggerExtraction,
    clearExtractionResult,
    deleteDocument,
  };
}
