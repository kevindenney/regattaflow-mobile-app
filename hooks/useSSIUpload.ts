import { useState, useCallback, useEffect, useRef } from 'react';
import { userDocumentService } from '@/services/UserDocumentService';
import { createLogger } from '@/lib/utils/logger';
import { isUuid } from '@/utils/uuid';
import type {
  SSIExtraction,
  SSIUploadOptions,
  ExtractionStatus,
  UserClubDocument,
} from '@/types/ssi';

const logger = createLogger('useSSIUpload');

interface UseSSIUploadOptions {
  clubId?: string;
  raceId?: string;
  /** Auto-trigger extraction after upload (default: true) */
  autoExtract?: boolean;
  /** Poll interval for extraction status in ms (default: 2000) */
  pollInterval?: number;
}

interface UseSSIUploadReturn {
  /** Upload a file */
  upload: (file: File | Blob, filename: string, options?: SSIUploadOptions) => Promise<void>;
  /** Retry extraction for a failed document */
  retryExtraction: (documentId: string) => Promise<void>;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Current document ID (after upload) */
  documentId: string | null;
  /** Current extraction status */
  extractionStatus: ExtractionStatus | null;
  /** Extracted SSI data (when completed) */
  extractedData: SSIExtraction | null;
  /** Error message */
  error: string | null;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for uploading SSI documents with AI extraction
 *
 * Handles:
 * - File upload to storage
 * - Document record creation
 * - AI extraction triggering
 * - Status polling until completion
 *
 * @example
 * ```tsx
 * const { upload, isUploading, extractionStatus, extractedData, error } = useSSIUpload({
 *   clubId: 'club-uuid',
 *   raceId: 'race-uuid',
 * });
 *
 * const handleFileSelect = async (file: File) => {
 *   await upload(file, file.name, { isShared: true });
 * };
 * ```
 */
export function useSSIUpload(options: UseSSIUploadOptions = {}): UseSSIUploadReturn {
  const {
    clubId,
    raceId,
    autoExtract = true,
    pollInterval = 2000,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus | null>(null);
  const [extractedData, setExtractedData] = useState<SSIExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Polling interval ref
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  /**
   * Start polling for extraction status
   */
  const startPolling = useCallback((docId: string) => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = async () => {
      const result = await userDocumentService.getExtractionStatus(docId);

      if (!result) {
        logger.warn('Failed to get extraction status');
        return;
      }

      setExtractionStatus(result.status);

      if (result.status === 'completed' && result.data) {
        setExtractedData(result.data);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        logger.info('Extraction completed successfully');
      } else if (result.status === 'failed') {
        setError(result.error || 'Extraction failed');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        logger.error('Extraction failed:', result.error);
      }
    };

    // Initial poll
    poll();

    // Start interval
    pollIntervalRef.current = setInterval(poll, pollInterval);
  }, [pollInterval]);

  /**
   * Upload a file
   */
  const upload = useCallback(async (
    file: File | Blob,
    filename: string,
    uploadOptions: SSIUploadOptions = {}
  ) => {
    setIsUploading(true);
    setError(null);
    setDocumentId(null);
    setExtractionStatus(null);
    setExtractedData(null);

    try {
      const mergedOptions: SSIUploadOptions = {
        clubId: uploadOptions.clubId || clubId,
        raceId: uploadOptions.raceId || raceId,
        title: uploadOptions.title,
        isShared: uploadOptions.isShared,
      };

      logger.info('Starting SSI upload:', { filename, options: mergedOptions });

      const result = autoExtract
        ? await userDocumentService.uploadAndExtract(file, filename, mergedOptions)
        : await userDocumentService.uploadSSI(file, filename, mergedOptions);

      if (!result.success) {
        setError(result.error || 'Upload failed');
        return;
      }

      setDocumentId(result.documentId!);
      setExtractionStatus('pending');

      // Start polling for extraction status
      if (autoExtract && result.documentId) {
        startPolling(result.documentId);
      }

      logger.info('Upload successful, documentId:', result.documentId);
    } catch (err) {
      logger.error('Upload error:', err);
      setError(String(err));
    } finally {
      setIsUploading(false);
    }
  }, [clubId, raceId, autoExtract, startPolling]);

  /**
   * Retry extraction for a failed document
   */
  const retryExtraction = useCallback(async (docId: string) => {
    setError(null);
    setExtractionStatus('pending');
    setExtractedData(null);

    try {
      const result = await userDocumentService.triggerExtraction(docId);

      if (!result.success) {
        setError(result.error || 'Extraction failed');
        setExtractionStatus('failed');
        return;
      }

      // Start polling
      startPolling(docId);
    } catch (err) {
      logger.error('Retry extraction error:', err);
      setError(String(err));
      setExtractionStatus('failed');
    }
  }, [startPolling]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsUploading(false);
    setDocumentId(null);
    setExtractionStatus(null);
    setExtractedData(null);
    setError(null);
  }, []);

  return {
    upload,
    retryExtraction,
    isUploading,
    documentId,
    extractionStatus,
    extractedData,
    error,
    reset,
  };
}

/**
 * Hook for fetching existing SSI data for a race
 */
export function useRaceSSI(raceId: string, clubId?: string) {
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<UserClubDocument | null>(null);
  const [extraction, setExtraction] = useState<SSIExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSSI = async () => {
      // Skip query for demo races or invalid UUIDs to prevent 400 errors
      if (!raceId || !isUuid(raceId)) {
        setLoading(false);
        return;
      }

      try {
        const result = await userDocumentService.getSSIForRace(raceId, clubId);

        if (!mounted) return;

        if (result) {
          setDocument(result.document);
          setExtraction(result.extraction);
        } else {
          setDocument(null);
          setExtraction(null);
        }
      } catch (err) {
        if (!mounted) return;
        logger.error('Error fetching race SSI:', err);
        setError(String(err));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSSI();

    return () => {
      mounted = false;
    };
  }, [raceId, clubId]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await userDocumentService.getSSIForRace(raceId, clubId);

      if (result) {
        setDocument(result.document);
        setExtraction(result.extraction);
      } else {
        setDocument(null);
        setExtraction(null);
      }
    } catch (err) {
      logger.error('Error refetching race SSI:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [raceId, clubId]);

  return {
    loading,
    document,
    extraction,
    error,
    refetch,
    hasSSI: !!extraction,
  };
}

/**
 * Hook for fetching user's uploaded documents
 */
export function useUserDocuments() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<UserClubDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchDocuments = async () => {
      try {
        const docs = await userDocumentService.getUserDocuments();

        if (!mounted) return;
        setDocuments(docs);
      } catch (err) {
        if (!mounted) return;
        logger.error('Error fetching user documents:', err);
        setError(String(err));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDocuments();

    return () => {
      mounted = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const docs = await userDocumentService.getUserDocuments();
      setDocuments(docs);
    } catch (err) {
      logger.error('Error refetching user documents:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    documents,
    error,
    refetch,
  };
}
