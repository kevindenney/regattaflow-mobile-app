/**
 * Sailing Documents Hook
 * Manages upload, processing, and querying of valuable sailing documents
 */

import { useState, useCallback, useEffect } from 'react';
import { sailingDocumentLibrary } from '@/services/storage/SailingDocumentLibraryService';
import type { SailingDocument } from '@/services/storage/SailingDocumentLibraryService';

export interface DocumentUploadProgress {
  phase: 'uploading' | 'processing' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

export const useSailingDocuments = (userId?: string) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<DocumentUploadProgress | null>(null);
  const [documents, setDocuments] = useState<SailingDocument[]>([]);
  const [recommendations, setRecommendations] = useState<SailingDocument[]>([]);
  const [libraryStats, setLibraryStats] = useState<any>(null);

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

    setUploading(true);
    setError(null);
    setUploadProgress({
      phase: 'uploading',
      progress: 0,
      message: `Uploading "${metadata.title}"...`
    });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
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
      console.log(`📚 Starting upload: ${metadata.title} (${file.size} bytes)`);

      // Step 2: Processing phase
      setTimeout(() => {
        setUploadProgress({
          phase: 'processing',
          progress: 95,
          message: 'Processing document with AI...'
        });
      }, 2000);

      // Step 3: AI Analysis phase
      setTimeout(() => {
        setUploadProgress({
          phase: 'analyzing',
          progress: 98,
          message: 'Extracting sailing intelligence...'
        });
      }, 4000);

      // Actual upload and processing
      const document = await sailingDocumentLibrary.uploadSailingDocument(
        file,
        metadata,
        userId
      );

      clearInterval(progressInterval);
      setUploadProgress({
        phase: 'complete',
        progress: 100,
        message: `"${metadata.title}" successfully processed!`
      });

      console.log(`✅ Document uploaded successfully: ${document.id}`);

      // Update documents list
      await loadDocuments();

      // Show success for a moment, then clear
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);

      return document;

    } catch (err: any) {
      setError(err.message);
      setUploadProgress(null);
      console.error('❌ Document upload failed:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [userId]);

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
    setProcessing(true);
    try {
      const results = await sailingDocumentLibrary.searchDocumentLibrary(
        query,
        filters,
        userId
      );
      setDocuments(results);
      console.log(`🔍 Found ${results.length} documents for: "${query}"`);
      return results;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setProcessing(false);
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
    if (!userId) return;

    setProcessing(true);
    try {
      const recs = await sailingDocumentLibrary.getRecommendedDocuments(
        userId,
        context
      );
      setRecommendations(recs);
      console.log(`💡 Generated ${recs.length} recommendations for user`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [userId]);

  /**
   * Load user's documents
   */
  const loadDocuments = useCallback(async () => {
    if (!userId) return;

    try {
      const userDocs = await sailingDocumentLibrary.searchDocumentLibrary(
        '',
        {},
        userId
      );
      setDocuments(userDocs);
    } catch (err: any) {
      setError(err.message);
    }
  }, [userId]);

  /**
   * Load library statistics
   */
  const loadLibraryStats = useCallback(async () => {
    if (!userId) return;

    try {
      const stats = await sailingDocumentLibrary.getLibraryStats(userId);
      setLibraryStats(stats);
    } catch (err: any) {
      console.error('Failed to load library stats:', err);
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
      loadDocuments();
      loadLibraryStats();
      getRecommendations();
    }
  }, [userId, loadDocuments, loadLibraryStats, getRecommendations]);

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