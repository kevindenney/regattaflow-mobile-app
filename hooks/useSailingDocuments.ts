/**
 * Sailing Documents Hook
 * Manages upload, processing, and querying of valuable sailing documents
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { sailingDocumentLibrary } from '@/services/storage/SailingDocumentLibraryService';
import type { SailingDocument } from '@/services/storage/SailingDocumentLibraryService';
import { createLogger } from '@/lib/utils/logger';

export interface DocumentUploadProgress {
  phase: 'uploading' | 'processing' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

const logger = createLogger('useSailingDocuments');

export const useSailingDocuments = (userId?: string) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<DocumentUploadProgress | null>(null);
  const [documents, setDocuments] = useState<SailingDocument[]>([]);
  const [recommendations, setRecommendations] = useState<SailingDocument[]>([]);
  const [libraryStats, setLibraryStats] = useState<any>(null);
  const isMountedRef = useRef(true);
  const activeUserIdRef = useRef(userId);
  const uploadRunIdRef = useRef(0);
  const searchRunIdRef = useRef(0);
  const recommendationRunIdRef = useRef(0);
  const documentsRunIdRef = useRef(0);
  const statsRunIdRef = useRef(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearProgressTimers = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    for (const timeoutId of progressTimeoutsRef.current) {
      clearTimeout(timeoutId);
    }
    progressTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    activeUserIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      uploadRunIdRef.current += 1;
      searchRunIdRef.current += 1;
      recommendationRunIdRef.current += 1;
      documentsRunIdRef.current += 1;
      statsRunIdRef.current += 1;
      clearProgressTimers();
    };
  }, [clearProgressTimers]);

  /**
   * Upload a sailing document (like your tides/current strategy book!)
   */
  const uploadDocument = useCallback(async (
    file: File,
    metadata: {
      title: string;
      type: SailingDocument['type'];
      category: SailingDocument['category'];
      author?: string;
      venue?: string;
      description?: string;
    }
  ) => {
    if (!userId) {
      throw new Error('User authentication required');
    }

    const requestUserId = userId;
    const runId = ++uploadRunIdRef.current;
    const canCommit = () =>
      isMountedRef.current &&
      runId === uploadRunIdRef.current &&
      activeUserIdRef.current === requestUserId;

    if (canCommit()) setUploading(true);
    if (canCommit()) setError(null);
    if (canCommit()) setUploadProgress({
      phase: 'uploading',
      progress: 0,
      message: `Uploading "${metadata.title}"...`
    });

    try {
      clearProgressTimers();
      // Simulate upload progress
      progressIntervalRef.current = setInterval(() => {
        if (!canCommit()) return;
        setUploadProgress(prev => {
          if (!prev) return null;
          const newProgress = Math.min(prev.progress + 10, 90);
          return {
            ...prev,
            progress: newProgress,
            message: `Uploading "${metadata.title}"... ${newProgress}%`
          };
        });
      }, 200);

      // Step 1: Upload phase

      // Step 2: Processing phase
      const processingTimeout = setTimeout(() => {
        if (!canCommit()) return;
        setUploadProgress({
          phase: 'processing',
          progress: 95,
          message: 'Processing document with AI...'
        });
      }, 2000);
      progressTimeoutsRef.current.push(processingTimeout);

      // Step 3: AI Analysis phase
      const analysisTimeout = setTimeout(() => {
        if (!canCommit()) return;
        setUploadProgress({
          phase: 'analyzing',
          progress: 98,
          message: 'Extracting sailing intelligence...'
        });
      }, 4000);
      progressTimeoutsRef.current.push(analysisTimeout);

      // Actual upload and processing
      const document = await sailingDocumentLibrary.uploadSailingDocument(
        file,
        metadata,
        userId
      );

      clearProgressTimers();
      if (canCommit()) setUploadProgress({
        phase: 'complete',
        progress: 100,
        message: `"${metadata.title}" successfully processed!`
      });

      // Update documents list
      const refreshedDocs = await sailingDocumentLibrary.searchDocumentLibrary(
        '',
        {},
        userId
      );
      if (canCommit()) setDocuments(refreshedDocs);

      // Show success for a moment, then clear
      const clearTimeoutId = setTimeout(() => {
        if (!canCommit()) return;
        setUploadProgress(null);
      }, 2000);
      progressTimeoutsRef.current.push(clearTimeoutId);

      return document;

    } catch (err: any) {
      if (canCommit()) setError(err.message);
      if (canCommit()) setUploadProgress(null);

      throw err;
    } finally {
      clearProgressTimers();
      if (canCommit()) setUploading(false);
    }
  }, [userId, clearProgressTimers]);

  /**
   * Search the document library
   */
  const searchDocuments = useCallback(async (
    query: string,
    filters?: {
      category?: SailingDocument['category'];
      venue?: string;
      type?: SailingDocument['type'];
    }
  ) => {
    const requestUserId = userId;
    const runId = ++searchRunIdRef.current;
    const canCommit = () =>
      isMountedRef.current &&
      runId === searchRunIdRef.current &&
      activeUserIdRef.current === requestUserId;

    if (canCommit()) setProcessing(true);
    try {
      const results = await sailingDocumentLibrary.searchDocumentLibrary(
        query,
        filters,
        userId
      );
      if (canCommit()) setDocuments(results);
      return results;
    } catch (err: any) {
      if (canCommit()) setError(err.message);
      return [];
    } finally {
      if (canCommit()) setProcessing(false);
    }
  }, [userId]);

  /**
   * Get document recommendations based on context
   */
  const getRecommendations = useCallback(async (context?: {
    venue?: string;
    conditions?: string;
    skill?: 'novice' | 'intermediate' | 'expert';
  }) => {
    if (!userId) {
      setRecommendations([]);
      return;
    }

    const requestUserId = userId;
    const runId = ++recommendationRunIdRef.current;
    const canCommit = () =>
      isMountedRef.current &&
      runId === recommendationRunIdRef.current &&
      activeUserIdRef.current === requestUserId;

    if (canCommit()) setProcessing(true);
    try {
      const recs = await sailingDocumentLibrary.getRecommendedDocuments(
        userId,
        context
      );
      if (canCommit()) setRecommendations(recs);
    } catch (err: any) {
      if (canCommit()) setError(err.message);
    } finally {
      if (canCommit()) setProcessing(false);
    }
  }, [userId]);

  /**
   * Load user's documents
   */
  const loadDocuments = useCallback(async () => {
    if (!userId) {
      setDocuments([]);
      return;
    }

    const requestUserId = userId;
    const runId = ++documentsRunIdRef.current;
    const canCommit = () =>
      isMountedRef.current &&
      runId === documentsRunIdRef.current &&
      activeUserIdRef.current === requestUserId;

    try {
      const userDocs = await sailingDocumentLibrary.searchDocumentLibrary(
        '',
        {},
        userId
      );
      if (canCommit()) setDocuments(userDocs);
    } catch (err: any) {
      if (canCommit()) setError(err.message);
    }
  }, [userId]);

  /**
   * Load library statistics
   */
  const loadLibraryStats = useCallback(async () => {
    if (!userId) {
      setLibraryStats(null);
      return;
    }

    const requestUserId = userId;
    const runId = ++statsRunIdRef.current;
    const canCommit = () =>
      isMountedRef.current &&
      runId === statsRunIdRef.current &&
      activeUserIdRef.current === requestUserId;

    try {
      const stats = await sailingDocumentLibrary.getLibraryStats(userId);
      if (canCommit()) setLibraryStats(stats);
    } catch (err: any) {
      logger.error('Failed to load library stats', err);
    }
  }, [userId]);

  /**
   * Get documents by category (useful for your tides/current book!)
   */
  const getDocumentsByCategory = useCallback(async (category: SailingDocument['category']) => {
    return searchDocuments('', { category });
  }, [searchDocuments]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data when userId changes
  useEffect(() => {
    if (userId) {
      void loadDocuments();
      void loadLibraryStats();
      void getRecommendations();
      return;
    }
    setDocuments([]);
    setRecommendations([]);
    setLibraryStats(null);
    setUploadProgress(null);
    setUploading(false);
    setProcessing(false);
    setError(null);
    clearProgressTimers();
  }, [userId, loadDocuments, loadLibraryStats, getRecommendations, clearProgressTimers]);

  return {
    // State
    uploading,
    processing,
    error,
    uploadProgress,
    documents,
    recommendations,
    libraryStats,

    // Actions
    uploadDocument,
    searchDocuments,
    getRecommendations,
    getDocumentsByCategory,
    loadDocuments,
    loadLibraryStats,
    clearError,
  };
};

/**
 * Hook specifically for tides and current documents (like yours!)
 */
export const useTidesCurrentDocuments = (userId?: string) => {
  const baseHook = useSailingDocuments(userId);

  const uploadTidesCurrentBook = useCallback(async (
    file: File,
    metadata: {
      title: string;
      author?: string;
      description?: string;
    }
  ) => {
    return baseHook.uploadDocument(file, {
      ...metadata,
      type: 'book',
      category: 'tides_currents'
    });
  }, [baseHook]);

  const getTidesCurrentDocuments = useCallback(async () => {
    return baseHook.getDocumentsByCategory('tides_currents');
  }, [baseHook]);

  const getTacticalRecommendations = useCallback(async (venue?: string) => {
    return baseHook.getRecommendations({
      venue,
      conditions: 'tidal current'
    });
  }, [baseHook]);

  return {
    ...baseHook,
    uploadTidesCurrentBook,
    getTidesCurrentDocuments,
    getTacticalRecommendations,
  };
};

/**
 * Example usage for your specific document:
 */
export const uploadTidesCurrentStrategyBook = async (
  userId: string,
  file: File
) => {
  const documentLibrary = new (await import('@/services/storage/SailingDocumentLibraryService')).SailingDocumentLibraryService();

  return await documentLibrary.uploadSailingDocument(
    file,
    {
      title: 'Tides and Current Strategy Guide',
      type: 'book',
      category: 'tides_currents',
      author: 'Unknown', // Fill in if you know
      description: 'Comprehensive guide on dealing with tides and currents for sailing strategy'
    },
    userId
  );
};

export default useSailingDocuments;
