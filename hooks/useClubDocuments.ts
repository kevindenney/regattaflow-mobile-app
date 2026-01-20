/**
 * Club Documents Hook
 *
 * Manages club-level documents (SSI, policies, attachments).
 * Provides document list and basic operations for display.
 */

import { useState, useEffect, useCallback } from 'react';
import { clubDocumentService } from '@/services/ClubDocumentService';
import type {
  ClubDocumentWithDetails,
  ClubDocumentCategory,
  SSISubtype,
} from '@/types/documents';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useClubDocuments');

export interface UseClubDocumentsOptions {
  /** Club ID to load documents for */
  clubId?: string | null;
  /** Whether to include inactive documents (admin only) */
  includeInactive?: boolean;
  /** Key to trigger reload */
  reloadKey?: number;
}

export interface UseClubDocumentsReturn {
  /** All club documents */
  documents: ClubDocumentWithDetails[];
  /** SSI documents only (main SSI, not attachments/appendices) */
  ssiDocuments: ClubDocumentWithDetails[];
  /** SSI attachments */
  attachments: ClubDocumentWithDetails[];
  /** SSI appendices */
  appendices: ClubDocumentWithDetails[];
  /** Other documents (policies, reference, etc.) */
  otherDocuments: ClubDocumentWithDetails[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh documents */
  refresh: () => void;
  /** Add document from URL */
  addFromUrl: (params: {
    externalUrl: string;
    title: string;
    documentCategory: ClubDocumentCategory;
    documentSubtype?: SSISubtype;
    description?: string;
    version?: string;
  }) => Promise<boolean>;
  /** Remove a document (deactivate) */
  remove: (documentId: string) => Promise<boolean>;
}

/**
 * Hook for managing club documents
 */
export function useClubDocuments(options: UseClubDocumentsOptions): UseClubDocumentsReturn {
  const { clubId, includeInactive = false, reloadKey = 0 } = options;

  // State
  const [documents, setDocuments] = useState<ClubDocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalReloadKey, setInternalReloadKey] = useState(0);

  // Load documents
  useEffect(() => {
    let isActive = true;

    if (!clubId) {
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
        const docs = await clubDocumentService.getClubDocuments(clubId);
        if (!isActive) return;

        // Filter inactive if not requested
        const filtered = includeInactive
          ? docs
          : docs.filter((d) => d.isActive);

        setDocuments(filtered);
      } catch (err) {
        if (!isActive) return;
        logger.warn('Unable to load club documents', { error: err, clubId });
        setDocuments([]);
        setError('Unable to load club documents');
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
  }, [clubId, includeInactive, reloadKey, internalReloadKey]);

  // Categorize documents
  const ssiDocuments = documents.filter((d) => d.documentCategory === 'ssi');
  const attachments = documents.filter((d) => d.documentCategory === 'attachment');
  const appendices = documents.filter((d) => d.documentCategory === 'appendix');
  const otherDocuments = documents.filter(
    (d) => !['ssi', 'attachment', 'appendix'].includes(d.documentCategory)
  );

  // Refresh documents
  const refresh = useCallback(() => {
    setInternalReloadKey((prev) => prev + 1);
  }, []);

  // Add document from URL
  const addFromUrl = useCallback(
    async (params: {
      externalUrl: string;
      title: string;
      documentCategory: ClubDocumentCategory;
      documentSubtype?: SSISubtype;
      description?: string;
      version?: string;
    }): Promise<boolean> => {
      if (!clubId) {
        logger.warn('Cannot add document: no club ID');
        return false;
      }

      try {
        const result = await clubDocumentService.addClubDocumentFromUrl({
          clubId,
          ...params,
        });

        if (result) {
          refresh();
          return true;
        }
        return false;
      } catch (err) {
        logger.error('Error adding club document from URL', { error: err });
        return false;
      }
    },
    [clubId, refresh]
  );

  // Remove (deactivate) document
  const remove = useCallback(
    async (documentId: string): Promise<boolean> => {
      try {
        const success = await clubDocumentService.deactivateClubDocument(documentId);
        if (success) {
          refresh();
        }
        return success;
      } catch (err) {
        logger.error('Error removing club document', { error: err });
        return false;
      }
    },
    [refresh]
  );

  return {
    documents,
    ssiDocuments,
    attachments,
    appendices,
    otherDocuments,
    loading,
    error,
    refresh,
    addFromUrl,
    remove,
  };
}
